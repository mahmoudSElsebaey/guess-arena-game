"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type AuthFormProps = { mode: "login" | "register" };

export function AuthForm({ mode }: AuthFormProps) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
          throw new Error(result.error ?? t("genericError"));
        }
      }

      const result = await signIn("credentials", { email, password, redirect: false });
      if (!result?.ok) throw new Error(t("invalidCredentials"));
      router.push(`/${locale}`);
      router.refresh();
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

  return (
    <div className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">
      <form onSubmit={handleSubmit} className="space-y-5">
        {mode === "register" && (
          <label className="block space-y-2 text-sm font-semibold text-slate-700">
            {t("name")}
            <input autoComplete="name" required minLength={2} maxLength={32} value={name} onChange={(event) => setName(event.target.value)} className="min-h-12 w-full rounded-xl border border-[var(--border)] bg-slate-50 px-4 outline-none transition focus:border-violet-400 focus:bg-white" />
          </label>
        )}
        <label className="block space-y-2 text-sm font-semibold text-slate-700">
          {t("email")}
          <input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="min-h-12 w-full rounded-xl border border-[var(--border)] bg-slate-50 px-4 outline-none transition focus:border-violet-400 focus:bg-white" />
        </label>
        <label className="block space-y-2 text-sm font-semibold text-slate-700">
          {t("password")}
          <input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} maxLength={64} required value={password} onChange={(event) => setPassword(event.target.value)} className="min-h-12 w-full rounded-xl border border-[var(--border)] bg-slate-50 px-4 outline-none transition focus:border-violet-400 focus:bg-white" />
          {mode === "register" && <span className="block text-xs text-slate-400">{t("passwordHint")}</span>}
        </label>
        {error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={loading}>{loading ? "..." : mode === "login" ? t("loginAction") : t("registerAction")}</Button>
      </form>
      {mode === "login" && <div className="mt-3"><Button variant="secondary" size="lg" className="w-full" onClick={handleGuest} disabled={loading}>{t("guestAction")}</Button></div>}
    </div>
  );
}
