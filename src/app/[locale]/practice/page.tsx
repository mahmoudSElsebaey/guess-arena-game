import { SiteHeader } from "@/components/layout/site-header";
import { BotGame } from "@/components/game/bot-game";

export default async function PracticePage({ params }: { params: Promise<{ locale: "ar" | "en" }> }) {
  const { locale } = await params;
  return <main id="main-content" className="min-h-screen bg-[#21140d]"><SiteHeader locale={locale}/><BotGame locale={locale}/></main>;
}
