import { apiFetch } from "../api-client";
import type { MovieReview, MovieUserState, Recommendation, WatchlistItem } from "../types/review";
import type { Page } from "../types/page";
import type { UserProfile } from "../types/user";

export function getMe(): Promise<UserProfile> {
  return apiFetch<UserProfile>("/users/me");
}

export function getMyRecommendations(): Promise<Recommendation[]> {
  return apiFetch<Recommendation[]>("/users/me/recommendations");
}

export function getMovieState(movieId: number): Promise<MovieUserState> {
  return apiFetch<MovieUserState>(`/users/me/movies/${movieId}`);
}

export function getProfile(username: string): Promise<UserProfile> {
  return apiFetch<UserProfile>(`/users/${encodeURIComponent(username)}`);
}

/** diário paginado (page começa em 0); withText = só reviews escritas */
export function getUserReviews(
  username: string,
  { page, size, withText = false }: { page: number; size: number; withText?: boolean },
): Promise<Page<MovieReview>> {
  return apiFetch<Page<MovieReview>>(
    `/users/${encodeURIComponent(username)}/reviews?page=${page}&size=${size}&withText=${withText}`,
  );
}

export function getUserWatchlist(username: string): Promise<WatchlistItem[]> {
  return apiFetch<WatchlistItem[]>(`/users/${encodeURIComponent(username)}/watchlist`);
}
