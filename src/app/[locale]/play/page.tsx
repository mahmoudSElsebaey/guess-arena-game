import dynamic from "next/dynamic";
import { SiteHeader } from "@/components/layout/site-header";
import { RoomLobby } from "@/components/game/room-lobby";

const GameBoard = dynamic(
  () => import("@/components/game/game-board").then(module => module.GameBoard),
  {
    loading: () => <div className="mx-auto min-h-72 max-w-7xl animate-pulse rounded-3xl bg-slate-100" aria-hidden="true" />
  }
);

export default async function PlayPage({ params }: { params: Promise<{ locale: "ar" | "en" }> }) {
  const { locale } = await params;
  return (
    <main>
      <SiteHeader locale={locale} />
      <RoomLobby locale={locale} />
      <GameBoard locale={locale} />
    </main>
  );
}
