import Image from "next/image";
import Link from "next/link";
import { LockSimpleIcon } from "@phosphor-icons/react";
import type { MovieList } from "@/lib/types/list";
import { posterUrl } from "@/utils/poster";

const STACK = 5;

export function listHref(list: { id: number }): string {
  return `/lista/${list.id}`;
}

const MINI_STACK = 3;

/** versão em linha para a coluna lateral do perfil: 3 pôsteres miúdos, o nome e quantos filmes tem */
export function ListRow({ list }: { list: MovieList }) {
  return (
    <Link href={listHref(list)} className="group flex items-center gap-3 -mx-2 px-2 py-2 rounded-md hover:bg-surface transition-colors">
      <div className="flex h-14 shrink-0">
        {Array.from({ length: MINI_STACK }, (_, i) => {
          const src = posterUrl(list.movies[i]?.posterPath, "w185");
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
          {!list.isPublic && (
            <LockSimpleIcon size={12} weight="bold" className="inline -mt-0.5 mr-1 text-brand-slate" aria-label="Privada">
              <title>Privada</title>
            </LockSimpleIcon>
          )}
          {list.name}
        </p>
        <p className="text-xs text-brand-slate">
          {list.filmsCount} {list.filmsCount === 1 ? "filme" : "filmes"}
        </p>
      </div>
    </Link>
  );
}

/** prévia de uma lista: os primeiros pôsteres empilhados, o nome e quantos filmes tem */
export function ListCard({ list, showOwner = false }: { list: MovieList; showOwner?: boolean }) {
  return (
    <Link href={listHref(list)} className="group block">
      <div className="relative flex h-32 sm:h-36 rounded-md bg-surface p-2 overflow-hidden ring-1 ring-inset ring-white/5 group-hover:ring-brand-orange/50 transition-shadow">
        {Array.from({ length: STACK }, (_, i) => {
          const movie = list.movies[i];
          const src = posterUrl(movie?.posterPath, "w185");
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
        {!list.isPublic && (
          <LockSimpleIcon size={14} weight="bold" className="inline -mt-0.5 mr-1.5 text-brand-slate" aria-label="Privada">
            <title>Privada</title>
          </LockSimpleIcon>
        )}
        {list.name}
      </h3>
      <p className="mt-0.5 text-sm text-brand-slate">
        {showOwner && <>{list.owner.name} · </>}
        {list.filmsCount} {list.filmsCount === 1 ? "filme" : "filmes"}
      </p>
    </Link>
  );
}
