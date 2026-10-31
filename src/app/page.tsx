import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="w-full max-w-3xl rounded-3xl border border-black/5 bg-white p-8 shadow-xl shadow-slate-900/5 sm:p-12">
        <p className="mb-4 inline-flex rounded-full bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700">
          قريبًا · قريبًا
        </p>
        <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
          Guess <span className="text-violet-600">Arena</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
          تحدَّ أصدقاءك في لعبة تخمين الشخصيات أونلاين. اختر شخصيتك، اطرح
          الأسئلة، واكتشف شخصية منافسك.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-xl bg-violet-600 px-6 py-3 font-bold text-white transition hover:bg-violet-700"
          >
            قريبًا سنبدأ اللعب
          </Link>
        </div>
        <p className="mt-10 text-sm text-slate-400">
          Foundation setup · Phase 1
        </p>
      </section>
    </main>
  );
}
