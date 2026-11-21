import { ImageResponse } from "next/og";
import { apiFetch } from "@/lib/api-client";
import {
  Barcode,
  CREAM,
  Heart,
  INK,
  INK_SOFT,
  NIGHT,
  ORANGE,
  PAPER,
  STORY_HEIGHT as HEIGHT,
  STORY_WIDTH as WIDTH,
  Stars,
  TICKET_PADDING,
  TICKET_WIDTH,
  TearLine,
  loadTicketFonts,
} from "@/app/components/story/ticket-parts";
import { seasonLabel, seriesYears, type SeriesDetails, type SeriesReview } from "@/types/series";
import { shortDate } from "@/utils/format";
import { toRating } from "@/utils/rating";
import { backdropUrl, posterUrl } from "@/utils/poster";
import { sameUsername } from "@/utils/username";

/**
 * Imagem de um registro de série no formato dos Stories (1080x1920): o mesmo ingresso dos
 * filmes, com a temporada no lugar da sessão e o pôster da temporada quando houver.
 * GET /u/{username}/series/{id}/story — o registro é público, então não precisa de token.
 */

export async function GET(_request: Request, { params }: { params: Promise<{ username: string; id: string }> }) {
  const { username, id } = await params;
  const reviewId = Number(id);
  if (!Number.isInteger(reviewId) || reviewId <= 0) {
    return new Response("Registro não encontrado", { status: 404 });
  }

  let review: SeriesReview;
  try {
    review = await apiFetch<SeriesReview>(`/series/reviews/${reviewId}`);
  } catch {
    return new Response("Registro não encontrado", { status: 404 });
  }
  if (!sameUsername(review.user.username, username)) {
    return new Response("Registro não encontrado", { status: 404 });
  }

  // cena de fundo, emissora e pôster da temporada são extras: sem eles, o ingresso sai mesmo assim
  const [details, fonts] = await Promise.all([
    apiFetch<SeriesDetails>(`/series/${review.series.id}/details`).catch(() => null),
    loadTicketFonts(),
  ]);

  return new ImageResponse(<Ticket review={review} details={details} />, {
    width: WIDTH,
    height: HEIGHT,
    fonts,
    headers: { "Cache-Control": "public, max-age=60" },
  });
}

function Ticket({ review, details }: { review: SeriesReview; details: SeriesDetails | null }) {
  const { series, user } = review;
  const backdrop = backdropUrl(details?.backdropPath);
  const season = review.seasonNumber !== null ? details?.seasons.find((s) => s.seasonNumber === review.seasonNumber) : undefined;
  const poster = posterUrl(season?.posterPath ?? series.posterPath, "w500");
  const titleSize = series.name.length > 34 ? 52 : series.name.length > 20 ? 62 : 76;
  const network = details?.networks[0];
  const years = seriesYears({ ...series, status: details?.status ?? series.status });

  return (
    <div style={{ width: WIDTH, height: HEIGHT, display: "flex", position: "relative", backgroundColor: NIGHT, fontFamily: "Geist" }}>
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
        <div style={{ display: "flex", width: TICKET_WIDTH, justifyContent: "space-between", alignItems: "center", color: CREAM }}>
          <div style={{ display: "flex", alignItems: "center", fontSize: 40, fontWeight: 600, letterSpacing: -1 }}>
            NITRATE
            <div style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: ORANGE, marginLeft: 6, marginTop: 10 }} />
          </div>
          <span style={{ fontFamily: "Mono", fontSize: 24, letterSpacing: 6, color: "rgba(249,249,248,0.6)" }}>DIÁRIO DE SÉRIES</span>
        </div>

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
              <span>{`PROGRAMAÇÃO · ${seasonLabel(review.seasonNumber).toUpperCase()}`}</span>
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
                {series.name}
              </span>
              <span style={{ marginTop: 14, fontFamily: "Mono", fontSize: 24, letterSpacing: 3, color: INK_SOFT }}>
                {[years, network?.toUpperCase()].filter(Boolean).join("  ·  ")}
              </span>
            </div>
          </div>

          <TearLine />

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
                  <span style={{ marginTop: 14, fontFamily: "Serif", fontStyle: "italic", fontSize: 48 }}>assistida, sem nota</span>
                )}
              </div>
              {review.liked && <Heart size={84} />}
            </div>

            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: 40 }}>
              <div style={{ display: "flex", flexDirection: "column", fontFamily: "Mono", fontSize: 24, letterSpacing: 2, lineHeight: 1.6 }}>
                <span>{`TERMINEI EM  ${shortDate(review.watchedOn).toUpperCase()}`}</span>
                <span style={{ color: INK_SOFT }}>
                  {season?.episodeCount
                    ? `${season.episodeCount} EPISÓDIOS`
                    : series.numberOfSeasons
                      ? `${series.numberOfSeasons} TEMPORADA${series.numberOfSeasons > 1 ? "S" : ""}`
                      : "MARATONA"}
                </span>
                <span style={{ color: ORANGE }}>{`@${user.username}`}</span>
              </div>
              <Barcode seed={review.id} />
            </div>
          </div>
        </div>

        <span
          style={{
            marginTop: 56,
            maxWidth: TICKET_WIDTH,
            textAlign: "center",
            fontFamily: details?.tagline ? "Serif" : "Mono",
            fontStyle: details?.tagline ? "italic" : "normal",
            fontSize: details?.tagline ? 38 : 24,
            letterSpacing: details?.tagline ? 0 : 4,
            color: "rgba(249,249,248,0.75)",
          }}
        >
          {details?.tagline ? `“${details.tagline}”` : "NITRATE · SEU DIÁRIO DE SÉRIES"}
        </span>
      </div>
    </div>
  );
}
