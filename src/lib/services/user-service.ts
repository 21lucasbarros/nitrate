import { apiFetch } from "../api-client";
import type { MovieReview, MovieUserState, WatchlistItem } from "../types/review";
import type { UserProfile } from "../types/user";

export function getMe(): Promise<UserProfile> {
  return apiFetch<UserProfile>("/users/me");
}

export function getMovieState(movieId: number): Promise<MovieUserState> {
  return apiFetch<MovieUserState>(`/users/me/movies/${movieId}`);
}

export function getProfile(username: string): Promise<UserProfile> {
  return apiFetch<UserProfile>(`/users/${encodeURIComponent(username)}`);
}

export function getUserReviews(username: string): Promise<MovieReview[]> {
  return apiFetch<MovieReview[]>(`/users/${encodeURIComponent(username)}/reviews`);
}

export function getUserWatchlist(username: string): Promise<WatchlistItem[]> {
  return apiFetch<WatchlistItem[]>(`/users/${encodeURIComponent(username)}/watchlist`);
}
