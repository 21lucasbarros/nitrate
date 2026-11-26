"use client";

import { ArrowLeftIcon, CheckIcon, ImageIcon } from "@phosphor-icons/react";
import { useFetch } from "@/lib/hooks/use-fetch";
import type { Posters } from "@/lib/services/movie-service";
import { Poster } from "./ui/poster";

interface PosterPickerProps {
  /** id do filme ou da série no Nitrate */
  id: number;
  /** getMoviePosters ou getSeriesPosters (uma função estável, para o useFetch) */
  load: (id: number) => Promise<Posters>;
  kind: "movie" | "series";
  title: string;
  /** o pôster que aparece hoje */
  selected: string | null;
  /** `isDefault` = é o pôster do título (salvar volta ao padrão) */
  onPick: (path: string, isDefault: boolean) => void;
  onBack: () => void;
}

/**
 * Escolher, entre os pôsteres do filme ou da série no TMDB, o que aparece nas suas reviews, no diário
 * e nos favoritos.
 */
export function PosterPicker({ id, load, kind, title, selected, onPick, onBack }: PosterPickerProps) {
  const posters = useFetch(id, load);
  const theTitle = kind === "movie" ? "o filme" : "a série";
  const defaultLabel = kind === "movie" ? "Pôster do filme" : "Pôster da série";
  const where = kind === "movie"
    ? "nas suas reviews deste filme, no diário e nos favoritos"
    : "nos seus registros desta série (temporadas e episódios também) e no diário";

  return (
    <div className="flex flex-col gap-5">
      <div className="pr-10">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-brand-slate hover:text-foreground transition-colors"
        >
          <ArrowLeftIcon size={14} /> Voltar à review
        </button>
        <h2 className="mt-2 text-lg font-semibold truncate">Pôster de {title}</h2>
        <p className="mt-1 text-sm text-brand-slate">
          Aparece no seu perfil: {where}. No resto do Nitrate, {theTitle} continua com o pôster de sempre.
        </p>
      </div>

      {posters.error ? (
        <p className="py-10 text-center text-sm text-brand-slate">Não foi possível carregar os pôsteres.</p>
      ) : !posters.data ? (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3" aria-hidden="true">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="aspect-2/3 rounded-md bg-surface-strong animate-pulse" />
          ))}
        </div>
      ) : posters.data.posters.length <= 1 ? (
        <p className="py-10 text-center text-sm text-brand-slate">Não há outros pôsteres no TMDB.</p>
      ) : (
        <ul className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3 max-h-[min(60vh,600px)] overflow-y-auto -mx-1 px-1 py-1">
          {posters.data.posters.map((path) => {
            const active = selected === path;
            const isDefault = path === posters.data?.defaultPoster;
            return (
              <li key={path}>
                <button
                  type="button"
                  onClick={() => onPick(path, isDefault)}
                  aria-pressed={active}
                  aria-label={isDefault ? `Usar o ${defaultLabel.toLowerCase()}` : "Usar este pôster"}
                  className={`group relative block w-full rounded-md ring-2 transition-all ${active ? "ring-brand-orange" : "ring-transparent hover:ring-foreground/30"}`}
                >
                  <Poster title={title} posterPath={path} size="w185" sizes="(min-width: 640px) 140px, 30vw" />
                  {isDefault && (
                    <span className="absolute inset-x-0 bottom-0 rounded-b-md bg-black/70 px-1 py-1 text-center text-[11px] text-white">
                      {defaultLabel}
                    </span>
                  )}
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
    </div>
  );
}

interface ChangeablePosterProps {
  title: string;
  posterPath: string | null;
  /** já tem um pôster escolhido (no lugar do do título) */
  custom: boolean;
  onChange: () => void;
}

/** o pôster grande ao lado do formulário (desktop), que abre o seletor */
export function ChangeablePoster({ title, posterPath, custom, onChange }: ChangeablePosterProps) {
  return (
    <div className="hidden sm:flex flex-col gap-2">
      <button type="button" onClick={onChange} aria-label="Trocar o pôster no seu perfil" className="group relative block rounded-md">
        <Poster title={title} posterPath={posterPath} size="w500" sizes="180px" className="shadow-xl shadow-black/40" />
        <span className="absolute inset-0 flex items-end justify-center rounded-md bg-black/0 pb-3 text-sm font-medium text-white opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100 group-focus-visible:bg-black/40 group-focus-visible:opacity-100">
          Trocar pôster
        </span>
      </button>
      <button
        type="button"
        onClick={onChange}
        className="inline-flex items-center justify-center gap-1.5 text-xs text-brand-slate hover:text-foreground transition-colors"
      >
        <ImageIcon size={14} /> {custom ? "Pôster trocado" : "Trocar pôster"}
      </button>
    </div>
  );
}

/** o pôster pequeno do cabeçalho (celular), que abre o seletor */
export function ChangeablePosterSmall({ title, posterPath, onChange }: Omit<ChangeablePosterProps, "custom">) {
  return (
    <button type="button" onClick={onChange} aria-label="Trocar o pôster no seu perfil" className="relative w-14 shrink-0 sm:hidden">
      <Poster title={title} posterPath={posterPath} size="w185" sizes="56px" />
      <span className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-surface-strong ring-1 ring-foreground/15 flex items-center justify-center text-foreground/80">
        <ImageIcon size={13} />
      </span>
    </button>
  );
}
