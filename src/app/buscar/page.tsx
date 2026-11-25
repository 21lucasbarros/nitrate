"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CircleNotchIcon, MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import Header from "@/app/components/header";
import { MovieGrid } from "@/app/components/movie-grid";
import { PersonPhoto } from "@/app/components/ui/person-photo";
import { SectionHeading } from "@/app/components/ui/section-heading";
import { UserList } from "@/app/components/user-list";
import { useFetch } from "@/lib/hooks/use-fetch";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { searchMovies } from "@/lib/services/movie-service";
import { getPerson, searchPeople } from "@/lib/services/person-service";
import { searchSeries } from "@/lib/services/series-service";
import { searchUsers } from "@/lib/services/user-service";
import type { MovieSearchResult } from "@/types/movie";
import type { SeriesSearchResult } from "@/types/series";
import { departmentLabel, type PersonCredit, type PersonDetail, type PersonSummary } from "@/types/person";
import { movieHref } from "@/utils/movie-link";
import { seriesHref } from "@/utils/series-link";
import { personHref } from "@/utils/person-link";
import { matchesQuery } from "@/utils/text";

// a busca completa: filmes, séries, pessoas e perfis (o Enter da busca do header e a lupa do celular trazem para cá);
// a busca de /movies e /series procura só no próprio catálogo

const MIN_QUERY = 2;
const MAX_PEOPLE = 6;
const MAX_SERIES = 6;
const SEARCH_DEBOUNCE_MS = 400;

export default function SearchPage() {
  // useSearchParams precisa de Suspense para o build estático do Next
  return (
    <Suspense>
      <SearchFromUrl />
    </Suspense>
  );
}

/** ?q= vem da busca do header; a key recria a página quando a busca muda estando já em /buscar */
function SearchFromUrl() {
  const q = useSearchParams().get("q") ?? "";
  return <Search key={q} initialQuery={q} />;
}

function Search({ initialQuery }: { initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebouncedValue(query.trim(), SEARCH_DEBOUNCE_MS);
  const isSearching = query.trim().length >= MIN_QUERY;

  const searchKey = debouncedQuery.length >= MIN_QUERY ? debouncedQuery : null;
  const search = useFetch(searchKey, searchMovies);
  const people = useFetch(searchKey, searchPeople);
  const users = useFetch(searchKey, searchUsers);
  const series = useFetch(searchKey, searchSeries);
  // buscou pelo nome de alguém: mostra também os filmes dessa pessoa
  const matchedPerson = searchKey ? people.data?.find((p) => matchesQuery(p.name, searchKey)) : undefined;
  const personDetail = useFetch(matchedPerson?.tmdbId ?? null, getPerson);
  const seriesResults = (series.data ?? []).slice(0, MAX_SERIES);
  // buscou uma série (ex.: "Blade Runner 2099") e nenhum filme bate tão bem: séries antes dos filmes
  const seriesOnTop =
    Boolean(searchKey) &&
    seriesResults.some((s) => matchesQuery(s.name, searchKey!)) &&
    !search.data?.some((m) => matchesQuery(m.title, searchKey!));
  // enquanto o debounce não "alcançou" o que foi digitado, também conta como carregando
  const searchPending = isSearching && (search.loading || debouncedQuery !== query.trim());

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Header />
      <main className="pt-28 sm:pt-32 pb-24 px-6 md:px-12 xl:px-24 max-w-[1400px] mx-auto">
        <div className="mb-12">
          <span className="text-xs font-bold tracking-[0.2em] uppercase text-brand-orange">Busca</span>
          <h1 className="text-4xl sm:text-5xl font-medium tracking-tight mt-2">Buscar.</h1>
          <div className="group relative mt-8 w-full max-w-2xl">
            {searchPending ? (
              <CircleNotchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-slate animate-spin pointer-events-none" />
            ) : (
              <MagnifyingGlassIcon
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-slate/60 group-focus-within:text-brand-orange pointer-events-none"
              />
            )}
            <input
              autoFocus
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setQuery("")}
              placeholder="Filmes, séries, pessoas e perfis"
              aria-label="Buscar filmes, séries, pessoas e perfis"
              className="w-full h-12 pl-11 pr-10 rounded-md bg-surface ring-1 ring-inset ring-foreground/10 placeholder:text-brand-slate/60 focus:outline-none focus:ring-foreground/25 [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Limpar busca"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-slate hover:text-foreground"
              >
                <XIcon size={16} />
              </button>
            )}
          </div>
        </div>

        {!isSearching ? (
          <p className="text-brand-slate/60">
            Digite o nome de um filme, uma série, alguém do elenco ou da direção, ou um perfil do Nitrate.
          </p>
        ) : (
          <>
            {users.data && users.data.length > 0 && (
              <section className="mb-14">
                <SectionHeading title="Perfis no Nitrate" />
                <UserList users={users.data} />
              </section>
            )}

            {people.data && people.data.length > 0 && <PeopleResults people={people.data.slice(0, MAX_PEOPLE)} />}

            {personDetail.data && <PersonFilms person={personDetail.data} />}

            {seriesOnTop && <SeriesResults series={seriesResults} />}
            <SearchResults
              query={query.trim()}
              results={search.data}
              pending={searchPending}
              failed={Boolean(search.error) && !searchPending}
              othersFound={Boolean(people.data?.length || users.data?.length || seriesResults.length)}
              hideWhenEmpty={Boolean(personDetail.data)}
            />
            {!seriesOnTop && <SeriesResults series={seriesResults} />}
          </>
        )}
      </main>
    </div>
  );
}

function SearchResults({ query, results, pending, failed, othersFound, hideWhenEmpty }: {
  query: string;
  results: MovieSearchResult[] | undefined;
  pending: boolean;
  failed: boolean;
  othersFound: boolean; // achou pessoas ou perfis: sem filmes não é "nada encontrado"
  hideWhenEmpty: boolean; // já mostra os filmes da pessoa buscada
}) {
  if (hideWhenEmpty && !results?.length) return null;

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
    <section className={`mb-14 transition-opacity ${pending ? "opacity-50" : "opacity-100"}`}>
      <SectionHeading title={hideWhenEmpty ? "Filmes com esse título" : "Filmes"} count={results.length} />
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
    </section>
  );
}

function SeriesResults({ series }: { series: SeriesSearchResult[] }) {
  if (series.length === 0) return null;
  return (
    <section className="mb-14">
      <SectionHeading title="Séries" />
      <MovieGrid
        showTitles
        items={series.map((s) => ({
          movie: { id: s.id ?? `tmdb-${s.tmdbId}`, title: s.name, posterPath: s.posterPath, releaseYear: s.firstAirYear },
          href: seriesHref(s),
        }))}
      />
    </section>
  );
}

/** filmografia da pessoa buscada: o que dirigiu e onde atuou, na ordem que faz sentido para ela */
function PersonFilms({ person }: { person: PersonDetail }) {
  // mesmo critério da página da pessoa: o departamento do TMDB nem sempre ajuda
  const directsFirst =
    person.department === "Directing" || (person.department !== "Acting" && person.directed.length > 0);
  const sections = [
    { title: `Dirigidos por ${person.name}`, credits: person.directed },
    { title: `Filmes com ${person.name}`, credits: person.acted },
  ];
  if (!directsFirst) sections.reverse();

  return (
    <>
      {sections
        .filter((s) => s.credits.length > 0)
        .map((s) => (
          <section key={s.title} className="mb-14">
            <SectionHeading title={s.title} count={s.credits.length} />
            <MovieGrid showTitles items={s.credits.map(creditItem)} />
          </section>
        ))}
    </>
  );
}

function creditItem(credit: PersonCredit) {
  return {
    movie: {
      id: credit.id ?? `tmdb-${credit.tmdbId}`,
      title: credit.title,
      posterPath: credit.posterPath,
      releaseYear: credit.releaseYear,
    },
    href: movieHref(credit),
  };
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
