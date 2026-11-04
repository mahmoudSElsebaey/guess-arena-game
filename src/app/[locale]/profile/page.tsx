"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useLocale } from "next-intl";
import { SiteHeader } from "@/components/layout/site-header";
import { Link } from "@/i18n/navigation";
import { ArrowLeft, BadgeCheck, History, KeyRound, LogOut, Save, ShieldCheck, UserRound } from "lucide-react";

type Profile = { name: string; email: string | null; role: string; isGuest: boolean; createdAt?: string };
export default function ProfilePage() {
  const locale = useLocale();
  const ar = locale === "ar";
  const { status, update } = useSession();
  const [profile,setProfile] = useState<Profile|null>(null);
  const [name,setName] = useState("");
  const [email,setEmail] = useState("");
  const [currentPassword,setCurrentPassword] = useState("");
  const [newPassword,setNewPassword] = useState("");
  const [loading,setLoading] = useState(true);
  const [saving,setSaving] = useState(false);
  const [message,setMessage] = useState("");
  const [error,setError] = useState("");

  useEffect(()=>{let active=true;fetch("/api/profile",{cache:"no-store"}).then(async r=>{const data=await r.json();if(!r.ok)throw new Error(data.error);if(active){setProfile(data);setName(data.name??"");setEmail(data.email??"");}}).catch(()=>{if(active)setError(ar?"تعذر تحميل بيانات الحساب. حدّث الصفحة وحاول مجددًا.":"Could not load account details. Refresh and try again.");}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[ar]);

  async function save(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();setSaving(true);setError("");setMessage("");
    try{
      const response=await fetch("/api/profile",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,email:profile?.isGuest?undefined:email,currentPassword:currentPassword||undefined,newPassword:newPassword||undefined})});
      const data=await response.json();
      if(!response.ok){const messages:Record<string,string>={EMAIL_TAKEN:ar?"البريد الإلكتروني مستخدم بالفعل.":"Email is already in use.",CURRENT_PASSWORD_INVALID:ar?"كلمة المرور الحالية غير صحيحة.":"Current password is incorrect.",INVALID_INPUT:ar?"راجع البيانات المدخلة.":"Please review the entered details."};throw new Error(messages[data.error]??(ar?"تعذر حفظ التعديلات.":"Could not save changes."));}
      setProfile(current=>current?{...current,...data.user}:current);
      await update();
      setCurrentPassword("");setNewPassword("");
      setMessage(ar?"تم حفظ بيانات حسابك بنجاح.":"Your profile was updated successfully.");
    }catch(e){setError(e instanceof Error?e.message:(ar?"حدث خطأ غير متوقع.":"Unexpected error."));}
    finally{setSaving(false);}
  }

  return <main id="main-content" dir={ar?"rtl":"ltr"} className="profile-arena min-h-screen"><SiteHeader locale={locale as "ar"|"en"}/><section className="mx-auto max-w-5xl px-4 py-10 sm:px-8 sm:py-16"><div className="flex flex-wrap items-center justify-between gap-3">
<Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-[#78685a] transition hover:text-[#c84e16]"><ArrowLeft size={16}/>{ar?"العودة للرئيسية":"Back to home"}</Link>
<div className="flex flex-wrap gap-2">
<Link href="/history" className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#bef264] px-4 text-xs font-black text-[#21140d] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#d9f99d]"><History size={15}/>{ar?"الذهاب للسجلات":"Go to history"}</Link>
<button type="button" onClick={() => void signOut({ callbackUrl: `/${locale}/login` })} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#e2d3bd] bg-[#fffaf1] px-4 text-xs font-black text-[#a93c10] transition hover:-translate-y-0.5 hover:bg-[#fff1d6]"><LogOut size={15}/>{ar?"تسجيل الخروج":"Sign out"}</button>
</div>
</div><div className="mt-7 grid gap-6 lg:grid-cols-[.8fr_1.2fr]"><aside className="relative h-fit overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-violet-700/70 to-indigo-950 p-6 sm:p-8"><div className="absolute -end-12 -top-16 size-48 rounded-full bg-fuchsia-400/20 blur-3xl"/><div className="relative"><span className="grid size-16 place-items-center rounded-2xl bg-white/10 text-lime-200"><UserRound size={31}/></span><h1 className="mt-5 text-2xl font-black">{ar?"ملفي الشخصي":"My profile"}</h1><p className="mt-2 text-sm leading-7 text-white/60">{ar?"حدّث بياناتك وإعدادات الدخول من مكان واحد.":"Manage your account details and sign-in settings in one place."}</p><div className="mt-7 space-y-3 border-t border-white/10 pt-5 text-sm"><div className="flex items-center gap-2 text-white/75"><BadgeCheck size={17} className="text-lime-300"/>{profile?.role??"PLAYER"}</div><div className="flex items-center gap-2 text-white/75"><ShieldCheck size={17} className="text-teal-300"/>{profile?.isGuest?(ar?"حساب ضيف":"Guest account"):(ar?"حساب مسجل":"Registered account")}</div></div></div></aside><section className="rounded-3xl border border-white/10 bg-white/[.055] p-5 sm:p-8"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-lime-300/15 text-lime-200"><UserRound size={20}/></span><div><h2 className="font-black">{ar?"بيانات الحساب":"Account details"}</h2><p className="mt-1 text-xs text-white/45">{ar?"بياناتك الأساسية وطريقة تسجيل الدخول":"Your basic details and sign-in method"}</p></div></div>{loading||status==="loading"?<div className="mt-7 h-64 animate-pulse rounded-2xl bg-white/5"/>:<form onSubmit={save} className="mt-7 space-y-5"><label className="block text-sm font-bold text-white/80">{ar?"الاسم الظاهر":"Display name"}<input value={name} onChange={e=>setName(e.target.value)} required minLength={2} maxLength={32} className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-[#10112d] px-4 text-white outline-none transition focus:border-lime-300/60 focus:ring-4 focus:ring-lime-300/10"/></label><label className="block text-sm font-bold text-white/80">{ar?"البريد الإلكتروني":"Email address"}<input type="email" value={email} onChange={e=>setEmail(e.target.value)} disabled={profile?.isGuest} className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-[#10112d] px-4 text-white outline-none transition focus:border-lime-300/60 disabled:opacity-50"/></label>{profile?.isGuest&&<p className="text-xs text-amber-200/80">{ar?"حساب الضيف يمكنه تعديل الاسم فقط.":"Guest accounts can only change their display name."}</p>}<div className="border-t border-white/10 pt-5"><div className="mb-4 flex items-center gap-2"><KeyRound size={17} className="text-lime-200"/><h3 className="text-sm font-black">{ar?"تغيير كلمة المرور":"Change password"}</h3></div><label className="block text-sm font-bold text-white/80">{ar?"كلمة المرور الحالية":"Current password"}<input type="password" autoComplete="current-password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-[#10112d] px-4 text-white outline-none focus:border-lime-300/60"/></label><label className="mt-4 block text-sm font-bold text-white/80">{ar?"كلمة المرور الجديدة":"New password"}<input type="password" autoComplete="new-password" minLength={8} maxLength={64} value={newPassword} onChange={e=>setNewPassword(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-[#10112d] px-4 text-white outline-none focus:border-lime-300/60"/><span className="mt-1 block text-xs font-medium text-white/40">{ar?"اترك الحقلين فارغين إذا لم ترغب في تغييرها. 8 أحرف على الأقل.":"Leave both fields empty to keep your password. At least 8 characters."}</span></label></div>{error&&<p role="alert" className="rounded-xl border border-rose-300/20 bg-rose-400/10 p-3 text-sm font-semibold text-rose-200">{error}</p>}{message&&<p role="status" className="rounded-xl border border-emerald-300/20 bg-emerald-400/10 p-3 text-sm font-semibold text-emerald-200">{message}</p>}<button type="submit" disabled={saving||!name.trim()} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-lime-300 to-emerald-400 px-5 font-black text-[#102018] shadow-lg shadow-lime-300/10 transition hover:-translate-y-0.5 disabled:opacity-50">{saving?<span className="animate-pulse">{ar?"جارٍ الحفظ...":"Saving..."}</span>:<><Save size={17}/>{ar?"حفظ التعديلات":"Save changes"}</>}</button></form>}</section></div></section></main>;
}
