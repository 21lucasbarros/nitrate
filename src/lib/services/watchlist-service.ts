import { apiFetch } from "../api-client";
import type { WatchlistItem } from "../types/review";

export function addToWatchlist(movieId: number): Promise<WatchlistItem> {
  return apiFetch<WatchlistItem>(`/watchlist/${movieId}`, { method: "POST" });
}

export function removeFromWatchlist(movieId: number): Promise<void> {
  return apiFetch<void>(`/watchlist/${movieId}`, { method: "DELETE" });
}
