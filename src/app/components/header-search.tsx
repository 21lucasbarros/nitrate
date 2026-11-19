"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleNotchIcon, FilmSlateIcon, MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { useFetch } from "@/lib/hooks/use-fetch";
import { searchMovies } from "@/lib/services/movie-service";
import { searchPeople } from "@/lib/services/person-service";
import { searchUsers } from "@/lib/services/user-service";
import { movieHref } from "@/utils/movie-link";
import { posterUrl } from "@/utils/poster";
import { Avatar } from "./ui/avatar";
import { PersonPhoto } from "./ui/person-photo";

const MIN_QUERY = 2;
const DEBOUNCE_MS = 300;
const MAX_MOVIES = 5;
const MAX_PEOPLE = 3;
const MAX_USERS = 3;

/** Lupa do header: abre um campo de busca com sugestões; Enter leva para a busca completa em /movies. */
export function HeaderSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  const debounced = useDebouncedValue(query.trim(), DEBOUNCE_MS);
  const key = open && debounced.length >= MIN_QUERY ? debounced : null;
  const movies = useFetch(key, searchMovies);
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

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Buscar filmes, pessoas e perfis"
        className="px-3 py-2 text-brand-slate hover:text-foreground transition-colors"
      >
        <MagnifyingGlassIcon size={18} className="my-0.5" />
      </button>
    );
  }

  const typed = query.trim();
  const pending = typed.length >= MIN_QUERY && (debounced !== typed || movies.loading);
  const movieResults = (movies.data ?? []).slice(0, MAX_MOVIES);
  const peopleResults = (people.data ?? []).slice(0, MAX_PEOPLE);
  const userResults = (users.data ?? []).slice(0, MAX_USERS);
  const nothing = !pending && movies.data && movieResults.length === 0 && peopleResults.length === 0 && userResults.length === 0;

  return (
    <div ref={ref} className="relative">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (typed.length < MIN_QUERY) return;
          router.push(`/movies?q=${encodeURIComponent(typed)}`);
          close();
        }}
        className="flex items-center gap-2 w-64 lg:w-72 h-9 px-3 rounded-md bg-surface ring-1 ring-foreground/10 focus-within:ring-foreground/25"
      >
        {pending ? (
          <CircleNotchIcon size={16} className="shrink-0 text-brand-slate animate-spin" />
        ) : (
          <MagnifyingGlassIcon size={16} className="shrink-0 text-brand-slate" />
        )}
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && close()}
          placeholder="Filmes, pessoas e perfis"
          aria-label="Buscar filmes, pessoas e perfis"
          className="flex-1 min-w-0 bg-transparent text-sm placeholder:text-brand-slate/60 focus:outline-none"
        />
        <button type="button" onClick={close} aria-label="Fechar busca" className="shrink-0 text-brand-slate hover:text-foreground">
          <XIcon size={14} />
        </button>
      </form>

      {typed.length >= MIN_QUERY && (movies.data || nothing) && (
        <div className="absolute right-0 top-full mt-2 w-[min(380px,calc(100vw-2rem))] max-h-[70vh] overflow-y-auto rounded-md bg-surface ring-1 ring-foreground/10 shadow-2xl shadow-black/60 py-2">
          {nothing ? (
            <p className="px-4 py-3 text-sm text-brand-slate">Nada encontrado para “{typed}”.</p>
          ) : (
            <>
              {movieResults.length > 0 && (
                <Group label="Filmes">
                  {movieResults.map((movie) => {
                    const poster = posterUrl(movie.posterPath, "w185");
                    return (
                      <ResultLink key={movie.tmdbId} href={movieHref(movie)} onClick={close}>
                        <span className="relative w-8 h-12 shrink-0 overflow-hidden rounded-sm bg-foreground/5">
                          {poster ? (
                            <Image src={poster} alt="" fill sizes="32px" className="object-cover" />
                          ) : (
                            <FilmSlateIcon size={14} className="absolute inset-0 m-auto text-foreground/25" />
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm truncate">{movie.title}</span>
                          {movie.releaseYear && <span className="block text-xs text-brand-slate">{movie.releaseYear}</span>}
                        </span>
                      </ResultLink>
                    );
                  })}
                </Group>
              )}

              {peopleResults.length > 0 && (
                <Group label="Pessoas">
                  {peopleResults.map((person) => (
                    <ResultLink key={person.tmdbId} href={`/person/${person.tmdbId}`} onClick={close}>
                      <PersonPhoto name={person.name} profilePath={person.profilePath} sizes="32px" className="w-8 shrink-0" />
                      <span className="min-w-0">
                        <span className="block text-sm truncate">{person.name}</span>
                        {person.knownFor.length > 0 && (
                          <span className="block text-xs text-brand-slate truncate">{person.knownFor.join(" · ")}</span>
                        )}
                      </span>
                    </ResultLink>
                  ))}
                </Group>
              )}

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
                href={`/movies?q=${encodeURIComponent(typed)}`}
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
