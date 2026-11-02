"use client";

import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { Gamepad2, Heart, Sparkles } from "lucide-react";

export function SiteFooter() {
  const locale = useLocale();
  const ar = locale === "ar";
  return (
    <footer className="arena-footer relative isolate mt-20 overflow-hidden text-white">
      <div className="arena-wave-top" aria-hidden="true"><svg viewBox="0 0 1440 64" preserveAspectRatio="none"><path d="M0 54C150 54 190 10 360 10C530 10 570 54 720 54C870 54 910 10 1080 10C1250 10 1290 54 1440 54V64H0Z" fill="#171536"/></svg></div>
      <div className="relative overflow-hidden bg-[#171536] px-5 pb-8 pt-14 sm:px-8 sm:pt-14">
        <div className="pointer-events-none absolute -start-20 top-10 size-80 rounded-full bg-fuchsia-500/20 blur-[100px]"/>
        <div className="pointer-events-none absolute -end-20 bottom-0 size-96 rounded-full bg-lime-400/15 blur-[110px]"/>
        <div className="relative mx-auto grid max-w-7xl gap-10 pb-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-3"><span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-lime-300 to-emerald-400 text-[#15142f] shadow-[0_0_28px_rgba(163,230,53,.25)]"><Gamepad2 size={25}/></span><span className="text-xl font-black">GUESS <span className="text-lime-300">ARENA</span></span></Link>
            <p className="mt-5 max-w-md text-sm leading-7 text-white/60">{ar ? "ساحة مليانة تحديات وضحك وتخمينات ذكية. اجمع أصحابك واكتشف مين يقدر يعرف الشخصية السرية أولاً!" : "A colorful arena for clever questions, friendly competition, and unforgettable guesses. Bring your friends and reveal the secret character!"}</p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-lime-200"><Sparkles size={14}/>{ar ? "جاهز للتحدي؟" : "Ready for a challenge?"}</div>
          </div>
          <div><h3 className="text-sm font-black text-white">{ar ? "استكشف" : "Explore"}</h3><div className="mt-4 grid gap-3 text-sm font-semibold text-white/60"><Link className="transition hover:text-lime-300" href="/">{ar ? "الرئيسية" : "Home"}</Link><Link className="transition hover:text-lime-300" href="/play">{ar ? "ابدأ اللعب" : "Play now"}</Link><Link className="transition hover:text-lime-300" href="/how-to-play">{ar ? "كيف تلعب؟" : "How to play"}</Link><Link className="transition hover:text-lime-300" href="/about">{ar ? "عن اللعبة" : "About the game"}</Link></div></div>
          <div><h3 className="text-sm font-black text-white">{ar ? "حسابك" : "Your account"}</h3><div className="mt-4 grid gap-3 text-sm font-semibold text-white/60"><Link className="transition hover:text-lime-300" href="/profile">{ar ? "الملف الشخصي" : "Profile"}</Link><Link className="transition hover:text-lime-300" href="/history">{ar ? "سجل المباريات" : "Match history"}</Link><Link className="transition hover:text-lime-300" href="/login">{ar ? "تسجيل الدخول" : "Sign in"}</Link></div></div>
        </div>
        <div className="relative mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-xs font-semibold text-white/40"><span>© {new Date().getFullYear()} GUESS ARENA. {ar ? "كل الحقوق محفوظة." : "All rights reserved."}</span><span className="inline-flex items-center gap-1.5">{ar ? "صُنعت بحب وروح تنافسية" : "Made with" } <Heart size={12} className="fill-fuchsia-400 text-fuchsia-400"/> {ar ? "وروح تنافسية" : "and a competitive spirit"}</span></div>
      </div>
    </footer>
  );
}
