"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

type Category = {
  id: string; slug: string; nameAr: string; nameEn: string;
  type: "CHARACTER" | "QUESTION"; sortOrder: number; isActive: boolean;
  _count: { characters: number; questions: number };
};
type Attributes = {
  skin: "light" | "medium" | "dark";
  hairColor: "black" | "brown" | "blonde" | "red" | "gray";
  hairLength: "short" | "long" | "none";
  hasHat: boolean; hasGlasses: boolean; hasBeard: boolean;
  gender: "male" | "female"; eyeColor: "brown" | "blue" | "green";
};
type Character = {
  id: string; categoryId: string; name: string; avatar: string;
  attributes: Attributes; sortOrder: number; isActive: boolean;
};
type Question = {
  id: string; categoryId: string; labelAr: string; labelEn: string;
  attributeKey: keyof Attributes; expectedValue: string | boolean;
  sortOrder: number; isActive: boolean;
};
type Tab = "characters" | "questions" | "categories";

const emptyAttributes: Attributes = {
  skin: "light", hairColor: "black", hairLength: "short",
  hasHat: false, hasGlasses: false, hasBeard: false,
  gender: "male", eyeColor: "brown"
};
const attributeOptions: Array<{ key: keyof Attributes; values: Array<string | boolean> }> = [
  { key: "skin", values: ["light", "medium", "dark"] },
  { key: "hairColor", values: ["black", "brown", "blonde", "red", "gray"] },
  { key: "hairLength", values: ["short", "long", "none"] },
  { key: "hasHat", values: [true, false] },
  { key: "hasGlasses", values: [true, false] },
  { key: "hasBeard", values: [true, false] },
  { key: "gender", values: ["male", "female"] },
  { key: "eyeColor", values: ["brown", "blue", "green"] }
];
const labels: Record<string, { ar: string; en: string }> = {
  skin: { ar: "لون البشرة", en: "Skin tone" },
  hairColor: { ar: "لون الشعر", en: "Hair color" },
  hairLength: { ar: "طول الشعر", en: "Hair length" },
  hasHat: { ar: "يرتدي قبعة", en: "Wears a hat" },
  hasGlasses: { ar: "يرتدي نظارة", en: "Wears glasses" },
  hasBeard: { ar: "لديه لحية", en: "Has a beard" },
  gender: { ar: "النوع", en: "Gender" },
  eyeColor: { ar: "لون العين", en: "Eye color" }
};

export function ContentManager({ locale }: { locale: "ar" | "en" }) {
  const ar = locale === "ar";
  const [tab, setTab] = useState<Tab>("characters");
  const [categories, setCategories] = useState<Category[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeGames, setActiveGames] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [categoryForm, setCategoryForm] = useState({
    slug: "", nameAr: "", nameEn: "", type: "QUESTION" as "CHARACTER" | "QUESTION", sortOrder: 0
  });
  const [characterForm, setCharacterForm] = useState({
    categoryId: "", name: "", avatar: "🙂", attributes: { ...emptyAttributes }, sortOrder: 0
  });
  const [questionForm, setQuestionForm] = useState({
    categoryId: "", labelAr: "", labelEn: "", attributeKey: "hasHat" as keyof Attributes,
    expectedValue: "true", sortOrder: 0
  });

  const characterCategories = useMemo(() => categories.filter(c => c.type === "CHARACTER" && c.isActive), [categories]);
  const questionCategories = useMemo(() => categories.filter(c => c.type === "QUESTION" && c.isActive), [categories]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/content", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setCategories(data.categories);
      setCharacterForm(current => ({
        ...current,
        categoryId: current.categoryId || data.categories.find((item: Category) => item.type === "CHARACTER" && item.isActive)?.id || ""
      }));
      setQuestionForm(current => ({
        ...current,
        categoryId: current.categoryId || data.categories.find((item: Category) => item.type === "QUESTION" && item.isActive)?.id || ""
      }));
      setCharacters(data.characters);
      setQuestions(data.questions);
      setActiveGames(data.activeGames);
    } catch (e) {
      setError(messageFor(e instanceof Error ? e.message : "", ar));
    } finally {
      setLoading(false);
    }
  }, [ar]);

  useEffect(() => { void load(); }, [load]);

  async function request(url: string, method: "POST" | "PATCH" | "DELETE", body?: unknown) {
    const response = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "REQUEST_FAILED");
    return data;
  }

  async function run(action: () => Promise<void>) {
    setBusy(true); setError(""); setNotice("");
    try {
      await action();
      await load();
    } catch (e) {
      setError(messageFor(e instanceof Error ? e.message : "", ar));
    } finally {
      setBusy(false);
    }
  }

  function resetForms() {
    setEditingId(null);
    setCategoryForm({ slug: "", nameAr: "", nameEn: "", type: "QUESTION", sortOrder: 0 });
    setCharacterForm({ categoryId: characterCategories[0]?.id ?? "", name: "", avatar: "🙂", attributes: { ...emptyAttributes }, sortOrder: 0 });
    setQuestionForm({ categoryId: questionCategories[0]?.id ?? "", labelAr: "", labelEn: "", attributeKey: "hasHat", expectedValue: "true", sortOrder: 0 });
  }

  function editCategory(item: Category) {
    setEditingId(item.id);
    setCategoryForm({ slug: item.slug, nameAr: item.nameAr, nameEn: item.nameEn, type: item.type, sortOrder: item.sortOrder });
  }
  function editCharacter(item: Character) {
    setEditingId(item.id);
    setCharacterForm({ categoryId: item.categoryId, name: item.name, avatar: item.avatar, attributes: item.attributes, sortOrder: item.sortOrder });
  }
  function editQuestion(item: Question) {
    setEditingId(item.id);
    setQuestionForm({
      categoryId: item.categoryId, labelAr: item.labelAr, labelEn: item.labelEn,
      attributeKey: item.attributeKey, expectedValue: String(item.expectedValue), sortOrder: item.sortOrder
    });
  }

  async function saveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run(async () => {
      await request("/api/admin/content", editingId ? "PATCH" : "POST", editingId
        ? { resource: "category", id: editingId, data: categoryForm }
        : { resource: "category", data: categoryForm });
      setNotice(ar ? "تم حفظ التصنيف." : "Category saved.");
      setEditingId(null);
      setCategoryForm({ slug: "", nameAr: "", nameEn: "", type: "QUESTION", sortOrder: 0 });
    });
  }
  async function saveCharacter(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run(async () => {
      await request("/api/admin/content", editingId ? "PATCH" : "POST", editingId
        ? { resource: "character", id: editingId, data: characterForm }
        : { resource: "character", data: characterForm });
      setNotice(ar ? "تم حفظ الشخصية." : "Character saved.");
      setEditingId(null);
      setCharacterForm({ categoryId: characterCategories[0]?.id ?? "", name: "", avatar: "🙂", attributes: { ...emptyAttributes }, sortOrder: 0 });
    });
  }
  async function saveQuestion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run(async () => {
      const option = attributeOptions.find(item => item.key === questionForm.attributeKey);
      const raw = questionForm.expectedValue;
      const expectedValue = option?.values.includes(true) ? raw === "true" : raw;
      await request("/api/admin/content", editingId ? "PATCH" : "POST", editingId
        ? { resource: "question", id: editingId, data: { ...questionForm, expectedValue } }
        : { resource: "question", data: { ...questionForm, expectedValue } });
      setNotice(ar ? "تم حفظ السؤال." : "Question saved.");
      setEditingId(null);
      setQuestionForm({ categoryId: questionCategories[0]?.id ?? "", labelAr: "", labelEn: "", attributeKey: "hasHat", expectedValue: "true", sortOrder: 0 });
    });
  }

  async function toggleActive(resource: "category" | "character" | "question", id: string, isActive: boolean) {
    await run(async () => {
      await request("/api/admin/content", "PATCH", { resource, id, data: { isActive: !isActive } });
      setNotice(ar ? "تم تحديث حالة المحتوى." : "Content status updated.");
    });
  }
  async function deleteCategory(id: string) {
    if (!window.confirm(ar ? "حذف التصنيف الفارغ نهائيًا؟" : "Permanently delete this empty category?")) return;
    await run(async () => {
      await request(`/api/admin/content?resource=category&id=${encodeURIComponent(id)}`, "DELETE");
      setNotice(ar ? "تم حذف التصنيف." : "Category deleted.");
    });
  }

  const tabs: Array<{ id: Tab; ar: string; en: string; count: number }> = [
    { id: "characters", ar: "الشخصيات", en: "Characters", count: characters.length },
    { id: "questions", ar: "الأسئلة", en: "Questions", count: questions.length },
    { id: "categories", ar: "التصنيفات", en: "Categories", count: categories.length }
  ];
  const fieldClass = "mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100";
  const labelClass = "block text-xs font-bold text-slate-600";

  return (
    <div dir={ar ? "rtl" : "ltr"} className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black tracking-[.2em] text-violet-600">GUESS ARENA · CONTENT STUDIO</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">{ar ? "إدارة محتوى اللعبة" : "Game content studio"}</h1>
          <p className="mt-2 text-sm text-slate-500">{ar ? "تحكم في الشخصيات والأسئلة والتصنيفات التي تظهر للاعبين." : "Manage the characters, questions, and categories shown to players."}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
          <span className="text-slate-500">{ar ? "مباريات جارية" : "Active matches"}</span>
          <strong className="ms-2 text-lg tabular-nums text-slate-900">{activeGames}</strong>
        </div>
      </div>

      {activeGames > 0 && <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-800">{ar ? "يوجد مباريات جارية. تم إيقاف تعديل المحتوى مؤقتًا حتى لا تتغير قواعد المباراة أثناء اللعب." : "Matches are in progress. Content changes are temporarily locked to keep active matches consistent."}</div>}
      {error && <p role="alert" className="mt-5 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p>}
      {notice && <p role="status" className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{notice}</p>}

      <div className="mt-7 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        {tabs.map(item => <button key={item.id} type="button" onClick={() => { setTab(item.id); resetForms(); }} className={`rounded-xl px-4 py-3 text-sm font-extrabold transition ${tab === item.id ? "bg-violet-700 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}>{ar ? item.ar : item.en}<span className={`ms-2 rounded-full px-2 py-0.5 text-xs ${tab === item.id ? "bg-white/15" : "bg-slate-100"}`}>{item.count}</span></button>)}
      </div>

      {loading ? <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">{ar ? "جارٍ تحميل المحتوى..." : "Loading content..."}</div> : <>
        {tab === "categories" && <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="space-y-3">
            {categories.map(item => <article key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
              <div><div className="flex flex-wrap items-center gap-2"><strong className="text-slate-900">{ar ? item.nameAr : item.nameEn}</strong><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">{item.type}</span><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${item.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{item.isActive ? (ar ? "نشط" : "Active") : (ar ? "مؤرشف" : "Archived")}</span></div><p className="mt-1 text-xs text-slate-500">{item.slug} · {item._count.characters} {ar ? "شخصية" : "characters"} · {item._count.questions} {ar ? "سؤال" : "questions"}</p></div>
              <div className="flex gap-2"><button onClick={() => editCategory(item)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold">{ar ? "تعديل" : "Edit"}</button><button disabled={busy || activeGames > 0 || (item.isActive && (item._count.characters + item._count.questions > 0))} onClick={() => void toggleActive("category", item.id, item.isActive)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold disabled:opacity-40">{item.isActive ? (ar ? "أرشفة" : "Archive") : (ar ? "تفعيل" : "Activate")}</button><button disabled={busy || item._count.characters + item._count.questions > 0} onClick={() => void deleteCategory(item.id)} className="rounded-lg px-3 py-2 text-xs font-bold text-rose-600 disabled:opacity-30">{ar ? "حذف" : "Delete"}</button></div>
            </article>)}
          </section>
          <form onSubmit={saveCategory} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-black text-slate-900">{editingId ? (ar ? "تعديل التصنيف" : "Edit category") : (ar ? "إضافة تصنيف" : "Add category")}</h2>
            <label className={labelClass}>{ar ? "المعرف اللطيف (slug)" : "Slug"}<input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={categoryForm.slug} onChange={e => setCategoryForm(v => ({ ...v, slug: e.target.value }))} className={fieldClass} placeholder="appearance" /></label>
            <label className={labelClass}>{ar ? "الاسم بالعربية" : "Arabic name"}<input required value={categoryForm.nameAr} onChange={e => setCategoryForm(v => ({ ...v, nameAr: e.target.value }))} className={fieldClass} /></label>
            <label className={labelClass}>{ar ? "الاسم بالإنجليزية" : "English name"}<input required value={categoryForm.nameEn} onChange={e => setCategoryForm(v => ({ ...v, nameEn: e.target.value }))} className={fieldClass} /></label>
            <label className={labelClass}>{ar ? "نوع التصنيف" : "Category type"}<select value={categoryForm.type} onChange={e => setCategoryForm(v => ({ ...v, type: e.target.value as "CHARACTER" | "QUESTION" }))} disabled={Boolean(editingId)} className={fieldClass}><option value="CHARACTER">CHARACTER</option><option value="QUESTION">QUESTION</option></select></label>
            <label className={labelClass}>{ar ? "ترتيب العرض" : "Sort order"}<input type="number" min="0" value={categoryForm.sortOrder} onChange={e => setCategoryForm(v => ({ ...v, sortOrder: Number(e.target.value) }))} className={fieldClass} /></label>
            <div className="flex gap-2"><button disabled={busy || activeGames > 0} className="min-h-11 flex-1 rounded-xl bg-violet-700 px-4 text-sm font-extrabold text-white disabled:opacity-40">{busy ? "…" : (ar ? "حفظ التصنيف" : "Save category")}</button>{editingId && <button type="button" onClick={resetForms} className="rounded-xl border border-slate-200 px-4 text-sm font-bold">{ar ? "إلغاء" : "Cancel"}</button>}</div>
          </form>
        </div>}

        {tab === "characters" && <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {characters.map(item => <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-3"><span className="grid size-12 place-items-center rounded-xl bg-violet-50 text-2xl">{item.avatar}</span><div className="min-w-0"><strong className="block truncate text-sm text-slate-900">{item.name}</strong><span className="text-[10px] text-slate-400">{item.id}</span></div></div>
              <p className="mt-3 text-xs text-slate-500">{ar ? "الترتيب" : "Order"}: {item.sortOrder} · {ar ? "التصنيف" : "Category"}: {categories.find(c => c.id === item.categoryId)?.[ar ? "nameAr" : "nameEn"] ?? "—"}</p>
              <div className="mt-3 flex items-center justify-between gap-2"><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${item.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{item.isActive ? (ar ? "نشطة" : "Active") : (ar ? "مؤرشفة" : "Archived")}</span><div className="flex gap-2"><button onClick={() => editCharacter(item)} className="text-xs font-bold text-violet-700">{ar ? "تعديل" : "Edit"}</button><button disabled={busy || activeGames > 0} onClick={() => void toggleActive("character", item.id, item.isActive)} className="text-xs font-bold text-rose-600 disabled:opacity-40">{item.isActive ? (ar ? "أرشفة" : "Archive") : (ar ? "تفعيل" : "Activate")}</button></div></div>
            </article>)}
          </section>
          <form onSubmit={saveCharacter} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-black text-slate-900">{editingId ? (ar ? "تعديل الشخصية" : "Edit character") : (ar ? "إضافة شخصية" : "Add character")}</h2>
            <label className={labelClass}>{ar ? "التصنيف" : "Category"}<select required value={characterForm.categoryId} onChange={e => setCharacterForm(v => ({ ...v, categoryId: e.target.value }))} className={fieldClass}><option value="">{ar ? "اختر تصنيفًا" : "Select category"}</option>{characterCategories.map(c => <option key={c.id} value={c.id}>{ar ? c.nameAr : c.nameEn}</option>)}</select></label>
            <div className="grid grid-cols-[1fr_90px] gap-3"><label className={labelClass}>{ar ? "اسم الشخصية" : "Character name"}<input required maxLength={50} value={characterForm.name} onChange={e => setCharacterForm(v => ({ ...v, name: e.target.value }))} className={fieldClass} /></label><label className={labelClass}>{ar ? "الصورة / الرمز" : "Avatar"}<input required maxLength={16} value={characterForm.avatar} onChange={e => setCharacterForm(v => ({ ...v, avatar: e.target.value }))} className={fieldClass} /></label></div>
            <div className="grid grid-cols-2 gap-3">
              {(["skin","hairColor","hairLength","gender","eyeColor"] as const).map(key => <label key={key} className={labelClass}>{ar ? labels[key].ar : labels[key].en}<select value={characterForm.attributes[key]} onChange={e => setCharacterForm(v => ({ ...v, attributes: { ...v.attributes, [key]: e.target.value } as Attributes }))} className={fieldClass}>{attributeOptions.find(o => o.key === key)?.values.map(value => <option key={String(value)} value={String(value)}>{String(value)}</option>)}</select></label>)}
            </div>
            <div className="grid grid-cols-3 gap-2">{(["hasHat","hasGlasses","hasBeard"] as const).map(key => <label key={key} className="flex items-center gap-2 rounded-xl bg-slate-50 p-2 text-[11px] font-bold text-slate-600"><input type="checkbox" checked={characterForm.attributes[key]} onChange={e => setCharacterForm(v => ({ ...v, attributes: { ...v.attributes, [key]: e.target.checked } }))} />{ar ? labels[key].ar : labels[key].en}</label>)}</div>
            <label className={labelClass}>{ar ? "ترتيب العرض" : "Sort order"}<input type="number" min="0" value={characterForm.sortOrder} onChange={e => setCharacterForm(v => ({ ...v, sortOrder: Number(e.target.value) }))} className={fieldClass} /></label>
            <div className="flex gap-2"><button disabled={busy || activeGames > 0 || characterCategories.length === 0} className="min-h-11 flex-1 rounded-xl bg-violet-700 px-4 text-sm font-extrabold text-white disabled:opacity-40">{ar ? "حفظ الشخصية" : "Save character"}</button>{editingId && <button type="button" onClick={resetForms} className="rounded-xl border border-slate-200 px-4 text-sm font-bold">{ar ? "إلغاء" : "Cancel"}</button>}</div>
          </form>
        </div>}

        {tab === "questions" && <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section className="space-y-3">
            {questions.map(item => <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><strong className="text-sm text-slate-900">{ar ? item.labelAr : item.labelEn}</strong><p className="mt-1 text-xs text-slate-500">{item.id} · {item.attributeKey} = {String(item.expectedValue)}</p><p className="mt-1 text-xs text-slate-400">{ar ? item.labelEn : item.labelAr}</p></div><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${item.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{item.isActive ? (ar ? "نشط" : "Active") : (ar ? "مؤرشف" : "Archived")}</span></div>
              <div className="mt-3 flex justify-end gap-3"><button onClick={() => editQuestion(item)} className="text-xs font-bold text-violet-700">{ar ? "تعديل" : "Edit"}</button><button disabled={busy || activeGames > 0} onClick={() => void toggleActive("question", item.id, item.isActive)} className="text-xs font-bold text-rose-600 disabled:opacity-40">{item.isActive ? (ar ? "أرشفة" : "Archive") : (ar ? "تفعيل" : "Activate")}</button></div>
            </article>)}
          </section>
          <form onSubmit={saveQuestion} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-black text-slate-900">{editingId ? (ar ? "تعديل السؤال" : "Edit question") : (ar ? "إضافة سؤال" : "Add question")}</h2>
            <label className={labelClass}>{ar ? "التصنيف" : "Category"}<select required value={questionForm.categoryId} onChange={e => setQuestionForm(v => ({ ...v, categoryId: e.target.value }))} className={fieldClass}><option value="">{ar ? "اختر تصنيفًا" : "Select category"}</option>{questionCategories.map(c => <option key={c.id} value={c.id}>{ar ? c.nameAr : c.nameEn}</option>)}</select></label>
            <label className={labelClass}>{ar ? "السؤال بالعربية" : "Arabic question"}<input required value={questionForm.labelAr} onChange={e => setQuestionForm(v => ({ ...v, labelAr: e.target.value }))} className={fieldClass} /></label>
            <label className={labelClass}>{ar ? "السؤال بالإنجليزية" : "English question"}<input required value={questionForm.labelEn} onChange={e => setQuestionForm(v => ({ ...v, labelEn: e.target.value }))} className={fieldClass} /></label>
            <label className={labelClass}>{ar ? "الصفة التي يتم فحصها" : "Attribute to evaluate"}<select value={questionForm.attributeKey} onChange={e => { const key = e.target.value as keyof Attributes; setQuestionForm(v => ({ ...v, attributeKey: key, expectedValue: String(attributeOptions.find(o => o.key === key)?.values[0] ?? "") })); }} className={fieldClass}>{attributeOptions.map(option => <option key={option.key} value={option.key}>{ar ? labels[option.key].ar : labels[option.key].en}</option>)}</select></label>
            <label className={labelClass}>{ar ? "القيمة المطلوبة للإجابة بنعم" : "Value that means yes"}<select value={questionForm.expectedValue} onChange={e => setQuestionForm(v => ({ ...v, expectedValue: e.target.value }))} className={fieldClass}>{attributeOptions.find(o => o.key === questionForm.attributeKey)?.values.map(value => <option key={String(value)} value={String(value)}>{String(value)}</option>)}</select></label>
            <label className={labelClass}>{ar ? "ترتيب العرض" : "Sort order"}<input type="number" min="0" value={questionForm.sortOrder} onChange={e => setQuestionForm(v => ({ ...v, sortOrder: Number(e.target.value) }))} className={fieldClass} /></label>
            <div className="flex gap-2"><button disabled={busy || activeGames > 0 || questionCategories.length === 0} className="min-h-11 flex-1 rounded-xl bg-violet-700 px-4 text-sm font-extrabold text-white disabled:opacity-40">{ar ? "حفظ السؤال" : "Save question"}</button>{editingId && <button type="button" onClick={resetForms} className="rounded-xl border border-slate-200 px-4 text-sm font-bold">{ar ? "إلغاء" : "Cancel"}</button>}</div>
          </form>
        </div>}
      </>}
    </div>
  );
}

function messageFor(key: string, ar: boolean) {
  const messages: Record<string, [string, string]> = {
    UNAUTHORIZED: ["سجّل الدخول أولًا.", "Please sign in first."],
    FORBIDDEN: ["ليس لديك صلاحية إدارة المحتوى.", "You do not have permission to manage content."],
    ACTIVE_GAMES_RUNNING: ["لا يمكن تعديل المحتوى أثناء وجود مباريات جارية.", "Content cannot be changed while matches are in progress."],
    INVALID_CATEGORY: ["بيانات التصنيف غير صحيحة.", "Invalid category data."],
    INVALID_CHARACTER: ["بيانات الشخصية غير صحيحة.", "Invalid character data."],
    INVALID_QUESTION: ["بيانات السؤال غير صحيحة.", "Invalid question data."],
    INVALID_EXPECTED_VALUE: ["القيمة لا تتوافق مع الصفة المختارة.", "The value does not match the selected attribute."],
    INVALID_CHARACTER_CATEGORY: ["تصنيف الشخصية غير صالح.", "Invalid character category."],
    INVALID_QUESTION_CATEGORY: ["تصنيف السؤال غير صالح.", "Invalid question category."],
    DUPLICATE_VALUE: ["هذا المعرف مستخدم بالفعل.", "This identifier is already in use."],
    CATEGORY_NOT_EMPTY: ["لا يمكن حذف تصنيف يحتوي على محتوى.", "A category containing content cannot be deleted."],
    CATEGORY_HAS_ACTIVE_CONTENT: ["أرشف محتويات التصنيف أولًا.", "Archive the category's content first."],
    NOT_FOUND: ["المحتوى المطلوب غير موجود.", "The requested content was not found."],
    CONTENT_ARCHIVE_ONLY: ["الحذف النهائي متاح للتصنيفات الفارغة فقط. الشخصيات والأسئلة تُؤرشف للحفاظ على سجل المباريات.", "Only empty categories can be deleted. Characters and questions are archived to preserve match history."]
  };
  const pair = messages[key] ?? ["حدث خطأ أثناء حفظ المحتوى.", "Something went wrong while saving content."];
  return ar ? pair[0] : pair[1];
}
