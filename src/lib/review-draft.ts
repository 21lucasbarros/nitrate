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

/** registro de série: o rascunho guarda também o que foi assistido */
export interface SeriesReviewDraft extends ReviewDraft {
  seasonNumber: number | null;
  episodeNumber: number | null;
}

const PREFIX = "nitrate:review-draft:";

/** um rascunho por review (edição) ou por filme (registro novo) */
export function reviewDraftKey(movieId: number | string, reviewId?: number | string | null): string {
  return PREFIX + (reviewId != null ? `review-${reviewId}` : `movie-${movieId}`);
}

/**
 * Registro de série: um rascunho por registro (edição), por convite ou por série e pelo que estava
 * escolhido ao abrir (o botão de um episódio não recupera o rascunho de outro)
 */
export function seriesReviewDraftKey(
  seriesId: number | string,
  { reviewId, inviteId, season, episode }: { reviewId?: number | null; inviteId?: number | null; season: number | null; episode: number | null },
): string {
  if (reviewId != null) return `${PREFIX}series-review-${reviewId}`;
  if (inviteId != null) return `${PREFIX}series-invite-${inviteId}`;
  return `${PREFIX}series-${seriesId}-${season ?? "serie"}-${episode ?? "temporada"}`;
}

export function loadReviewDraft<T extends ReviewDraft = ReviewDraft>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function saveReviewDraft(key: string, draft: ReviewDraft | SeriesReviewDraft): void {
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
