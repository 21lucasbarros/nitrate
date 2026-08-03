import { ArrowRightIcon, FilmStripIcon, HeartIcon } from "@phosphor-icons/react";
import { Review } from "@/types/review";
import { REVIEWS_MOCK } from "../data/reviews.mock";
import { StarRating } from "./ui/star-rating";
import Image from "next/image";


const MAX_REVIEWS = 3;

function getTrendingReviews(reviews: Review[], limit: number): Review[] {
  return [...reviews]
    .sort((a, b) => (b.engagementScore ?? 0) - (a.engagementScore ?? 0))
    .slice(0, limit);
}

function framePoster(rank: number): string {
  return `Nº ${String(rank).padStart(2, "0")}`;
}

export default function TrendingReviews() {
  const trendingReviews = getTrendingReviews(REVIEWS_MOCK, MAX_REVIEWS);

  return (
    <section className="bg-background py-20 md:py-28 px-6 md:px-12 xl:px-24">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-14 sm:mb-20 gap-4">
        <div>
          <span className="text-xs font-bold tracking-[0.2em] uppercase text-brand-orange">
            Comunidade
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight mt-2 text-foreground">
            Reviews em alta.
          </h2>
        </div>
        <button className="flex items-center gap-2 text-sm font-medium text-foreground/70 hover:text-brand-orange transition-colors group">
          Explorar diários{" "}
          <ArrowRightIcon
            size={16}
            weight="bold"
            className="group-hover:translate-x-1 transition-transform"
          />
        </button>
      </div>

      <div className="divide-y divide-foreground/10 border-t border-foreground/10">
        {trendingReviews.map((review, index) => (
          <article
            key={review.id}
            className="group flex items-start gap-5 sm:gap-9 py-10 sm:py-12"
          >
            <div className="relative w-28 sm:w-32 shrink-0 overflow-hidden rounded-sm ring-1 ring-foreground/10 group-hover:ring-brand-orange/40 transition-all duration-500 aspect-2/3">
              {review.posterUrl ? (
                <>
                  <Image
                    src={review.posterUrl}
                    alt={`Pôster de ${review.movie}`}
                    fill
                    className="absolute inset-0 w-full h-full object-cover grayscale-15 contrast-[1.08] saturate-[0.8] scale-100 group-hover:scale-[1.04] transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-brand-charcoal/60 via-transparent to-brand-orange/10 mix-blend-multiply" />
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-foreground/5 text-foreground/20">
                  <FilmStripIcon size={28} weight="light" />
                </div>
              )}
            </div>

            <div className="flex flex-col justify-center min-w-0 flex-1">
              <div className="flex items-start justify-between gap-4 mb-1">
                <h3 className="text-xl sm:text-2xl md:text-[28px] font-medium tracking-tight leading-tight text-foreground">
                  {review.movie}{" "}
                  <span className="text-foreground/50 text-base sm:text-lg font-normal">
                    {review.year}
                  </span>
                </h3>
                <span className="hidden sm:block text-[11px] font-mono uppercase tracking-wider text-foreground/40 shrink-0 pt-2">
                  {framePoster(index + 1)}
                </span>
              </div>

              <div className="flex items-center gap-3 my-3">
                <StarRating rating={review.rating} size={19} />
                {review.favorited && (
                  <HeartIcon
                    size={16}
                    weight="fill"
                    className="text-brand-orange"
                    aria-label="Filme favoritado"
                  />
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-sm text-foreground/50 mb-4">
                <span className="font-medium text-foreground/70">
                  {review.user}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-xs uppercase tracking-wide">
                  {review.date}
                </span>
              </div>

              <p className="text-[15px] sm:text-base leading-[1.75] text-foreground/80 font-normal max-w-2xl">
                {review.text}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
