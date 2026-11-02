import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/layout/site-header";

type HistoryPageProps = { params: Promise<{ locale: "ar" | "en" }> };
type ActionPayload = Record<string, unknown>;

function asPayload(value: unknown): ActionPayload {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as ActionPayload
    : {};
}

export default async function GameHistoryPage({ params }: HistoryPageProps) {
  const { locale } = await params;
  const isArabic = locale === "ar";
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect(`/${locale}/login`);

  const memberships = await prisma.roomMember.findMany({
    where: { userId, room: { status: "COMPLETED" } },
    orderBy: { room: { finishedAt: "desc" } },
    take: 50,
    select: {
      room: {
        select: {
          id: true,
          code: true,
          status: true,
          winnerId: true,
          startedAt: true,
          finishedAt: true,
          createdAt: true,
          members: {
            select: {
              userId: true,
              seat: true,
              user: { select: { name: true } }
            },
            orderBy: { seat: "asc" }
          },
          actions: {
            where: { type: { in: ["QUESTION_ASKED", "GUESS_MADE"] } },
            orderBy: { sequence: "asc" },
            select: { id: true, actorId: true, type: true, payload: true, createdAt: true }
          }
        }
      }
    }
  });

  const rooms = memberships.map(({ room }) => room);
  const questionIds = [...new Set(rooms.flatMap(room => room.actions
    .filter(action => action.type === "QUESTION_ASKED")
    .map(action => asPayload(action.payload).questionId)
    .filter((id): id is string => typeof id === "string")))];
  const characterIds = [...new Set(rooms.flatMap(room => room.actions
    .filter(action => action.type === "GUESS_MADE")
    .map(action => asPayload(action.payload).characterId)
    .filter((id): id is string => typeof id === "string")))];

  const [questions, characters] = await Promise.all([
    prisma.gameQuestion.findMany({
      where: { id: { in: questionIds } },
      select: { id: true, labelAr: true, labelEn: true }
    }),
    prisma.gameCharacter.findMany({
      where: { id: { in: characterIds } },
      select: { id: true, name: true, avatar: true }
    })
  ]);
  const questionById = new Map(questions.map(question => [question.id, question]));
  const characterById = new Map(characters.map(character => [character.id, character]));

  const wins = rooms.filter(room => room.winnerId === userId).length;
  const losses = rooms.length - wins;
  const winRate = rooms.length ? Math.round((wins / rooms.length) * 100) : 0;
  const number = (value: number) => value.toLocaleString(isArabic ? "ar-EG" : "en-US");
  const dateFormatter = new Intl.DateTimeFormat(isArabic ? "ar-EG" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  });

  return (
    <>
      <SiteHeader locale={locale} />
      <main id="main-content" tabIndex={-1} dir={isArabic ? "rtl" : "ltr"} className="history-arena min-h-screen px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <header className="history-hero relative overflow-hidden rounded-[2rem] border border-orange-200/60 bg-gradient-to-br from-[#21140d] via-[#3b2419] to-[#20352b] px-6 py-8 text-white shadow-[0_28px_70px_rgba(65,38,18,.18)] sm:px-9 sm:py-10">
            <div className="pointer-events-none absolute -end-10 -top-20 size-64 rounded-full bg-lime-300/15 blur-3xl"/><p className="relative text-xs font-black tracking-[0.2em] text-lime-300">GUESS ARENA · PLAYER RECORD</p>
            <h1 className="relative mt-3 text-3xl font-black text-white sm:text-4xl">
              {isArabic ? "سجل المباريات" : "Match history"}
            </h1>
            <p className="relative mt-3 max-w-xl text-sm leading-7 text-white/65">
              {isArabic ? "راجع نتائج مبارياتك وتفاصيل كل جولة." : "Review your results and the turn-by-turn match timeline."}
            </p>
          </header>

          <section aria-label={isArabic ? "إحصائياتك" : "Your statistics"} className="history-stats mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: isArabic ? "المباريات المكتملة" : "Completed matches", value: number(rooms.length), icon: "🎮" },
              { label: isArabic ? "مرات الفوز" : "Wins", value: number(wins), icon: "🏆" },
              { label: isArabic ? "مرات الخسارة" : "Losses", value: number(losses), icon: "📉" },
              { label: isArabic ? "نسبة الفوز" : "Win rate", value: `${number(winRate)}%`, icon: "📊" }
            ].map(stat => (
              <article key={stat.label} className="history-stat arena-panel rounded-2xl p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
                  <span aria-hidden="true" className="text-xl">{stat.icon}</span>
                </div>
                <p className="mt-3 text-3xl font-black tabular-nums text-slate-950">{stat.value}</p>
              </article>
            ))}
          </section>

          <section className="history-list mt-8 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-extrabold text-slate-900">{isArabic ? "المباريات السابقة" : "Previous matches"}</h2>
              <span className="text-xs font-semibold text-slate-500">{isArabic ? "آخر 50 مباراة" : "Latest 50 matches"}</span>
            </div>

            {rooms.length === 0 ? (
              <div className="arena-panel rounded-2xl border-dashed px-5 py-14 text-center">
                <p className="text-3xl" aria-hidden="true">🎯</p>
                <h3 className="mt-3 font-extrabold text-slate-800">{isArabic ? "لسه مفيش مباريات مكتملة" : "No completed matches yet"}</h3>
                <p className="mt-2 text-sm text-slate-500">{isArabic ? "العب أول مباراة أونلاين وهتظهر نتيجتها هنا." : "Play your first online match and its result will appear here."}</p>
              </div>
            ) : rooms.map(room => {
              const won = room.winnerId === userId;
              const opponent = room.members.find(member => member.userId !== userId);
              const duration = room.startedAt && room.finishedAt
                ? Math.max(0, Math.round((room.finishedAt.getTime() - room.startedAt.getTime()) / 60000))
                : null;

              return (
                <article key={room.id} className={`history-match overflow-hidden rounded-2xl border bg-white shadow-[0_16px_45px_rgba(65,38,18,.07)] ${won ? "border-emerald-200" : "border-rose-200"}`}>
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-black tracking-widest text-slate-900">#{room.code}</span>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${won ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                          {won ? (isArabic ? "فوز" : "Victory") : (isArabic ? "خسارة" : "Defeat")}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {isArabic ? "ضد" : "vs"} {opponent?.user.name || (isArabic ? "لاعب" : "Player")}
                      </p>
                    </div>
                    <div className="text-end text-xs text-slate-500">
                      <p>{room.finishedAt ? dateFormatter.format(room.finishedAt) : "—"}</p>
                      <p className="mt-1">{duration === null ? "—" : (isArabic ? `${number(duration)} دقيقة` : `${number(duration)} min`)}</p>
                    </div>
                  </div>

                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-bold text-violet-700 outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
                      <span>{isArabic ? "عرض تفاصيل المباراة" : "View match replay"}</span>
                      <span aria-hidden="true" className="transition group-open:rotate-180">⌄</span>
                    </summary>
                    <ol className="space-y-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4">
                      {room.actions.length === 0 ? (
                        <li className="text-sm text-slate-500">{isArabic ? "لا توجد تفاصيل محفوظة لهذه المباراة." : "No turn details were saved for this match."}</li>
                      ) : room.actions.map((action, index) => {
                        const payload = asPayload(action.payload);
                        const actor = room.members.find(member => member.userId === action.actorId);
                        const isQuestion = action.type === "QUESTION_ASKED";
                        const question = typeof payload.questionId === "string" ? questionById.get(payload.questionId) : null;
                        const character = typeof payload.characterId === "string" ? characterById.get(payload.characterId) : null;
                        const correct = payload.correct === true;

                        return (
                          <li key={action.id} className="flex gap-3 text-sm">
                            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white text-xs font-black text-slate-500 ring-1 ring-slate-200">{index + 1}</span>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-slate-800">{actor?.user.name || (isArabic ? "لاعب" : "Player")}</p>
                              <p className="mt-1 text-slate-600">
                                {isQuestion
                                  ? question ? (isArabic ? question.labelAr : question.labelEn) : (isArabic ? "سؤال غير متاح حاليًا" : "Question no longer available")
                                  : isArabic ? `تخمين الشخصية: ${character?.name ?? "—"}` : `Guessed: ${character?.name ?? "—"}`}
                              </p>
                              {isQuestion ? (
                                <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${payload.answer === true ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                                  {payload.answer === true ? (isArabic ? "نعم" : "Yes") : (isArabic ? "لا" : "No")}
                                </span>
                              ) : (
                                <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${correct ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                                  {correct ? (isArabic ? "تخمين صحيح" : "Correct guess") : (isArabic ? "تخمين غير صحيح" : "Wrong guess")}
                                </span>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  </details>
                </article>
              );
            })}
          </section>
        </div>
      </main>
    </>
  );
}
