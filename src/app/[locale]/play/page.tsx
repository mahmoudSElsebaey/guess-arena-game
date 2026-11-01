import {SiteHeader} from "@/components/layout/site-header";
import {GameBoard} from "@/components/game/game-board";
import {RoomLobby} from "@/components/game/room-lobby";
export default async function PlayPage({params}:{params:Promise<{locale:"ar"|"en"}>}){
 const {locale}=await params;
 return <main><SiteHeader locale={locale}/><RoomLobby locale={locale}/><GameBoard locale={locale}/></main>;
}
