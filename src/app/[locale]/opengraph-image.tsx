import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Guess Arena - The character guessing duel";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  void locale;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 64, color: "#fff9ed", position: "relative", overflow: "hidden", backgroundColor: "#21140d" }}>
        <div style={{ position: "absolute", right: -90, top: -150, width: 520, height: 520, borderRadius: 9999, backgroundColor: "#3b2a1d", opacity: 0.8 }} />
        <div style={{ position: "absolute", left: -120, bottom: -230, width: 560, height: 560, borderRadius: 9999, backgroundColor: "#557a3d", opacity: 0.22 }} />
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", background: "#bef264", color: "#21140d", fontSize: 42, fontWeight: 900 }}>?</div>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 900, letterSpacing: 2 }}>GUESS <span style={{ color: "#bef264", marginLeft: 10 }}>ARENA</span></div>
        </div>
        <div style={{ position: "relative", display: "flex", flexDirection: "column", maxWidth: 980 }}>
          <div style={{ color: "#bef264", fontSize: 24, fontWeight: 800, letterSpacing: 5 }}>THE CHARACTER GUESSING GAME</div>
          <div style={{ marginTop: 20, fontSize: 76, lineHeight: 1.08, fontWeight: 900 }}>{"Outguess your opponent."}</div>
          <div style={{ marginTop: 24, color: "#f0c9a3", fontSize: 30 }}>{"Play online with friends or challenge the bot"}</div>
        </div>
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", color: "#eadbc5", fontSize: 22 }}>
          <span>guess-arena-game.vercel.app</span><span style={{ color: "#bef264", fontWeight: 800 }}>45 CHARACTERS · 2 PLAYERS</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
