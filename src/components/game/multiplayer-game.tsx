"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { useGameSounds } from "@/hooks/use-game-sounds";

type Action = { id:string; actorId:string; type:string; questionId:string|null; answer:boolean|null; characterId:string|null; correct:boolean|null; createdAt:string };
type Snapshot = { id:string; status:string; version:number; currentTurnUserId:string|null; turnNumber:number; winnerId:string|null; members:{userId:string;name:string;isMe:boolean}[]; myEliminatedCharacterIds:string[]; actions:Action[] };
type CharacterOption = { id:string; name:string; avatar:string; attributes:Record<string,string|boolean> };
type QuestionOption = { id:string; labelAr:string; labelEn:string; attributeKey:string; expectedValue:string|boolean; category:{slug:string;nameAr:string;nameEn:string}; sortOrder:number };
export function MultiplayerGame({roomId,locale,characters,questions}:{roomId:string;locale:"ar"|"en";characters:CharacterOption[];questions:QuestionOption[]}) {
 const ar=locale==="ar";
 const [state,setState]=useState<Snapshot|null>(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const {soundEnabled,toggleSound,playSound}=useGameSounds();
 const previousVersion=useRef<number|null>(null);
 const previousTurn=useRef<string|null>(null);
 const refresh=useCallback(async()=>{
  const response=await fetch(`/api/rooms/${roomId}`,{cache:"no-store"});
  const data=await response.json();
  if(!response.ok)throw new Error(data.error);
  setState(data);
 },[roomId]);
 useEffect(()=>{
  if(!state)return;
  if(previousVersion.current===null){previousVersion.current=state.version;previousTurn.current=state.currentTurnUserId;return;}
  if(state.version>previousVersion.current){
   const latest=state.actions[state.actions.length-1];
   if(latest?.type==="QUESTION_ASKED")playSound(latest.answer?"yes":"no");
   else if(latest?.type==="GUESS_MADE")playSound(latest.correct?(latest.actorId===myId?"win":"lose"):"eliminate");
   else if(previousTurn.current!==state.currentTurnUserId)playSound("turn");
  }
  previousVersion.current=state.version;
  previousTurn.current=state.currentTurnUserId;
 },[state,playSound,myId]);
 useEffect(()=>{
  void refresh().catch(()=>setError(ar?"تعذر تحميل المباراة.":"Could not load match."));
  const timer=window.setInterval(()=>{if(document.visibilityState==="visible")void refresh().catch(()=>undefined);},2000);
  return()=>window.clearInterval(timer);
 },[refresh,ar]);
 const eliminated=useMemo(()=>new Set(state?.myEliminatedCharacterIds??[]),[state?.myEliminatedCharacterIds]);
 const myId=state?.members.find(m=>m.isMe)?.userId;
 const myTurn=Boolean(myId&&state?.currentTurnUserId===myId);
 const asked=new Set((state?.actions??[]).filter(a=>a.type==="QUESTION_ASKED"&&a.actorId===myId).map(a=>a.questionId));
 const send=async(action:"ask"|"guess",payload:Record<string,string>)=>{
  setBusy(true);setError("");setNotice("");
  try{
   const response=await fetch(`/api/rooms/${roomId}/${action}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
   const data=await response.json();
   if(!response.ok)throw new Error(data.error);
   if(action==="ask")setNotice(ar?(data.answer?"إجابة الخصم: نعم":"إجابة الخصم: لا"):(data.answer?"Opponent answered: Yes":"Opponent answered: No"));
   else setNotice(data.correct?(ar?"إجابة صحيحة! فزت بالمباراة.":"Correct! You won."):(ar?"تخمين غير صحيح، تم استبعاد الشخصية.":"Wrong guess. Character eliminated."));
   await refresh();
  }catch(e){
   const key=e instanceof Error?e.message:"";
   const messages:Record<string,string>={NOT_YOUR_TURN:ar?"ليس دورك الآن.":"It is not your turn.",QUESTION_ALREADY_ASKED:ar?"استخدمت هذا السؤال من قبل.":"You already asked this question.",INVALID_QUESTION:ar?"السؤال غير صالح.":"Invalid question.",CHARACTER_ELIMINATED:ar?"هذه الشخصية مستبعدة بالفعل.":"Character already eliminated.",GAME_NOT_ACTIVE:ar?"المباراة ليست نشطة.":"Match is not active."};
   setError(messages[key]??(ar?"تعذر تنفيذ الحركة.":"Could not submit move."));
  }finally{setBusy(false);}
 };
 if(!state)return <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">{ar?"جارٍ تحميل المباراة...":"Loading match..."}</p>;
 const winner=state.members.find(m=>m.userId===state.winnerId);
 return <div dir={ar?"rtl":"ltr"} className="mt-6 space-y-5">
  <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-950 p-4 text-white"><div><p className="text-xs text-slate-400">{ar?"الحالة":"Match status"}</p><p className="mt-1 font-black">{state.status==="COMPLETED"?(ar?"انتهت المباراة": "Match completed"):myTurn?(ar?"دورك الآن":"Your turn"):(ar?"دور الخصم":"Opponent's turn")}</p></div><div className="flex items-center gap-3"><div className="text-end"><p className="text-xs text-slate-400">{ar?"الدور":"Turn"}</p><p className="text-2xl font-black">{state.turnNumber}</p></div><button type="button" onClick={toggleSound} aria-pressed={soundEnabled} aria-label={soundEnabled?(ar?"إيقاف الصوت":"Mute sounds"):(ar?"تشغيل الصوت":"Enable sounds")} className="grid size-10 place-items-center rounded-xl bg-white/10 text-white transition hover:bg-white/20">{soundEnabled?<Volume2 size={18}/>:<VolumeX size={18}/>}</button></div></div>
  {state.status==="COMPLETED"&&<div className="rounded-2xl bg-emerald-50 p-4 font-black text-emerald-800">{winner?.isMe?(ar?"مبروك! أنت الفائز.":"Congratulations, you won!"):(ar?`الفائز: ${winner?.name??"لا يوجد"}`:`Winner: ${winner?.name??"None"}`)}</div>}
  {state.status==="IN_PROGRESS"&&<>
   <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4"><h3 className="font-black">{ar?"اختر سؤالًا":"Choose a question"}</h3><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{questions.map(question=><button key={question.id} disabled={!myTurn||busy||asked.has(question.id)} onClick={()=>void send("ask",{questionId:question.id})} className="min-h-11 rounded-xl border border-violet-100 bg-white px-3 py-2 text-start text-sm font-bold text-slate-700 disabled:opacity-40">{ar?question.labelAr:question.labelEn}{asked.has(question.id)?" ✓":""}</button>)}</div></div>
   <div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="mb-3 flex items-center justify-between"><h3 className="font-black">{ar?"لوحة الشخصيات":"Character board"}</h3><span className="text-xs text-slate-500">{characters.length-eliminated.size}/45</span></div><div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-9">{characters.map(c=>{const out=eliminated.has(c.id);return <button key={c.id} disabled={!myTurn||busy||out} onClick={()=>void send("guess",{characterId:c.id})} className={`animate-card-enter rounded-xl border p-2 text-center transition-all duration-300 ${out?"border-slate-100 bg-slate-100 opacity-35 grayscale":"border-slate-200 bg-white hover:border-violet-400 hover:bg-violet-50"} disabled:cursor-not-allowed`}><span className="block text-3xl">{c.avatar}</span><span className="mt-1 block truncate text-xs font-bold text-slate-700">{c.name}</span></button>;})}</div></div>
  </>}
  <div className="rounded-2xl border border-slate-200 bg-white p-4"><h3 className="font-black">{ar?"سجل المباراة":"Match history"}</h3><div className="mt-3 space-y-2">{state.actions.slice(-8).reverse().map(a=>{const player=state.members.find(m=>m.userId===a.actorId);const q=questions.find(x=>x.id===a.questionId);return <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-3 text-sm"><span className="font-semibold text-slate-700">{player?.name}: {a.type==="QUESTION_ASKED"?(ar?q?.labelAr:q?.labelEn):a.type==="GUESS_MADE"?(ar?"تخمين شخصية":"Character guess"):""}</span>{a.type==="QUESTION_ASKED"&&<b className={a.answer?"text-emerald-700":"text-rose-700"}>{a.answer?(ar?"نعم":"Yes"):(ar?"لا":"No")}</b>}{a.type==="GUESS_MADE"&&<b>{a.correct?(ar?"صحيح":"Correct"):(ar?"خطأ":"Wrong")}</b>}</div>;})}{!state.actions.length&&<p className="text-sm text-slate-400">{ar?"لا توجد حركات بعد.":"No moves yet."}</p>}</div></div>
  {notice&&<p className="rounded-xl bg-teal-50 p-3 text-sm font-bold text-teal-800">{notice}</p>}{error&&<p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p>}
 </div>;
}
