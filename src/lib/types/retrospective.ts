import type { Movie } from "@/types/movie";

// Espelha RetrospectiveDTO do backend
export interface RankedItem {
  name: string;
  count: number;
}

export interface RetrospectiveFilm {
  movie: Movie;
  rating: number | null;
  liked: boolean;
  watchedOn: string; // yyyy-mm-dd
}

export interface Retrospective {
  username: string;
  name: string;
  month: string; // "2026-10"
  filmsCount: number;
  reviewsCount: number;
  likesCount: number;
  averageRating: number | null;
  ratingDistribution: Record<string, number>; // "0.5" .. "5.0"
  topDirectors: RankedItem[];
  topGenres: RankedItem[];
  topActors: RankedItem[];
  favorites: RetrospectiveFilm[];
  films: RetrospectiveFilm[];
}
