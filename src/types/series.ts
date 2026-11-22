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
  released?: boolean; // antes da estreia dá para registrar e curtir, mas não dar nota
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
  episodeNumber: number | null; // null = a temporada inteira
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
  episodeNumber: number | null; // só junto com seasonNumber
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

/** "Temporada 2", "Especiais", "Série completa" ou, com episódio, "Temporada 2 · Episódio 5" */
export function seasonLabel(seasonNumber: number | null, episodeNumber: number | null = null): string {
  if (seasonNumber === null) return "Série completa";
  const season = seasonNumber === 0 ? "Especiais" : `Temporada ${seasonNumber}`;
  return episodeNumber === null ? season : `${season} · Episódio ${episodeNumber}`;
}

/** selo curto no canto do pôster: "T2E5", "T2", "Especiais" ou "Série" */
export function seriesBadgeLabel(review: { seasonNumber: number | null; episodeNumber: number | null }): string {
  if (review.seasonNumber === null) return "Série";
  if (review.episodeNumber !== null) return episodeCode(review.seasonNumber, review.episodeNumber);
  return review.seasonNumber === 0 ? "Especiais" : `T${review.seasonNumber}`;
}

/** "T2E5" */
export function episodeCode(seasonNumber: number, episodeNumber: number): string {
  return `T${seasonNumber}E${episodeNumber}`;
}

export interface EpisodeRef {
  seasonNumber: number;
  episodeNumber: number;
}

/**
 * Até onde a pessoa assistiu: o episódio mais adiante entre os registros (uma temporada inteira conta
 * como o último episódio dela). Especiais ficam de fora; quem registrou a série inteira já terminou (null).
 */
export function watchProgress(reviews: SeriesReview[], seasons: SeasonSummary[]): EpisodeRef | null {
  if (reviews.some((r) => r.seasonNumber === null)) return null;
  let best: EpisodeRef | null = null;
  for (const r of reviews) {
    if (!r.seasonNumber) continue;
    const episodeNumber = r.episodeNumber ?? seasons.find((s) => s.seasonNumber === r.seasonNumber)?.episodeCount;
    if (!episodeNumber) continue;
    if (!best || r.seasonNumber > best.seasonNumber || (r.seasonNumber === best.seasonNumber && episodeNumber > best.episodeNumber)) {
      best = { seasonNumber: r.seasonNumber, episodeNumber };
    }
  }
  return best;
}

/**
 * O episódio depois de `ref`: o próximo da temporada ou o primeiro da seguinte. Null se acabou ou se ainda
 * não foi ao ar (`upcoming` é o próximo episódio a estrear, do TMDB).
 */
export function episodeAfter(ref: EpisodeRef, seasons: SeasonSummary[], upcoming?: { seasonNumber: number | null; episodeNumber: number | null } | null): EpisodeRef | null {
  const current = seasons.find((s) => s.seasonNumber === ref.seasonNumber);
  let next: EpisodeRef | null = null;
  if (current?.episodeCount && ref.episodeNumber < current.episodeCount) {
    next = { seasonNumber: ref.seasonNumber, episodeNumber: ref.episodeNumber + 1 };
  } else if (seasons.some((s) => s.seasonNumber === ref.seasonNumber + 1 && (s.episodeCount ?? 0) > 0)) {
    next = { seasonNumber: ref.seasonNumber + 1, episodeNumber: 1 };
  }
  if (!next || !upcoming?.seasonNumber || !upcoming.episodeNumber) return next;
  const notAired = next.seasonNumber > upcoming.seasonNumber
    || (next.seasonNumber === upcoming.seasonNumber && next.episodeNumber >= upcoming.episodeNumber);
  return notAired ? null : next;
}
