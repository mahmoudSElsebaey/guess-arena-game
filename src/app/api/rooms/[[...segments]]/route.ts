import { NextResponse } from "next/server";
import { z } from "zod";
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
 await prisma.roomMember.updateMany({where:{roomId,userId,leftAt:null},data:{isConnected:true,lastSeenAt:new Date()}});
 const snapshot=await getRoomSnapshot(roomId,userId);if(!snapshot)return NextResponse.json({error:"ROOM_NOT_FOUND"},{status:404});
 return NextResponse.json(snapshot,{headers:{"Cache-Control":"no-store"}});
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
  if(action==="leave"){
   const room=await prisma.$transaction(async tx=>{const member=await tx.roomMember.findUnique({where:{roomId_userId:{roomId,userId}},include:{room:true}});if(!member||member.leftAt)throw new Error("NOT_MEMBER");await tx.roomMember.update({where:{id:member.id},data:{leftAt:new Date(),isConnected:false,isReady:false,secretCharacterId:null}});const updated=await tx.room.update({where:{id:roomId},data:{version:{increment:1},...(member.room.status==="WAITING"&&member.room.hostId===userId?{status:"CANCELLED" as const}:{})}});await appendRoomAction(tx,{roomId,actorId:userId,type:"PLAYER_LEFT",payload:{}});return updated;});await publishRoomEvent(roomId,"room.updated",{roomId,version:room.version,status:room.status});return NextResponse.json({ok:true});
  }
  return NextResponse.json({error:"NOT_FOUND"},{status:404});
 }catch(e){const m=e instanceof Error?e.message:"";const s=m==="FORBIDDEN"?403:m==="NOT_READY"||m==="ROOM_NOT_AVAILABLE"?409:404;return NextResponse.json({error:m||"ROOM_ACTION_FAILED"},{status:s});}
}
