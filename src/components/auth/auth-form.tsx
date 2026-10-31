"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Gamepad2, KeyRound, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";

type DemoAccount = { label: string; email: string; password: string };
type AuthFormProps = { mode: "login" | "register"; demoAccounts?: DemoAccount[] };

export function AuthForm({ mode, demoAccounts = [] }: AuthFormProps) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  return (
    <div className="w-full rounded-3xl border border-white bg-white/95 p-6 shadow-2xl shadow-slate-200/70 sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-violet-100 text-violet-700"><Gamepad2 size={22} /></span>
        <div><p className="font-black text-slate-900">GUESS ARENA</p><p className="text-xs text-slate-400">{mode === "login" ? t("loginTitle") : t("registerTitle")}</p></div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        {mode === "register" && (
          <label className="block space-y-2 text-sm font-semibold text-slate-700">
            {t("name")}
            <span className="relative block">
              <UserRound className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input autoComplete="name" required minLength={2} maxLength={32} value={name} onChange={(event) => setName(event.target.value)} className="min-h-12 w-full rounded-xl border border-[var(--border)] bg-slate-50 px-11 outline-none transition focus:border-violet-400 focus:bg-white" />
            </span>
          </label>
        )}
        <label className="block space-y-2 text-sm font-semibold text-slate-700">
          {t("email")}
          <span className="relative block">
            <UserRound className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="min-h-12 w-full rounded-xl border border-[var(--border)] bg-slate-50 px-11 outline-none transition focus:border-violet-400 focus:bg-white" />
          </span>
        </label>
        <label className="block space-y-2 text-sm font-semibold text-slate-700">
          {t("password")}
          <span className="relative block">
            <KeyRound className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} maxLength={64} required value={password} onChange={(event) => setPassword(event.target.value)} className="min-h-12 w-full rounded-xl border border-[var(--border)] bg-slate-50 px-11 pe-12 outline-none transition focus:border-violet-400 focus:bg-white" />
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute end-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:bg-slate-100" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
          </span>
          {mode === "register" && <span className="block text-xs text-slate-400">{t("passwordHint")}</span>}
        </label>
        {error && <p role="alert" className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "..." : mode === "login" ? t("loginAction") : t("registerAction")}
        </Button>
      </form>

      {mode === "login" && (
        <>
          <div className="my-5 flex items-center gap-3"><span className="h-px flex-1 bg-slate-100" /><span className="text-xs font-bold text-slate-400">{locale === "ar" ? "أو" : "OR"}</span><span className="h-px flex-1 bg-slate-100" /></div>
          <Button variant="secondary" size="lg" className="w-full" onClick={handleGuest} disabled={loading}>{t("guestAction")}</Button>
          {demoAccounts.length > 0 && (
            <div className="mt-6 rounded-2xl border border-violet-100 bg-violet-50/70 p-4">
              <p className="mb-3 text-sm font-extrabold text-slate-800">{t("demoTitle")}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {demoAccounts.map((account) => (
                  <button key={account.email} type="button" disabled={loading} onClick={() => void handleDemo(account)} className="flex min-h-12 items-center justify-between gap-2 rounded-xl border border-violet-100 bg-white px-3 text-sm font-bold text-violet-800 transition hover:border-violet-300 hover:bg-violet-50 disabled:opacity-50">
                    <span>{account.label}</span><span className="text-xs text-slate-400">Demo</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
