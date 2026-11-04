import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { evaluateQuestion, getActiveCharacterById, getActiveCharacters, getActiveQuestionById } from "@/lib/game/content";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { appendRoomAction,getRoomSnapshot,makeRoomCode,publishRoomEvent } from "@/lib/rooms";
import { getAblyRestClient } from "@/lib/ably";
type Ctx={params:Promise<{segments?:string[]}>};
const readySchema=z.object({isReady:z.boolean(),secretCharacterId:z.string().optional()});
async function actor(){return (await auth())?.user?.id??null;}
async function cleanupExpiredWaitingRooms(){
 await prisma.room.deleteMany({where:{status:"WAITING",expiresAt:{lte:new Date()}}});
}
async function runRoomTransaction<T>(work:(tx:Prisma.TransactionClient)=>Promise<T>):Promise<T>{
 let lastError:unknown;
 for(let attempt=0;attempt<6;attempt++){
  try{return await prisma.$transaction(work,{isolationLevel:Prisma.TransactionIsolationLevel.ReadCommitted});}
  catch(error){
   lastError=error;
   const retryable=(error instanceof Prisma.PrismaClientKnownRequestError&&error.code==="P2034")||(error instanceof Error&&error.message==="STATE_CONFLICT");
   if(!retryable||attempt===5)throw error;
   await new Promise(resolve=>setTimeout(resolve,35*(attempt+1)));
  }
 }
 throw lastError;
}
async function throwRoomActionConflict(tx:Prisma.TransactionClient,roomId:string,userId:string):Promise<never>{
 const latest=await tx.room.findUnique({where:{id:roomId},select:{status:true,currentTurnUserId:true,turnExpiresAt:true}});
 if(!latest||latest.status!=="IN_PROGRESS")throw new Error("GAME_NOT_ACTIVE");
 if(latest.currentTurnUserId!==userId)throw new Error("NOT_YOUR_TURN");
 if(!latest.turnExpiresAt||latest.turnExpiresAt<=new Date())throw new Error("TURN_TIME_EXPIRED");
 throw new Error("STATE_CONFLICT");
}
async function expireTurnIfNeeded(roomId:string):Promise<boolean>{
 const now=new Date();
 const result=await runRoomTransaction(async tx=>{
  const room=await tx.room.findUnique({where:{id:roomId},include:{members:{where:{leftAt:null},orderBy:{seat:"asc"}}}});
  if(!room||room.status!=="IN_PROGRESS"||!room.currentTurnUserId)return {timedOut:false,initialized:false};
  if(!room.turnExpiresAt){
   await tx.room.updateMany({where:{id:roomId,version:room.version,status:"IN_PROGRESS",currentTurnUserId:room.currentTurnUserId,turnExpiresAt:null},data:{turnExpiresAt:new Date(now.getTime()+60000),version:{increment:1}}});
   return {timedOut:false,initialized:true};
  }
  if(room.turnExpiresAt>now)return {timedOut:false,initialized:false};
  const next=room.members.find(member=>member.userId!==room.currentTurnUserId);
  if(!next)return {timedOut:false,initialized:false};
  const duration=60000;
  const changed=await tx.room.updateMany({where:{id:roomId,version:room.version,status:"IN_PROGRESS",currentTurnUserId:room.currentTurnUserId,turnExpiresAt:{lte:now}},data:{currentTurnUserId:next.userId,turnNumber:{increment:1},turnExpiresAt:new Date(now.getTime()+duration),version:{increment:1}}});
  if(changed.count!==1)return {timedOut:false,initialized:false};
  await appendRoomAction(tx,{roomId,actorId:room.currentTurnUserId,type:"TURN_CONFIRMED",payload:{reason:"TIMEOUT",timedOutUserId:room.currentTurnUserId,nextTurnUserId:next.userId}});
  return {timedOut:true,version:room.version+1,nextTurnUserId:next.userId};
 });
 if(result.timedOut)await publishRoomEvent(roomId,"game.updated",{roomId,version:result.version,currentTurnUserId:result.nextTurnUserId,reason:"TIMEOUT"});
 return result.timedOut;
}
export async function GET(request:Request,{params}:Ctx){
 const userId=await actor();if(!userId)return NextResponse.json({error:"UNAUTHORIZED"},{status:401});
 await cleanupExpiredWaitingRooms();
 const {segments=[]}=await params;
 if(segments[0]==="active"){
  const active=await prisma.room.findFirst({where:{status:"IN_PROGRESS",members:{some:{userId,leftAt:null}}},orderBy:{updatedAt:"desc"},select:{id:true}});
  return NextResponse.json({roomId:active?.id??null},{headers:{"Cache-Control":"no-store"}});
 }
 if(segments[0]==="realtime-token"){
  const roomId=new URL(request.url).searchParams.get("roomId");if(!roomId)return NextResponse.json({error:"ROOM_REQUIRED"},{status:400});
  const member=await prisma.roomMember.findFirst({where:{roomId,userId,leftAt:null}});if(!member)return NextResponse.json({error:"FORBIDDEN"},{status:403});
  try{const token=await getAblyRestClient().auth.createTokenRequest({clientId:userId,ttl:900000,capability:JSON.stringify({[`room:${roomId}`]:["subscribe"]})});return NextResponse.json(token,{headers:{"Cache-Control":"no-store"}});}catch{return NextResponse.json({error:"REALTIME_NOT_CONFIGURED"},{status:503});}
 }
 const roomId=segments[0];if(!roomId||segments.length!==1)return NextResponse.json({error:"NOT_FOUND"},{status:404});
 await expireTurnIfNeeded(roomId);
 await prisma.roomMember.updateMany({where:{roomId,leftAt:null,isConnected:true,lastSeenAt:{lt:new Date(Date.now()-15000)}},data:{isConnected:false}});
 await prisma.roomMember.updateMany({where:{roomId,userId,leftAt:null},data:{isConnected:true,lastSeenAt:new Date()}});
 const snapshot=await getRoomSnapshot(roomId,userId);if(!snapshot)return NextResponse.json({error:"ROOM_NOT_FOUND"},{status:404});
 const [room,latestStart,me]=await Promise.all([
  prisma.room.findUnique({where:{id:roomId},select:{currentTurnUserId:true,turnNumber:true,winnerId:true,hostId:true,startedAt:true,turnExpiresAt:true}}),
  prisma.gameAction.findFirst({where:{roomId,type:"GAME_STARTED"},orderBy:{sequence:"desc"},select:{sequence:true}}),
  prisma.roomMember.findUnique({where:{roomId_userId:{roomId,userId}},select:{eliminatedCharacterIds:true}})
 ]);
 const [actions,finishedActions]=await Promise.all([
  prisma.gameAction.findMany({where:{roomId,sequence:{gt:latestStart?.sequence??0},type:{in:["QUESTION_ASKED","TURN_CONFIRMED","GUESS_MADE","GAME_FINISHED","PLAYER_LEFT"]}},orderBy:{sequence:"desc"},take:40}),
  prisma.gameAction.findMany({where:{roomId,type:"GAME_FINISHED"},orderBy:{sequence:"asc"},select:{id:true,actorId:true,payload:true,createdAt:true}})
 ]);
 let roundNumber=0;
 const roundHistory=finishedActions.flatMap(action=>{
  const p=action.payload&&typeof action.payload==="object"&&!Array.isArray(action.payload)?action.payload as Record<string,unknown>:{};
  const reason=typeof p.reason==="string"?p.reason:null;
  if(reason?.startsWith("REMATCH_"))return [];
  roundNumber+=1;
  return [{id:action.id,round:roundNumber,actorId:action.actorId,winnerId:typeof p.winnerId==="string"?p.winnerId:null,reason,createdAt:action.createdAt.toISOString()}];
 });
 const safeActions=actions.reverse().map(a=>{
  const p=a.payload&&typeof a.payload==="object"&&!Array.isArray(a.payload)?a.payload as Record<string,unknown>:{};
  return {id:a.id,actorId:a.actorId,type:a.type,questionId:typeof p.questionId==="string"?p.questionId:null,answer:typeof p.answer==="boolean"?p.answer:null,characterId:typeof p.characterId==="string"?p.characterId:null,correct:typeof p.correct==="boolean"?p.correct:null,reason:typeof p.reason==="string"?p.reason:null,winnerId:typeof p.winnerId==="string"?p.winnerId:null,newRoomId:typeof p.newRoomId==="string"?p.newRoomId:null,createdAt:a.createdAt.toISOString()};
 });
 return NextResponse.json({...snapshot,hostId:room?.hostId??snapshot.hostId,startedAt:room?.startedAt?.toISOString()??null,turnExpiresAt:room?.turnExpiresAt?.toISOString()??null,currentTurnUserId:room?.currentTurnUserId??null,turnNumber:room?.turnNumber??0,winnerId:room?.winnerId??null,myEliminatedCharacterIds:me?.eliminatedCharacterIds??[],actions:safeActions,roundHistory},{headers:{"Cache-Control":"no-store"}});
}
export async function POST(request:Request,{params}:Ctx){
 const userId=await actor();if(!userId)return NextResponse.json({error:"UNAUTHORIZED"},{status:401});
 await cleanupExpiredWaitingRooms();
 const {segments=[]}=await params;const body=await request.json().catch(()=>({}));
 if(segments.length===0){
  for(let i=0;i<5;i++){const code=makeRoomCode();try{const room=await runRoomTransaction(async tx=>{const created=await tx.room.create({data:{code,hostId:userId,expiresAt:new Date(Date.now()+1800000),members:{create:{userId,seat:1}}}});await appendRoomAction(tx,{roomId:created.id,actorId:userId,type:"ROOM_CREATED",payload:{code}});return created;});await publishRoomEvent(room.id,"room.updated",{roomId:room.id,version:room.version,status:room.status});return NextResponse.json({roomId:room.id,code:room.code},{status:201});}catch(e){if(i===4||!(e instanceof Error)||!e.message.toLowerCase().includes("unique"))return NextResponse.json({error:"ROOM_CREATE_FAILED"},{status:500});}}
  return NextResponse.json({error:"ROOM_CODE_UNAVAILABLE"},{status:503});
 }
 if(segments[0]==="join"){
  const parsed=z.object({code:z.string().trim().regex(/^\d{6}$/)}).safeParse(body);if(!parsed.success)return NextResponse.json({error:"INVALID_ROOM_CODE"},{status:400});
  try{const room=await runRoomTransaction(async tx=>{const current=await tx.room.findUnique({where:{code:parsed.data.code}});if(!current||current.status!=="WAITING"||(current.expiresAt&&current.expiresAt<new Date()))throw new Error("ROOM_NOT_AVAILABLE");const existing=await tx.roomMember.findUnique({where:{roomId_userId:{roomId:current.id,userId}}});if(existing&&!existing.leftAt)return current;const count=await tx.roomMember.count({where:{roomId:current.id,leftAt:null}});if(count>=current.maxPlayers)throw new Error("ROOM_FULL");const seat=count===0?1:2;if(existing)await tx.roomMember.update({where:{id:existing.id},data:{seat,isConnected:true,isReady:false,secretCharacterId:null,leftAt:null,lastSeenAt:new Date()}});else await tx.roomMember.create({data:{roomId:current.id,userId,seat}});const updated=await tx.room.update({where:{id:current.id},data:{version:{increment:1}}});await appendRoomAction(tx,{roomId:current.id,actorId:userId,type:"ROOM_JOINED",payload:{seat}});return updated;});await publishRoomEvent(room.id,"room.updated",{roomId:room.id,version:room.version,status:room.status});return NextResponse.json({roomId:room.id,code:room.code});}catch(e){const m=e instanceof Error?e.message:"";const s=m==="ROOM_FULL"?409:m==="ROOM_NOT_AVAILABLE"?404:500;return NextResponse.json({error:s===500?"ROOM_JOIN_FAILED":m},{status:s});}
 }
 const roomId=segments[0],action=segments[1];if(!roomId||segments.length!==2)return NextResponse.json({error:"NOT_FOUND"},{status:404});
 try{
  if(action==="timeout"){
   const member=await prisma.roomMember.findFirst({where:{roomId,userId,leftAt:null},select:{id:true}});
   if(!member)throw new Error("NOT_MEMBER");
   const expired=await expireTurnIfNeeded(roomId);
   return NextResponse.json({ok:true,expired});
  }
  if(["ask","eliminate","confirm","guess","wild-guess"].includes(action)){
   if(await expireTurnIfNeeded(roomId))throw new Error("TURN_TIME_EXPIRED");
  }
  if(action==="ready"){
   const parsed=readySchema.safeParse(body);if(!parsed.success||(parsed.data.isReady&&!(await getActiveCharacterById(parsed.data.secretCharacterId??""))))return NextResponse.json({error:"INVALID_READY_STATE"},{status:400});
   const room=await runRoomTransaction(async tx=>{const member=await tx.roomMember.findUnique({where:{roomId_userId:{roomId,userId}},include:{room:true}});if(!member||member.leftAt||member.room.status!=="WAITING")throw new Error("ROOM_NOT_AVAILABLE");const changed=await tx.room.updateMany({where:{id:roomId,version:member.room.version,status:"WAITING"},data:{version:{increment:1}}});if(changed.count!==1)throw new Error("STATE_CONFLICT");await tx.roomMember.update({where:{id:member.id},data:{isReady:parsed.data.isReady,secretCharacterId:parsed.data.isReady?parsed.data.secretCharacterId:null,lastSeenAt:new Date()}});await appendRoomAction(tx,{roomId,actorId:userId,type:"PLAYER_READY",payload:{isReady:parsed.data.isReady}});return {version:member.room.version+1,status:"WAITING"};});await publishRoomEvent(roomId,"room.updated",{roomId,version:room.version,status:room.status});return NextResponse.json({ok:true});
  }
  if(action==="start"){
   const room=await runRoomTransaction(async tx=>{const current=await tx.room.findUnique({where:{id:roomId},include:{members:{where:{leftAt:null},orderBy:{seat:"asc"}}}});if(!current)throw new Error("NOT_FOUND");if(current.hostId!==userId)throw new Error("FORBIDDEN");if(current.status!=="WAITING"||current.members.length!==2||current.members.some(m=>!m.isReady||!m.secretCharacterId))throw new Error("NOT_READY");const startedAt=new Date();const changed=await tx.room.updateMany({where:{id:roomId,version:current.version,status:"WAITING",hostId:userId},data:{status:"IN_PROGRESS",startedAt,currentTurnUserId:current.members[0].userId,turnNumber:1,turnExpiresAt:new Date(Date.now()+65000),version:{increment:1},expiresAt:null}});if(changed.count!==1)throw new Error("STATE_CONFLICT");await appendRoomAction(tx,{roomId,actorId:userId,type:"GAME_STARTED",payload:{startedAt:startedAt.toISOString()}});return {version:current.version+1,status:"IN_PROGRESS",currentTurnUserId:current.members[0].userId};});await publishRoomEvent(roomId,"game.started",{roomId,version:room.version,status:room.status,currentTurnUserId:room.currentTurnUserId});return NextResponse.json({ok:true,status:room.status});
  }
  if(action==="ask"){
   const parsed=z.object({questionId:z.string().min(1).max(40)}).safeParse(body);
   const question=parsed.success?await getActiveQuestionById(parsed.data.questionId):null;
   if(!parsed.success||!question)return NextResponse.json({error:"INVALID_QUESTION"},{status:400});
   const result=await runRoomTransaction(async tx=>{
    const current=await tx.room.findUnique({where:{id:roomId},include:{members:{where:{leftAt:null},orderBy:{seat:"asc"}}}});
    if(!current||current.status!=="IN_PROGRESS")throw new Error("GAME_NOT_ACTIVE");
    if(current.currentTurnUserId!==userId)throw new Error("NOT_YOUR_TURN");
    const roundStart=await tx.gameAction.findFirst({where:{roomId,type:"GAME_STARTED"},orderBy:{sequence:"desc"},select:{sequence:true}});
    const roundSequence=roundStart?.sequence??0;
    const lastQuestion=await tx.gameAction.findFirst({where:{roomId,actorId:userId,type:"QUESTION_ASKED",sequence:{gt:roundSequence}},orderBy:{sequence:"desc"}});
    const lastConfirmed=await tx.gameAction.findFirst({where:{roomId,actorId:userId,type:"TURN_CONFIRMED",sequence:{gt:roundSequence}},orderBy:{sequence:"desc"}});
    if(lastQuestion&&(!lastConfirmed||lastQuestion.sequence>lastConfirmed.sequence))throw new Error("QUESTION_ALREADY_PENDING");
    const me=current.members.find(m=>m.userId===userId),opponent=current.members.find(m=>m.userId!==userId);
    if(!me||!opponent?.secretCharacterId)throw new Error("OPPONENT_REQUIRED");
    const previous=await tx.gameAction.findMany({where:{roomId,actorId:userId,type:"QUESTION_ASKED",sequence:{gt:roundSequence}},select:{payload:true}});
    if(previous.some(a=>typeof a.payload==="object"&&a.payload!==null&&!Array.isArray(a.payload)&&a.payload.questionId===parsed.data.questionId))throw new Error("QUESTION_ALREADY_ASKED");
    const secret=(await getActiveCharacters()).find(character=>character.id===opponent.secretCharacterId);if(!secret)throw new Error("OPPONENT_REQUIRED");
    const answer=evaluateQuestion(secret,question);
    const changed=await tx.room.updateMany({where:{id:roomId,version:current.version,currentTurnUserId:userId,status:"IN_PROGRESS",turnExpiresAt:{gt:new Date()}},data:{version:{increment:1}}});
    if(changed.count!==1)await throwRoomActionConflict(tx,roomId,userId);
    await appendRoomAction(tx,{roomId,actorId:userId,type:"QUESTION_ASKED",payload:{questionId:parsed.data.questionId,answer}});
    return {answer,version:current.version+1};
   });
   await publishRoomEvent(roomId,"game.updated",{roomId,version:result.version});
   return NextResponse.json({ok:true,...result});
  }
  if(action==="eliminate"){
   const parsed=z.object({characterId:z.string().min(1).max(40),eliminated:z.boolean()}).safeParse(body);
   if(!parsed.success||!(await getActiveCharacterById(parsed.data.characterId)))return NextResponse.json({error:"INVALID_CHARACTER"},{status:400});
   const result=await runRoomTransaction(async tx=>{
    const current=await tx.room.findUnique({where:{id:roomId},select:{status:true,version:true,currentTurnUserId:true}});
    if(!current||current.status!=="IN_PROGRESS")throw new Error("GAME_NOT_ACTIVE");
    if(current.currentTurnUserId!==userId)throw new Error("NOT_YOUR_TURN");
    const me=await tx.roomMember.findUnique({where:{roomId_userId:{roomId,userId}},select:{id:true,eliminatedCharacterIds:true,leftAt:true}});
    if(!me||me.leftAt)throw new Error("NOT_MEMBER");
    const roundStart=await tx.gameAction.findFirst({where:{roomId,type:"GAME_STARTED"},orderBy:{sequence:"desc"},select:{sequence:true}});
    const roundSequence=roundStart?.sequence??0;
    const lastQuestion=await tx.gameAction.findFirst({where:{roomId,actorId:userId,type:"QUESTION_ASKED",sequence:{gt:roundSequence}},orderBy:{sequence:"desc"}});
    const lastConfirmed=await tx.gameAction.findFirst({where:{roomId,actorId:userId,type:"TURN_CONFIRMED",sequence:{gt:roundSequence}},orderBy:{sequence:"desc"}});
    if(!lastQuestion||(lastConfirmed&&lastConfirmed.sequence>lastQuestion.sequence))throw new Error("ASK_BEFORE_FLIP");
    const ids=new Set(me.eliminatedCharacterIds);
    if(parsed.data.eliminated){ids.add(parsed.data.characterId);const active=await getActiveCharacters();if(active.length-ids.size<1)throw new Error("LAST_CHARACTER_REQUIRED");}else ids.delete(parsed.data.characterId);
    const changed=await tx.room.updateMany({where:{id:roomId,version:current.version,status:"IN_PROGRESS",currentTurnUserId:userId,turnExpiresAt:{gt:new Date()}},data:{version:{increment:1}}});
    if(changed.count!==1)await throwRoomActionConflict(tx,roomId,userId);
    await tx.roomMember.update({where:{id:me.id},data:{eliminatedCharacterIds:[...ids]}});
    return {version:current.version+1,eliminatedCharacterIds:[...ids]};
   });
   await publishRoomEvent(roomId,"game.updated",{roomId,version:result.version});
   return NextResponse.json({ok:true,...result});
  }
  if(action==="confirm"){
   const result=await runRoomTransaction(async tx=>{
    const current=await tx.room.findUnique({where:{id:roomId},include:{members:{where:{leftAt:null},orderBy:{seat:"asc"}}}});
    if(!current||current.status!=="IN_PROGRESS")throw new Error("GAME_NOT_ACTIVE");
    if(current.currentTurnUserId!==userId)throw new Error("NOT_YOUR_TURN");
    const roundStart=await tx.gameAction.findFirst({where:{roomId,type:"GAME_STARTED"},orderBy:{sequence:"desc"},select:{sequence:true}});
    const roundSequence=roundStart?.sequence??0;
    const lastQuestion=await tx.gameAction.findFirst({where:{roomId,actorId:userId,type:"QUESTION_ASKED",sequence:{gt:roundSequence}},orderBy:{sequence:"desc"}});
    const lastConfirmed=await tx.gameAction.findFirst({where:{roomId,actorId:userId,type:"TURN_CONFIRMED",sequence:{gt:roundSequence}},orderBy:{sequence:"desc"}});
    if(!lastQuestion||(lastConfirmed&&lastConfirmed.sequence>lastQuestion.sequence))throw new Error("ASK_BEFORE_FLIP");
    const next=current.members.find(m=>m.userId!==userId);if(!next)throw new Error("OPPONENT_REQUIRED");
    const changed=await tx.room.updateMany({where:{id:roomId,version:current.version,currentTurnUserId:userId,status:"IN_PROGRESS",turnExpiresAt:{gt:new Date()}},data:{currentTurnUserId:next.userId,turnNumber:{increment:1},turnExpiresAt:new Date(Date.now()+60000),version:{increment:1}}});
    if(changed.count!==1)await throwRoomActionConflict(tx,roomId,userId);
    await appendRoomAction(tx,{roomId,actorId:userId,type:"TURN_CONFIRMED",payload:{questionActionId:lastQuestion.id}});
    return {version:current.version+1,currentTurnUserId:next.userId};
   });
   await publishRoomEvent(roomId,"game.updated",{roomId,version:result.version,currentTurnUserId:result.currentTurnUserId});
   return NextResponse.json({ok:true,...result});
  }
  if(action==="wild-guess"){
   const parsed=z.object({characterId:z.string().min(1).max(40)}).safeParse(body);
   if(!parsed.success||!(await getActiveCharacterById(parsed.data.characterId)))return NextResponse.json({error:"INVALID_CHARACTER"},{status:400});
   const result=await runRoomTransaction(async tx=>{
    const current=await tx.room.findUnique({where:{id:roomId},include:{members:{where:{leftAt:null},orderBy:{seat:"asc"}}}});
    if(!current||current.status!=="IN_PROGRESS")throw new Error("GAME_NOT_ACTIVE");
    if(current.currentTurnUserId!==userId)throw new Error("NOT_YOUR_TURN");
    const me=current.members.find(m=>m.userId===userId),opponent=current.members.find(m=>m.userId!==userId);
    if(!me||!opponent?.secretCharacterId)throw new Error("OPPONENT_REQUIRED");
    if(me.eliminatedCharacterIds.includes(parsed.data.characterId))throw new Error("CHARACTER_ELIMINATED");
    const roundStart=await tx.gameAction.findFirst({where:{roomId,type:"GAME_STARTED"},orderBy:{sequence:"desc"},select:{sequence:true}});
    const previousGuess=await tx.gameAction.findFirst({where:{roomId,actorId:userId,type:"GUESS_MADE",sequence:{gt:roundStart?.sequence??0}},select:{id:true}});
    if(previousGuess)throw new Error("GUESS_ALREADY_USED");
    const correct=opponent.secretCharacterId===parsed.data.characterId;
    const nextWinner=correct?userId:opponent.userId;
    const changed=await tx.room.updateMany({where:{id:roomId,version:current.version,currentTurnUserId:userId,status:"IN_PROGRESS",turnExpiresAt:{gt:new Date()}},data:{status:"COMPLETED",winnerId:nextWinner,currentTurnUserId:null,finishedAt:new Date(),expiresAt:null,version:{increment:1}}});
    if(changed.count!==1)await throwRoomActionConflict(tx,roomId,userId);
    await tx.roomMember.updateMany({where:{roomId,leftAt:null},data:{isConnected:false,isReady:false}});
    await appendRoomAction(tx,{roomId,actorId:userId,type:"GUESS_MADE",payload:{characterId:parsed.data.characterId,correct,mode:"WILD"}});
    await appendRoomAction(tx,{roomId,actorId:userId,type:"GAME_FINISHED",payload:correct?{winnerId:userId}:{reason:"WRONG_GUESS",winnerId:opponent.userId}});
    return {correct,version:current.version+1,winnerId:nextWinner};
   });
   await publishRoomEvent(roomId,"game.updated",{roomId,version:result.version,winnerId:result.winnerId});
   return NextResponse.json({ok:true,...result});
  }
  if(action==="guess"){
   const parsed=z.object({characterId:z.string().min(1).max(40)}).safeParse(body);
   if(!parsed.success||!(await getActiveCharacterById(parsed.data.characterId)))return NextResponse.json({error:"INVALID_GUESS"},{status:400});
   const result=await runRoomTransaction(async tx=>{
    const current=await tx.room.findUnique({where:{id:roomId},include:{members:{where:{leftAt:null},orderBy:{seat:"asc"}}}});
    if(!current||current.status!=="IN_PROGRESS")throw new Error("GAME_NOT_ACTIVE");
    if(current.currentTurnUserId!==userId)throw new Error("NOT_YOUR_TURN");
    const me=current.members.find(m=>m.userId===userId),opponent=current.members.find(m=>m.userId!==userId);
    if(!me||!opponent?.secretCharacterId)throw new Error("OPPONENT_REQUIRED");
    if(me.eliminatedCharacterIds.includes(parsed.data.characterId))throw new Error("CHARACTER_ELIMINATED");
    const activeCharacters=await getActiveCharacters();
    if(activeCharacters.length-me.eliminatedCharacterIds.length!==1)throw new Error("ONE_CHARACTER_REQUIRED");
    const correct=opponent.secretCharacterId===parsed.data.characterId;
    if(correct){
     const changed=await tx.room.updateMany({where:{id:roomId,version:current.version,currentTurnUserId:userId,status:"IN_PROGRESS",turnExpiresAt:{gt:new Date()}},data:{status:"COMPLETED",winnerId:userId,currentTurnUserId:null,finishedAt:new Date(),version:{increment:1}}});
     if(changed.count!==1)await throwRoomActionConflict(tx,roomId,userId);
     await tx.roomMember.updateMany({where:{roomId,leftAt:null},data:{isConnected:false,isReady:false}});
     await appendRoomAction(tx,{roomId,actorId:userId,type:"GUESS_MADE",payload:{characterId:parsed.data.characterId,correct:true}});
     await appendRoomAction(tx,{roomId,actorId:userId,type:"GAME_FINISHED",payload:{winnerId:userId}});
    }else{
     const next=current.members.find(m=>m.userId!==userId);if(!next)throw new Error("OPPONENT_REQUIRED");
     const changed=await tx.room.updateMany({where:{id:roomId,version:current.version,currentTurnUserId:userId,status:"IN_PROGRESS",turnExpiresAt:{gt:new Date()}},data:{status:"COMPLETED",winnerId:next.userId,currentTurnUserId:null,finishedAt:new Date(),expiresAt:null,version:{increment:1}}});
     if(changed.count!==1)await throwRoomActionConflict(tx,roomId,userId);
     await tx.roomMember.updateMany({where:{roomId,leftAt:null},data:{isConnected:false,isReady:false}});
     await appendRoomAction(tx,{roomId,actorId:userId,type:"GUESS_MADE",payload:{characterId:parsed.data.characterId,correct:false}});
     await appendRoomAction(tx,{roomId,actorId:userId,type:"GAME_FINISHED",payload:{reason:"WRONG_GUESS",winnerId:next.userId}});
    }
    return {correct,version:current.version+1,winnerId:correct?userId:(current.members.find(m=>m.userId!==userId)?.userId??null)};
   });
   await publishRoomEvent(roomId,"game.updated",{roomId,version:result.version,winnerId:result.winnerId});
   return NextResponse.json({ok:true,...result});
  }
  if(action==="rematch-request"){
   const result=await runRoomTransaction(async tx=>{
    const room=await tx.room.findUnique({where:{id:roomId},include:{members:{where:{leftAt:null},orderBy:{seat:"asc"}}}});
    if(!room||room.status!=="COMPLETED")throw new Error("MATCH_NOT_COMPLETED");
    if(room.members.length!==2||!room.members.some(m=>m.userId===userId))throw new Error("OPPONENT_REQUIRED");
    const latest=await tx.gameAction.findFirst({where:{roomId,type:"GAME_FINISHED"},orderBy:{sequence:"desc"}});
    const payload=latest?.payload&&typeof latest.payload==="object"&&!Array.isArray(latest.payload)?latest.payload as Record<string,unknown>:{};
    if(payload.reason==="PLAYER_LEFT"||payload.reason==="REMATCH_CANCELLED_LEFT")throw new Error("REMATCH_NOT_AVAILABLE_AFTER_LEAVE");
    if(payload.reason==="REMATCH_REQUESTED")throw new Error("REMATCH_ALREADY_REQUESTED");
    if(typeof payload.newRoomId==="string")throw new Error("REMATCH_ALREADY_RESOLVED");
    const changed=await tx.room.updateMany({where:{id:roomId,version:room.version,status:"COMPLETED"},data:{version:{increment:1}}});
    if(changed.count!==1)throw new Error("STATE_CONFLICT");
    await appendRoomAction(tx,{roomId,actorId:userId,type:"GAME_FINISHED",payload:{reason:"REMATCH_REQUESTED",requesterId:userId}});
    return {version:room.version+1};
   });
   await publishRoomEvent(roomId,"game.updated",{roomId,version:result.version,rematchRequested:true});
   return NextResponse.json({ok:true});
  }
  if(action==="rematch-response"){
   const parsed=z.object({accept:z.boolean()}).safeParse(body);
   if(!parsed.success)return NextResponse.json({error:"INVALID_RESPONSE"},{status:400});
   const result=await runRoomTransaction(async tx=>{
    const room=await tx.room.findUnique({where:{id:roomId},include:{members:{where:{leftAt:null},orderBy:{seat:"asc"}}}});
    if(!room||room.status!=="COMPLETED"||room.members.length!==2)throw new Error("MATCH_NOT_COMPLETED");
    if(!room.members.some(member=>member.userId===userId))throw new Error("NOT_MEMBER");
    const latest=await tx.gameAction.findFirst({where:{roomId,type:"GAME_FINISHED"},orderBy:{sequence:"desc"}});
    const payload=latest?.payload&&typeof latest.payload==="object"&&!Array.isArray(latest.payload)?latest.payload as Record<string,unknown>:{};
    if(payload.reason!=="REMATCH_REQUESTED"||typeof payload.requesterId!=="string")throw new Error("NO_REMATCH_REQUEST");
    if(payload.requesterId===userId)throw new Error("CANNOT_RESPOND_TO_OWN_REQUEST");
    if(parsed.data.accept){
     await tx.roomMember.updateMany({where:{roomId,leftAt:null},data:{isReady:false,isConnected:true,secretCharacterId:null,eliminatedCharacterIds:[],lastSeenAt:new Date()}});
     const changed=await tx.room.updateMany({where:{id:roomId,version:room.version,status:"COMPLETED"},data:{status:"WAITING",winnerId:null,currentTurnUserId:null,turnNumber:0,startedAt:null,finishedAt:null,expiresAt:new Date(Date.now()+1800000),turnExpiresAt:null,version:{increment:1}}});
     if(changed.count!==1)throw new Error("STATE_CONFLICT");
     await appendRoomAction(tx,{roomId,actorId:userId,type:"GAME_FINISHED",payload:{reason:"REMATCH_ACCEPTED"}});
     return {accepted:true,newRoomId:null,roomId,version:room.version+1};
    }
    const changed=await tx.room.updateMany({where:{id:roomId,version:room.version,status:"COMPLETED"},data:{version:{increment:1}}});
    if(changed.count!==1)throw new Error("STATE_CONFLICT");
    await appendRoomAction(tx,{roomId,actorId:userId,type:"GAME_FINISHED",payload:{reason:"REMATCH_DECLINED"}});
    return {accepted:false,newRoomId:null,version:room.version+1};
   });
   await publishRoomEvent(roomId,"room.updated",{roomId,version:result.version,status:result.accepted?"WAITING":"COMPLETED",rematchResolved:true});
   return NextResponse.json({ok:true,...result});
  }
  if(action==="rematch"){
   return NextResponse.json({error:"ROOM_CLOSED"}, {status:409});
  }
  if(action==="leave"){
   const result=await runRoomTransaction(async tx=>{
    const member=await tx.roomMember.findUnique({where:{roomId_userId:{roomId,userId}},include:{room:true}});
    if(!member||member.leftAt)throw new Error("NOT_MEMBER");
    if(member.room.status==="WAITING"){
     const latestSetupAction=await tx.gameAction.findFirst({where:{roomId,type:"GAME_FINISHED"},orderBy:{sequence:"desc"}});
     const setupPayload=latestSetupAction?.payload&&typeof latestSetupAction.payload==="object"&&!Array.isArray(latestSetupAction.payload)?latestSetupAction.payload as Record<string,unknown>:{};
     if(setupPayload.reason==="REMATCH_ACCEPTED"){
      const other=await tx.roomMember.findFirst({where:{roomId,leftAt:null,userId:{not:userId}},select:{userId:true}});
      const closedAt=new Date();
      await tx.roomMember.update({where:{id:member.id},data:{leftAt:closedAt,isConnected:false,isReady:false,secretCharacterId:null}});
      const changed=await tx.room.updateMany({where:{id:roomId,version:member.room.version,status:"WAITING"},data:{status:"COMPLETED",winnerId:other?.userId??null,currentTurnUserId:null,turnExpiresAt:null,finishedAt:closedAt,expiresAt:null,version:{increment:1}}});
      if(changed.count!==1)throw new Error("STATE_CONFLICT");
      await appendRoomAction(tx,{roomId,actorId:userId,type:"PLAYER_LEFT",payload:{destination:"HOME",duringRematchSetup:true}});
      await appendRoomAction(tx,{roomId,actorId:userId,type:"GAME_FINISHED",payload:{reason:"REMATCH_CANCELLED_LEFT",winnerId:other?.userId??null}});
      return {version:member.room.version+1,status:"COMPLETED" as const,deleted:false};
     }
     const deleted=await tx.room.deleteMany({where:{id:roomId,version:member.room.version,status:"WAITING"}});
     if(deleted.count!==1)throw new Error("STATE_CONFLICT");
     return {version:member.room.version+1,status:"DELETED" as const,deleted:true};
    }
    const other=await tx.roomMember.findFirst({where:{roomId,leftAt:null,userId:{not:userId}},select:{userId:true}});
    const latest=await tx.gameAction.findFirst({where:{roomId,type:"GAME_FINISHED"},orderBy:{sequence:"desc"}});
    const latestPayload=latest?.payload&&typeof latest.payload==="object"&&!Array.isArray(latest.payload)?latest.payload as Record<string,unknown>:{};
    const pendingRematch=member.room.status==="COMPLETED"&&latestPayload.reason==="REMATCH_REQUESTED";
    const closedAt=new Date();
    await tx.roomMember.update({where:{id:member.id},data:{leftAt:closedAt,isConnected:false,isReady:false,secretCharacterId:null}});
    await tx.roomMember.updateMany({where:{roomId,leftAt:null,userId:{not:userId}},data:{isConnected:false,isReady:false}});
    const changed=await tx.room.updateMany({where:{id:roomId,version:member.room.version,status:member.room.status},data:{status:"COMPLETED",winnerId:member.room.status==="IN_PROGRESS"?(other?.userId??null):member.room.winnerId,currentTurnUserId:null,turnExpiresAt:null,finishedAt:new Date(),expiresAt:null,version:{increment:1}}});
    if(changed.count!==1)throw new Error("STATE_CONFLICT");
    await appendRoomAction(tx,{roomId,actorId:userId,type:"PLAYER_LEFT",payload:{destination:"HOME"}});
    if(member.room.status==="IN_PROGRESS")await appendRoomAction(tx,{roomId,actorId:userId,type:"GAME_FINISHED",payload:{reason:"PLAYER_LEFT",winnerId:other?.userId??null}});
    else if(pendingRematch)await appendRoomAction(tx,{roomId,actorId:userId,type:"GAME_FINISHED",payload:{reason:"REMATCH_CANCELLED_LEFT",departedUserId:userId}});
    return {version:member.room.version+1,status:"COMPLETED" as const,deleted:false,rematchCancelled:pendingRematch};
   });
   await publishRoomEvent(roomId,"room.updated",{roomId,version:result.version,status:result.status,rematchCancelled:"rematchCancelled" in result?result.rematchCancelled:false});
   return NextResponse.json({ok:true,deleted:result.deleted});
  }
  return NextResponse.json({error:"NOT_FOUND"},{status:404});
 }catch(e){const m=e instanceof Error?e.message:"";const s=m==="FORBIDDEN"?403:["NOT_READY","ROOM_NOT_AVAILABLE","GAME_NOT_ACTIVE","NOT_YOUR_TURN","QUESTION_ALREADY_ASKED","QUESTION_ALREADY_PENDING","ASK_BEFORE_FLIP","LAST_CHARACTER_REQUIRED","CHARACTER_ELIMINATED","ONE_CHARACTER_REQUIRED","GUESS_ALREADY_USED","TURN_TIME_EXPIRED","STATE_CONFLICT","MATCH_NOT_COMPLETED","OPPONENT_REQUIRED","REMATCH_ALREADY_REQUESTED","REMATCH_ALREADY_RESOLVED","REMATCH_NOT_AVAILABLE_AFTER_LEAVE","NO_REMATCH_REQUEST","CANNOT_RESPOND_TO_OWN_REQUEST"].includes(m)?409:m==="INVALID_QUESTION"||m==="INVALID_CHARACTER"?400:404;return NextResponse.json({error:m||"ROOM_ACTION_FAILED"},{status:s});}
}
