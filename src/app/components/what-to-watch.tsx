"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, ShuffleIcon } from "@phosphor-icons/react";
import type { Movie } from "@/types/movie";
import { filmHref } from "@/utils/movie-link";
import { posterUrl } from "@/utils/poster";
import { Modal } from "./ui/modal";

// a roleta: REEL_SIZE pôsteres passando, e o sorteado para em REEL_SIZE - REEL_TAIL
const REEL_SIZE = 30;
const REEL_TAIL = 3; // pôsteres depois do sorteado, para a fileira não acabar no meio da tela
const REEL_START = 2;

interface Reel {
  id: number;
  movies: Movie[];
  pick: Movie;
}

/** sorteia o filme e monta a fileira que passa até parar nele */
function buildReel(pool: Movie[]): Reel {
  const random = () => pool[Math.floor(Math.random() * pool.length)];
  const pick = random();
  const movies = Array.from({ length: REEL_SIZE }, random);
  movies[REEL_SIZE - REEL_TAIL - 1] = pick;
  return { id: Date.now(), movies, pick };
}

/** filmes que já estrearam (em produção não dá para dar o play); se não sobrar nenhum, todos */
function candidates(movies: Movie[]): Movie[] {
  const year = new Date().getFullYear();
  const released = movies.filter((m) => m.releaseYear === null || m.releaseYear <= year);
  return released.length > 0 ? released : movies;
}

/** "What Should I Watch?": sorteia um filme da própria watchlist */
export function WhatToWatchButton({ movies, className = "" }: { movies: Movie[]; className?: string }) {
  const [reel, setReel] = useState<Reel | null>(null);
  const pool = candidates(movies);

  if (pool.length === 0) return null;

  // o sorteio acontece no clique (e não no render), então cada clique é um sorteio novo
  const draw = () => setReel(buildReel(pool));

  return (
    <>
      <button
        type="button"
        onClick={draw}
        className={`inline-flex items-center gap-1.5 text-sm text-brand-orange hover:text-foreground transition-colors ${className}`}
      >
        <ShuffleIcon size={15} weight="bold" />
        O que eu assisto?
      </button>
      <Modal open={reel !== null} onClose={() => setReel(null)} label="What Should I Watch? Sorteio da watchlist">
        {reel && <Draw key={reel.id} reel={reel} poolSize={pool.length} onRedraw={draw} />}
      </Modal>
    </>
  );
}

function Draw({ reel, poolSize, onRedraw }: { reel: Reel; poolSize: number; onRedraw: () => void }) {
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
              {pick.releaseYear && <span className="text-lg font-normal text-foreground/50">{pick.releaseYear}</span>}
            </p>
            {(pick.director || pick.genres.length > 0) && (
              <p className="mt-2 text-sm text-brand-slate">
                {[pick.director && `de ${pick.director}`, pick.genres.slice(0, 2).join(", ")].filter(Boolean).join(" · ")}
              </p>
            )}
            <p className="mt-1 text-xs text-brand-slate/60">
              sorteado entre {poolSize} {poolSize === 1 ? "filme" : "filmes"} da sua watchlist
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
                href={filmHref(pick)}
                className="group inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-brand-btn text-brand-btn-text text-sm font-semibold hover:bg-brand-btn/90 transition-colors"
              >
                Ver o filme
                <ArrowRightIcon size={16} weight="bold" className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
