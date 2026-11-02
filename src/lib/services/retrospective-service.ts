import { apiFetch } from "../api-client";
import type { Retrospective } from "../types/retrospective";

/** month no formato "2026-10" */
export function getRetrospective(username: string, month: string): Promise<Retrospective> {
  return apiFetch<Retrospective>(
    `/users/${encodeURIComponent(username)}/retrospective?month=${encodeURIComponent(month)}`,
  );
}

/** meses com algum filme registrado, do mais recente para o mais antigo */
export function getRetrospectiveMonths(username: string): Promise<string[]> {
  return apiFetch<string[]>(`/users/${encodeURIComponent(username)}/retrospective/months`);
}
