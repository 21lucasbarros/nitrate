import { apiFetch } from "../api-client";
import type { ListComment, ListEngagement, MovieList, MovieListRequest } from "../types/list";

/** listas do perfil; no próprio perfil vêm também as privadas */
export function getUserLists(username: string): Promise<MovieList[]> {
  return apiFetch<MovieList[]>(`/users/${encodeURIComponent(username)}/lists`);
}

/** minhas listas; com movieId, cada uma diz se já tem o filme */
export function getMyLists(movieId: number): Promise<MovieList[]> {
  return apiFetch<MovieList[]>(`/users/me/lists?movieId=${movieId}`);
}

/** pelo id: só para levar endereços antigos (/lista/{id}) ao novo */
export function getList(id: number): Promise<MovieList> {
  return apiFetch<MovieList>(`/lists/${id}`);
}

export function getListBySlug(username: string, slug: string): Promise<MovieList> {
  return apiFetch<MovieList>(`/users/${encodeURIComponent(username)}/lists/${encodeURIComponent(slug)}`);
}

/** as listas públicas mais curtidas da comunidade */
export function getPopularLists(limit = 6): Promise<MovieList[]> {
  return apiFetch<MovieList[]>(`/lists/popular?limit=${limit}`);
}

/** as listas públicas do Nitrate, da atualizada mais recentemente para a mais antiga */
export function getOfficialLists(): Promise<MovieList[]> {
  return apiFetch<MovieList[]>("/lists/official");
}

/** as listas públicas de quem eu sigo, das atualizadas por último */
export function getFriendsLists(limit = 6): Promise<MovieList[]> {
  return apiFetch<MovieList[]>(`/users/me/friends/lists?limit=${limit}`);
}

/** listas de outras pessoas que salvei */
export function getSavedLists(): Promise<MovieList[]> {
  return apiFetch<MovieList[]>("/users/me/saved-lists");
}

export function likeList(id: number): Promise<ListEngagement> {
  return apiFetch<ListEngagement>(`/lists/${id}/like`, { method: "POST" });
}

export function unlikeList(id: number): Promise<ListEngagement> {
  return apiFetch<ListEngagement>(`/lists/${id}/like`, { method: "DELETE" });
}

export function saveList(id: number): Promise<ListEngagement> {
  return apiFetch<ListEngagement>(`/lists/${id}/save`, { method: "POST" });
}

export function unsaveList(id: number): Promise<ListEngagement> {
  return apiFetch<ListEngagement>(`/lists/${id}/save`, { method: "DELETE" });
}

export function getListComments(id: number): Promise<ListComment[]> {
  return apiFetch<ListComment[]>(`/lists/${id}/comments`);
}

export function addListComment(id: number, text: string): Promise<ListComment> {
  return apiFetch<ListComment>(`/lists/${id}/comments`, { method: "POST", body: JSON.stringify({ text }) });
}

export function deleteListComment(id: number, commentId: number): Promise<void> {
  return apiFetch<void>(`/lists/${id}/comments/${commentId}`, { method: "DELETE" });
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
