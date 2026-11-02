import { SiteHeader } from "@/components/layout/site-header";
import { GameBoard } from "@/components/game/game-board";
export default async function PracticePage({params}:{params:Promise<{locale:"ar"|"en"}>}){const {locale}=await params;return <main id="main-content" className="min-h-screen"><SiteHeader locale={locale}/><GameBoard locale={locale}/></main>;}