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
    <>
      <SiteHeader locale={locale} />
      <RoomManager locale={locale} />
    </>
  );
}
