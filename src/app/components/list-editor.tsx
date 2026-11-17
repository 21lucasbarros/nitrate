"use client";

import { useState } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CircleNotchIcon,
  GlobeHemisphereWestIcon,
  LockSimpleIcon,
  MagnifyingGlassIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useFetch } from "@/lib/hooks/use-fetch";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { getMovieByTmdbId, searchMovies } from "@/lib/services/movie-service";
import { createList, updateList } from "@/lib/services/list-service";
import type { MovieList } from "@/lib/types/list";
import type { Movie, MovieSearchResult } from "@/types/movie";
import { IconButton } from "./ui/icon-button";
import { Modal } from "./ui/modal";
import { MovieThumb } from "./ui/movie-thumb";

const MIN_QUERY = 2;
const NAME_MAX = 100;
const DESCRIPTION_MAX = 2000;

/** Modal para criar uma lista ou editar uma existente (`list`). Salva tudo de uma vez. */
export function ListEditor({ open, list, initialMovies = [], onClose, onSaved }: {
  open: boolean;
  /** lista completa (com todos os filmes) para editar; sem ela, cria uma nova */
  list?: MovieList | null;
  /** filmes já escolhidos ao criar (ex.: "nova lista" a partir da página de um filme) */
  initialMovies?: Movie[];
  onClose: () => void;
  onSaved: (list: MovieList) => void;
}) {
  return (
    <Modal open={open} onClose={onClose} label={list ? `Editar a lista ${list.name}` : "Nova lista"}>
      {/* key: reabrir o modal recomeça do que está salvo */}
      {open && <Editor key={list?.updatedAt ?? "nova"} list={list ?? null} initialMovies={initialMovies} onClose={onClose} onSaved={onSaved} />}
    </Modal>
  );
}

function Editor({ list, initialMovies, onClose, onSaved }: {
  list: MovieList | null;
  initialMovies: Movie[];
  onClose: () => void;
  onSaved: (list: MovieList) => void;
}) {
  const [name, setName] = useState(list?.name ?? "");
  const [description, setDescription] = useState(list?.description ?? "");
  const [isPublic, setIsPublic] = useState(list?.isPublic ?? true);
  const [movies, setMovies] = useState<Movie[]>(list?.movies ?? initialMovies);
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState<number | null>(null); // tmdbId sendo importado
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounced = useDebouncedValue(query.trim(), 350);
  const results = useFetch(debounced.length >= MIN_QUERY ? debounced : null, searchMovies);

  const add = async (result: MovieSearchResult) => {
    setError(null);
    setAdding(result.tmdbId);
    try {
      // filme ainda não importado: o backend importa do TMDB na primeira vez
      const movie = await getMovieByTmdbId(result.tmdbId);
      setMovies((current) => (current.some((m) => m.id === movie.id) ? current : [...current, movie]));
      setQuery("");
    } catch {
      setError("Não foi possível adicionar esse filme agora.");
    } finally {
      setAdding(null);
    }
  };

  const move = (index: number, delta: number) => {
    setMovies((current) => {
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(index + delta, 0, item);
      return next;
    });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Dê um nome para a lista.");
      return;
    }
    setSaving(true);
    setError(null);
    const data = { name: name.trim(), description: description.trim(), isPublic, movieIds: movies.map((m) => m.id) };
    try {
      onSaved(list ? await updateList(list.id, data) : await createList(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar. Tente novamente.");
      setSaving(false);
    }
  };

  const input =
    "w-full px-4 py-3 bg-background/60 border border-foreground/10 rounded-md text-sm placeholder:text-brand-slate/60 focus:outline-none focus:border-foreground/30";

  return (
    <form onSubmit={save}>
      <h2 className="text-xl font-semibold">{list ? "Editar lista" : "Nova lista"}</h2>
      <p className="mt-1 text-sm text-brand-slate">Maratonas, retrospectivas de diretores, coleções: do seu jeito, na sua ordem.</p>

      <div className="mt-6 flex flex-col gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={NAME_MAX}
          placeholder="Nome da lista"
          aria-label="Nome da lista"
          autoFocus={!list}
          className={`${input} text-base font-medium`}
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={DESCRIPTION_MAX}
          rows={3}
          placeholder="Descrição (opcional)"
          aria-label="Descrição"
          className={`${input} resize-y`}
        />

        <fieldset className="grid grid-cols-2 gap-2">
          <legend className="sr-only">Quem pode ver</legend>
          <Visibility active={isPublic} onClick={() => setIsPublic(true)} icon={<GlobeHemisphereWestIcon size={18} />} title="Pública" hint="Aparece no seu perfil" />
          <Visibility active={!isPublic} onClick={() => setIsPublic(false)} icon={<LockSimpleIcon size={18} />} title="Privada" hint="Só você vê" />
        </fieldset>
      </div>

      <h3 className="mt-8 text-sm font-medium text-foreground/90">
        Filmes <span className="ml-1 font-normal text-brand-slate/70">{movies.length}</span>
      </h3>

      <div className="mt-3 group relative">
        <MagnifyingGlassIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-slate/60 pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar um filme para adicionar"
          aria-label="Buscar um filme para adicionar"
          className={`${input} pl-11`}
        />
      </div>
      {debounced.length >= MIN_QUERY && (
        <ul className="mt-2 max-h-56 overflow-y-auto flex flex-col">
          {results.loading && !results.data && (
            <li className="flex items-center gap-2 px-3 py-3 text-sm text-brand-slate">
              <CircleNotchIcon size={16} className="animate-spin" /> Buscando…
            </li>
          )}
          {results.data?.slice(0, 8).map((result) => {
            const already = movies.some((m) => m.id === result.id);
            return (
              <li key={result.tmdbId}>
                <button
                  type="button"
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

      {movies.length > 0 ? (
        <ol className="mt-4 flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
          {movies.map((movie, i) => (
            <li key={movie.id} className="flex items-center gap-3 p-2 pr-3 rounded-md bg-background/60">
              <span className="w-6 text-center text-sm text-brand-slate tabular-nums">{i + 1}</span>
              <MovieThumb title={movie.title} posterPath={movie.posterPath} />
              <span className="flex-1 min-w-0 truncate">
                {movie.title} {movie.releaseYear && <span className="text-brand-slate text-sm">{movie.releaseYear}</span>}
              </span>
              <IconButton label="Subir" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUpIcon size={16} /></IconButton>
              <IconButton label="Descer" disabled={i === movies.length - 1} onClick={() => move(i, 1)}><ArrowDownIcon size={16} /></IconButton>
              <IconButton label="Remover" onClick={() => setMovies(movies.filter((m) => m.id !== movie.id))}><XIcon size={16} /></IconButton>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-4 py-6 rounded-md border border-dashed border-foreground/10 text-center text-sm text-brand-slate/70">
          Busque acima para adicionar filmes. Dá para adicionar depois também, pela página de cada filme.
        </p>
      )}

      {error && <p className="mt-4 text-sm text-brand-crimson">{error}</p>}

      <div className="mt-8 flex justify-end gap-3">
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-sm text-brand-slate hover:text-foreground">
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 rounded-md bg-brand-btn text-brand-btn-text text-sm font-semibold hover:bg-brand-btn/90 disabled:opacity-60"
        >
          {saving ? "Salvando…" : list ? "Salvar" : "Criar lista"}
        </button>
      </div>
    </form>
  );
}

function Visibility({ active, onClick, icon, title, hint }: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-3 px-4 py-3 rounded-md text-left border transition-colors ${active ? "border-brand-orange/60 bg-brand-orange/5 text-foreground" : "border-foreground/10 text-brand-slate hover:border-foreground/25"}`}
    >
      <span className={active ? "text-brand-orange" : ""}>{icon}</span>
      <span>
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-brand-slate">{hint}</span>
      </span>
    </button>
  );
}
