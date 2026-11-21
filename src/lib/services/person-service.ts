import { apiFetch } from "../api-client";
import type { Achievement, PersonDetail, PersonProgress, PersonSummary } from "@/types/person";

export function searchPeople(query: string): Promise<PersonSummary[]> {
  return apiFetch<PersonSummary[]>(`/people/search?q=${encodeURIComponent(query.normalize("NFC"))}`);
}

/** `ref`: o slug ("ben-stiller") ou o id do TMDB */
export function getPerson(ref: string | number): Promise<PersonDetail> {
  return apiFetch<PersonDetail>(`/people/${encodeURIComponent(String(ref))}`);
}

/** quanto da filmografia já lançada da pessoa eu vi (e a conquista, se completei) */
export function getPersonProgress(tmdbId: number): Promise<PersonProgress> {
  return apiFetch<PersonProgress>(`/users/me/people/${tmdbId}/progress`);
}

/** conquistas do perfil; no meu, vêm também as que tirei do perfil */
export function getUserAchievements(username: string): Promise<Achievement[]> {
  return apiFetch<Achievement[]>(`/users/${encodeURIComponent(username)}/achievements`);
}

export function setAchievementHidden(id: number, hidden: boolean): Promise<Achievement> {
  return apiFetch<Achievement>(`/users/me/achievements/${id}`, { method: "PUT", body: JSON.stringify({ hidden }) });
}
