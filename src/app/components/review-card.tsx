"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowsClockwiseIcon, EyeIcon, HeartIcon, UsersIcon, WarningIcon } from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth-context";
import type { MovieReview, ReviewTogether } from "@/lib/types/review";
import { toRating } from "@/utils/rating";
import { filmHref } from "@/utils/movie-link";
import { shortDate, timeAgo } from "@/utils/format";
import { StarRating } from "./ui/star-rating";
import { Poster } from "./ui/poster";
import { Avatar } from "./ui/avatar";
import { ReviewText } from "./ui/review-text";

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

/** a review em conjunto, só depois de a outra pessoa aceitar (convite pendente não aparece para os outros) */
export function acceptedTogether(review: MovieReview): (ReviewTogether & { partnerReviewId: number }) | null {
  const t = review.together;
  return t && t.status === "ACCEPTED" && t.partnerReviewId !== null ? { ...t, partnerReviewId: t.partnerReviewId } : null;
}

export function partnerReviewHref(together: ReviewTogether & { partnerReviewId: number }): string {
  return `/u/${together.partner.username}/reviews/${together.partnerReviewId}`;
}

export function ReviewCard({ review, hideMovie = false, hideUser = false, excerpt = false }: ReviewCardProps) {
  const { movie, user } = review;
  const { user: me } = useAuth();
  const [revealed, setRevealed] = useState(false);
  // o autor sempre vê a própria review; os outros precisam pedir para ver
  const isOwn = me?.username === user.username;
  const hideText = review.spoiler && !isOwn && !revealed;
  const together = acceptedTogether(review);

  return (
    <article className="group flex items-start gap-5 sm:gap-6 py-6">
      {!hideMovie && (
        <Link href={filmHref(movie)} className="w-16 sm:w-[72px] shrink-0">
          <Poster title={movie.title} posterPath={movie.posterPath} size="w185" sizes="72px" />
        </Link>
      )}

      <div className="flex flex-col min-w-0 flex-1">
        {!hideMovie && (
          <h3 className="font-serif text-xl sm:text-2xl font-semibold leading-tight">
            <Link href={filmHref(movie)} className="hover:text-brand-orange transition-colors">
              {movie.title}
            </Link>{" "}
            {movie.releaseYear && (
              <span className="font-sans text-base font-normal text-brand-slate">{movie.releaseYear}</span>
            )}
          </h3>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-2 text-sm text-brand-slate">
          {!hideUser && (
            <Link
              href={`/u/${user.username}`}
              className="flex items-center gap-2 font-semibold text-foreground/90 hover:text-brand-orange transition-colors"
            >
              <Avatar name={user.name} username={user.username} avatar={user.avatar} size="sm" />
              {user.name}
            </Link>
          )}
          {together && (
            <Link
              href={partnerReviewHref(together)}
              title={`Review em conjunto: ver a review de ${together.partner.name}`}
              className="flex items-center gap-1.5 hover:text-brand-orange transition-colors"
            >
              <UsersIcon size={15} />
              com
              <Avatar name={together.partner.name} username={together.partner.username} avatar={together.partner.avatar} size="xs" />
              <span className="font-medium text-foreground/80">{together.partner.name}</span>
            </Link>
          )}
          {review.rating !== null && <StarRating rating={toRating(review.rating)} size={16} />}
          {review.liked && (
            <HeartIcon size={15} weight="fill" className="text-brand-orange" aria-label="Curtiu" />
          )}
          {review.rewatch && (
            <span className="flex items-center gap-1 text-xs font-medium text-brand-emerald" title="Reassistido">
              <ArrowsClockwiseIcon size={14} weight="bold" />
              reassistido
            </span>
          )}
          <span title={`Registrado ${timeAgo(review.createdAt)}`}>
            Assistido em {shortDate(review.watchedOn)}
          </span>
        </div>

        {review.text && hideText && (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="group/spoiler mt-3 flex items-center gap-3 w-full max-w-2xl px-4 py-3 rounded-xl border border-dashed border-brand-crimson/30 bg-brand-crimson/5 text-left text-sm text-brand-slate hover:border-brand-crimson/60 transition-colors"
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
            {together?.sharedText && (
              <span className="mt-3 block text-xs text-brand-slate">Review escrita por {together.partner.name}</span>
            )}
            <ReviewText
              text={review.text}
              inline={excerpt}
              className={`${review.spoiler || together?.sharedText ? "mt-1.5" : "mt-3"} font-serif text-[17px] leading-[1.7] text-foreground/85 max-w-2xl ${excerpt ? "line-clamp-4" : ""}`}
            />
          </>
        )}

        {excerpt && review.text && (hideText || review.text.length > EXCERPT_LENGTH) && (
          <Link
            href={reviewHref(review)}
            className="mt-2 w-fit font-serif text-[15px] font-semibold text-foreground hover:text-brand-orange"
          >
            ver review completa
          </Link>
        )}
      </div>
    </article>
  );
}
