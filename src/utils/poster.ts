const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export type PosterSize = "w185" | "w342" | "w500";

/** URL do pôster no TMDB a partir do posterPath salvo no backend (ex.: "/abc.jpg"). */
export function posterUrl(path: string | null | undefined, size: PosterSize = "w342"): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path.startsWith("/") ? path : `/${path}`}`;
}
