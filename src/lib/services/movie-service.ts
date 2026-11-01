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
