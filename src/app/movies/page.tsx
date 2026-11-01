"use client";

import { useState } from "react";
import { CircleNotchIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import Header from "@/app/components/header";
import { MovieGrid } from "@/app/components/movie-grid";
import { useFetch } from "@/lib/hooks/use-fetch";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { getMovies, searchMovies } from "@/lib/services/movie-service";
import type { MovieSearchResult } from "@/types/movie";

const fetchMovies = () => getMovies();

const MIN_QUERY = 2;
const SEARCH_DEBOUNCE_MS = 400;

// filmes já importados abrem direto; os outros passam pela rota que importa do TMDB
function hrefFor(result: MovieSearchResult): string {
  return result.id !== null ? `/movies/${result.id}` : `/movies/tmdb/${result.tmdbId}`;
}

export default function MoviesPage() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query.trim(), SEARCH_DEBOUNCE_MS);
  const isSearching = query.trim().length >= MIN_QUERY;

  const catalog = useFetch(isSearching ? null : "all", fetchMovies);
  const search = useFetch(debouncedQuery.length >= MIN_QUERY ? debouncedQuery : null, searchMovies);
  // enquanto o debounce não "alcançou" o que foi digitado, também conta como carregando
  const searchPending = isSearching && (search.loading || debouncedQuery !== query.trim());

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Header />
      <main className="pt-28 sm:pt-32 pb-24 px-6 md:px-12 xl:px-24 max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-brand-orange">Catálogo</span>
            <h1 className="text-4xl sm:text-5xl font-medium tracking-tight mt-2">Filmes.</h1>
          </div>
          <div className="group relative w-full md:w-80">
            <MagnifyingGlassIcon
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-slate/40 group-focus-within:text-brand-blue pointer-events-none"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar qualquer filme"
              aria-label="Buscar filmes"
              className="w-full pl-11 pr-4 py-3 bg-transparent border border-brand-slate/20 rounded-full text-sm placeholder:text-brand-slate/40 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
            />
          </div>
        </div>

        {isSearching ? (
          <SearchResults
            query={query.trim()}
            results={search.data}
            pending={searchPending}
            failed={Boolean(search.error) && !searchPending}
          />
        ) : catalog.loading ? (
          <p className="text-brand-slate/50">Carregando filmes…</p>
        ) : catalog.error ? (
          <p className="text-red-500">Não foi possível carregar os filmes.</p>
        ) : (
          <MovieGrid items={(catalog.data ?? []).map((movie) => ({ movie }))} />
        )}
      </main>
    </div>
  );
}

function SearchResults({ query, results, pending, failed }: {
  query: string;
  results: MovieSearchResult[] | undefined;
  pending: boolean;
  failed: boolean;
}) {
  if (failed) {
    return <p className="text-red-500">Não foi possível buscar agora. Tente novamente em instantes.</p>;
  }

  if (pending && !results) {
    return (
      <p className="flex items-center gap-2 text-brand-slate/50">
        <CircleNotchIcon size={18} className="animate-spin" /> Buscando “{query}”…
      </p>
    );
  }

  if (!results || results.length === 0) {
    return pending ? null : <p className="text-brand-slate/60">Nenhum filme encontrado para “{query}”.</p>;
  }

  return (
    <div className={`transition-opacity ${pending ? "opacity-50" : "opacity-100"}`}>
      <p className="mb-8 text-sm text-brand-slate/60">
        {results.length} resultado{results.length > 1 ? "s" : ""} para “{query}”
      </p>
      <MovieGrid
        showTitles
        items={results.map((result) => ({
          movie: {
            id: result.id ?? `tmdb-${result.tmdbId}`,
            title: result.title,
            posterPath: result.posterPath,
            releaseYear: result.releaseYear,
          },
          href: hrefFor(result),
        }))}
      />
    </div>
  );
}
