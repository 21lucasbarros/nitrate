/** Filmes já importados abrem direto; os outros passam pela rota que importa do TMDB. */
export function movieHref(movie: { id: number | null; tmdbId: number }): string {
  return movie.id !== null ? `/movies/${movie.id}` : `/movies/tmdb/${movie.tmdbId}`;
}
