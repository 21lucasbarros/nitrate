"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Header from "@/app/components/header";
import { MovieGrid } from "@/app/components/movie-grid";
import { Pagination } from "@/app/components/ui/pagination";
import { SectionHeading } from "@/app/components/ui/section-heading";
import { CatalogFilters } from "@/app/components/catalog-filters";
import { CatalogSearch, searchAllHref } from "@/app/components/catalog-search";
import { GuidedPickBanner } from "@/app/components/guided-pick";
import { cachedFetcher } from "@/lib/cache";
import { filtersFromUrl, filtersKey, filtersToUrl, hasFilters, type CatalogFilters as Filters } from "@/lib/catalog-filters";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { useFetch } from "@/lib/hooks/use-fetch";
import { getCommunityTrendingSeries, getSeriesCatalog, getSeriesGenres, searchSeries } from "@/lib/services/series-service";
import type { SeriesSearchResult } from "@/types/series";
import { seriesHref } from "@/utils/series-link";

// mesma estrutura de /movies (app/movies/page.tsx), com as séries no lugar dos filmes

const CATALOG_PER_PAGE = 48; // 6 linhas de 8
// chave "página|filtros da API": o useFetch busca de novo quando qualquer um dos dois muda
const fetchCatalog = (key: string) => {
  const [page, filters] = key.split("|");
  return getSeriesCatalog(Number(page) - 1, CATALOG_PER_PAGE, new URLSearchParams(filters));
};
const fetchGenres = cachedFetcher(() => getSeriesGenres(), 60 * 60 * 1000);
// o que está em alta na comunidade muda devagar: não precisa buscar de novo a cada visita
const fetchTrending = cachedFetcher(() => getCommunityTrendingSeries(), 5 * 60 * 1000);
const COMMUNITY_ROW = 6;

const MIN_QUERY = 2;
const SEARCH_DEBOUNCE_MS = 400;

export default function SeriesPage() {
  // useSearchParams precisa de Suspense para o build estático do Next
  return (
    <Suspense>
      <SeriesCatalog />
    </Suspense>
  );
}

function SeriesCatalog() {
  // a busca daqui procura só séries; filmes, pessoas e perfis ficam com a busca do header (/buscar)
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query.trim(), SEARCH_DEBOUNCE_MS);
  const isSearching = query.trim().length >= MIN_QUERY;

  // filtros do catálogo na URL: dá para mandar o link de "séries de comédia com nota 8+" para alguém
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const filters = filtersFromUrl(params);
  const filterKey = filtersKey(filters);
  const filtering = hasFilters(filters);
  // a página volta para a 1 sempre que os filtros mudam
  const [pageState, setPageState] = useState({ filterKey, page: 1 });
  const catalogPage = pageState.filterKey === filterKey ? pageState.page : 1;
  const setCatalogPage = (page: number) => setPageState({ filterKey, page });
  const catalog = useFetch(isSearching ? null : `${catalogPage}|${filterKey}`, fetchCatalog);
  const genres = useFetch("genres", fetchGenres);
  const trending = useFetch(isSearching || filtering ? null : "trending", fetchTrending);
  const setFilters = (next: Filters) => {
    const qs = filtersToUrl(next, new URLSearchParams(params));
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };
  const searchKey = debouncedQuery.length >= MIN_QUERY ? debouncedQuery : null;
  const search = useFetch(searchKey, searchSeries);
  // enquanto o debounce não "alcançou" o que foi digitado, também conta como carregando
  const searchPending = isSearching && (search.loading || debouncedQuery !== query.trim());

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Header />
      <main className="pt-28 sm:pt-32 pb-24 px-6 md:px-12 xl:px-24 max-w-[1400px] mx-auto">
        <div className="mb-12">
          <span className="text-xs font-bold tracking-[0.2em] uppercase text-brand-orange">Catálogo</span>
          <h1 className="text-4xl sm:text-5xl font-medium tracking-tight mt-2">Séries.</h1>
        </div>

        {/* filtrando ou buscando, o catálogo sobe para o topo: a fileira da comunidade não segue os filtros */}
        {!filtering && !isSearching && <GuidedPickBanner kind="series" genres={genres.data} className="mb-14" />}
        {!filtering && !isSearching && <CommunityRow title="Em alta na comunidade" series={trending.data} />}
        <section id="catalogo" className="scroll-mt-24">
          <SectionHeading
            title={isSearching ? `Séries com “${query.trim()}”` : filtering ? "Séries com esses filtros" : "Todo o catálogo"}
          />
          {/* a busca não combina com os filtros (a API do catálogo não procura por texto): eles somem enquanto se busca */}
          <CatalogFilters
            series
            genres={genres.data}
            filters={filters}
            onChange={setFilters}
            searching={isSearching}
            search={
              <CatalogSearch
                value={query}
                onChange={setQuery}
                pending={searchPending}
                label="Buscar no catálogo de séries"
                others="filmes, pessoas ou perfis"
              />
            }
          />
          {isSearching ? (
            <SearchResults
              query={query.trim()}
              results={search.data}
              pending={searchPending}
              failed={Boolean(search.error) && !searchPending}
            />
          ) : (
            <>
              {catalog.loading && !catalog.data ? (
                <p className="text-brand-slate/50">Carregando séries…</p>
              ) : catalog.error ? (
                <p className="text-red-500">Não foi possível carregar as séries.</p>
              ) : catalog.data?.items.length === 0 && filtering ? (
                <p className="py-12 text-center text-brand-slate">Nenhuma série do catálogo com esses filtros.</p>
              ) : (
                <div className={catalog.loading ? "opacity-50 transition-opacity" : ""}>
                  <MovieGrid items={toGridItems(catalog.data?.items ?? [])} />
                  {catalog.data && (
                    <Pagination
                      page={catalogPage}
                      totalPages={catalog.data.totalPages}
                      onChange={(p) => {
                        setCatalogPage(p);
                        document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                    />
                  )}
                </div>
              )}
            </>
          )}
        </section>
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

/** a fileira da comunidade; some se ainda não houver dados suficientes */
function CommunityRow({ title, series }: { title: string; series: SeriesSearchResult[] | undefined }) {
  if (!series || series.length === 0) return null;
  return (
    <section className="mb-14">
      <SectionHeading title={title} />
      <MovieGrid variant="compact" showTitles items={toGridItems(series.slice(0, COMMUNITY_ROW))} />
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
    return <p className="py-6 text-red-500">Não foi possível buscar agora. Tente novamente em instantes.</p>;
  }

  if (pending && !results) {
    return <p className="py-6 text-brand-slate/50">Buscando “{query}”…</p>;
  }

  if (!results || results.length === 0) {
    if (pending) return null;
    return (
      <p className="py-12 text-center text-brand-slate">
        Nenhuma série com “{query}”.{" "}
        <Link href={searchAllHref(query)} className="underline underline-offset-4 hover:text-foreground">
          Buscar em filmes, pessoas e perfis
        </Link>
      </p>
    );
  }

  return (
    <div className={`pt-4 transition-opacity ${pending ? "opacity-50" : "opacity-100"}`}>
      <p className="mb-8 text-sm text-brand-slate/60">
        {results.length} série{results.length > 1 ? "s" : ""}
      </p>
      <MovieGrid showTitles items={toGridItems(results)} />
    </div>
  );
}
