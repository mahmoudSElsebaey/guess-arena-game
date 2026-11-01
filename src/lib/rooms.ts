import "server-only";
import { randomInt } from "node:crypto";
import { Prisma, type PrismaClient } from "@prisma/client";
import { getAblyRestClient } from "@/lib/ably";
import { prisma } from "@/lib/prisma";
type Db=PrismaClient|Prisma.TransactionClient;
export const makeRoomCode=()=>randomInt(0,1_000_000).toString().padStart(6,"0");
export async function appendRoomAction(tx:Prisma.TransactionClient,input:{roomId:string;actorId:string;type:"ROOM_CREATED"|"ROOM_JOINED"|"PLAYER_READY"|"GAME_STARTED"|"QUESTION_ASKED"|"GUESS_MADE"|"PLAYER_LEFT"|"GAME_FINISHED";payload?:Prisma.InputJsonValue}){
 const last=await tx.gameAction.findFirst({where:{roomId:input.roomId},orderBy:{sequence:"desc"},select:{sequence:true}});
 return tx.gameAction.create({data:{roomId:input.roomId,actorId:input.actorId,sequence:(last?.sequence??0)+1,type:input.type,idempotencyKey:`${input.type.toLowerCase()}-${input.actorId}-${Date.now()}-${randomInt(1_000_000)}`,payload:input.payload??{}}});
}
export async function publishRoomEvent(roomId:string,name:string,data:Record<string,unknown>){
 try{await getAblyRestClient().channels.get(`room:${roomId}`).publish(name,data);}catch(error){console.error("Ably publish failed; PostgreSQL remains authoritative.",error);}
}
export async function getRoomSnapshot(roomId:string,userId:string,db:Db=prisma){
 const room=await db.room.findUnique({where:{id:roomId},include:{members:{include:{user:{select:{id:true,name:true}}},orderBy:{seat:"asc"}}}});
 if(!room)return null;const me=room.members.find(m=>m.userId===userId&&!m.leftAt);if(!me)return null;
 return {id:room.id,code:room.code,status:room.status,hostId:room.hostId,isHost:room.hostId===userId,version:room.version,maxPlayers:room.maxPlayers,members:room.members.filter(m=>!m.leftAt).map(m=>({userId:m.userId,name:m.user.name??"Player",seat:m.seat,isReady:m.isReady,isConnected:m.isConnected,isMe:m.userId===userId,hasSecretCharacter:Boolean(m.secretCharacterId)})),mySecretCharacterId:me.secretCharacterId};
}
export const isValidCharacterId=(v:unknown):v is string=>typeof v==="string"&&/^character-(?:[1-9]|[1-3][0-9]|4[0-5])$/.test(v);
