import type { Movie } from "@/types/movie";
import type { UserSummary } from "./user";

// Espelha MovieListDTO e MovieListRequestDTO do backend
export interface MovieList {
  id: number;
  name: string;
  description: string | null;
  isPublic: boolean;
  filmsCount: number;
  movies: Movie[]; // nas listagens, só os primeiros (prévia); na página da lista, todos em ordem
  owner: UserSummary;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  containsMovie: boolean | null; // só em getMyLists(movieId)
}

export interface MovieListRequest {
  name: string;
  description: string;
  isPublic: boolean;
  movieIds: number[]; // a ordem do array é a ordem da lista
}
