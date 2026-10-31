import { getTranslations } from "next-intl/server";
import { AuthForm } from "@/components/auth/auth-form";
import { SiteHeader } from "@/components/layout/site-header";
import { Link } from "@/i18n/navigation";

export default async function LoginPage({ params }: { params: Promise<{ locale: "ar" | "en" }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return (
    <main className="min-h-screen">
      <SiteHeader locale={locale} />
      <section className="mx-auto flex max-w-7xl flex-col items-center px-5 py-16 sm:py-24">
        <h1 className="text-3xl font-black text-slate-950">{t("loginTitle")}</h1>
        <p className="mt-3 text-center text-slate-500">{t("loginDescription")}</p>
        <div className="mt-8"><AuthForm mode="login" /></div>
        <p className="mt-6 text-sm text-slate-500">{t("noAccount")} <Link href="/register" className="font-bold text-violet-700">{t("registerLink")}</Link></p>
      </section>
    </main>
  );
}
