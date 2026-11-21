/** Página da série: /series/breaking-bad-2008. Sem slug (não deveria acontecer), passa pelo TMDB. */
export function seriesHref(series: { slug?: string | null; tmdbId: number }): string {
  return series.slug ? `/series/${series.slug}` : `/series/tmdb/${series.tmdbId}`;
}

/** Página de um registro de série: /u/fulano/series/12 (a imagem dos Stories fica em .../story) */
export function seriesReviewHref(review: { id: number; user: { username: string } }): string {
  return `/u/${review.user.username}/series/${review.id}`;
}
