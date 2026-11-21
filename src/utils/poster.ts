const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export type PosterSize = "w185" | "w342" | "w500";
export type ProfileSize = "w185" | "h632";

function tmdbImage(path: string | null | undefined, size: string): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path.startsWith("/") ? path : `/${path}`}`;
}

/** URL do pôster no TMDB a partir do posterPath salvo no backend (ex.: "/abc.jpg"). */
export function posterUrl(path: string | null | undefined, size: PosterSize = "w342"): string | null {
  return tmdbImage(path, size);
}

/** foto de perfil de uma pessoa no TMDB */
export function profileUrl(path: string | null | undefined, size: ProfileSize = "w185"): string | null {
  return tmdbImage(path, size);
}

/** logo de um serviço de streaming no TMDB */
export function logoUrl(path: string | null | undefined): string | null {
  return tmdbImage(path, "w92");
}

/** imagem de um episódio de série no TMDB */
export function stillUrl(path: string | null | undefined): string | null {
  return tmdbImage(path, "w300");
}

/** imagem de fundo (cena do filme) no TMDB; w780 para miniaturas */
export function backdropUrl(path: string | null | undefined, size: "w780" | "w1280" = "w1280"): string | null {
  return tmdbImage(path, size);
}
