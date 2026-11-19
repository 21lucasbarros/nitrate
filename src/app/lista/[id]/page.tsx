"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CircleNotchIcon, LockSimpleIcon, PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react";

import Header from "@/app/components/header";
import { ListEditor } from "@/app/components/list-editor";
import { MovieGrid } from "@/app/components/movie-grid";
import { Avatar } from "@/app/components/ui/avatar";
import { Modal } from "@/app/components/ui/modal";
import { ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useFetch } from "@/lib/hooks/use-fetch";
import { deleteList, getList } from "@/lib/services/list-service";
import type { MovieList } from "@/lib/types/list";
import { monthYear } from "@/utils/format";

const fetchList = (id: string) => getList(Number(id));

export default function ListPage() {
  const { id } = useParams<{ id: string }>();
  const { status } = useAuth();
  // espera a sessão: listas privadas só carregam com o token da dona
  const list = useFetch(status === "loading" ? null : id, fetchList);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Header />
      <main className="pt-28 sm:pt-32 pb-24 px-6 max-w-[1100px] mx-auto">
        {list.data ? (
          <ListView list={list.data} onChange={list.setData} />
        ) : list.error instanceof ApiError && list.error.status === 404 ? (
          <div className="py-32 text-center">
            <h1 className="text-2xl font-semibold">Lista não encontrada.</h1>
            <p className="mt-3 text-brand-slate">Ela pode ter sido excluída ou ser privada.</p>
          </div>
        ) : list.error ? (
          <p className="py-32 text-center text-brand-slate">Não foi possível carregar a lista.</p>
        ) : (
          <div className="py-24 flex justify-center text-brand-slate/40">
            <CircleNotchIcon size={28} className="animate-spin" />
          </div>
        )}
      </main>
    </div>
  );
}

function ListView({ list, onChange }: { list: MovieList; onChange: (list: MovieList) => void }) {
  const { user: me } = useAuth();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isMine = me?.username === list.owner.username;

  const remove = async () => {
    setDeleting(true);
    try {
      await deleteList(list.id);
      router.push(`/u/${list.owner.username}?tab=listas`);
    } catch {
      setDeleting(false);
    }
  };

  return (
    <>
      <header className="pb-8 border-b border-foreground/10">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-[0.2em] uppercase text-brand-orange">
          {!list.isPublic && <LockSimpleIcon size={12} weight="bold" />}
          {list.isPublic ? "Lista" : "Lista privada"}
        </span>
        <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight">{list.name}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-brand-slate">
          <Link href={`/u/${list.owner.username}`} className="flex items-center gap-2 text-foreground/85 hover:text-brand-orange">
            <Avatar name={list.owner.name} username={list.owner.username} avatar={list.owner.avatar} size="xs" />
            {list.owner.name}
          </Link>
          <span aria-hidden="true">·</span>
          <span>
            {list.filmsCount} {list.filmsCount === 1 ? "filme" : "filmes"}
          </span>
          <span aria-hidden="true">·</span>
          <span>atualizada em {monthYear(list.updatedAt)}</span>
          {isMine && (
            <span className="flex gap-1 sm:ml-auto">
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-strong text-xs font-semibold text-foreground hover:bg-foreground/15 transition-colors"
              >
                <PencilSimpleIcon size={12} weight="bold" /> Editar
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                aria-label="Excluir lista"
                title="Excluir lista"
                className="p-2 rounded-md text-brand-slate hover:text-brand-crimson transition-colors"
              >
                <TrashIcon size={14} />
              </button>
            </span>
          )}
        </div>
        {list.description && (
          <p className="mt-5 max-w-2xl leading-relaxed text-foreground/85 whitespace-pre-line">{list.description}</p>
        )}
      </header>

      <section className="pt-8">
        {list.movies.length > 0 ? (
          <MovieGrid showTitles items={list.movies.map((movie) => ({ movie }))} />
        ) : (
          <p className="py-12 text-center text-brand-slate">
            {isMine ? "Sua lista está vazia. Toque em Editar para adicionar filmes." : "Esta lista ainda está vazia."}
          </p>
        )}
      </section>

      {isMine && (
        <>
          <ListEditor
            open={editing}
            list={list}
            onClose={() => setEditing(false)}
            onSaved={(saved) => {
              onChange(saved);
              setEditing(false);
            }}
          />
          <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} label="Excluir lista">
            <h2 className="pr-10 text-xl font-semibold">Excluir “{list.name}”?</h2>
            <p className="mt-2 text-sm text-brand-slate">Os filmes continuam no seu diário e na watchlist; só a lista some.</p>
            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setConfirmDelete(false)} className="px-4 py-2 rounded-md text-sm text-brand-slate hover:text-foreground">
                Cancelar
              </button>
              <button
                onClick={remove}
                disabled={deleting}
                className="px-5 py-2 rounded-md bg-brand-crimson text-background text-sm font-semibold hover:bg-brand-crimson/90 disabled:opacity-60"
              >
                {deleting ? "Excluindo…" : "Excluir"}
              </button>
            </div>
          </Modal>
        </>
      )}
    </>
  );
}
