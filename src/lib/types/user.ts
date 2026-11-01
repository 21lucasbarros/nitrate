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
}
