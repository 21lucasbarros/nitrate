"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRightIcon, MagnifyingGlassIcon, PencilSimpleIcon, StarIcon } from "@phosphor-icons/react";
import Header from "@/app/components/header";
import { openHeaderSearch } from "@/app/components/header-search";
import { MovieGrid, type MovieGridItem } from "@/app/components/movie-grid";
import { Poster } from "@/app/components/ui/poster";
import { PersonPhoto } from "@/app/components/ui/person-photo";
import { SectionHeading } from "@/app/components/ui/section-heading";
import { UserList } from "@/app/components/user-list";
import { useFetch } from "@/lib/hooks/use-fetch";
import { useIsApple } from "@/lib/hooks/use-is-apple";
import { searchMovies } from "@/lib/services/movie-service";
import { getPerson, searchPeople } from "@/lib/services/person-service";
import { searchSeries } from "@/lib/services/series-service";
import { searchUsers } from "@/lib/services/user-service";
import type { UserSummary } from "@/lib/types/user";
import type { MovieSearchResult } from "@/types/movie";
import type { SeriesSearchResult } from "@/types/series";
import { departmentLabel, type PersonCredit, type PersonDetail, type PersonSummary } from "@/types/person";
import { movieHref } from "@/utils/movie-link";
import { seriesHref } from "@/utils/series-link";
import { personHref } from "@/utils/person-link";
import { matchesQuery, normalizeText } from "@/utils/text";

// a busca completa: filmes, séries, pessoas e perfis. O campo é o do header (o Enter de lá traz para cá com ?q=);
// a busca de /movies e /series procura só no próprio catálogo

const MIN_QUERY = 2;
// em "Tudo", uma fileira de cada; as abas mostram tudo
const ROW = { titles: 8, people: 6, users: 3 };

type Tab = "tudo" | "filmes" | "series" | "pessoas" | "perfis";

export default function SearchPage() {
  // useSearchParams precisa de Suspense para o build estático do Next
  return (
    <Suspense>
      <SearchFromUrl />
    </Suspense>
  );
}

/** a key recria a página (e volta para a aba Tudo) quando chega uma busca nova */
function SearchFromUrl() {
  const q = (useSearchParams().get("q") ?? "").trim();
  return <Search key={q} query={q} />;
}

function Search({ query }: { query: string }) {
  const [tab, setTab] = useState<Tab>("tudo");
  const searchKey = query.length >= MIN_QUERY ? query : null;
  const movies = useFetch(searchKey, searchMovies);
  const series = useFetch(searchKey, searchSeries);
  const people = useFetch(searchKey, searchPeople);
  const users = useFetch(searchKey, searchUsers);
  // buscou pelo nome de alguém: mostra também os filmes dessa pessoa
  const matchedPerson = searchKey ? people.data?.find((p) => matchesQuery(p.name, searchKey)) : undefined;
  const personDetail = useFetch(matchedPerson?.tmdbId ?? null, getPerson);

  // chegou sem nada buscado (ex.: link direto): abre o campo do header
  useEffect(() => {
    if (!searchKey) openHeaderSearch();
  }, [searchKey]);

  const sources = [movies, series, people, users];
  const loading = sources.some((s) => s.loading && !s.data);
  const movieList = movies.data ?? [];
  const seriesList = series.data ?? [];
  const peopleList = people.data ?? [];
  const userList = users.data ?? [];
  const total = movieList.length + seriesList.length + peopleList.length + userList.length;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Header />
      <main className="pt-28 sm:pt-32 pb-24 px-6 md:px-12 xl:px-24 max-w-[1400px] mx-auto">
        {!searchKey ? (
          <StartState />
        ) : (
          <>
            <div className="mb-10">
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-brand-orange">Busca</span>
              <h1 className="mt-2 text-4xl sm:text-5xl font-medium tracking-tight break-words">
                <span className="text-brand-slate/50">“</span>
                {query}
                <span className="text-brand-slate/50">”</span>
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-brand-slate">
                <span>
                  {loading
                    ? "Buscando…"
                    : total > 0
                      ? summary([
                          [movieList.length, "filme", "filmes"],
                          [seriesList.length, "série", "séries"],
                          [peopleList.length, "pessoa", "pessoas"],
                          [userList.length, "perfil", "perfis"],
                        ])
                      : null}
                </span>
                {!loading && total > 0 && (
                  <button
                    type="button"
                    onClick={() => openHeaderSearch(query)}
                    className="inline-flex items-center gap-1.5 text-brand-slate hover:text-foreground transition-colors"
                  >
                    <PencilSimpleIcon size={14} /> Editar busca
                  </button>
                )}
              </div>
            </div>

            {loading && total === 0 ? (
              <ResultsSkeleton />
            ) : total === 0 ? (
              <NothingFound query={query} failed={sources.every((s) => s.error)} />
            ) : (
              <>
                <Tabs
                  active={tab}
                  onChange={setTab}
                  counts={{ filmes: movieList.length, series: seriesList.length, pessoas: peopleList.length, perfis: userList.length }}
                />
                {tab === "tudo" && (
                  <AllResults
                    query={query}
                    movies={movieList}
                    series={seriesList}
                    people={peopleList}
                    users={userList}
                    personDetail={personDetail.data}
                    onShowAll={setTab}
                  />
                )}
                {tab === "filmes" && <MovieGrid showTitles items={movieList.map(movieItem)} />}
                {tab === "series" && <MovieGrid showTitles items={seriesList.map(seriesItem)} />}
                {tab === "pessoas" && <PeopleGrid people={peopleList} />}
                {tab === "perfis" && <UserList users={userList} />}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

/** "4 filmes · 1 série · 2 pessoas", sem os tipos que não vieram */
function summary(parts: [number, string, string][]) {
  return parts
    .filter(([n]) => n > 0)
    .map(([n, one, many]) => `${n} ${n === 1 ? one : many}`)
    .join(" · ");
}

const TAB_LABELS: Record<Exclude<Tab, "tudo">, string> = {
  filmes: "Filmes",
  series: "Séries",
  pessoas: "Pessoas",
  perfis: "Perfis",
};

function Tabs({ active, onChange, counts }: {
  active: Tab;
  onChange: (tab: Tab) => void;
  counts: Record<Exclude<Tab, "tudo">, number>;
}) {
  // só os tipos que trouxeram alguma coisa; com um tipo só, as abas não ajudam
  const tabs = (Object.keys(TAB_LABELS) as Exclude<Tab, "tudo">[]).filter((t) => counts[t] > 0);
  if (tabs.length < 2) return null;
  const tab = (id: Tab, label: string, count?: number) => (
    <button
      key={id}
      type="button"
      role="tab"
      aria-selected={active === id}
      onClick={() => onChange(id)}
      className={`shrink-0 pb-4 text-sm font-medium border-b-2 transition-colors ${active === id ? "border-brand-orange text-foreground" : "border-transparent text-brand-slate hover:text-foreground"}`}
    >
      {label}
      {count !== undefined && <span className="ml-1.5 text-xs font-normal text-brand-slate/60 tabular-nums">{count}</span>}
    </button>
  );
  return (
    <div className="mb-10 border-b border-foreground/10">
      <div role="tablist" aria-label="Tipo de resultado" className="flex gap-6 -mb-px overflow-x-auto">
        {tab("tudo", "Tudo")}
        {tabs.map((t) => tab(t, TAB_LABELS[t], counts[t]))}
      </div>
    </div>
  );
}

type Best =
  | { kind: "movie"; item: MovieSearchResult }
  | { kind: "series"; item: SeriesSearchResult }
  | { kind: "person"; item: PersonSummary };

/**
 * o melhor resultado: primeiro quem tem exatamente o nome buscado ("ben stiller" é a pessoa, não
 * "Ben Stiller's 2nd All-Star..."), depois quem começa com ele, depois o primeiro de cada busca
 */
function pickBest(query: string, movies: MovieSearchResult[], series: SeriesSearchResult[], people: PersonSummary[]): Best | null {
  const wanted = normalizeText(query);
  const tiers = [
    (text: string) => normalizeText(text) === wanted,
    (text: string) => matchesQuery(text, query),
  ];
  for (const matches of tiers) {
    const movie = movies.find((m) => matches(m.title));
    if (movie) return { kind: "movie", item: movie };
    const show = series.find((s) => matches(s.name));
    if (show) return { kind: "series", item: show };
    const person = people.find((p) => matches(p.name));
    if (person) return { kind: "person", item: person };
  }
  if (movies[0]) return { kind: "movie", item: movies[0] };
  if (series[0]) return { kind: "series", item: series[0] };
  return people[0] ? { kind: "person", item: people[0] } : null;
}

function AllResults({ query, movies, series, people, users, personDetail, onShowAll }: {
  query: string;
  movies: MovieSearchResult[];
  series: SeriesSearchResult[];
  people: PersonSummary[];
  users: UserSummary[];
  personDetail: PersonDetail | undefined;
  onShowAll: (tab: Tab) => void;
}) {
  const best = pickBest(query, movies, series, people);
  // o destaque não se repete na fileira de baixo
  const otherMovies = best?.kind === "movie" ? movies.filter((m) => m !== best.item) : movies;
  const otherSeries = best?.kind === "series" ? series.filter((s) => s !== best.item) : series;
  const otherPeople = best?.kind === "person" ? people.filter((p) => p !== best.item) : people;
  // buscou uma série e nenhum filme bate tão bem: séries antes dos filmes
  const seriesFirst = best?.kind === "series";

  const showAll = (tab: Tab, shown: number, total: number) =>
    total > shown ? (
      <button type="button" onClick={() => onShowAll(tab)} className="whitespace-nowrap text-sm text-brand-slate hover:text-foreground transition-colors">
        Ver todos
      </button>
    ) : undefined;

  const moviesRow = otherMovies.length > 0 && (
    <section key="filmes" className="mb-14">
      <SectionHeading title={best?.kind === "movie" ? "Outros filmes" : "Filmes"} action={showAll("filmes", ROW.titles, otherMovies.length)} />
      <MovieGrid showTitles items={otherMovies.slice(0, ROW.titles).map(movieItem)} />
    </section>
  );
  const seriesRow = otherSeries.length > 0 && (
    <section key="series" className="mb-14">
      <SectionHeading title={best?.kind === "series" ? "Outras séries" : "Séries"} action={showAll("series", ROW.titles, otherSeries.length)} />
      <MovieGrid showTitles items={otherSeries.slice(0, ROW.titles).map(seriesItem)} />
    </section>
  );

  return (
    <>
      {best && <BestResult best={best} />}

      {best?.kind === "person" && personDetail && <PersonFilms person={personDetail} />}

      {seriesFirst ? [seriesRow, moviesRow] : [moviesRow, seriesRow]}

      {otherPeople.length > 0 && (
        <section className="mb-14">
          <SectionHeading title="Elenco e direção" action={showAll("pessoas", ROW.people, otherPeople.length)} />
          <PeopleGrid people={otherPeople.slice(0, ROW.people)} />
        </section>
      )}

      {users.length > 0 && (
        <section className="mb-14">
          <SectionHeading title="Perfis no Nitrate" action={showAll("perfis", ROW.users, users.length)} />
          <UserList users={users.slice(0, ROW.users)} />
        </section>
      )}
    </>
  );
}

/** o card do melhor resultado: pôster (ou foto), o que é, nota, sinopse e o botão para abrir */
function BestResult({ best }: { best: Best }) {
  if (best.kind === "person") {
    const person = best.item;
    return (
      <section className="mb-14">
        <SectionHeading title="Melhor resultado" />
        <Link
          href={personHref(person)}
          className="group flex items-center gap-5 sm:gap-6 p-5 sm:p-6 rounded-lg bg-surface ring-1 ring-foreground/[0.06] hover:ring-foreground/15 transition-colors"
        >
          <PersonPhoto name={person.name} profilePath={person.profilePath} sizes="128px" className="w-24 sm:w-32 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.14em] text-brand-slate/70">{departmentLabel(person.department) ?? "Pessoa"}</p>
            <p className="mt-1.5 font-serif text-2xl sm:text-3xl font-semibold leading-tight group-hover:text-brand-orange transition-colors">
              {person.name}
            </p>
            {person.knownFor.length > 0 && (
              <p className="mt-2 text-sm text-brand-slate line-clamp-2">Conhecido por {person.knownFor.join(", ")}</p>
            )}
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
              Ver a página <ArrowRightIcon size={14} weight="bold" className="group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </Link>
      </section>
    );
  }

  const isSeries = best.kind === "series";
  const title = isSeries ? best.item.name : best.item.title;
  const year = isSeries ? best.item.firstAirYear : best.item.releaseYear;
  const href = isSeries ? seriesHref(best.item) : movieHref(best.item);
  const { rating, overview, posterPath } = best.item;

  return (
    <section className="mb-14">
      <SectionHeading title="Melhor resultado" />
      <div className="flex gap-5 sm:gap-8 p-5 sm:p-6 rounded-lg bg-surface ring-1 ring-foreground/[0.06]">
        <Link href={href} className="group w-28 sm:w-40 shrink-0">
          <Poster title={title} posterPath={posterPath} size="w342" sizes="160px" className="shadow-[0_12px_40px_rgba(0,0,0,0.5)]" />
        </Link>
        <div className="flex min-w-0 flex-1 flex-col py-1">
          <p className="flex flex-wrap items-center gap-x-2 text-xs text-brand-slate">
            <span className="uppercase tracking-[0.14em] text-brand-slate/70">{isSeries ? "Série" : "Filme"}</span>
            {year && (
              <>
                <span aria-hidden="true" className="text-brand-slate/40">·</span>
                <span className="tabular-nums">{year}</span>
              </>
            )}
            {rating ? (
              <>
                <span aria-hidden="true" className="text-brand-slate/40">·</span>
                <span className="inline-flex items-center gap-1 text-foreground tabular-nums">
                  <StarIcon size={12} weight="fill" className="text-brand-orange" /> {rating.toFixed(1)}
                </span>
              </>
            ) : null}
          </p>
          <Link href={href} className="mt-1.5 font-serif text-2xl sm:text-3xl font-semibold leading-tight hover:text-brand-orange transition-colors line-clamp-2">
            {title}
          </Link>
          {overview && <p className="mt-3 text-sm leading-relaxed text-brand-slate line-clamp-2 sm:line-clamp-3 max-w-3xl">{overview}</p>}
          <Link
            href={href}
            className="group mt-auto pt-5 self-start inline-flex items-center gap-2"
          >
            <span className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-brand-btn text-brand-btn-text text-sm font-semibold group-hover:bg-brand-btn/90 transition-colors">
              {isSeries ? "Ver a série" : "Ver o filme"}
              <ArrowRightIcon size={14} weight="bold" className="group-hover:translate-x-0.5 transition-transform" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}

function movieItem(result: MovieSearchResult): MovieGridItem {
  return {
    movie: { id: result.id ?? `tmdb-${result.tmdbId}`, title: result.title, posterPath: result.posterPath, releaseYear: result.releaseYear },
    href: movieHref(result),
  };
}

function seriesItem(s: SeriesSearchResult): MovieGridItem {
  return {
    movie: { id: s.id ?? `tmdb-${s.tmdbId}`, title: s.name, posterPath: s.posterPath, releaseYear: s.firstAirYear },
    href: seriesHref(s),
  };
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
            <SectionHeading title={s.title} count={s.credits.length} href={personHref(person)} linkLabel="Ver a filmografia" />
            <MovieGrid showTitles items={s.credits.slice(0, ROW.titles).map(creditItem)} />
          </section>
        ))}
    </>
  );
}

function creditItem(credit: PersonCredit): MovieGridItem {
  return {
    movie: { id: credit.id ?? `tmdb-${credit.tmdbId}`, title: credit.title, posterPath: credit.posterPath, releaseYear: credit.releaseYear },
    href: movieHref(credit),
  };
}

function PeopleGrid({ people }: { people: PersonSummary[] }) {
  return (
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
            <span className="mt-3 font-medium leading-tight group-hover:text-brand-orange transition-colors">{person.name}</span>
            <span className="mt-1 text-xs uppercase tracking-[0.12em] text-brand-slate/50">{departmentLabel(person.department)}</span>
            {person.knownFor.length > 0 && (
              <span className="mt-1.5 text-xs text-brand-slate/60 line-clamp-2">{person.knownFor.join(" · ")}</span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** enquanto as buscas não voltam: o lugar do destaque e de uma fileira de pôsteres */
function ResultsSkeleton() {
  return (
    <div aria-hidden="true" className="animate-pulse">
      <div className="mb-10 flex gap-6 border-b border-foreground/10 pb-4">
        {[40, 56, 48].map((w) => <span key={w} className="h-4 rounded bg-surface" style={{ width: w }} />)}
      </div>
      <div className="mb-14 flex gap-5 sm:gap-8 p-5 sm:p-6 rounded-lg bg-surface/60">
        <span className="w-28 sm:w-40 aspect-2/3 shrink-0 rounded-md bg-surface" />
        <span className="flex flex-1 flex-col gap-3 py-1">
          <span className="h-3 w-32 rounded bg-surface" />
          <span className="h-7 w-2/3 rounded bg-surface" />
          <span className="h-3 w-full max-w-xl rounded bg-surface" />
          <span className="h-3 w-5/6 max-w-lg rounded bg-surface" />
        </span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-x-3 gap-y-5 sm:gap-x-4">
        {Array.from({ length: 8 }, (_, i) => <span key={i} className="aspect-2/3 rounded-md bg-surface" />)}
      </div>
    </div>
  );
}

function NothingFound({ query, failed }: { query: string; failed: boolean }) {
  return (
    <div className="flex flex-col items-center text-center py-16 rounded-lg border border-dashed border-foreground/10">
      <MagnifyingGlassIcon size={40} weight="light" className="text-brand-slate/50" />
      <p className="mt-4 text-lg font-medium">
        {failed ? "Não foi possível buscar agora" : `Nada encontrado para “${query}”`}
      </p>
      <p className="mt-2 max-w-sm text-sm text-brand-slate">
        {failed
          ? "Tente novamente em instantes."
          : "Confira a grafia ou tente o título original, o nome de alguém do elenco ou um @ do Nitrate."}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => openHeaderSearch(query)}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-brand-btn text-brand-btn-text text-sm font-semibold hover:bg-brand-btn/90 transition-colors"
        >
          <PencilSimpleIcon size={14} weight="bold" /> Tentar outra busca
        </button>
        <Link href="/movies" className="inline-flex items-center h-9 px-4 rounded-md text-sm text-brand-slate ring-1 ring-foreground/10 hover:text-foreground hover:ring-foreground/20 transition-colors">
          Ver o catálogo
        </Link>
      </div>
    </div>
  );
}

/** sem nada buscado: aponta para o campo do header (que já abre sozinho) */
function StartState() {
  const isApple = useIsApple();
  return (
    <div className="flex flex-col items-center text-center pt-10 sm:pt-16">
      <span className="flex size-16 items-center justify-center rounded-full bg-surface ring-1 ring-foreground/10 text-brand-slate">
        <MagnifyingGlassIcon size={28} />
      </span>
      <h1 className="mt-6 text-3xl sm:text-4xl font-medium tracking-tight">O que você quer encontrar?</h1>
      <p className="mt-3 max-w-md text-brand-slate">
        Filmes, séries, gente do elenco e da direção ou perfis do Nitrate, tudo pela busca do topo.
      </p>
      <button
        type="button"
        onClick={() => openHeaderSearch()}
        className="mt-8 inline-flex items-center gap-2 h-10 px-5 rounded-md bg-brand-btn text-brand-btn-text text-sm font-semibold hover:bg-brand-btn/90 transition-colors"
      >
        <MagnifyingGlassIcon size={16} weight="bold" /> Começar a buscar
      </button>
      {isApple !== null && (
        <p className="mt-4 hidden lg:block text-xs text-brand-slate/60">
          ou aperte{" "}
          <kbd className="font-sans text-[11px] px-1.5 py-0.5 rounded bg-foreground/5 ring-1 ring-foreground/10 text-brand-slate/80">
            {isApple ? "⌘K" : "Ctrl K"}
          </kbd>{" "}
          em qualquer página
        </p>
      )}
    </div>
  );
}
