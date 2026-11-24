"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRightIcon, ArrowsClockwiseIcon, HeartIcon, WarningIcon } from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth-context";
import type { Rating } from "@/types/review";
import { seriesBadgeLabel } from "@/types/series";
import { compactDate } from "@/utils/format";
import { seriesReviewHref } from "@/utils/series-link";
import type { ActivityEntry } from "./activity-poster";
import { reviewHref } from "./review-card";
import { TogetherWith, acceptedPartners } from "./together-with";
import { Poster } from "./ui/poster";
import { ReviewText } from "./ui/review-text";
import { StarRating } from "./ui/star-rating";

/**
 * Uma linha de "Últimas reviews" no perfil: review escrita de filme ou de série. O autor é o dono
 * do perfil, então não aparece; a linha inteira leva à review.
 */
export function RecentReviewCard({ entry }: { entry: ActivityEntry }) {
  const { review } = entry;
  const isSeries = entry.kind === "series";
  const title = isSeries ? entry.review.series.name : entry.review.movie.title;
  const posterPath = isSeries ? entry.review.series.posterPath : entry.review.movie.posterPath;
  const year = isSeries ? entry.review.series.firstAirYear : entry.review.movie.releaseYear;
  const href = isSeries ? seriesReviewHref(entry.review) : reviewHref(entry.review);
  const partners = acceptedPartners(review);

  const { user: me } = useAuth();
  const [revealed, setRevealed] = useState(false);
  // o autor sempre vê a própria review; os outros precisam pedir para ver
  const hideText = review.spoiler && me?.username !== review.user.username && !revealed;

  return (
    <article className="group relative flex gap-4 sm:gap-5 py-5">
      <div className="w-14 sm:w-[60px] shrink-0 self-start">
        <Poster
          title={title}
          posterPath={posterPath}
          size="w185"
          sizes="60px"
          className="shadow-md shadow-black/40 group-hover:-translate-y-0.5 transition-transform"
        />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-[15px] sm:text-base font-semibold leading-snug">
          {/* o link cobre a linha inteira; os nomes de "com" e o spoiler ficam por cima */}
          <Link href={href} className="after:absolute after:inset-0 group-hover:text-brand-orange transition-colors">
            {title}
          </Link>
          {year && <span className="ml-1.5 font-normal text-brand-slate/70 tabular-nums">{year}</span>}
          {/* série: até onde a pessoa foi, em texto discreto como o ano */}
          {isSeries && <span className="ml-1.5 font-normal text-brand-slate/70">· {seriesBadgeLabel(entry.review)}</span>}
        </h3>

        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-brand-slate/80">
          {review.rating !== null && <StarRating rating={review.rating as Rating} size={12} />}
          {review.liked && <HeartIcon size={12} weight="fill" className="text-brand-orange" aria-label="Curtiu" />}
          {review.rewatch && <ArrowsClockwiseIcon size={12} weight="bold" className="text-brand-emerald" aria-label="Reassistiu" />}
          <time dateTime={review.watchedOn} className="tabular-nums">{compactDate(review.watchedOn)}</time>
          {partners.length > 0 && (
            <span className="relative z-10">
              <TogetherWith partners={partners} series={isSeries} emphasis="text-brand-slate hover:text-foreground" />
            </span>
          )}
        </div>

        {hideText ? (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="relative z-10 mt-2 inline-flex items-center gap-1.5 text-sm text-brand-crimson/90 hover:text-brand-crimson transition-colors"
          >
            <WarningIcon size={14} />
            Contém spoilers · mostrar
          </button>
        ) : (
          <ReviewText
            text={(review.text ?? "").replace(/\n{2,}/g, "\n")}
            inline
            className="mt-2 max-w-3xl text-sm leading-relaxed text-foreground/70 line-clamp-2 sm:line-clamp-3"
          />
        )}

        {/* a linha toda já leva à review; este é o convite visível para abrir */}
        <span className="mt-2.5 flex w-fit items-center gap-1 text-xs font-medium text-brand-slate group-hover:text-brand-orange transition-colors">
          Ver review completa
          <ArrowRightIcon size={12} weight="bold" className="group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </article>
  );
}
