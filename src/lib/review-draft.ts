// Rascunho do formulário de review. Fica no sessionStorage: sobrevive a fechar o modal, trocar de
// página e recarregar, mas some quando a aba (ou o navegador) é fechada.

export interface ReviewDraft {
  rating: number | null;
  liked: boolean;
  watchedOn: string;
  text: string;
  spoiler: boolean;
  rewatch: boolean;
}

const PREFIX = "nitrate:review-draft:";

/** um rascunho por review (edição) ou por filme (registro novo) */
export function reviewDraftKey(movieId: number | string, reviewId?: number | string | null): string {
  return PREFIX + (reviewId != null ? `review-${reviewId}` : `movie-${movieId}`);
}

export function loadReviewDraft(key: string): ReviewDraft | null {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as ReviewDraft) : null;
  } catch {
    return null;
  }
}

export function saveReviewDraft(key: string, draft: ReviewDraft): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(draft));
  } catch {
    // aba anônima do Safari / armazenamento cheio: segue sem rascunho
  }
}

export function clearReviewDraft(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // idem
  }
}

/** ao sair da conta, nenhum rascunho fica para quem usar o navegador depois */
export function clearAllReviewDrafts(): void {
  try {
    for (const key of Object.keys(sessionStorage)) {
      if (key.startsWith(PREFIX)) sessionStorage.removeItem(key);
    }
  } catch {
    // idem
  }
}
