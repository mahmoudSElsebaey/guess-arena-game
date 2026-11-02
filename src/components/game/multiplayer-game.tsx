"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Volume2, VolumeX, Sparkles, Trophy, Users, History } from "lucide-react";
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
 const [loading,setLoading]=useState(true);
 const {soundEnabled,toggleSound,playSound}=useGameSounds();
 const previousVersion=useRef<number|null>(null);
 const previousTurn=useRef<string|null>(null);
 const requestRef=useRef<AbortController|null>(null);
 const refresh=useCallback(async()=>{
  requestRef.current?.abort();
  const controller=new AbortController();
  requestRef.current=controller;
  const timeout=window.setTimeout(()=>controller.abort(),8000);
  try{
   const response=await fetch(`/api/rooms/${roomId}`,{cache:"no-store",signal:controller.signal});
   const data=await response.json();
   if(!response.ok)throw new Error(data.error);
   setState(data);
  }finally{window.clearTimeout(timeout);if(requestRef.current===controller)requestRef.current=null;}
 },[roomId]);
 useEffect(()=>{
  if(!state)return;
  if(previousVersion.current===null){previousVersion.current=state.version;previousTurn.current=state.currentTurnUserId;return;}
  if(state.version>previousVersion.current){
   const matchActions=state.actions.filter(action=>action.type==="QUESTION_ASKED"||action.type==="GUESS_MADE");
   const latest=matchActions[matchActions.length-1];
   const ownId=state.members.find(member=>member.isMe)?.userId;
   if(latest?.type==="QUESTION_ASKED")playSound(latest.answer?"yes":"no");
   else if(latest?.type==="GUESS_MADE")playSound(latest.correct?(latest.actorId===ownId?"win":"lose"):"eliminate");
   else if(previousTurn.current!==state.currentTurnUserId)playSound("turn");
  }
  previousVersion.current=state.version;
  previousTurn.current=state.currentTurnUserId;
 },[state,playSound]);
 useEffect(()=>{
  let mounted=true;
  const load=async()=>{
   try{await refresh();if(mounted)setError("");}
   catch{if(mounted)setError(ar?"تعذر تحميل المباراة.":"Could not load match.");}
   finally{if(mounted)setLoading(false);}
  };
  void load();
  const timer=window.setInterval(()=>{if(document.visibilityState==="visible"&&!busy)void load();},3000);
  return()=>{mounted=false;window.clearInterval(timer);requestRef.current?.abort();};
 },[refresh,ar,busy]);
 const eliminated=useMemo(()=>new Set(state?.myEliminatedCharacterIds??[]),[state?.myEliminatedCharacterIds]);
 const myId=state?.members.find(m=>m.isMe)?.userId;
 const myTurn=Boolean(myId&&state?.currentTurnUserId===myId);
 const asked=new Set((state?.actions??[]).filter(a=>a.type==="QUESTION_ASKED"&&a.actorId===myId).map(a=>a.questionId));
 const send=async(action:"ask"|"guess",payload:Record<string,string>)=>{
  playSound("click");
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
 if (loading && !state) return (
  <section className="mt-6 space-y-4" role="status" aria-live="polite">
   <div className="h-28 animate-pulse rounded-3xl bg-slate-200" />
   <div className="h-64 animate-pulse rounded-3xl bg-slate-100" />
   <span className="sr-only">{ar ? "جارٍ تحميل المباراة..." : "Loading match..."}</span>
  </section>
 );
 if (!state) return <p role="alert" className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">{error || (ar ? "تعذر تحميل المباراة." : "Could not load match.")}</p>;

 const winner = state.members.find(member => member.userId === state.winnerId);
 const opponent = state.members.find(member => !member.isMe);
 const remaining = Math.max(0, characters.length - eliminated.size);
 const progress = characters.length ? (eliminated.size / characters.length) * 100 : 0;

 return (
  <section dir={ar ? "rtl" : "ltr"} aria-label={ar ? "منطقة اللعب الأونلاين" : "Online game area"} className="arena-shell relative mt-7 overflow-hidden rounded-[2rem] p-3 sm:p-5 lg:p-7">
   <div className="pointer-events-none absolute inset-0 -z-0 arena-grid-bg opacity-40" />
   <div className="relative z-10 space-y-5">
    <header className="arena-panel-strong overflow-hidden rounded-3xl bg-slate-950 p-5 text-white sm:p-7">
     <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
       <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-black tracking-widest text-violet-200"><span className={`size-2 rounded-full ${state.status === "IN_PROGRESS" ? "animate-pulse bg-emerald-400" : "bg-slate-400"}`} /> GUESS ARENA · {state.status === "COMPLETED" ? (ar ? "انتهت المباراة" : "MATCH COMPLETE") : "LIVE MATCH"}</div>
       <h2 className="mt-3 text-2xl font-black sm:text-3xl">{state.status === "COMPLETED" ? (ar ? "انتهى التحدي!" : "Challenge complete!") : myTurn ? (ar ? "دورك الآن، اختر حركتك" : "Your turn. Make your move.") : (ar ? "الخصم يفكر الآن..." : "Your opponent is thinking...")}</h2>
       <p className="mt-1 text-sm text-slate-300">{ar ? "اسأل سؤالًا ذكيًا أو خمّن الشخصية الصحيحة." : "Ask a smart question or guess the hidden character."}</p>
      </div>
      <div className="flex items-center gap-3">
       <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-center"><span className="block text-[10px] font-bold text-slate-400">{ar ? "رقم الدور" : "TURN"}</span><strong className="text-2xl font-black tabular-nums">{state.turnNumber}</strong></div>
       <button type="button" onClick={toggleSound} aria-pressed={soundEnabled} aria-label={soundEnabled ? (ar ? "إيقاف الصوت" : "Mute sounds") : (ar ? "تشغيل الصوت" : "Enable sounds")} className="grid size-11 place-items-center rounded-xl border border-white/10 bg-white/10 text-white transition hover:bg-white/20">{soundEnabled ? <Volume2 size={19}/> : <VolumeX size={19}/>}</button>
      </div>
     </div>
     <div className="mt-6 grid gap-2 sm:grid-cols-2">
      {state.members.map(member => <div key={member.userId} className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${member.isMe && myTurn ? "border-violet-300/40 bg-violet-500/20" : "border-white/10 bg-white/5"}`}>
       <div className="flex min-w-0 items-center gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/10 text-sm font-black">{member.isMe ? "1" : "2"}</span><div className="min-w-0"><p className="truncate text-sm font-extrabold">{member.name} {member.isMe ? (ar ? "(أنت)" : "(You)") : ""}</p><p className="text-[10px] text-slate-400">{member.isMe ? (ar ? "أنت" : "You") : (ar ? "الخصم" : "Opponent")}</p></div></div>
       <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${member.userId === state.currentTurnUserId && state.status === "IN_PROGRESS" ? "bg-teal-300 text-slate-950" : "bg-white/10 text-slate-300"}`}>{member.userId === state.currentTurnUserId && state.status === "IN_PROGRESS" ? (ar ? "يلعب الآن" : "Playing") : (ar ? "ينتظر" : "Waiting")}</span>
      </div>)}
     </div>
    </header>

    {state.status === "COMPLETED" && <div className="animate-feedback rounded-3xl border border-emerald-200 bg-emerald-50 p-5 sm:p-7"><div className="flex items-center gap-3"><span className="grid size-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><Trophy size={25}/></span><div><p className="text-xs font-black tracking-widest text-emerald-700">{ar ? "نتيجة المباراة" : "FINAL RESULT"}</p><h3 className="mt-1 text-xl font-black text-emerald-950">{winner?.isMe ? (ar ? "مبروك! أنت الفائز 🎉" : "Congratulations! You won 🎉") : (ar ? `الفائز: ${winner?.name ?? "لا يوجد"}` : `Winner: ${winner?.name ?? "None"}`)}</h3></div></div></div>}

    {state.status === "IN_PROGRESS" && <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
     <div className="min-w-0 space-y-5">
      <section className="arena-panel-strong rounded-3xl p-4 sm:p-5">
       <div className="flex flex-wrap items-end justify-between gap-3">
        <div><div className="flex items-center gap-2 text-violet-700"><Sparkles size={17}/><span className="text-[10px] font-black tracking-widest">{ar ? "خطوة التخمين" : "YOUR NEXT MOVE"}</span></div><h3 className="mt-1 text-xl font-black text-slate-950">{ar ? "اختر سؤالًا بنعم أو لا" : "Ask a yes-or-no question"}</h3></div>
        <span className={`rounded-full px-3 py-1.5 text-xs font-black ${myTurn ? "bg-teal-50 text-teal-700" : "bg-amber-50 text-amber-700"}`}>{myTurn ? (ar ? "دورك" : "Your turn") : (ar ? "انتظر دورك" : "Waiting for your turn")}</span>
       </div>
       <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{questions.map(question => {
        const used = asked.has(question.id);
        return <button key={question.id} type="button" disabled={!myTurn || busy || used} onClick={() => void send("ask", { questionId: question.id })} className="arena-interactive flex min-h-14 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-start text-sm font-bold text-slate-700 transition hover:border-violet-300 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40">
         <span>{ar ? question.labelAr : question.labelEn}</span><span className={`grid size-7 shrink-0 place-items-center rounded-lg text-xs font-black ${used ? "bg-emerald-100 text-emerald-700" : "bg-violet-100 text-violet-700"}`}>{used ? "✓" : "?"}</span>
        </button>;
       })}</div>
       {busy && <p className="mt-3 text-xs font-bold text-violet-700" role="status">{ar ? "جارٍ إرسال الحركة..." : "Submitting your move..."}</p>}
      </section>

      <section className="arena-panel-strong rounded-3xl p-3 sm:p-5">
       <div className="mb-4 flex flex-wrap items-end justify-between gap-3 px-1">
        <div><p className="text-[10px] font-black tracking-widest text-violet-600">{ar ? "لوحة التخمين" : "GUESS BOARD"}</p><h3 className="mt-1 text-xl font-black text-slate-950">{ar ? "من هي الشخصية؟" : "Who is the character?"}</h3><p className="mt-1 text-xs text-slate-500">{ar ? "اضغط على الشخصية لتأكيد تخمينك." : "Select a character to submit your guess."}</p></div>
        <div className="min-w-24 rounded-2xl bg-slate-950 px-4 py-2 text-center text-white"><span className="block text-[10px] font-bold text-slate-400">{ar ? "المتبقي" : "REMAINING"}</span><strong className="text-2xl font-black tabular-nums">{remaining}</strong></div>
       </div>
       <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-teal-400 transition-all duration-500" style={{ width: `${progress}%` }} /></div>
       <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 md:grid-cols-5 lg:grid-cols-6 2xl:grid-cols-9">{characters.map((character, index) => {
        const out = eliminated.has(character.id);
        return <button key={character.id} type="button" disabled={!myTurn || busy || out} onClick={() => void send("guess", { characterId: character.id })} aria-label={`${ar ? "خمّن الشخصية" : "Guess character"}: ${character.name}`} aria-pressed={out} className={`animate-card-enter group relative min-w-0 overflow-hidden rounded-2xl border p-2 text-center transition-all duration-200 ${out ? "border-slate-100 bg-slate-100 opacity-35 grayscale" : "arena-interactive border-slate-200 bg-white hover:border-violet-400 hover:bg-violet-50"} disabled:cursor-not-allowed`} style={{ animationDelay: `${Math.min(index, 20) * 12}ms` }}>
         <span className="mx-auto grid aspect-square w-full place-items-center rounded-xl bg-gradient-to-br from-violet-50 to-indigo-50 text-3xl sm:text-4xl">{character.avatar}</span>
         <span className="mt-1.5 block truncate text-[10px] font-extrabold text-slate-800 sm:text-xs">{character.name}</span>
         {out && <span className="pointer-events-none absolute inset-0 grid place-items-center"><span className="grid size-8 place-items-center rounded-full bg-slate-900/80 text-white">×</span></span>}
        </button>;
       })}</div>
      </section>
     </div>

     <aside className="space-y-5 xl:sticky xl:top-24">
      <section className="arena-panel rounded-3xl p-5">
       <div className="flex items-center gap-2"><Users size={18} className="text-teal-600"/><h3 className="font-black text-slate-950">{ar ? "حالة المباراة" : "Match overview"}</h3></div>
       <div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-2xl bg-slate-950 p-3 text-white"><span className="block text-[10px] font-bold text-slate-400">{ar ? "المتبقي" : "Remaining"}</span><strong className="mt-1 block text-2xl font-black">{remaining}</strong></div><div className="rounded-2xl bg-rose-50 p-3 text-rose-700"><span className="block text-[10px] font-bold text-rose-400">{ar ? "المستبعد" : "Eliminated"}</span><strong className="mt-1 block text-2xl font-black">{eliminated.size}</strong></div></div>
       <div className="mt-4 rounded-2xl bg-violet-50 p-3"><p className="text-xs font-black text-violet-800">{ar ? "تذكير سريع" : "Quick reminder"}</p><p className="mt-1 text-xs leading-6 text-violet-700">{ar ? "استخدم الأسئلة لتضييق الاختيارات، ثم خمّن الشخصية عندما تكون واثقًا." : "Narrow the choices with questions, then guess when you feel confident."}</p></div>
      </section>
      <section className="arena-panel rounded-3xl p-5">
       <div className="flex items-center gap-2"><History size={18} className="text-violet-600"/><h3 className="font-black text-slate-950">{ar ? "سجل المباراة" : "Match timeline"}</h3></div>
       <div className="mt-4 space-y-2">{state.actions.slice(-8).reverse().map(action => {
        const player = state.members.find(member => member.userId === action.actorId);
        const question = questions.find(item => item.id === action.questionId);
        return <div key={action.id} className="rounded-xl border border-slate-100 bg-white p-3">
         <p className="text-[10px] font-black text-slate-400">{player?.name ?? (ar ? "لاعب" : "Player")}</p>
         <p className="mt-1 text-xs font-bold leading-5 text-slate-700">{action.type === "QUESTION_ASKED" ? (ar ? question?.labelAr : question?.labelEn) : action.type === "GUESS_MADE" ? (ar ? "تخمين شخصية" : "Character guess") : (ar ? "تحديث المباراة" : "Match update")}</p>
         {action.type === "QUESTION_ASKED" && <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ${action.answer ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{action.answer ? (ar ? "نعم" : "Yes") : (ar ? "لا" : "No")}</span>}
         {action.type === "GUESS_MADE" && <span className="mt-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600">{action.correct ? (ar ? "تخمين صحيح" : "Correct guess") : (ar ? "تخمين خاطئ" : "Wrong guess")}</span>}
        </div>;
       })}{!state.actions.length && <p className="rounded-xl bg-slate-50 p-4 text-xs text-slate-400">{ar ? "ستظهر الحركات هنا." : "Moves will appear here."}</p>}</div>
      </section>
     </aside>
    </div>}

    {notice && <p role="status" aria-live="polite" className="animate-feedback rounded-2xl border border-teal-200 bg-teal-50 p-4 text-sm font-bold text-teal-800">{notice}</p>}
    {error && <div role="alert" aria-live="assertive" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700"><p className="min-w-0 flex-1">{error}</p><button type="button" onClick={() => { void refresh().then(() => setError("")).catch(() => setError(ar ? "لا يزال الاتصال غير مستقر. حاول مرة أخرى." : "Connection is still unavailable. Try again.")); }} className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-lg border border-rose-200 bg-white px-3 text-xs font-extrabold text-rose-700 transition hover:bg-rose-100 focus-visible:outline-2 focus-visible:outline-rose-500">{ar ? "تحديث المباراة" : "Refresh match"}</button></div>}
   </div>
  </section>
 );
}
