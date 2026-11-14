export interface Movie {
  id: number;
  title: string;
  releaseYear: number | null;
  rating: number | null;
  director: string | null;
  franchise: string | null;
  genres: string[];
  slug: string | null; // "superman-2025"
  posterPath: string | null;
  overview: string | null;
}

/** Resultado da busca no TMDB. `id` só existe se o filme já foi importado para o Nitrate. */
export interface MovieSearchResult {
  id: number | null;
  slug: string | null;
  tmdbId: number;
  title: string;
  releaseYear: number | null;
  posterPath: string | null;
  overview: string | null;
  rating: number | null;
}
