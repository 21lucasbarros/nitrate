import { apiFetch } from "../api-client";
import type { Retrospective } from "../types/retrospective";

// a retrospectiva é exclusiva do dono do diário: sempre a do usuário logado

/** month no formato "2026-10" */
export function getMyRetrospective(month: string): Promise<Retrospective> {
  return apiFetch<Retrospective>(`/users/me/retrospective?month=${encodeURIComponent(month)}`);
}

/** meses com algum filme registrado, do mais recente para o mais antigo */
export function getMyRetrospectiveMonths(): Promise<string[]> {
  return apiFetch<string[]>("/users/me/retrospective/months");
}
