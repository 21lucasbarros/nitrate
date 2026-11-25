"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeftIcon, CheckIcon, DeviceMobileIcon, FilmSlateIcon, MonitorIcon, WarningIcon } from "@phosphor-icons/react";
import { ApiError } from "@/lib/api-client";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { useFetch } from "@/lib/hooks/use-fetch";
import { searchMovies } from "@/lib/services/movie-service";
import { getMovieBackdrops, setMyCover } from "@/lib/services/user-service";
import type { ProfileCover, UserProfile } from "@/lib/types/user";
import type { MovieSearchResult } from "@/types/movie";
import { backdropUrl, posterUrl } from "@/utils/poster";
import { Modal } from "./ui/modal";
import { SearchInput } from "./ui/search-input";

const MIN_QUERY = 2;
const MAX_RESULTS = 8;

type Position = { x: number; y: number };

/** sem enquadramento salvo: um pouco acima do meio, onde costumam estar os rostos */
const DEFAULT_POSITION: Position = { x: 50, y: 30 };

/** o object-position do fundo do perfil */
export function coverPosition(cover: Pick<ProfileCover, "x" | "y"> | null | undefined): string {
  return `${cover?.x ?? DEFAULT_POSITION.x}% ${cover?.y ?? DEFAULT_POSITION.y}%`;
}

function positionOf(cover: UserProfile["cover"]): Position {
  return { x: cover?.x ?? DEFAULT_POSITION.x, y: cover?.y ?? DEFAULT_POSITION.y };
}

interface CoverPickerProps {
  open: boolean;
  onClose: () => void;
  /** o fundo atual: o seletor já abre nas cenas desse filme, com a cena marcada */
  current: UserProfile["cover"];
  onSaved: (profile: UserProfile) => void;
}

/** Escolher o fundo do perfil: pesquisa um filme, escolhe uma das cenas dele no TMDB e o enquadramento. */
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
  const [position, setPosition] = useState<Position>(() => positionOf(current));
  const [adjusting, setAdjusting] = useState(false);
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

  // a cena que já é o fundo volta com o enquadramento salvo; uma nova começa do padrão
  const pickScene = (path: string) => {
    setSelected(path);
    setPosition(path === current?.path ? positionOf(current) : DEFAULT_POSITION);
  };

  const save = async () => {
    if (tmdbId === null || !selected) return;
    setBusy(true);
    setError(null);
    try {
      onSaved(await setMyCover(tmdbId, selected, { x: Math.round(position.x), y: Math.round(position.y) }));
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

  if (adjusting && selected) {
    const src = backdropUrl(selected, "w1280")!;
    const isDefault = position.x === DEFAULT_POSITION.x && position.y === DEFAULT_POSITION.y;
    return (
      <div className="flex flex-col gap-5">
        <div className="pr-10">
          <button
            type="button"
            onClick={() => setAdjusting(false)}
            className="inline-flex items-center gap-1.5 text-sm text-brand-slate hover:text-foreground transition-colors"
          >
            <ArrowLeftIcon size={14} /> Outra cena
          </button>
          <h2 className="mt-2 text-lg font-semibold">Enquadrar a cena</h2>
          <p className="mt-1 text-sm text-brand-slate">
            Arraste a cena para mostrar o que importa. No computador o topo do perfil é largo e no celular é quase quadrado: confira os dois.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="inline-flex items-center gap-1.5 text-xs text-brand-slate">
            <MonitorIcon size={14} /> Computador
          </span>
          {/* o fundo ocupa a largura da tela com 440px de altura: perto de 3 por 1 */}
          <CropFrame src={src} position={position} onChange={setPosition} label="computador" sizes="600px" className="aspect-[3/1]" />
        </div>

        <div className="flex items-end gap-4">
          <div className="flex flex-col gap-1.5 shrink-0">
            <span className="inline-flex items-center gap-1.5 text-xs text-brand-slate">
              <DeviceMobileIcon size={14} /> Celular
            </span>
            {/* 340px de altura numa tela de uns 390px */}
            <CropFrame src={src} position={position} onChange={setPosition} label="celular" sizes="160px" className="w-36 sm:w-40 aspect-[39/34]" />
          </div>
          {!isDefault && (
            <button
              type="button"
              onClick={() => setPosition(DEFAULT_POSITION)}
              className="mb-1 text-sm text-brand-slate hover:text-foreground transition-colors"
            >
              Voltar ao padrão
            </button>
          )}
        </div>

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
            disabled={busy}
            className="px-4 py-2 rounded-md bg-brand-btn text-brand-btn-text text-sm font-semibold hover:bg-brand-btn/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {busy ? "Salvando…" : "Salvar fundo"}
          </button>
        </div>
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
                  onClick={() => pickScene(path)}
                  onDoubleClick={() => setAdjusting(true)}
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

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-sm text-brand-slate hover:text-foreground">
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => setAdjusting(true)}
          disabled={!selected}
          className="px-4 py-2 rounded-md bg-brand-btn text-brand-btn-text text-sm font-semibold hover:bg-brand-btn/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Usar esta cena
        </button>
      </div>
    </div>
  );
}

/**
 * Uma prévia do topo do perfil com a cena em object-cover: arrastar (ou as setas) muda o enquadramento.
 * A cena cobre a moldura e sobra para um dos lados; é só nessa sobra que dá para mover, então a moldura
 * larga ajusta a altura e a estreita, os lados.
 */
function CropFrame({ src, position, onChange, label, sizes, className }: {
  src: string;
  position: Position;
  onChange: (position: Position) => void;
  label: string;
  sizes: string;
  className: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [ratio, setRatio] = useState(16 / 9); // as cenas do TMDB quase sempre são 16:9; o onLoad confirma
  const drag = useRef<{ pointerX: number; pointerY: number; start: Position } | null>(null);

  /** quantos px da cena ficam de fora da moldura, na largura e na altura */
  const overflow = () => {
    const box = ref.current!.getBoundingClientRect();
    return {
      x: Math.max(box.width, box.height * ratio) - box.width,
      y: Math.max(box.height, box.width / ratio) - box.height,
    };
  };

  // arrastar a cena para a direita mostra mais da esquerda dela: a posição anda ao contrário do dedo
  const moveBy = (start: Position, dx: number, dy: number) => {
    const extra = overflow();
    onChange({
      x: extra.x > 0 ? clampPercent(start.x - (dx / extra.x) * 100) : start.x,
      y: extra.y > 0 ? clampPercent(start.y - (dy / extra.y) * 100) : start.y,
    });
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { pointerX: e.clientX, pointerY: e.clientY, start: position };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (d) moveBy(d.start, e.clientX - d.pointerX, e.clientY - d.pointerY);
  };

  const handlePointerUp = () => {
    drag.current = null;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 40 : 10; // em px, como se a cena fosse arrastada
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    if (moves[e.key]) {
      e.preventDefault();
      moveBy(position, ...moves[e.key]);
    }
  };

  return (
    <div
      ref={ref}
      tabIndex={0}
      role="application"
      aria-label={`Enquadramento no ${label}. Arraste ou use as setas para mover a cena.`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={handleKeyDown}
      className={`relative overflow-hidden rounded-md bg-surface-strong ring-1 ring-foreground/10 touch-none select-none cursor-grab active:cursor-grabbing focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue ${className}`}
    >
      <Image
        src={src}
        alt=""
        fill
        sizes={sizes}
        draggable={false}
        onLoad={(e) => {
          const img = e.currentTarget;
          if (img.naturalWidth && img.naturalHeight) setRatio(img.naturalWidth / img.naturalHeight);
        }}
        className="object-cover pointer-events-none"
        style={{ objectPosition: `${position.x}% ${position.y}%` }}
      />
      {/* o perfil desbota a cena para o fundo embaixo: o pé da prévia também, para não esconder nada importante ali */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-background/70 to-transparent pointer-events-none" />
    </div>
  );
}

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}
