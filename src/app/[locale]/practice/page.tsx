import { localizedPageMetadata } from "@/lib/seo";
export async function generateMetadata({ params }: { params: Promise<{ locale: "ar" | "en" }> }) { const { locale } = await params; return localizedPageMetadata({ locale, path: "/practice", titleAr: "اللعب ضد البوت", titleEn: "Play Against the Bot", descriptionAr: "تحدى بوت Guess Arena واختر مستوى الصعوبة المناسب لك.", descriptionEn: "Challenge the Guess Arena bot and choose your difficulty level.", indexable: false }); }

import { SiteHeader } from "@/components/layout/site-header";
import { BotGame } from "@/components/game/bot-game";

export default async function PracticePage({ params }: { params: Promise<{ locale: "ar" | "en" }> }) {
  const { locale } = await params;
  return <main id="main-content" className="min-h-screen bg-[#21140d]"><SiteHeader locale={locale}/><BotGame locale={locale}/></main>;
}
