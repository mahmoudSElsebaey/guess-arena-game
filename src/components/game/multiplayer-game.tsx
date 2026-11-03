"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Maximize2, Minimize2, Volume2, VolumeX, Sparkles, Trophy, Users, History, Eye, Check, X, Palette, Glasses, UserRound, LoaderCircle, LogOut, Home, AlertTriangle } from "lucide-react";
import { useGameSounds } from "@/hooks/use-game-sounds";
import { CharacterPortrait } from "@/components/game/character-portrait";
import { useRouter } from "@/i18n/navigation";

type Action = { id:string; actorId:string; type:string; questionId:string|null; answer:boolean|null; characterId:string|null; correct:boolean|null; reason?:string|null; winnerId?:string|null; newRoomId?:string|null; createdAt:string };
type RoundResult = {id:string;round:number;actorId:string;winnerId:string|null;reason:string|null;createdAt:string};
type Snapshot = { id:string; code:string; status:string; version:number; hostId:string; isHost:boolean; startedAt:string|null; currentTurnUserId:string|null; turnNumber:number; winnerId:string|null; mySecretCharacterId:string|null; members:{userId:string;name:string;isMe:boolean;seat:number;isReady:boolean;isConnected:boolean;hasSecretCharacter:boolean}[]; myEliminatedCharacterIds:string[]; actions:Action[]; roundHistory:RoundResult[] };
type CharacterOption = { id:string; name:string; avatar:string; attributes:Record<string,string|boolean> };
type QuestionOption = { id:string; labelAr:string; labelEn:string; attributeKey:string; expectedValue:string|boolean; category:{slug:string;nameAr:string;nameEn:string}; sortOrder:number };
type Feedback = { answer:boolean; id:string } | null;
type Toast = { id:number; message:string; tone:"success"|"error"|"warning"|"info" };

export function MultiplayerGame({roomId,locale,characters,questions}:{roomId:string;locale:"ar"|"en";characters:CharacterOption[];questions:QuestionOption[]}) {
 const ar=locale==="ar";
 const router=useRouter();
 const [state,setState]=useState<Snapshot|null>(null);
 const [busy,setBusy]=useState(false);
 const [leaveDestination,setLeaveDestination]=useState<"room"|"home"|null>(null);
 const [leaving,setLeaving]=useState(false);
 const [pendingCards,setPendingCards]=useState<string[]>([]);
 const [optimisticEliminated,setOptimisticEliminated]=useState<string[]>([]);
 const [error,setError]=useState("");
 const [toast,setToast]=useState<Toast|null>(null);
 const toastTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const notify=useCallback((message:string,tone:Toast["tone"]="info")=>{
  if(toastTimer.current)clearTimeout(toastTimer.current);
  setToast({id:Date.now(),message,tone});
  toastTimer.current=setTimeout(()=>setToast(null),3000);
 },[]);
 const [loading,setLoading]=useState(true);
 const [selectedCategory,setSelectedCategory]=useState("");
 const [selectedSecretCharacterId,setSelectedSecretCharacterId]=useState("");
 const [wildGuessMode,setWildGuessMode]=useState(false);
 const [selectedWildGuessId,setSelectedWildGuessId]=useState("");
 const [showWildGuessConfirm,setShowWildGuessConfirm]=useState(false);
 const [feedback,setFeedback]=useState<Feedback>(null);
 const [countdown,setCountdown]=useState<number|string|null>(null);
 const [isFullscreen,setIsFullscreen]=useState(false);
 const {soundEnabled,toggleSound,playSound}=useGameSounds();
 const previousVersion=useRef<number|null>(null);
 const lastFeedbackAction=useRef("");
 const lastGuessSoundAction=useRef("");
 const countdownStarted=useRef(false);
 const countdownTimer=useRef<number|null>(null);
 const soundRef=useRef(playSound);
 const feedbackTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const arenaRef=useRef<HTMLElement|null>(null);

 const refresh=useCallback(async()=>{
  const response=await fetch(`/api/rooms/${roomId}`,{cache:"no-store"});
  const data=await response.json();
  if(!response.ok)throw new Error(data.error);
  setState(data);
  setOptimisticEliminated(data.myEliminatedCharacterIds??[]);
 },[roomId]);

 useEffect(()=>{
  let mounted=true;
  const load=async()=>{try{await refresh();if(mounted)setError("");}catch{if(mounted)setError(ar?"تعذر تحميل المباراة. تحقق من الاتصال ثم أعد المحاولة.":"Could not load the match. Check your connection and retry.");}finally{if(mounted)setLoading(false);}};
  void load();
  const timer=window.setInterval(()=>{if(document.visibilityState==="visible")void load();},2500);
  return()=>{mounted=false;window.clearInterval(timer);if(feedbackTimer.current)clearTimeout(feedbackTimer.current);if(toastTimer.current)clearTimeout(toastTimer.current);if(countdownTimer.current)window.clearInterval(countdownTimer.current);};
 },[refresh,ar]);

 useEffect(()=>{
  if(!state)return;
  const latestQuestion=state.actions.filter(action=>action.type==="QUESTION_ASKED").slice(-1)[0];
  const latestGuess=state.actions.filter(action=>action.type==="GUESS_MADE").slice(-1)[0];
  if(previousVersion.current===null){
   previousVersion.current=state.version;
   lastFeedbackAction.current=latestQuestion?.id??"";
   lastGuessSoundAction.current=latestGuess?.id??"";
   return;
  }
  if(state.version>previousVersion.current){
   if(latestQuestion&&latestQuestion.id!==lastFeedbackAction.current&&latestQuestion.answer!==null){
    lastFeedbackAction.current=latestQuestion.id;
    setFeedback({answer:latestQuestion.answer,id:latestQuestion.id});
    if(feedbackTimer.current)clearTimeout(feedbackTimer.current);
    feedbackTimer.current=setTimeout(()=>setFeedback(null),2000);
    playSound(latestQuestion.answer?"yes":"no");
   }
   if(latestGuess&&latestGuess.id!==lastGuessSoundAction.current){
    lastGuessSoundAction.current=latestGuess.id;
    playSound(latestGuess.correct?(state.members.find(m=>m.isMe)?.userId===latestGuess.actorId?"win":"lose"):"eliminate");
   }
  }
  previousVersion.current=state.version;
 },[state,playSound]);

 useEffect(()=>{soundRef.current=playSound;},[playSound]);
 useEffect(()=>{setSelectedSecretCharacterId(state?.mySecretCharacterId??"");},[state?.mySecretCharacterId]);

 useEffect(()=>{
  if(!state||state.status!=="IN_PROGRESS"){
   countdownStarted.current=false;
   if(countdownTimer.current){window.clearInterval(countdownTimer.current);countdownTimer.current=null;}
   setCountdown(null);
   return;
  }
  if(countdownStarted.current)return;

  const countdownKey=state.startedAt?"guess-arena:countdown:"+roomId+":"+state.startedAt:null;
  if(countdownKey){
   try{
    if(window.localStorage.getItem(countdownKey)==="shown"){
     countdownStarted.current=true;
     setCountdown(null);
     return;
    }
    window.localStorage.setItem(countdownKey,"shown");
   }catch{
    // The in-memory guard still prevents duplicate countdowns if browser storage is unavailable.
   }
  }

  countdownStarted.current=true;
  setCountdown(5);
  let current=5;

  countdownTimer.current=window.setInterval(()=>{
   current-=1;
   if(current>0){
    setCountdown(current);
    soundRef.current("click");
   }else if(current===0){
    setCountdown(ar?"ابدأ!":"START");
    soundRef.current("question");
   }else{
    setCountdown(null);
    if(countdownTimer.current){
     window.clearInterval(countdownTimer.current);
     countdownTimer.current=null;
    }
   }
  },1000);

  return()=>{
   // Keep the countdown running across polling refreshes.
  };
 },[state?.status,state?.startedAt,roomId,ar]);

 useEffect(()=>{
  const update=()=>setIsFullscreen(Boolean(document.fullscreenElement));
  document.addEventListener("fullscreenchange",update);
  return()=>document.removeEventListener("fullscreenchange",update);
 },[]);

 const eliminated=useMemo(()=>new Set(optimisticEliminated),[optimisticEliminated]);
 const myId=state?.members.find(m=>m.isMe)?.userId;
 const myTurn=Boolean(myId&&state?.currentTurnUserId===myId);
 const asked=new Set((state?.actions??[]).filter(a=>a.type==="QUESTION_ASKED"&&a.actorId===myId).map(a=>a.questionId));
 const questionGroups=[
  {slug:"accessories",nameAr:"الإكسسوارات",nameEn:"Accessories",test:(key:string)=>/accessor|glass|hat|earring|necklace|beard|mustache|scar|mark|glasses|jewel|wear/i.test(key)},
  {slug:"skin",nameAr:"لون البشرة",nameEn:"Skin tone",test:(key:string)=>/skin|complexion|tone/i.test(key)},
  {slug:"gender",nameAr:"النوع",nameEn:"Gender",test:(key:string)=>/gender|sex/i.test(key)},
  {slug:"hair-length",nameAr:"طول الشعر",nameEn:"Hair length",test:(key:string)=>/hair.*(length|long|short)|length.*hair/i.test(key)},
  {slug:"hair-color",nameAr:"لون الشعر",nameEn:"Hair color",test:(key:string)=>/hair.*(color|colour)|color.*hair|colour.*hair/i.test(key)},
  {slug:"eyes",nameAr:"لون العين",nameEn:"Eye color",test:(key:string)=>/eye/i.test(key)}
 ];
 const categorizedQuestions=questionGroups.map(group=>({...group,items:questions.filter(q=>group.test(q.attributeKey)||group.test(q.category.slug))})).filter(group=>group.items.length>0);
 const activeCategory=categorizedQuestions.find(group=>group.slug===selectedCategory)??categorizedQuestions[0];
 const visibleQuestions=activeCategory?.items??[];
 const remainingCharacters=characters.filter(character=>!eliminated.has(character.id));
 const remaining=remainingCharacters.length;
 const progress=characters.length?(eliminated.size/characters.length)*100:0;
 const latestQuestionAction=state?.actions.filter(a=>a.type==="QUESTION_ASKED"&&a.actorId===myId).slice(-1)[0];
 const lastOwnQuestionIndex=state?.actions.map(a=>a.type==="QUESTION_ASKED"&&a.actorId===myId).lastIndexOf(true)??-1;
 const lastOwnConfirmationIndex=state?.actions.map(a=>a.type==="TURN_CONFIRMED"&&a.actorId===myId).lastIndexOf(true)??-1;
 const hasPendingQuestion=lastOwnQuestionIndex>lastOwnConfirmationIndex;
 const canFlip=myTurn&&hasPendingQuestion;
 const hasUsedWildGuess=Boolean(state?.actions.some(action=>action.type==="GUESS_MADE"&&action.actorId===myId));
 const selectedWildGuessCharacter=characters.find(character=>character.id===selectedWildGuessId);
 const latestQuestion=questions.find(q=>q.id===latestQuestionAction?.questionId);
 const winner=state?.members.find(member=>member.userId===state.winnerId);
 const myMember=state?.members.find(member=>member.isMe);
 const bothReady=Boolean(state?.members.length===2&&state.members.every(member=>member.isReady&&member.hasSecretCharacter));
 const opponentLeft=state?.actions.some(action=>action.type==="GAME_FINISHED"&&action.reason==="PLAYER_LEFT")??false;
 const wrongGuess=state?.actions.some(action=>action.type==="GAME_FINISHED"&&action.reason==="WRONG_GUESS")??false;
 const rematchEvents=state?.actions.filter(action=>action.type==="GAME_FINISHED"&&action.reason?.startsWith("REMATCH_"))??[];
 const rematchRequest=rematchEvents.find(action=>action.reason==="REMATCH_REQUESTED");
 const rematchResolved=rematchEvents.slice(-1)[0];
 const rematchPending=Boolean(rematchRequest&&(!rematchResolved||rematchResolved.id===rematchRequest.id));
 const requestedByMe=rematchRequest?.actorId===myId;

 async function confirmLeave(){
  if(!leaveDestination||leaving)return;
  setLeaving(true);
  try{
   const response=await fetch(`/api/rooms/${roomId}/leave`,{method:"POST"});
   const data=await response.json().catch(()=>({}));
   if(!response.ok)throw new Error(data.error||"LEAVE_FAILED");
   const destination=leaveDestination;
   setLeaveDestination(null);
   router.replace(destination==="home"?"/":"/play");
  }catch(e){
   notify(e instanceof Error?e.message:(ar?"تعذر مغادرة الغرفة. حاول مرة أخرى.":"Could not leave the room. Try again."),"error");
  }finally{setLeaving(false);}
 }


 async function requestRematch(){
  if(busy)return;
  setBusy(true);
  try{
   const response=await fetch(`/api/rooms/${roomId}/rematch-request`,{method:"POST"});
   const data=await response.json();
   if(!response.ok)throw new Error(data.error||"REMATCH_FAILED");
   await refresh();
  }catch(e){notify(e instanceof Error?e.message:(ar?"تعذر طلب إعادة المباراة.":"Could not request a rematch."),"error");}
  finally{setBusy(false);}
 }
 async function respondRematch(accept:boolean){
  if(busy)return;
  setBusy(true);
  try{
   const response=await fetch(`/api/rooms/${roomId}/rematch-response`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({accept})});
   const data=await response.json();
   if(!response.ok)throw new Error(data.error||"REMATCH_FAILED");
   if(!accept){router.replace("/play");return;}
   await refresh();
   notify(ar?"تمت الموافقة! اختارا شخصيتين جديدتين ثم ابدآ الجولة.":"Rematch accepted! Choose new characters and start the next round.","success");
  }catch(e){notify(e instanceof Error?e.message:(ar?"تعذر تنفيذ طلب إعادة المباراة.":"Could not process the rematch."),"error");}
  finally{setBusy(false);}
 }
 useEffect(()=>{
  if(state?.status==="COMPLETED"&&rematchResolved?.reason==="REMATCH_DECLINED")router.replace("/play");
 },[state?.status,rematchResolved?.reason,router]);

 async function setPlayerReady(isReady:boolean){
  if(busy||!state)return;
  if(isReady&&!selectedSecretCharacterId){notify(ar?"اختار شخصيتك السرية أولًا.":"Choose your secret character first.","warning");return;}
  setBusy(true);
  try{
   const response=await fetch(`/api/rooms/${roomId}/ready`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({isReady,secretCharacterId:isReady?selectedSecretCharacterId:undefined})});
   const data=await response.json().catch(()=>({}));
   if(!response.ok)throw new Error(data.error||"READY_FAILED");
   await refresh();
   notify(isReady?(ar?"أصبحت جاهزًا!":"You are ready!"):(ar?"يمكنك تغيير شخصيتك الآن.":"You can change your character now."),"success");
  }catch(e){notify(e instanceof Error?e.message:(ar?"تعذر تحديث الاستعداد.":"Could not update readiness."),"error");}
  finally{setBusy(false);}
 }
 async function startNewRound(){
  if(busy||!state?.isHost||!bothReady)return;
  setBusy(true);
  try{
   const response=await fetch(`/api/rooms/${roomId}/start`,{method:"POST"});
   const data=await response.json().catch(()=>({}));
   if(!response.ok)throw new Error(data.error||"NOT_READY");
   await refresh();
  }catch(e){notify(e instanceof Error?e.message:(ar?"تعذر بدء المباراة.":"Could not start the match."),"error");}
  finally{setBusy(false);}
 }
 async function toggleFullscreen(){
  try{
   if(!document.fullscreenElement)await arenaRef.current?.requestFullscreen();
   else await document.exitFullscreen();
  }catch{notify(ar?"المتصفح لم يسمح بوضع ملء الشاشة.":"Your browser did not allow fullscreen mode.","error");}
 }

 async function send(action:"ask"|"guess"|"wild-guess"|"eliminate"|"confirm",payload:Record<string,string|boolean>){
  setBusy(true);setError("");
  if(action==="ask")playSound("question");else if(action==="confirm")playSound("turn");else playSound("click");
  try{
   const response=await fetch(`/api/rooms/${roomId}/${action}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
   const data=await response.json();
   if(!response.ok){
    const messages:Record<string,string>={NOT_YOUR_TURN:ar?"انتظر دورك، لا يمكنك تنفيذ هذه الحركة الآن.":"Please wait for your turn.",ASK_BEFORE_FLIP:ar?"يجب أن تسأل سؤالًا أولًا قبل قلب البطاقات.":"Ask a question before flipping cards.",LAST_CHARACTER_REQUIRED:ar?"لا يمكنك قلب آخر شخصية متبقية.":"You cannot flip the last remaining character.",QUESTION_ALREADY_PENDING:ar?"لديك سؤال بانتظار إنهاء الدور.":"You already have a pending question.",QUESTION_ALREADY_ASKED:ar?"استخدمت هذا السؤال من قبل.":"You already asked this question.",INVALID_QUESTION:ar?"السؤال غير صالح.":"Invalid question.",CHARACTER_ELIMINATED:ar?"هذه الشخصية مستبعدة بالفعل.":"Character already eliminated.",GAME_NOT_ACTIVE:ar?"المباراة ليست نشطة.":"Match is not active.",ONE_CHARACTER_REQUIRED:ar?"لازم يتبقى كارت واحد فقط قبل التخمين.":"Only one remaining card can be guessed.",GUESS_ALREADY_USED:ar?"استخدمت فرصة التخمين المباشر بالفعل في هذه الجولة.":"You already used your wild guess this round.",INVALID_CHARACTER:ar?"الشخصية غير متاحة.":"Character is unavailable."};
    throw new Error(messages[data.error]??(ar?"تعذر تنفيذ الحركة. حاول مرة أخرى.":"Could not submit the move. Try again."));
   }
   if(action==="ask"){
    notify(ar?(data.answer?"الإجابة: نعم":"الإجابة: لا"):(data.answer?"Answer: Yes":"Answer: No"),"success");
    // The persisted action triggers the shared two-second answer overlay for both players.
   }
   if(action==="confirm"){notify(ar?"تم تأكيد الدور، حان دور اللاعب الآخر.":"Turn confirmed. The other player is up.","success");}
   if(action==="eliminate"){
    notify(ar?(payload.eliminated?"تم قلب البطاقة. يمكنك استعادتها في أي وقت.":"تمت استعادة البطاقة."):(payload.eliminated?"Card flipped. You can restore it anytime.":"Card restored."),"success");
    playSound(payload.eliminated?"eliminate":"click");
   }
   if(action==="guess"||action==="wild-guess")notify(data.correct?(ar?"تخمين صحيح! فزت بالمباراة.":"Correct guess! You won."):(ar?"تخمين غير صحيح، انتهت المباراة لصالح خصمك.":"Incorrect guess. Your opponent wins."),data.correct?"success":"error");
   if(action==="wild-guess"){setWildGuessMode(false);setSelectedWildGuessId("");setShowWildGuessConfirm(false);}
   await refresh();
  }catch(e){notify(e instanceof Error?e.message:(ar?"حدث خطأ غير متوقع.":"Unexpected error."),"error");}
  finally{setBusy(false);}
 }

 if(loading&&!state)return <section className="mt-6 space-y-4" role="status" aria-live="polite"><div className="h-28 animate-pulse rounded-3xl bg-slate-200"/><div className="h-64 animate-pulse rounded-3xl bg-slate-100"/><span className="sr-only">{ar?"جارٍ تحميل المباراة...":"Loading match..."}</span></section>;
 if(!state)return <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-800"><p role="alert" className="font-bold">{error|| (ar?"تعذر تحميل المباراة.":"Could not load match.")}</p><button type="button" onClick={()=>void refresh()} className="mt-3 rounded-lg bg-white px-4 py-2 text-sm font-bold">{ar?"إعادة المحاولة":"Retry"}</button></div>;

 return <section ref={arenaRef} dir={ar?"rtl":"ltr"} aria-label={ar?"منطقة اللعب الأونلاين":"Online game area"} className="arena-game-stage relative isolate mt-5 min-h-[calc(100dvh-90px)] overflow-hidden rounded-[1.8rem] bg-[#0b1028] p-2 text-white sm:p-4 lg:p-5">
  {toast&&createPortal(<div key={toast.id} className="pointer-events-none fixed inset-x-0 top-4 z-[99998] flex justify-center px-3 sm:top-6" dir={ar?"rtl":"ltr"}>
   <div role={toast.tone==="error"?"alert":"status"} aria-live={toast.tone==="error"?"assertive":"polite"} className={`arena-toast-pop pointer-events-auto flex w-full max-w-lg items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-extrabold shadow-[0_18px_55px_rgba(0,0,0,.38)] backdrop-blur-xl ${toast.tone==="error"?"border-rose-300/40 bg-rose-950/95 text-rose-100":toast.tone==="warning"?"border-amber-300/40 bg-amber-950/95 text-amber-100":toast.tone==="success"?"border-emerald-300/40 bg-emerald-950/95 text-emerald-100":"border-sky-300/40 bg-slate-900/95 text-sky-100"}`}>
    <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${toast.tone==="error"?"bg-rose-400/20":toast.tone==="warning"?"bg-amber-400/20":toast.tone==="success"?"bg-emerald-400/20":"bg-sky-400/20"}`}>
     {toast.tone==="error"?<X size={19}/>:toast.tone==="warning"?<Eye size={19}/>:toast.tone==="success"?<Check size={19}/>:<Sparkles size={19}/>}
    </span>
    <p className="min-w-0 flex-1 leading-6">{toast.message}</p>
   </div>
  </div>,document.body)}
  <div className="pointer-events-none absolute inset-0 -z-10 opacity-40" style={{backgroundImage:"radial-gradient(circle at 15% 12%,rgba(139,92,246,.32),transparent 30%),radial-gradient(circle at 90% 80%,rgba(20,184,166,.22),transparent 28%),linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px)",backgroundSize:"auto,auto,32px 32px,32px 32px"}}/>
  <div className="relative z-10 space-y-4">
   <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#171b3c]/95 p-3 shadow-xl sm:p-4">
    <div className="flex min-w-0 items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-lime-300 to-emerald-400 text-[#10172c]"><Sparkles size={21}/></span><div className="min-w-0"><p className="text-[10px] font-black tracking-[.2em] text-lime-300">GUESS ARENA · LIVE DUEL</p><h2 className="truncate text-lg font-black sm:text-xl">{state.status==="WAITING"?(ar?"تجهيز المباراة":"Match setup"):state.status==="COMPLETED"?(ar?"انتهت المباراة":"Match complete"):myTurn?(ar?"دورك الآن!":"Your turn!"):(ar?"الخصم يفكر...":"Opponent's turn...")}</h2></div></div>
    <div className="flex flex-wrap items-center gap-2">
     <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center"><span className="block text-[9px] font-black text-white/40">{ar?"رقم الدور":"TURN"}</span><strong className="text-xl font-black text-white">{state.turnNumber}</strong></div>
     <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 sm:flex"><span className={`size-2 rounded-full ${myTurn?"animate-pulse bg-lime-300":"bg-amber-300"}`}/><span className="text-xs font-bold text-white/80">{myTurn?(ar?"دورك":"Your turn"):(ar?"انتظار الخصم":"Waiting")}</span></div>
     <button type="button" onClick={toggleSound} aria-pressed={soundEnabled} aria-label={soundEnabled?(ar?"إيقاف الصوت":"Mute sounds"):(ar?"تشغيل الصوت":"Enable sounds")} className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10">{soundEnabled?<Volume2 size={18}/>:<VolumeX size={18}/>}</button>
     <button type="button" onClick={()=>void toggleFullscreen()} aria-label={isFullscreen?(ar?"الخروج من ملء الشاشة":"Exit fullscreen"):(ar?"ملء الشاشة":"Enter fullscreen")} className="grid size-10 place-items-center rounded-xl border border-lime-300/25 bg-lime-300/10 text-lime-200 hover:bg-lime-300/20">{isFullscreen?<Minimize2 size={18}/>:<Maximize2 size={18}/>}</button>
    </div>
   </header>

   <div className="grid gap-2 sm:grid-cols-2">{state.members.map(member=><div key={member.userId} className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5 ${member.userId===state.currentTurnUserId&&state.status==="IN_PROGRESS"?"border-lime-300/40 bg-lime-300/10":"border-white/10 bg-[#171b3c]/80"}`}><div className="flex min-w-0 items-center gap-2.5"><span className="grid size-8 place-items-center rounded-lg bg-white/10 text-xs font-black">{member.isMe?"1":"2"}</span><p className="truncate text-sm font-extrabold text-white">{member.name}{member.isMe?(ar?" (أنت)":" (You)"):""}</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${member.userId===state.currentTurnUserId&&state.status==="IN_PROGRESS"?"bg-lime-300 text-[#11182d]":"bg-white/10 text-white/60"}`}>{member.userId===state.currentTurnUserId&&state.status==="IN_PROGRESS"?(ar?"يلعب الآن":"Playing"):(ar?"ينتظر":"Waiting")}</span></div>)}</div>


   {state.status==="WAITING"&&<section className="space-y-4">
    <div className="rounded-2xl border border-lime-300/25 bg-gradient-to-br from-[#202448] via-[#171b3c] to-[#102a32] p-4 sm:p-6">
     <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-[10px] font-black tracking-[.25em] text-lime-300">GUESS ARENA · {ar?"استعداد الجولة":"ROUND SETUP"}</p><h3 className="mt-2 text-2xl font-black text-white">{ar?"استعدوا لمواجهة جديدة!":"Get ready for a new duel!"}</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">{ar?"كل لاعب يختار شخصية سرية مختلفة عن الآخر ثم يضغط جاهز. صاحب الغرفة يبدأ المباراة بعد استعداد اللاعبين الاثنين.":"Each player chooses a secret character and marks ready. The room host starts once both players are ready."}</p></div>
      <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-center"><span className="block text-[9px] font-black text-white/40">{ar?"كود الغرفة":"ROOM CODE"}</span><strong className="text-xl font-black tracking-[.2em] text-lime-200">{state.code}</strong></div>
     </div>
     <div className="mt-5 grid gap-3 sm:grid-cols-2">{state.members.map(member=><div key={member.userId} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-3"><div className="min-w-0"><p className="truncate text-sm font-black text-white">{member.name}{member.isMe?(ar?" (أنت)":" (You)"):""}</p><p className="mt-1 text-[10px] text-white/45">{member.isMe&&member.hasSecretCharacter?(ar?"تم اختيار الشخصية السرية":"Secret character selected"):member.isMe?(ar?"لم تختر شخصية بعد":"No character selected"):member.hasSecretCharacter?(ar?"اختار شخصية سرية":"Secret character selected"):(ar?"ينتظر اختيار الشخصية":"Choosing a character")}</p></div><span className={`rounded-full px-3 py-1.5 text-[10px] font-black ${member.isReady?"bg-emerald-300/15 text-emerald-200":"bg-amber-300/15 text-amber-200"}`}>{member.isReady?(ar?"جاهز":"READY"):(ar?"غير جاهز":"NOT READY")}</span></div>)}
      {state.members.length<2&&<div className="rounded-xl border border-dashed border-white/15 bg-black/15 p-3 text-center text-xs font-bold text-white/50">{ar?"في انتظار انضمام اللاعب الثاني...":"Waiting for the second player to join..."}</div>}
     </div>
    </div>
    {state.members.length===2&&<div className="rounded-2xl border border-white/10 bg-[#171b3c]/95 p-3 sm:p-5">
     <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><p className="text-[10px] font-black tracking-[.2em] text-cyan-200">{ar?"اختر شخصيتك السرية":"YOUR SECRET CHARACTER"}</p><h4 className="mt-1 text-lg font-black text-white">{ar?"اختار شخصية واحدة فقط":"Choose exactly one character"}</h4></div><span className="rounded-full bg-white/5 px-3 py-1.5 text-[10px] font-bold text-white/55">{ar?"اختيارك مخفي عن الخصم":"Your choice stays hidden from your opponent"}</span></div>
     <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-9">{characters.map(character=><button key={character.id} type="button" disabled={busy||Boolean(myMember?.isReady)} onClick={()=>setSelectedSecretCharacterId(character.id)} aria-pressed={selectedSecretCharacterId===character.id} className={`min-w-0 overflow-hidden rounded-xl border p-1.5 text-center transition sm:rounded-2xl sm:p-2 ${selectedSecretCharacterId===character.id?"border-lime-300 bg-lime-300/15 shadow-[0_0_25px_rgba(190,242,100,.18)]":"border-white/10 bg-[#22264a] hover:border-lime-300/40"}`}>
      <span className="block aspect-[4/4.8] overflow-hidden rounded-lg bg-gradient-to-br from-violet-200 to-cyan-100"><CharacterPortrait name={character.name} attributes={character.attributes} className="h-full w-full"/></span><span className="mt-1 block truncate text-[10px] font-black text-white sm:text-xs">{character.name}</span>{selectedSecretCharacterId===character.id&&<span className="mt-1 inline-flex items-center gap-1 text-[9px] font-black text-lime-200"><Check size={12}/>{ar?"مختارة":"Selected"}</span>}
     </button>)}</div>
     <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs font-bold text-white/55">{myMember?.isReady?(ar?"أنت جاهز. يمكنك إلغاء الجاهزية لتغيير اختيارك.":"You are ready. Unready to change your choice."):(ar?"بعد اختيار الشخصية اضغط جاهز.":"Mark ready after selecting your character.")}</p>
      <button type="button" disabled={busy||(!myMember?.isReady&&!selectedSecretCharacterId)} onClick={()=>void setPlayerReady(!Boolean(myMember?.isReady))} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-lime-300 to-emerald-300 px-6 text-sm font-black text-[#102018] disabled:cursor-not-allowed disabled:opacity-40">{busy?<LoaderCircle size={17} className="animate-spin"/>:<Check size={17}/>}{myMember?.isReady?(ar?"إلغاء الجاهزية":"I'm not ready"):(ar?"أنا جاهز":"I'm ready")}</button>
     </div>
    </div>}
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
     <section className="rounded-2xl border border-white/10 bg-[#171b3c]/95 p-4 sm:p-5"><div className="flex items-center gap-2"><History size={18} className="text-violet-200"/><h4 className="font-black text-white">{ar?"نتائج الجولات السابقة":"Previous round results"}</h4></div>
      <div className="mt-3 space-y-2">{(state.roundHistory??[]).slice().reverse().map(round=>{const roundWinner=state.members.find(member=>member.userId===round.winnerId);return <div key={round.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/5 bg-[#0e1431] p-3"><div><p className="text-[10px] font-black text-white/45">{ar?`الجولة ${round.round}`:`ROUND ${round.round}`}</p><p className="mt-1 text-sm font-bold text-white">{roundWinner?(ar?`الفائز: ${roundWinner.name}`:`Winner: ${roundWinner.name}`):(ar?"لا يوجد فائز":"No winner")}</p></div><span className={`rounded-full px-3 py-1 text-[10px] font-black ${round.reason==="PLAYER_LEFT"?"bg-amber-300/15 text-amber-200":"bg-emerald-300/15 text-emerald-200"}`}>{round.reason==="PLAYER_LEFT"?(ar?"انسحاب":"Forfeit"):(ar?"انتهت":"Completed")}</span></div>})}{!state.roundHistory?.length&&<p className="rounded-xl bg-white/5 p-4 text-xs text-white/45">{ar?"لا توجد جولات سابقة حتى الآن.":"No previous rounds yet."}</p>}</div>
     </section>
     <aside className="rounded-2xl border border-white/10 bg-[#171b3c]/95 p-4"><h4 className="font-black text-white">{ar?"بدء المباراة":"Start the match"}</h4><p className="mt-2 text-xs leading-6 text-white/55">{state.isHost?(ar?"بمجرد جاهزية اللاعبين الاثنين يمكنك بدء الجولة الجديدة.":"You can start when both players are ready."):(ar?"في انتظار صاحب الغرفة ليبدأ المباراة بعد جاهزية الجميع.":"Waiting for the room host to start once everyone is ready.")}</p>{state.isHost&&<button type="button" disabled={busy||!bothReady} onClick={()=>void startNewRound()} className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-400 to-amber-300 px-4 text-sm font-black text-[#241509] disabled:cursor-not-allowed disabled:opacity-40"><Sparkles size={17}/>{ar?"ابدأ المباراة":"Start match"}</button>}<p className="mt-3 text-center text-[10px] font-bold text-white/40">{bothReady?(ar?"اللاعبان جاهزان":"Both players are ready"):(ar?"بانتظار جاهزية اللاعبين":"Waiting for both players")}</p></aside>
    </div>
   </section>}
   {state.status==="IN_PROGRESS"&&<div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_310px]">
    <div className="min-w-0 space-y-3">
     <section className="rounded-2xl border border-white/10 bg-[#171b3c]/95 p-3 sm:p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><p className="text-[10px] font-black tracking-[.2em] text-lime-300">{ar?"اسأل بذكاء":"ASK SMART"}</p><h3 className="text-base font-black text-white">{ar?"اختار فئة السؤال":"Choose a question category"}</h3></div><span className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold text-white/65">{myTurn?(hasPendingQuestion?(ar?"اقلب البطاقات ثم أكد إنهاء دورك":"Flip cards, then confirm your turn"):(ar?"اسأل أولًا لفتح البطاقات":"Ask first to unlock the board")):(ar?"انتظر دورك":"Wait for your turn")}</span></div>
      <div className="flex flex-wrap gap-2">{categorizedQuestions.map(category=>{const active=category.slug===activeCategory?.slug;const Icon=category.slug==="accessories"?Glasses:category.slug==="eyes"?Eye:category.slug==="gender"?UserRound:Palette;return <button key={category.slug} type="button" onClick={()=>setSelectedCategory(category.slug)} className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-black transition ${active?"border-lime-300/50 bg-lime-300/15 text-lime-200":"border-white/10 bg-white/5 text-white/65 hover:bg-white/10"}`}><Icon size={15}/>{ar?category.nameAr:category.nameEn}<span className="rounded-md bg-black/20 px-1.5 py-0.5 text-[10px]">{category.items.length}</span></button>})}</div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{visibleQuestions.map(question=>{const used=asked.has(question.id);return <button key={question.id} type="button" disabled={busy||used||hasPendingQuestion} onClick={()=>{if(!myTurn){notify(ar?"انتظر دورك، لا يمكنك تنفيذ حركة خارج دورك.":"Please wait for your turn.","warning");return;}void send("ask",{questionId:question.id});}} className="flex min-h-12 items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#0e1431] px-3 py-2 text-start text-xs font-bold text-white/85 transition hover:border-lime-300/40 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"><span>{ar?question.labelAr:question.labelEn}</span><span className={`grid size-6 shrink-0 place-items-center rounded-lg text-[10px] ${used?"bg-emerald-300/15 text-emerald-200":"bg-violet-400/15 text-violet-200"}`}>{used ? <Check size={14}/> : "?"}</span></button>})}</div>
      {busy&&<p role="status" className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-lime-200"><LoaderCircle size={14} className="animate-spin"/>{ar?"جارٍ تنفيذ الحركة...":"Processing move..."}</p>}
     </section>

     <section className="rounded-2xl border border-white/10 bg-[#171b3c]/95 p-3 sm:p-4">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-black tracking-[.2em] text-cyan-200">{ar?"لوحة الشخصيات":"CHARACTER BOARD"}</p><h3 className="text-lg font-black text-white">{ar?"اقلب البطاقات غير المطابقة":"Flip characters that don't match"}</h3><p className="mt-1 text-[11px] text-white/45">{ar?"اسأل أولًا، ثم اقلب البطاقات التي تريدها، وبعدها أكد إنهاء دورك.":"Ask first, flip as many cards as you want, then confirm your turn."}</p></div><div className="rounded-xl border border-white/10 bg-[#0b1028] px-4 py-2 text-center"><span className="block text-[9px] font-black text-white/40">{ar?"الشخصيات المتبقية":"REMAINING"}</span><strong className="text-2xl font-black text-white">{remaining}<span className="text-xs text-white/35"> / {characters.length}</span></strong></div></div>
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-violet-400 via-cyan-300 to-lime-300 transition-all duration-500" style={{width:`${progress}%`}}/></div>
      {canFlip&&<div className="mb-4 flex justify-end"><button type="button" disabled={busy} onClick={()=>void send("confirm",{})} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 to-orange-400 px-5 text-sm font-black text-[#21152a] shadow-lg shadow-orange-300/15 transition hover:-translate-y-0.5 disabled:opacity-40"><Check size={17}/>{ar?"تأكيد إنهاء الدور":"Confirm and end turn"}</button></div>}
      {remaining===1&&<div className="arena-last-character-banner mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl p-3"><div><p className="text-sm font-black text-lime-100">{ar?"بقيت شخصية واحدة فقط!":"Only one character remains!"}</p><p className="mt-1 text-[11px] text-white/65">{ar?"كل تركيزك على البطاقة المضيئة. هل هي الشخصية السرية؟":"All eyes on the glowing card. Is it the secret character?"}</p></div><div className="flex items-center gap-3"><Sparkles className="text-lime-200" size={25}/><button type="button" disabled={!myTurn||busy||wildGuessMode} onClick={()=>void send("guess",{characterId:remainingCharacters[0].id})} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-lime-300 to-emerald-400 px-4 text-xs font-black text-[#10182b] shadow-lg shadow-lime-300/15 disabled:opacity-35"><Trophy size={15}/>{ar?"تخمين الشخصية الأخيرة":"Guess the last character"}</button></div></div>}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 md:grid-cols-5 lg:grid-cols-6 2xl:grid-cols-9">{characters.map((character,index)=>{
       const out=eliminated.has(character.id);
       const matchesAnswer=latestQuestion&&latestQuestionAction?.answer!==null&&latestQuestionAction?.answer!==undefined?(character.attributes[latestQuestion.attributeKey]===latestQuestion.expectedValue)===latestQuestionAction.answer:false;
       const showAnswerFeedback=hasPendingQuestion;
       const wrongFlip=out&&showAnswerFeedback&&Boolean(matchesAnswer);
              return <button key={character.id} type="button" disabled={pendingCards.includes(character.id)||(remaining===1&&!out&&!wildGuessMode)} onClick={()=>{if(!myTurn){notify(ar?"انتظر دورك":"Please wait for your turn.","warning");return;}if(wildGuessMode){if(out){notify(ar?"لا يمكنك تخمين شخصية مستبعدة.":"You cannot guess an eliminated character.","warning");return;}setSelectedWildGuessId(character.id);return;}if(!hasPendingQuestion){notify(ar?"يجب أن تسأل سؤالًا أولًا قبل قلب أي صورة":"You must ask a question before flipping any card.","warning");return;}if(!out&&remaining===1){notify(ar?"لا يمكنك قلب آخر صورة متبقية":"You cannot flip the last remaining card.","warning");return;}const next=out?optimisticEliminated.filter(id=>id!==character.id):[...optimisticEliminated,character.id];setOptimisticEliminated(next);setPendingCards(ids=>[...ids,character.id]);void fetch(`/api/rooms/${roomId}/eliminate`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({characterId:character.id,eliminated:!out})}).then(async response=>{const data=await response.json();if(!response.ok)throw new Error(data.error);setOptimisticEliminated(data.eliminatedCharacterIds??next);playSound(!out?"eliminate":"click");}).catch(e=>{setOptimisticEliminated(current=>out?[...current,character.id]:current.filter(id=>id!==character.id));notify(e instanceof Error?e.message:(ar?"تعذر قلب الصورة":"Could not flip card"),"error");}).finally(()=>setPendingCards(ids=>ids.filter(id=>id!==character.id)));}} aria-pressed={out} aria-label={out?(ar?`استعادة ${character.name}`:`Restore ${character.name}`):(ar?`قلب ${character.name}`:`Flip ${character.name}`)} className={`group relative min-w-0 overflow-hidden rounded-xl border p-1.5 text-center transition-all duration-100 sm:rounded-2xl sm:p-2 ${remaining===1&&!out?"arena-last-character":""} ${wildGuessMode&&selectedWildGuessId===character.id?"arena-wild-selected":""} ${out?(showAnswerFeedback?(wrongFlip?"border-rose-400 bg-rose-950/60":"border-emerald-400 bg-emerald-950/55"):"border-white/10 bg-[#090d21] opacity-55 grayscale"):"border-white/10 bg-[#22264a] hover:-translate-y-1 hover:border-lime-300/45 hover:bg-[#2a3158]"}`} style={{animationDelay:`${Math.min(index,30)*10}ms`}}>
        <span className={`relative block aspect-[4/4.8] overflow-hidden rounded-lg ${out?"bg-slate-900":"bg-gradient-to-br from-violet-200 to-cyan-100"}`}><CharacterPortrait name={character.name} attributes={character.attributes} className="h-full w-full"/>{out&&<span className={`absolute inset-0 grid place-items-center ${showAnswerFeedback?(wrongFlip?"bg-rose-950/65":"bg-emerald-950/60"):"bg-slate-950/55"}`}><span className={`grid size-12 place-items-center rounded-full border-2 text-white shadow-2xl ${showAnswerFeedback?(wrongFlip?"border-rose-300 bg-rose-500/90":"border-emerald-200 bg-emerald-500/90"):"border-white/20 bg-slate-600/80"}`}>{wrongFlip?<X size={30} strokeWidth={3}/>:<Check size={27} strokeWidth={3}/>}</span></span>}</span>
        <span className="mt-1.5 block truncate text-[10px] font-black text-white sm:text-xs">{character.name}</span><span className={`mt-1 block text-[9px] font-black ${out?(wrongFlip?"text-rose-200":"text-emerald-200"):"text-white/35"}`}>{out?(showAnswerFeedback?(wrongFlip?(ar?"استبعاد غير صحيح":"Incorrect elimination"):(ar?"استبعاد صحيح":"Correct elimination")):(ar?"مستبعد · استعادة":"Eliminated · restore")):(ar?"اضغط للقلب":"Tap to flip")}</span>
       </button>;
      })}</div>
      <div className={`arena-wild-guess-panel mt-5 rounded-2xl border p-4 sm:p-5 ${wildGuessMode?"arena-wild-guess-active":""}`}>
       <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
         <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-amber-200/25 bg-amber-300/10 text-amber-200"><Trophy size={21}/></span>
         <div><p className="text-sm font-black text-amber-100">{ar?"تخمين جريء":"WILD GUESS"}</p><p className="mt-1 text-[11px] leading-5 text-white/55">{hasUsedWildGuess?(ar?"استخدمت فرصتك الوحيدة في هذه الجولة.":"Your one wild guess has been used this round."):(ar?"خمن أي شخصية متبقية مرة واحدة دون سؤال أو انتظار استكمال الدور.":"Guess any remaining character once, without asking a question or finishing the turn.")}</p></div>
        </div>
        <span className={`rounded-full px-3 py-1.5 text-[10px] font-black ${hasUsedWildGuess?"bg-white/10 text-white/45":"bg-amber-300/15 text-amber-100"}`}>{hasUsedWildGuess?(ar?"تم الاستخدام":"USED"):(ar?"فرصة واحدة":"1 CHANCE")}</span>
       </div>
       {!hasUsedWildGuess&&<div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" disabled={!myTurn||busy||remaining===0} onClick={()=>{setWildGuessMode(value=>!value);setSelectedWildGuessId("");}} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-amber-200/30 bg-gradient-to-r from-amber-300/20 to-orange-400/15 px-5 text-sm font-black text-amber-100 transition hover:border-amber-200/55 hover:shadow-[0_0_25px_rgba(251,191,36,.16)] disabled:cursor-not-allowed disabled:opacity-35"><Trophy size={16}/>{wildGuessMode?(ar?"إلغاء التخمين":"Cancel wild guess"):(ar?"تفعيل التخمين المباشر":"Try a wild guess")}</button>
        {wildGuessMode&&<span className="text-xs font-bold text-amber-100/75">{ar?"اضغط على أي صورة متبقية لاختيارها":"Select any remaining character on the board"}</span>}
       </div>}
       {wildGuessMode&&selectedWildGuessCharacter&&<div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200/25 bg-black/20 p-3">
        <p className="text-sm font-bold text-white">{ar?"اختيارك: ":"Your guess: "}<span className="text-amber-100">{selectedWildGuessCharacter.name}</span></p>
        <button type="button" disabled={busy} onClick={()=>setShowWildGuessConfirm(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 to-orange-400 px-5 text-sm font-black text-[#241509] shadow-lg shadow-orange-950/20 disabled:opacity-40"><Check size={16}/>{ar?"تأكيد التخمين":"Confirm guess"}</button>
       </div>}
       {wildGuessMode&&<p className="mt-3 text-[10px] font-bold leading-5 text-rose-200/80">{ar?"تنبيه: التخمين الخاطئ ينهي المباراة فورًا ويمنح الفوز لخصمك.":"Warning: a wrong guess ends the match immediately and awards the win to your opponent."}</p>}
      </div>
     </section>
    </div>

    <aside className="space-y-3 xl:sticky xl:top-4">
     <section className="rounded-2xl border border-white/10 bg-[#171b3c]/95 p-4"><div className="flex items-center gap-2"><Users size={17} className="text-cyan-200"/><h3 className="font-black text-white">{ar?"حالة المباراة":"Match status"}</h3></div><div className="mt-3 grid grid-cols-2 gap-2"><div className="rounded-xl bg-[#0b1028] p-3"><span className="text-[9px] font-black text-white/40">{ar?"المتبقي":"LEFT"}</span><strong className="mt-1 block text-2xl font-black text-white">{remaining}</strong></div><div className="rounded-xl bg-[#0b1028] p-3"><span className="text-[9px] font-black text-white/40">{ar?"المقلوب":"FLIPPED"}</span><strong className="mt-1 block text-2xl font-black text-white">{eliminated.size}</strong></div></div><p className="mt-3 rounded-xl bg-white/5 p-3 text-[11px] leading-6 text-white/55">{ar?"إجابات الأسئلة تساعدك في القرار فقط. أنت من يختار البطاقات التي تقلبها ويمكنك استعادتها.":"Answers are clues, not automatic moves. You decide which cards to flip and can restore any card."}</p></section>
     <section className="rounded-2xl border border-white/10 bg-[#171b3c]/95 p-4"><div className="flex items-center gap-2"><History size={17} className="text-violet-200"/><h3 className="font-black text-white">{ar?"سجل المباراة":"Match timeline"}</h3></div><div className="mt-3 space-y-2">{state.actions.slice(-10).reverse().map(action=>{const player=state.members.find(m=>m.userId===action.actorId);const question=questions.find(q=>q.id===action.questionId);return <div key={action.id} className="rounded-xl border border-white/5 bg-[#0e1431] p-3"><p className="text-[9px] font-black text-white/40">{player?.name??(ar?"لاعب":"Player")}</p><p className="mt-1 text-xs font-bold leading-5 text-white/85">{action.type==="QUESTION_ASKED"?(ar?question?.labelAr:question?.labelEn):action.type==="GUESS_MADE"?(ar?"تخمين الشخصية":"Character guess"):(ar?"تحديث المباراة":"Match update")}</p>{action.type==="QUESTION_ASKED"&&<span className={`mt-2 inline-flex rounded-full px-2 py-1 text-[9px] font-black ${action.answer?"bg-emerald-300/15 text-emerald-200":"bg-rose-300/15 text-rose-200"}`}>{action.answer?(ar?"نعم":"Yes"):(ar?"لا":"No")}</span>}</div>})}{!state.actions.length&&<p className="text-xs text-white/40">{ar?"ستظهر الحركات هنا.":"Moves will appear here."}</p>}</div></section>
     {state.status==="IN_PROGRESS"&&<section className="grid gap-2 rounded-2xl border border-white/10 bg-[#171b3c]/95 p-3">
      <button type="button" onClick={()=>setLeaveDestination("room")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-300/25 bg-rose-400/10 px-3 text-xs font-black text-rose-200 transition hover:border-rose-300/50 hover:bg-rose-400/15"><LogOut size={16}/>{ar?"مغادرة الغرفة":"Leave room"}</button>
      <button type="button" onClick={()=>setLeaveDestination("home")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-black text-white/80 transition hover:bg-white/10"><Home size={16}/>{ar?"الصفحة الرئيسية":"Home page"}</button>
     </section>}
     <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#171b3c]/80 p-3 text-[10px] font-semibold leading-5 text-white/45"><Eye size={15} className="shrink-0 text-lime-200"/>{ar?"شخصيتك السرية لا تظهر هنا ولا يتم كشفها للخصم.":"Your opponent's secret character is never exposed here."}</div>
    </aside>
   </div>}

   {error&&<div role="alert" aria-live="assertive" className="sr-only">{error}</div>}
  </div>
  {state.status==="COMPLETED"&&!rematchPending&&<div className="fixed inset-0 z-[99999] grid place-items-center overflow-y-auto bg-[#070a1c]/90 p-4 backdrop-blur-xl"><div className={`arena-feedback-pop my-auto w-full max-w-lg rounded-[2rem] border p-6 text-center shadow-[0_30px_120px_rgba(0,0,0,.65)] sm:p-9 ${winner?.isMe?"border-emerald-300/40 bg-gradient-to-br from-[#103c32] via-[#123b36] to-[#102a32]":"border-rose-300/40 bg-gradient-to-br from-[#451f36] via-[#351d36] to-[#211d3b]"}`}><div className={`mx-auto grid size-24 place-items-center rounded-[2rem] ${winner?.isMe?"bg-emerald-300/15 text-emerald-200":"bg-rose-300/15 text-rose-200"}`}><Trophy size={54}/></div><p className={`mt-5 text-xs font-black tracking-[.3em] ${winner?.isMe?"text-emerald-200":"text-rose-200"}`}>GUESS ARENA · RESULT</p><h2 className="mt-3 text-3xl font-black text-white">{opponentLeft?(ar?"صديقك انسحب من المباراة":"Your opponent left the match"):winner?.isMe?(ar?"مبروك! أنت الفائز 🎉":"Congratulations! You won 🎉"):(ar?"حظ أوفر في المرة القادمة":"Better luck next time")}</h2><p className="mt-3 text-sm font-bold leading-7 text-white/75">{opponentLeft?(ar?"انتهت المباراة لأن اللاعب الآخر غادر الغرفة أو ضغط على مغادرة المباراة. تم احتساب الفوز لك.":"The match ended because your opponent left the room or chose to leave the match. The win has been awarded to you."):wrongGuess?(winner?.isMe?(ar?"خصمك أخطأ في تخمين شخصيتك، ولذلك فزت بالمباراة!":"Your opponent guessed incorrectly, so you win!"): (ar?"لقد أخطأت في تخمين الشخصية الأخيرة، ولذلك فاز خصمك.":"Your final guess was incorrect, so your opponent wins.")):winner?.isMe?(ar?"أحسنت! لقد استطعت اكتشاف شخصية صديقك قبل أن يتوقع شخصيتك.":"Great job! You guessed your friend character before they could guess yours."):(ar?`صديقك ${winner?.name??""} استطاع توقع شخصيتك قبلك. لا تستسلم، الجولة القادمة فرصتك!`:`Your friend ${winner?.name??""} guessed your character before you could guess theirs. The next round is yours!`)}</p><div className={`mt-5 inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-black ${winner?.isMe?"bg-emerald-300/15 text-emerald-100":"bg-rose-300/15 text-rose-100"}`}><Sparkles size={16}/>{winner?.isMe?(ar?"انتصار مستحق":"Well played"):(ar?"المنافسة لم تنته بعد":"The rivalry continues")}</div><div className={`mt-8 grid gap-3 ${opponentLeft?"":"sm:grid-cols-2"}`}>{!opponentLeft&&<button type="button" disabled={busy} onClick={()=>void requestRematch()} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-gradient-to-r from-orange-400 to-amber-300 px-4 text-sm font-black text-[#241509] disabled:opacity-50">{ar?"إعادة المباراة":"Rematch"}</button>}<a href={`/${locale}`} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-black text-white transition hover:bg-white/15">{ar?"العودة للصفحة الرئيسية":"Back to home"}</a></div></div></div>}
  {rematchPending&&state.status==="COMPLETED"&&createPortal(<div className="fixed inset-0 z-[99999] grid place-items-center bg-[#070a1c]/90 p-4 backdrop-blur-xl" dir={ar?"rtl":"ltr"}><div role="alertdialog" aria-modal="true" className="arena-feedback-pop w-full max-w-md rounded-[2rem] border border-lime-300/30 bg-gradient-to-br from-[#242044] via-[#171b3c] to-[#102a32] p-7 text-center shadow-[0_30px_120px_rgba(0,0,0,.7)]"><div className="mx-auto grid size-20 place-items-center rounded-[1.7rem] border border-lime-200/25 bg-lime-300/10 text-lime-200"><Trophy size={38}/></div><p className="mt-5 text-[10px] font-black tracking-[.3em] text-lime-300">GUESS ARENA · REMATCH</p><h2 className="mt-3 text-2xl font-black text-white">{requestedByMe?(ar?"تم إرسال طلب إعادة المباراة":"Rematch request sent"):(ar?"خصمك يطلب إعادة المباراة":"Your opponent wants a rematch")}</h2><p className="mt-3 text-sm font-bold leading-7 text-white/65">{requestedByMe?(ar?"في انتظار موافقة اللاعب الآخر.":"Waiting for the other player to respond."):(ar?"هل توافق على بدء جولة جديدة؟ سيتم اختيار الشخصيات السرية من البداية.":"Accept to start a fresh round. Both players will choose new secret characters.")}</p>{!requestedByMe&&<div className="mt-7 grid gap-3 sm:grid-cols-2"><button type="button" disabled={busy} onClick={()=>void respondRematch(true)} className="min-h-12 rounded-xl bg-gradient-to-r from-lime-300 to-emerald-300 px-4 text-sm font-black text-[#102018] disabled:opacity-50">{ar?"موافق، نعيد المباراة":"Accept rematch"}</button><button type="button" disabled={busy} onClick={()=>void respondRematch(false)} className="min-h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-black text-white disabled:opacity-50">{ar?"رفض والعودة للعب":"Decline"}</button></div>}</div></div>,document.body)}
  {showWildGuessConfirm&&selectedWildGuessCharacter&&createPortal(<div className="fixed inset-0 z-[99999] grid place-items-center bg-[#070a1c]/90 p-4 backdrop-blur-xl" dir={ar?"rtl":"ltr"}>
   <div role="alertdialog" aria-modal="true" aria-labelledby="wild-guess-title" aria-describedby="wild-guess-description" className="arena-feedback-pop w-full max-w-md rounded-[2rem] border border-amber-200/35 bg-gradient-to-br from-[#3b2a19] via-[#242044] to-[#171b3c] p-6 text-center shadow-[0_30px_120px_rgba(0,0,0,.75)] sm:p-8">
    <div className="mx-auto grid size-20 place-items-center rounded-[1.7rem] border border-amber-200/30 bg-amber-300/10 text-amber-200"><AlertTriangle size={39}/></div>
    <p className="mt-5 text-[10px] font-black tracking-[.3em] text-amber-200">GUESS ARENA · FINAL CHANCE</p>
    <h2 id="wild-guess-title" className="mt-3 text-2xl font-black text-white">{ar?"هل أنت متأكد من تخمينك؟":"Lock in your wild guess?"}</h2>
    <p id="wild-guess-description" className="mt-3 text-sm font-bold leading-7 text-white/70">{ar?<>أنت تختار <strong className="text-amber-100">{selectedWildGuessCharacter.name}</strong>. لو الشخصية غلط، المباراة هتنتهي فورًا والخصم هيفوز. لن تستطيع استخدام فرصة التخمين مرة أخرى.</>:<>You selected <strong className="text-amber-100">{selectedWildGuessCharacter.name}</strong>. If you are wrong, the match ends immediately and your opponent wins. This one-time chance cannot be used again.</>}</p>
    <div className="mt-7 grid gap-3 sm:grid-cols-2">
     <button type="button" disabled={busy} onClick={()=>void send("wild-guess",{characterId:selectedWildGuessCharacter.id})} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 to-orange-400 px-4 text-sm font-black text-[#241509] shadow-lg shadow-orange-950/30 disabled:opacity-50"><Trophy size={17}/>{ar?"نعم، خمن الآن":"Yes, make the guess"}</button>
     <button type="button" disabled={busy} onClick={()=>setShowWildGuessConfirm(false)} className="min-h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-black text-white transition hover:bg-white/10 disabled:opacity-50">{ar?"رجوع للمباراة":"Go back"}</button>
    </div>
   </div>
  </div>,document.body)}
  {leaveDestination&&createPortal(<div className="fixed inset-0 z-[99996] grid place-items-center overflow-y-auto bg-[#070a1c]/85 p-4 backdrop-blur-md" dir={ar?"rtl":"ltr"}>
   <div role="alertdialog" aria-modal="true" aria-labelledby="leave-dialog-title" aria-describedby="leave-dialog-description" className="arena-feedback-pop my-auto w-full max-w-md rounded-[2rem] border border-orange-300/30 bg-gradient-to-br from-[#242044] via-[#171b3c] to-[#102a32] p-6 text-center shadow-[0_30px_120px_rgba(0,0,0,.7)] sm:p-8">
    <div className="mx-auto grid size-20 place-items-center rounded-[1.7rem] border border-orange-200/25 bg-orange-300/10 text-orange-200"><AlertTriangle size={38}/></div>
    <p className="mt-5 text-[10px] font-black tracking-[.3em] text-lime-300">GUESS ARENA · WARNING</p>
    <h2 id="leave-dialog-title" className="mt-3 text-2xl font-black text-white">{ar?"هل أنت متأكد من مغادرة الجولة؟":"Are you sure you want to leave?"}</h2>
    <p id="leave-dialog-description" className="mt-3 text-sm font-bold leading-7 text-white/65">{ar?"بمجرد التأكيد ستنسحب من الجولة الحالية، وستُحتسب المباراة لصالح اللاعب الآخر. لا يمكنك العودة إلى هذه الجولة بعد المغادرة.":"If you confirm, you will forfeit this match and the other player will be awarded the win. You cannot rejoin this round."}</p>
    <div className="mt-7 grid gap-3 sm:grid-cols-2">
     <button type="button" disabled={leaving} onClick={()=>void confirmLeave()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-400 to-amber-300 px-4 text-sm font-black text-[#241509] shadow-lg shadow-orange-950/30 transition hover:brightness-110 disabled:opacity-50"><LogOut size={17}/>{leaving?(ar?"جارٍ المغادرة...":"Leaving..."):(ar?"نعم، انسحب من الجولة":"Yes, leave match")}</button>
     <button type="button" disabled={leaving} onClick={()=>setLeaveDestination(null)} className="min-h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-black text-white transition hover:bg-white/10 disabled:opacity-50">{ar?"لا، استمر في اللعب":"No, keep playing"}</button>
    </div>
   </div>
  </div>,document.body)}
  {feedback&&<div className="pointer-events-none fixed inset-0 z-[99998] grid place-items-center"><div key={feedback.id} className={`animate-feedback grid size-44 place-items-center rounded-[2.5rem] border-4 shadow-[0_30px_100px_rgba(0,0,0,.5)] sm:size-56 ${feedback.answer?"border-emerald-200 bg-emerald-500/95 text-white":"border-rose-200 bg-rose-500/95 text-white"}`}><div className="text-center"><span className="grid size-20 place-items-center rounded-full bg-white/20 sm:size-24">{feedback.answer?<Check size={64} strokeWidth={4}/>:<X size={64} strokeWidth={4}/>}</span><p className="mt-3 text-2xl font-black">{feedback.answer?(ar?"نعم":"YES"):(ar?"لا":"NO")}</p></div></div></div>}
  {countdown!==null&&<div className="fixed inset-0 z-[99997] grid place-items-center bg-[#241509]/95 backdrop-blur-xl"><div className="text-center"><p className="text-xs font-black tracking-[.4em] text-lime-200">GUESS ARENA</p><div key={String(countdown)} className="arena-countdown-number mt-5 grid size-56 place-items-center rounded-[3rem] border-4 border-orange-200 bg-gradient-to-br from-orange-500 via-amber-400 to-lime-300 text-8xl font-black text-[#241509] shadow-[0_0_100px_rgba(163,230,53,.25)] sm:size-72 sm:text-9xl">{countdown}</div><p className="mt-6 text-sm font-black tracking-[.25em] text-white/65">{ar?"استعد للمواجهة":"GET READY TO DUEL"}</p></div></div>}
 </section>;
}
