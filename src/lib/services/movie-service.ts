import { apiFetch } from "../api-client";
import type { Movie, MovieSearchResult } from "@/types/movie";

export function getMovies(): Promise<Movie[]> {
  return apiFetch<Movie[]>("/movies");
}

export function getMovie(id: number): Promise<Movie> {
  return apiFetch<Movie>(`/movies/${id}`);
}

/** Busca no TMDB (via backend). */
export function searchMovies(query: string): Promise<MovieSearchResult[]> {
  return apiFetch<MovieSearchResult[]>(`/movies/search?q=${encodeURIComponent(query)}`);
}

/** Devolve o filme local correspondente ao tmdbId, importando do TMDB na primeira vez. */
export function getMovieByTmdbId(tmdbId: number): Promise<Movie> {
  return apiFetch<Movie>(`/movies/tmdb/${tmdbId}`);
}

export function getMovieBySlug(slug: string): Promise<Movie> {
  return apiFetch<Movie>(`/movies/slug/${encodeURIComponent(slug)}`);
}

export interface CreditPerson {
  tmdbId: number;
  name: string;
  role: string | null; // personagem (elenco)
  profilePath: string | null;
}

export interface MovieCredits {
  directors: CreditPerson[];
  cast: CreditPerson[];
}

/** direção e elenco, direto do TMDB */
export function getMovieCredits(id: number): Promise<MovieCredits> {
  return apiFetch<MovieCredits>(`/movies/${id}/credits`);
}
