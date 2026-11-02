"use client";

import { useState } from "react";
import Link from "next/link";
import { EyeIcon, HeartIcon, WarningIcon } from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth-context";
import type { MovieReview } from "@/lib/types/review";
import { toRating } from "@/utils/rating";
import { shortDate, timeAgo } from "@/utils/format";
import { StarRating } from "./ui/star-rating";
import { Poster } from "./ui/poster";
import { Avatar } from "./ui/avatar";

interface ReviewCardProps {
  review: MovieReview;
  /** esconde o pôster/título (ex.: na página do próprio filme) */
  hideMovie?: boolean;
  /** esconde o autor (ex.: no perfil, onde o autor é óbvio) */
  hideUser?: boolean;
  /** mostra só o começo do texto, com um link para a review completa */
  excerpt?: boolean;
}

// a partir deste tamanho o texto é cortado no modo resumo
const EXCERPT_LENGTH = 280;

export function reviewHref(review: MovieReview): string {
  return `/u/${review.user.username}/reviews/${review.id}`;
}

export function ReviewCard({ review, hideMovie = false, hideUser = false, excerpt = false }: ReviewCardProps) {
  const { movie, user } = review;
  const { user: me } = useAuth();
  const [revealed, setRevealed] = useState(false);
  // o autor sempre vê a própria review; os outros precisam pedir para ver
  const isOwn = me?.username === user.username;
  const hideText = review.spoiler && !isOwn && !revealed;

  return (
    <article className="group flex items-start gap-5 sm:gap-7 py-8">
      {!hideMovie && (
        <Link href={`/movies/${movie.id}`} className="w-20 sm:w-24 shrink-0">
          <Poster title={movie.title} posterPath={movie.posterPath} size="w185" sizes="96px" />
        </Link>
      )}

      <div className="flex flex-col min-w-0 flex-1">
        {!hideMovie && (
          <h3 className="text-lg sm:text-xl font-medium tracking-tight leading-tight">
            <Link href={`/movies/${movie.id}`} className="hover:text-brand-blue transition-colors">
              {movie.title}
            </Link>{" "}
            {movie.releaseYear && (
              <span className="text-foreground/50 text-base font-normal">{movie.releaseYear}</span>
            )}
          </h3>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-2 text-sm text-foreground/50">
          {!hideUser && (
            <Link
              href={`/u/${user.username}`}
              className="flex items-center gap-2 font-medium text-foreground/70 hover:text-brand-orange transition-colors"
            >
              <Avatar name={user.name} username={user.username} size="sm" />
              {user.name}
            </Link>
          )}
          {review.rating !== null && <StarRating rating={toRating(review.rating)} size={16} />}
          {review.liked && (
            <HeartIcon size={15} weight="fill" className="text-brand-orange" aria-label="Curtiu" />
          )}
          <span
            className="font-mono text-xs uppercase tracking-wide"
            title={`Assistido em ${shortDate(review.watchedOn)}`}
          >
            {timeAgo(review.createdAt)}
          </span>
        </div>

        {review.text && hideText && (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="group/spoiler mt-3 flex items-center gap-3 w-full max-w-2xl px-4 py-3.5 rounded-xl border border-dashed border-brand-crimson/30 bg-brand-crimson/5 text-left text-sm text-brand-slate/80 hover:border-brand-crimson/60 transition-colors"
          >
            <WarningIcon size={20} className="shrink-0 text-brand-crimson" />
            <span className="flex-1">Esta review contém spoilers.</span>
            <span className="flex items-center gap-1.5 font-medium text-brand-crimson group-hover/spoiler:underline">
              <EyeIcon size={16} />
              Mostrar mesmo assim
            </span>
          </button>
        )}

        {review.text && !hideText && (
          <>
            {review.spoiler && (
              <span className="mt-3 flex items-center gap-1.5 w-fit text-[11px] font-bold uppercase tracking-[0.15em] text-brand-crimson">
                <WarningIcon size={13} weight="bold" />
                Spoiler
              </span>
            )}
            <p
              className={`${review.spoiler ? "mt-1.5" : "mt-3"} text-[15px] leading-[1.75] text-foreground/80 max-w-2xl whitespace-pre-line ${excerpt ? "line-clamp-4" : ""}`}
            >
              {review.text}
            </p>
          </>
        )}

        {excerpt && review.text && (hideText || review.text.length > EXCERPT_LENGTH) && (
          <Link
            href={reviewHref(review)}
            className="mt-2 w-fit text-sm font-medium text-brand-blue hover:underline underline-offset-4"
          >
            Ver review completa
          </Link>
        )}
      </div>
    </article>
  );
}
