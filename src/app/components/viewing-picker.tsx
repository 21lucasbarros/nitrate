"use client";

import Link from "next/link";
import { ArrowsClockwiseIcon, CaretRightIcon, ChatTextIcon, EyeIcon, HeartIcon } from "@phosphor-icons/react";
import type { FilmEntry } from "@/lib/types/review";
import { filmHref } from "@/utils/movie-link";
import { shortDate } from "@/utils/format";
import { toRating } from "@/utils/rating";
import { Modal } from "./ui/modal";
import { Poster } from "./ui/poster";
import { StarRating } from "./ui/star-rating";

/** Filme assistido mais de uma vez: escolhe qual das vezes (e qual review) abrir. */
export function ViewingPicker({ film, onClose }: { film: FilmEntry | null; onClose: () => void }) {
  const movie = film?.review.movie;
  const username = film?.review.user.username;

  return (
    <Modal open={film !== null} onClose={onClose} label={movie ? `Vezes que assistiu ${movie.title}` : "Vezes que assistiu"}>
      {film && movie && (
        <div>
          <div className="flex items-center gap-4 pr-10">
            <div className="w-14 shrink-0">
              <Poster title={movie.title} posterPath={movie.posterPath} size="w185" sizes="56px" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-brand-orange">
                Assistido {film.viewings.length} vezes
              </span>
              <h2 className="mt-1 text-xl font-semibold tracking-tight leading-tight truncate">
                {movie.title} {movie.releaseYear && <span className="font-normal text-foreground/40">{movie.releaseYear}</span>}
              </h2>
            </div>
          </div>

          <p className="mt-5 mb-2 text-sm text-brand-slate">Qual das vezes você quer ver?</p>
          <ol className="flex flex-col divide-y divide-foreground/10 border-y border-foreground/10">
            {film.viewings.map((viewing, i) => (
              <li key={viewing.id}>
                <Link
                  href={`/u/${username}/reviews/${viewing.id}`}
                  onClick={onClose}
                  className="group flex items-center gap-4 -mx-3 px-3 py-3.5 rounded-md hover:bg-surface-strong transition-colors"
                >
                  <span className="w-36 shrink-0">
                    <span className="block text-sm font-medium whitespace-nowrap">{viewing.watchedOn ? shortDate(viewing.watchedOn) : "Sem data"}</span>
                    <span className="block text-xs text-brand-slate">
                      {/* a lista vem do mais recente para o mais antigo */}
                      {i === film.viewings.length - 1 ? "Primeira vez" : i === 0 ? "Mais recente" : `${film.viewings.length - i}ª vez`}
                    </span>
                  </span>
                  <span className="flex flex-1 flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
                    {viewing.rating != null ? (
                      <StarRating rating={toRating(viewing.rating)} size={13} />
                    ) : (
                      <span className="text-xs text-brand-slate/60">sem nota</span>
                    )}
                    {viewing.liked && <HeartIcon size={13} weight="fill" className="text-brand-orange" aria-label="Curtido" />}
                    {viewing.rewatch && <ArrowsClockwiseIcon size={13} weight="bold" className="text-brand-emerald" aria-label="Reassistido" />}
                    {viewing.hasText && (
                      <span className="inline-flex items-center gap-1 text-xs text-brand-blue">
                        <ChatTextIcon size={13} weight="fill" /> review
                      </span>
                    )}
                  </span>
                  <CaretRightIcon size={16} className="shrink-0 text-brand-slate/50 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                </Link>
              </li>
            ))}
          </ol>

          <Link
            href={filmHref(movie)}
            onClick={onClose}
            className="mt-4 inline-flex items-center gap-1.5 text-sm text-brand-slate hover:text-foreground transition-colors"
          >
            <EyeIcon size={15} /> Ir para a página do filme
          </Link>
        </div>
      )}
    </Modal>
  );
}
