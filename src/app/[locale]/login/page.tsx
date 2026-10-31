import { getTranslations } from "next-intl/server";
import { AuthForm } from "@/components/auth/auth-form";
import { SiteHeader } from "@/components/layout/site-header";
import { Link } from "@/i18n/navigation";

export default async function LoginPage({ params }: { params: Promise<{ locale: "ar" | "en" }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  const demoAccounts = [
    {
      label: locale === "ar" ? "اللاعب الأول" : "Player 1",
      email: process.env.NEXT_PUBLIC_DEMO_PLAYER_ONE_EMAIL,
      password: process.env.NEXT_PUBLIC_DEMO_PLAYER_ONE_PASSWORD
    },
    {
      label: locale === "ar" ? "اللاعب الثاني" : "Player 2",
      email: process.env.NEXT_PUBLIC_DEMO_PLAYER_TWO_EMAIL,
      password: process.env.NEXT_PUBLIC_DEMO_PLAYER_TWO_PASSWORD
    }
  ].filter((account): account is { label: string; email: string; password: string } =>
    Boolean(account.email && account.password)
  );

  return (
    <main className="min-h-screen">
      <SiteHeader locale={locale} />
      <section className="relative isolate flex min-h-[calc(100vh-72px)] items-center justify-center overflow-hidden px-5 py-14">
        <div className="pointer-events-none absolute -top-32 start-1/4 -z-10 size-96 rounded-full bg-violet-200/50 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-36 end-1/4 -z-10 size-96 rounded-full bg-teal-100/70 blur-3xl" />
        <div className="grid w-full max-w-5xl items-center gap-10 lg:grid-cols-[1fr_0.9fr]">
          <div className="hidden lg:block">
            <p className="text-sm font-black tracking-[0.22em] text-violet-600">GUESS ARENA</p>
            <h1 className="mt-5 text-5xl font-black leading-tight text-slate-950">{t("loginTitle")}</h1>
            <p className="mt-5 max-w-md text-lg leading-8 text-slate-500">{t("loginDescription")}</p>
            <div className="mt-8 grid grid-cols-5 gap-3">
              {Array.from({ length: 15 }, (_, i) => (
                <div key={i} className={`aspect-[4/5] rounded-2xl border p-2 shadow-sm ${i % 3 === 0 ? "border-violet-100 bg-violet-50" : i % 3 === 1 ? "border-teal-100 bg-teal-50" : "border-amber-100 bg-amber-50"}`}>
                  <span className="grid size-8 place-items-center rounded-full bg-white text-xs font-black text-slate-600">{String.fromCharCode(65 + i)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="w-full">
            <div className="mb-7 text-center lg:text-start">
              <h1 className="text-3xl font-black text-slate-950 lg:hidden">{t("loginTitle")}</h1>
              <p className="mt-3 text-slate-500">{t("loginDescription")}</p>
            </div>
            <AuthForm mode="login" demoAccounts={demoAccounts} />
            <p className="mt-6 text-center text-sm text-slate-500">{t("noAccount")} <Link href="/register" className="font-bold text-violet-700">{t("registerLink")}</Link></p>
          </div>
        </div>
      </section>
    </main>
  );
}
