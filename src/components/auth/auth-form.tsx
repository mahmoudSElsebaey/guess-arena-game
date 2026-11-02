"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Check, Copy, Eye, EyeOff, Gamepad2, KeyRound, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";

type DemoAccount = { label: string; role: "OWNER" | "ADMIN" | "PLAYER"; email: string; password: string };
type AuthFormProps = { mode: "login" | "register"; demoAccounts?: DemoAccount[] };

export function AuthForm({ mode, demoAccounts = [] }: AuthFormProps) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const ar = locale === "ar";
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState("");

  async function finishLogin(loginEmail: string, loginPassword: string) {
    const result = await signIn("credentials", {
      email: loginEmail,
      password: loginPassword,
      redirect: false
    });
    if (!result?.ok) throw new Error(t("invalidCredentials"));
    router.push(`/${locale}`);
    router.refresh();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "register") {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password })
        });
        if (!response.ok) {
          const result = (await response.json()) as { error?: string };
          const message =
            result.error === "EMAIL_TAKEN" ? t("emailTaken") :
            result.error === "INVALID_INPUT" ? t("invalidRegistration") :
            t("registrationFailed");
          throw new Error(message);
        }
      }
      await finishLogin(email, password);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("genericError"));
    } finally {
      setLoading(false);
    }
  }

  async function handleGuest() {
    setError("");
    setLoading(true);
    try {
      const result = await signIn("credentials", { mode: "guest", redirect: false });
      if (!result?.ok) throw new Error(t("guestDisabled"));
      router.push(`/${locale}`);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("genericError"));
    } finally {
      setLoading(false);
    }
  }

  async function handleDemo(account: DemoAccount) {
    setError("");
    setLoading(true);
    try {
      await finishLogin(account.email, account.password);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("genericError"));
    } finally {
      setLoading(false);
    }
  }

  async function copyPassword(account: DemoAccount) {
    try {
      await navigator.clipboard.writeText(account.password);
      setCopiedEmail(account.email);
      window.setTimeout(() => setCopiedEmail(current => current === account.email ? "" : current), 1800);
    } catch {
      setError(ar ? "تعذر نسخ كلمة المرور. يمكنك تحديدها ونسخها يدويًا." : "Could not copy the password. Select and copy it manually.");
    }
  }

  return (
    <div className="w-full rounded-3xl border border-white bg-white/95 p-6 shadow-2xl shadow-orange-950/20 sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-orange-100 text-orange-700"><Gamepad2 size={22} /></span>
        <div><p className="font-black text-stone-900">GUESS ARENA</p><p className="text-xs text-stone-400">{mode === "login" ? t("loginTitle") : t("registerTitle")}</p></div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5" aria-busy={loading}>
        {mode === "register" && (
          <label className="block space-y-2 text-sm font-semibold text-stone-700">
            {t("name")}
            <span className="relative block">
              <UserRound className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} aria-hidden="true" />
              <input autoComplete="name" required minLength={2} maxLength={32} value={name} onChange={(event) => setName(event.target.value)} aria-invalid={Boolean(error)} className="min-h-12 w-full rounded-xl border border-[var(--border)] bg-stone-50 px-11 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100" />
            </span>
          </label>
        )}
        <label className="block space-y-2 text-sm font-semibold text-stone-700">
          {t("email")}
          <span className="relative block">
            <UserRound className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} aria-hidden="true" />
            <input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? "auth-error" : undefined} className="min-h-12 w-full rounded-xl border border-[var(--border)] bg-stone-50 px-11 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100" />
          </span>
        </label>
        <label className="block space-y-2 text-sm font-semibold text-stone-700">
          {t("password")}
          <span className="relative block">
            <KeyRound className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} aria-hidden="true" />
            <input type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} maxLength={64} required value={password} onChange={(event) => setPassword(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={mode === "register" ? "password-hint" : error ? "auth-error" : undefined} className="min-h-12 w-full rounded-xl border border-[var(--border)] bg-stone-50 px-11 pe-12 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100" />
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute end-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-stone-400 transition hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-orange-500" aria-label={showPassword ? (ar ? "إخفاء كلمة المرور" : "Hide password") : (ar ? "إظهار كلمة المرور" : "Show password")} aria-pressed={showPassword}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
          </span>
          {mode === "register" && <span id="password-hint" className="block text-xs text-stone-400">{t("passwordHint")}</span>}
        </label>
        {error && <p id="auth-error" role="alert" aria-live="assertive" className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium leading-6 text-rose-700">{error}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? (ar ? "جارٍ تنفيذ الطلب..." : "Please wait...") : mode === "login" ? t("loginAction") : t("registerAction")}
        </Button>
        {loading && <p className="text-center text-xs text-stone-500" role="status" aria-live="polite">{ar ? "قد يستغرق تسجيل الدخول لحظات قليلة." : "This may take a few moments."}</p>}
      </form>

      {mode === "login" && (
        <>
          <div className="my-5 flex items-center gap-3"><span className="h-px flex-1 bg-stone-100" /><span className="text-xs font-bold text-stone-400">{ar ? "أو" : "OR"}</span><span className="h-px flex-1 bg-stone-100" /></div>
          <Button variant="secondary" size="lg" className="w-full" onClick={handleGuest} disabled={loading}>{t("guestAction")}</Button>
        </>
      )}

      {demoAccounts.length > 0 && (
        <div className="mt-6 border-t border-stone-100 pt-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-extrabold text-stone-800">{t("demoTitle")}</p>
            <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-bold text-orange-700">{t("demoCount", { count: demoAccounts.length })}</span>
          </div>
          <p className="mb-3 text-xs leading-5 text-stone-500">{ar ? "اختر الحساب للدخول مباشرة، أو انسخ كلمة المرور لاستخدامها يدويًا." : "Choose an account to sign in instantly, or copy its password to use it manually."}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {demoAccounts.map((account, index) => (
              <article key={account.email} className="min-w-0 rounded-xl border border-orange-200 bg-orange-50/60 p-3">
                <button type="button" disabled={loading} onClick={() => void handleDemo(account)} className="flex min-h-11 w-full items-center justify-between gap-2 rounded-lg text-start transition hover:text-orange-800 focus-visible:outline-2 focus-visible:outline-orange-500 disabled:opacity-50">
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2"><span className="text-sm font-bold text-violet-900">{account.label}</span><span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-extrabold text-orange-700">{account.role}</span></span>
                    <span className="mt-0.5 block break-all text-xs text-stone-500">{account.email}</span>
                  </span>
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white text-xs font-black text-orange-700">{index + 1}</span>
                </button>
                <div className="mt-2 flex items-center justify-between gap-2 border-t border-orange-200 pt-2">
                  <span className="min-w-0 truncate text-[11px] text-stone-500">{ar ? "كلمة المرور:" : "Password:"} <code className="font-bold text-stone-700">{account.password}</code></span>
                  <button type="button" onClick={() => void copyPassword(account)} className="inline-flex min-h-8 shrink-0 items-center gap-1 rounded-lg bg-white px-2 text-[10px] font-bold text-orange-700 transition hover:bg-orange-100 focus-visible:outline-2 focus-visible:outline-orange-500" aria-label={ar ? `نسخ كلمة مرور ${account.label}` : `Copy ${account.label} password`}>
                    {copiedEmail === account.email ? <Check size={13} /> : <Copy size={13} />}
                    {copiedEmail === account.email ? (ar ? "تم النسخ" : "Copied") : (ar ? "نسخ" : "Copy")}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
