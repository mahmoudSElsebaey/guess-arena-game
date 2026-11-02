"use client";

import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useRouter } from "next/navigation";
import { ChevronDown, CircleHelp, Gamepad2, History, Info, LogOut, ShieldCheck, UserRound, UserCircle2 } from "lucide-react";

export function SiteHeader({ locale }: { locale: "ar" | "en" }) {
  const t = useTranslations("navigation");
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const nextLocale = locale === "ar" ? "en" : "ar";
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const user = session?.user;
  const isAdmin = user?.role === "OWNER" || user?.role === "ADMIN";
  const ar = locale === "ar";
  const links = [
    { href: "/" as const, label: ar ? "الرئيسية" : "Home", icon: Gamepad2 },
    { href: "/play" as const, label: ar ? "العب الآن" : "Play", icon: null, play: true },
    { href: "/how-to-play" as const, label: ar ? "كيف تلعب؟" : "How to play", icon: CircleHelp },
    { href: "/about" as const, label: ar ? "عن اللعبة" : "About", icon: Info }
  ];

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") { setMenuOpen(false); setProfileOpen(false); } };
    const onPointer = (event: PointerEvent) => { if (profileRef.current && !profileRef.current.contains(event.target as Node)) setProfileOpen(false); };
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointer);
    return () => { window.removeEventListener("keydown", onKeyDown); document.removeEventListener("pointerdown", onPointer); };
  }, []);

  async function handleSignOut() {
    await signOut({ redirect: false });
    router.push(`/${locale}/login`);
    router.refresh();
  }

  return (
    <header className="arena-header sticky top-0 z-50">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-[70] focus:rounded-xl focus:bg-white focus:px-4 focus:py-3 focus:font-bold focus:text-violet-700">Skip to content</a>
      <div className="relative border-b border-white/10 bg-[#11102b]/95 text-white shadow-[0_12px_35px_rgba(17,16,43,.2)] backdrop-blur-2xl">
        <div className="mx-auto flex min-h-[76px] max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-7">
          <Link href="/" className="group flex shrink-0 items-center gap-2.5" aria-label="Guess Arena">
            <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-lime-300 via-emerald-400 to-teal-500 text-[#10152d] shadow-[0_0_24px_rgba(163,230,53,.28)] transition group-hover:rotate-[-8deg]"><Gamepad2 size={24}/></span>
            <span className="text-lg font-black tracking-tight sm:text-xl">GUESS <span className="text-lime-300">ARENA</span></span>
          </Link>

          <button type="button" className="inline-flex min-h-10 items-center rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-bold text-white md:hidden" aria-expanded={menuOpen} aria-controls="primary-navigation" onClick={() => setMenuOpen(value => !value)}>{ar ? "القائمة" : "Menu"} <ChevronDown size={15} className={menuOpen ? "rotate-180" : ""}/></button>
          <nav id="primary-navigation" aria-label={ar ? "القائمة الرئيسية" : "Main navigation"} className={`${menuOpen ? "absolute start-3 end-3 top-[calc(100%-1px)] flex flex-col rounded-2xl border border-white/10 bg-[#19183a] p-3 shadow-2xl md:static md:flex-row md:items-center md:border-0 md:bg-transparent md:p-0 md:shadow-none" : "hidden md:flex"} items-stretch gap-1.5 md:items-center md:gap-1`}>
            {links.map(({href,label,icon:Icon,play}) => {
              const active = pathname === href || (href !== "/" && pathname.startsWith(href));
              return <Link key={href} href={href} onClick={() => setMenuOpen(false)} aria-current={active ? "page" : undefined} className={play
                ? "arena-play-cta mx-1 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-black text-[#102018] shadow-[0_7px_24px_rgba(132,204,22,.28)] transition hover:-translate-y-0.5"
                : `inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold transition ${active ? "bg-white/12 text-lime-300 shadow-inner" : "text-white/75 hover:bg-white/8 hover:text-white"}`}>
                {Icon && <Icon size={16}/>} {label} {active && !play && <span className="h-1 w-1 rounded-full bg-lime-300"/>}
              </Link>;
            })}
            {user && <Link href="/history" onClick={() => setMenuOpen(false)} aria-current={pathname === "/history" ? "page" : undefined} className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold transition ${pathname === "/history" ? "bg-white/12 text-lime-300" : "text-white/75 hover:bg-white/8"}`}><History size={16}/>{ar ? "السجل" : "History"}</Link>}
            {isAdmin && <Link href="/admin" onClick={() => setMenuOpen(false)} className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold text-amber-200 hover:bg-white/8"><ShieldCheck size={16}/>{ar ? "الإدارة" : "Admin"}</Link>}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <Link href={pathname} locale={nextLocale} className="inline-flex size-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-xs font-black text-white transition hover:border-lime-300/50 hover:bg-white/10" aria-label={ar ? "Switch language to English" : "غيّر اللغة إلى العربية"} title={ar ? "English" : "العربية"}>{nextLocale.toUpperCase()}</Link>
            {status === "authenticated" && user ? (
              <div className="relative" ref={profileRef}>
                <button type="button" onClick={() => setProfileOpen(value => !value)} aria-expanded={profileOpen} aria-haspopup="menu" className="inline-flex min-h-10 max-w-[190px] items-center gap-2 rounded-xl border border-white/15 bg-white/7 px-2.5 py-1.5 text-sm font-bold text-white transition hover:border-lime-300/50 hover:bg-white/12 focus-visible:outline-2 focus-visible:outline-lime-300">
                  <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-gradient-to-br from-violet-400 to-fuchsia-500 text-white">{user.name?.trim().charAt(0).toUpperCase() || <UserRound size={17}/>} </span>
                  <span className="hidden max-w-24 truncate sm:block">{user.name || user.email || t("account")}</span><ChevronDown size={15} className={profileOpen ? "rotate-180 transition" : "transition"}/>
                </button>
                {profileOpen && <div role="menu" className="absolute end-0 top-[calc(100%+12px)] z-[60] w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#1c1b3c] p-2 text-white shadow-[0_20px_70px_rgba(0,0,0,.4)]">
                  <div className="border-b border-white/10 px-3 py-3"><p className="truncate text-sm font-black">{user.name || t("account")}</p><p className="mt-1 truncate text-xs text-white/50">{user.email || (ar ? "حساب ضيف" : "Guest account")}</p></div>
                  <Link role="menuitem" href="/profile" onClick={() => setProfileOpen(false)} className="mt-2 flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold text-white/85 transition hover:bg-white/10 hover:text-lime-300"><UserCircle2 size={17}/>{ar ? "الملف الشخصي والإعدادات" : "Profile & settings"}</Link>
                  <Link role="menuitem" href="/history" onClick={() => setProfileOpen(false)} className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold text-white/85 transition hover:bg-white/10 hover:text-lime-300"><History size={17}/>{ar ? "سجل المباريات" : "Match history"}</Link>
                  <button role="menuitem" type="button" onClick={() => void handleSignOut()} className="mt-1 flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-bold text-rose-300 transition hover:bg-rose-500/10"><LogOut size={17}/>{t("logout")}</button>
                </div>}
              </div>
            ) : status === "unauthenticated" ? <div className="flex items-center gap-1"><Link href="/login" className="rounded-xl px-3 py-2 text-xs font-bold text-white/80 hover:bg-white/10 sm:text-sm">{t("login")}</Link><Link href="/register" className="hidden rounded-xl bg-white px-3 py-2 text-xs font-black text-[#171632] hover:bg-lime-100 sm:inline-flex sm:text-sm">{t("register")}</Link></div> : <span className="h-9 w-16 animate-pulse rounded-xl bg-white/10"/>}
          </div>
        </div>
      </div>
      <div className="arena-wave-bottom" aria-hidden="true"><svg viewBox="0 0 1440 42" preserveAspectRatio="none"><path d="M0 32C180 2 310 2 480 22C650 42 760 42 930 22C1100 2 1270 2 1440 32V42H0Z" fill="#11102b"/></svg></div>
    </header>
  );
}
