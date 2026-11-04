import { localizedPageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: "ar" | "en" }> }) {
  const { locale } = await params;
  return localizedPageMetadata({
    locale,
    path: "/profile",
    titleAr: "ملفي الشخصي",
    titleEn: "My Profile",
    descriptionAr: "إدارة بيانات حسابك وإعدادات الدخول في Guess Arena.",
    descriptionEn: "Manage your Guess Arena account details and sign-in settings.",
    indexable: false
  });
}

export default function ProfileLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
