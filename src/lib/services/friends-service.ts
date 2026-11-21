import { apiFetch } from "../api-client";
import type { MovieList } from "../types/list";
import type { MovieReview } from "../types/review";
import type { UserSummary } from "../types/user";
import type { Movie } from "@/types/movie";

// Espelha ActivityDTO e ActivityPageDTO
export type ActivityType = "REVIEW" | "WATCHLIST" | "LIST" | "REVIEW_LIKE" | "COMMENT" | "FOLLOW" | "LIST_ENTRY";

export interface Activity {
  type: ActivityType;
  id: string; // único entre os tipos ("review-12", "like-3"...)
  at: string; // ISO
  user: UserSummary; // quem fez a ação
  review: MovieReview | null; // REVIEW, REVIEW_LIKE e COMMENT
  movie: Movie | null; // WATCHLIST e LIST_ENTRY
  list: MovieList | null; // LIST e LIST_ENTRY (a lista em que o filme entrou; só na atividade de um filme)
  comment: string | null; // COMMENT (prévia)
  target: UserSummary | null; // FOLLOW
  likesCount: number | null; // REVIEW com texto
  likedByMe: boolean | null;
}

export interface ActivityPage {
  items: Activity[];
  nextBefore: string | null; // null = acabou
}

/** feed de atividade meu e de quem eu sigo; `before` (ISO) pede a página seguinte */
export function getFriendsFeed(before: string | null, size = 30): Promise<ActivityPage> {
  const params = new URLSearchParams({ size: String(size) });
  if (before) params.set("before", before);
  return apiFetch<ActivityPage>(`/users/me/friends/feed?${params}`);
}
