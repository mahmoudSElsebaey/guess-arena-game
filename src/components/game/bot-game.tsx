"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { ArrowLeft, ArrowRight, Bot, Check, CircleHelp, Crown, Eye, History, Home, RotateCcw, Sparkles, Swords, Trophy, UserRound, Users, X, Zap } from "lucide-react";
import { CharacterPortrait } from "@/components/game/character-portrait";

type Locale = "ar" | "en";
type Difficulty = "easy" | "medium" | "hard";
type Character = { id: string; name: string; avatar: string; attributes: Record<string, string | boolean> };
type Question = { id: string; labelAr: string; labelEn: string; attributeKey: string; expectedValue: string | boolean; category: { slug: string } };
type Turn = "player" | "bot";
type LogEntry = { id: number; speaker: "player" | "bot"; text: string; answer?: boolean; detail?: string };

const copy = {
  ar: {
    eyebrow: "GUESS ARENA · BOT DUEL", title: "تحدي الذكاء الاصطناعي", subtitle: "واجه البوت، اسأله أسئلة ذكية، واكتشف شخصيته السرية قبل أن يكتشف شخصيتك.",
    chooseLevel: "اختر مستوى الصعوبة", easy: "سهل", medium: "متوسط", hard: "صعب",
    easyDesc: "أسئلة عشوائية وتخمين متأخر", mediumDesc: "أسئلة أذكى وتخمين عند اقتراب الحل", hardDesc: "يختار أفضل سؤال ويضغط عليك بالتخمين",
    chooseSecret: "اختر شخصيتك السرية", chooseSecretHint: "هذه الشخصية سيحاول البوت اكتشافها. لن تظهر له مباشرة.", start: "ابدأ المواجهة",
    player: "أنت", bot: "البوت", yourBoard: "لوحة الشخصيات", remaining: "متبقية", eliminated: "مستبعدة",
    ask: "اسأل البوت", askHint: "اختر سؤالًا واحدًا في دورك. البوت سيجيب ثم يسألك سؤالًا.",
    botThinking: "البوت يسألك الآن", answerYes: "نعم", answerNo: "لا", botThinkingLabel: "البوت يفكر...",
    botCandidates: "احتمالات البوت", botQuestion: "سؤال البوت", yourSecret: "شخصيتك السرية", locked: "تم اختيارها",
    guess: "خمن الشخصية", wrongGuess: "تخمين غير صحيح! حاول مرة أخرى.", win: "أحسنت! فزت على البوت 🎉", lose: "البوت اكتشف شخصيتك! حظ أوفر.", draw: "انتهت المواجهة.",
    playAgain: "العب مرة أخرى", changeLevel: "تغيير المستوى", history: "سجل المواجهة", noHistory: "لم تبدأ الأسئلة بعد.",
    selectFirst: "اختر شخصيتك السرية أولًا.", loading: "جارٍ تحميل الشخصيات والأسئلة...", loadError: "تعذر تحميل محتوى اللعبة. حدّث الصفحة وحاول مجددًا.",
    botGuessedWrong: "البوت خمن بشكل خاطئ واستبعد شخصية.", botSecret: "كانت هذه الشخصية السرية التي اختارها البوت.", botGuessedRight: "البوت اكتشف شخصيتك السرية!",
    playerQuestion: "سؤالك", botAnswer: "إجابة البوت", botQuestionIntro: "البوت يسأل:", turnPlayer: "دورك الآن", turnBot: "دور البوت",
    back: "العودة", level: "المستوى", selected: "مختارة", characters: "شخصية", allQuestions: "استخدمت كل الأسئلة المتاحة. ابدأ جولة جديدة.",
    progress: "تقدم البوت", secretHint: "لن يرى البوت اختيارك إلا من خلال إجاباتك."
  },
  en: {
    eyebrow: "GUESS ARENA · BOT DUEL", title: "Challenge the bot", subtitle: "Face the bot, ask clever questions, and uncover its secret character before it discovers yours.",
    chooseLevel: "Choose difficulty", easy: "Easy", medium: "Medium", hard: "Hard",
    easyDesc: "Random questions and late guesses", mediumDesc: "Smarter questions and timely guesses", hardDesc: "Best questions and more aggressive guesses",
    chooseSecret: "Choose your secret character", chooseSecretHint: "The bot will try to discover this character. It will not see your choice.", start: "Start duel",
    player: "You", bot: "Bot", yourBoard: "Character board", remaining: "Remaining", eliminated: "Eliminated",
    ask: "Ask the bot", askHint: "Choose one question on your turn. The bot answers, then asks you a question.",
    botThinking: "The bot asks you now", answerYes: "Yes", answerNo: "No", botThinkingLabel: "The bot is thinking...",
    botCandidates: "Bot candidates", botQuestion: "Bot's question", yourSecret: "Your secret character", locked: "Locked in",
    guess: "Guess character", wrongGuess: "Wrong guess! Keep trying.", win: "You beat the bot! 🎉", lose: "The bot discovered your character. Better luck next time.",
    draw: "The duel is over.", playAgain: "Play again", changeLevel: "Change difficulty", history: "Duel history", noHistory: "No questions yet.",
    selectFirst: "Choose your secret character first.", loading: "Loading characters and questions...", loadError: "Could not load game content. Refresh and try again.",
    botGuessedWrong: "The bot guessed incorrectly and eliminated a character.", botSecret: "This was the secret character chosen by the bot.", botGuessedRight: "The bot discovered your secret character!",
    playerQuestion: "Your question", botAnswer: "Bot answered", botQuestionIntro: "The bot asks:", turnPlayer: "Your turn", turnBot: "Bot's turn",
    back: "Back", level: "Difficulty", selected: "Selected", characters: "characters", allQuestions: "You used all available questions. Start a new round.",
    progress: "Bot progress", secretHint: "The bot can only learn your choice through your answers."
  }
} as const;

const levels: Difficulty[] = ["easy", "medium", "hard"];
const readAnswer = (character: Character, question: Question) => character.attributes[question.attributeKey] === question.expectedValue;

export function BotGame({ locale }: { locale: Locale }) {
  const ar = locale === "ar";
  const t = copy[locale];
  const router = useRouter();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [mySecretId, setMySecretId] = useState("");
  const [botSecretId, setBotSecretId] = useState("");
  const [phase, setPhase] = useState<"setup" | "playing" | "won" | "lost">("setup");
  const [turn, setTurn] = useState<Turn>("player");
  const [playerEliminated, setPlayerEliminated] = useState<Set<string>>(new Set());
  const [botCandidates, setBotCandidates] = useState<Set<string>>(new Set());
  const [askedByPlayer, setAskedByPlayer] = useState<Set<string>>(new Set());
  const [askedByBot, setAskedByBot] = useState<Set<string>>(new Set());
  const [pendingBotQuestion, setPendingBotQuestion] = useState<Question | null>(null);
  const [history, setHistory] = useState<LogEntry[]>([]);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    void fetch("/api/game/content", { cache: "no-store", signal: controller.signal })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "CONTENT_LOAD_FAILED");
        if (active) {
          setCharacters((data.characters ?? []).map((item: { id: string; name: string; avatar: string; attributes: Record<string, string | boolean> }) => ({ id: item.id, name: item.name, avatar: item.avatar, attributes: item.attributes ?? {} })));
          setQuestions(data.questions ?? []);
        }
      })
      .catch(() => { if (active) setLoadError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, []);

  const mySecret = useMemo(() => characters.find(item => item.id === mySecretId) ?? null, [characters, mySecretId]);
  const botSecret = useMemo(() => characters.find(item => item.id === botSecretId) ?? null, [characters, botSecretId]);
  const remaining = characters.length - playerEliminated.size;
  const botRemaining = botCandidates.size;
  const availablePlayerQuestions = questions.filter(question => !askedByPlayer.has(question.id));

  function startGame() {
    if (!mySecretId) { setNotice(t.selectFirst); return; }
    if (characters.length < 2 || questions.length === 0) return;
    const choices = characters.filter(character => character.id !== mySecretId);
    const secret = choices[Math.floor(Math.random() * choices.length)];
    setBotSecretId(secret.id);
    setPlayerEliminated(new Set());
    setBotCandidates(new Set(characters.map(character => character.id)));
    setAskedByPlayer(new Set());
    setAskedByBot(new Set());
    setPendingBotQuestion(null);
    setHistory([]);
    setNotice("");
    setTurn("player");
    setPhase("playing");
  }

  function selectBotQuestion(candidates: Set<string>, used: Set<string>): Question | null {
    const candidateCharacters = characters.filter(character => candidates.has(character.id));
    const options = questions.filter(question => !used.has(question.id));
    if (options.length === 0 || candidateCharacters.length === 0) return null;
    const scored = options.map(question => {
      const yes = candidateCharacters.filter(character => readAnswer(character, question)).length;
      const no = candidateCharacters.length - yes;
      return { question, score: Math.abs(yes - no) };
    }).filter(item => item.score < candidateCharacters.length);
    if (scored.length === 0) return options[Math.floor(Math.random() * options.length)];
    if (difficulty === "easy") return scored[Math.floor(Math.random() * scored.length)].question;
    scored.sort((a, b) => a.score - b.score);
    const pool = difficulty === "medium" ? scored.slice(0, Math.min(4, scored.length)) : scored.slice(0, 1);
    return pool[Math.floor(Math.random() * pool.length)].question;
  }

  function askBot(question: Question) {
    if (phase !== "playing" || turn !== "player" || askedByPlayer.has(question.id) || !botSecret) return;
    const answer = readAnswer(botSecret, question);
    const removed = characters.filter(character => !playerEliminated.has(character.id) && readAnswer(character, question) !== answer);
    setPlayerEliminated(previous => new Set([...previous, ...removed.map(character => character.id)]));
    setAskedByPlayer(previous => new Set([...previous, question.id]));
    setHistory(previous => [{ id: Date.now(), speaker: "player" as const, text: ar ? question.labelAr : question.labelEn, answer, detail: ar ? (answer ? "نعم" : "لا") : (answer ? "Yes" : "No") }, ...previous].slice(0, 12));
    setNotice("");
    const nextBotQuestion = selectBotQuestion(botCandidates, askedByBot);
    if (!nextBotQuestion) {
      setNotice(t.allQuestions);
      setTurn("player");
      return;
    }
    setPendingBotQuestion(nextBotQuestion);
    setTurn("bot");
  }

  function answerBotQuestion(answer: boolean) {
    if (!pendingBotQuestion || !mySecret || turn !== "bot" || busy) return;
    setBusy(true);
    const question = pendingBotQuestion;
    const nextCandidates = characters.filter(character => botCandidates.has(character.id) && readAnswer(character, question) === answer);
    const nextSet = new Set(nextCandidates.map(character => character.id));
    setBotCandidates(nextSet);
    setAskedByBot(previous => new Set([...previous, question.id]));
    setHistory(previous => [{ id: Date.now(), speaker: "bot" as const, text: ar ? question.labelAr : question.labelEn, answer, detail: ar ? (answer ? "أجبت بنعم" : "أجبت بلا") : (answer ? "You said yes" : "You said no") }, ...previous].slice(0, 12));
    setPendingBotQuestion(null);
    if (nextSet.size === 0) {
      setNotice(t.botGuessedWrong);
    } else {
      const threshold = difficulty === "easy" ? 1 : difficulty === "medium" ? 2 : 5;
      if (nextSet.size <= threshold) {
        const guess = nextCandidates[Math.floor(Math.random() * nextCandidates.length)];
        if (guess.id === mySecret.id) {
          setPhase("lost");
          setNotice(t.botGuessedRight);
          setBusy(false);
          return;
        }
        nextSet.delete(guess.id);
        setBotCandidates(new Set(nextSet));
        setHistory(previous => [{ id: Date.now() + 1, speaker: "bot" as const, text: ar ? `تخمين: ${guess.name}` : `Bot guessed: ${guess.name}`, detail: ar ? "تخمين خاطئ" : "Wrong guess" }, ...previous].slice(0, 12));
        setNotice(t.botGuessedWrong);
      }
    }
    setTurn("player");
    setBusy(false);
  }

  function guessCharacter(character: Character) {
    if (phase !== "playing" || turn !== "player" || playerEliminated.has(character.id) || !botSecret) return;
    if (character.id === botSecret.id) {
      setPhase("won");
      setNotice(t.win);
    } else {
      setPlayerEliminated(previous => new Set([...previous, character.id]));
      setNotice(t.wrongGuess);
    }
  }

  function resetToSetup() {
    setPhase("setup");
    setMySecretId("");
    setBotSecretId("");
    setNotice("");
    setHistory([]);
    setPendingBotQuestion(null);
  }

  if (loading) return <main dir={ar ? "rtl" : "ltr"} className="grid min-h-[70vh] place-items-center bg-[#0b1028] p-6 text-white"><div className="text-center"><div className="mx-auto size-12 animate-spin rounded-full border-4 border-white/15 border-t-lime-300"/><p className="mt-4 text-sm font-bold text-white/65">{t.loading}</p></div></main>;
  if (loadError || characters.length === 0 || questions.length === 0) return <main dir={ar ? "rtl" : "ltr"} className="grid min-h-[70vh] place-items-center bg-[#0b1028] p-6 text-white"><div className="max-w-md text-center"><p className="font-bold">{t.loadError}</p><button type="button" onClick={() => window.location.reload()} className="mt-4 rounded-xl bg-lime-300 px-5 py-3 font-black text-slate-950">{ar ? "إعادة المحاولة" : "Retry"}</button></div></main>;

  return (
    <section dir={ar ? "rtl" : "ltr"} aria-label={ar ? "ساحة اللعب ضد البوت" : "Bot duel arena"} className="arena-game-stage relative isolate mx-auto mt-5 min-h-[calc(100dvh-90px)] w-full max-w-[1600px] overflow-hidden rounded-[1.8rem] bg-[#0b1028] p-2 text-white sm:p-4 lg:p-5">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-40" style={{backgroundImage:"radial-gradient(circle at 15% 12%,rgba(139,92,246,.32),transparent 30%),radial-gradient(circle at 90% 80%,rgba(20,184,166,.22),transparent 28%),linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px)",backgroundSize:"auto,auto,32px 32px,32px 32px"}} />
      <div className="relative z-10 space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#171b3c]/95 p-3 shadow-xl sm:p-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-lime-300 to-emerald-400 text-[#10172c]"><Bot size={21}/></span>
            <div className="min-w-0">
              <p className="text-[10px] font-black tracking-[.2em] text-lime-300">GUESS ARENA · BOT DUEL</p>
              <h2 className="truncate text-lg font-black sm:text-xl">{phase==="won"?(ar?"أنت الفائز!":"You won!") : phase==="lost"?(ar?"البوت فاز":"Bot wins") : turn==="player"?(ar?"دورك الآن!":"Your turn!"):(ar?"البوت يسألك...":"Bot is asking...")}</h2>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <div><span className="block text-[9px] font-black text-white/40">{ar?"المستوى":"LEVEL"}</span><strong className="text-sm font-black text-amber-200">{t[difficulty]}</strong></div>
              <span className="h-8 w-px bg-white/10"/>
              <div><span className="block text-[9px] font-black text-white/40">{ar?"المتبقي":"LEFT"}</span><strong className="text-xl font-black text-white">{remaining}</strong></div>
            </div>
            <button type="button" onClick={() => router.push("/play")} className="inline-flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10" aria-label={t.back}>{ar?<ArrowRight size={18}/>:<ArrowLeft size={18}/>}</button>
          </div>
        </header>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-lime-300/40 bg-lime-300/10 px-4 py-2.5">
            <div className="flex min-w-0 items-center gap-2.5"><span className="grid size-8 place-items-center rounded-lg bg-lime-300/15 text-lime-100"><UserRound size={17}/></span><p className="truncate text-sm font-extrabold text-white">{t.player} <span className="text-white/45">({ar?"أنت":"You"})</span></p></div>
            <span className="rounded-full bg-lime-300 px-2.5 py-1 text-[10px] font-black text-[#11182d]">{turn==="player"&&phase==="playing"?(ar?"يلعب الآن":"Playing"):(ar?"ينتظر":"Waiting")}</span>
          </div>
          <div className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5 ${turn==="bot"&&phase==="playing"?"border-cyan-300/40 bg-cyan-300/10":"border-white/10 bg-[#171b3c]/80"}`}>
            <div className="flex min-w-0 items-center gap-2.5"><span className="grid size-8 place-items-center rounded-lg bg-cyan-300/15 text-cyan-100"><Bot size={17}/></span><p className="truncate text-sm font-extrabold text-white">{t.bot}</p></div>
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${turn==="bot"&&phase==="playing"?"bg-cyan-200 text-[#11182d]":"bg-white/10 text-white/60"}`}>{turn==="bot"&&phase==="playing"?(ar?"يلعب الآن":"Playing"):(ar?"ينتظر":"Waiting")}</span>
          </div>
        </div>

        {phase==="setup" ? (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <section className="rounded-2xl border border-white/10 bg-[#171b3c]/95 p-3 sm:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><p className="text-[10px] font-black tracking-[.2em] text-cyan-200">{ar?"اختيار الشخصية السرية":"SECRET CHARACTER"}</p><h3 className="mt-1 text-lg font-black text-white">{t.chooseSecret}</h3><p className="mt-1 text-xs leading-6 text-white/50">{t.chooseSecretHint}</p></div><span className="rounded-full bg-white/5 px-3 py-1.5 text-[10px] font-bold text-white/55">{characters.length} {t.characters}</span></div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 2xl:grid-cols-9">
                {characters.map(character=><button key={character.id} type="button" onClick={()=>setMySecretId(character.id)} aria-pressed={mySecretId===character.id} className={`min-w-0 overflow-hidden rounded-xl border p-1.5 text-center transition sm:rounded-2xl sm:p-2 ${mySecretId===character.id?"border-lime-300 bg-lime-300/15 shadow-[0_0_25px_rgba(190,242,100,.18)]":"border-white/10 bg-[#22264a] hover:border-lime-300/40"}`}>
                  <span className="relative block aspect-[4/4.8] overflow-hidden rounded-lg bg-gradient-to-br from-violet-200 to-cyan-100"><CharacterPortrait name={character.name} attributes={character.attributes} className="h-full w-full"/>{mySecretId===character.id&&<span className="absolute inset-0 grid place-items-center bg-lime-300/15"><span className="grid size-9 place-items-center rounded-full bg-lime-300 text-slate-950"><Check size={21}/></span></span>}</span>
                  <span className="mt-1 block truncate text-[10px] font-black text-white sm:text-xs">{character.name}</span>
                  {mySecretId===character.id&&<span className="mt-1 inline-flex items-center gap-1 text-[9px] font-black text-lime-200"><Check size={12}/>{t.selected}</span>}
                </button>)}
              </div>
            </section>
            <aside className="space-y-3">
              <section className="rounded-2xl border border-lime-300/25 bg-gradient-to-br from-[#202448] via-[#171b3c] to-[#102a32] p-4 sm:p-5">
                <div className="flex items-center gap-2"><Zap size={18} className="text-lime-200"/><h3 className="font-black text-white">{t.chooseLevel}</h3></div>
                <div className="mt-3 grid gap-2">
                  {levels.map(level=><button key={level} type="button" onClick={()=>setDifficulty(level)} className={`rounded-xl border p-3 text-start transition ${difficulty===level?"border-lime-300/50 bg-lime-300/10":"border-white/10 bg-black/15 hover:bg-white/5"}`}>
                    <span className="flex items-center justify-between gap-2 text-sm font-black text-white"><span>{t[level]}</span>{difficulty===level&&<Check size={16} className="text-lime-200"/>}</span>
                    <span className="mt-1 block text-[10px] leading-5 text-white/50">{t[`${level}Desc` as "easyDesc"|"mediumDesc"|"hardDesc"]}</span>
                  </button>)}
                </div>
                {mySecret&&<div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-3"><div className="size-14 overflow-hidden rounded-lg"><CharacterPortrait name={mySecret.name} attributes={mySecret.attributes}/></div><div className="min-w-0"><p className="text-[9px] font-black text-white/40">{t.yourSecret}</p><p className="truncate text-sm font-black text-white">{mySecret.name}</p><p className="mt-1 text-[10px] text-lime-200">{t.locked}</p></div></div>}
                <button type="button" disabled={!mySecretId} onClick={startGame} className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-lime-300 to-emerald-300 px-5 font-black text-[#102018] shadow-lg shadow-lime-950/20 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"><Swords size={17}/>{t.start}</button>
              </section>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#171b3c]/80 p-3 text-[10px] font-semibold leading-5 text-white/45"><Eye size={15} className="shrink-0 text-lime-200"/>{t.secretHint}</div>
            </aside>
          </div>
        ) : (
          <>
            <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
              <section className="min-w-0 rounded-2xl border border-white/10 bg-[#171b3c]/95 p-3 sm:p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div><p className="text-[10px] font-black tracking-[.2em] text-lime-300">GUESS ARENA · CHARACTER BOARD</p><h3 className="mt-1 text-lg font-black text-white">{t.yourBoard}</h3></div>
                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0b1028] px-3 py-2"><span className={`size-2 rounded-full ${turn==="player"?"animate-pulse bg-lime-300":"bg-cyan-300"}`}/><span className="text-xs font-bold text-white/80">{turn==="player"?t.turnPlayer:t.turnBot}</span></div>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 md:grid-cols-5 lg:grid-cols-6 2xl:grid-cols-9">
                  {characters.map((character,index)=>{
                    const out=playerEliminated.has(character.id);
                    return <button key={character.id} type="button" disabled={phase!=="playing"||turn!=="player"||out} onClick={()=>guessCharacter(character)} className={`group relative min-w-0 overflow-hidden rounded-xl border p-1.5 text-center transition-all duration-100 sm:rounded-2xl sm:p-2 ${out?"border-white/10 bg-[#090d21] opacity-45 grayscale":"border-white/10 bg-[#22264a] hover:-translate-y-1 hover:border-lime-300/45 hover:bg-[#2a3158]"} disabled:cursor-not-allowed`} style={{animationDelay:`${Math.min(index,30)*10}ms`}>
                      <span className="relative block aspect-[4/4.8] overflow-hidden rounded-lg bg-gradient-to-br from-violet-200 to-cyan-100"><CharacterPortrait name={character.name} attributes={character.attributes} className="h-full w-full"/>{out&&<span className="absolute inset-0 grid place-items-center bg-slate-950/55"><span className="grid size-10 place-items-center rounded-full border-2 border-white/20 bg-slate-600/80 text-white"><X size={24}/></span></span>}</span>
                      <span className="mt-1.5 block truncate text-[10px] font-black text-white sm:text-xs">{character.name}</span>
                      <span className={`mt-1 block text-[9px] font-black ${out?"text-white/35":"text-white/45"}`}>{out?(ar?"مستبعدة":"Eliminated"):(ar?"اضغط للتخمين":"Tap to guess")}</span>
                    </button>;
                  })}
                </div>
                {phase==="playing"&&turn==="player"&&<div className="mt-5 rounded-2xl border border-white/10 bg-[#0e1431] p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><CircleHelp size={18} className="text-lime-200"/><h3 className="font-black text-white">{t.ask}</h3></div><span className="rounded-full bg-lime-300/10 px-3 py-1 text-[9px] font-black text-lime-200">{availablePlayerQuestions.length} {ar?"متاح":"AVAILABLE"}</span></div>
                  <p className="mt-1 text-xs leading-6 text-white/45">{t.askHint}</p>
                  <div className="mt-4 flex flex-wrap gap-2">{categorizedQuestions.map(group=><button key={group.slug} type="button" onClick={()=>setSelectedCategory(group.slug)} className={`rounded-lg border px-3 py-2 text-[10px] font-black transition ${(activeCategory?.slug??categorizedQuestions[0]?.slug)===group.slug?"border-lime-300/40 bg-lime-300/10 text-lime-100":"border-white/10 bg-white/5 text-white/55 hover:bg-white/10"}`}>{ar?group.nameAr:group.nameEn}</button>)}</div>
                  <div className="mt-3 flex flex-wrap gap-2">{visibleQuestions.filter(question=>!askedByPlayer.has(question.id)).map(question=><button key={question.id} type="button" onClick={()=>askBot(question)} className="rounded-xl border border-white/10 bg-white/[.06] px-3 py-2.5 text-xs font-bold text-white/80 transition hover:border-lime-200/30 hover:bg-lime-200/10">{ar?question.labelAr:question.labelEn}</button>)}</div>
                  {availablePlayerQuestions.length===0&&<p className="mt-3 text-xs font-bold text-amber-200">{t.allQuestions}</p>}
                </div>}
                {phase==="playing"&&turn==="bot"&&pendingBotQuestion&&<div className="mt-5 rounded-2xl border border-cyan-300/30 bg-gradient-to-br from-[#102d3a] to-[#171b3c] p-4 sm:p-5">
                  <div className="flex items-center gap-2 text-cyan-100"><Bot size={19}/><span className="text-[10px] font-black tracking-[.2em]">{t.botThinking}</span></div>
                  <h3 className="mt-3 text-lg font-black text-white">{t.botQuestionIntro} {ar?pendingBotQuestion.labelAr:pendingBotQuestion.labelEn}</h3>
                  <p className="mt-2 text-xs leading-6 text-white/45">{t.secretHint}</p>
                  <div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={()=>answerBotQuestion(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-300 to-lime-300 px-5 text-sm font-black text-[#102018] disabled:opacity-50"><Check size={17}/>{t.answerYes}</button><button type="button" disabled={busy} onClick={()=>answerBotQuestion(false)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-rose-300/30 bg-rose-400/10 px-5 text-sm font-black text-rose-100 disabled:opacity-50"><X size={17}/>{t.answerNo}</button></div>
                </div>}
                {notice&&<div role="status" aria-live="polite" className="mt-4 rounded-xl border border-lime-200/15 bg-lime-200/[.07] p-4 text-sm font-bold text-lime-100">{notice}</div>}
              </section>

              <aside className="space-y-3">
                <section className="rounded-2xl border border-white/10 bg-[#171b3c]/95 p-4">
                  <div className="flex items-center gap-2"><Users size={17} className="text-cyan-200"/><h3 className="font-black text-white">{t.botCandidates}</h3></div>
                  <div className="mt-3 grid grid-cols-2 gap-2"><div className="rounded-xl bg-[#0b1028] p-3"><span className="text-[9px] font-black text-white/40">{ar?"احتمالات البوت":"BOT CANDIDATES"}</span><strong className="mt-1 block text-2xl font-black text-white">{botRemaining}</strong></div><div className="rounded-xl bg-[#0b1028] p-3"><span className="text-[9px] font-black text-white/40">{ar?"المستبعد":"ELIMINATED"}</span><strong className="mt-1 block text-2xl font-black text-white">{characters.length-botRemaining}</strong></div></div>
                  <div className="mt-3 flex items-center justify-between text-[10px] font-bold text-white/45"><span>{t.progress}</span><span>{characters.length?Math.round(((characters.length-botRemaining)/characters.length)*100):0}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-400 transition-all" style={{width:`${characters.length?((characters.length-botRemaining)/characters.length)*100:0}%`}}/></div>
                </section>
                <section className="rounded-2xl border border-white/10 bg-[#171b3c]/95 p-4">
                  <div className="flex items-center gap-2"><Crown size={17} className="text-amber-200"/><h3 className="font-black text-white">{t.yourSecret}</h3></div>
                  {mySecret&&<div className="mt-3 flex items-center gap-3 rounded-xl bg-[#0b1028] p-3"><div className="size-14 shrink-0 overflow-hidden rounded-lg"><CharacterPortrait name={mySecret.name} attributes={mySecret.attributes}/></div><div className="min-w-0"><p className="truncate text-sm font-black text-white">{mySecret.name}</p><p className="mt-1 text-[10px] text-lime-200">{t.locked}</p></div></div>}
                  <p className="mt-3 text-[10px] leading-5 text-white/45">{t.secretHint}</p>
                </section>
                <section className="rounded-2xl border border-white/10 bg-[#171b3c]/95 p-4">
                  <div className="flex items-center gap-2"><History size={17} className="text-violet-200"/><h3 className="font-black text-white">{t.history}</h3></div>
                  <div className="mt-3 space-y-2">{history.map(item=><div key={item.id} className="rounded-xl border border-white/5 bg-[#0e1431] p-3"><div className="flex items-center justify-between gap-2"><span className="text-[9px] font-black text-white/40">{item.speaker==="player"?t.player:t.bot}</span>{item.answer!==undefined&&<span className={`text-[9px] font-black ${item.answer?"text-emerald-300":"text-rose-300"}`}>{item.detail}</span>}</div><p className="mt-1 text-xs font-bold leading-5 text-white/85">{item.text}</p></div>)}{history.length===0&&<p className="rounded-xl bg-[#0e1431] p-3 text-xs text-white/40">{t.noHistory}</p>}</div>
                </section>
                <section className="grid gap-2 rounded-2xl border border-white/10 bg-[#171b3c]/95 p-3">
                  <button type="button" onClick={resetToSetup} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-lime-300/25 bg-lime-300/10 px-3 text-xs font-black text-lime-100 transition hover:bg-lime-300/15"><RotateCcw size={16}/>{t.changeLevel}</button>
                  <button type="button" onClick={()=>router.push("/play")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-black text-white/80 transition hover:bg-white/10"><Home size={16}/>{t.back}</button>
                </section>
              </aside>
            </div>
          </>
        )}
      </div>

      {(phase==="won"||phase==="lost")&&<div className="fixed inset-0 z-[99999] grid place-items-center overflow-y-auto bg-[#070a1c]/90 p-4 backdrop-blur-xl"><div className={`my-auto w-full max-w-lg rounded-[2rem] border p-6 text-center shadow-[0_30px_120px_rgba(0,0,0,.7)] sm:p-9 ${phase==="won"?"border-emerald-300/40 bg-gradient-to-br from-[#103c32] via-[#123b36] to-[#102a32]":"border-rose-300/40 bg-gradient-to-br from-[#451f36] via-[#351d36] to-[#211d3b]"}`}><div className={`mx-auto grid size-20 place-items-center rounded-[1.7rem] ${phase==="won"?"bg-emerald-300/15 text-emerald-200":"bg-rose-300/15 text-rose-200"}`}>{phase==="won"?<Trophy size={42}/>:<Bot size={42}/>}</div><p className="mt-5 text-[10px] font-black tracking-[.3em] text-lime-300">GUESS ARENA · RESULT</p><h2 className="mt-3 text-2xl font-black text-white">{phase==="won"?t.win:t.lose}</h2><p className="mt-3 text-sm font-bold leading-7 text-white/70">{phase==="won"?t.botSecret:t.botGuessedRight}</p><div className="mx-auto mt-5 flex max-w-xs items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-3 text-start"><div className="size-16 shrink-0 overflow-hidden rounded-lg"><CharacterPortrait name={botSecret?.name??""} attributes={botSecret?.attributes??{}}/></div><div><p className="text-[9px] font-black text-white/45">{t.bot} · {t.yourBoard}</p><p className="font-black text-white">{botSecret?.name}</p></div></div><div className="mt-7 grid gap-3 sm:grid-cols-2"><button type="button" onClick={resetToSetup} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-lime-300 to-emerald-300 px-4 font-black text-[#102018]"><RotateCcw size={17}/>{t.playAgain}</button><button type="button" onClick={()=>router.push("/play")} className="min-h-12 rounded-xl border border-white/15 bg-white/5 px-4 font-bold text-white">{t.back}</button></div></div></div>}
    </section>
  );}
