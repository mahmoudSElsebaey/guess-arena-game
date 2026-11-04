import { localizedPageMetadata } from "@/lib/seo";
export async function generateMetadata({ params }: { params: Promise<{ locale: "ar" | "en" }> }) { const { locale } = await params; return localizedPageMetadata({ locale, path: "/play/room", titleAr: "مباراة مباشرة", titleEn: "Live Match", descriptionAr: "العب مباراة تخمين شخصيات مباشرة في Guess Arena.", descriptionEn: "Play a live character guessing match in Guess Arena.", indexable: false }); }

import { ActiveGamePage } from "@/components/game/active-game-page";

export default async function ActiveRoomRoute({ params }: { params: Promise<{ locale: "ar" | "en"; roomId: string }> }) {
  const { locale, roomId } = await params;
  return <ActiveGamePage roomId={roomId} locale={locale} />;
}
