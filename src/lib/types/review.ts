import type { Movie } from "@/types/movie";
import type { UserSummary } from "./user";

// Espelha ReviewDTO, ReviewRequestDTO, WatchlistItemDTO e MovieUserStateDTO do backend
export interface MovieReview {
  id: number;
  movie: Movie;
  user: UserSummary;
  rating: number | null; // 0.5 a 5; null = assistiu sem dar nota
  text: string | null;
  liked: boolean;
  spoiler: boolean; // texto escondido para os outros até clicarem para ver
  watchedOn: string; // yyyy-mm-dd
  createdAt: string; // ISO
}

export interface ReviewRequest {
  movieId?: number; // só na criação
  rating: number | null;
  text: string | null;
  liked: boolean;
  spoiler: boolean;
  watchedOn: string | null;
}

export interface WatchlistItem {
  movie: Movie;
  addedAt: string;
}

export interface MovieUserState {
  review: MovieReview | null;
  inWatchlist: boolean;
}

// Espelha RecommendationResultDTO
export interface Recommendation {
  movieId: number;
  title: string;
  releaseYear: number | null;
  posterPath: string | null;
  score: number;
  reasons: string[]; // os motivos mais fortes primeiro
}
