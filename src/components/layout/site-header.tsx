import { Gamepad2, Languages, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function SiteHeader({ locale }: { locale: "ar" | "en" }) {
  const t = useTranslations("navigation");
  const nextLocale = locale === "ar" ? "en" : "ar";

  return (
    <header className="border-b border-[var(--border)] bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex min-h-18 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-3" aria-label="Guess Arena">
          <span className="grid size-10 place-items-center rounded-xl bg-[var(--primary)] text-white shadow-lg shadow-violet-200">
            <Gamepad2 size={22} aria-hidden="true" />
          </span>
          <span className="text-lg font-black tracking-tight text-slate-900">
            Guess <span className="text-[var(--primary)]">Arena</span>
          </span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3" aria-label="Main navigation">
          <Link href="/" className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 sm:inline-flex">{t("home")}</Link>
          <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">{t("login")}</Link>
          <Link href="/register" className="hidden items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-violet-700 sm:inline-flex">
            <Sparkles size={15} aria-hidden="true" />{t("register")}
          </Link>
          <Link href="/" locale={nextLocale} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50" aria-label={t("switchLanguage")}>
            <Languages size={16} aria-hidden="true" /><span>{t("switchLanguage")}</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
