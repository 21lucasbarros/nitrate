import { apiFetch } from "../api-client";
import type { AdminStats, BadgeAward } from "../types/admin";
import type { MovieList, MovieListRequest } from "../types/list";
import type { Badge } from "../types/user";

export function getAdminStats(): Promise<AdminStats> {
  return apiFetch<AdminStats>("/admin/stats");
}

export function getBadgeCatalog(): Promise<Badge[]> {
  return apiFetch<Badge[]>("/admin/badges/catalog");
}

/** todos os selos concedidos, do mais recente para o mais antigo */
export function getBadgeAwards(): Promise<BadgeAward[]> {
  return apiFetch<BadgeAward[]>("/admin/badges");
}

export function getUserBadges(username: string): Promise<Badge[]> {
  return apiFetch<Badge[]>(`/admin/users/${encodeURIComponent(username)}/badges`);
}

/** concede o selo, ou só troca a nota se a pessoa já o tem */
export function awardBadge(username: string, type: string, note: string): Promise<Badge> {
  return apiFetch<Badge>(`/admin/users/${encodeURIComponent(username)}/badges/${encodeURIComponent(type)}`, {
    method: "PUT",
    body: JSON.stringify({ note }),
  });
}

export function revokeBadge(username: string, type: string): Promise<void> {
  return apiFetch<void>(`/admin/users/${encodeURIComponent(username)}/badges/${encodeURIComponent(type)}`, {
    method: "DELETE",
  });
}

/** listas do Nitrate: todas, inclusive as privadas (rascunhos) */
export function getOfficialListsAdmin(): Promise<MovieList[]> {
  return apiFetch<MovieList[]>("/admin/lists");
}

/** completa (todos os filmes), para o editor */
export function getOfficialListAdmin(id: number): Promise<MovieList> {
  return apiFetch<MovieList>(`/admin/lists/${id}`);
}

export function createOfficialList(data: MovieListRequest): Promise<MovieList> {
  return apiFetch<MovieList>("/admin/lists", { method: "POST", body: JSON.stringify(data) });
}

/** substitui tudo: nome, descrição, visibilidade e os filmes */
export function updateOfficialList(id: number, data: MovieListRequest): Promise<MovieList> {
  return apiFetch<MovieList>(`/admin/lists/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export function deleteOfficialList(id: number): Promise<void> {
  return apiFetch<void>(`/admin/lists/${id}`, { method: "DELETE" });
}
