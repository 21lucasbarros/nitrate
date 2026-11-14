import type { Movie } from "@/types/movie";

// Espelha UserSummaryDTO e UserProfileDTO do backend
export interface UserSummary {
  username: string;
  name: string;
}

export interface UserProfile extends UserSummary {
  createdAt: string; // ISO
  filmsCount: number;
  reviewsCount: number; // só as que têm texto
  likesCount: number;
  watchlistCount: number;
  followersCount: number;
  followingCount: number;
  favorites: Movie[]; // até 5, em ordem
  followedByMe: boolean | null; // null para visitantes e no próprio perfil
}
