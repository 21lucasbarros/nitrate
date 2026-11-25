"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowDownIcon, ArrowUpIcon, CircleNotchIcon, PlusIcon, XIcon } from "@phosphor-icons/react";
import { useFetch } from "@/lib/hooks/use-fetch";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { searchPeople } from "@/lib/services/person-service";
import { MAX_FAVORITE_PEOPLE, setMyFavoritePeople } from "@/lib/services/user-service";
import { departmentLabel, type FavoritePeopleKind, type FavoritePerson, type PersonSummary } from "@/types/person";
import { IconButton } from "./ui/icon-button";
import { Modal } from "./ui/modal";
import { SearchInput } from "./ui/search-input";
import { PersonPhoto } from "./ui/person-photo";
import { personHref } from "@/utils/person-link";

const LABELS: Record<FavoritePeopleKind, { title: string; search: string; department: string }> = {
  actors: {
    title: "Atores e atrizes favoritos",
    search: "Buscar um ator ou atriz",
    department: "Acting",
  },
  directors: {
    title: "Diretores favoritos",
    search: "Buscar um diretor ou diretora",
    department: "Directing",
  },
};

/**
 * Versão pequena da fileira, para a coluna lateral da aba Perfil: as 5 fotos cabem numa linha
 * (inclusive no celular), e o nome vai embaixo em letra miúda.
 */
export function FavoritePeopleCompact({ kind, people, isMe, onEdit }: {
  kind: FavoritePeopleKind;
  people: FavoritePerson[];
  isMe: boolean;
  onEdit: () => void;
}) {
  if (people.length === 0) {
    return isMe ? (
      <button
        onClick={onEdit}
        className="w-full flex items-center justify-center gap-2 py-5 rounded-md border border-dashed border-foreground/15 text-sm text-brand-slate hover:border-foreground/30 hover:text-foreground transition-colors"
      >
        <PlusIcon size={14} weight="bold" />
        {kind === "actors" ? "Escolher atores e atrizes" : "Escolher diretores"}
      </button>
    ) : null;
  }

  const item = "w-[calc((100%-3rem)/5)] max-w-20";

  return (
    <ol className="flex gap-3">
      {people.map((person) => (
        <li key={person.tmdbId} className={item}>
          <Link href={personHref(person)} title={person.name} className="group flex flex-col items-center gap-1.5 text-center">
            <PersonPhoto
              name={person.name}
              profilePath={person.profilePath}
              sizes="80px"
              className="w-full group-hover:ring-2 group-hover:ring-brand-orange transition-shadow"
            />
            <span className="text-[11px] leading-tight text-brand-slate group-hover:text-foreground line-clamp-2">{person.name}</span>
          </Link>
        </li>
      ))}
      {isMe && people.length < MAX_FAVORITE_PEOPLE && (
        <li className={item}>
          <button
            onClick={onEdit}
            aria-label="Adicionar favorito"
            className="w-full aspect-square flex items-center justify-center rounded-full border border-dashed border-foreground/15 text-brand-slate hover:border-foreground/30 hover:text-foreground transition-colors"
          >
            <PlusIcon size={16} />
          </button>
        </li>
      )}
    </ol>
  );
}

const MIN_QUERY = 2;

/** Modal para escolher e ordenar atores ou diretores favoritos. Salva a lista inteira de uma vez. */
export function FavoritePeopleEditor({ kind, initial, onClose, onSaved }: {
  /** null = fechado */
  kind: FavoritePeopleKind | null;
  initial: FavoritePerson[];
  onClose: () => void;
  onSaved: (kind: FavoritePeopleKind, people: FavoritePerson[]) => void;
}) {
  return (
    <Modal open={kind !== null} onClose={onClose} label={kind ? `Editar ${LABELS[kind].title.toLowerCase()}` : ""}>
      {/* key: reabrir o modal recomeça da lista salva */}
      {kind && (
        <Editor
          key={`${kind}:${initial.map((p) => p.tmdbId).join(",")}`}
          kind={kind}
          initial={initial}
          onClose={onClose}
          onSaved={(people) => onSaved(kind, people)}
        />
      )}
    </Modal>
  );
}

function Editor({ kind, initial, onClose, onSaved }: {
  kind: FavoritePeopleKind;
  initial: FavoritePerson[];
  onClose: () => void;
  onSaved: (people: FavoritePerson[]) => void;
}) {
  const [picks, setPicks] = useState<FavoritePerson[]>(initial);
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const labels = LABELS[kind];
  const debounced = useDebouncedValue(query.trim(), 350);
  const results = useFetch(debounced.length >= MIN_QUERY ? debounced : null, searchPeople);
  const full = picks.length >= MAX_FAVORITE_PEOPLE;

  // quem é do departamento da lista aparece primeiro (a busca do TMDB mistura atores e equipe)
  const sorted = results.data
    ? [...results.data].sort((a, b) => Number(b.department === labels.department) - Number(a.department === labels.department))
    : undefined;

  const add = (person: PersonSummary) => {
    if (full) return;
    setPicks((current) =>
      current.some((p) => p.tmdbId === person.tmdbId)
        ? current
        : [...current, { tmdbId: person.tmdbId, name: person.name, profilePath: person.profilePath, slug: person.slug }],
    );
    setQuery("");
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
      onSaved(await setMyFavoritePeople(kind, picks.map((p) => p.tmdbId)));
    } catch {
      setError("Não foi possível salvar. Tente novamente.");
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold">{labels.title}</h2>
      <p className="mt-1 text-sm text-brand-slate">Até {MAX_FAVORITE_PEOPLE}, na ordem em que aparecem no perfil.</p>

      <ol className="mt-6 flex flex-col gap-2">
        {picks.map((person, i) => (
          <li key={person.tmdbId} className="flex items-center gap-3 p-2 pr-3 rounded-md bg-background/60">
            <span className="w-5 text-center text-sm text-brand-slate tabular-nums">{i + 1}</span>
            <PersonPhoto name={person.name} profilePath={person.profilePath} sizes="40px" className="w-10 shrink-0" />
            <span className="flex-1 min-w-0 truncate">{person.name}</span>
            <IconButton label="Subir" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUpIcon size={16} /></IconButton>
            <IconButton label="Descer" disabled={i === picks.length - 1} onClick={() => move(i, 1)}><ArrowDownIcon size={16} /></IconButton>
            <IconButton label="Remover" onClick={() => setPicks(picks.filter((p) => p.tmdbId !== person.tmdbId))}><XIcon size={16} /></IconButton>
          </li>
        ))}
        {Array.from({ length: MAX_FAVORITE_PEOPLE - picks.length }, (_, i) => (
          <li key={`vazio-${i}`} className="flex items-center gap-3 p-2 rounded-md border border-dashed border-foreground/10 text-brand-slate/60 text-sm">
            <span className="w-5 text-center text-sm tabular-nums">{picks.length + i + 1}</span>
            <span className="w-10 h-10 rounded-full bg-foreground/5" />
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
            label={labels.search}
          />
          {debounced.length >= MIN_QUERY && (
            <ul className="mt-2 max-h-64 overflow-y-auto flex flex-col">
              {results.loading && !results.data && (
                <li className="flex items-center gap-2 px-3 py-3 text-sm text-brand-slate">
                  <CircleNotchIcon size={16} className="animate-spin" /> Buscando…
                </li>
              )}
              {sorted?.slice(0, 8).map((person) => {
                const already = picks.some((p) => p.tmdbId === person.tmdbId);
                const detail = [departmentLabel(person.department), ...person.knownFor.slice(0, 2)].filter(Boolean).join(" · ");
                return (
                  <li key={person.tmdbId}>
                    <button
                      onClick={() => add(person)}
                      disabled={already}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-left hover:bg-background/60 disabled:opacity-50 transition-colors"
                    >
                      <PersonPhoto name={person.name} profilePath={person.profilePath} sizes="40px" className="w-10 shrink-0" />
                      <span className="flex-1 min-w-0">
                        <span className="block truncate">{person.name}</span>
                        {detail && <span className="block text-xs text-brand-slate truncate">{detail}</span>}
                      </span>
                      <span className="text-xs text-brand-slate">{already ? "já está" : "adicionar"}</span>
                    </button>
                  </li>
                );
              })}
              {results.data?.length === 0 && <li className="px-3 py-3 text-sm text-brand-slate">Ninguém encontrado.</li>}
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
