import type { Movie } from "@/types/movie";
import type { UserSummary } from "./user";

// Espelha MovieListDTO e MovieListRequestDTO do backend
export interface MovieList {
  id: number;
  slug: string; // endereço: /u/{dona}/lista/{slug}
  name: string;
  description: string | null;
  isPublic: boolean;
  filmsCount: number;
  movies: Movie[]; // nas listagens, só os primeiros (prévia); na página da lista, todos em ordem
  owner: UserSummary;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  containsMovie: boolean | null; // só em getMyLists(movieId)
  likesCount: number;
  commentsCount: number;
  likedByMe: boolean | null; // null para visitantes
  savedByMe: boolean | null;
}

// Espelha ListEngagementDTO: a resposta de curtir/salvar
export type ListEngagement = Pick<MovieList, "likesCount" | "commentsCount" | "likedByMe" | "savedByMe">;

// Espelha ListCommentDTO
export interface ListComment {
  id: number;
  user: UserSummary;
  text: string;
  createdAt: string; // ISO
}

export interface MovieListRequest {
  name: string;
  description: string;
  isPublic: boolean;
  movieIds: number[]; // a ordem do array é a ordem da lista
}
