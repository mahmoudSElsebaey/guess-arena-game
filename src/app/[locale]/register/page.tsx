import { getTranslations } from "next-intl/server";
import { AuthForm } from "@/components/auth/auth-form";
import { SiteHeader } from "@/components/layout/site-header";
import { Link } from "@/i18n/navigation";

export default async function RegisterPage({ params }: { params: Promise<{ locale: "ar" | "en" }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return (
    <main className="min-h-screen">
      <SiteHeader locale={locale} />
      <section className="relative isolate flex min-h-[calc(100vh-72px)] items-center justify-center overflow-hidden px-5 py-14">
        <div className="pointer-events-none absolute -top-32 end-1/4 -z-10 size-96 rounded-full bg-violet-200/50 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-36 start-1/4 -z-10 size-96 rounded-full bg-amber-100/70 blur-3xl" />
        <div className="grid w-full max-w-5xl items-center gap-10 lg:grid-cols-[1fr_0.9fr]">
          <div className="hidden lg:block">
            <p className="text-sm font-black tracking-[0.22em] text-violet-600">JOIN THE ARENA</p>
            <h1 className="mt-5 text-5xl font-black leading-tight text-slate-950">{t("registerTitle")}</h1>
            <p className="mt-5 max-w-md text-lg leading-8 text-slate-500">{t("registerDescription")}</p>
            <div className="mt-8 flex items-center gap-3">
              <span className="grid size-12 place-items-center rounded-2xl bg-violet-100 font-black text-violet-700">45</span>
              <span className="grid size-12 place-items-center rounded-2xl bg-teal-100 font-black text-teal-700">2</span>
              <span className="grid size-12 place-items-center rounded-2xl bg-amber-100 font-black text-amber-700">1</span>
              <span className="text-sm font-semibold text-slate-500">{locale === "ar" ? "لوحة واحدة. منافسان. فائز واحد." : "One board. Two players. One winner."}</span>
            </div>
          </div>
          <div className="w-full">
            <div className="mb-7 text-center lg:text-start">
              <h1 className="text-3xl font-black text-slate-950 lg:hidden">{t("registerTitle")}</h1>
              <p className="mt-3 text-slate-500">{t("registerDescription")}</p>
            </div>
            <AuthForm mode="register" />
            <p className="mt-6 text-center text-sm text-slate-500">{t("hasAccount")} <Link href="/login" className="font-bold text-violet-700">{t("loginLink")}</Link></p>
          </div>
        </div>
      </section>
    </main>
  );
}
