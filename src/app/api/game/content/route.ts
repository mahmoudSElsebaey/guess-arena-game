import { NextResponse } from "next/server";
import { getActiveCharacters, getActiveQuestions } from "@/lib/game/content";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [characters, questions] = await Promise.all([
      getActiveCharacters(),
      getActiveQuestions()
    ]);
    return NextResponse.json(
      { characters, questions },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Failed to load game content:", error);
    return NextResponse.json({ error: "GAME_CONTENT_UNAVAILABLE" }, { status: 503 });
  }
}
