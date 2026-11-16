import { apiFetch } from "../api-client";
import type { MovieReview, MovieUserState, Recommendation, WatchlistItem } from "../types/review";
import type { Page } from "../types/page";
import type { AppNotification, ProfileUpdate, UserProfile, UserSummary } from "../types/user";
import type { Movie } from "@/types/movie";

export function getMe(): Promise<UserProfile> {
  return apiFetch<UserProfile>("/users/me");
}

export function updateMyProfile(data: ProfileUpdate): Promise<UserProfile> {
  return apiFetch<UserProfile>("/users/me/profile", { method: "PUT", body: JSON.stringify(data) });
}

/** cópia de tudo o que o Nitrate guarda sobre a pessoa (LGPD) */
export function exportMyData(): Promise<unknown> {
  return apiFetch<unknown>("/users/me/export");
}

/** exclusão definitiva; a senha confirma que é a dona da conta */
export function deleteMyAccount(password: string): Promise<void> {
  return apiFetch<void>("/users/me", { method: "DELETE", body: JSON.stringify({ password }) });
}

export function getMyNotifications(): Promise<AppNotification[]> {
  return apiFetch<AppNotification[]>("/users/me/notifications");
}

export function getUnreadNotificationsCount(): Promise<{ count: number }> {
  return apiFetch<{ count: number }>("/users/me/notifications/unread-count");
}

export function markNotificationsRead(): Promise<void> {
  return apiFetch<void>("/users/me/notifications/read", { method: "POST" });
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

/** o que as pessoas que eu sigo registraram por último */
export function getMyFeed(limit: number): Promise<MovieReview[]> {
  return apiFetch<MovieReview[]>(`/users/me/feed?limit=${limit}`);
}

export const MAX_FAVORITES = 5;

/** substitui a lista inteira de favoritos; a ordem do array é a ordem do perfil */
export function setMyFavorites(movieIds: number[]): Promise<Movie[]> {
  return apiFetch<Movie[]>("/users/me/favorites", { method: "PUT", body: JSON.stringify({ movieIds }) });
}

export function followUser(username: string): Promise<void> {
  return apiFetch<void>(`/users/${encodeURIComponent(username)}/follow`, { method: "POST" });
}

export function unfollowUser(username: string): Promise<void> {
  return apiFetch<void>(`/users/${encodeURIComponent(username)}/follow`, { method: "DELETE" });
}

export function getFollowers(username: string): Promise<UserSummary[]> {
  return apiFetch<UserSummary[]>(`/users/${encodeURIComponent(username)}/followers`);
}

export function getFollowing(username: string): Promise<UserSummary[]> {
  return apiFetch<UserSummary[]>(`/users/${encodeURIComponent(username)}/following`);
}

export function searchUsers(query: string): Promise<UserSummary[]> {
  return apiFetch<UserSummary[]>(`/users/search?q=${encodeURIComponent(query)}`);
}
