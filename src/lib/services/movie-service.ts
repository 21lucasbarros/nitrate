import { apiFetch } from "../api-client";
import type { Page } from "../types/page";
import type { MovieBackdrops } from "../types/user";
import { getMovieBackdrops } from "./user-service";
import type { Movie, MovieSearchResult } from "@/types/movie";

/** o catálogo em páginas (page começa em 0); sem filtros, na ordem em que os filmes entraram no Nitrate */
export function getCatalog(page: number, size: number, filters?: URLSearchParams): Promise<Page<Movie>> {
  const params = new URLSearchParams(filters);
  params.set("page", String(page));
  params.set("size", String(size));
  return apiFetch<Page<Movie>>(`/movies/catalog?${params}`);
}

/** os gêneros que aparecem no catálogo de filmes, em ordem alfabética */
export function getMovieGenres(): Promise<string[]> {
  return apiFetch<string[]>("/movies/genres");
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
  return apiFetch<MovieSearchResult[]>(`/movies/search?q=${encodeURIComponent(query.normalize("NFC"))}`);
}

/**
 * As cenas de um filme do Nitrate no TMDB. O backend não expõe o tmdbId do filme, então ele vem
 * da busca pelo título, que devolve o id local dos filmes já importados.
 */
export async function getMovieScenes(movie: Pick<Movie, "id" | "title">): Promise<MovieBackdrops> {
  const match = (await searchMovies(movie.title)).find((result) => result.id === movie.id);
  if (!match) throw new Error("Filme não encontrado no TMDB");
  return getMovieBackdrops(match.tmdbId);
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
  slug: string | null; // endereço da pessoa; nulo, o link usa o id
}

export interface MovieCredits {
  directors: CreditPerson[];
  cast: CreditPerson[];
  backdropPath: string | null; // imagem de fundo da página do filme
  tagline: string | null;
  runtime: number | null; // minutos
}

/** direção, elenco, imagem de fundo, frase de efeito e duração, direto do TMDB */
export function getMovieCredits(id: number): Promise<MovieCredits> {
  return apiFetch<MovieCredits>(`/movies/${id}/credits`);
}

// Espelha PostersDTO (de filme ou de série)
export interface Posters {
  id: number;
  defaultPoster: string | null;
  posters: string[]; // o do título primeiro
}

/** os pôsteres do filme no TMDB, para trocar o pôster nas suas reviews */
export function getMoviePosters(id: number): Promise<Posters> {
  return apiFetch<Posters>(`/movies/${id}/posters`);
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
