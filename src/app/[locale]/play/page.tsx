import { SiteHeader } from "@/components/layout/site-header";
import { GameBoard } from "@/components/game/game-board";

export default async function PlayPage({ params }: { params: Promise<{ locale: "ar" | "en" }> }) {
  const { locale } = await params;
  return (
    <main>
      <SiteHeader locale={locale} />
      <GameBoard locale={locale} />
    </main>
  );
}
