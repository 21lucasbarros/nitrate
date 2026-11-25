"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowLeftIcon, CheckIcon, FilmSlateIcon, WarningIcon } from "@phosphor-icons/react";
import { ApiError } from "@/lib/api-client";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { useFetch } from "@/lib/hooks/use-fetch";
import { searchMovies } from "@/lib/services/movie-service";
import { getMovieBackdrops, setMyCover } from "@/lib/services/user-service";
import type { UserProfile } from "@/lib/types/user";
import type { MovieSearchResult } from "@/types/movie";
import { backdropUrl, posterUrl } from "@/utils/poster";
import { Modal } from "./ui/modal";
import { SearchInput } from "./ui/search-input";

const MIN_QUERY = 2;
const MAX_RESULTS = 8;

interface CoverPickerProps {
  open: boolean;
  onClose: () => void;
  /** o fundo atual: o seletor já abre nas cenas desse filme, com a cena marcada */
  current: UserProfile["cover"];
  onSaved: (profile: UserProfile) => void;
}

/** Escolher o fundo do perfil: pesquisa um filme e escolhe uma das cenas dele no TMDB. */
export function CoverPicker({ open, onClose, current, onSaved }: CoverPickerProps) {
  return (
    <Modal open={open} onClose={onClose} label="Escolher o fundo do perfil">
      {/* o conteúdo só existe aberto: cada abertura recomeça do fundo atual */}
      {open && <PickerBody current={current} onClose={onClose} onSaved={onSaved} />}
    </Modal>
  );
}

function PickerBody({ current, onClose, onSaved }: Omit<CoverPickerProps, "open">) {
  const [tmdbId, setTmdbId] = useState<number | null>(current?.tmdbId ?? null);
  const [selected, setSelected] = useState<string | null>(current?.path ?? null);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounced = useDebouncedValue(query.trim(), 300);
  const results = useFetch(tmdbId === null && debounced.length >= MIN_QUERY ? debounced : null, searchMovies);
  const scenes = useFetch(tmdbId, getMovieBackdrops);

  const pickMovie = (movie: MovieSearchResult) => {
    setTmdbId(movie.tmdbId);
    setSelected(null);
    setError(null);
  };

  const backToSearch = () => {
    setTmdbId(null);
    setSelected(null);
    setError(null);
  };

  const save = async () => {
    if (tmdbId === null || !selected) return;
    setBusy(true);
    setError(null);
    try {
      onSaved(await setMyCover(tmdbId, selected));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível salvar o fundo. Tente novamente.");
      setBusy(false);
    }
  };

  if (tmdbId === null) {
    const typed = query.trim();
    const items = (results.data ?? []).slice(0, MAX_RESULTS);
    const pending = typed.length >= MIN_QUERY && (debounced !== typed || results.loading);
    return (
      <div className="flex flex-col gap-5">
        <div className="pr-10">
          <h2 className="text-lg font-semibold">Fundo do perfil</h2>
          <p className="mt-1 text-sm text-brand-slate">Pesquise um filme e escolha uma cena para o topo do seu perfil.</p>
        </div>

        <SearchInput
          autoFocus
          tone="panel"
          value={query}
          onChange={setQuery}
          pending={pending}
          label="Buscar um filme"
        />

        {typed.length < MIN_QUERY ? (
          <p className="py-6 text-center text-sm text-brand-slate/70">Digite pelo menos {MIN_QUERY} letras.</p>
        ) : !pending && items.length === 0 ? (
          <p className="py-6 text-center text-sm text-brand-slate/70">Nenhum filme encontrado para “{typed}”.</p>
        ) : (
          <ul className="-mx-2 flex flex-col">
            {items.map((movie) => {
              const poster = posterUrl(movie.posterPath, "w185");
              return (
                <li key={movie.tmdbId}>
                  <button
                    type="button"
                    onClick={() => pickMovie(movie)}
                    className="w-full flex items-center gap-3 px-2 py-2 rounded text-left hover:bg-surface-strong transition-colors"
                  >
                    <span className="relative w-9 h-[54px] shrink-0 overflow-hidden rounded-sm bg-foreground/5">
                      {poster ? (
                        <Image src={poster} alt="" fill sizes="36px" className="object-cover" />
                      ) : (
                        <FilmSlateIcon size={14} className="absolute inset-0 m-auto text-foreground/25" />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm truncate">{movie.title}</span>
                      {movie.releaseYear && <span className="block text-xs text-brand-slate">{movie.releaseYear}</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="pr-10">
        <button
          type="button"
          onClick={backToSearch}
          className="inline-flex items-center gap-1.5 text-sm text-brand-slate hover:text-foreground transition-colors"
        >
          <ArrowLeftIcon size={14} /> Outro filme
        </button>
        <h2 className="mt-2 text-lg font-semibold truncate">
          {scenes.data ? scenes.data.title : "Carregando…"}
          {scenes.data?.year && <span className="ml-2 text-sm font-normal text-brand-slate">{scenes.data.year}</span>}
        </h2>
        <p className="mt-1 text-sm text-brand-slate">Escolha a cena.</p>
      </div>

      {scenes.error ? (
        <p className="py-10 text-center text-sm text-brand-slate">Não foi possível carregar as cenas desse filme.</p>
      ) : !scenes.data ? (
        <div className="grid grid-cols-2 gap-2 sm:gap-3" aria-hidden="true">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="aspect-video rounded-md bg-surface-strong animate-pulse" />
          ))}
        </div>
      ) : scenes.data.backdrops.length === 0 ? (
        <p className="py-10 text-center text-sm text-brand-slate">Esse filme não tem cenas no TMDB. Tente outro.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-2 sm:gap-3 max-h-[min(52vh,520px)] overflow-y-auto -mx-1 px-1 py-1">
          {scenes.data.backdrops.map((path) => {
            const active = selected === path;
            return (
              <li key={path}>
                <button
                  type="button"
                  onClick={() => setSelected(path)}
                  aria-pressed={active}
                  aria-label="Usar esta cena"
                  className={`group relative block w-full aspect-video overflow-hidden rounded-md bg-surface-strong ring-2 transition-all ${active ? "ring-brand-orange" : "ring-transparent hover:ring-foreground/30"}`}
                >
                  <Image
                    src={backdropUrl(path, "w780")!}
                    alt=""
                    fill
                    sizes="(min-width: 640px) 300px, 45vw"
                    className={`object-cover transition-opacity ${active ? "" : "opacity-85 group-hover:opacity-100"}`}
                  />
                  {active && (
                    <span className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-brand-orange text-brand-btn-text flex items-center justify-center shadow-lg">
                      <CheckIcon size={14} weight="bold" />
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {error && (
        <p role="alert" className="flex items-center gap-2 text-sm text-brand-crimson">
          <WarningIcon size={16} /> {error}
        </p>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-sm text-brand-slate hover:text-foreground">
          Cancelar
        </button>
        <button
          type="button"
          onClick={save}
          disabled={!selected || busy}
          className="px-4 py-2 rounded-md bg-brand-btn text-brand-btn-text text-sm font-semibold hover:bg-brand-btn/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {busy ? "Salvando…" : "Usar esta cena"}
        </button>
      </div>
    </div>
  );
}
