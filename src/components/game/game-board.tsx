"use client";

import { useMemo, useState } from "react";
import { Check, Eye, EyeOff, Flag, HelpCircle, RotateCcw, Sparkles, Trophy, X } from "lucide-react";
import { characters, type Character } from "@/data/characters";

type Locale = "ar" | "en";

const labels = {
  ar: {
    title: "ساحة اللعب",
    subtitle: "اختر شخصيتك السرية ثم ابدأ في استبعاد الشخصيات حتى تصل للإجابة الصحيحة.",
    target: "شخصيتك السرية",
    chooseTarget: "اختيار شخصية سرية",
    targetHint: "هذه النسخة التدريبية تحاكي منطق اللعبة قبل اللعب المباشر.",
    questions: "أسئلة سريعة",
    board: "لوحة الشخصيات",
    remaining: "المتبقي",
    eliminated: "المستبعد",
    ask: "اسأل",
    yes: "نعم",
    no: "لا",
    guess: "تخمين الشخصية",
    reset: "إعادة الجولة",
    correct: "إجابة صحيحة! 🎉",
    wrong: "ليست الشخصية الصحيحة",
    won: "أحسنت! لقد وجدت الشخصية.",
    chooseFirst: "اختر شخصية سرية أولاً",
    hide: "استبعاد",
    restore: "استرجاع",
    hat: "هل ترتدي الشخصية قبعة؟",
    glasses: "هل ترتدي الشخصية نظارات؟",
    beard: "هل لدى الشخصية لحية؟",
    male: "هل الشخصية رجل؟",
    female: "هل الشخصية امرأة؟",
    shortHair: "هل شعرها قصير؟",
    log: "سجل الجولة",
    noLog: "لم تسأل أي سؤال بعد",
    turn: "دورك الآن"
  },
  en: {
    title: "Play Arena",
    subtitle: "Choose your secret character, eliminate cards, and narrow the board until you make your final guess.",
    target: "Your secret character",
    chooseTarget: "Choose secret character",
    targetHint: "This training build simulates the game logic before live multiplayer.",
    questions: "Quick questions",
    board: "Character board",
    remaining: "Remaining",
    eliminated: "Eliminated",
    ask: "Ask",
    yes: "Yes",
    no: "No",
    guess: "Guess character",
    reset: "Reset round",
    correct: "Correct answer! 🎉",
    wrong: "Not the correct character",
    won: "Nice! You found the character.",
    chooseFirst: "Choose a secret character first",
    hide: "Eliminate",
    restore: "Restore",
    hat: "Does the character wear a hat?",
    glasses: "Does the character wear glasses?",
    beard: "Does the character have a beard?",
    male: "Is the character male?",
    female: "Is the character female?",
    shortHair: "Does the character have short hair?",
    log: "Round activity",
    noLog: "No questions asked yet",
    turn: "Your turn"
  }
} as const;

const questionKeys = [
  ["hat", (c: Character) => c.hasHat],
  ["glasses", (c: Character) => c.hasGlasses],
  ["beard", (c: Character) => c.hasBeard],
  ["male", (c: Character) => c.gender === "male"],
  ["female", (c: Character) => c.gender === "female"],
  ["shortHair", (c: Character) => c.hairLength === "short"]
] as const;

export function GameBoard({ locale }: { locale: Locale }) {
  const t = labels[locale];
  const [targetId, setTargetId] = useState<string | null>(null);
  const [eliminated, setEliminated] = useState<Set<string>>(new Set());
  const [log, setLog] = useState<string[]>([]);
  const [message, setMessage] = useState<string>("");
  const target = useMemo(() => characters.find((c) => c.id === targetId) ?? null, [targetId]);

  const remaining = characters.length - eliminated.size;

  function toggleCard(id: string) {
    setEliminated((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function askQuestion(label: string, predicate: (character: Character) => boolean) {
    if (!target) {
      setMessage(t.chooseFirst);
      return;
    }
    const answer = predicate(target);
    setLog((previous) => [`${label} — ${answer ? t.yes : t.no}`, ...previous].slice(0, 6));
    setMessage(`${t.ask}: ${answer ? t.yes : t.no}`);
  }

  function guess(character: Character) {
    if (!target) {
      setMessage(t.chooseFirst);
      return;
    }
    if (character.id === target.id) {
      setMessage(`${t.correct} ${t.won}`);
    } else {
      setMessage(`${t.wrong}: ${character.name}`);
      setEliminated((previous) => new Set([...previous, character.id]));
    }
  }

  function reset() {
    setTargetId(null);
    setEliminated(new Set());
    setLog([]);
    setMessage("");
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.16),transparent_35%),linear-gradient(to_bottom,#f8fafc,#eef2ff)]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-10">
        <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-3 py-1.5 text-xs font-black text-violet-700"><Sparkles size={14} /> PHASE 2 · CORE GAME</div>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">{t.title}</h1>
            <p className="mt-3 max-w-2xl text-slate-600">{t.subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="rounded-xl border border-white bg-white px-4 py-3 shadow-sm"><span className="block text-[11px] font-bold text-slate-400">{t.remaining}</span><span className="text-xl font-black text-slate-900">{remaining}</span></div>
            <div className="rounded-xl border border-white bg-white px-4 py-3 shadow-sm"><span className="block text-[11px] font-bold text-slate-400">{t.eliminated}</span><span className="text-xl font-black text-rose-600">{eliminated.size}</span></div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[280px_1fr_280px]">
          <aside className="space-y-5">
            <section className="rounded-3xl border border-white bg-white p-5 shadow-xl shadow-slate-200/60">
              <div className="flex items-center gap-2 text-slate-900"><Trophy size={18} className="text-amber-500" /><h2 className="font-black">{t.target}</h2></div>
              {target ? (
                <div className="mt-5 rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-100 p-5 text-center">
                  <div className="mx-auto grid size-24 place-items-center rounded-3xl bg-white text-6xl shadow-sm">{target.avatar}</div>
                  <p className="mt-3 font-black text-slate-900">{target.name}</p>
                  <p className="mt-1 text-xs text-violet-700">{t.targetHint}</p>
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-500">{t.chooseTarget}</div>
              )}
            </section>

            <section className="rounded-3xl border border-white bg-white p-5 shadow-xl shadow-slate-200/60">
              <div className="flex items-center gap-2"><HelpCircle size={18} className="text-violet-600" /><h2 className="font-black text-slate-900">{t.questions}</h2></div>
              <div className="mt-4 grid gap-2">
                {questionKeys.map(([key, predicate]) => (
                  <button key={key} type="button" onClick={() => askQuestion(t[key], predicate)} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-start text-sm font-bold text-slate-700 transition hover:border-violet-200 hover:bg-violet-50">{t[key]}</button>
                ))}
              </div>
            </section>
          </aside>

          <section className="rounded-[2rem] border border-white bg-white p-4 shadow-2xl shadow-slate-200/70 sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div><p className="text-xs font-black tracking-[0.16em] text-violet-600">{t.turn}</p><h2 className="mt-1 text-xl font-black text-slate-950">{t.board}</h2></div>
              <button type="button" onClick={reset} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50"><RotateCcw size={16} />{t.reset}</button>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-3 lg:grid-cols-9">
              {characters.map((character) => {
                const isEliminated = eliminated.has(character.id);
                const isTarget = targetId === character.id;
                return (
                  <article key={character.id} className={`group relative overflow-hidden rounded-2xl border p-2 transition duration-200 sm:p-3 ${isEliminated ? "border-slate-200 bg-slate-100 opacity-40 grayscale" : isTarget ? "border-violet-400 bg-violet-50 ring-2 ring-violet-200" : "border-slate-100 bg-white hover:-translate-y-1 hover:border-violet-200 hover:shadow-lg"}`}>
                    <button type="button" onClick={() => setTargetId(character.id)} className="w-full text-center" aria-label={`${t.chooseTarget}: ${character.name}`}>
                      <span className="mx-auto grid aspect-square w-full place-items-center rounded-xl bg-gradient-to-br from-violet-50 via-indigo-50 to-teal-50 text-4xl sm:text-5xl">{character.avatar}</span>
                      <span className="mt-2 block truncate text-xs font-black text-slate-800">{character.name}</span>
                    </button>
                    <div className="mt-2 flex gap-1">
                      <button type="button" onClick={() => toggleCard(character.id)} className="grid min-h-7 flex-1 place-items-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200" aria-label={isEliminated ? t.restore : t.hide}>{isEliminated ? <Eye size={14} /> : <EyeOff size={14} />}</button>
                      <button type="button" onClick={() => guess(character)} className="grid min-h-7 flex-1 place-items-center rounded-lg bg-violet-100 text-violet-700 hover:bg-violet-200" aria-label={t.guess}><Flag size={14} /></button>
                    </div>
                    {isTarget && <span className="absolute end-2 top-2 grid size-6 place-items-center rounded-full bg-violet-600 text-white"><Check size={14} /></span>}
                  </article>
                );
              })}
            </div>
          </section>

          <aside className="space-y-5">
            <section className="rounded-3xl border border-white bg-white p-5 shadow-xl shadow-slate-200/60">
              <h2 className="font-black text-slate-900">{t.log}</h2>
              <div className="mt-4 space-y-2">
                {log.length === 0 ? <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-400">{t.noLog}</p> : log.map((item, index) => <p key={index} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-sm font-bold text-slate-700">{item}</p>)}
              </div>
            </section>
            {message && <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4 text-sm font-bold text-violet-900">{message}</div>}
            <div className="rounded-2xl bg-slate-950 p-5 text-white">
              <p className="text-xs font-black tracking-[0.16em] text-teal-300">HOW TO PLAY</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">{t.targetHint}</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
