import { apiFetch } from "../api-client";
import type { MovieStats, WatchProviders } from "./movie-service";
import type { ReviewComment, ReviewEngagement } from "../types/review";
import type { MovieBackdrops } from "../types/user";
import type {
  Season,
  Series,
  SeriesDetails,
  SeriesReview,
  SeriesReviewInvite,
  SeriesReviewRequest,
  SeriesSearchResult,
  SeriesUserState,
  SeriesWatchlistItem,
} from "@/types/series";

/** Busca no TMDB (via backend). */
export function searchSeries(query: string): Promise<SeriesSearchResult[]> {
  return apiFetch<SeriesSearchResult[]>(`/series/search?q=${encodeURIComponent(query.normalize("NFC"))}`);
}

/** as séries mais vistas da semana no TMDB */
export function getTrendingSeries(): Promise<SeriesSearchResult[]> {
  return apiFetch<SeriesSearchResult[]>("/series/trending");
}

export function getTopRatedSeries(): Promise<SeriesSearchResult[]> {
  return apiFetch<SeriesSearchResult[]>("/series/top-rated");
}

/** Devolve a série local correspondente ao tmdbId, importando do TMDB na primeira vez. */
export function getSeriesByTmdbId(tmdbId: number): Promise<Series> {
  return apiFetch<Series>(`/series/tmdb/${tmdbId}`);
}

export function getSeriesBySlug(slug: string): Promise<Series> {
  return apiFetch<Series>(`/series/slug/${encodeURIComponent(slug)}`);
}

/** temporadas, criadores, elenco e imagem de fundo, direto do TMDB */
export function getSeriesDetails(id: number): Promise<SeriesDetails> {
  return apiFetch<SeriesDetails>(`/series/${id}/details`);
}

/** chave "id|temporada": o useFetch compara o argumento por igualdade */
export function getSeason(key: string): Promise<Season> {
  const [id, season] = key.split("|");
  return apiFetch<Season>(`/series/${id}/seasons/${season}`);
}

/** as cenas da série, para o fundo da imagem dos Stories */
export function getSeriesScenes(id: number): Promise<MovieBackdrops> {
  return apiFetch<MovieBackdrops>(`/series/${id}/backdrops`);
}

export function getSeriesStats(id: number): Promise<MovieStats> {
  return apiFetch<MovieStats>(`/series/${id}/stats`);
}

export function getSeriesWatchProviders(id: number): Promise<WatchProviders> {
  return apiFetch<WatchProviders>(`/series/${id}/watch-providers`);
}

export function getSeriesReviews(id: number): Promise<SeriesReview[]> {
  return apiFetch<SeriesReview[]>(`/series/${id}/reviews`);
}

/** os registros de séries mais recentes de todo mundo */
export function getRecentSeriesReviews(limit = 12): Promise<SeriesReview[]> {
  return apiFetch<SeriesReview[]>(`/series/reviews/recent?limit=${limit}`);
}

/** o que quem eu sigo registrou de séries por último */
export function getMySeriesFeed(limit: number): Promise<SeriesReview[]> {
  return apiFetch<SeriesReview[]>(`/users/me/series-feed?limit=${limit}`);
}

export function getSeriesReview(id: number): Promise<SeriesReview> {
  return apiFetch<SeriesReview>(`/series/reviews/${id}`);
}

export function createSeriesReview(data: SeriesReviewRequest): Promise<SeriesReview> {
  return apiFetch<SeriesReview>("/series/reviews", { method: "POST", body: JSON.stringify(data) });
}

/** registro em conjunto: o convite que chegou pelo sino */
export function getSeriesReviewInvite(id: number): Promise<SeriesReviewInvite> {
  return apiFetch<SeriesReviewInvite>(`/series/reviews/invites/${id}`);
}

/** sem `review`, fica com o registro de quem convidou; com, escreve o próprio */
export function acceptSeriesReviewInvite(id: number, review?: SeriesReviewRequest): Promise<SeriesReview> {
  return apiFetch<SeriesReview>(`/series/reviews/invites/${id}/accept`, {
    method: "POST",
    body: JSON.stringify({ review: review ?? null }),
  });
}

export function declineSeriesReviewInvite(id: number): Promise<void> {
  return apiFetch<void>(`/series/reviews/invites/${id}/decline`, { method: "POST" });
}

export function updateSeriesReview(id: number, data: SeriesReviewRequest): Promise<SeriesReview> {
  return apiFetch<SeriesReview>(`/series/reviews/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export function deleteSeriesReview(id: number): Promise<void> {
  return apiFetch<void>(`/series/reviews/${id}`, { method: "DELETE" });
}

// curtidas e comentários no registro de série: mesmo formato das reviews de filme
export function getSeriesReviewEngagement(id: number): Promise<ReviewEngagement> {
  return apiFetch<ReviewEngagement>(`/series/reviews/${id}/engagement`);
}

export function likeSeriesReview(id: number): Promise<ReviewEngagement> {
  return apiFetch<ReviewEngagement>(`/series/reviews/${id}/like`, { method: "POST" });
}

export function unlikeSeriesReview(id: number): Promise<ReviewEngagement> {
  return apiFetch<ReviewEngagement>(`/series/reviews/${id}/like`, { method: "DELETE" });
}

export function getSeriesReviewComments(id: number): Promise<ReviewComment[]> {
  return apiFetch<ReviewComment[]>(`/series/reviews/${id}/comments`);
}

export function addSeriesReviewComment(id: number, text: string): Promise<ReviewComment> {
  return apiFetch<ReviewComment>(`/series/reviews/${id}/comments`, { method: "POST", body: JSON.stringify({ text }) });
}

export function deleteSeriesReviewComment(id: number, commentId: number): Promise<void> {
  return apiFetch<void>(`/series/reviews/${id}/comments/${commentId}`, { method: "DELETE" });
}

export function addSeriesToWatchlist(id: number): Promise<void> {
  return apiFetch<void>(`/series/${id}/watchlist`, { method: "POST" });
}

export function removeSeriesFromWatchlist(id: number): Promise<void> {
  return apiFetch<void>(`/series/${id}/watchlist`, { method: "DELETE" });
}

/** os registros e a watchlist da pessoa logada para esta série */
export function getSeriesState(id: number): Promise<SeriesUserState> {
  return apiFetch<SeriesUserState>(`/users/me/series/${id}`);
}

export function getUserSeries(username: string): Promise<SeriesReview[]> {
  return apiFetch<SeriesReview[]>(`/users/${encodeURIComponent(username)}/series`);
}

export function getUserSeriesWatchlist(username: string): Promise<SeriesWatchlistItem[]> {
  return apiFetch<SeriesWatchlistItem[]>(`/users/${encodeURIComponent(username)}/series-watchlist`);
}
