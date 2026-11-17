import { ImageResponse } from "next/og";
import { apiFetch } from "@/lib/api-client";
import { loadGoogleFont } from "@/lib/og-fonts";
import type { MovieCredits } from "@/lib/services/movie-service";
import type { MovieReview } from "@/lib/types/review";
import { shortDate } from "@/utils/format";
import { toRating } from "@/utils/rating";
import { backdropUrl, posterUrl } from "@/utils/poster";

/**
 * Imagem de um registro do diário no formato dos Stories (1080x1920): um ingresso de cinema
 * com o pôster, a nota e a data da sessão, sobre uma cena do filme. O texto da review fica de fora.
 * GET /u/{username}/reviews/{id}/story — a review é pública, então não precisa de token.
 */

const WIDTH = 1080;
const HEIGHT = 1920;

const NIGHT = "#0D0E10";
const ORANGE = "#FF6A1C";
const PAPER = "#F3EDE2"; // papel do ingresso
const INK = "#16171A";
const INK_SOFT = "rgba(22,23,26,0.55)";
const CREAM = "#F9F9F8";

const TICKET_WIDTH = 880;
const TICKET_PADDING = 48;
const NOTCH = 44; // os furos da linha de destacar

export async function GET(_request: Request, { params }: { params: Promise<{ username: string; id: string }> }) {
  const { username, id } = await params;
  const reviewId = Number(id);
  if (!Number.isInteger(reviewId) || reviewId <= 0) {
    return new Response("Review não encontrada", { status: 404 });
  }

  let review: MovieReview;
  try {
    review = await apiFetch<MovieReview>(`/reviews/${reviewId}`);
  } catch {
    return new Response("Review não encontrada", { status: 404 });
  }
  if (review.user.username !== username) {
    return new Response("Review não encontrada", { status: 404 });
  }

  // a cena de fundo é um extra: sem ela, o ingresso aparece sobre o fundo escuro
  const credits = await apiFetch<MovieCredits>(`/movies/${review.movie.id}/credits`).catch(() => null);

  const [sans, serif, serifItalic, mono] = await Promise.all([
    loadGoogleFont("Geist:wght@600"),
    loadGoogleFont("Source+Serif+4:wght@600"),
    loadGoogleFont("Source+Serif+4:ital,wght@1,400"),
    loadGoogleFont("Geist+Mono:wght@500"),
  ]);
  const fonts = [
    sans && { name: "Geist", data: sans, weight: 600 as const, style: "normal" as const },
    serif && { name: "Serif", data: serif, weight: 600 as const, style: "normal" as const },
    serifItalic && { name: "Serif", data: serifItalic, weight: 400 as const, style: "italic" as const },
    mono && { name: "Mono", data: mono, weight: 500 as const, style: "normal" as const },
  ].filter((f): f is NonNullable<typeof f> => Boolean(f));

  return new ImageResponse(<Ticket review={review} credits={credits} />, {
    width: WIDTH,
    height: HEIGHT,
    fonts,
    headers: { "Cache-Control": "public, max-age=60" },
  });
}

function Ticket({ review, credits }: { review: MovieReview; credits: MovieCredits | null }) {
  const { movie, user } = review;
  const backdrop = backdropUrl(credits?.backdropPath);
  const poster = posterUrl(movie.posterPath, "w500");
  const director = credits?.directors[0]?.name ?? movie.director;
  const titleSize = movie.title.length > 34 ? 52 : movie.title.length > 20 ? 62 : 76;
  const seat = seatFor(review.id);

  return (
    <div style={{ width: WIDTH, height: HEIGHT, display: "flex", position: "relative", backgroundColor: NIGHT, fontFamily: "Geist" }}>
      {/* a cena do filme ao fundo, escurecendo para baixo */}
      {backdrop && (
        // eslint-disable-next-line @next/next/no-img-element -- o next/og não usa next/image
        <img src={backdrop} alt="" width={WIDTH} height={HEIGHT} style={{ position: "absolute", top: 0, left: 0, width: WIDTH, height: HEIGHT, objectFit: "cover" }} />
      )}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: WIDTH,
          height: HEIGHT,
          display: "flex",
          backgroundImage: backdrop
            ? "linear-gradient(180deg, rgba(13,14,16,0.82) 0%, rgba(13,14,16,0.68) 22%, rgba(13,14,16,0.82) 55%, rgba(13,14,16,0.97) 100%)"
            : "radial-gradient(ellipse 80% 50% at 50% 30%, rgba(255,106,28,0.22), rgba(13,14,16,0) 70%)",
        }}
      />

      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", width: WIDTH, padding: "84px 100px 0" }}>
        {/* cabeçalho */}
        <div style={{ display: "flex", width: TICKET_WIDTH, justifyContent: "space-between", alignItems: "center", color: CREAM }}>
          <div style={{ display: "flex", alignItems: "center", fontSize: 40, fontWeight: 600, letterSpacing: -1 }}>
            NITRATE
            <div style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: ORANGE, marginLeft: 6, marginTop: 10 }} />
          </div>
          <span style={{ fontFamily: "Mono", fontSize: 24, letterSpacing: 6, color: "rgba(249,249,248,0.6)" }}>DIÁRIO DE SESSÕES</span>
        </div>

        {/* o ingresso */}
        <div
          style={{
            marginTop: 56,
            width: TICKET_WIDTH,
            display: "flex",
            flexDirection: "column",
            backgroundColor: PAPER,
            borderRadius: 28,
            color: INK,
            boxShadow: "0 40px 120px rgba(0,0,0,0.6)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", padding: `${TICKET_PADDING}px ${TICKET_PADDING}px 40px` }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Mono", fontSize: 22, letterSpacing: 4, color: INK_SOFT }}>
              <span>INGRESSO · ADMITE UM</span>
              <span>{`Nº ${String(review.id).padStart(6, "0")}`}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
              {poster ? (
                // eslint-disable-next-line @next/next/no-img-element -- o next/og não usa next/image
                <img
                  src={poster}
                  alt=""
                  width={500}
                  height={750}
                  style={{ width: 500, height: 750, objectFit: "cover", borderRadius: 14, boxShadow: "0 24px 50px rgba(0,0,0,0.35)" }}
                />
              ) : (
                <div style={{ width: 500, height: 750, display: "flex", borderRadius: 14, backgroundColor: "#D9D2C5" }} />
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 40, textAlign: "center" }}>
              <span style={{ fontFamily: "Serif", fontWeight: 600, fontSize: titleSize, lineHeight: 1.05, letterSpacing: -1.5 }}>
                {movie.title}
              </span>
              <span style={{ marginTop: 14, fontFamily: "Mono", fontSize: 24, letterSpacing: 3, color: INK_SOFT }}>
                {[movie.releaseYear, director && `DIR. ${director.toUpperCase()}`].filter(Boolean).join("  ·  ")}
              </span>
            </div>
          </div>

          <TearLine />

          {/* canhoto: nota e sessão */}
          <div style={{ display: "flex", flexDirection: "column", padding: `36px ${TICKET_PADDING}px ${TICKET_PADDING}px` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontFamily: "Mono", fontSize: 22, letterSpacing: 4, color: INK_SOFT }}>MINHA NOTA</span>
                {review.rating !== null ? (
                  <div style={{ display: "flex", alignItems: "center", marginTop: 14 }}>
                    <Stars rating={toRating(review.rating)} size={58} />
                    <span style={{ marginLeft: 22, fontFamily: "Serif", fontWeight: 600, fontSize: 64, lineHeight: 1 }}>
                      {review.rating.toLocaleString("pt-BR", { minimumFractionDigits: 1 })}
                    </span>
                  </div>
                ) : (
                  <span style={{ marginTop: 14, fontFamily: "Serif", fontStyle: "italic", fontSize: 48 }}>assistido, sem nota</span>
                )}
              </div>
              {review.liked && <Heart size={84} />}
            </div>

            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: 40 }}>
              <div style={{ display: "flex", flexDirection: "column", fontFamily: "Mono", fontSize: 24, letterSpacing: 2, lineHeight: 1.6 }}>
                <span>{`SESSÃO  ${shortDate(review.watchedOn).toUpperCase()}`}</span>
                <span style={{ color: INK_SOFT }}>{`FILA ${seat.row}  ·  POLTRONA ${seat.number}${review.rewatch ? "  ·  REPRISE" : ""}`}</span>
                <span style={{ color: ORANGE }}>{`@${user.username}`}</span>
              </div>
              <Barcode seed={review.id} />
            </div>
          </div>
        </div>

        {/* a frase do filme, quando houver, fecha o story */}
        <span
          style={{
            marginTop: 56,
            maxWidth: TICKET_WIDTH,
            textAlign: "center",
            fontFamily: credits?.tagline ? "Serif" : "Mono",
            fontStyle: credits?.tagline ? "italic" : "normal",
            fontSize: credits?.tagline ? 38 : 24,
            letterSpacing: credits?.tagline ? 0 : 4,
            color: "rgba(249,249,248,0.75)",
          }}
        >
          {credits?.tagline ? `“${credits.tagline}”` : "NITRATE · SEU DIÁRIO DE CINEMA"}
        </span>
      </div>
    </div>
  );
}

/** linha pontilhada de destacar, com um furo de cada lado */
function TearLine() {
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

function Stars({ rating, size }: { rating: number; size: number }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {Array.from({ length: 5 }, (_, i) => {
        const fill = Math.min(1, Math.max(0, rating - i)); // 1, 0.5 ou 0
        return (
          <div key={i} style={{ display: "flex", position: "relative", width: size, height: size }}>
            <StarIcon size={size} color="rgba(22,23,26,0.14)" />
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

function Heart({ size }: { size: number }) {
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
function Barcode({ seed }: { seed: number }) {
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
function seatFor(id: number): { row: string; number: number } {
  const rows = "ABCDEFGHJKLMN";
  return { row: rows[id % rows.length], number: ((id * 7) % 24) + 1 };
}
