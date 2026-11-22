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
  rewatch: boolean; // já tinha assistido antes
  spoiler: boolean; // texto escondido para os outros até clicarem para ver
  watchedOn: string; // yyyy-mm-dd
  createdAt: string; // ISO
  together: ReviewTogether | null; // review em conjunto ("assisti com")
}

// Espelha ReviewDTO.Together: o par visto do lado do dono da review (convites recusados não vêm)
export interface ReviewTogether {
  partner: UserSummary;
  partnerReviewId: number | null; // nula enquanto o convite está pendente
  status: "PENDING" | "ACCEPTED";
  invitedByMe: boolean;
  sharedText: boolean; // o texto desta review é o de `partner`
}

// Espelha CollaborationDTO: o convite, para quem foi marcado decidir
export interface ReviewInvite {
  id: number;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  author: UserSummary;
  invitee: UserSummary;
  review: MovieReview; // a review de quem convidou
  inviteeReviewId: number | null;
}

export interface ReviewRequest {
  movieId?: number; // só na criação
  rating: number | null;
  text: string | null;
  liked: boolean;
  rewatch: boolean;
  spoiler: boolean;
  watchedOn: string | null;
  // username de quem assistiu junto; omitido = não muda, "" = desfaz o convite pendente
  watchedWith?: string;
}

// Espelha ReviewEngagementDTO e ReviewCommentDTO
export interface ReviewEngagement {
  likesCount: number;
  likedByMe: boolean | null; // null para visitantes
  commentsCount: number;
}

export interface ReviewComment {
  id: number;
  user: UserSummary;
  text: string;
  createdAt: string; // ISO
}

// Espelha FilmDTO: um filme da aba "Filmes", com todas as vezes que a pessoa assistiu
export interface FilmViewing {
  id: number; // id da review
  watchedOn: string | null; // yyyy-mm-dd
  rating: number | null;
  liked: boolean;
  rewatch: boolean;
  hasText: boolean;
}

export interface FilmEntry {
  review: MovieReview; // o registro mais recente
  viewings: FilmViewing[]; // do mais recente para o mais antigo (1 = assistiu uma vez)
}

export interface WatchlistItem {
  movie: Movie;
  addedAt: string;
}

export interface MovieUserState {
  review: MovieReview | null; // a mais recente
  reviewsCount: number; // quantas vezes registrou o filme
  inWatchlist: boolean;
}

// Espelha RecommendationResultDTO
export interface Recommendation {
  movieId: number;
  slug: string | null;
  title: string;
  releaseYear: number | null;
  posterPath: string | null;
  score: number;
  reasons: string[]; // os motivos mais fortes primeiro
}
