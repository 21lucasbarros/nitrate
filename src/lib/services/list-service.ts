import { apiFetch } from "../api-client";
import type { MovieList, MovieListRequest } from "../types/list";

/** listas do perfil; no próprio perfil vêm também as privadas */
export function getUserLists(username: string): Promise<MovieList[]> {
  return apiFetch<MovieList[]>(`/users/${encodeURIComponent(username)}/lists`);
}

/** minhas listas; com movieId, cada uma diz se já tem o filme */
export function getMyLists(movieId: number): Promise<MovieList[]> {
  return apiFetch<MovieList[]>(`/users/me/lists?movieId=${movieId}`);
}

export function getList(id: number): Promise<MovieList> {
  return apiFetch<MovieList>(`/lists/${id}`);
}

export function createList(data: MovieListRequest): Promise<MovieList> {
  return apiFetch<MovieList>("/lists", { method: "POST", body: JSON.stringify(data) });
}

/** substitui tudo: nome, descrição, visibilidade e os filmes */
export function updateList(id: number, data: MovieListRequest): Promise<MovieList> {
  return apiFetch<MovieList>(`/lists/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export function deleteList(id: number): Promise<void> {
  return apiFetch<void>(`/lists/${id}`, { method: "DELETE" });
}

export function addMovieToList(id: number, movieId: number): Promise<MovieList> {
  return apiFetch<MovieList>(`/lists/${id}/movies/${movieId}`, { method: "POST" });
}

export function removeMovieFromList(id: number, movieId: number): Promise<MovieList> {
  return apiFetch<MovieList>(`/lists/${id}/movies/${movieId}`, { method: "DELETE" });
}
