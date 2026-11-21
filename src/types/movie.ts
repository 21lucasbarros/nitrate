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
  releaseDate?: string | null; // yyyy-mm-dd; só vem no filme carregado direto (não nas reviews)
  released?: boolean; // antes da estreia dá para registrar e curtir, mas não dar nota
}

/** sem a informação, o filme conta como lançado (o backend tem a palavra final) */
export function canRate(movie: Movie): boolean {
  return movie.released !== false;
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
