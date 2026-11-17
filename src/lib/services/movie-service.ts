import { apiFetch } from "../api-client";
import type { Movie, MovieSearchResult } from "@/types/movie";

export function getMovies(): Promise<Movie[]> {
  return apiFetch<Movie[]>("/movies");
}

/** os filmes que mais gente registrou no último mês */
export function getTrendingMovies(): Promise<Movie[]> {
  return apiFetch<Movie[]>("/movies/community/trending");
}

/** as maiores notas médias entre filmes avaliados por várias pessoas */
export function getTopRatedMovies(): Promise<Movie[]> {
  return apiFetch<Movie[]>("/movies/community/top-rated");
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
  backdropPath: string | null; // imagem de fundo da página do filme
  tagline: string | null;
}

/** direção, elenco, imagem de fundo e frase de efeito, direto do TMDB */
export function getMovieCredits(id: number): Promise<MovieCredits> {
  return apiFetch<MovieCredits>(`/movies/${id}/credits`);
}

/** como o filme foi recebido no Nitrate (cada pessoa conta uma vez) */
export interface MovieStats {
  averageRating: number | null;
  ratingsCount: number;
  watchedCount: number;
  likesCount: number;
  ratingDistribution: Record<string, number>; // "0.5" .. "5.0"
}

export function getMovieStats(id: number): Promise<MovieStats> {
  return apiFetch<MovieStats>(`/movies/${id}/stats`);
}

export interface WatchProvider {
  id: number;
  name: string;
  logoPath: string | null;
}

/** onde assistir no Brasil (dados da JustWatch, via TMDB) */
export interface WatchProviders {
  link: string | null;
  streaming: WatchProvider[];
  free: WatchProvider[];
  rent: WatchProvider[];
  buy: WatchProvider[];
}

export function getWatchProviders(id: number): Promise<WatchProviders> {
  return apiFetch<WatchProviders>(`/movies/${id}/watch-providers`);
}
