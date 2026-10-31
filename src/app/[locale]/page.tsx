import { ArrowUpLeft, Brain, Users, Zap } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { SiteHeader } from "@/components/layout/site-header";
import { Link } from "@/i18n/navigation";

export default async function HomePage({ params }: { params: Promise<{ locale: "ar" | "en" }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  const features = [
    { icon: Users, title: t("featureOneTitle"), description: t("featureOneDescription") },
    { icon: Brain, title: t("featureTwoTitle"), description: t("featureTwoDescription") },
    { icon: Zap, title: t("featureThreeTitle"), description: t("featureThreeDescription") }
  ];

  return (
    <main className="min-h-screen overflow-hidden">
      <SiteHeader locale={locale} />
      <section className="relative isolate">
        <div className="pointer-events-none absolute -top-36 start-1/3 -z-10 size-[34rem] rounded-full bg-violet-200/45 blur-3xl" />
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-4 py-2 text-sm font-bold text-violet-700 shadow-sm">
              <span className="size-2 rounded-full bg-[var(--secondary)]" />{t("eyebrow")}
            </span>
            <h1 className="mt-7 text-5xl leading-[1.15] font-black tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
              {t("title")}<span className="mt-2 block text-[var(--primary)]">{t("titleAccent")}</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-9 text-slate-600">{t("description")}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/login" className="inline-flex min-h-13 items-center gap-3 rounded-xl bg-[var(--primary)] px-6 py-3 font-bold text-white shadow-xl shadow-violet-200 transition hover:-translate-y-0.5 hover:bg-violet-700">
                {t("primaryAction")}<ArrowUpLeft size={18} aria-hidden="true" />
              </Link>
              <Link href="/register" className="inline-flex min-h-13 items-center rounded-xl border border-[var(--border)] bg-white px-6 py-3 font-bold text-slate-700 transition hover:border-violet-200 hover:bg-violet-50">{t("secondaryAction")}</Link>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute -inset-5 rounded-[2.5rem] bg-gradient-to-br from-violet-200/70 via-cyan-100/50 to-amber-100/70 blur-2xl" />
            <div className="relative rounded-[2rem] border border-white bg-white p-5 shadow-2xl shadow-slate-300/60 sm:p-7">
              <div className="mb-5 flex items-center justify-between">
                <div><p className="text-xs font-bold tracking-[0.2em] text-violet-500">GUESS ARENA</p><p className="mt-1 text-lg font-black text-slate-900">45</p></div>
                <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">LIVE DUEL</span>
              </div>
              <div className="grid grid-cols-5 gap-2.5" aria-label="Decorative character board preview">
                {Array.from({ length: 15 }, (_, index) => (
                  <div key={index} className={`grid aspect-[4/5] place-items-center rounded-xl border ${index === 6 ? "border-violet-400 bg-violet-100 ring-2 ring-violet-200" : index % 4 === 0 ? "border-amber-100 bg-amber-50" : "border-slate-100 bg-slate-50"}`}>
                    <span className={`grid size-8 place-items-center rounded-full text-xs font-black ${index % 3 === 0 ? "bg-violet-200 text-violet-800" : index % 3 === 1 ? "bg-teal-100 text-teal-800" : "bg-amber-100 text-amber-800"}`}>{String.fromCharCode(65 + index)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-sm font-semibold text-slate-600">Your next move</span>
                <span className="rounded-lg bg-[var(--secondary)] px-3 py-1.5 text-xs font-black text-slate-900">ASK A QUESTION</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-4 px-5 pb-20 sm:grid-cols-3 sm:px-8">
        {features.map(({ icon: Icon, title, description }) => (
          <article key={title} className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
            <span className="grid size-11 place-items-center rounded-xl bg-violet-50 text-[var(--primary)]"><Icon size={21} aria-hidden="true" /></span>
            <h2 className="mt-5 text-lg font-extrabold text-slate-900">{title}</h2>
            <p className="mt-2 leading-7 text-slate-600">{description}</p>
          </article>
        ))}
      </section>
      <footer className="border-t border-[var(--border)] bg-white px-5 py-6 text-center text-sm text-slate-400">{t("phaseLabel")}</footer>
    </main>
  );
}
