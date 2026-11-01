import { ArrowUpLeft, Brain, Users, Zap, Swords, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { SiteHeader } from "@/components/layout/site-header";
import { Link } from "@/i18n/navigation";

export default async function HomePage({ params }: { params: Promise<{ locale: "ar" | "en" }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  const features = [
    { icon: Users, title: t("featureOneTitle"), description: t("featureOneDescription"), tone: "violet" },
    { icon: Brain, title: t("featureTwoTitle"), description: t("featureTwoDescription"), tone: "teal" },
    { icon: Zap, title: t("featureThreeTitle"), description: t("featureThreeDescription"), tone: "amber" }
  ];

  return (
    <main className="min-h-screen overflow-hidden">
      <SiteHeader locale={locale} />
      <section className="relative isolate">
        <div className="pointer-events-none absolute -top-40 start-1/3 -z-10 size-[36rem] rounded-full bg-violet-200/50 blur-3xl" />
        <div className="pointer-events-none absolute top-40 end-0 -z-10 size-80 rounded-full bg-teal-100/70 blur-3xl" />
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1fr_0.95fr]">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-4 py-2 text-sm font-bold text-violet-700 shadow-sm">
              <Sparkles size={15} aria-hidden="true" />{t("eyebrow")}
            </span>
            <h1 className="mt-7 text-5xl leading-[1.16] font-black tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
              {t("title")}<span className="mt-2 block bg-gradient-to-l from-violet-700 via-violet-500 to-teal-500 bg-clip-text text-transparent">{t("titleAccent")}</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-9 text-slate-600">{t("description")}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/play" className="inline-flex min-h-13 items-center gap-3 rounded-xl bg-[var(--foreground)] px-6 py-3 font-bold text-white shadow-xl shadow-slate-300 transition hover:-translate-y-0.5 hover:bg-violet-800">
                <Swords size={18} aria-hidden="true" />{t("primaryAction")}<ArrowUpLeft size={18} aria-hidden="true" />
              </Link>
              <Link href="/register" className="inline-flex min-h-13 items-center rounded-xl border border-[var(--border)] bg-white px-6 py-3 font-bold text-slate-700 transition hover:border-violet-200 hover:bg-violet-50">{t("secondaryAction")}</Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-semibold text-slate-500">
              <span className="inline-flex items-center gap-2"><span className="size-2 rounded-full bg-teal-400" />{t("liveLabel")}</span>
              <span className="inline-flex items-center gap-2"><Users size={16} />{t("playersLabel")}</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-5 rounded-[2.5rem] bg-gradient-to-br from-violet-300/60 via-teal-100/70 to-amber-100/70 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-2xl shadow-slate-300/70 backdrop-blur-xl sm:p-7">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black tracking-[0.22em] text-violet-500">GUESS ARENA</p>
                  <h2 className="mt-1 text-xl font-black text-slate-900">{t("boardLabel")}</h2>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-extrabold text-emerald-700"><span className="size-2 animate-pulse rounded-full bg-emerald-500" />45 CHARACTERS</span>
              </div>
              <div className="grid grid-cols-5 gap-2 sm:gap-2.5" aria-label="45 character board preview">
                {Array.from({ length: 45 }, (_, index) => (
                  <div key={index} className={`group relative grid aspect-[4/5] place-items-center overflow-hidden rounded-xl border transition duration-200 hover:-translate-y-1 hover:shadow-md sm:rounded-2xl ${index === 17 ? "border-violet-300 bg-violet-100 ring-2 ring-violet-200" : index % 3 === 0 ? "border-violet-100 bg-gradient-to-br from-violet-50 to-indigo-100" : index % 3 === 1 ? "border-teal-100 bg-gradient-to-br from-teal-50 to-emerald-100" : "border-amber-100 bg-gradient-to-br from-amber-50 to-orange-100"}`}>
                    <span className={`grid size-7 place-items-center rounded-full bg-white/90 text-[10px] font-black shadow-sm sm:size-9 sm:text-xs ${index % 3 === 0 ? "text-violet-700" : index % 3 === 1 ? "text-teal-700" : "text-amber-700"}`}>{String(index + 1).padStart(2, "0")}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-slate-950 px-4 py-3.5 text-white">
                <div><p className="text-xs font-bold text-slate-400">{t("boardHint")}</p><p className="mt-1 text-sm font-extrabold">{t("liveLabel")}</p></div>
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--secondary)] text-slate-950"><Swords size={20} /></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-5 pb-20 sm:grid-cols-3 sm:px-8">
        {features.map(({ icon: Icon, title, description, tone }) => (
          <article key={title} className="group rounded-2xl border border-[var(--border)] bg-white/90 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/70">
            <span className={`grid size-12 place-items-center rounded-2xl ${tone === "violet" ? "bg-violet-100 text-violet-700" : tone === "teal" ? "bg-teal-100 text-teal-700" : "bg-amber-100 text-amber-700"}`}><Icon size={22} aria-hidden="true" /></span>
            <h2 className="mt-5 text-lg font-extrabold text-slate-900">{title}</h2>
            <p className="mt-2 leading-7 text-slate-600">{description}</p>
          </article>
        ))}
      </section>
      <footer className="border-t border-[var(--border)] bg-white/80 px-5 py-7 text-center text-sm text-slate-400">GUESS ARENA · {t("phaseLabel")}</footer>
    </main>
  );
}
