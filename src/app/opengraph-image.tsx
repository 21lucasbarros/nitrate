import { ImageResponse } from "next/og";
import { brandIconDataUri } from "@/lib/brand";
import { loadGoogleFont } from "@/lib/og-fonts";

// imagem que aparece quando alguém compartilha o link do site (WhatsApp, X, Discord...)
export const alt = "Nitrate: o seu diário de cinema";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const [semibold, serif] = await Promise.all([
    loadGoogleFont("Geist:wght@600"),
    loadGoogleFont("Source+Serif+4:ital,wght@1,400"),
  ]);
  const fonts = [
    semibold && { name: "Geist", data: semibold, weight: 600 as const, style: "normal" as const },
    serif && { name: "Serif", data: serif, weight: 400 as const, style: "italic" as const },
  ].filter((font) => !!font);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 96px",
          background: "#141517",
          // o brilho laranja da faísca, no canto
          backgroundImage: "radial-gradient(circle at 92% 8%, rgba(255,106,28,0.28), transparent 45%)",
          color: "#ECEDEE",
          fontFamily: "Geist",
        }}
      >
        <img src={brandIconDataUri()} width={132} height={132} alt="" />
        <div style={{ display: "flex", alignItems: "flex-start", marginTop: 48, fontSize: 104, fontWeight: 600, letterSpacing: -4 }}>
          Nitrate
          <div style={{ width: 22, height: 22, borderRadius: 11, background: "#FF6A1C", marginTop: 22, marginLeft: 6 }} />
        </div>
        <div style={{ marginTop: 12, fontSize: 44, fontFamily: "Serif", fontStyle: "italic", color: "#9A9EA5" }}>
          O seu diário de cinema.
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
