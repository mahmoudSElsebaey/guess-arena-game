"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Crown, DoorOpen, Gamepad2, LoaderCircle, ShieldCheck, Sparkles, Users, WandSparkles, X } from "lucide-react";
import { MultiplayerGame } from "@/components/game/multiplayer-game";
import { CharacterPortrait } from "@/components/game/character-portrait";

type CharacterOption = { id: string; name: string; avatar: string; attributes: Record<string, string | boolean> };
type QuestionOption = { id: string; labelAr: string; labelEn: string; attributeKey: string; expectedValue: string | boolean; category: { slug: string; nameAr: string; nameEn: string }; sortOrder: number };
type Snapshot = {
  id: string; code: string; status: "WAITING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  isHost: boolean; version: number;
  members: { userId: string; name: string; seat: number; isReady: boolean; isConnected: boolean; isMe: boolean; hasSecretCharacter: boolean }[];
  mySecretCharacterId: string | null;
};

export function RoomLobby({ locale, mode = "both" }: { locale: "ar" | "en"; mode?: "both" | "create" | "join" }) {
  const ar = locale === "ar";
  const [code, setCode] = useState("");
  const [room, setRoom] = useState<Snapshot | null>(null);
  const [character, setCharacter] = useState("");
  const [characters, setCharacters] = useState<CharacterOption[]>([]);
  const [questions, setQuestions] = useState<QuestionOption[]>([]);
  const [contentLoading, setContentLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"connected" | "reconnecting">("connected");
  const [characterPickerOpen, setCharacterPickerOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    void fetch("/api/game/content", { cache: "no-store", signal: controller.signal })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        if (active) { setCharacters(data.characters ?? []); setQuestions(data.questions ?? []); }
      })
      .catch(() => { if (active) setError(ar ? "تعذر تحميل محتوى اللعبة. حدّث الصفحة وحاول مجددًا." : "Could not load game content. Refresh and try again."); })
      .finally(() => { window.clearTimeout(timeout); if (active) setContentLoading(false); });
    return () => { active = false; controller.abort(); window.clearTimeout(timeout); };
  }, [ar]);

  const refresh = useCallback(async (id: string) => {
    const response = await fetch(`/api/rooms/${id}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    setRoom(previous => {
      if (previous?.status === "COMPLETED" && data.status === "WAITING") setCharacter("");
      return data;
    });
    setSyncStatus("connected");
    setCharacter((current) => data.mySecretCharacterId ?? current);
  }, []);

  useEffect(() => {
    if (!room?.id) return;
    const roomId = room.id;
    let active = true;
    const sync = () => { if (active && document.visibilityState === "visible") void refresh(roomId).catch(() => { if (active) setSyncStatus("reconnecting"); }); };
    const timer = window.setInterval(sync, 2000);
    return () => { active = false; window.clearInterval(timer); };
  }, [room?.id, refresh]);

  const post = async (url: string, body?: unknown) => {
    const response = await fetch(url, { method: "POST", headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  };

  const run = async (fn: () => Promise<void>) => {
    setBusy(true); setError(""); setNotice("");
    try { await fn(); }
    catch (e) {
      const key = e instanceof Error ? e.message : "";
      const map: Record<string, string> = {
        UNAUTHORIZED: ar ? "سجّل الدخول أولًا." : "Please sign in first.",
        INVALID_ROOM_CODE: ar ? "كود الغرفة 6 أرقام." : "Room code must contain 6 digits.",
        ROOM_NOT_AVAILABLE: ar ? "الغرفة غير متاحة أو انتهت." : "Room unavailable or expired.",
        ROOM_FULL: ar ? "الغرفة مكتملة." : "Room is full.",
        NOT_READY: ar ? "يجب جاهزية اللاعبين واختيار الشخصيات." : "Both players must be ready and choose characters.",
        FORBIDDEN: ar ? "البدء متاح للمضيف فقط." : "Only the host can start."
      };
      setError(map[key] ?? (ar ? "حدث خطأ. حاول مجددًا." : "Something went wrong. Try again."));
    } finally { setBusy(false); }
  };

  const create = () => run(async () => { const data = await post("/api/rooms"); await refresh(data.roomId); });
  const join = () => run(async () => { const data = await post("/api/rooms/join", { code }); await refresh(data.roomId); });
  const ready = () => run(async () => {
    if (!room) return;
    await post(`/api/rooms/${room.id}/ready`, { isReady: !room.members.find(member => member.isMe)?.isReady, secretCharacterId: character });
    await refresh(room.id);
  });
  const start = () => run(async () => { if (!room) return; await post(`/api/rooms/${room.id}/start`); await refresh(room.id); });
  const leave = () => run(async () => { if (!room) return; await post(`/api/rooms/${room.id}/leave`); setRoom(null); setCharacter(""); });

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(room?.code ?? "");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch { setError(ar ? "تعذر نسخ الكود. انسخه يدويًا." : "Could not copy the code. Please copy it manually."); }
  };

  return (
    <section dir={ar ? "rtl" : "ltr"} aria-label={ar ? "غرف اللعب أونلاين" : "Online game rooms"} className="arena-shell relative isolate mx-auto my-7 w-full max-w-7xl overflow-hidden rounded-[2rem] px-4 py-6 sm:my-10 sm:px-7 sm:py-9">
      <div className="pointer-events-none absolute inset-0 -z-10 arena-grid-bg opacity-60" />
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-3 py-1.5 text-[11px] font-black tracking-wider text-violet-700"><Sparkles size={14} /> GUESS ARENA · LIVE</div>
          <h2 className="arena-section-title mt-3 text-3xl font-black tracking-tight sm:text-4xl">{ar ? "ساحة التحدي" : "The challenge arena"}</h2>
          <p className="mt-2 max-w-xl text-sm leading-7 text-slate-600">{ar ? "أنشئ غرفة خاصة أو انضم إلى صديق، واختبروا مهارات التخمين وجهًا لوجه." : "Create a private room or join a friend and put your guessing skills to the test."}</p>
        </div>
        <div className="hidden items-center gap-2 rounded-2xl border border-white/80 bg-white/70 px-4 py-3 text-xs font-bold text-slate-600 shadow-sm sm:flex"><ShieldCheck size={17} className="text-teal-600" />{ar ? "اختيارك السري يظل خاصًا" : "Your secret pick stays private"}</div>
      </div>

      {!room ? (
        <div className={mode === "both" ? "grid gap-4 lg:grid-cols-2" : "mx-auto grid max-w-2xl gap-4"}>
          {mode !== "join" && (
          <article className="arena-panel-strong arena-interactive relative overflow-hidden rounded-3xl p-5 sm:p-7">
            <div className="absolute -end-10 -top-12 size-40 rounded-full bg-violet-100/80 blur-2xl" />
            <div className="relative">
              <div className="grid size-12 place-items-center rounded-2xl bg-violet-100 text-violet-700"><Gamepad2 size={24} /></div>
              <h3 className="mt-5 text-xl font-black text-slate-950">{ar ? "أنشئ غرفة جديدة" : "Create a new room"}</h3>
              <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">{ar ? "ابدأ التحدي وادعُ صديقك بكود خاص. أنت ستكون مضيف الغرفة." : "Start a challenge and invite a friend with a private code. You will host the room."}</p>
              <button type="button" disabled={busy} onClick={create} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 font-extrabold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:bg-violet-800 disabled:cursor-wait disabled:opacity-50">
                {busy ? <LoaderCircle size={18} className="animate-spin" /> : <WandSparkles size={18} />}{ar ? "إنشاء غرفة ودعوة صديق" : "Create room & invite a friend"}
              </button>
            </div>
          </article>
          )}
          {mode !== "create" && <article className="arena-panel arena-interactive rounded-3xl p-5 sm:p-7">
            <div className="grid size-12 place-items-center rounded-2xl bg-teal-50 text-teal-700"><DoorOpen size={24} /></div>
            <h3 className="mt-5 text-xl font-black text-slate-950">{ar ? "انضم إلى غرفة" : "Join a room"}</h3>
            <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">{ar ? "هل وصلك كود الدعوة؟ أدخله هنا للانضمام إلى المباراة." : "Have an invite code? Enter it here to join the match."}</p>
            <form className="mt-5 flex flex-col gap-2 sm:flex-row" onSubmit={event => { event.preventDefault(); if (code.length === 6) void join(); }}>
              <label className="min-w-0 flex-1">
                <span className="sr-only">{ar ? "كود الغرفة" : "Room code"}</span>
                <input value={code} onChange={event => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} maxLength={6} inputMode="numeric" autoComplete="one-time-code" placeholder={ar ? "أدخل الكود المكون من 6 أرقام" : "Enter 6-digit room code"} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-center text-lg font-black tracking-[.35em] text-slate-900 outline-none transition placeholder:text-xs placeholder:font-medium placeholder:tracking-normal focus:border-violet-400 focus:ring-4 focus:ring-violet-100" />
              </label>
              <button type="submit" disabled={busy || code.length !== 6} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 font-extrabold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40">{ar ? "انضمام" : "Join"} <Users size={17} /></button>
            </form>
            <p className="mt-3 text-xs text-slate-400">{ar ? "تأكد من إدخال الأرقام الستة بشكل صحيح." : "Make sure all six digits are entered correctly."}</p>
          </article>}
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-5">
            <div className="arena-panel-strong relative overflow-hidden rounded-3xl bg-slate-950 p-5 text-white sm:p-7">
              <div className="absolute -end-10 -top-20 size-64 rounded-full bg-violet-600/30 blur-3xl" />
              <div className="relative flex flex-wrap items-center justify-between gap-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-violet-200"><span className="inline-flex items-center gap-2"><span className={`size-2 rounded-full ${syncStatus === "connected" ? "animate-pulse bg-teal-400" : "bg-amber-400"}`} />{ar ? "غرفة خاصة · في انتظار التحدي" : "PRIVATE ROOM · READY TO PLAY"}</span><span role="status" aria-live="polite" className={`rounded-full px-2.5 py-1 text-[10px] ${syncStatus === "connected" ? "bg-emerald-400/15 text-emerald-200" : "bg-amber-400/15 text-amber-200"}`}>{syncStatus === "connected" ? (ar ? "متصل" : "Connected") : (ar ? "جاري إعادة الاتصال..." : "Reconnecting...")}</span></div>
                  <p className="mt-3 text-sm text-slate-300">{ar ? "شارك كود الدعوة مع اللاعب الثاني" : "Share this invite code with player two"}</p>
                  <p dir="ltr" className="mt-1 text-4xl font-black tracking-[.28em] sm:text-5xl">{room.code}</p>
                </div>
                <button type="button" onClick={() => void copyCode()} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 font-bold text-white transition hover:bg-white/20"><Copy size={17} />{copied ? (ar ? "تم النسخ" : "Copied") : (ar ? "نسخ الكود" : "Copy code")}</button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {room.members.map(member => (
                <article key={member.userId} className="arena-panel rounded-2xl p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-violet-100 text-violet-700"><Crown size={19} /></div>
                      <div className="min-w-0"><p className="truncate font-extrabold text-slate-900">{member.name} {member.isMe ? (ar ? "(أنت)" : "(You)") : ""}</p><p className="mt-0.5 text-xs text-slate-500">{ar ? `اللاعب ${member.seat}` : `Player ${member.seat}`}</p></div>
                    </div>
                    <span className={`size-2.5 shrink-0 rounded-full ${member.isConnected ? "bg-emerald-500" : "bg-slate-300"}`} title={member.isConnected ? (ar ? "متصل" : "Connected") : (ar ? "غير متصل" : "Offline")} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold">
                    <span className={`rounded-full px-2.5 py-1 ${member.isReady ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{member.isReady ? (ar ? "جاهز" : "Ready") : (ar ? "غير جاهز" : "Not ready")}</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">{member.hasSecretCharacter ? (ar ? "اختار شخصية" : "Character selected") : (ar ? "لم يختر شخصية" : "No character yet")}</span>
                  </div>
                </article>
              ))}
              {room.members.length < 2 && <div className="grid min-h-32 place-items-center rounded-2xl border border-dashed border-violet-300 bg-violet-50/60 p-5 text-center"><div><Users size={25} className="mx-auto text-violet-500" /><p className="mt-2 font-bold text-violet-800">{ar ? "في انتظار اللاعب الثاني..." : "Waiting for player two..."}</p><p className="mt-1 text-xs text-violet-600">{ar ? "أرسل كود الغرفة ليتمكن من الانضمام" : "Send the room code so they can join"}</p></div></div>}
            </div>

            {room.status === "WAITING" && (
              <div className="arena-panel rounded-3xl p-5 sm:p-6">
                <div className="flex items-center gap-2"><Sparkles size={18} className="text-violet-600" /><h3 className="text-lg font-black text-slate-950">{ar ? "اختر شخصيتك السرية" : "Choose your secret character"}</h3></div>
                <p className="mt-1 text-sm text-slate-500">{ar ? "لن تظهر الشخصية التي تختارها لخصمك." : "Your selected character will never be shown to your opponent."}</p>
                <div className="mt-4">
                  <span className="mb-2 block text-xs font-bold text-slate-500">{ar ? "شخصيتك السرية" : "Your secret character"}</span>
                  <button type="button" disabled={contentLoading || busy} onClick={() => setCharacterPickerOpen(true)} className="flex min-h-16 w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-start text-sm font-bold text-slate-800 transition hover:border-violet-300 hover:bg-violet-50 disabled:opacity-50">
                    <span className="flex items-center gap-3">{character ? <span className="grid size-11 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-violet-100 to-teal-100">{character&&characters.find(item => item.id === character)?<CharacterPortrait name={characters.find(item => item.id === character)!.name} attributes={characters.find(item => item.id === character)!.attributes}/>:<span className="text-2xl">?</span>}</span> : <span className="grid size-11 place-items-center rounded-xl bg-slate-100 text-xl">?</span>}<span>{character ? characters.find(item => item.id === character)?.name : contentLoading ? (ar ? "جارٍ تحميل الشخصيات..." : "Loading characters...") : (ar ? "اضغط لاختيار شخصية" : "Tap to choose a character")}</span></span><span className="rounded-lg bg-violet-100 px-3 py-2 text-xs font-black text-violet-700">{ar ? "اختيار" : "Choose"}</span>
                  </button>
                </div>
                {characterPickerOpen && <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/75 p-3 backdrop-blur-md sm:p-6" role="dialog" aria-modal="true" aria-labelledby="character-picker-title" onMouseDown={event => { if (event.target === event.currentTarget) setCharacterPickerOpen(false); }}>
                  <div className="flex max-h-[90dvh] w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] border border-white/15 bg-[#171536] text-white shadow-2xl">
                    <header className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4 sm:px-7"><div><p className="text-[10px] font-black tracking-[.2em] text-lime-300">GUESS ARENA · CHARACTER SELECT</p><h3 id="character-picker-title" className="mt-1 text-xl font-black">{ar ? "اختار شخصيتك السرية" : "Choose your secret character"}</h3><p className="mt-1 text-xs text-white/45">{ar ? "اختيارك مش هيظهر لخصمك." : "Your choice stays hidden from your opponent."}</p></div><button type="button" onClick={() => setCharacterPickerOpen(false)} className="grid size-10 place-items-center rounded-xl bg-white/10 text-white hover:bg-white/15" aria-label={ar ? "إغلاق" : "Close"}><X size={19}/></button></header>
                    <div className="overflow-y-auto p-4 sm:p-6"><div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 md:grid-cols-5 lg:grid-cols-6">{characters.map(item=><button key={item.id} type="button" onClick={()=>{setCharacter(item.id);setCharacterPickerOpen(false);}} className={`group min-w-0 overflow-hidden rounded-2xl border p-2 text-center transition hover:-translate-y-1 hover:border-lime-300/70 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-lime-300 ${character===item.id?"border-lime-300 bg-lime-300/10 ring-2 ring-lime-300/30":"border-white/10 bg-white/[.04]"}`}><span className="grid aspect-[4/4.4] place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-violet-300/25 to-cyan-300/15"><CharacterPortrait name={item.name} attributes={item.attributes}/></span><span className="mt-2 block truncate text-xs font-extrabold">{item.name}</span>{character===item.id&&<span className="mt-1 inline-flex items-center gap-1 text-[10px] font-black text-lime-300"><Check size={12}/>{ar?"تم الاختيار":"Selected"}</span>}</button>)}</div></div>
                    <footer className="border-t border-white/10 px-5 py-3 text-center text-[11px] font-semibold text-white/40">{ar ? `إجمالي الشخصيات: ${characters.length}` : `Total characters: ${characters.length}`}</footer>
                  </div>
                </div>}
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <button type="button" disabled={busy || contentLoading || !character || !characters.some(item => item.id === character)} onClick={ready} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 font-extrabold text-white transition hover:bg-teal-700 disabled:opacity-40">{busy && <LoaderCircle size={17} className="animate-spin" />}{room.members.find(member => member.isMe)?.isReady ? (ar ? "إلغاء الجاهزية" : "Mark not ready") : (ar ? "أنا جاهز" : "I'm ready")}</button>
                  {room.isHost && <button type="button" disabled={busy || room.members.length !== 2 || room.members.some(member => !member.isReady || !member.hasSecretCharacter)} onClick={start} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 font-extrabold text-white transition hover:bg-violet-800 disabled:opacity-40"><Gamepad2 size={17} />{ar ? "ابدأ المباراة" : "Start match"}</button>}
                </div>
                {room.isHost && room.members.length === 2 && room.members.every(member => member.isReady && member.hasSecretCharacter) && <p className="mt-3 text-xs font-semibold text-emerald-700">{ar ? "اللاعبان جاهزان! يمكنك بدء المباراة." : "Both players are ready. You can start the match."}</p>}
              </div>
            )}
          </div>
          <aside className="arena-panel h-fit rounded-3xl p-5">
            <div className="flex items-center gap-2"><ShieldCheck size={19} className="text-teal-600" /><h3 className="font-black text-slate-900">{ar ? "قواعد الغرفة" : "Room guide"}</h3></div>
            <ol className="mt-4 space-y-4 text-sm leading-6 text-slate-600">
              <li className="flex gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-lg bg-violet-100 text-xs font-black text-violet-700">1</span>{ar ? "شارك كود الدعوة مع صديقك." : "Share the invite code with your friend."}</li>
              <li className="flex gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-lg bg-violet-100 text-xs font-black text-violet-700">2</span>{ar ? "اختاروا شخصية سرية واضغطوا جاهز." : "Choose a secret character and mark ready."}</li>
              <li className="flex gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-lg bg-violet-100 text-xs font-black text-violet-700">3</span>{ar ? "المضيف يبدأ المباراة بعد جاهزية الطرفين." : "The host starts once both players are ready."}</li>
            </ol>
            <button type="button" onClick={leave} disabled={busy} className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"><DoorOpen size={16} />{ar ? "مغادرة الغرفة" : "Leave room"}</button>
          </aside>
        </div>
      )}

      {(room?.status === "IN_PROGRESS" || room?.status === "COMPLETED") && <MultiplayerGame roomId={room.id} locale={locale} characters={characters} questions={questions} />}
      {error && <div role="alert" aria-live="assertive" className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700"><p className="min-w-0 flex-1">{error}</p><button type="button" onClick={() => { setError(""); if (room) void refresh(room.id).catch(() => setError(ar ? "تعذر تحديث الغرفة. حاول مرة أخرى." : "Could not refresh the room. Try again.")); else window.location.reload(); }} className="min-h-9 rounded-lg border border-rose-200 bg-white px-3 text-xs font-extrabold text-rose-700 transition hover:bg-rose-100 focus-visible:outline-2 focus-visible:outline-rose-500">{ar ? "إعادة المحاولة" : "Try again"}</button></div>}
      {notice && <p role="status" className="mt-3 text-xs text-amber-700">{notice}</p>}
      <p className="mt-5 text-center text-xs text-slate-400">{ar ? "اختيارك السري لا يظهر للطرف الآخر." : "Your secret character is private to you."}</p>
    </section>
  );
}
