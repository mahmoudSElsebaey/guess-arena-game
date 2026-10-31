import { useTranslations } from "next-intl";
import { AuthForm } from "@/components/auth/auth-form";
import { SiteHeader } from "@/components/layout/site-header";
import { Link } from "@/i18n/navigation";

export default async function RegisterPage({ params }: { params: Promise<{ locale: "ar" | "en" }> }) {
  const { locale } = await params;
  const t = useTranslations("auth");
  return (
    <main className="min-h-screen">
      <SiteHeader locale={locale} />
      <section className="mx-auto flex max-w-7xl flex-col items-center px-5 py-16 sm:py-24">
        <h1 className="text-3xl font-black text-slate-950">{t("registerTitle")}</h1>
        <p className="mt-3 text-center text-slate-500">{t("registerDescription")}</p>
        <div className="mt-8"><AuthForm mode="register" /></div>
        <p className="mt-6 text-sm text-slate-500">{t("hasAccount")} <Link href="/login" className="font-bold text-violet-700">{t("loginLink")}</Link></p>
      </section>
    </main>
  );
}
