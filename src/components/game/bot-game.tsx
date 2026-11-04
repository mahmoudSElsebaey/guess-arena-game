"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { ArrowLeft, ArrowRight, Bot, Check, CircleHelp, Crown, RotateCcw, Sparkles, Swords, Trophy, UserRound, X, Zap } from "lucide-react";
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
    botGuessedWrong: "البوت خمن بشكل خاطئ واستبعد شخصية.", botGuessedRight: "البوت اكتشف شخصيتك السرية!",
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
    botGuessedWrong: "The bot guessed incorrectly and eliminated a character.", botGuessedRight: "The bot discovered your secret character!",
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
    setHistory(previous => [{ id: Date.now(), speaker: "player", text: ar ? question.labelAr : question.labelEn, answer, detail: ar ? (answer ? "نعم" : "لا") : (answer ? "Yes" : "No") }, ...previous].slice(0, 12));
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
    setHistory(previous => [{ id: Date.now(), speaker: "bot", text: ar ? question.labelAr : question.labelEn, answer, detail: ar ? (answer ? "أجبت بنعم" : "أجبت بلا") : (answer ? "You said yes" : "You said no") }, ...previous].slice(0, 12));
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
        setHistory(previous => [{ id: Date.now() + 1, speaker: "bot", text: ar ? `تخمين: ${guess.name}` : `Bot guessed: ${guess.name}`, detail: ar ? "تخمين خاطئ" : "Wrong guess" }, ...previous].slice(0, 12));
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
    <section dir={ar ? "rtl" : "ltr"} className="mx-auto w-full max-w-[1500px] px-3 py-5 text-white sm:px-6 sm:py-8">
      <header className="relative mb-6 overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#20234d] via-[#171b3c] to-[#102d35] p-5 shadow-2xl sm:p-8">
        <div className="pointer-events-none absolute -end-16 -top-24 size-72 rounded-full bg-lime-300/10 blur-3xl"/>
        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-lime-200/20 bg-lime-200/10 px-3 py-1.5 text-[10px] font-black tracking-[.2em] text-lime-200"><Bot size={14}/>{t.eyebrow}</span>
            <h1 className="mt-4 text-3xl font-black sm:text-5xl">{t.title}</h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-white/60 sm:text-base">{t.subtitle}</p>
          </div>
          <button type="button" onClick={() => router.push("/play")} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-bold text-white/80 transition hover:bg-white/10">{ar ? <ArrowRight size={17}/> : <ArrowLeft size={17}/>} {t.back}</button>
        </div>
      </header>

      {phase === "setup" ? (
        <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="h-fit rounded-[2rem] border border-white/10 bg-white/[.045] p-5 sm:p-6">
            <div className="flex items-center gap-2 text-lime-200"><Zap size={19}/><h2 className="font-black">{t.chooseLevel}</h2></div>
            <div className="mt-4 grid gap-3">
              {levels.map(level => <button key={level} type="button" onClick={() => setDifficulty(level)} className={`rounded-2xl border p-4 text-start transition ${difficulty === level ? "border-lime-300/60 bg-lime-300/10 shadow-lg shadow-lime-950/20" : "border-white/10 bg-black/10 hover:bg-white/[.06]"}`}>
                <span className="flex items-center justify-between gap-2 font-black"><span>{t[level]}</span>{difficulty === level && <Check size={17} className="text-lime-200"/>}</span>
                <span className="mt-1 block text-xs leading-5 text-white/50">{t[`${level}Desc` as "easyDesc" | "mediumDesc" | "hardDesc"]}</span>
              </button>)}
            </div>
            <div className="mt-5 rounded-2xl border border-cyan-200/10 bg-cyan-200/[.05] p-4">
              <div className="flex items-center gap-2 text-cyan-100"><CircleHelp size={17}/><span className="text-sm font-black">{t.yourSecret}</span></div>
              {mySecret ? <div className="mt-3 flex items-center gap-3"><div className="size-16 overflow-hidden rounded-xl bg-white/10"><CharacterPortrait name={mySecret.name} attributes={mySecret.attributes}/></div><div><p className="font-black">{mySecret.name}</p><p className="mt-1 text-xs text-lime-200">{t.locked}</p></div></div> : <p className="mt-2 text-xs leading-6 text-white/45">{t.chooseSecretHint}</p>}
            </div>
            <button type="button" disabled={!mySecretId} onClick={startGame} className="mt-5 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-lime-300 to-emerald-300 px-5 py-3 font-black text-[#102018] shadow-lg shadow-lime-950/20 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"><Swords size={18}/>{t.start}</button>
          </aside>
          <section className="rounded-[2rem] border border-white/10 bg-white/[.035] p-4 sm:p-6">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-black tracking-[.2em] text-lime-200">01 · SECRET PICK</p><h2 className="mt-2 text-xl font-black sm:text-2xl">{t.chooseSecret}</h2><p className="mt-1 text-xs leading-6 text-white/50">{t.chooseSecretHint}</p></div><span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white/60">{characters.length} {t.characters}</span></div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-3 lg:grid-cols-6 2xl:grid-cols-8">
              {characters.map(character => <button key={character.id} type="button" onClick={() => setMySecretId(character.id)} className={`group min-w-0 overflow-hidden rounded-2xl border p-1.5 text-start transition sm:p-2 ${mySecretId === character.id ? "border-lime-300 bg-lime-300/10 ring-2 ring-lime-300/30" : "border-white/10 bg-white/[.04] hover:border-white/25 hover:bg-white/[.08]"}`}>
                <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-[#22284a]"><CharacterPortrait name={character.name} attributes={character.attributes}/>{mySecretId === character.id && <span className="absolute inset-0 grid place-items-center bg-lime-300/15"><span className="grid size-9 place-items-center rounded-full bg-lime-300 text-slate-950"><Check size={21}/></span></span>}</div>
                <span className="mt-1.5 block truncate text-center text-[10px] font-extrabold text-white/85 sm:text-xs">{character.name}</span>
              </button>)}
            </div>
          </section>
        </div>
      ) : (
        <>
          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-lime-200/20 bg-lime-200/[.07] p-4"><div className="flex items-center gap-2 text-lime-100"><UserRound size={18}/><span className="text-sm font-black">{t.player}</span></div><p className="mt-2 text-2xl font-black tabular-nums">{remaining}<span className="ms-2 text-xs font-bold text-white/45">{t.remaining}</span></p></div>
            <div className="rounded-2xl border border-cyan-200/20 bg-cyan-200/[.06] p-4"><div className="flex items-center gap-2 text-cyan-100"><Bot size={18}/><span className="text-sm font-black">{t.botCandidates}</span></div><p className="mt-2 text-2xl font-black tabular-nums">{botRemaining}<span className="ms-2 text-xs font-bold text-white/45">{t.remaining}</span></p></div>
            <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4"><div className="flex items-center gap-2 text-amber-100"><Sparkles size={18}/><span className="text-sm font-black">{t.level}</span></div><p className="mt-2 text-2xl font-black">{t[difficulty]}</p></div>
          </div>

          {phase === "playing" && turn === "bot" && pendingBotQuestion && <div className="mb-5 rounded-[1.7rem] border border-cyan-200/30 bg-gradient-to-r from-cyan-400/10 to-violet-400/10 p-5 shadow-lg shadow-cyan-950/20">
            <div className="flex items-center gap-2 text-cyan-100"><Bot size={20}/><span className="text-xs font-black tracking-wider">{t.botThinking}</span></div>
            <h2 className="mt-3 text-xl font-black">{t.botQuestionIntro} {ar ? pendingBotQuestion.labelAr : pendingBotQuestion.labelEn}</h2>
            <p className="mt-2 text-xs text-white/45">{t.secretHint}</p>
            <div className="mt-4 flex flex-wrap gap-3"><button type="button" disabled={busy} onClick={() => answerBotQuestion(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-300 px-5 font-black text-[#102018] disabled:opacity-50"><Check size={17}/>{t.answerYes}</button><button type="button" disabled={busy} onClick={() => answerBotQuestion(false)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-rose-400 px-5 font-black text-[#281018] disabled:opacity-50"><X size={17}/>{t.answerNo}</button></div>
          </div>}

          <div className="grid items-start gap-5 2xl:grid-cols-[minmax(0,1fr)_340px]">
            <section className="min-w-0 rounded-[2rem] border border-white/10 bg-white/[.035] p-3 sm:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-1"><div><p className="text-[10px] font-black tracking-[.2em] text-lime-200">GUESS ARENA · BOT DUEL</p><h2 className="mt-1 text-xl font-black">{t.yourBoard}</h2></div><span className={`rounded-full px-3 py-1.5 text-xs font-black ${turn === "player" ? "bg-lime-200/15 text-lime-100" : "bg-cyan-200/15 text-cyan-100"}`}>{turn === "player" ? t.turnPlayer : t.turnBot}</span></div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8">
                {characters.map(character => {
                  const out = playerEliminated.has(character.id);
                  return <button key={character.id} type="button" disabled={phase !== "playing" || turn !== "player" || out} onClick={() => guessCharacter(character)} className={`group relative min-w-0 overflow-hidden rounded-2xl border p-1.5 text-center transition sm:p-2 ${out ? "border-white/5 bg-black/20 opacity-25 grayscale" : "border-white/10 bg-white/[.055] hover:-translate-y-0.5 hover:border-lime-200/40 hover:bg-white/10"} disabled:cursor-not-allowed`}>
                    <div className="aspect-[4/5] overflow-hidden rounded-xl bg-[#22284a]"><CharacterPortrait name={character.name} attributes={character.attributes}/></div>
                    <span className="mt-1.5 block truncate text-[10px] font-extrabold text-white/85 sm:text-xs">{character.name}</span>
                    {out && <span className="absolute inset-0 grid place-items-center"><span className="grid size-8 place-items-center rounded-full bg-rose-500/90 text-white"><X size={18}/></span></span>}
                  </button>;
                })}
              </div>
              {phase === "playing" && turn === "player" && <div className="mt-5 rounded-2xl border border-white/10 bg-black/15 p-4">
                <div className="flex items-center gap-2"><CircleHelp size={18} className="text-lime-200"/><h3 className="font-black">{t.ask}</h3></div><p className="mt-1 text-xs leading-6 text-white/45">{t.askHint}</p>
                <div className="mt-3 flex flex-wrap gap-2">{availablePlayerQuestions.map(question => <button key={question.id} type="button" onClick={() => askBot(question)} className="rounded-xl border border-white/10 bg-white/[.06] px-3 py-2.5 text-xs font-bold text-white/80 transition hover:border-lime-200/30 hover:bg-lime-200/10">{ar ? question.labelAr : question.labelEn}</button>)}</div>
                {availablePlayerQuestions.length === 0 && <p className="mt-3 text-xs font-bold text-amber-200">{t.allQuestions}</p>}
              </div>}
              {notice && <div role="status" aria-live="polite" className="mt-4 rounded-2xl border border-lime-200/15 bg-lime-200/[.07] p-4 text-sm font-bold text-lime-100">{notice}</div>}
            </section>

            <aside className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-1">
              <section className="rounded-3xl border border-white/10 bg-white/[.045] p-5">
                <div className="flex items-center gap-2"><Crown size={18} className="text-amber-200"/><h2 className="font-black">{t.yourSecret}</h2></div>
                {mySecret && <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white/[.05] p-3"><div className="size-16 overflow-hidden rounded-xl"><CharacterPortrait name={mySecret.name} attributes={mySecret.attributes}/></div><div><p className="font-black">{mySecret.name}</p><p className="mt-1 text-xs text-lime-200">{t.locked}</p></div></div>}
                <p className="mt-3 text-xs leading-6 text-white/45">{t.secretHint}</p>
                <div className="mt-4 flex items-center justify-between text-xs font-bold text-white/50"><span>{t.progress}</span><span>{characters.length ? Math.round(((characters.length - botRemaining) / characters.length) * 100) : 0}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-400 transition-all" style={{ width: `${characters.length ? ((characters.length - botRemaining) / characters.length) * 100 : 0}%` }}/></div>
              </section>
              <section className="rounded-3xl border border-white/10 bg-white/[.045] p-5"><div className="flex items-center gap-2"><Sparkles size={18} className="text-cyan-200"/><h2 className="font-black">{t.history}</h2></div>{history.length === 0 ? <p className="mt-4 text-xs text-white/40">{t.noHistory}</p> : <ol className="mt-4 space-y-3">{history.map(item => <li key={item.id} className="rounded-xl bg-black/15 p-3"><div className="flex items-center justify-between gap-2"><span className="text-[10px] font-black text-white/45">{item.speaker === "player" ? t.player : t.bot}</span>{item.answer !== undefined && <span className={`text-[10px] font-black ${item.answer ? "text-emerald-300" : "text-rose-300"}`}>{item.detail}</span>}</div><p className="mt-1 text-xs font-bold leading-5 text-white/80">{item.text}</p></li>)}</ol>}</section>
            </aside>
          </div>

          {phase === "won" || phase === "lost" ? <div className="fixed inset-0 z-[99999] grid place-items-center bg-[#070a1c]/90 p-4 backdrop-blur-xl"><div className={`w-full max-w-lg rounded-[2rem] border p-7 text-center shadow-[0_30px_120px_rgba(0,0,0,.7)] ${phase === "won" ? "border-lime-200/30 bg-gradient-to-br from-[#183c32] to-[#171b3c]" : "border-rose-200/30 bg-gradient-to-br from-[#451f36] to-[#171b3c]"}`}><div className="mx-auto grid size-20 place-items-center rounded-3xl bg-white/10">{phase === "won" ? <Trophy size={42} className="text-lime-200"/> : <Bot size={42} className="text-rose-200"/>}</div><h2 className="mt-5 text-3xl font-black">{phase === "won" ? t.win : t.lose}</h2><p className="mt-3 text-sm leading-7 text-white/60">{phase === "won" ? t.botSecret : t.botGuessedRight}</p><div className="mx-auto mt-5 flex max-w-xs items-center gap-3 rounded-2xl bg-white/10 p-3 text-start"><div className="size-16 overflow-hidden rounded-xl"><CharacterPortrait name={botSecret?.name ?? ""} attributes={botSecret?.attributes ?? {}}/></div><div><p className="text-xs text-white/50">{t.bot} · {t.yourBoard}</p><p className="font-black">{botSecret?.name}</p></div></div><div className="mt-7 grid gap-3 sm:grid-cols-2"><button type="button" onClick={resetToSetup} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-lime-300 to-emerald-300 px-4 font-black text-[#102018]"><RotateCcw size={17}/>{t.playAgain}</button><button type="button" onClick={() => router.push("/play")} className="min-h-12 rounded-xl border border-white/15 bg-white/5 px-4 font-bold">{t.back}</button></div></div></div> : null}
        </>
      )}
    </section>
  );
}
