import { localizedPageMetadata } from "@/lib/seo";
export async function generateMetadata({ params }: { params: Promise<{ locale: "ar" | "en" }> }) { const { locale } = await params; return localizedPageMetadata({ locale, path: "/admin", titleAr: "لوحة الإدارة", titleEn: "Admin Dashboard", descriptionAr: "لوحة إدارة Guess Arena.", descriptionEn: "Guess Arena administration dashboard.", indexable: false }); }

import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/layout/site-header";

type AdminPageProps = {
  params: Promise<{ locale: "ar" | "en" }>;
};

export default async function AdminPage({ params }: AdminPageProps) {
  const { locale } = await params;
  const isArabic = locale === "ar";
  const session = await auth();

  if (!session?.user?.id) redirect(`/${locale}/login`);
  if (session.user.role !== "ADMIN" && session.user.role !== "OWNER") {
    redirect(`/${locale}/play`);
  }

  const [
    totalUsers,
    activeUsers,
    totalRooms,
    waitingRooms,
    activeGames,
    completedGames,
    recentRooms
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.room.count(),
    prisma.room.count({ where: { status: "WAITING" } }),
    prisma.room.count({ where: { status: "IN_PROGRESS" } }),
    prisma.room.count({ where: { status: "COMPLETED" } }),
    prisma.room.findMany({
      take: 7,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        code: true,
        status: true,
        createdAt: true,
        host: { select: { name: true, email: true } },
        winner: { select: { name: true } },
        _count: { select: { members: true } }
      }
    })
  ]);

  const dateFormatter = new Intl.DateTimeFormat(isArabic ? "ar-EG" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  });

  const stats = [
    {
      label: isArabic ? "إجمالي المستخدمين" : "Total users",
      value: totalUsers,
      detail: isArabic ? `${activeUsers} حساب نشط` : `${activeUsers} active accounts`,
      icon: "👥"
    },
    {
      label: isArabic ? "إجمالي الغرف" : "Total rooms",
      value: totalRooms,
      detail: isArabic ? "منذ إطلاق اللعبة" : "Since launch",
      icon: "🎮"
    },
    {
      label: isArabic ? "غرف في الانتظار" : "Waiting rooms",
      value: waitingRooms,
      detail: isArabic ? "تنتظر انضمام لاعب" : "Waiting for a player",
      icon: "⏳"
    },
    {
      label: isArabic ? "مباريات جارية" : "Active games",
      value: activeGames,
      detail: isArabic ? `${completedGames} مباراة مكتملة` : `${completedGames} completed games`,
      icon: "⚡"
    }
  ];

  const statusLabels: Record<string, string> = {
    WAITING: isArabic ? "في الانتظار" : "Waiting",
    IN_PROGRESS: isArabic ? "جارية" : "In progress",
    COMPLETED: isArabic ? "مكتملة" : "Completed",
    CANCELLED: isArabic ? "ملغاة" : "Cancelled"
  };

  return (
    <>
      <SiteHeader locale={locale} />
      <main id="main-content" tabIndex={-1} dir={isArabic ? "rtl" : "ltr"} className="admin-arena min-h-screen px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="admin-kicker text-xs">
              GUESS ARENA · CONTROL CENTER
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-stone-950">
              {isArabic ? "لوحة تحكم الإدارة" : "Admin dashboard"}
            </h1>
            <p className="mt-2 text-sm text-stone-500">
              {isArabic
                ? "نظرة عامة على المستخدمين والغرف ونشاط اللعبة."
                : "An overview of users, rooms, and game activity."}
            </p>
          </div>
          <div className="rounded-2xl border border-orange-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs text-stone-500">{isArabic ? "تم تسجيل الدخول بصفتك" : "Signed in as"}</p>
            <p className="mt-1 font-bold text-orange-700">
              {session.user.role === "OWNER"
                ? isArabic ? "مالك المنصة" : "Platform owner"
                : isArabic ? "مشرف" : "Administrator"}
            </p>
          </div>
        </div>

        <section aria-label={isArabic ? "إحصائيات المنصة" : "Platform statistics"} className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <article key={stat.label} className="arena-panel rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-stone-500">{stat.label}</p>
                  <p className="mt-3 text-3xl font-black tabular-nums text-stone-950">{stat.value.toLocaleString(isArabic ? "ar-EG" : "en-US")}</p>
                  <p className="mt-1 text-xs text-stone-400">{stat.detail}</p>
                </div>
                <span className="grid size-11 place-items-center rounded-xl bg-orange-50 text-xl">{stat.icon}</span>
              </div>
            </article>
          ))}
        </section>

        <section className="arena-panel-strong mt-8 overflow-hidden rounded-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 px-5 py-4">
            <div>
              <h2 className="font-extrabold text-stone-900">{isArabic ? "أحدث الغرف" : "Recent rooms"}</h2>
              <p className="mt-1 text-xs text-stone-500">{isArabic ? "آخر الغرف التي تم إنشاؤها على المنصة" : "The latest rooms created on the platform"}</p>
            </div>
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-stone-600">
              {recentRooms.length} / 7
            </span>
          </div>

          {recentRooms.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-stone-400">
              {isArabic ? "لا توجد غرف حتى الآن." : "No rooms have been created yet."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-sm">
                <thead className="bg-stone-50 text-xs text-stone-500">
                  <tr>
                    <th className="px-5 py-3 text-start font-bold">{isArabic ? "كود الغرفة" : "Room code"}</th>
                    <th className="px-5 py-3 text-start font-bold">{isArabic ? "المضيف" : "Host"}</th>
                    <th className="px-5 py-3 text-start font-bold">{isArabic ? "اللاعبون" : "Players"}</th>
                    <th className="px-5 py-3 text-start font-bold">{isArabic ? "الحالة" : "Status"}</th>
                    <th className="px-5 py-3 text-start font-bold">{isArabic ? "تاريخ الإنشاء" : "Created"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentRooms.map((room) => (
                    <tr key={room.id}>
                      <td className="px-5 py-4 font-black tracking-widest text-stone-900">{room.code}</td>
                      <td className="px-5 py-4 text-stone-600">{room.host.name || room.host.email || "—"}</td>
                      <td className="px-5 py-4 tabular-nums text-stone-600">{room._count.members}</td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-bold text-stone-600">
                          {statusLabels[room.status] ?? room.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-stone-500">{dateFormatter.format(room.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <article className="arena-panel rounded-2xl border-orange-300 bg-orange-50/80 p-5">
            <p className="text-xs font-black tracking-wider text-orange-700">CONTENT STUDIO</p>
            <h2 className="mt-2 text-lg font-extrabold text-stone-900">{isArabic ? "إدارة محتوى اللعبة" : "Game content management"}</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              {isArabic
                ? "إدارة الشخصيات والأسئلة والتصنيفات، مع دعم الإضافة والتعديل والأرشفة."
                : "Create, edit, activate, and archive characters, questions, and categories."}
            </p>
            <Link href={`/${locale}/admin/content`} className="mt-4 inline-flex min-h-10 items-center rounded-lg bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-700">
              {isArabic ? "فتح إدارة المحتوى" : "Open content studio"}
            </Link>
          </article>
          <article className="arena-panel rounded-2xl p-5">
            <p className="text-xs font-black tracking-wider text-emerald-700">{isArabic ? "ROOM OPERATIONS" : "ROOM OPERATIONS"}</p>
            <h2 className="mt-2 text-lg font-extrabold text-stone-900">{isArabic ? "إدارة الغرف والمباريات" : "Rooms & matches"}</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              {isArabic
                ? "متابعة الغرف واللاعبين، وإنهاء المباريات العالقة أو إلغاء الغرف غير النشطة."
                : "Monitor rooms and players, terminate stuck matches, and cancel inactive rooms."}
            </p>
            <Link href={`/${locale}/admin/rooms`} className="mt-4 inline-flex min-h-10 items-center rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800">
              {isArabic ? "فتح إدارة الغرف" : "Open room management"}
            </Link>
          </article>
          <article className="rounded-2xl border border-stone-200 bg-white p-5">
            <p className="text-xs font-black tracking-wider text-stone-400">{isArabic ? "صلاحيات الوصول" : "ACCESS CONTROL"}</p>
            <h2 className="mt-2 text-lg font-extrabold text-stone-900">{isArabic ? "منطقة إدارية محمية" : "Protected admin area"}</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              {isArabic
                ? "تقتصر هذه اللوحة على حسابات المالك والمشرف، بينما يتم تحويل حسابات اللاعبين إلى صفحة اللعب."
                : "Only owner and administrator accounts can access this dashboard. Player accounts are redirected to the game."}
            </p>
          </article>
        </section>
      </div>
      </main>
    </>
  );
}
