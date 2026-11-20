import type { Badge, UserSummary } from "./user";

// Espelha AdminStatsDTO
export interface AdminStats {
  users: {
    total: number;
    new7d: number;
    new30d: number;
    // quem usou o site logado no período; o registro começou com o painel
    active1d: number;
    active7d: number;
    active30d: number;
  };
  content: {
    reviews: number; // registros no diário (com ou sem texto)
    reviews7d: number;
    reviews30d: number;
    writtenReviews: number;
    movies: number;
    reviewLikes: number;
    reviewComments: number;
    lists: number;
    listLikes: number;
    listComments: number;
    follows: number;
    watchlist: number;
    badges: number;
  };
  days: AdminDay[]; // últimos 30 dias, do mais antigo para hoje
  recentUsers: { user: UserSummary; createdAt: string; lastSeenAt: string | null; reviews: number }[];
  topReviewers: { user: UserSummary; reviews: number }[];
}

export interface AdminDay {
  date: string; // "2026-11-20"
  signups: number;
  reviews: number;
  reviewers: number;
}

// Espelha AdminBadgeAwardDTO
export interface BadgeAward {
  user: UserSummary;
  badge: Badge;
}
