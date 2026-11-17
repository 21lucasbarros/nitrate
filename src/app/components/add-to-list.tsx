"use client";

import { useState } from "react";
import { CheckIcon, CircleNotchIcon, LockSimpleIcon, PlusIcon } from "@phosphor-icons/react";
import { useFetch } from "@/lib/hooks/use-fetch";
import { addMovieToList, getMyLists, removeMovieFromList } from "@/lib/services/list-service";
import type { Movie } from "@/types/movie";
import { ListEditor } from "./list-editor";
import { Modal } from "./ui/modal";

/** Modal da página do filme: marca em quais das minhas listas ele está, ou cria uma nova com ele. */
export function AddToListModal({ open, movie, onClose }: { open: boolean; movie: Movie; onClose: () => void }) {
  const [creating, setCreating] = useState(false);

  return (
    <>
      <Modal open={open && !creating} onClose={onClose} label={`Adicionar ${movie.title} a uma lista`}>
        {open && !creating && <Picker movie={movie} onCreate={() => setCreating(true)} />}
      </Modal>
      <ListEditor
        open={open && creating}
        initialMovies={[movie]}
        onClose={() => setCreating(false)}
        onSaved={() => setCreating(false)}
      />
    </>
  );
}

function Picker({ movie, onCreate }: { movie: Movie; onCreate: () => void }) {
  const lists = useFetch(movie.id, getMyLists);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggle = async (listId: number, contains: boolean) => {
    if (!lists.data) return;
    setBusy(listId);
    setError(null);
    try {
      const updated = contains ? await removeMovieFromList(listId, movie.id) : await addMovieToList(listId, movie.id);
      lists.setData(lists.data.map((l) => (l.id === listId ? updated : l)));
    } catch {
      setError("Não foi possível atualizar a lista. Tente novamente.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <h2 className="pr-10 text-xl font-semibold">Adicionar à lista</h2>
      <p className="mt-1 text-sm text-brand-slate truncate">{movie.title}</p>

      <ul className="mt-6 flex flex-col gap-1 max-h-80 overflow-y-auto">
        {!lists.data && (
          <li className="flex justify-center py-8 text-brand-slate/50">
            <CircleNotchIcon size={22} className="animate-spin" />
          </li>
        )}
        {lists.data?.length === 0 && (
          <li className="py-4 text-sm text-brand-slate">Você ainda não tem listas. Crie a primeira:</li>
        )}
        {lists.data?.map((list) => {
          const contains = Boolean(list.containsMovie);
          return (
            <li key={list.id}>
              <button
                type="button"
                onClick={() => toggle(list.id, contains)}
                disabled={busy !== null}
                aria-pressed={contains}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-md text-left hover:bg-surface-strong disabled:opacity-60 transition-colors"
              >
                <span
                  className={`w-5 h-5 shrink-0 flex items-center justify-center rounded border transition-colors ${contains ? "bg-brand-orange border-brand-orange text-background" : "border-foreground/25"}`}
                >
                  {busy === list.id ? (
                    <CircleNotchIcon size={12} className="animate-spin" />
                  ) : (
                    contains && <CheckIcon size={12} weight="bold" />
                  )}
                </span>
                <span className="flex-1 min-w-0 truncate">{list.name}</span>
                {!list.isPublic && <LockSimpleIcon size={14} className="text-brand-slate" aria-label="Privada" />}
                <span className="text-xs text-brand-slate tabular-nums">{list.filmsCount}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {error && <p className="mt-3 text-sm text-brand-crimson">{error}</p>}

      <button
        type="button"
        onClick={onCreate}
        className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-md border border-dashed border-foreground/15 text-sm text-brand-slate hover:border-foreground/30 hover:text-foreground transition-colors"
      >
        <PlusIcon size={16} weight="bold" />
        Nova lista com este filme
      </button>
    </div>
  );
}
