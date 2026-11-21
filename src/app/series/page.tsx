"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CircleNotchIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import Header from "@/app/components/header";
import { MovieGrid } from "@/app/components/movie-grid";
import { SectionHeading } from "@/app/components/ui/section-heading";
import { cachedFetcher } from "@/lib/cache";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { useFetch } from "@/lib/hooks/use-fetch";
import { getTopRatedSeries, getTrendingSeries, searchSeries } from "@/lib/services/series-service";
import type { SeriesSearchResult } from "@/types/series";
import { seriesHref } from "@/utils/series-link";

// as listas do TMDB mudam devagar: não precisa buscar de novo a cada visita
const fetchTrending = cachedFetcher(() => getTrendingSeries(), 10 * 60 * 1000);
const fetchTopRated = cachedFetcher(() => getTopRatedSeries(), 10 * 60 * 1000);

const MIN_QUERY = 2;
const SEARCH_DEBOUNCE_MS = 400;

export default function SeriesPage() {
  // useSearchParams precisa de Suspense para o build estático do Next
  return (
    <Suspense>
      <SeriesFromUrl />
    </Suspense>
  );
}

function SeriesFromUrl() {
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  return <SeriesCatalog key={q} initialQuery={q} />;
}

function SeriesCatalog({ initialQuery }: { initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebouncedValue(query.trim(), SEARCH_DEBOUNCE_MS);
  const isSearching = query.trim().length >= MIN_QUERY;

  const trending = useFetch(isSearching ? null : "trending", fetchTrending);
  const topRated = useFetch(isSearching ? null : "top", fetchTopRated);
  const searchKey = debouncedQuery.length >= MIN_QUERY ? debouncedQuery : null;
  const search = useFetch(searchKey, searchSeries);
  const searchPending = isSearching && (search.loading || debouncedQuery !== query.trim());

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Header />
      <main className="pt-28 sm:pt-32 pb-24 px-6 md:px-12 xl:px-24 max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-brand-orange">Catálogo</span>
            <h1 className="text-4xl sm:text-5xl font-medium tracking-tight mt-2">Séries.</h1>
          </div>
          <div className="group relative w-full md:w-80">
            <MagnifyingGlassIcon
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-slate/60 group-focus-within:text-brand-orange pointer-events-none"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar séries"
              aria-label="Buscar séries"
              className="w-full pl-11 pr-4 py-3 bg-surface border border-transparent rounded-md text-sm placeholder:text-brand-slate/60 focus:outline-none focus:border-foreground/20"
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
        ) : (
          <>
            <SeriesRow title="Em alta esta semana" series={trending.data} loading={trending.loading} />
            <SeriesRow title="Mais bem avaliadas" series={topRated.data} loading={topRated.loading} />
          </>
        )}
      </main>
    </div>
  );
}

function toGridItems(series: SeriesSearchResult[]) {
  return series.map((s) => ({
    movie: { id: s.id ?? `tmdb-${s.tmdbId}`, title: s.name, posterPath: s.posterPath, releaseYear: s.firstAirYear },
    href: seriesHref(s),
  }));
}

function SeriesRow({ title, series, loading }: { title: string; series: SeriesSearchResult[] | undefined; loading: boolean }) {
  if (!loading && (!series || series.length === 0)) return null;
  return (
    <section className="mb-14">
      <SectionHeading title={title} />
      {series ? (
        <MovieGrid showTitles items={toGridItems(series)} />
      ) : (
        <p className="text-brand-slate/50">Carregando séries…</p>
      )}
    </section>
  );
}

function SearchResults({ query, results, pending, failed }: {
  query: string;
  results: SeriesSearchResult[] | undefined;
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
    if (pending) return null;
    return <p className="text-brand-slate/60">Nenhuma série encontrada para “{query}”.</p>;
  }

  return (
    <div className={`transition-opacity ${pending ? "opacity-50" : "opacity-100"}`}>
      <p className="mb-8 text-sm text-brand-slate/60">
        {results.length} série{results.length > 1 ? "s" : ""} para “{query}”
      </p>
      <MovieGrid showTitles items={toGridItems(results)} />
    </div>
  );
}
