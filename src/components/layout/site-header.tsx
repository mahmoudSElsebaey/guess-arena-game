"use client";

import { Gamepad2, Languages, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useRouter } from "next/navigation";

export function SiteHeader({ locale }: { locale: "ar" | "en" }) {
  const t = useTranslations("navigation");
  const { data: session, status } = useSession();
  const router = useRouter();
  const nextLocale = locale === "ar" ? "en" : "ar";
  const user = session?.user;
  const role = user?.role ?? "PLAYER";
  const roleLabel = role === "OWNER" ? t("owner") : role === "ADMIN" ? t("admin") : user?.isGuest ? t("guest") : t("player");

  async function handleSignOut() {
    await signOut({ redirect: false });
    router.push(`/${locale}/login`);
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-white/90 backdrop-blur-xl">
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
          <Link href="/" className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 sm:inline-flex">{t("home")}</Link><Link href="/play" className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-50 md:inline-flex">{locale === "ar" ? "اللعب" : "Play"}</Link>
          {(role === "OWNER" || role === "ADMIN") && <Link href="/admin" className="hidden rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-bold text-violet-700 transition hover:bg-violet-100 md:inline-flex">{locale === "ar" ? "الإدارة" : "Admin"}</Link>}

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
