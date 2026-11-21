import { apiFetch } from "../api-client";
import type { TasteAnswers, TasteCandidateGroup, TasteProfile, TasteQuiz } from "../types/taste";

export function getTasteQuiz(): Promise<TasteQuiz> {
  return apiFetch<TasteQuiz>("/taste/quiz");
}

/** filmes do acervo para marcar os que já viu, separados pela resposta que os trouxe */
export function getTasteCandidates(answers: TasteAnswers): Promise<TasteCandidateGroup[]> {
  return apiFetch<TasteCandidateGroup[]>("/taste/candidates", { method: "POST", body: JSON.stringify(answers) });
}

export function getMyTaste(): Promise<TasteProfile> {
  return apiFetch<TasteProfile>("/users/me/taste");
}

/** substitui as respostas inteiras; o backend refaz as recomendações na próxima visita */
export function saveMyTaste(answers: TasteAnswers): Promise<TasteProfile> {
  return apiFetch<TasteProfile>("/users/me/taste", { method: "PUT", body: JSON.stringify(answers) });
}
