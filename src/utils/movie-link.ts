/** Página do filme: /film/superman-2025 (ou /movies/{id}, que redireciona, se faltar o slug). */
export function filmHref(movie: { id: number | string; slug?: string | null }): string {
  return movie.slug ? `/film/${movie.slug}` : `/movies/${movie.id}`;
}

/** Filmes já importados abrem direto; os outros passam pela rota que importa do TMDB. */
export function movieHref(movie: { id: number | null; slug?: string | null; tmdbId: number }): string {
  return movie.id !== null ? filmHref({ id: movie.id, slug: movie.slug }) : `/movies/tmdb/${movie.tmdbId}`;
}
