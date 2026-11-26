import type { Movie } from "@/types/movie";
import type { UserSummary } from "./user";

// Espelha ReviewDTO, ReviewRequestDTO, WatchlistItemDTO e MovieUserStateDTO do backend
export interface MovieReview {
  id: number;
  movie: Movie; // com o pôster escolhido pela pessoa no lugar do do filme, quando houver
  customPoster: boolean; // movie.posterPath é o pôster escolhido, e não o do filme
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

// Espelha ReviewDTO.Together: a sessão vista do lado do dono da review (convites recusados não vêm).
// Quem convidou vê também os pendentes; quem aceitou vê quem convidou e quem mais aceitou
export interface ReviewTogether {
  partners: ReviewPartner[];
  invitedByMe: boolean;
  invitedBy: UserSummary | null; // quem convidou (nulo para ele mesmo)
  sharedText: boolean; // o texto desta review é o de `invitedBy`
}

// Espelha ReviewDTO.Partner
export interface ReviewPartner {
  user: UserSummary;
  reviewId: number | null; // nula enquanto o convite está pendente
  status: "PENDING" | "ACCEPTED";
}

// Espelha CollaborationDTO: o convite, para quem foi marcado decidir
export interface ReviewInvite {
  id: number;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  author: UserSummary;
  invitee: UserSummary;
  review: MovieReview; // a review de quem convidou
  inviteeReviewId: number | null;
  companions: ReviewPartner[]; // as outras pessoas marcadas na mesma sessão (sem quem recusou)
}

export interface ReviewRequest {
  movieId?: number; // só na criação
  rating: number | null;
  text: string | null;
  liked: boolean;
  rewatch: boolean;
  spoiler: boolean;
  watchedOn: string | null;
  // usernames de todo mundo que assistiu junto; omitido = não muda, quem sai com o convite pendente tem o convite desfeito
  watchedWith?: string[];
  // pôster nas reviews do filme no perfil (de getMoviePosters); omitido = não muda, "" = o do filme
  posterPath?: string;
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
