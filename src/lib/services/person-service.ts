import { apiFetch } from "../api-client";
import type { PersonDetail, PersonSummary } from "@/types/person";

export function searchPeople(query: string): Promise<PersonSummary[]> {
  return apiFetch<PersonSummary[]>(`/people/search?q=${encodeURIComponent(query)}`);
}

export function getPerson(tmdbId: number): Promise<PersonDetail> {
  return apiFetch<PersonDetail>(`/people/${tmdbId}`);
}
