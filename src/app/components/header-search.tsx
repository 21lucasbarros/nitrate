"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FilmSlateIcon, MagnifyingGlassIcon, TelevisionIcon } from "@phosphor-icons/react";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { useFetch } from "@/lib/hooks/use-fetch";
import { useIsApple } from "@/lib/hooks/use-is-apple";
import { searchMovies } from "@/lib/services/movie-service";
import { searchPeople } from "@/lib/services/person-service";
import { searchSeries } from "@/lib/services/series-service";
import { searchUsers } from "@/lib/services/user-service";
import { departmentLabel } from "@/types/person";
import { movieHref } from "@/utils/movie-link";
import { seriesHref } from "@/utils/series-link";
import { posterUrl } from "@/utils/poster";
import { matchesQuery } from "@/utils/text";
import { Avatar } from "./ui/avatar";
import { PersonPhoto } from "./ui/person-photo";
import { SearchInput } from "./ui/search-input";
import { personHref } from "@/utils/person-link";

const MIN_QUERY = 2;
const DEBOUNCE_MS = 300;
const MAX_MOVIES = 5;
const MAX_SERIES = 3;
const MAX_PEOPLE = 3;
const MAX_USERS = 3;

const OPEN_EVENT = "nitrate:abrir-busca";

/** abre a busca do header de qualquer lugar (ex.: /buscar sem nada buscado, "Buscar pessoas" de /amigos) */
export function openHeaderSearch(query = "") {
  window.dispatchEvent(new CustomEvent<string>(OPEN_EVENT, { detail: query }));
}

/**
 * Busca do header: abre um campo com sugestões (filmes, séries, pessoas e perfis); Enter leva para a busca completa em /buscar.
 * No celular fechada é só a lupa, e aberta cobre o header inteiro.
 */
export function HeaderSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const isApple = useIsApple();

  const debounced = useDebouncedValue(query.trim(), DEBOUNCE_MS);
  const key = open && debounced.length >= MIN_QUERY ? debounced : null;
  const movies = useFetch(key, searchMovies);
  const series = useFetch(key, searchSeries);
  const people = useFetch(key, searchPeople);
  const users = useFetch(key, searchUsers);

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  // clicar fora fecha
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // ⌘K / Ctrl+K (ou "/" fora de um campo de texto) abre a busca de qualquer página
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target?.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName ?? "");
      if (((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") || (e.key === "/" && !typing)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    const onOpen = (e: Event) => {
      setQuery((e as CustomEvent<string>).detail ?? "");
      setOpen(true);
    };
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, []);

  if (!open) {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Buscar filmes, séries, pessoas e perfis"
          className="lg:hidden p-2 -mx-1 text-brand-slate hover:text-foreground transition-colors"
        >
          <MagnifyingGlassIcon size={20} />
        </button>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Buscar filmes, séries, pessoas e perfis"
          aria-keyshortcuts={isApple === null ? "Meta+K Control+K" : isApple ? "Meta+K" : "Control+K"}
          className="hidden lg:flex items-center gap-2 w-64 h-9 px-3 rounded-md bg-surface/60 ring-1 ring-foreground/10 text-sm text-brand-slate/80 hover:text-foreground hover:ring-foreground/20 transition-colors"
        >
          <MagnifyingGlassIcon size={16} className="shrink-0" />
          <span className="flex-1 text-left truncate">Buscar filmes, séries…</span>
          {/* o atalho do sistema da pessoa; só aparece depois de hidratar, para o HTML do servidor bater */}
          {isApple !== null && (
            <kbd className="shrink-0 font-sans text-[11px] px-1.5 py-0.5 rounded bg-foreground/5 ring-1 ring-foreground/10 text-brand-slate/70">
              {isApple ? "⌘K" : "Ctrl K"}
            </kbd>
          )}
        </button>
      </>
    );
  }

  const typed = query.trim();
  const sources = [movies, series, people, users];
  const pending = typed.length >= MIN_QUERY && (debounced !== typed || sources.some((s) => s.loading));
  const movieResults = (movies.data ?? []).slice(0, MAX_MOVIES);
  const seriesResults = (series.data ?? []).slice(0, MAX_SERIES);
  const peopleResults = (people.data ?? []).slice(0, MAX_PEOPLE);
  const userResults = (users.data ?? []).slice(0, MAX_USERS);
  const hasResults =
    movieResults.length > 0 || seriesResults.length > 0 || peopleResults.length > 0 || userResults.length > 0;
  // cada busca é independente: uma que falhe ou demore não esconde o resultado das outras
  const nothing = !pending && !hasResults;
  // buscou pelo nome de alguém (ex.: "Ingrid Guimarães") e nenhum título bate tão bem: pessoas vêm primeiro
  const titleMatches =
    movieResults.some((m) => matchesQuery(m.title, typed)) || seriesResults.some((s) => matchesQuery(s.name, typed));
  const peopleFirst = peopleResults.some((p) => matchesQuery(p.name, typed)) && !titleMatches;
  // o mesmo entre títulos: buscou uma série (ex.: "Blade Runner 2099") e nenhum filme bate tão bem
  const seriesFirst =
    seriesResults.some((s) => matchesQuery(s.name, typed)) && !movieResults.some((m) => matchesQuery(m.title, typed));

  const peopleGroup = peopleResults.length > 0 && (
    <Group label="Pessoas">
      {peopleResults.map((person) => (
        <ResultLink key={person.tmdbId} href={personHref(person)} onClick={close}>
          <PersonPhoto name={person.name} profilePath={person.profilePath} sizes="32px" className="w-8 shrink-0" />
          <span className="min-w-0">
            <span className="block text-sm truncate">{person.name}</span>
            <span className="block text-xs text-brand-slate truncate">
              {[departmentLabel(person.department), ...person.knownFor].filter(Boolean).join(" · ")}
            </span>
          </span>
        </ResultLink>
      ))}
    </Group>
  );

  const moviesGroup = movieResults.length > 0 && (
    <Group label="Filmes">
      {movieResults.map((movie) => (
        <ResultLink key={movie.tmdbId} href={movieHref(movie)} onClick={close}>
          <ResultPoster posterPath={movie.posterPath} icon={<FilmSlateIcon size={14} />} />
          <span className="min-w-0">
            <span className="block text-sm truncate">{movie.title}</span>
            {movie.releaseYear && <span className="block text-xs text-brand-slate">{movie.releaseYear}</span>}
          </span>
        </ResultLink>
      ))}
    </Group>
  );

  const seriesGroup = seriesResults.length > 0 && (
    <Group label="Séries">
      {seriesResults.map((s) => (
        <ResultLink key={s.tmdbId} href={seriesHref(s)} onClick={close}>
          <ResultPoster posterPath={s.posterPath} icon={<TelevisionIcon size={14} />} />
          <span className="min-w-0">
            <span className="block text-sm truncate">{s.name}</span>
            <span className="block text-xs text-brand-slate">{s.firstAirYear ? `Série · ${s.firstAirYear}` : "Série"}</span>
          </span>
        </ResultLink>
      ))}
    </Group>
  );

  return (
    // no celular cobre o header inteiro (o header tem backdrop-blur, então o fixed é relativo a ele)
    <div
      ref={ref}
      className="max-lg:fixed max-lg:inset-x-0 max-lg:top-0 max-lg:z-10 max-lg:h-16 max-lg:px-4 max-lg:flex max-lg:items-center max-lg:gap-3 max-lg:bg-background lg:relative"
    >
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (typed.length < MIN_QUERY) return;
          router.push(`/buscar?q=${encodeURIComponent(typed)}`);
          close();
        }}
        className="flex-1 lg:w-64"
      >
        <SearchInput
          autoFocus
          size="sm"
          value={query}
          onChange={setQuery}
          pending={pending}
          label="Buscar filmes, séries, pessoas e perfis"
          placeholder="Filmes, séries, pessoas e perfis"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              close();
            }
          }}
          onClear={close}
          clearLabel="Fechar busca"
        />
      </form>
      <button type="button" onClick={close} className="lg:hidden shrink-0 text-sm text-brand-slate hover:text-foreground">
        Cancelar
      </button>

      {typed.length >= MIN_QUERY && (hasResults || nothing) && (
        <div className="absolute max-lg:inset-x-4 lg:right-0 top-full mt-2 lg:w-[380px] max-h-[70vh] overflow-y-auto rounded-md bg-surface ring-1 ring-foreground/10 shadow-2xl shadow-black/60 py-2">
          {nothing ? (
            <p className="px-4 py-3 text-sm text-brand-slate">Nada encontrado para “{typed}”.</p>
          ) : (
            <>
              {peopleFirst && peopleGroup}

              {seriesFirst ? seriesGroup : moviesGroup}
              {seriesFirst ? moviesGroup : seriesGroup}

              {!peopleFirst && peopleGroup}

              {userResults.length > 0 && (
                <Group label="Perfis">
                  {userResults.map((user) => (
                    <ResultLink key={user.username} href={`/u/${user.username}`} onClick={close}>
                      <Avatar name={user.name} username={user.username} avatar={user.avatar} size="sm" />
                      <span className="min-w-0">
                        <span className="block text-sm truncate">{user.name}</span>
                        <span className="block text-xs text-brand-slate truncate">@{user.username}</span>
                      </span>
                    </ResultLink>
                  ))}
                </Group>
              )}

              <Link
                href={`/buscar?q=${encodeURIComponent(typed)}`}
                onClick={close}
                className="mt-1 mx-2 flex items-center justify-between px-2 py-2 rounded text-sm text-brand-slate hover:text-foreground hover:bg-surface-strong border-t border-foreground/5"
              >
                Ver todos os resultados
                <kbd className="font-sans text-[11px] text-brand-slate/60">Enter</kbd>
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="pb-1">
      <p className="px-4 pt-2 pb-1 text-[11px] uppercase tracking-[0.14em] text-brand-slate/70">{label}</p>
      <ul>{children}</ul>
    </div>
  );
}

function ResultLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} onClick={onClick} className="mx-2 flex items-center gap-3 px-2 py-1.5 rounded hover:bg-surface-strong transition-colors">
        {children}
      </Link>
    </li>
  );
}

function ResultPoster({ posterPath, icon }: { posterPath: string | null; icon: React.ReactNode }) {
  const poster = posterUrl(posterPath, "w185");
  return (
    <span className="relative w-8 h-12 shrink-0 overflow-hidden rounded-sm bg-foreground/5">
      {poster ? (
        <Image src={poster} alt="" fill sizes="32px" className="object-cover" />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-foreground/25">{icon}</span>
      )}
    </span>
  );
}
