import { localizedPageMetadata } from "@/lib/seo";
export async function generateMetadata({ params }: { params: Promise<{ locale: "ar" | "en" }> }) {
  const { locale } = await params;
  return localizedPageMetadata({
    locale, path: "/about",
    titleAr: "عن Guess Arena | لعبة تخمين الشخصيات",
    titleEn: "About Guess Arena | Character Guessing Game",
    descriptionAr: "تعرف على Guess Arena، لعبة تخمين الشخصيات التي تجمع الأصدقاء في منافسة مباشرة أو تتيح لك تحدي البوت.",
    descriptionEn: "Discover Guess Arena, the character guessing game that brings friends together for live duels or lets you challenge the bot.",
    keywords: locale === "ar" ? ["عن Guess Arena", "لعبة تخمين شخصيات"] : ["about Guess Arena", "character guessing game"]
  });
}

import { Gamepad2, HeartHandshake, Sparkles, Users, Zap } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { Link } from "@/i18n/navigation";
export default async function AboutPage({params}:{params:Promise<{locale:"ar"|"en"}>}) {
 const {locale}=await params; const ar=locale==="ar";
 return <main id="main-content" dir={ar?"rtl":"ltr"} className="warm-public-page min-h-screen"><SiteHeader locale={locale}/><section className="relative px-5 py-20 sm:px-8 sm:py-28"><div className="absolute -top-20 start-1/3 size-96 rounded-full bg-orange-500/15 blur-[110px]"/><div className="relative mx-auto max-w-5xl"><span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-black text-orange-700"><Sparkles size={15}/> GUESS ARENA</span><h1 className="mt-7 text-4xl font-black sm:text-6xl">{ar?"مش مجرد لعبة تخمين… دي ساحة تحدي!":"More than a guessing game. It's an arena!"}</h1><p className="mt-6 max-w-3xl text-lg leading-9 text-white/60">{ar?"Guess Arena بتجمع أصحابك في مواجهة مباشرة: كل لاعب يختار شخصية سرية، والأسئلة الذكية وتقليب البطاقات هما طريقك للفوز.":"Guess Arena brings friends together in a live duel. Each player picks a secret character, and clever questions plus smart card flips lead to victory."}</p><div className="mt-12 grid gap-4 sm:grid-cols-3">{[{i:Users,t:ar?"منافسة عادلة":"Friendly competition",d:ar?"غرف خاصة بين لاعبين.":"Private rooms for two players."},{i:HeartHandshake,t:ar?"اللعب مع الأصحاب":"Play with friends",d:ar?"شارك كود الغرفة وابدأوا فورًا.":"Share a room code and jump right in."},{i:Zap,t:ar?"قراراتك تصنع الفرق":"Your choices matter",d:ar?"أنت تتحكم في البطاقات وتوقيت التخمين.":"You control the board and when to guess."}].map(({i:I,t,d})=><article key={t} className="rounded-3xl border border-white/10 bg-white/[.05] p-6"><I size={27} className="text-lime-300"/><h2 className="mt-4 font-black">{t}</h2><p className="mt-2 text-sm leading-7 text-white/55">{d}</p></article>)}</div><Link href="/play" className="arena-play-cta mt-10 inline-flex min-h-13 items-center gap-2 rounded-xl px-6 py-3 font-black text-[#102018]"><Gamepad2 size={18}/>{ar?"ابدأ التحدي":"Enter the arena"}</Link></div></section></main>;
}