"use client";

import { useEffect, useMemo, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { useGameSounds } from "@/hooks/use-game-sounds";
import {
  Check, Eye, EyeOff, HelpCircle, RotateCcw, Sparkles, Trophy,
  UserRound, X, Crown, HatGlasses, CircleHelp
} from "lucide-react";
type Character = {
  id: string; name: string; avatar: string;
  skin: "light" | "medium" | "dark";
  hairColor: "black" | "brown" | "blonde" | "red" | "gray";
  hairLength: "short" | "long" | "none";
  hasHat: boolean; hasGlasses: boolean; hasBeard: boolean;
  gender: "male" | "female"; eyeColor: "brown" | "blue" | "green";
};
type Question = { id: string; labelAr: string; labelEn: string; attributeKey: string; expectedValue: string | boolean; category: { slug: string } };


type Locale = "ar" | "en";
type GameStatus = "ready" | "playing" | "won";

const copy = {
  ar: {
    eyebrow: "وضع التدريب · خصم افتراضي",
    title: "ساحة التخمين",
    subtitle: "اسأل خصمك أسئلة بنعم أو لا، واستبعد الشخصيات غير المطابقة حتى تكتشف الشخصية السرية.",
    start: "ابدأ جولة جديدة",
    restart: "إعادة الجولة",
    board: "لوحة الشخصيات",
    remaining: "شخصيات متبقية",
    eliminated: "شخصيات مستبعدة",
    secret: "الشخصية السرية",
    secretHint: "خصمك اختار شخصية سرية. حاول اكتشافها!",
    hidden: "مخفية عنك",
    questions: "اسأل خصمك",
    questionsHint: "اختر سؤالًا واحدًا في كل مرة. سيجيب الخصم وتُستبعد الشخصيات تلقائيًا.",
    history: "سجل الجولة",
    noHistory: "لم تسأل أي سؤال بعد.",
    yes: "نعم",
    no: "لا",
    answer: "إجابة الخصم",
    removed: "تم استبعاد",
    candidates: "شخصية",
    guess: "اختر الشخصية لتخمينها",
    wrong: "تخمين غير صحيح. تم استبعاد الشخصية.",
    win: "مبروك! اكتشفت الشخصية السرية وفزت بالجولة!",
    ready: "ابدأ الجولة ليختار الخصم شخصية سرية.",
    playing: "الجولة جارية",
    won: "فزت بالجولة",
    manualHide: "اقلب البطاقة واستبعدها",
    restore: "إعادة البطاقة",
    guessed: "تخمين",
    askAgain: "يمكنك متابعة الأسئلة أو التخمين من البطاقات المتبقية.",
    allAsked: "استخدمت كل الأسئلة المتاحة.",
    questionGroups: { look: "المظهر", accessories: "الإكسسوارات", identity: "الصفات" },
    questionsList: [
      ["hat", "هل يرتدي قبعة؟", "accessories"],
      ["glasses", "هل يرتدي نظارة؟", "accessories"],
      ["beard", "هل لديه لحية؟", "look"],
      ["male", "هل الشخصية رجل؟", "identity"],
      ["female", "هل الشخصية امرأة؟", "identity"],
      ["shortHair", "هل شعره قصير؟", "look"],
      ["longHair", "هل شعره طويل؟", "look"],
      ["bald", "هل الشخصية صلعاء؟", "look"],
      ["blackHair", "هل شعره أسود؟", "look"],
      ["brownHair", "هل شعره بني؟", "look"],
      ["blondeHair", "هل شعره أشقر؟", "look"],
      ["redHair", "هل شعره أحمر؟", "look"],
      ["grayHair", "هل شعره رمادي؟", "look"],
      ["lightSkin", "هل بشرته فاتحة؟", "look"],
      ["mediumSkin", "هل بشرته متوسطة؟", "look"],
      ["darkSkin", "هل بشرته داكنة؟", "look"],
      ["blueEyes", "هل عيناه زرقاوان؟", "look"],
      ["greenEyes", "هل عيناه خضراوان؟", "look"],
      ["brownEyes", "هل عيناه بنيتان؟", "look"]
    ] as const
  },
  en: {
    eyebrow: "PRACTICE MODE · AI OPPONENT",
    title: "Guess Arena",
    subtitle: "Ask yes-or-no questions, eliminate characters that do not match, and uncover the secret character.",
    start: "Start new round",
    restart: "Restart round",
    board: "Character board",
    remaining: "Characters left",
    eliminated: "Eliminated",
    secret: "Secret character",
    secretHint: "Your opponent picked a secret character. Can you find them?",
    hidden: "Hidden from you",
    questions: "Ask your opponent",
    questionsHint: "Choose one question at a time. The opponent answers and the board filters automatically.",
    history: "Round history",
    noHistory: "No questions asked yet.",
    yes: "Yes",
    no: "No",
    answer: "Opponent answered",
    removed: "Eliminated",
    candidates: "characters",
    guess: "Select a character to make your guess",
    wrong: "Incorrect guess. That character was eliminated.",
    win: "You found the secret character. You win the round!",
    ready: "Start a round and your opponent will choose a secret character.",
    playing: "Round in progress",
    won: "Round won",
    manualHide: "Flip and eliminate card",
    restore: "Restore card",
    guessed: "Guess",
    askAgain: "Keep asking questions or guess from the remaining cards.",
    allAsked: "You have used all available questions.",
    questionGroups: { look: "Appearance", accessories: "Accessories", identity: "Identity" },
    questionsList: [
      ["hat", "Is the character wearing a hat?", "accessories"],
      ["glasses", "Does the character wear glasses?", "accessories"],
      ["beard", "Does the character have a beard?", "look"],
      ["male", "Is the character male?", "identity"],
      ["female", "Is the character female?", "identity"],
      ["shortHair", "Does the character have short hair?", "look"],
      ["longHair", "Does the character have long hair?", "look"],
      ["bald", "Is the character bald?", "look"],
      ["blackHair", "Does the character have black hair?", "look"],
      ["brownHair", "Does the character have brown hair?", "look"],
      ["blondeHair", "Does the character have blonde hair?", "look"],
      ["redHair", "Does the character have red hair?", "look"],
      ["grayHair", "Does the character have gray hair?", "look"],
      ["lightSkin", "Does the character have light skin?", "look"],
      ["mediumSkin", "Does the character have medium skin?", "look"],
      ["darkSkin", "Does the character have dark skin?", "look"],
      ["blueEyes", "Does the character have blue eyes?", "look"],
      ["greenEyes", "Does the character have green eyes?", "look"],
      ["brownEyes", "Does the character have brown eyes?", "look"]
    ] as const
  }
} as const;

const skinColors: Record<Character["skin"], string> = { light: "#f3c9a5", medium: "#c98961", dark: "#754832" };
const hairColors: Record<Character["hairColor"], string> = { black: "#29232b", brown: "#68402f", blonde: "#e6c36d", red: "#a94f36", gray: "#a7a8b0" };
const eyeColors: Record<Character["eyeColor"], string> = { brown: "#70452f", blue: "#4b91c7", green: "#4c9a72" };

function CharacterPortrait({ character }: { character: Character }) {
  const skin = skinColors[character.skin];
  const hair = hairColors[character.hairColor];
  const eyes = eyeColors[character.eyeColor];
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" role="img" aria-label={character.name}>
      <defs>
        <linearGradient id={`bg-${character.id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f0eaff" />
          <stop offset="100%" stopColor="#d9f5ef" />
        </linearGradient>
      </defs>
      <rect width="120" height="120" rx="18" fill={`url(#bg-${character.id})`} />
      <path d="M17 120c3-25 17-36 43-36s40 11 43 36" fill={character.gender === "male" ? "#46506f" : "#8a5c9e"} />
      <path d="M48 78h24v19H48z" fill={skin} />
      <ellipse cx="60" cy="52" rx="29" ry="35" fill={skin} />
      <path d={character.hairLength === "none" ? "M31 47c-3-20 9-34 29-34 19 0 31 13 29 34-6-10-13-14-21-15-14 8-24 9-37 7z" : "M31 53c-7-26 7-43 29-43 24 0 36 18 29 43-5-17-14-24-29-25-12 9-19 10-29 9z"} fill={hair} />
      {character.hairLength === "long" && <path d="M33 46c-7 20-6 43 2 52l11-4-3-40zm54 0c7 20 6 43-2 52l-11-4 3-40z" fill={hair} />}
      <ellipse cx="49" cy="53" rx="3" ry="4" fill={eyes} />
      <ellipse cx="71" cy="53" rx="3" ry="4" fill={eyes} />
      <path d="M58 59l-3 9h7" fill="none" stroke="#a86f58" strokeWidth="2" strokeLinecap="round" />
      <path d="M51 73q9 7 18 0" fill="none" stroke="#8c4c4b" strokeWidth="2.5" strokeLinecap="round" />
      {character.hasBeard && <path d="M39 68q2 23 21 25 19-2 21-25-9 8-21 6-12 2-21-6z" fill={hair} opacity=".92" />}
      {character.hasGlasses && <g fill="none" stroke="#303344" strokeWidth="3"><rect x="38" y="46" width="19" height="15" rx="5"/><rect x="63" y="46" width="19" height="15" rx="5"/><path d="M57 52h6" /></g>}
      {character.hasHat && <g><path d="M28 34q2-23 32-23t32 23z" fill="#7257e8"/><rect x="22" y="34" width="76" height="7" rx="3" fill="#4934a8"/></g>}
      <path d="M43 88q17 9 34 0" fill="none" stroke="#fff" strokeOpacity=".65" strokeWidth="3" />
    </svg>
  );
}


export function GameBoard({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const [status, setStatus] = useState<GameStatus>("ready");
  const { soundEnabled, toggleSound, playSound } = useGameSounds();
  const [secretId, setSecretId] = useState<string | null>(null);
  const [eliminated, setEliminated] = useState<Set<string>>(new Set());
  const [asked, setAsked] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<Array<{ id: string; label: string; answer: boolean; removed: number }>>([]);
  const [notice, setNotice] = useState("");
  const [characters, setCharacters] = useState<Character[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [contentLoading, setContentLoading] = useState(true);
  const [contentError, setContentError] = useState("");
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    void fetch("/api/game/content", { cache: "no-store", signal: controller.signal }).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (active) {
        setCharacters((data.characters ?? []).map((character: { id: string; name: string; avatar: string; attributes: Record<string, unknown> }) => ({ id: character.id, name: character.name, avatar: character.avatar, ...character.attributes })) as Character[]);
        setQuestions(data.questions ?? []);
      }
    }).catch(() => {
      if (active) {
        const message = locale === "ar" ? "تعذر تحميل محتوى اللعبة." : "Could not load game content.";
        setContentError(message);
        setNotice(message);
      }
    }).finally(() => { window.clearTimeout(timeout); if (active) setContentLoading(false); });
    return () => { active = false; controller.abort(); window.clearTimeout(timeout); };
  }, [locale]);
  const secret = useMemo(() => characters.find(c => c.id === secretId) ?? null, [characters, secretId]);
  const remaining = Math.max(0, characters.length - eliminated.size);
  const questionItems = questions.map(question => ({
    id: question.id,
    label: locale === "ar" ? question.labelAr : question.labelEn,
    group: question.category.slug === "appearance" ? "look" : question.category.slug
  }));

  function startRound() {
    if (!characters.length) return;
    const choice = characters[Math.floor(Math.random() * characters.length)];
    setSecretId(choice.id);
    setEliminated(new Set());
    setAsked(new Set());
    setHistory([]);
    setNotice("");
    setStatus("playing");
    playSound("click");
  }

  function askQuestion(id: string, label: string) {
    if (!secret || status !== "playing" || asked.has(id)) return;
    const question = questions.find(item => item.id === id);
    if (!question) return;
    const answer = secret[question.attributeKey as keyof Character] === question.expectedValue;
    const removedIds = characters.filter(character =>
      !eliminated.has(character.id) &&
      (character[question.attributeKey as keyof Character] === question.expectedValue) !== answer
    ).map(character => character.id);
    setEliminated(previous => new Set([...previous, ...removedIds]));
    setAsked(previous => new Set([...previous, id]));
    setHistory(previous => [{ id, label, answer, removed: removedIds.length }, ...previous].slice(0, 8));
    setNotice(`${t.answer}: ${answer ? t.yes : t.no} · ${t.removed} ${removedIds.length}`);
    playSound(answer ? "yes" : "no");
  }

  function guess(character: Character) {
    if (!secret || status !== "playing" || eliminated.has(character.id)) return;
    if (character.id === secret.id) {
      setStatus("won");
      setNotice(t.win);
      playSound("win");
    } else {
      setEliminated(previous => new Set([...previous, character.id]));
      setNotice(t.wrong);
      playSound("lose");
    }
  }

  function toggleEliminated(id: string) {
    if (status !== "playing") return;
    playSound(eliminated.has(id) ? "click" : "eliminate");
    setEliminated(previous => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const groupedQuestions = [
    { id: "look", label: t.questionGroups.look },
    { id: "accessories", label: t.questionGroups.accessories },
    { id: "identity", label: t.questionGroups.identity }
  ];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,rgba(114,87,232,.13),transparent_32%),linear-gradient(180deg,#f8f9ff_0%,#f0f3fa_100%)]">
      <div className="mx-auto max-w-[1500px] px-3 py-6 sm:px-6 sm:py-9">
        <div className="mb-6 flex flex-col gap-4 rounded-[2rem] border border-white bg-white/85 p-5 shadow-xl shadow-slate-200/50 backdrop-blur sm:p-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-100 bg-violet-50 px-3 py-1.5 text-[11px] font-black tracking-wide text-violet-700"><Sparkles size={14} />{t.eyebrow}</span>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">{t.title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">{t.subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={toggleSound} aria-pressed={soundEnabled} aria-label={soundEnabled ? (locale === "ar" ? "إيقاف الصوت" : "Mute sounds") : (locale === "ar" ? "تشغيل الصوت" : "Enable sounds")} className="grid min-h-12 min-w-12 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-violet-300 hover:text-violet-700">{soundEnabled ? <Volume2 size={19}/> : <VolumeX size={19}/>}</button>
            <div className="min-w-28 rounded-2xl bg-slate-950 px-4 py-3 text-white"><span className="block text-[10px] font-bold text-slate-400">{t.remaining}</span><strong className="text-2xl font-black tabular-nums">{remaining}</strong></div>
            <div className="min-w-28 rounded-2xl bg-rose-50 px-4 py-3 text-rose-700"><span className="block text-[10px] font-bold text-rose-400">{t.eliminated}</span><strong className="text-2xl font-black tabular-nums">{eliminated.size}</strong></div>
            <button type="button" disabled={contentLoading || characters.length === 0} onClick={startRound} className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-extrabold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:bg-violet-700"><RotateCcw size={17}/>{status === "ready" ? t.start : t.restart}</button>
          </div>
        </div>

        <div className="grid items-start gap-5 xl:grid-cols-[270px_minmax(0,1fr)_280px]">
          <aside className="order-2 space-y-4 xl:order-1">
            <section className="rounded-3xl border border-white bg-white p-5 shadow-lg shadow-slate-200/50">
              <div className="flex items-center gap-2"><Crown size={18} className="text-amber-500"/><h2 className="font-black text-slate-900">{t.secret}</h2></div>
              <div className="mt-4 flex items-center gap-3 rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50 p-4">
                <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-white text-violet-600 shadow-sm"><CircleHelp size={28}/></div>
                <div><p className="text-sm font-extrabold text-slate-800">{t.hidden}</p><p className="mt-1 text-xs leading-5 text-slate-500">{t.secretHint}</p></div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs font-bold text-slate-500"><span className={`size-2 rounded-full ${status === "playing" ? "animate-pulse bg-emerald-500" : status === "won" ? "bg-amber-500" : "bg-slate-300"}`}/>{status === "playing" ? t.playing : status === "won" ? t.won : t.ready}</div>
            </section>

            <section className="rounded-3xl border border-white bg-white p-5 shadow-lg shadow-slate-200/50">
              <div className="flex items-center gap-2"><HelpCircle size={18} className="text-violet-600"/><h2 className="font-black text-slate-900">{t.questions}</h2></div>
              <p className="mt-2 text-xs leading-5 text-slate-500">{t.questionsHint}</p>
              <div className="mt-4 space-y-4">
                {groupedQuestions.map(group => (
                  <div key={group.id}>
                    <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">{group.label}</p>
                    <div className="grid gap-1.5">
                      {questionItems.filter(item => item.group === group.id).map(({ id, label }) => (
                        <button key={id} type="button" disabled={status !== "playing" || asked.has(id)} onClick={() => askQuestion(id, label)} className="flex min-h-10 items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-start text-xs font-bold text-slate-700 transition hover:border-violet-200 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40">
                          <span>{label}</span>{asked.has(id) ? <Check size={14} className="shrink-0 text-emerald-600"/> : <span className="text-violet-500">?</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>

          <section className="order-1 min-w-0 rounded-[2rem] border border-white bg-white p-3 shadow-2xl shadow-slate-200/70 sm:p-5 xl:order-2">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-1">
              <div><p className="text-[10px] font-black tracking-[.2em] text-violet-600">GUESS ARENA</p><h2 className="mt-1 text-lg font-black text-slate-950 sm:text-xl">{t.board}</h2></div>
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">{t.guess}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 md:grid-cols-5 lg:grid-cols-6 2xl:grid-cols-9">
              {characters.map(character => {
                const isOut = eliminated.has(character.id);
                return (
                  <article key={character.id} className={`animate-card-enter group relative min-w-0 overflow-hidden rounded-2xl border p-1.5 transition-all duration-300 sm:p-2 ${isOut ? "border-slate-100 bg-slate-100 opacity-35 grayscale" : "border-slate-100 bg-white hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg"}`}>
                    <button type="button" disabled={status !== "playing" || isOut} onClick={() => guess(character)} className="w-full text-center disabled:cursor-not-allowed" aria-label={`${t.guess}: ${character.name}`}>
                      <div className="aspect-square overflow-hidden rounded-xl bg-violet-50"><CharacterPortrait character={character}/></div>
                      <span className="mt-1.5 block truncate text-[11px] font-extrabold text-slate-800 sm:text-xs">{character.name}</span>
                    </button>
                    <button type="button" disabled={status !== "playing"} onClick={() => toggleEliminated(character.id)} className="absolute end-2 top-2 grid size-6 place-items-center rounded-lg border border-white/80 bg-white/90 text-slate-500 shadow-sm transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-0" aria-label={isOut ? t.restore : t.manualHide} title={isOut ? t.restore : t.manualHide}>{isOut ? <Eye size={13}/> : <EyeOff size={13}/>}</button>
                    {isOut && <span className="pointer-events-none absolute inset-0 grid place-items-center"><span className="grid size-8 place-items-center rounded-full bg-slate-900/75 text-white"><X size={18}/></span></span>}
                  </article>
                );
              })}
            </div>
            {status === "ready" && <div className="mt-4 rounded-2xl border border-dashed border-violet-200 bg-violet-50 p-4 text-center text-sm font-bold text-violet-800">{t.ready}</div>}
            {status === "won" && <div className="animate-feedback mt-4 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-extrabold text-emerald-800"><Trophy size={20}/>{t.win}</div>}
            {notice && status !== "won" && <div className="animate-feedback mt-4 rounded-2xl border border-violet-100 bg-violet-50 p-4 text-sm font-bold text-violet-900">{notice}</div>}
          </section>

          <aside className="order-3 space-y-4">
            <section className="rounded-3xl border border-white bg-white p-5 shadow-lg shadow-slate-200/50">
              <div className="flex items-center gap-2"><UserRound size={18} className="text-teal-600"/><h2 className="font-black text-slate-900">{t.history}</h2></div>
              <div className="mt-4 space-y-2">
                {history.length === 0 ? <p className="rounded-xl bg-slate-50 p-4 text-xs leading-6 text-slate-400">{t.noHistory}</p> : history.map((item, index) => (
                  <div key={`${item.id}-${index}`} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <p className="text-xs font-bold text-slate-700">{item.label}</p>
                    <div className="mt-2 flex items-center justify-between gap-2"><span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${item.answer ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{item.answer ? t.yes : t.no}</span><span className="text-[10px] font-bold text-slate-400">−{item.removed}</span></div>
                  </div>
                ))}
              </div>
            </section>
            <div className="rounded-3xl bg-slate-950 p-5 text-white">
              <div className="flex items-center gap-2 text-teal-300"><HatGlasses size={18}/><span className="text-xs font-black tracking-wider">HOW TO PLAY</span></div>
              <ol className="mt-3 space-y-2 text-xs leading-6 text-slate-300">
                <li>1. {locale === "ar" ? "ابدأ الجولة والخصم سيختار شخصية سرية." : "Start a round; your opponent picks a secret character."}</li>
                <li>2. {locale === "ar" ? "اسأل أسئلة بنعم أو لا لتقليل الاحتمالات." : "Ask yes/no questions to narrow the candidates."}</li>
                <li>3. {locale === "ar" ? "اضغط على بطاقة لتخمين الشخصية." : "Click a card to make your final guess."}</li>
              </ol>
            </div>
            {status === "playing" && <p className="rounded-2xl border border-slate-200 bg-white p-4 text-xs font-semibold leading-6 text-slate-500">{t.askAgain}</p>}
          </aside>
        </div>
      </div>
    </main>
  );
}
