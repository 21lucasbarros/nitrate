"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CircleNotchIcon,
  PencilSimpleIcon,
  PlusIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useFetch } from "@/lib/hooks/use-fetch";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { getMovieByTmdbId, searchMovies } from "@/lib/services/movie-service";
import { MAX_FAVORITES, setMyFavorites } from "@/lib/services/user-service";
import type { Movie, MovieSearchResult } from "@/types/movie";
import { filmHref } from "@/utils/movie-link";
import { IconButton } from "./ui/icon-button";
import { Modal } from "./ui/modal";
import { SearchInput } from "./ui/search-input";
import { MovieThumb } from "./ui/movie-thumb";
import { Poster } from "./ui/poster";

/** Os filmes favoritos no topo do perfil, na ordem escolhida. */
export function FavoriteFilms({ films, isMe, onEdit }: { films: Movie[]; isMe: boolean; onEdit: () => void }) {
  if (films.length === 0) {
    return isMe ? (
      <button
        onClick={onEdit}
        className="w-full flex items-center justify-center gap-2 py-8 rounded-md border border-dashed border-foreground/15 text-sm text-brand-slate hover:border-foreground/30 hover:text-foreground transition-colors"
      >
        <PlusIcon size={16} weight="bold" />
        Escolha seus {MAX_FAVORITES} filmes favoritos
      </button>
    ) : null;
  }

  // flex em vez de grid: no celular (3 por linha) a segunda linha, com o 4º e o 5º, fica centralizada
  const item = "w-[calc((100%-1.5rem)/3)] sm:w-[calc((100%-4rem)/5)]";

  return (
    <ol className="flex flex-wrap justify-center gap-3 sm:gap-4">
      {films.map((film) => (
        <li key={film.id} className={item}>
          <Link href={filmHref(film)} title={film.releaseYear ? `${film.title} (${film.releaseYear})` : film.title} className="group block">
            <Poster
              title={film.title}
              posterPath={film.posterPath}
              size="w342"
              sizes="(min-width: 640px) 210px, 30vw"
              className="group-hover:ring-2 group-hover:ring-brand-orange transition-shadow"
            />
          </Link>
        </li>
      ))}
      {isMe && films.length < MAX_FAVORITES && (
        <li className={item}>
          <button
            onClick={onEdit}
            aria-label="Adicionar favorito"
            className="w-full aspect-2/3 flex items-center justify-center rounded-md border border-dashed border-foreground/15 text-brand-slate hover:border-foreground/30 hover:text-foreground transition-colors"
          >
            <PlusIcon size={20} />
          </button>
        </li>
      )}
    </ol>
  );
}

export function EditFavoritesButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 text-sm text-brand-slate hover:text-foreground transition-colors">
      <PencilSimpleIcon size={14} />
      Editar
    </button>
  );
}

const MIN_QUERY = 2;

/** Modal para escolher e ordenar os favoritos. Salva a lista inteira de uma vez. */
export function FavoritesEditor({ open, initial, onClose, onSaved }: {
  open: boolean;
  initial: Movie[];
  onClose: () => void;
  onSaved: (films: Movie[]) => void;
}) {
  return (
    <Modal open={open} onClose={onClose} label="Editar filmes favoritos">
      {/* key: reabrir o modal recomeça da lista salva */}
      {open && <Editor key={initial.map((m) => m.id).join(",")} initial={initial} onClose={onClose} onSaved={onSaved} />}
    </Modal>
  );
}

function Editor({ initial, onClose, onSaved }: { initial: Movie[]; onClose: () => void; onSaved: (films: Movie[]) => void }) {
  const [picks, setPicks] = useState<Movie[]>(initial);
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState<number | null>(null); // tmdbId sendo importado
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounced = useDebouncedValue(query.trim(), 350);
  const results = useFetch(debounced.length >= MIN_QUERY ? debounced : null, searchMovies);
  const full = picks.length >= MAX_FAVORITES;

  const add = async (result: MovieSearchResult) => {
    if (full) return;
    setError(null);
    setAdding(result.tmdbId);
    try {
      // filme ainda não importado: o backend importa do TMDB na primeira vez
      const movie = await getMovieByTmdbId(result.tmdbId);
      setPicks((current) => (current.some((m) => m.id === movie.id) ? current : [...current, movie]));
      setQuery("");
    } catch {
      setError("Não foi possível adicionar esse filme agora.");
    } finally {
      setAdding(null);
    }
  };

  const move = (index: number, delta: number) => {
    setPicks((current) => {
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(index + delta, 0, item);
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      onSaved(await setMyFavorites(picks.map((m) => m.id)));
    } catch {
      setError("Não foi possível salvar. Tente novamente.");
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold">Filmes favoritos</h2>
      <p className="mt-1 text-sm text-brand-slate">Até {MAX_FAVORITES}, na ordem em que aparecem no perfil.</p>

      <ol className="mt-6 flex flex-col gap-2">
        {picks.map((movie, i) => (
          <li key={movie.id} className="flex items-center gap-3 p-2 pr-3 rounded-md bg-background/60">
            <span className="w-5 text-center text-sm text-brand-slate tabular-nums">{i + 1}</span>
            <MovieThumb title={movie.title} posterPath={movie.posterPath} />
            <span className="flex-1 min-w-0 truncate">
              {movie.title} {movie.releaseYear && <span className="text-brand-slate text-sm">{movie.releaseYear}</span>}
            </span>
            <IconButton label="Subir" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUpIcon size={16} /></IconButton>
            <IconButton label="Descer" disabled={i === picks.length - 1} onClick={() => move(i, 1)}><ArrowDownIcon size={16} /></IconButton>
            <IconButton label="Remover" onClick={() => setPicks(picks.filter((m) => m.id !== movie.id))}><XIcon size={16} /></IconButton>
          </li>
        ))}
        {Array.from({ length: MAX_FAVORITES - picks.length }, (_, i) => (
          <li key={`vazio-${i}`} className="flex items-center gap-3 p-2 rounded-md border border-dashed border-foreground/10 text-brand-slate/60 text-sm">
            <span className="w-5 text-center text-sm tabular-nums">{picks.length + i + 1}</span>
            <span className="w-8 h-12 rounded bg-foreground/5" />
            vazio
          </li>
        ))}
      </ol>

      {!full && (
        <div className="mt-6">
          <SearchInput
            autoFocus
            tone="panel"
            value={query}
            onChange={setQuery}
            pending={results.loading}
            label="Buscar um filme para adicionar"
          />
          {debounced.length >= MIN_QUERY && (
            <ul className="mt-2 max-h-64 overflow-y-auto flex flex-col">
              {results.loading && !results.data && (
                <li className="flex items-center gap-2 px-3 py-3 text-sm text-brand-slate">
                  <CircleNotchIcon size={16} className="animate-spin" /> Buscando…
                </li>
              )}
              {results.data?.slice(0, 8).map((result) => {
                const already = picks.some((m) => m.id === result.id);
                return (
                  <li key={result.tmdbId}>
                    <button
                      onClick={() => add(result)}
                      disabled={already || adding !== null}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-left hover:bg-background/60 disabled:opacity-50 transition-colors"
                    >
                      <MovieThumb title={result.title} posterPath={result.posterPath} />
                      <span className="flex-1 min-w-0 truncate">
                        {result.title} {result.releaseYear && <span className="text-brand-slate text-sm">{result.releaseYear}</span>}
                      </span>
                      {adding === result.tmdbId ? (
                        <CircleNotchIcon size={16} className="animate-spin text-brand-slate" />
                      ) : (
                        <span className="text-xs text-brand-slate">{already ? "já está" : "adicionar"}</span>
                      )}
                    </button>
                  </li>
                );
              })}
              {results.data?.length === 0 && <li className="px-3 py-3 text-sm text-brand-slate">Nenhum filme encontrado.</li>}
            </ul>
          )}
        </div>
      )}

      {error && <p className="mt-4 text-sm text-brand-crimson">{error}</p>}

      <div className="mt-8 flex justify-end gap-3">
        <button onClick={onClose} className="px-4 py-2 rounded-md text-sm text-brand-slate hover:text-foreground">
          Cancelar
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="px-5 py-2 rounded-md bg-brand-btn text-brand-btn-text text-sm font-semibold hover:bg-brand-btn/90 disabled:opacity-60"
        >
          {saving ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </div>
  );
}
