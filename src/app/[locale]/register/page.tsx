import { localizedPageMetadata } from "@/lib/seo";
export async function generateMetadata({ params }: { params: Promise<{ locale: "ar" | "en" }> }) { const { locale } = await params; return localizedPageMetadata({ locale, path: "/register", titleAr: "إنشاء حساب جديد", titleEn: "Create an Account", descriptionAr: "أنشئ حسابك وابدأ اللعب في Guess Arena.", descriptionEn: "Create your account and start playing Guess Arena.", indexable: false }); }

import { getTranslations } from "next-intl/server";
import { AuthForm } from "@/components/auth/auth-form";
import { SiteHeader } from "@/components/layout/site-header";
import { Link } from "@/i18n/navigation";

export default async function RegisterPage({ params }: { params: Promise<{ locale: "ar" | "en" }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  const demoAccounts = [
    {
      label: locale === "ar" ? "المالك" : "Owner",
      role: "OWNER" as const,
      email: process.env.NEXT_PUBLIC_DEMO_OWNER_EMAIL,
      password: process.env.NEXT_PUBLIC_DEMO_OWNER_PASSWORD
    },
    {
      label: locale === "ar" ? "المشرف" : "Admin",
      role: "ADMIN" as const,
      email: process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL,
      password: process.env.NEXT_PUBLIC_DEMO_ADMIN_PASSWORD
    },
    {
      label: locale === "ar" ? "اللاعب الأول" : "Player 1",
      role: "PLAYER" as const,
      email: process.env.NEXT_PUBLIC_DEMO_PLAYER_ONE_EMAIL,
      password: process.env.NEXT_PUBLIC_DEMO_PLAYER_ONE_PASSWORD
    },
    {
      label: locale === "ar" ? "اللاعب الثاني" : "Player 2",
      role: "PLAYER" as const,
      email: process.env.NEXT_PUBLIC_DEMO_PLAYER_TWO_EMAIL,
      password: process.env.NEXT_PUBLIC_DEMO_PLAYER_TWO_PASSWORD
    }
  ].filter((account): account is { label: string; role: "OWNER" | "ADMIN" | "PLAYER"; email: string; password: string } =>
    Boolean(account.email && account.password)
  );

  return (
    <main className="auth-arena min-h-screen">
      <SiteHeader locale={locale} />
      <section className="relative isolate flex min-h-[calc(100vh-72px)] items-center justify-center overflow-hidden px-5 py-14 sm:px-8">
        <div className="pointer-events-none absolute -top-32 end-1/4 -z-10 size-96 rounded-full bg-orange-300/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-36 start-1/4 -z-10 size-96 rounded-full bg-yellow-200/35 blur-3xl" />
        <div className="grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="auth-arena-showcase hidden lg:block">
            <p className="text-sm font-black tracking-[0.22em] text-orange-600">JOIN THE ARENA</p>
            <h1 className="mt-5 text-5xl font-black leading-tight text-stone-950">{t("registerTitle")}</h1>
            <p className="mt-5 max-w-md text-lg leading-8 text-stone-500">{t("registerDescription")}</p>
            <div className="mt-8 flex items-center gap-3">
              <span className="grid size-12 place-items-center rounded-2xl bg-orange-100 font-black text-orange-700">45</span>
              <span className="grid size-12 place-items-center rounded-2xl bg-teal-100 font-black text-teal-700">2</span>
              <span className="grid size-12 place-items-center rounded-2xl bg-amber-100 font-black text-amber-700">1</span>
              <span className="text-sm font-semibold text-stone-500">{locale === "ar" ? "لوحة واحدة. منافسان. فائز واحد." : "One board. Two players. One winner."}</span>
            </div>
          </div>
          <div className="w-full">
            <div className="mb-7 text-center lg:text-start">
              <h1 className="text-3xl font-black text-stone-950 lg:hidden">{t("registerTitle")}</h1>
              <p className="mt-3 text-stone-500">{t("registerDescription")}</p>
            </div>
            <AuthForm mode="register" demoAccounts={demoAccounts} />
            <p className="mt-6 text-center text-sm text-stone-500">{t("hasAccount")} <Link href="/login" className="font-bold text-orange-700">{t("loginLink")}</Link></p>
          </div>
        </div>
      </section>
    </main>
  );
}
