import { apiFetch } from "../api-client";
import type { LetterboxdItem } from "../letterboxd";

// Espelha LetterboxdImportDTO.Status e ItemResult do backend
export type ImportStatus =
  | "CREATED"
  | "ALREADY_EXISTS"
  | "WATCHLISTED"
  | "ALREADY_IN_WATCHLIST"
  | "ALREADY_WATCHED"
  | "NOT_FOUND"
  | "ERROR";

export interface ImportResult {
  name: string;
  year: number | null;
  status: ImportStatus;
  movieId: number | null;
  title: string | null;
  detail: string | null;
}

/** um lote por chamada; o backend aceita até 25 filmes */
export function importLetterboxdBatch(items: LetterboxdItem[]): Promise<ImportResult[]> {
  return apiFetch<ImportResult[]>("/import/letterboxd", {
    method: "POST",
    body: JSON.stringify({ items }),
  });
}
