import Image from "next/image";
import Link from "next/link";
import { ChatCircleIcon, HeartIcon, LockSimpleIcon, SealCheckIcon } from "@phosphor-icons/react";
import { listCountLabel, listItemInfo, listItems, type MovieList } from "@/lib/types/list";
import { posterUrl } from "@/utils/poster";
import { Avatar } from "./ui/avatar";

const STACK = 5;

/** a lista mora no perfil de quem criou: /u/lucas/lista/filmes-do-mesmo-universo */
export function listHref(list: { slug: string; owner: { username: string } }): string {
  return `/u/${list.owner.username}/lista/${list.slug}`;
}

/** selo das listas do Nitrate (feitas pelo admin), no lugar do nome da dona */
function OfficialBadge() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 font-medium text-foreground/90">
      <SealCheckIcon size={14} weight="fill" className="text-brand-orange" aria-hidden="true" />
      Nitrate
    </span>
  );
}

/** só o ícone do selo, antes do nome da lista */
function OfficialMark({ size }: { size: number }) {
  return (
    <SealCheckIcon size={size} weight="fill" className="inline -mt-0.5 mr-1 text-brand-orange" aria-label="Lista do Nitrate">
      <title>Lista do Nitrate</title>
    </SealCheckIcon>
  );
}

const MINI_STACK = 3;

/** versão em linha para a coluna lateral do perfil: 3 pôsteres miúdos, o nome e quantos títulos tem */
export function ListRow({ list }: { list: MovieList }) {
  return (
    <Link href={listHref(list)} className="group flex items-center gap-3 -mx-2 px-2 py-2 rounded-md hover:bg-surface transition-colors">
      <div className="flex h-14 shrink-0">
        {Array.from({ length: MINI_STACK }, (_, i) => {
          const item = listItems(list)[i];
          const src = posterUrl(item && listItemInfo(item).posterPath, "w185");
          return (
            <div
              key={i}
              style={{ zIndex: MINI_STACK - i }}
              className={`relative h-full aspect-2/3 overflow-hidden rounded-sm shadow-[2px_0_6px_rgba(0,0,0,0.5)] bg-surface-strong ${i > 0 ? "-ml-4" : ""}`}
            >
              {src && <Image src={src} alt="" fill sizes="40px" className="object-cover" />}
            </div>
          );
        })}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-brand-orange transition-colors">
          {list.official && <OfficialMark size={12} />}
          {!list.isPublic && (
            <LockSimpleIcon size={12} weight="bold" className="inline -mt-0.5 mr-1 text-brand-slate" aria-label="Privada">
              <title>Privada</title>
            </LockSimpleIcon>
          )}
          {list.name}
        </p>
        <p className="text-xs text-brand-slate">{listCountLabel(list)}</p>
      </div>
    </Link>
  );
}

/** prévia de uma lista: os primeiros pôsteres empilhados, o nome e quantos títulos tem */
export function ListCard({ list, showOwner = false }: { list: MovieList; showOwner?: boolean }) {
  return (
    <Link href={listHref(list)} className="group block">
      <div className="relative flex h-32 sm:h-36 rounded-md bg-surface p-2 overflow-hidden ring-1 ring-inset ring-white/5 group-hover:ring-brand-orange/50 transition-shadow">
        {Array.from({ length: STACK }, (_, i) => {
          const item = listItems(list)[i];
          const src = posterUrl(item && listItemInfo(item).posterPath, "w185");
          return (
            // cada pôster cobre um pedaço do anterior, como cartas na mesa
            <div
              key={i}
              style={{ zIndex: STACK - i }}
              className={`relative h-full aspect-2/3 shrink-0 overflow-hidden rounded shadow-[4px_0_12px_rgba(0,0,0,0.5)] bg-surface-strong ${i > 0 ? "-ml-[12%] sm:-ml-[9%]" : ""}`}
            >
              {src && <Image src={src} alt="" fill sizes="96px" className="object-cover" />}
            </div>
          );
        })}
      </div>
      <h3 className="mt-3 font-medium leading-snug group-hover:text-brand-orange transition-colors line-clamp-2">
        {list.official && !showOwner && <OfficialMark size={14} />}
        {!list.isPublic && (
          <LockSimpleIcon size={14} weight="bold" className="inline -mt-0.5 mr-1.5 text-brand-slate" aria-label="Privada">
            <title>Privada</title>
          </LockSimpleIcon>
        )}
        {list.name}
      </h3>
      <div className="mt-1 flex items-center gap-x-3 text-sm text-brand-slate">
        {showOwner && list.official && <OfficialBadge />}
        {showOwner && !list.official && (
          <span className="flex min-w-0 items-center gap-1.5 text-foreground/80">
            <Avatar name={list.owner.name} username={list.owner.username} avatar={list.owner.avatar} size="xs" />
            <span className="truncate">{list.owner.name}</span>
          </span>
        )}
        <span className="shrink-0">{listCountLabel(list)}</span>
        <ListCounts list={list} />
      </div>
    </Link>
  );
}

/** curtidas e comentários, só quando houver */
function ListCounts({ list }: { list: MovieList }) {
  return (
    <>
      {list.likesCount > 0 && (
        <span className="flex shrink-0 items-center gap-1" title={`${list.likesCount} ${list.likesCount === 1 ? "curtida" : "curtidas"}`}>
          <HeartIcon size={13} weight="fill" className="text-brand-orange" />
          <span className="tabular-nums">{list.likesCount}</span>
        </span>
      )}
      {list.commentsCount > 0 && (
        <span className="flex shrink-0 items-center gap-1" title={`${list.commentsCount} ${list.commentsCount === 1 ? "comentário" : "comentários"}`}>
          <ChatCircleIcon size={13} />
          <span className="tabular-nums">{list.commentsCount}</span>
        </span>
      )}
    </>
  );
}
