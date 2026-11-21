import type { UserSummary } from "@/lib/types/user";

// Espelha SeriesDTO: séries ficam à parte dos filmes (tabela, reviews e watchlist próprias)
export interface Series {
  id: number;
  tmdbId: number;
  slug: string | null; // "breaking-bad-2008"
  name: string;
  firstAirYear: number | null;
  lastAirYear: number | null; // null se ainda está no ar
  status: string | null; // como vem do TMDB: "Returning Series", "Ended"...
  numberOfSeasons: number | null;
  numberOfEpisodes: number | null;
  rating: number | null; // TMDB, 0 a 10
  creators: string | null;
  genres: string[];
  posterPath: string | null;
  overview: string | null;
}

/** Série vinda do TMDB (busca e listas). `id` só existe se ela já foi importada. */
export interface SeriesSearchResult {
  id: number | null;
  slug: string | null;
  tmdbId: number;
  name: string;
  firstAirYear: number | null;
  posterPath: string | null;
  overview: string | null;
  rating: number | null;
}

export interface SeriesPerson {
  tmdbId: number;
  name: string;
  role: string | null; // personagem(ns), no elenco
  profilePath: string | null;
  episodes: number | null; // em quantos episódios aparece
  slug: string | null; // endereço da pessoa; nulo, o link usa o id
}

export interface SeasonSummary {
  seasonNumber: number; // 0 = especiais
  name: string | null;
  overview: string | null;
  episodeCount: number | null;
  airDate: string | null; // yyyy-mm-dd
  posterPath: string | null;
  rating: number | null;
}

// Espelha SeriesDetailsDTO: direto do TMDB, nada disso fica no banco
export interface SeriesDetails {
  backdropPath: string | null;
  tagline: string | null;
  status: string | null;
  inProduction: boolean;
  firstAirDate: string | null;
  lastAirDate: string | null;
  episodeRunTime: number | null; // minutos
  creators: SeriesPerson[];
  networks: string[];
  seasons: SeasonSummary[];
  nextEpisode: { name: string | null; airDate: string | null; seasonNumber: number | null; episodeNumber: number | null } | null;
  cast: SeriesPerson[];
}

export interface Episode {
  episodeNumber: number;
  name: string | null;
  overview: string | null;
  airDate: string | null;
  runtime: number | null;
  stillPath: string | null;
  rating: number | null;
}

export interface Season {
  seasonNumber: number;
  name: string | null;
  overview: string | null;
  airDate: string | null;
  posterPath: string | null;
  episodes: Episode[];
}

// Espelha SeriesReviewDTO / SeriesReviewRequestDTO
export interface SeriesReview {
  id: number;
  series: Series;
  user: UserSummary;
  seasonNumber: number | null; // null = a série inteira
  rating: number | null;
  text: string | null;
  liked: boolean;
  spoiler: boolean;
  watchedOn: string; // yyyy-mm-dd
  createdAt: string; // ISO
}

export interface SeriesReviewRequest {
  seriesId?: number; // só na criação
  seasonNumber: number | null;
  rating: number | null;
  text: string | null;
  liked: boolean;
  spoiler: boolean;
  watchedOn: string | null;
}

export interface SeriesUserState {
  reviews: SeriesReview[]; // do mais recente para o mais antigo
  inWatchlist: boolean;
}

export interface SeriesWatchlistItem {
  series: Series;
  addedAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  "Returning Series": "No ar",
  Ended: "Finalizada",
  Canceled: "Cancelada",
  "In Production": "Em produção",
  Planned: "Planejada",
  Pilot: "Piloto",
};

export function seriesStatusLabel(status: string | null | undefined): string | null {
  if (!status) return null;
  return STATUS_LABELS[status] ?? status;
}

/** "2008–2013", "2019–" (ainda no ar) ou só "2008" */
export function seriesYears(series: { firstAirYear: number | null; lastAirYear?: number | null; status?: string | null }): string | null {
  if (!series.firstAirYear) return null;
  if (series.lastAirYear === undefined) return String(series.firstAirYear);
  if (series.lastAirYear === null) return series.status === "Returning Series" ? `${series.firstAirYear}–` : String(series.firstAirYear);
  return series.lastAirYear === series.firstAirYear ? String(series.firstAirYear) : `${series.firstAirYear}–${series.lastAirYear}`;
}

/** "Temporada 2", "Especiais" ou "Série completa" */
export function seasonLabel(seasonNumber: number | null): string {
  if (seasonNumber === null) return "Série completa";
  return seasonNumber === 0 ? "Especiais" : `Temporada ${seasonNumber}`;
}
