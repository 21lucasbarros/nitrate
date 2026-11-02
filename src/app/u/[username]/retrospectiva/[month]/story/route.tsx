import { ImageResponse } from "next/og";
import { getRetrospective } from "@/lib/services/retrospective-service";
import type { Retrospective } from "@/lib/types/retrospective";
import { monthLabel } from "@/utils/format";
import { posterUrl } from "@/utils/poster";

/**
 * Imagem da retrospectiva no formato dos Stories (1080x1920), para compartilhar no Instagram.
 * GET /u/{username}/retrospectiva/{mes}/story
 */

const WIDTH = 1080;
const HEIGHT = 1920;

const CHARCOAL = "#1D2128";
const ORANGE = "#FF6A1C";
const PAPER = "#F9F9F8";

// fonte dos títulos: o next/og só traz o Geist Regular embutido
let semiBold: Promise<ArrayBuffer | null> | null = null;
function loadSemiBold(): Promise<ArrayBuffer | null> {
  semiBold ??= (async () => {
    try {
      // sem user-agent de navegador, o Google Fonts devolve TTF (o next/og não lê woff2)
      const css = await (await fetch("https://fonts.googleapis.com/css2?family=Geist:wght@600")).text();
      const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
      return url ? await (await fetch(url)).arrayBuffer() : null;
    } catch {
      return null; // sem a fonte, o título sai no peso regular; a imagem continua sendo gerada
    }
  })();
  return semiBold;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string; month: string }> },
) {
  const { username, month } = await params;

  let retro: Retrospective;
  try {
    retro = await getRetrospective(username, month);
  } catch {
    return new Response("Retrospectiva não encontrada", { status: 404 });
  }

  const font = await loadSemiBold();

  return new ImageResponse(<Story retro={retro} />, {
    width: WIDTH,
    height: HEIGHT,
    fonts: font ? [{ name: "Geist", data: font, weight: 600, style: "normal" }] : undefined,
    headers: {
      // a retrospectiva de um mês que já acabou não muda mais
      "Cache-Control": "public, max-age=300, s-maxage=3600",
    },
  });
}

function Story({ retro }: { retro: Retrospective }) {
  const [monthName, year] = monthLabel(retro.month).split(" de ");
  // fotogramas da tira: favoritos primeiro, completando com o resto do mês
  const frames = [...retro.favorites, ...retro.films.filter((f) => !retro.favorites.includes(f))]
    .map((f) => posterUrl(f.movie.posterPath, "w342"))
    .filter((src): src is string => !!src)
    .slice(0, 4);

  return (
    <div
      style={{
        width: WIDTH,
        height: HEIGHT,
        display: "flex",
        flexDirection: "column",
        backgroundColor: CHARCOAL,
        color: PAPER,
        fontFamily: "Geist",
      }}
    >
      <FilmStrip frames={frames} />

      <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "64px 80px 72px" }}>
        {/* cabeçalho */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", fontSize: 40, fontWeight: 600, letterSpacing: -1 }}>
            NITRATE
            <div style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: ORANGE, marginLeft: 6, marginTop: 10 }} />
          </div>
          <div style={{ fontSize: 34, color: "rgba(249,249,248,0.6)" }}>{`${monthName} ${year}`}</div>
        </div>

        {/* título */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 72, fontSize: 92, fontWeight: 600, lineHeight: 1, letterSpacing: -3 }}>
          <span>Minha retrospectiva</span>
          <span style={{ color: "rgba(249,249,248,0.55)" }}>{`de ${monthName}`}</span>
        </div>

        {/* número principal */}
        <div style={{ display: "flex", alignItems: "flex-end", marginTop: 72 }}>
          <span style={{ fontSize: 220, fontWeight: 600, color: ORANGE, lineHeight: 0.85, letterSpacing: -8 }}>
            {String(retro.filmsCount)}
          </span>
          <div style={{ display: "flex", flexDirection: "column", marginLeft: 28, marginBottom: 14, fontSize: 36, color: "rgba(249,249,248,0.7)", lineHeight: 1.2 }}>
            <span>{retro.filmsCount === 1 ? "filme" : "filmes"}</span>
            <span>assistidos</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginLeft: "auto", alignItems: "flex-end", marginBottom: 10 }}>
            {retro.averageRating !== null && (
              <div style={{ display: "flex", alignItems: "center", fontSize: 56, fontWeight: 600 }}>
                <Star size={44} />
                <span style={{ marginLeft: 12 }}>{retro.averageRating.toLocaleString("pt-BR")}</span>
              </div>
            )}
            <span style={{ fontSize: 28, color: "rgba(249,249,248,0.6)", marginTop: 6 }}>
              {`${retro.likesCount} curtido${retro.likesCount === 1 ? "" : "s"}`}
            </span>
          </div>
        </div>

        {/* rankings */}
        <div style={{ display: "flex", marginTop: 88, gap: 56 }}>
          <Ranking
            title="Diretores em destaque"
            items={retro.topDirectors.slice(0, 5).map((d) => ({ label: d.name }))}
          />
          <Ranking
            title="Favoritos do mês"
            items={retro.favorites.slice(0, 5).map((f) => ({ label: f.movie.title, rating: f.rating }))}
          />
        </div>

        {/* gênero do mês */}
        {retro.topGenres[0] && (
          <div style={{ display: "flex", flexDirection: "column", marginTop: "auto" }}>
            <span style={{ fontSize: 30, color: "rgba(249,249,248,0.6)" }}>Gênero do mês</span>
            <span style={{ fontSize: 72, fontWeight: 600, color: ORANGE, letterSpacing: -2 }}>
              {retro.topGenres[0].name}
            </span>
          </div>
        )}

        {/* rodapé */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 48, fontSize: 28, color: "rgba(249,249,248,0.5)" }}>
          <span>nitrate · retrospectiva mensal</span>
          <span>{`@${retro.username}`}</span>
        </div>
      </div>
    </div>
  );
}

/** tira de filme 35mm: perfurações em cima e embaixo, pôsteres como fotogramas */
function Perforations() {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "0 30px" }}>
      {Array.from({ length: 14 }, (_, i) => (
        <div key={i} style={{ width: 36, height: 26, borderRadius: 6, backgroundColor: CHARCOAL }} />
      ))}
    </div>
  );
}

function FilmStrip({ frames }: { frames: string[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", backgroundColor: "#0B0D10", padding: "22px 0", gap: 22 }}>
      <Perforations />
      <div style={{ display: "flex", gap: 18, padding: "0 30px", height: 380 }}>
        {frames.length === 0 ? (
          <div style={{ display: "flex", flex: 1, backgroundColor: "#2A2F37", borderRadius: 6 }} />
        ) : (
          frames.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element -- o next/og não usa next/image
            <img
              key={i}
              src={src}
              width={240}
              height={360}
              style={{ width: 240, height: 380, objectFit: "cover", borderRadius: 6 }}
              alt=""
            />
          ))
        )}
      </div>
      <Perforations />
    </div>
  );
}

function Ranking({ title, items }: { title: string; items: { label: string; rating?: number | null }[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
      <span style={{ fontSize: 34, fontWeight: 600, marginBottom: 22 }}>{title}</span>
      {items.length === 0 ? (
        <span style={{ fontSize: 30, color: "rgba(249,249,248,0.5)" }}>—</span>
      ) : (
        items.map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", fontSize: 32, marginBottom: 14 }}>
            <span style={{ width: 40, color: ORANGE, fontWeight: 600 }}>{String(i + 1)}</span>
            <span
              style={{
                flex: 1,
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                color: "rgba(249,249,248,0.9)",
              }}
            >
              {item.label}
            </span>
            {item.rating != null && (
              <div style={{ display: "flex", alignItems: "center", marginLeft: 12, fontSize: 28, color: "rgba(249,249,248,0.7)" }}>
                <Star size={24} />
                <span style={{ marginLeft: 6 }}>{item.rating.toLocaleString("pt-BR")}</span>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

// estrela em SVG: o caractere ★ não existe na fonte usada pelo next/og
function Star({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path
        fill={ORANGE}
        d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z"
      />
    </svg>
  );
}
