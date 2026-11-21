/**
 * Peças do ingresso dos Stories (next/og), usadas pelo registro de filme e pelo de série.
 * Só estilos inline e flex: o next/og não entende classes nem next/image.
 */

import { loadGoogleFont } from "@/lib/og-fonts";

export const STORY_WIDTH = 1080;
export const STORY_HEIGHT = 1920;

export const NIGHT = "#0D0E10";
export const ORANGE = "#FF6A1C";
export const PAPER = "#F3EDE2"; // papel do ingresso
export const INK = "#16171A";
export const INK_SOFT = "rgba(22,23,26,0.55)";
export const CREAM = "#F9F9F8";

export const TICKET_WIDTH = 880;
export const TICKET_PADDING = 48;
const NOTCH = 44; // os furos da linha de destacar

/** linha pontilhada de destacar, com um furo de cada lado */
export function TearLine() {
  return (
    <div style={{ display: "flex", alignItems: "center", height: NOTCH, position: "relative" }}>
      <div style={{ width: NOTCH, height: NOTCH, borderRadius: NOTCH / 2, backgroundColor: NIGHT, marginLeft: -NOTCH / 2 }} />
      <div style={{ flex: 1, display: "flex", justifyContent: "space-between", padding: "0 18px" }}>
        {Array.from({ length: 30 }, (_, i) => (
          <div key={i} style={{ width: 12, height: 4, borderRadius: 2, backgroundColor: "rgba(22,23,26,0.25)" }} />
        ))}
      </div>
      <div style={{ width: NOTCH, height: NOTCH, borderRadius: NOTCH / 2, backgroundColor: NIGHT, marginRight: -NOTCH / 2 }} />
    </div>
  );
}

const STAR_PATH = "M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z";

// estrelas em SVG: o caractere ★ não existe nas fontes usadas pelo next/og
function StarIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path fill={color} d={STAR_PATH} />
    </svg>
  );
}

/** `emptyColor`: a estrela vazia (escura no papel do ingresso; clara sobre fundo escuro) */
export function Stars({ rating, size, emptyColor = "rgba(22,23,26,0.14)" }: { rating: number; size: number; emptyColor?: string }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {Array.from({ length: 5 }, (_, i) => {
        const fill = Math.min(1, Math.max(0, rating - i)); // 1, 0.5 ou 0
        return (
          <div key={i} style={{ display: "flex", position: "relative", width: size, height: size }}>
            <StarIcon size={size} color={emptyColor} />
            {fill > 0 && (
              <div style={{ display: "flex", position: "absolute", top: 0, left: 0, width: size * fill, height: size, overflow: "hidden" }}>
                <StarIcon size={size} color={ORANGE} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function Heart({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path
        fill={ORANGE}
        d="M12 21s-7.5-4.6-10-9.3C.4 8.6 2.3 4.5 6.2 4.5c2.3 0 3.8 1.3 4.8 2.8 1-1.5 2.5-2.8 4.8-2.8 3.9 0 5.8 4.1 4.2 7.2C19.5 16.4 12 21 12 21z"
      />
    </svg>
  );
}

/** código de barras decorativo: sempre o mesmo para a mesma review */
export function Barcode({ seed }: { seed: number }) {
  const bars = barcodeBars(seed);
  return (
    <div style={{ display: "flex", alignItems: "stretch", height: 110 }}>
      {bars.map((bar, i) => (
        <div key={i} style={{ width: bar.width, marginRight: bar.gap, backgroundColor: INK }} />
      ))}
    </div>
  );
}

/** larguras das barras e dos espaços, de um gerador pseudoaleatório semeado pelo número da review */
function barcodeBars(seed: number): { width: number; gap: number }[] {
  let state = seed >>> 0;
  const next = () => {
    state = (Math.imul(state, 1103515245) + 12345) >>> 0;
    return state / 2 ** 32;
  };
  return Array.from({ length: 34 }, () => ({ width: 2 + Math.floor(next() * 6), gap: 2 + Math.floor(next() * 4) }));
}

/** fila e poltrona de mentirinha, tiradas do número da review */
export function seatFor(id: number): { row: string; number: number } {
  const rows = "ABCDEFGHJKLMN";
  return { row: rows[id % rows.length], number: ((id * 7) % 24) + 1 };
}

/** as fontes do ingresso (as que não carregarem ficam de fora; o next/og usa a padrão) */
export async function loadTicketFonts() {
  const [sans, serif, serifItalic, mono] = await Promise.all([
    loadGoogleFont("Geist:wght@600"),
    loadGoogleFont("Source+Serif+4:wght@600"),
    loadGoogleFont("Source+Serif+4:ital,wght@1,400"),
    loadGoogleFont("Geist+Mono:wght@500"),
  ]);
  return [
    sans && { name: "Geist", data: sans, weight: 600 as const, style: "normal" as const },
    serif && { name: "Serif", data: serif, weight: 600 as const, style: "normal" as const },
    serifItalic && { name: "Serif", data: serifItalic, weight: 400 as const, style: "italic" as const },
    mono && { name: "Mono", data: mono, weight: 500 as const, style: "normal" as const },
  ].filter((f): f is NonNullable<typeof f> => Boolean(f));
}
