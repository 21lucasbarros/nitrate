/** Página da pessoa: /person/ben-stiller (ou /person/{id do TMDB}, que redireciona, se faltar o slug). */
export function personHref(person: { tmdbId: number; slug?: string | null }): string {
  return `/person/${person.slug ?? person.tmdbId}`;
}
