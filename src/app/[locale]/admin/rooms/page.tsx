import { localizedPageMetadata } from "@/lib/seo";
export async function generateMetadata({ params }: { params: Promise<{ locale: "ar" | "en" }> }) { const { locale } = await params; return localizedPageMetadata({ locale, path: "/admin/rooms", titleAr: "إدارة الغرف", titleEn: "Room Management", descriptionAr: "متابعة وإدارة غرف ومباريات Guess Arena.", descriptionEn: "Monitor and manage Guess Arena rooms and matches.", indexable: false }); }

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/layout/site-header";
import { RoomManager } from "@/components/admin/room-manager";

export default async function AdminRoomsPage({ params }: { params: Promise<{ locale: "ar" | "en" }> }) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.user?.id) redirect(`/${locale}/login`);
  if (session.user.role !== "ADMIN" && session.user.role !== "OWNER") redirect(`/${locale}/play`);

  return (
    <div className="admin-arena">
      <SiteHeader locale={locale} />
      <RoomManager locale={locale} />
    </div>
  );
}
