"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Header from "@/app/components/header";
import { MovieGrid } from "@/app/components/movie-grid";
import { useFetch } from "@/lib/hooks/use-fetch";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { getCatalog, getMovieGenres, getTrendingMovies, searchMovies } from "@/lib/services/movie-service";
import { Pagination } from "@/app/components/ui/pagination";
import { cachedFetcher } from "@/lib/cache";
import { CatalogFilters } from "@/app/components/catalog-filters";
import { CatalogSearch, searchAllHref } from "@/app/components/catalog-search";
import { GuidedPickBanner } from "@/app/components/guided-pick";
import { filtersFromUrl, filtersKey, filtersToUrl, hasFilters, type CatalogFilters as Filters } from "@/lib/catalog-filters";
import { SectionHeading } from "@/app/components/ui/section-heading";
import type { Movie, MovieSearchResult } from "@/types/movie";
import { movieHref } from "@/utils/movie-link";

const CATALOG_PER_PAGE = 48; // 6 linhas de 8
// chave "página|filtros da API": o useFetch busca de novo quando qualquer um dos dois muda
const fetchCatalog = (key: string) => {
  const [page, filters] = key.split("|");
  return getCatalog(Number(page) - 1, CATALOG_PER_PAGE, new URLSearchParams(filters));
};
const fetchGenres = cachedFetcher(() => getMovieGenres(), 60 * 60 * 1000);
// o que está em alta na comunidade muda devagar: não precisa buscar de novo a cada visita
const fetchTrending = cachedFetcher(() => getTrendingMovies(), 5 * 60 * 1000);
const COMMUNITY_ROW = 6;

const MIN_QUERY = 2;
const SEARCH_DEBOUNCE_MS = 400;

export default function MoviesPage() {
  // useSearchParams precisa de Suspense para o build estático do Next
  return (
    <Suspense>
      <Movies />
    </Suspense>
  );
}

function Movies() {
  // a busca daqui procura só filmes; séries, pessoas e perfis ficam com a busca do header (/buscar)
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query.trim(), SEARCH_DEBOUNCE_MS);
  const isSearching = query.trim().length >= MIN_QUERY;

  // filtros do catálogo na URL: dá para mandar o link de "filmes de terror com nota 7+" para alguém
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
  const search = useFetch(searchKey, searchMovies);
  // enquanto o debounce não "alcançou" o que foi digitado, também conta como carregando
  const searchPending = isSearching && (search.loading || debouncedQuery !== query.trim());

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Header />
      <main className="pt-28 sm:pt-32 pb-24 px-6 md:px-12 xl:px-24 max-w-[1400px] mx-auto">
        <div className="mb-12">
          <span className="text-xs font-bold tracking-[0.2em] uppercase text-brand-orange">Catálogo</span>
          <h1 className="text-4xl sm:text-5xl font-medium tracking-tight mt-2">Filmes.</h1>
        </div>

        {/* filtrando ou buscando, o catálogo sobe para o topo: a fileira da comunidade não segue os filtros.
            "Mais bem avaliados pela comunidade" virou uma ordem do catálogo */}
        {!filtering && !isSearching && <GuidedPickBanner kind="movies" genres={genres.data} className="mb-14" />}
        {!filtering && !isSearching && <CommunityRow title="Em alta na comunidade" movies={trending.data} />}
        <section id="catalogo" className="scroll-mt-24">
          <SectionHeading
            title={isSearching ? `Filmes com “${query.trim()}”` : filtering ? "Filmes com esses filtros" : "Todo o catálogo"}
          />
          <CatalogSearch
            value={query}
            onChange={setQuery}
            pending={searchPending}
            label="Buscar no catálogo de filmes"
            others="séries, pessoas ou perfis"
          />
          {/* a busca não combina com os filtros (a API do catálogo não procura por texto): some enquanto se busca */}
          {isSearching ? (
            <SearchResults
              query={query.trim()}
              results={search.data}
              pending={searchPending}
              failed={Boolean(search.error) && !searchPending}
            />
          ) : (
            <>
              <CatalogFilters genres={genres.data} filters={filters} onChange={setFilters} />
              {catalog.loading && !catalog.data ? (
                <p className="text-brand-slate/50">Carregando filmes…</p>
              ) : catalog.error ? (
                <p className="text-red-500">Não foi possível carregar os filmes.</p>
              ) : catalog.data?.items.length === 0 && filtering ? (
                <p className="py-12 text-center text-brand-slate">Nenhum filme do catálogo com esses filtros.</p>
              ) : (
                <div className={catalog.loading ? "opacity-50 transition-opacity" : ""}>
                  <MovieGrid items={(catalog.data?.items ?? []).map((movie) => ({ movie }))} />
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

/** uma fileira da curadoria da comunidade; some se ainda não houver dados suficientes */
function CommunityRow({ title, movies }: { title: string; movies: Movie[] | undefined }) {
  if (!movies || movies.length === 0) return null;
  return (
    <section className="mb-14">
      <SectionHeading title={title} />
      <MovieGrid variant="compact" showTitles items={movies.slice(0, COMMUNITY_ROW).map((movie) => ({ movie }))} />
    </section>
  );
}

function SearchResults({ query, results, pending, failed }: {
  query: string;
  results: MovieSearchResult[] | undefined;
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
        Nenhum filme com “{query}”.{" "}
        <Link href={searchAllHref(query)} className="underline underline-offset-4 hover:text-foreground">
          Buscar em séries, pessoas e perfis
        </Link>
      </p>
    );
  }

  return (
    <div className={`pt-4 transition-opacity ${pending ? "opacity-50" : "opacity-100"}`}>
      <p className="mb-8 text-sm text-brand-slate/60">
        {results.length} filme{results.length > 1 ? "s" : ""}
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
          href: movieHref(result),
        }))}
      />
    </div>
  );
}
