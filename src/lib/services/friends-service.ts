import { apiFetch } from "../api-client";
import type { MovieList } from "../types/list";
import type { Page } from "../types/page";
import type { MovieReview } from "../types/review";
import type { UserSummary } from "../types/user";
import type { Movie } from "@/types/movie";

// Espelha FriendWatchlistItemDTO
export interface FriendWatchlistItem {
  user: UserSummary;
  movie: Movie;
  addedAt: string; // ISO
}

/** o que quem eu sigo registrou, paginado (page começa em 0) */
export function getFriendsActivity(page: number, size: number): Promise<Page<MovieReview>> {
  return apiFetch<Page<MovieReview>>(`/users/me/friends/activity?page=${page}&size=${size}`);
}

/** as listas públicas de quem eu sigo */
export function getFriendsLists(): Promise<MovieList[]> {
  return apiFetch<MovieList[]>("/users/me/friends/lists");
}

/** o que quem eu sigo guardou na watchlist, mais recente primeiro */
export function getFriendsWatchlist(): Promise<FriendWatchlistItem[]> {
  return apiFetch<FriendWatchlistItem[]>("/users/me/friends/watchlist");
}
