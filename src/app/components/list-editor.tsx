"use client";

import { useState } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CircleNotchIcon,
  GlobeHemisphereWestIcon,
  LockSimpleIcon,
  TelevisionSimpleIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useFetch } from "@/lib/hooks/use-fetch";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { getMovieByTmdbId, searchMovies } from "@/lib/services/movie-service";
import { getSeriesByTmdbId, searchSeries } from "@/lib/services/series-service";
import { createList, updateList } from "@/lib/services/list-service";
import { listItemInfo, type ListItem, type MovieList, type MovieListRequest } from "@/lib/types/list";
import type { Movie } from "@/types/movie";
import { IconButton } from "./ui/icon-button";
import { Modal } from "./ui/modal";
import { SearchInput } from "./ui/search-input";
import { MovieThumb } from "./ui/movie-thumb";

const MIN_QUERY = 2;
const NAME_MAX = 100;
const DESCRIPTION_MAX = 2000;

type SaveList = (data: MovieListRequest, list: MovieList | null) => Promise<MovieList>;

// o padrão: a lista é de quem está logado
const saveOwnList: SaveList = (data, list) => (list ? updateList(list.id, data) : createList(data));

type SearchKind = "MOVIE" | "SERIES";

/** resultado da busca, igual para filmes e séries */
interface SearchHit {
  tmdbId: number;
  id: number | null; // já importado
  title: string;
  year: number | null;
  posterPath: string | null;
}

// a busca é uma função estável por tipo (o useFetch compara o argumento): "MOVIE|termo" / "SERIES|termo"
const search = async (key: string): Promise<SearchHit[]> => {
  const [kind, ...rest] = key.split("|");
  const query = rest.join("|");
  if (kind === "SERIES") {
    return (await searchSeries(query)).map((s) => ({ tmdbId: s.tmdbId, id: s.id, title: s.name, year: s.firstAirYear, posterPath: s.posterPath }));
  }
  return (await searchMovies(query)).map((m) => ({ tmdbId: m.tmdbId, id: m.id, title: m.title, year: m.releaseYear, posterPath: m.posterPath }));
};

/** Modal para criar uma lista ou editar uma existente (`list`). Salva tudo de uma vez. */
export function ListEditor({ open, list, initialMovies = [], save = saveOwnList, official = false, onClose, onSaved }: {
  open: boolean;
  /** lista completa (com todos os filmes) para editar; sem ela, cria uma nova */
  list?: MovieList | null;
  /** filmes já escolhidos ao criar (ex.: "nova lista" a partir da página de um filme) */
  initialMovies?: Movie[];
  /** troca onde a lista é salva (ex.: as listas do Nitrate, no painel de admin) */
  save?: SaveList;
  /** lista do Nitrate: a visibilidade fala em publicar na home e em rascunho */
  official?: boolean;
  onClose: () => void;
  onSaved: (list: MovieList) => void;
}) {
  return (
    <Modal open={open} onClose={onClose} label={list ? `Editar a lista ${list.name}` : "Nova lista"}>
      {/* key: reabrir o modal recomeça do que está salvo */}
      {open && <Editor key={list?.updatedAt ?? "nova"} list={list ?? null} initialMovies={initialMovies} save={save} official={official} onClose={onClose} onSaved={onSaved} />}
    </Modal>
  );
}

function Editor({ list, initialMovies, save: saveList, official, onClose, onSaved }: {
  list: MovieList | null;
  initialMovies: Movie[];
  save: SaveList;
  official: boolean;
  onClose: () => void;
  onSaved: (list: MovieList) => void;
}) {
  const [name, setName] = useState(list?.name ?? "");
  const [description, setDescription] = useState(list?.description ?? "");
  const [isPublic, setIsPublic] = useState(list?.isPublic ?? true);
  const [items, setItems] = useState<ListItem[]>(
    list?.items ?? initialMovies.map((movie): ListItem => ({ kind: "MOVIE", movie, series: null })),
  );
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<SearchKind>("MOVIE");
  const [adding, setAdding] = useState<number | null>(null); // tmdbId sendo importado
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounced = useDebouncedValue(query.trim(), 350);
  const results = useFetch(debounced.length >= MIN_QUERY ? `${kind}|${debounced}` : null, search);
  const keys = new Set(items.map((item) => listItemInfo(item).key));
  const isSeries = kind === "SERIES";

  const add = async (hit: SearchHit) => {
    setError(null);
    setAdding(hit.tmdbId);
    try {
      // ainda não importado: o backend importa do TMDB na primeira vez
      const item: ListItem = isSeries
        ? { kind: "SERIES", movie: null, series: await getSeriesByTmdbId(hit.tmdbId) }
        : { kind: "MOVIE", movie: await getMovieByTmdbId(hit.tmdbId), series: null };
      setItems((current) => (current.some((i) => listItemInfo(i).key === listItemInfo(item).key) ? current : [...current, item]));
      setQuery("");
    } catch {
      setError(isSeries ? "Não foi possível adicionar essa série agora." : "Não foi possível adicionar esse filme agora.");
    } finally {
      setAdding(null);
    }
  };

  const move = (index: number, delta: number) => {
    setItems((current) => {
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
    const data: MovieListRequest = {
      name: name.trim(),
      description: description.trim(),
      isPublic,
      movieIds: items.flatMap((item) => (item.kind === "MOVIE" ? [item.movie.id] : [])),
      items: items.map((item) => ({ kind: item.kind, id: item.kind === "MOVIE" ? item.movie.id : item.series.id })),
    };
    try {
      onSaved(await saveList(data, list));
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
          <Visibility active={isPublic} onClick={() => setIsPublic(true)} icon={<GlobeHemisphereWestIcon size={18} />} title="Pública" hint={official ? "Aparece na home de todo mundo" : "Aparece no seu perfil"} />
          <Visibility active={!isPublic} onClick={() => setIsPublic(false)} icon={<LockSimpleIcon size={18} />} title={official ? "Rascunho" : "Privada"} hint={official ? "Só no painel, até publicar" : "Só você vê"} />
        </fieldset>
      </div>

      <h3 className="mt-8 text-sm font-medium text-foreground/90">
        Filmes e séries <span className="ml-1 font-normal text-brand-slate/70">{items.length}</span>
      </h3>

      <div className="mt-3 flex gap-2">
        {/* o que a busca procura: filmes ou séries (a lista aceita os dois, misturados) */}
        <div role="radiogroup" aria-label="Buscar" className="flex shrink-0 h-10 p-0.5 rounded-md ring-1 ring-foreground/10 bg-background/60">
          {(["MOVIE", "SERIES"] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={kind === option}
              onClick={() => setKind(option)}
              className={`px-3 rounded text-sm transition-colors ${kind === option ? "bg-foreground/10 text-foreground" : "text-brand-slate hover:text-foreground"}`}
            >
              {option === "MOVIE" ? "Filmes" : "Séries"}
            </button>
          ))}
        </div>
        <SearchInput
          tone="panel"
          value={query}
          onChange={setQuery}
          pending={results.loading}
          label={isSeries ? "Buscar uma série para adicionar" : "Buscar um filme para adicionar"}
          className="flex-1 min-w-0"
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
            const already = result.id !== null && keys.has(`${isSeries ? "S" : "M"}${result.id}`);
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
                    {result.title} {result.year && <span className="text-brand-slate text-sm">{result.year}</span>}
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
          {results.data?.length === 0 && (
            <li className="px-3 py-3 text-sm text-brand-slate">{isSeries ? "Nenhuma série encontrada." : "Nenhum filme encontrado."}</li>
          )}
        </ul>
      )}

      {items.length > 0 ? (
        <ol className="mt-4 flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
          {items.map((item, i) => {
            const info = listItemInfo(item);
            return (
              <li key={info.key} className="flex items-center gap-3 p-2 pr-3 rounded-md bg-background/60">
                <span className="w-6 text-center text-sm text-brand-slate tabular-nums">{i + 1}</span>
                <MovieThumb title={info.title} posterPath={info.posterPath} />
                <span className="flex-1 min-w-0 truncate">
                  {info.title} {info.year && <span className="text-brand-slate text-sm">{info.year}</span>}
                </span>
                {item.kind === "SERIES" && (
                  <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-brand-slate" title="Série">
                    <TelevisionSimpleIcon size={12} weight="bold" className="text-brand-orange" /> série
                  </span>
                )}
                <IconButton label="Subir" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUpIcon size={16} /></IconButton>
                <IconButton label="Descer" disabled={i === items.length - 1} onClick={() => move(i, 1)}><ArrowDownIcon size={16} /></IconButton>
                <IconButton label="Remover" onClick={() => setItems(items.filter((other) => listItemInfo(other).key !== info.key))}><XIcon size={16} /></IconButton>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="mt-4 py-6 rounded-md border border-dashed border-foreground/10 text-center text-sm text-brand-slate/70">
          Busque acima para adicionar filmes e séries. Filmes dá para adicionar depois também, pela página de cada um.
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
