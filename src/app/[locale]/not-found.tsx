import { ArrowLeft, ArrowRight, Compass, Gamepad2, Home, Search, Sparkles, Swords } from "lucide-react";
import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function NotFoundPage() {
  const locale = await getLocale();
  const ar = locale === "ar";

  return (
    <main
      dir={ar ? "rtl" : "ltr"}
      className="relative isolate flex min-h-[calc(100svh-5rem)] items-center justify-center overflow-hidden bg-[#0c1028] px-5 py-16 text-white sm:px-8"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -start-40 top-0 size-[28rem] rounded-full bg-orange-500/20 blur-[120px]" />
        <div className="absolute -end-40 bottom-0 size-[32rem] rounded-full bg-lime-400/15 blur-[130px]" />
        <div className="absolute inset-0 opacity-[.08]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.35) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.35) 1px,transparent 1px)", backgroundSize: "42px 42px" }} />
      </div>

      <section className="mx-auto w-full max-w-4xl text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-orange-300/20 bg-orange-300/10 px-4 py-2 text-xs font-black tracking-[.18em] text-orange-200">
          <Sparkles size={15} />
          GUESS ARENA
        </div>

        <div className="relative mx-auto mt-8 flex max-w-2xl items-center justify-center">
          <div aria-hidden="true" className="absolute left-[12%] top-[8%] hidden size-20 rotate-[-14deg] rounded-3xl border border-lime-200/25 bg-lime-300/10 shadow-2xl backdrop-blur sm:block">
            <div className="grid h-full place-items-center text-3xl">?</div>
          </div>
          <div aria-hidden="true" className="absolute right-[12%] bottom-[5%] hidden size-16 rotate-[12deg] rounded-2xl border border-orange-200/25 bg-orange-300/10 shadow-2xl backdrop-blur sm:block">
            <div className="grid h-full place-items-center"><Compass className="text-orange-200" size={30} /></div>
          </div>
          <h1 className="select-none bg-gradient-to-b from-white via-orange-100 to-orange-400 bg-clip-text text-[clamp(7rem,24vw,15rem)] leading-[.82] font-black tracking-[-.09em] text-transparent drop-shadow-[0_18px_50px_rgba(249,115,22,.16)]">
            404
          </h1>
        </div>

        <div className="mx-auto mt-9 max-w-2xl">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[.06] text-lime-200 shadow-xl">
            <Search size={25} />
          </div>
          <h2 className="mt-6 text-2xl font-black tracking-tight sm:text-4xl">
            {ar ? "يبدو أنك خرجت عن حدود الساحة!" : "Looks like you left the arena!"}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-8 text-white/60 sm:text-base">
            {ar
              ? "الصفحة اللي بتدور عليها مش موجودة أو ممكن يكون رابطها اتغير. متقلقش، التحدي لسه مستنيك!"
              : "The page you're looking for doesn't exist or its link may have changed. No worries — your next challenge is waiting!"}
          </p>
        </div>

        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[.07] px-6 py-3 font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/[.12]"
          >
            <Home size={19} />
            {ar ? "الصفحة الرئيسية" : "Back to home"}
          </Link>
          <Link
            href="/play"
            className="arena-play-cta inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl px-7 py-3 font-black text-[#102018] transition hover:-translate-y-0.5"
          >
            <Swords size={19} />
            {ar ? "ارجع للتحدي" : "Back to the arena"}
            {ar ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
          </Link>
        </div>

        <p className="mt-10 text-[11px] font-bold tracking-[.22em] text-white/25">
          {ar ? "كل جولة لها فرصة جديدة" : "EVERY ROUND IS A NEW CHANCE"}
        </p>
      </section>
    </main>
  );
}
