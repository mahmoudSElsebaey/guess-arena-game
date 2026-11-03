"use client";

import { useEffect, useState } from "react";
import { MultiplayerGame } from "@/components/game/multiplayer-game";

type CharacterOption = { id: string; name: string; avatar: string; attributes: Record<string, string | boolean> };
type QuestionOption = { id: string; labelAr: string; labelEn: string; attributeKey: string; expectedValue: string | boolean; category: { slug: string; nameAr: string; nameEn: string }; sortOrder: number };

export function ActiveGamePage({ roomId, locale }: { roomId: string; locale: "ar" | "en" }) {
  const ar = locale === "ar";
  const [content, setContent] = useState<{ characters: CharacterOption[]; questions: QuestionOption[] } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void fetch("/api/game/content", { cache: "no-store" })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "CONTENT_LOAD_FAILED");
        if (active) setContent({ characters: data.characters ?? [], questions: data.questions ?? [] });
      })
      .catch(() => { if (active) setError(ar ? "تعذر تحميل محتوى اللعبة. حدّث الصفحة وحاول مرة أخرى." : "Could not load game content. Refresh and try again."); });
    return () => { active = false; };
  }, [ar]);

  if (error) return <main dir={ar ? "rtl" : "ltr"} className="grid min-h-screen place-items-center bg-[#0b1028] p-6 text-center text-white"><div><p className="font-bold">{error}</p><button type="button" onClick={() => window.location.reload()} className="mt-4 rounded-xl bg-lime-300 px-5 py-3 font-black text-slate-950">{ar ? "إعادة المحاولة" : "Retry"}</button></div></main>;
  if (!content) return <main dir={ar ? "rtl" : "ltr"} className="grid min-h-screen place-items-center bg-[#0b1028] p-6 text-white"><div className="text-center"><div className="mx-auto size-12 animate-spin rounded-full border-4 border-white/15 border-t-lime-300"/><p className="mt-4 text-sm font-bold text-white/65">{ar ? "جارٍ استعادة الجولة..." : "Restoring your match..."}</p></div></main>;

  return <main className="min-h-screen bg-[#0b1028] px-2 py-3 sm:px-4 sm:py-5"><MultiplayerGame roomId={roomId} locale={locale} characters={content.characters} questions={content.questions}/></main>;
}
