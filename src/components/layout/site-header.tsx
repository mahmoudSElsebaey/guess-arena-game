"use client";

import { Gamepad2, Languages, LogOut, ShieldCheck, UserRound, History } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function SiteHeader({ locale }: { locale: "ar" | "en" }) {
  const t = useTranslations("navigation");
  const { data: session, status } = useSession();
  const router = useRouter();
  const nextLocale = locale === "ar" ? "en" : "ar";
  const [menuOpen, setMenuOpen] = useState(false);
  const user = session?.user;
  const role = user?.role ?? "PLAYER";
  const roleLabel = role === "OWNER" ? t("owner") : role === "ADMIN" ? t("admin") : user?.isGuest ? t("guest") : t("player");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setMenuOpen(false); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  async function handleSignOut() {
    await signOut({ redirect: false });
    router.push(`/${locale}/login`);
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-white/90 backdrop-blur-xl">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:font-bold focus:text-violet-700">Skip to content</a>
      <div className="mx-auto flex min-h-18 max-w-7xl items-center justify-between gap-3 px-4 sm:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="Guess Arena">
          <span className="grid size-10 place-items-center rounded-xl bg-[var(--primary)] text-white shadow-lg shadow-violet-200">
            <Gamepad2 size={22} aria-hidden="true" />
          </span>
          <span className="text-lg font-black tracking-tight text-slate-900">
            Guess <span className="text-[var(--primary)]">Arena</span>
          </span>
        </Link>

        <nav className="flex min-w-0 items-center gap-1.5 sm:gap-3" aria-label="Main navigation">
          <button type="button" className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 md:hidden" aria-expanded={menuOpen} aria-controls="primary-navigation" onClick={() => setMenuOpen(open => !open)}>{locale === "ar" ? "القائمة" : "Menu"}</button>
          <div id="primary-navigation" className={`${menuOpen ? "absolute start-4 end-4 top-full mt-2 flex flex-col rounded-2xl border border-slate-200 bg-white p-2 shadow-xl md:static md:mt-0 md:flex-row md:border-0 md:bg-transparent md:p-0 md:shadow-none" : "hidden md:flex"} items-stretch gap-1.5 sm:gap-3`}>
          <Link href="/" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100">{t("home")}</Link><Link href="/play" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-50">{locale === "ar" ? "اللعب" : "Play"}</Link><Link href="/history" onClick={() => setMenuOpen(false)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"><History size={16} aria-hidden="true" />{locale === "ar" ? "سجل المباريات" : "History"}</Link>
          {(role === "OWNER" || role === "ADMIN") && <Link href="/admin" onClick={() => setMenuOpen(false)} className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-bold text-violet-700 transition hover:bg-violet-100">{locale === "ar" ? "الإدارة" : "Admin"}</Link>}
          </div>

          {status === "authenticated" && user ? (
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <div className="hidden min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 sm:flex">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-violet-100 text-violet-700">
                  {role === "OWNER" || role === "ADMIN" ? <ShieldCheck size={17} /> : <UserRound size={17} />}
                </span>
                <span className="min-w-0">
                  <span className="block max-w-32 truncate text-xs font-bold text-slate-800">{user.name || user.email || t("account")}</span>
                  <span className="block text-[10px] font-bold text-violet-700">{roleLabel}</span>
                </span>
              </div>
              <span className="max-w-24 truncate text-xs font-bold text-slate-700 sm:hidden">{user.name || t("account")}</span>
              <button type="button" onClick={() => void handleSignOut()} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-rose-100 px-2.5 text-xs font-bold text-rose-600 transition hover:bg-rose-50 sm:px-3 sm:text-sm">
                <LogOut size={16} aria-hidden="true" />
                <span className="hidden sm:inline">{t("logout")}</span>
              </button>
            </div>
          ) : status === "unauthenticated" ? (
            <>
              <Link href="/login" className="rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 sm:px-3 sm:text-sm">{t("login")}</Link>
              <Link href="/register" className="hidden items-center gap-2 rounded-lg bg-[var(--primary)] px-3 py-2.5 text-xs font-bold text-white transition hover:bg-violet-700 sm:inline-flex sm:px-4 sm:text-sm">{t("register")}</Link>
            </>
          ) : (
            <span className="h-9 w-20 animate-pulse rounded-lg bg-slate-100" aria-hidden="true" />
          )}

          <Link href="/" locale={nextLocale} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--border)] px-2.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 sm:px-3 sm:text-sm" aria-label={t("switchLanguage")}>
            <Languages size={16} aria-hidden="true" /><span>{t("switchLanguage")}</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
