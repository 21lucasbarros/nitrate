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
