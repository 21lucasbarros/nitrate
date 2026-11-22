"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  TelevisionSimpleIcon,
  BookmarkSimpleIcon,
  ChatCircleIcon,
  CheckIcon,
  CircleNotchIcon,
  HeartIcon,
  LinkSimpleIcon,
  LockSimpleIcon,
  PencilSimpleIcon,
  SealCheckIcon,
  TrashIcon,
} from "@phosphor-icons/react";

import Header from "@/app/components/header";
import { ListComments } from "@/app/components/list-comments";
import { listHref } from "@/app/components/list-card";
import { ListEditor } from "@/app/components/list-editor";
import { MovieGrid } from "@/app/components/movie-grid";
import { Avatar } from "@/app/components/ui/avatar";
import { Modal } from "@/app/components/ui/modal";
import { ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useFetch } from "@/lib/hooks/use-fetch";
import { deleteList, getListBySlug, likeList, saveList, unlikeList, unsaveList } from "@/lib/services/list-service";
import { listCountLabel, listItemInfo, listItems, type ListEngagement, type MovieList } from "@/lib/types/list";
import { seriesHref } from "@/utils/series-link";
import { monthYear } from "@/utils/format";
import { posterUrl } from "@/utils/poster";

const fetchList = (key: string) => {
  const [username, slug] = key.split("/");
  return getListBySlug(username, slug);
};

// pôsteres no fundo do topo da página
const BACKDROP_POSTERS = 8;

export default function ListPage() {
  const { username, slug } = useParams<{ username: string; slug: string }>();
  const { status } = useAuth();
  // espera a sessão: listas privadas só carregam com o token da dona
  const list = useFetch(status === "loading" ? null : `${username}/${slug}`, fetchList);

  return (
    <div className="relative min-h-screen bg-background text-foreground font-sans">
      <Header />
      {list.data ? (
        <ListView list={list.data} onChange={list.setData} />
      ) : (
        <main className="pt-28 sm:pt-32 pb-24 px-6 max-w-[1100px] mx-auto">
          {list.error instanceof ApiError && list.error.status === 404 ? (
            <div className="py-32 text-center">
              <h1 className="text-2xl font-semibold">Lista não encontrada.</h1>
              <p className="mt-3 text-brand-slate">Ela pode ter sido excluída, renomeada ou ser privada.</p>
              <Link href={`/u/${username}?tab=listas`} className="mt-6 inline-block text-sm text-brand-orange hover:underline">
                Ver as listas de @{username}
              </Link>
            </div>
          ) : list.error ? (
            <p className="py-32 text-center text-brand-slate">Não foi possível carregar a lista.</p>
          ) : (
            <div className="py-24 flex justify-center text-brand-slate/40">
              <CircleNotchIcon size={28} className="animate-spin" />
            </div>
          )}
        </main>
      )}
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

  const updateEngagement = (engagement: ListEngagement) => onChange({ ...list, ...engagement });

  return (
    <>
      <Backdrop list={list} />

      <main className="relative pt-28 sm:pt-36 pb-24 px-6 max-w-[1100px] mx-auto">
        <header className="max-w-3xl">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-[0.2em] uppercase text-brand-orange">
            {!list.isPublic && <LockSimpleIcon size={12} weight="bold" />}
            {list.isPublic ? "Lista" : "Lista privada"}
          </span>
          <h1 className="mt-3 text-3xl sm:text-5xl font-semibold tracking-tight leading-[1.1] text-balance">{list.name}</h1>

          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-brand-slate">
            <Link href={`/u/${list.owner.username}`} className="group flex items-center gap-2.5">
              {/* lista do Nitrate: o selo no lugar da foto */}
              {list.official ? (
                <SealCheckIcon size={32} weight="fill" className="text-brand-orange" aria-hidden="true" />
              ) : (
                <Avatar name={list.owner.name} username={list.owner.username} avatar={list.owner.avatar} size="sm" />
              )}
              <span>
                <span className="text-brand-slate">{list.official ? "Lista do " : "Lista de "}</span>
                <span className="font-medium text-foreground group-hover:text-brand-orange transition-colors">{list.owner.name}</span>
              </span>
            </Link>
            <span aria-hidden="true">·</span>
            <span>{listCountLabel(list)}</span>
            <span aria-hidden="true">·</span>
            <span>atualizada em {monthYear(list.updatedAt)}</span>
          </div>

          {list.description && (
            <p className="mt-6 text-[17px] leading-relaxed text-foreground/85 whitespace-pre-line">{list.description}</p>
          )}
        </header>

        <div className="mt-8 flex flex-wrap items-center gap-2 pb-8 border-b border-foreground/10">
          <LikeButton list={list} isMine={isMine} onChange={updateEngagement} />
          {!isMine && <SaveButton list={list} onChange={updateEngagement} />}
          <a href="#comentarios" className={pill}>
            <ChatCircleIcon size={18} />
            <span className="tabular-nums">{list.commentsCount}</span>
            <span className="hidden sm:inline">{list.commentsCount === 1 ? "comentário" : "comentários"}</span>
          </a>
          <ShareButton list={list} />
          {isMine && (
            <span className="flex gap-2 sm:ml-auto">
              <button onClick={() => setEditing(true)} className={pill}>
                <PencilSimpleIcon size={16} /> Editar
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                aria-label="Excluir lista"
                title="Excluir lista"
                className={`${pill} hover:text-brand-crimson!`}
              >
                <TrashIcon size={16} />
              </button>
            </span>
          )}
        </div>

        <section className="pt-10">
          {listItems(list).length > 0 ? (
            <MovieGrid
              showTitles
              items={listItems(list).map((item) =>
                item.kind === "MOVIE"
                  ? { movie: item.movie }
                  : {
                      // série: o pôster leva à página dela, com o selo para não passar por filme
                      movie: { id: `series-${item.series.id}`, title: item.series.name, posterPath: item.series.posterPath, releaseYear: item.series.firstAirYear },
                      href: seriesHref(item.series),
                      badge: (
                        <>
                          <TelevisionSimpleIcon size={11} weight="bold" className="text-brand-orange" /> Série
                        </>
                      ),
                    },
              )}
            />
          ) : (
            <p className="py-12 text-center text-brand-slate">
              {isMine ? "Sua lista está vazia. Toque em Editar para adicionar filmes." : "Esta lista ainda está vazia."}
            </p>
          )}
        </section>

        <div className="max-w-2xl">
          <ListComments
            list={list}
            onCountChange={(delta) => onChange({ ...list, commentsCount: list.commentsCount + delta })}
          />
        </div>
      </main>

      {isMine && (
        <>
          <ListEditor
            open={editing}
            list={list}
            onClose={() => setEditing(false)}
            onSaved={(saved) => {
              // renomear muda o endereço: troca a URL sem empilhar no histórico
              onChange({ ...list, ...saved });
              setEditing(false);
              if (saved.slug !== list.slug) router.replace(listHref(saved));
            }}
          />
          <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} label="Excluir lista">
            <h2 className="pr-10 text-xl font-semibold">Excluir “{list.name}”?</h2>
            <p className="mt-2 text-sm text-brand-slate">
              Os filmes continuam no seu diário e na watchlist; só a lista some, junto com curtidas e comentários.
            </p>
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

const pill =
  "inline-flex items-center gap-2 h-9 px-3.5 rounded-full bg-surface text-sm text-brand-slate hover:text-foreground hover:bg-surface-strong transition-colors disabled:opacity-60";

/** os primeiros pôsteres lado a lado, desfocados, desbotando para o fundo da página */
function Backdrop({ list }: { list: MovieList }) {
  const posters = listItems(list)
    .map((item) => posterUrl(listItemInfo(item).posterPath, "w342"))
    .filter((src): src is string => Boolean(src))
    .slice(0, BACKDROP_POSTERS);
  if (posters.length === 0) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[460px] sm:h-[520px] overflow-hidden">
      <div className="absolute inset-0 flex scale-110 blur-2xl opacity-40 saturate-150">
        {posters.map((src, i) => (
          <div key={i} className="relative flex-1 h-full">
            <Image src={src} alt="" fill sizes="20vw" className="object-cover" />
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-linear-to-b from-background/60 via-background/70 to-background" />
    </div>
  );
}

/** curtir a lista. A dona só vê quantas curtidas recebeu. */
function LikeButton({ list, isMine, onChange }: {
  list: MovieList;
  isMine: boolean;
  onChange: (engagement: ListEngagement) => void;
}) {
  const { status } = useAuth();
  const [busy, setBusy] = useState(false);
  const count = list.likesCount;
  const liked = list.likedByMe ?? false;
  const content = (
    <>
      <HeartIcon
        size={18}
        weight={liked || (isMine && count > 0) ? "fill" : "regular"}
        className={`transition-transform ${liked || (isMine && count > 0) ? "text-brand-orange" : ""} ${liked ? "scale-110" : ""}`}
      />
      <span className="tabular-nums">{count}</span>
      <span className="hidden sm:inline">{count === 1 ? "curtida" : "curtidas"}</span>
    </>
  );

  if (isMine) return <span className={`${pill} hover:bg-surface! hover:text-brand-slate! cursor-default`}>{content}</span>;

  if (status !== "authenticated") {
    return (
      <Link href={`/sign-in?redirect=${encodeURIComponent(listHref(list))}`} className={pill}>
        {content}
      </Link>
    );
  }

  const toggle = async () => {
    const before: ListEngagement = list;
    setBusy(true);
    // otimista: o coração responde na hora; a resposta do servidor confirma o número
    onChange({ ...list, likedByMe: !liked, likesCount: count + (liked ? -1 : 1) });
    try {
      onChange(liked ? await unlikeList(list.id) : await likeList(list.id));
    } catch {
      onChange(before);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={liked}
      className={`${pill} ${liked ? "text-brand-orange! bg-brand-orange/10 hover:bg-brand-orange/15" : ""}`}
    >
      {content}
      <span className="sr-only">{liked ? "Descurtir a lista" : "Curtir a lista"}</span>
    </button>
  );
}

/** salvar a lista de outra pessoa para ver depois (aparece no perfil, aba Listas) */
function SaveButton({ list, onChange }: { list: MovieList; onChange: (engagement: ListEngagement) => void }) {
  const { status } = useAuth();
  const [busy, setBusy] = useState(false);
  const saved = list.savedByMe ?? false;
  const content = (
    <>
      <BookmarkSimpleIcon size={18} weight={saved ? "fill" : "regular"} />
      {saved ? "Salva" : "Salvar"}
    </>
  );

  if (status !== "authenticated") {
    return (
      <Link href={`/sign-in?redirect=${encodeURIComponent(listHref(list))}`} className={pill}>
        {content}
      </Link>
    );
  }

  const toggle = async () => {
    const before: ListEngagement = list;
    setBusy(true);
    onChange({ ...list, savedByMe: !saved });
    try {
      onChange(saved ? await unsaveList(list.id) : await saveList(list.id));
    } catch {
      onChange(before);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={saved}
      title={saved ? "Remover das listas salvas" : "Salvar para ver depois"}
      className={`${pill} ${saved ? "text-foreground! bg-surface-strong" : ""}`}
    >
      {content}
    </button>
  );
}

function ShareButton({ list }: { list: MovieList }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = `${window.location.origin}${listHref(list)}`;
    // celular: folha de compartilhar; computador: copia o link
    if (navigator.share) {
      try {
        await navigator.share({ title: list.official ? `${list.name}, lista do Nitrate` : `${list.name}, lista de ${list.owner.name} no Nitrate`, url });
      } catch {
        // cancelou
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button type="button" onClick={share} className={pill}>
      {copied ? <CheckIcon size={18} className="text-brand-orange" /> : <LinkSimpleIcon size={18} />}
      <span className="hidden sm:inline">{copied ? "Link copiado" : "Compartilhar"}</span>
    </button>
  );
}
