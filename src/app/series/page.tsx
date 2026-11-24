"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CircleNotchIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import Header from "@/app/components/header";
import { MovieGrid } from "@/app/components/movie-grid";
import { PersonPhoto } from "@/app/components/ui/person-photo";
import { Pagination } from "@/app/components/ui/pagination";
import { SectionHeading } from "@/app/components/ui/section-heading";
import { UserList } from "@/app/components/user-list";
import { CatalogFilters } from "@/app/components/catalog-filters";
import { cachedFetcher } from "@/lib/cache";
import { filtersFromUrl, filtersKey, filtersToUrl, hasFilters, type CatalogFilters as Filters } from "@/lib/catalog-filters";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { useFetch } from "@/lib/hooks/use-fetch";
import { searchMovies } from "@/lib/services/movie-service";
import { searchPeople } from "@/lib/services/person-service";
import { getCommunityTrendingSeries, getSeriesCatalog, getSeriesGenres, searchSeries } from "@/lib/services/series-service";
import { searchUsers } from "@/lib/services/user-service";
import type { MovieSearchResult } from "@/types/movie";
import { departmentLabel, type PersonSummary } from "@/types/person";
import type { SeriesSearchResult } from "@/types/series";
import { movieHref } from "@/utils/movie-link";
import { personHref } from "@/utils/person-link";
import { seriesHref } from "@/utils/series-link";
import { matchesQuery } from "@/utils/text";

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
const MAX_PEOPLE = 6;
const MAX_MOVIES = 6;
const SEARCH_DEBOUNCE_MS = 400;

export default function SeriesPage() {
  // useSearchParams precisa de Suspense para o build estático do Next
  return (
    <Suspense>
      <SeriesFromUrl />
    </Suspense>
  );
}

/** ?q= vem da busca; a key recria a página quando a busca muda estando já em /series */
function SeriesFromUrl() {
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  // ?buscar=1: o campo já abre focado
  return <SeriesCatalog key={q} initialQuery={q} focusSearch={params.has("buscar")} />;
}

function SeriesCatalog({ initialQuery, focusSearch }: { initialQuery: string; focusSearch: boolean }) {
  const [query, setQuery] = useState(initialQuery);
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
  const genres = useFetch(isSearching ? null : "genres", fetchGenres);
  const trending = useFetch(isSearching || filtering ? null : "trending", fetchTrending);
  const setFilters = (next: Filters) => {
    // a busca (?q=) não vale mais: quem filtra está no catálogo
    const current = new URLSearchParams(params);
    current.delete("q");
    current.delete("buscar");
    const qs = filtersToUrl(next, current);
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };
  const searchKey = debouncedQuery.length >= MIN_QUERY ? debouncedQuery : null;
  const search = useFetch(searchKey, searchSeries);
  const people = useFetch(searchKey, searchPeople);
  const users = useFetch(searchKey, searchUsers);
  const movies = useFetch(searchKey, searchMovies);
  const movieResults = (movies.data ?? []).slice(0, MAX_MOVIES);
  // buscou um filme (ex.: "Duna") e nenhuma série bate tão bem: filmes antes das séries
  const moviesOnTop =
    Boolean(searchKey) &&
    movieResults.some((m) => matchesQuery(m.title, searchKey!)) &&
    !search.data?.some((s) => matchesQuery(s.name, searchKey!));
  // enquanto o debounce não "alcançou" o que foi digitado, também conta como carregando
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
              autoFocus={focusSearch}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar séries, filmes, pessoas e perfis"
              aria-label="Buscar séries, filmes, pessoas e perfis"
              className="w-full pl-11 pr-4 py-3 bg-surface border border-transparent rounded-md text-sm placeholder:text-brand-slate/60 focus:outline-none focus:border-foreground/20"
            />
          </div>
        </div>

        {isSearching && users.data && users.data.length > 0 && (
          <section className="mb-14">
            <SectionHeading title="Perfis no Nitrate" />
            <UserList users={users.data} />
          </section>
        )}

        {isSearching && people.data && people.data.length > 0 && (
          <PeopleResults people={people.data.slice(0, MAX_PEOPLE)} />
        )}

        {isSearching ? (
          <>
            {moviesOnTop && <MovieResults movies={movieResults} />}
            <SearchResults
              query={query.trim()}
              results={search.data}
              pending={searchPending}
              failed={Boolean(search.error) && !searchPending}
              othersFound={Boolean(people.data?.length || users.data?.length || movieResults.length)}
            />
            {!moviesOnTop && <MovieResults movies={movieResults} />}
          </>
        ) : (
          <>
            {/* filtrando, o catálogo sobe para o topo: a fileira da comunidade não segue os filtros */}
            {!filtering && <CommunityRow title="Em alta na comunidade" series={trending.data} />}
            <section>
              <SectionHeading title={filtering ? "Séries com esses filtros" : "Todo o catálogo"} />
              <CatalogFilters series genres={genres.data} filters={filters} onChange={setFilters} />
              {catalog.loading && !catalog.data ? (
                <p className="text-brand-slate/50">Carregando séries…</p>
              ) : catalog.error ? (
                <p className="text-red-500">Não foi possível carregar as séries.</p>
              ) : catalog.data?.items.length === 0 && filtering ? (
                <p className="py-12 text-center text-brand-slate">Nenhuma série do catálogo com esses filtros.</p>
              ) : (
                <div id="catalogo" className={`scroll-mt-24 ${catalog.loading ? "opacity-50 transition-opacity" : ""}`}>
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
            </section>
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

function SearchResults({ query, results, pending, failed, othersFound }: {
  query: string;
  results: SeriesSearchResult[] | undefined;
  pending: boolean;
  failed: boolean;
  othersFound: boolean; // achou filmes, pessoas ou perfis: sem séries não é "nada encontrado"
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
    if (pending || othersFound) return null;
    return <p className="text-brand-slate/60">Nada encontrado para “{query}”.</p>;
  }

  return (
    <div className={`transition-opacity ${pending ? "opacity-50" : "opacity-100"}`}>
      <p className="mb-8 text-sm text-brand-slate/60">
        {results.length} resultado{results.length > 1 ? "s" : ""} para “{query}”
      </p>
      <MovieGrid showTitles items={toGridItems(results)} />
    </div>
  );
}

function MovieResults({ movies }: { movies: MovieSearchResult[] }) {
  if (movies.length === 0) return null;
  return (
    <section className="my-14 first:mt-0">
      <SectionHeading title="Filmes" />
      <MovieGrid
        showTitles
        items={movies.map((m) => ({
          movie: { id: m.id ?? `tmdb-${m.tmdbId}`, title: m.title, posterPath: m.posterPath, releaseYear: m.releaseYear },
          href: movieHref(m),
        }))}
      />
    </section>
  );
}

function PeopleResults({ people }: { people: PersonSummary[] }) {
  return (
    <section className="mb-14">
      <SectionHeading title="Elenco e direção" />
      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-5 gap-y-8">
        {people.map((person) => (
          <li key={person.tmdbId}>
            <Link href={personHref(person)} className="group flex flex-col items-center text-center">
              <PersonPhoto
                name={person.name}
                profilePath={person.profilePath}
                sizes="120px"
                className="w-24 sm:w-28 group-hover:ring-brand-orange/50 transition-all"
              />
              <span className="mt-3 font-medium leading-tight group-hover:text-brand-orange transition-colors">
                {person.name}
              </span>
              <span className="mt-1 text-xs uppercase tracking-[0.12em] text-brand-slate/50">
                {departmentLabel(person.department)}
              </span>
              {person.knownFor.length > 0 && (
                <span className="mt-1.5 text-xs text-brand-slate/60 line-clamp-2">
                  {person.knownFor.join(" · ")}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
