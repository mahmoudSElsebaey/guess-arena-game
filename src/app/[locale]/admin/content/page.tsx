import { localizedPageMetadata } from "@/lib/seo";
export async function generateMetadata({ params }: { params: Promise<{ locale: "ar" | "en" }> }) { const { locale } = await params; return localizedPageMetadata({ locale, path: "/admin/content", titleAr: "إدارة محتوى اللعبة", titleEn: "Game Content Management", descriptionAr: "إدارة شخصيات وأسئلة وتصنيفات Guess Arena.", descriptionEn: "Manage Guess Arena characters, questions, and categories.", indexable: false }); }

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/layout/site-header";
import { ContentManager } from "@/components/admin/content-manager";

export default async function AdminContentPage({ params }: { params: Promise<{ locale: "ar" | "en" }> }) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.user?.id) redirect(`/${locale}/login`);
  if (session.user.role !== "ADMIN" && session.user.role !== "OWNER") {
    redirect(`/${locale}/play`);
  }

  return (
    <main className="admin-arena min-h-screen">
      <SiteHeader locale={locale} />
      <ContentManager locale={locale} />
    </main>
  );
}
