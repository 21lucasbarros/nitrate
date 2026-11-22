"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, ShuffleIcon } from "@phosphor-icons/react";
import type { Movie } from "@/types/movie";
import type { Series } from "@/types/series";
import { filmHref } from "@/utils/movie-link";
import { seriesHref } from "@/utils/series-link";
import { posterUrl } from "@/utils/poster";
import { Modal } from "./ui/modal";

// a roleta: REEL_SIZE pôsteres passando, e o sorteado para em REEL_SIZE - REEL_TAIL
const REEL_SIZE = 30;
const REEL_TAIL = 3; // pôsteres depois do sorteado, para a fileira não acabar no meio da tela
const REEL_START = 2;

/** o que entra no sorteio: um filme ou uma série, já com o endereço e a linha de detalhes */
interface Pick {
  id: number;
  title: string;
  year: number | null;
  posterPath: string | null;
  href: string;
  details: string | null;
}

interface Reel {
  id: number;
  movies: Pick[];
  pick: Pick;
}

// filmes e séries nunca se misturam no mesmo sorteio: cada watchlist tem o seu
const WORDS = {
  movies: { one: "filme", many: "filmes", draw: "Sortear um filme", open: "Ver o filme" },
  series: { one: "série", many: "séries", draw: "Sortear uma série", open: "Ver a série" },
};
type Words = (typeof WORDS)[keyof typeof WORDS];

/** sorteia e monta a fileira que passa até parar no sorteado */
function buildReel(pool: Pick[]): Reel {
  const random = () => pool[Math.floor(Math.random() * pool.length)];
  const pick = random();
  const movies = Array.from({ length: REEL_SIZE }, random);
  movies[REEL_SIZE - REEL_TAIL - 1] = pick;
  return { id: Date.now(), movies, pick };
}

/** o que já estreou (em produção não dá para dar o play); se não sobrar nada, tudo */
function candidates(items: Pick[]): Pick[] {
  const year = new Date().getFullYear();
  const released = items.filter((m) => m.year === null || m.year <= year);
  return released.length > 0 ? released : items;
}

function moviePick(movie: Movie): Pick {
  return {
    id: movie.id,
    title: movie.title,
    year: movie.releaseYear,
    posterPath: movie.posterPath,
    href: filmHref(movie),
    details: [movie.director && `de ${movie.director}`, movie.genres.slice(0, 2).join(", ")].filter(Boolean).join(" · ") || null,
  };
}

function seriesPick(series: Series): Pick {
  return {
    id: series.id,
    title: series.name,
    year: series.firstAirYear,
    posterPath: series.posterPath,
    href: seriesHref(series),
    details: [series.creators && `de ${series.creators}`, series.genres.slice(0, 2).join(", ")].filter(Boolean).join(" · ") || null,
  };
}

const BANNER_POSTERS = 3;

/**
 * "What Should I Watch?": sorteia um filme (ou, com `series`, uma série) da própria watchlist.
 * "link" é o atalho discreto (home); "banner" é o destaque no topo da aba Watchlist.
 */
export function WhatToWatchButton({ movies, series, variant = "link", className = "" }: {
  movies?: Movie[];
  series?: Series[];
  variant?: "link" | "banner";
  className?: string;
}) {
  const [reel, setReel] = useState<Reel | null>(null);
  const words = series ? WORDS.series : WORDS.movies;
  const pool = candidates(series ? series.map(seriesPick) : (movies ?? []).map(moviePick));

  if (pool.length === 0) return null;

  // o sorteio acontece no clique (e não no render), então cada clique é um sorteio novo
  const draw = () => setReel(buildReel(pool));

  return (
    <>
      {variant === "banner" ? (
        <Banner pool={pool} words={words} onDraw={draw} className={className} />
      ) : (
        <button
          type="button"
          onClick={draw}
          className={`inline-flex items-center gap-1.5 whitespace-nowrap text-sm text-brand-orange hover:text-foreground transition-colors ${className}`}
        >
          <ShuffleIcon size={15} weight="bold" />
          O que eu assisto?
        </button>
      )}
      <Modal open={reel !== null} onClose={() => setReel(null)} label="What Should I Watch? Sorteio da watchlist">
        {reel && <Draw key={reel.id} reel={reel} poolSize={pool.length} words={words} onRedraw={draw} />}
      </Modal>
    </>
  );
}

/** o convite para o sorteio: um leque de pôsteres da watchlist, a pergunta e o botão */
function Banner({ pool, words, onDraw, className }: { pool: Pick[]; words: Words; onDraw: () => void; className: string }) {
  // os primeiros com pôster, para o leque não ter buracos
  const fan = pool.filter((m) => m.posterPath).slice(0, BANNER_POSTERS);

  return (
    <div
      className={`relative flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-8 overflow-hidden rounded-lg bg-surface px-5 py-5 sm:px-7 ring-1 ring-inset ring-white/5 ${className}`}
    >
      {/* brilho laranja por trás do leque */}
      <div aria-hidden="true" className="pointer-events-none absolute -left-10 top-1/2 -translate-y-1/2 w-60 h-60 rounded-full bg-brand-orange/15 blur-3xl" />

      {fan.length > 0 && (
        <button type="button" onClick={onDraw} tabIndex={-1} aria-hidden="true" className="group relative hidden sm:flex shrink-0 h-28 w-36 ml-2">
          {fan.map((movie, i) => {
            const src = posterUrl(movie.posterPath, "w185");
            // as cartas abrem um pouco mais quando o mouse passa por cima
            const rotate = ["-rotate-12 group-hover:-rotate-[18deg]", "rotate-0", "rotate-12 group-hover:rotate-[18deg]"][i];
            const offset = ["left-0", "left-1/2 -translate-x-1/2", "right-0"][i];
            return (
              <div
                key={movie.id}
                style={{ zIndex: i === 1 ? 2 : 1 }}
                className={`absolute top-0 ${offset} h-full aspect-2/3 overflow-hidden rounded-md bg-surface-strong ring-1 ring-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.5)] origin-bottom transition-transform duration-300 ${rotate}`}
              >
                {src && <Image src={src} alt="" fill sizes="80px" className="object-cover" />}
              </div>
            );
          })}
        </button>
      )}

      <div className="relative flex-1 min-w-0">
        <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-brand-orange">What Should I Watch?</span>
        <h3 className="mt-1 text-lg sm:text-xl font-semibold tracking-tight">Não sabe o que assistir hoje?</h3>
        <p className="mt-1 text-sm text-brand-slate">
          Deixa com a gente: sorteamos {words === WORDS.series ? "uma entre as" : "um entre os"} {pool.length} {pool.length === 1 ? words.one : words.many} da sua watchlist.
        </p>
      </div>

      <button
        type="button"
        onClick={onDraw}
        className="group relative inline-flex items-center justify-center gap-2 shrink-0 px-5 py-3 rounded-md bg-brand-btn text-brand-btn-text font-semibold hover:bg-brand-btn/90 active:scale-[0.98] transition-all"
      >
        <ShuffleIcon size={18} weight="bold" className="group-hover:rotate-180 transition-transform duration-500" />
        {words.draw}
      </button>
    </div>
  );
}

function Draw({ reel, poolSize, words, onRedraw }: { reel: Reel; poolSize: number; words: Words; onRedraw: () => void }) {
  const [spinning, setSpinning] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // quem prefere menos movimento vê o resultado direto
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const id = requestAnimationFrame(() => {
        setSpinning(true);
        setDone(true);
      });
      return () => cancelAnimationFrame(id);
    }
    // dois frames: o navegador precisa pintar a posição inicial antes de a transição começar
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setSpinning(true));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, []);

  const position = spinning ? REEL_SIZE - REEL_TAIL - 1 : REEL_START;
  const { pick } = reel;

  return (
    <div>
      <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-brand-orange">What Should I Watch?</span>
      <h2 className="mt-1 text-xl font-semibold">{done ? "Hoje é dia de…" : "Sorteando da sua watchlist…"}</h2>

      {/* a roleta: pôsteres passando da direita para a esquerda, desacelerando até parar no centro */}
      <div className="relative mt-6 -mx-6 sm:-mx-8 h-[calc(var(--w)*1.5)] overflow-hidden [--w:7rem] sm:[--w:8.5rem] mask-[linear-gradient(to_right,transparent,black_25%,black_75%,transparent)]">
        <div
          onTransitionEnd={() => setDone(true)}
          className="absolute top-0 left-1/2 flex gap-4 transition-transform duration-3000 ease-[cubic-bezier(0.12,0.8,0.2,1)]"
          style={{ transform: `translateX(calc(-1 * (${position} * (var(--w) + 1rem) + var(--w) / 2)))` }}
        >
          {reel.movies.map((movie, i) => {
            const src = posterUrl(movie.posterPath, "w185");
            const isPick = done && i === position;
            return (
              <div
                key={i}
                className={`relative w-(--w) aspect-2/3 shrink-0 overflow-hidden rounded-md bg-surface-strong ring-1 ring-inset ring-white/10 transition-all duration-500 ${done && !isPick ? "opacity-30 scale-90" : ""} ${isPick ? "ring-2 ring-brand-orange shadow-[0_0_40px_rgba(255,122,51,0.35)]" : ""}`}
              >
                {src ? (
                  <Image src={src} alt="" fill sizes="140px" loading="eager" className="object-cover" />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center p-2 text-center text-[10px] text-foreground/40">
                    {movie.title}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className={`mt-6 text-center transition-all duration-500 ${done ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`} aria-live="polite">
        {done && (
          <>
            <p className="font-serif text-2xl sm:text-3xl font-semibold leading-tight">
              {pick.title}{" "}
              {pick.year && <span className="text-lg font-normal text-foreground/50">{pick.year}</span>}
            </p>
            {pick.details && <p className="mt-2 text-sm text-brand-slate">{pick.details}</p>}
            <p className="mt-1 text-xs text-brand-slate/60">
              {words === WORDS.series ? "sorteada" : "sorteado"} entre {poolSize} {poolSize === 1 ? words.one : words.many} da sua watchlist
            </p>
            <div className="mt-6 flex flex-col-reverse sm:flex-row justify-center gap-3">
              <button
                type="button"
                onClick={onRedraw}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md text-sm text-brand-slate hover:text-foreground hover:bg-surface-strong transition-colors"
              >
                <ShuffleIcon size={16} weight="bold" /> Sortear de novo
              </button>
              <Link
                href={pick.href}
                className="group inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-brand-btn text-brand-btn-text text-sm font-semibold hover:bg-brand-btn/90 transition-colors"
              >
                {words.open}
                <ArrowRightIcon size={16} weight="bold" className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
