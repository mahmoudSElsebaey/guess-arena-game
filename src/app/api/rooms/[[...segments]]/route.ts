import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { characters } from "@/data/characters";
import { questionTests } from "@/lib/game/game-logic";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { appendRoomAction,getRoomSnapshot,isValidCharacterId,makeRoomCode,publishRoomEvent } from "@/lib/rooms";
import { getAblyRestClient } from "@/lib/ably";
type Ctx={params:Promise<{segments?:string[]}>};
const readySchema=z.object({isReady:z.boolean(),secretCharacterId:z.string().optional()});
async function actor(){return (await auth())?.user?.id??null;}
export async function GET(request:Request,{params}:Ctx){
 const userId=await actor();if(!userId)return NextResponse.json({error:"UNAUTHORIZED"},{status:401});
 const {segments=[]}=await params;
 if(segments[0]==="realtime-token"){
  const roomId=new URL(request.url).searchParams.get("roomId");if(!roomId)return NextResponse.json({error:"ROOM_REQUIRED"},{status:400});
  const member=await prisma.roomMember.findFirst({where:{roomId,userId,leftAt:null}});if(!member)return NextResponse.json({error:"FORBIDDEN"},{status:403});
  try{const token=await getAblyRestClient().auth.createTokenRequest({clientId:userId,ttl:900000,capability:JSON.stringify({[`room:${roomId}`]:["subscribe"]})});return NextResponse.json(token,{headers:{"Cache-Control":"no-store"}});}catch{return NextResponse.json({error:"REALTIME_NOT_CONFIGURED"},{status:503});}
 }
 const roomId=segments[0];if(!roomId||segments.length!==1)return NextResponse.json({error:"NOT_FOUND"},{status:404});
 await prisma.roomMember.updateMany({where:{roomId,leftAt:null,isConnected:true,lastSeenAt:{lt:new Date(Date.now()-15000)}},data:{isConnected:false}});
 await prisma.roomMember.updateMany({where:{roomId,userId,leftAt:null},data:{isConnected:true,lastSeenAt:new Date()}});
 const snapshot=await getRoomSnapshot(roomId,userId);if(!snapshot)return NextResponse.json({error:"ROOM_NOT_FOUND"},{status:404});
 const [room,actions,me]=await Promise.all([
  prisma.room.findUnique({where:{id:roomId},select:{currentTurnUserId:true,turnNumber:true,winnerId:true}}),
  prisma.gameAction.findMany({where:{roomId,type:{in:["QUESTION_ASKED","GUESS_MADE","GAME_FINISHED"]}},orderBy:{sequence:"desc"},take:40}),
  prisma.roomMember.findUnique({where:{roomId_userId:{roomId,userId}},select:{eliminatedCharacterIds:true}})
 ]);
 const safeActions=actions.reverse().map(a=>{
  const p=a.payload&&typeof a.payload==="object"&&!Array.isArray(a.payload)?a.payload as Record<string,unknown>:{};
  return {id:a.id,actorId:a.actorId,type:a.type,questionId:typeof p.questionId==="string"?p.questionId:null,answer:typeof p.answer==="boolean"?p.answer:null,characterId:typeof p.characterId==="string"?p.characterId:null,correct:typeof p.correct==="boolean"?p.correct:null,createdAt:a.createdAt.toISOString()};
 });
 return NextResponse.json({...snapshot,currentTurnUserId:room?.currentTurnUserId??null,turnNumber:room?.turnNumber??0,winnerId:room?.winnerId??null,myEliminatedCharacterIds:me?.eliminatedCharacterIds??[],actions:safeActions},{headers:{"Cache-Control":"no-store"}});
}
export async function POST(request:Request,{params}:Ctx){
 const userId=await actor();if(!userId)return NextResponse.json({error:"UNAUTHORIZED"},{status:401});
 const {segments=[]}=await params;const body=await request.json().catch(()=>({}));
 if(segments.length===0){
  for(let i=0;i<5;i++){const code=makeRoomCode();try{const room=await prisma.$transaction(async tx=>{const created=await tx.room.create({data:{code,hostId:userId,expiresAt:new Date(Date.now()+1800000),members:{create:{userId,seat:1}}}});await appendRoomAction(tx,{roomId:created.id,actorId:userId,type:"ROOM_CREATED",payload:{code}});return created;});await publishRoomEvent(room.id,"room.updated",{roomId:room.id,version:room.version,status:room.status});return NextResponse.json({roomId:room.id,code:room.code},{status:201});}catch(e){if(i===4||!(e instanceof Error)||!e.message.toLowerCase().includes("unique"))return NextResponse.json({error:"ROOM_CREATE_FAILED"},{status:500});}}
  return NextResponse.json({error:"ROOM_CODE_UNAVAILABLE"},{status:503});
 }
 if(segments[0]==="join"){
  const parsed=z.object({code:z.string().trim().regex(/^\d{6}$/)}).safeParse(body);if(!parsed.success)return NextResponse.json({error:"INVALID_ROOM_CODE"},{status:400});
  try{const room=await prisma.$transaction(async tx=>{const current=await tx.room.findUnique({where:{code:parsed.data.code}});if(!current||current.status!=="WAITING"||(current.expiresAt&&current.expiresAt<new Date()))throw new Error("ROOM_NOT_AVAILABLE");const existing=await tx.roomMember.findUnique({where:{roomId_userId:{roomId:current.id,userId}}});if(existing&&!existing.leftAt)return current;const count=await tx.roomMember.count({where:{roomId:current.id,leftAt:null}});if(count>=current.maxPlayers)throw new Error("ROOM_FULL");const seat=count===0?1:2;if(existing)await tx.roomMember.update({where:{id:existing.id},data:{seat,isConnected:true,isReady:false,secretCharacterId:null,leftAt:null,lastSeenAt:new Date()}});else await tx.roomMember.create({data:{roomId:current.id,userId,seat}});const updated=await tx.room.update({where:{id:current.id},data:{version:{increment:1}}});await appendRoomAction(tx,{roomId:current.id,actorId:userId,type:"ROOM_JOINED",payload:{seat}});return updated;});await publishRoomEvent(room.id,"room.updated",{roomId:room.id,version:room.version,status:room.status});return NextResponse.json({roomId:room.id,code:room.code});}catch(e){const m=e instanceof Error?e.message:"";const s=m==="ROOM_FULL"?409:m==="ROOM_NOT_AVAILABLE"?404:500;return NextResponse.json({error:s===500?"ROOM_JOIN_FAILED":m},{status:s});}
 }
 const roomId=segments[0],action=segments[1];if(!roomId||segments.length!==2)return NextResponse.json({error:"NOT_FOUND"},{status:404});
 try{
  if(action==="ready"){
   const parsed=readySchema.safeParse(body);if(!parsed.success||(parsed.data.isReady&&!isValidCharacterId(parsed.data.secretCharacterId)))return NextResponse.json({error:"INVALID_READY_STATE"},{status:400});
   const room=await prisma.$transaction(async tx=>{const member=await tx.roomMember.findUnique({where:{roomId_userId:{roomId,userId}},include:{room:true}});if(!member||member.leftAt||member.room.status!=="WAITING")throw new Error("ROOM_NOT_AVAILABLE");await tx.roomMember.update({where:{id:member.id},data:{isReady:parsed.data.isReady,secretCharacterId:parsed.data.isReady?parsed.data.secretCharacterId:null,lastSeenAt:new Date()}});const updated=await tx.room.update({where:{id:roomId},data:{version:{increment:1}}});await appendRoomAction(tx,{roomId,actorId:userId,type:"PLAYER_READY",payload:{isReady:parsed.data.isReady}});return updated;});await publishRoomEvent(roomId,"room.updated",{roomId,version:room.version,status:room.status});return NextResponse.json({ok:true});
  }
  if(action==="start"){
   const room=await prisma.$transaction(async tx=>{const current=await tx.room.findUnique({where:{id:roomId},include:{members:{where:{leftAt:null},orderBy:{seat:"asc"}}}});if(!current)throw new Error("NOT_FOUND");if(current.hostId!==userId)throw new Error("FORBIDDEN");if(current.status!=="WAITING"||current.members.length!==2||current.members.some(m=>!m.isReady||!m.secretCharacterId))throw new Error("NOT_READY");const started=await tx.room.update({where:{id:roomId},data:{status:"IN_PROGRESS",startedAt:new Date(),currentTurnUserId:current.members[0].userId,turnNumber:1,version:{increment:1},expiresAt:null}});await appendRoomAction(tx,{roomId,actorId:userId,type:"GAME_STARTED",payload:{startedAt:started.startedAt?.toISOString()}});return started;});await publishRoomEvent(roomId,"game.started",{roomId,version:room.version,status:room.status,currentTurnUserId:room.currentTurnUserId});return NextResponse.json({ok:true,status:room.status});
  }
  if(action==="ask"){
   const parsed=z.object({questionId:z.string().min(1).max(40)}).safeParse(body);
   const questionTest=parsed.success?questionTests[parsed.data.questionId]:undefined;
   if(!parsed.success||!questionTest)return NextResponse.json({error:"INVALID_QUESTION"},{status:400});
   const result=await prisma.$transaction(async tx=>{
    const current=await tx.room.findUnique({where:{id:roomId},include:{members:{where:{leftAt:null},orderBy:{seat:"asc"}}}});
    if(!current||current.status!=="IN_PROGRESS")throw new Error("GAME_NOT_ACTIVE");
    if(current.currentTurnUserId!==userId)throw new Error("NOT_YOUR_TURN");
    const me=current.members.find(m=>m.userId===userId),opponent=current.members.find(m=>m.userId!==userId);
    if(!me||!opponent?.secretCharacterId)throw new Error("OPPONENT_REQUIRED");
    const previous=await tx.gameAction.findMany({where:{roomId,actorId:userId,type:"QUESTION_ASKED"},select:{payload:true}});
    if(previous.some(a=>typeof a.payload==="object"&&a.payload!==null&&!Array.isArray(a.payload)&&a.payload.questionId===parsed.data.questionId))throw new Error("QUESTION_ALREADY_ASKED");
    const secret=characters.find(c=>c.id===opponent.secretCharacterId);if(!secret)throw new Error("OPPONENT_REQUIRED");
    const answer=questionTest(secret);
    const removed=characters.filter(c=>!me.eliminatedCharacterIds.includes(c.id)&&questionTest(c)!==answer).map(c=>c.id);
    const next=current.members.find(m=>m.userId!==userId);if(!next)throw new Error("OPPONENT_REQUIRED");
    const changed=await tx.room.updateMany({where:{id:roomId,version:current.version,currentTurnUserId:userId,status:"IN_PROGRESS"},data:{currentTurnUserId:next.userId,turnNumber:{increment:1},version:{increment:1}}});
    if(changed.count!==1)throw new Error("STATE_CONFLICT");
    await tx.roomMember.update({where:{id:me.id},data:{eliminatedCharacterIds:[...me.eliminatedCharacterIds,...removed]}});
    await appendRoomAction(tx,{roomId,actorId:userId,type:"QUESTION_ASKED",payload:{questionId:parsed.data.questionId,answer,removedCount:removed.length}});
    return {answer,removedCount:removed.length,version:current.version+1};
   },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
   await publishRoomEvent(roomId,"game.updated",{roomId,version:result.version});
   return NextResponse.json({ok:true,...result});
  }
  if(action==="guess"){
   const parsed=z.object({characterId:z.string().min(1).max(40)}).safeParse(body);
   if(!parsed.success||!isValidCharacterId(parsed.data.characterId))return NextResponse.json({error:"INVALID_GUESS"},{status:400});
   const result=await prisma.$transaction(async tx=>{
    const current=await tx.room.findUnique({where:{id:roomId},include:{members:{where:{leftAt:null},orderBy:{seat:"asc"}}}});
    if(!current||current.status!=="IN_PROGRESS")throw new Error("GAME_NOT_ACTIVE");
    if(current.currentTurnUserId!==userId)throw new Error("NOT_YOUR_TURN");
    const me=current.members.find(m=>m.userId===userId),opponent=current.members.find(m=>m.userId!==userId);
    if(!me||!opponent?.secretCharacterId)throw new Error("OPPONENT_REQUIRED");
    if(me.eliminatedCharacterIds.includes(parsed.data.characterId))throw new Error("CHARACTER_ELIMINATED");
    const correct=opponent.secretCharacterId===parsed.data.characterId;
    if(correct){
     const changed=await tx.room.updateMany({where:{id:roomId,version:current.version,currentTurnUserId:userId,status:"IN_PROGRESS"},data:{status:"COMPLETED",winnerId:userId,currentTurnUserId:null,finishedAt:new Date(),version:{increment:1}}});
     if(changed.count!==1)throw new Error("STATE_CONFLICT");
     await appendRoomAction(tx,{roomId,actorId:userId,type:"GUESS_MADE",payload:{characterId:parsed.data.characterId,correct:true}});
     await appendRoomAction(tx,{roomId,actorId:userId,type:"GAME_FINISHED",payload:{winnerId:userId}});
    }else{
     const next=current.members.find(m=>m.userId!==userId);if(!next)throw new Error("OPPONENT_REQUIRED");
     const changed=await tx.room.updateMany({where:{id:roomId,version:current.version,currentTurnUserId:userId,status:"IN_PROGRESS"},data:{currentTurnUserId:next.userId,turnNumber:{increment:1},version:{increment:1}}});
     if(changed.count!==1)throw new Error("STATE_CONFLICT");
     await tx.roomMember.update({where:{id:me.id},data:{eliminatedCharacterIds:[...me.eliminatedCharacterIds,parsed.data.characterId]}});
     await appendRoomAction(tx,{roomId,actorId:userId,type:"GUESS_MADE",payload:{characterId:parsed.data.characterId,correct:false}});
    }
    return {correct,version:current.version+1,winnerId:correct?userId:null};
   },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
   await publishRoomEvent(roomId,"game.updated",{roomId,version:result.version,winnerId:result.winnerId});
   return NextResponse.json({ok:true,...result});
  }
  if(action==="leave"){
   const room=await prisma.$transaction(async tx=>{const member=await tx.roomMember.findUnique({where:{roomId_userId:{roomId,userId}},include:{room:true}});if(!member||member.leftAt)throw new Error("NOT_MEMBER");const other=await tx.roomMember.findFirst({where:{roomId,leftAt:null,userId:{not:userId}},select:{userId:true}});await tx.roomMember.update({where:{id:member.id},data:{leftAt:new Date(),isConnected:false,isReady:false,secretCharacterId:null}});const data=member.room.status==="IN_PROGRESS"?{status:"COMPLETED" as const,winnerId:other?.userId??null,currentTurnUserId:null,finishedAt:new Date(),version:{increment:1}}:member.room.status==="WAITING"&&member.room.hostId===userId?{status:"CANCELLED" as const,version:{increment:1}}:{version:{increment:1}};const updated=await tx.room.update({where:{id:roomId},data});await appendRoomAction(tx,{roomId,actorId:userId,type:"PLAYER_LEFT",payload:{}});if(member.room.status==="IN_PROGRESS")await appendRoomAction(tx,{roomId,actorId:userId,type:"GAME_FINISHED",payload:{reason:"PLAYER_LEFT",winnerId:other?.userId??null}});return updated;});await publishRoomEvent(roomId,"room.updated",{roomId,version:room.version,status:room.status});return NextResponse.json({ok:true});
  }
  return NextResponse.json({error:"NOT_FOUND"},{status:404});
 }catch(e){const m=e instanceof Error?e.message:"";const s=m==="FORBIDDEN"?403:["NOT_READY","ROOM_NOT_AVAILABLE","GAME_NOT_ACTIVE","NOT_YOUR_TURN","QUESTION_ALREADY_ASKED","CHARACTER_ELIMINATED","STATE_CONFLICT"].includes(m)?409:m==="INVALID_QUESTION"?400:404;return NextResponse.json({error:m||"ROOM_ACTION_FAILED"},{status:s});}
}
