import { ActiveGamePage } from "@/components/game/active-game-page";

export default async function ActiveRoomRoute({ params }: { params: Promise<{ locale: "ar" | "en"; roomId: string }> }) {
  const { locale, roomId } = await params;
  return <ActiveGamePage roomId={roomId} locale={locale} />;
}
