import { ImageResponse } from "next/og";
import { apiFetch } from "@/lib/api-client";
import {
  CREAM,
  Heart,
  NIGHT,
  ORANGE,
  RatingNumber,
  STORY_HEIGHT as HEIGHT,
  STORY_WIDTH as WIDTH,
  Stars,
  loadTicketFonts,
} from "@/app/components/story/ticket-parts";
import { seasonLabel, seriesYears, type SeriesDetails, type SeriesReview } from "@/types/series";
import { shortDate } from "@/utils/format";
import { toRating } from "@/utils/rating";
import { backdropUrl, posterUrl } from "@/utils/poster";
import { sameUsername } from "@/utils/username";

/**
 * Imagem de um registro de série no formato dos Stories (1080x1920). Série não tem ingresso:
 * aqui é uma TV de tubo com a cena da série na tela, e embaixo a nota, a temporada e a barra
 * de episódios assistidos até o fim, como num serviço de streaming.
 * GET /u/{username}/series/{id}/story — o registro é público, então não precisa de token.
 */

const TV_WIDTH = 920;
const SCREEN_WIDTH = 820;
const SCREEN_HEIGHT = 615; // 4:3, como as TVs de tubo
const CABINET = "#2B2621"; // gabinete de madeira escura
const CABINET_EDGE = "#3A332C";
const SOFT = "rgba(249,249,248,0.6)";
const FAINT = "rgba(249,249,248,0.14)";

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

  // cena, emissora e episódios da temporada são extras: sem eles, a imagem sai mesmo assim
  const [details, fonts] = await Promise.all([
    apiFetch<SeriesDetails>(`/series/${review.series.id}/details`).catch(() => null),
    loadTicketFonts(),
  ]);

  return new ImageResponse(<Story review={review} details={details} />, {
    width: WIDTH,
    height: HEIGHT,
    fonts,
    headers: { "Cache-Control": "public, max-age=60" },
  });
}

function Story({ review, details }: { review: SeriesReview; details: SeriesDetails | null }) {
  const { series, user } = review;
  const season = review.seasonNumber !== null ? details?.seasons.find((s) => s.seasonNumber === review.seasonNumber) : undefined;
  const network = details?.networks[0];
  const years = seriesYears({ ...series, status: details?.status ?? series.status });
  const titleSize = series.name.length > 30 ? 64 : series.name.length > 18 ? 80 : 96;
  const episodes = season?.episodeCount ?? (review.seasonNumber === null ? series.numberOfEpisodes : null);
  // num episódio, quanto da temporada ele representa (a barra fica cheia sem o total)
  const progress = review.episodeNumber !== null && season?.episodeCount ? Math.min(1, review.episodeNumber / season.episodeCount) : 1;
  // o canal "sintonizado" sai do número do registro: sempre o mesmo para o mesmo registro
  const channel = String((review.id % 98) + 2).padStart(2, "0");

  return (
    <div
      style={{
        width: WIDTH,
        height: HEIGHT,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        backgroundColor: NIGHT,
        // a luz da tela iluminando a sala escura
        backgroundImage: "radial-gradient(ellipse 75% 40% at 50% 34%, rgba(255,106,28,0.20), rgba(13,14,16,0) 70%)",
        fontFamily: "Geist",
        color: CREAM,
        padding: "84px 80px 0",
      }}
    >
      <div style={{ display: "flex", width: TV_WIDTH, justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", fontSize: 40, fontWeight: 600, letterSpacing: -1 }}>
          NITRATE
          <div style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: ORANGE, marginLeft: 6, marginTop: 10 }} />
        </div>
        <span style={{ fontFamily: "Mono", fontSize: 24, letterSpacing: 6, color: SOFT }}>DIÁRIO DE SÉRIES</span>
      </div>

      <Television review={review} details={details} channel={channel} />

      {/* o que foi assistido */}
      <div style={{ display: "flex", flexDirection: "column", width: TV_WIDTH, marginTop: 64 }}>
        <span style={{ fontFamily: "Mono", fontSize: 26, letterSpacing: 5, color: ORANGE }}>
          {seasonLabel(review.seasonNumber, review.episodeNumber).toUpperCase()}
        </span>
        <span style={{ marginTop: 14, fontFamily: "Serif", fontWeight: 600, fontSize: titleSize, lineHeight: 1.02, letterSpacing: -2 }}>
          {series.name}
        </span>
        <span style={{ marginTop: 16, fontFamily: "Mono", fontSize: 24, letterSpacing: 3, color: SOFT }}>
          {[years, network?.toUpperCase()].filter(Boolean).join("  ·  ")}
        </span>

        {/* nota e curtida */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 48 }}>
          {review.rating !== null ? (
            <div style={{ display: "flex", alignItems: "center" }}>
              <Stars rating={toRating(review.rating)} size={60} emptyColor={FAINT} />
              <div style={{ display: "flex", marginLeft: 24 }}>
                <RatingNumber value={review.rating} size={68} color={CREAM} muted={SOFT} />
              </div>
            </div>
          ) : (
            <span style={{ fontFamily: "Serif", fontStyle: "italic", fontSize: 48, color: SOFT }}>assistida, sem nota</span>
          )}
          {review.liked && <Heart size={80} />}
        </div>

        {/* a barra de progresso do streaming: cheia se assistiu até o fim; num episódio, até onde ele está na temporada */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 52 }}>
          <div style={{ display: "flex", height: 10, borderRadius: 5, backgroundColor: review.episodeNumber !== null ? FAINT : ORANGE }}>
            {review.episodeNumber !== null && (
              <div style={{ display: "flex", width: `${progress * 100}%`, height: 10, borderRadius: 5, backgroundColor: ORANGE }} />
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18, fontFamily: "Mono", fontSize: 24, letterSpacing: 2, color: SOFT }}>
            <span>
              {review.episodeNumber !== null
                ? season?.episodeCount ? `EPISÓDIO ${review.episodeNumber} DE ${season.episodeCount}` : `EPISÓDIO ${review.episodeNumber}`
                : episodes ? `${episodes} DE ${episodes} EPISÓDIOS` : "ASSISTIDA ATÉ O FIM"}
            </span>
            <span>{`${review.episodeNumber !== null ? "ASSISTI" : "TERMINEI"} EM ${shortDate(review.watchedOn).toUpperCase()}`}</span>
          </div>
        </div>
      </div>

      {/* a frase da série, quando houver, e quem assistiu fecham o story */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "auto", marginBottom: 90 }}>
        {details?.tagline && (
          <span style={{ maxWidth: TV_WIDTH, marginBottom: 28, textAlign: "center", fontFamily: "Serif", fontStyle: "italic", fontSize: 38, color: "rgba(249,249,248,0.75)" }}>
            {`“${details.tagline}”`}
          </span>
        )}
        <span style={{ fontFamily: "Mono", fontSize: 26, letterSpacing: 4, color: ORANGE }}>{`@${user.username}`}</span>
      </div>
    </div>
  );
}

/** a TV de tubo: gabinete de madeira, tela 4:3 com linhas de varredura, botões e alto-falante */
function Television({ review, details, channel }: { review: SeriesReview; details: SeriesDetails | null; channel: string }) {
  const { series } = review;
  const backdrop = backdropUrl(details?.backdropPath);
  const poster = posterUrl(series.posterPath, "w500");

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 72 }}>
      {/* antena */}
      <div style={{ display: "flex", width: 360, height: 90, position: "relative", justifyContent: "center" }}>
        <div style={{ position: "absolute", bottom: 0, left: 70, width: 6, height: 150, backgroundColor: CABINET_EDGE, borderRadius: 3, transform: "rotate(-32deg)", transformOrigin: "bottom" }} />
        <div style={{ position: "absolute", bottom: 0, right: 70, width: 6, height: 150, backgroundColor: CABINET_EDGE, borderRadius: 3, transform: "rotate(32deg)", transformOrigin: "bottom" }} />
        <div style={{ position: "absolute", bottom: -14, width: 70, height: 28, borderRadius: 14, backgroundColor: CABINET_EDGE }} />
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: TV_WIDTH,
          padding: "50px 50px 36px",
          borderRadius: 56,
          backgroundColor: CABINET,
          backgroundImage: `linear-gradient(180deg, ${CABINET_EDGE} 0%, ${CABINET} 40%, #211D19 100%)`,
          boxShadow: "0 50px 120px rgba(0,0,0,0.7)",
        }}
      >
        {/* tela */}
        <div
          style={{
            display: "flex",
            position: "relative",
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT,
            borderRadius: 48,
            overflow: "hidden",
            backgroundColor: "#050506",
            justifyContent: "center",
            border: "10px solid #15130F",
          }}
        >
          {backdrop ? (
            // eslint-disable-next-line @next/next/no-img-element -- o next/og não usa next/image
            <img src={backdrop} alt="" width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT, objectFit: "cover" }} />
          ) : poster ? (
            // sem cena: o pôster inteiro no meio da tela
            // eslint-disable-next-line @next/next/no-img-element -- o next/og não usa next/image
            <img src={poster} alt="" width={400} height={SCREEN_HEIGHT} style={{ width: 400, height: SCREEN_HEIGHT, objectFit: "cover" }} />
          ) : null}

          {/* linhas de varredura */}
          <div style={{ position: "absolute", top: 0, left: 0, width: SCREEN_WIDTH, height: SCREEN_HEIGHT, display: "flex", flexDirection: "column" }}>
            {Array.from({ length: Math.floor(SCREEN_HEIGHT / 6) }, (_, i) => (
              <div key={i} style={{ height: 3, marginBottom: 3, backgroundColor: "rgba(0,0,0,0.18)" }} />
            ))}
          </div>
          {/* vidro curvo: bordas escuras e um reflexo no alto */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: SCREEN_WIDTH,
              height: SCREEN_HEIGHT,
              display: "flex",
              backgroundImage: "radial-gradient(ellipse 75% 70% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.65) 100%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: SCREEN_WIDTH,
              height: SCREEN_HEIGHT,
              display: "flex",
              backgroundImage: "linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 35%)",
            }}
          />

          {/* letreiros na tela, como o canal de uma TV antiga */}
          <span style={{ position: "absolute", top: 34, right: 44, fontFamily: "Mono", fontSize: 40, color: "#7CFF8A", letterSpacing: 2 }}>
            {`CH ${channel}`}
          </span>
          {/* triângulo em SVG: o caractere ▶ não existe nas fontes usadas pelo next/og */}
          <div style={{ position: "absolute", bottom: 34, left: 44, display: "flex", alignItems: "center", fontFamily: "Mono", fontSize: 26, color: "rgba(249,249,248,0.9)", letterSpacing: 4 }}>
            <svg width={22} height={22} viewBox="0 0 24 24" style={{ marginRight: 12 }}>
              <path fill="rgba(249,249,248,0.9)" d="M5 3l16 9-16 9z" />
            </svg>
            MARATONADA
          </div>
        </div>

        {/* painel: botões e alto-falante */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 30, padding: "0 10px" }}>
          <div style={{ display: "flex", gap: 6 }}>
            {Array.from({ length: 22 }, (_, i) => (
              <div key={i} style={{ width: 6, height: 54, borderRadius: 3, backgroundColor: "rgba(0,0,0,0.35)" }} />
            ))}
          </div>
          <span style={{ fontFamily: "Mono", fontSize: 20, letterSpacing: 6, color: "rgba(249,249,248,0.35)" }}>NITRATE</span>
          <div style={{ display: "flex", gap: 22 }}>
            <Knob />
            <Knob />
          </div>
        </div>
      </div>
    </div>
  );
}

function Knob() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: "#171410",
        border: `4px solid ${CABINET_EDGE}`,
      }}
    >
      <div style={{ width: 6, height: 24, marginTop: 6, borderRadius: 3, backgroundColor: ORANGE }} />
    </div>
  );
}
