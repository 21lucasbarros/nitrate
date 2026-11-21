import { ImageResponse } from "next/og";
import { apiFetch } from "@/lib/api-client";
import { easterEggFor } from "@/lib/easter-eggs";
import { loadGoogleFont } from "@/lib/og-fonts";
import { stripMarkup } from "@/utils/review-markup";
import { getMovieScenes, type MovieCredits } from "@/lib/services/movie-service";
import type { MovieReview } from "@/lib/types/review";
import { shortDate } from "@/utils/format";
import { toRating } from "@/utils/rating";
import { backdropUrl, posterUrl } from "@/utils/poster";
import {
  Barcode,
  CREAM,
  Heart,
  INK,
  INK_SOFT,
  NIGHT,
  ORANGE,
  PAPER,
  RatingNumber,
  STORY_HEIGHT as HEIGHT,
  STORY_WIDTH as WIDTH,
  Stars,
  TICKET_PADDING,
  TICKET_WIDTH,
  TearLine,
  loadTicketFonts,
  seatFor,
} from "@/app/components/story/ticket-parts";
import { sameUsername } from "@/utils/username";

/**
 * Imagem de um registro do diário no formato dos Stories (1080x1920): um ingresso de cinema
 * com o pôster, a nota e a data da sessão, sobre uma cena do filme. O texto da review fica de fora.
 * GET /u/{username}/reviews/{id}/story — a review é pública, então não precisa de token.
 *
 * ?fundo=/abc.jpg troca a cena de fundo por outra cena do mesmo filme (caminho de imagem do TMDB);
 * ?estilo=cena deixa a cena em tela cheia, com a nota embaixo, no lugar do ingresso.
 */

export async function GET(request: Request, { params }: { params: Promise<{ username: string; id: string }> }) {
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
  if (!sameUsername(review.user.username, username)) {
    return new Response("Review não encontrada", { status: 404 });
  }

  // a cena de fundo é um extra: sem ela, o ingresso aparece sobre o fundo escuro
  const credits = await apiFetch<MovieCredits>(`/movies/${review.movie.id}/credits`).catch(() => null);

  // easter egg (Psicopata Americano): a review vira um cartão de visita
  if (easterEggFor(review.movie)?.story === "business-card") {
    const [card, cardItalic] = await Promise.all([
      loadGoogleFont("Cormorant+Garamond:wght@500"),
      loadGoogleFont("Cormorant+Garamond:ital,wght@1,500"),
    ]);
    const cardFonts = [
      card && { name: "Card", data: card, weight: 500 as const, style: "normal" as const },
      cardItalic && { name: "Card", data: cardItalic, weight: 500 as const, style: "italic" as const },
    ].filter((f): f is NonNullable<typeof f> => Boolean(f));
    return new ImageResponse(<BusinessCards review={review} />, {
      width: WIDTH,
      height: HEIGHT,
      fonts: cardFonts,
      headers: { "Cache-Control": "public, max-age=60" },
    });
  }

  const search = new URL(request.url).searchParams;
  const chosen = search.get("fundo");
  // a cena escolhida só vale se for do próprio filme da review; senão fica a padrão
  const ownScene =
    chosen !== null &&
    (await getMovieScenes(review.movie)
      .then((scenes) => scenes.backdrops.includes(chosen))
      .catch(() => false));
  const backdropPath = ownScene ? chosen : (credits?.backdropPath ?? null);

  const fonts = await loadTicketFonts();
  const story =
    search.get("estilo") === "cena" ? (
      <SceneStory review={review} credits={credits} backdrop={backdropUrl(backdropPath, "original")} />
    ) : (
      <Ticket review={review} credits={credits} backdrop={backdropUrl(backdropPath)} />
    );

  return new ImageResponse(story, {
    width: WIDTH,
    height: HEIGHT,
    fonts,
    headers: { "Cache-Control": "public, max-age=60" },
  });
}

interface StoryProps {
  review: MovieReview;
  credits: MovieCredits | null;
  /** URL da cena de fundo (a escolhida ou a padrão do filme) */
  backdrop: string | null;
}

function Ticket({ review, credits, backdrop }: StoryProps) {
  const { movie, user } = review;
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
                    <div style={{ display: "flex", marginLeft: 22 }}>
                      <RatingNumber value={review.rating} size={64} color={INK} muted={INK_SOFT} />
                    </div>
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

/** a cena em tela cheia, quase sem escurecer, e a nota em destaque na parte de baixo */
function SceneStory({ review, credits, backdrop }: StoryProps) {
  const { movie, user } = review;
  const poster = posterUrl(movie.posterPath, "w342");
  const director = credits?.directors[0]?.name ?? movie.director;
  const titleSize = movie.title.length > 34 ? 50 : movie.title.length > 20 ? 58 : 68;

  return (
    <div style={{ width: WIDTH, height: HEIGHT, display: "flex", position: "relative", backgroundColor: NIGHT, fontFamily: "Geist" }}>
      {backdrop && (
        // eslint-disable-next-line @next/next/no-img-element -- o next/og não usa next/image
        <img src={backdrop} alt="" width={WIDTH} height={HEIGHT} style={{ position: "absolute", top: 0, left: 0, width: WIDTH, height: HEIGHT, objectFit: "cover" }} />
      )}
      {/* só o topo e a parte de baixo escurecem, para o texto ler; o meio é da cena */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: WIDTH,
          height: HEIGHT,
          display: "flex",
          backgroundImage: backdrop
            ? "linear-gradient(180deg, rgba(13,14,16,0.7) 0%, rgba(13,14,16,0) 16%, rgba(13,14,16,0) 42%, rgba(13,14,16,0.82) 64%, rgba(13,14,16,0.97) 100%)"
            : "radial-gradient(ellipse 80% 50% at 50% 30%, rgba(255,106,28,0.22), rgba(13,14,16,0) 70%)",
        }}
      />

      <div style={{ position: "relative", display: "flex", flexDirection: "column", width: WIDTH, height: HEIGHT, padding: "84px 100px 210px" }}>
        {/* cabeçalho */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: CREAM }}>
          <div style={{ display: "flex", alignItems: "center", fontSize: 40, fontWeight: 600, letterSpacing: -1 }}>
            NITRATE
            <div style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: ORANGE, marginLeft: 6, marginTop: 10 }} />
          </div>
          <span style={{ fontFamily: "Mono", fontSize: 24, letterSpacing: 6, color: "rgba(249,249,248,0.7)" }}>DIÁRIO DE SESSÕES</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: "auto", color: CREAM }}>
          {/* pôster e título */}
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            {poster && (
              // eslint-disable-next-line @next/next/no-img-element -- o next/og não usa next/image
              <img
                src={poster}
                alt=""
                width={200}
                height={300}
                style={{ width: 200, height: 300, objectFit: "cover", borderRadius: 12, boxShadow: "0 24px 60px rgba(0,0,0,0.55)" }}
              />
            )}
            <div style={{ display: "flex", flexDirection: "column", flex: 1, marginLeft: poster ? 40 : 0 }}>
              <span style={{ fontFamily: "Serif", fontWeight: 600, fontSize: titleSize, lineHeight: 1.05, letterSpacing: -1.5 }}>{movie.title}</span>
              <span style={{ marginTop: 16, fontFamily: "Mono", fontSize: 24, letterSpacing: 3, color: "rgba(249,249,248,0.65)" }}>
                {[movie.releaseYear, director && `DIR. ${director.toUpperCase()}`].filter(Boolean).join("  ·  ")}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", height: 2, marginTop: 52, backgroundColor: "rgba(249,249,248,0.18)" }} />

          {/* a nota */}
          <span style={{ marginTop: 44, fontFamily: "Mono", fontSize: 22, letterSpacing: 4, color: "rgba(249,249,248,0.65)" }}>MINHA NOTA</span>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
            {review.rating !== null ? (
              <div style={{ display: "flex", alignItems: "center" }}>
                <Stars rating={toRating(review.rating)} size={76} emptyColor="rgba(249,249,248,0.22)" />
                <div style={{ display: "flex", marginLeft: 28 }}>
                  <RatingNumber value={review.rating} size={104} color={CREAM} muted="rgba(249,249,248,0.6)" />
                </div>
              </div>
            ) : (
              <span style={{ fontFamily: "Serif", fontStyle: "italic", fontSize: 56 }}>assistido, sem nota</span>
            )}
            {review.liked && <Heart size={84} />}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 44, fontFamily: "Mono", fontSize: 24, letterSpacing: 2 }}>
            <span>{`SESSÃO  ${shortDate(review.watchedOn).toUpperCase()}${review.rewatch ? "  ·  REPRISE" : ""}`}</span>
            <span style={{ color: ORANGE }}>{`@${user.username}`}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- easter egg de Psicopata Americano ----------

const BONE = "#EEE8D5"; // "bone", o off-white sutil do cartão
const CARD_INK = "#2B2924";
const CARD_W = 900;
const CARD_H = 514; // proporção de um cartão de visita (3,5 x 2 polegadas)
const REVIEW_MAX = 420;

/** frente: nome, cargo e a nota; verso: a review diagramada como texto corporativo */
function BusinessCards({ review }: { review: MovieReview }) {
  const { movie, user } = review;
  const text = review.text ? stripMarkup(review.text).replace(/\s+/g, " ").trim() : "";
  const excerpt = text.length > REVIEW_MAX ? `${text.slice(0, REVIEW_MAX).replace(/\s+\S*$/, "")}…` : text;
  const rating = review.rating !== null ? toRating(review.rating) : null;

  return (
    <div
      style={{
        width: WIDTH,
        height: HEIGHT,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        backgroundColor: "#0E0E0D",
        backgroundImage: "radial-gradient(ellipse 70% 45% at 50% 42%, #2A2824 0%, #0E0E0D 70%)",
        fontFamily: "Card",
        color: BONE,
      }}
    >
      <span style={{ marginTop: 130, fontSize: 30, letterSpacing: 10, color: "rgba(238,232,213,0.55)" }}>
        LET&apos;S SEE PAUL ALLEN&apos;S CARD.
      </span>

      {/* frente do cartão */}
      <div style={{ ...cardStyle, marginTop: 90, transform: "rotate(-3deg)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, letterSpacing: 4 }}>
          <span>NITRATE · DIÁRIO</span>
          <span>{`@${user.username.toUpperCase()}`}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 86 }}>
          <span style={{ fontSize: 50, letterSpacing: 14 }}>{user.name.toUpperCase()}</span>
          <span style={{ marginTop: 14, fontSize: 26, letterSpacing: 8 }}>CRÍTICO DE CINEMA</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "auto", fontSize: 22, letterSpacing: 5 }}>
          <span>CRÍTICAS &amp; AQUISIÇÕES</span>
          <span style={{ marginTop: 8 }}>
            {[movie.title.toUpperCase(), movie.releaseYear, rating !== null ? `NOTA ${rating.toLocaleString("pt-BR")}/5` : null]
              .filter(Boolean)
              .join("  ·  ")}
          </span>
        </div>
      </div>

      {/* verso: a review */}
      <div style={{ ...cardStyle, marginTop: 70, transform: "rotate(2deg)", justifyContent: "center", alignItems: "center" }}>
        <span style={{ fontSize: 20, letterSpacing: 6, alignSelf: "center" }}>— A REVIEW —</span>
        <span style={{ marginTop: 26, maxWidth: CARD_W - 104, fontSize: excerpt.length > 260 ? 25 : 30, lineHeight: 1.45, fontStyle: "italic", textAlign: "center" }}>
          {excerpt ? `“${excerpt}”` : "Sem review. Só a nota. Impressionante. Muito bom gosto."}
        </span>
        <span style={{ marginTop: 26, fontSize: 20, letterSpacing: 6, alignSelf: "flex-end" }}>
          {`ASSISTIDO EM ${shortDate(review.watchedOn).toUpperCase()}`}
        </span>
      </div>

      <span
        style={{
          marginTop: "auto",
          marginBottom: 150,
          maxWidth: 820,
          textAlign: "center",
          fontSize: 34,
          fontStyle: "italic",
          lineHeight: 1.4,
          color: "rgba(238,232,213,0.7)",
        }}
      >
        “Look at that subtle off-white coloring. The tasteful thickness of it. Oh, my God. It even has a watermark.”
      </span>
    </div>
  );
}

const cardStyle = {
  width: CARD_W,
  height: CARD_H,
  display: "flex",
  flexDirection: "column" as const,
  padding: "44px 52px",
  backgroundColor: BONE,
  backgroundImage: "linear-gradient(135deg, #F3EEDD 0%, #E7E0CA 100%)",
  color: CARD_INK,
  borderRadius: 6,
  boxShadow: "0 30px 60px rgba(0,0,0,0.65), 0 2px 0 rgba(255,255,255,0.4) inset",
};
