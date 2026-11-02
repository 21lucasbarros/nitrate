"use client";

import Link from "next/link";
import { ArrowRightIcon, HeartIcon } from "@phosphor-icons/react";
import { useFetch } from "@/lib/hooks/use-fetch";
import { getFeaturedReviews } from "@/lib/services/review-service";
import { timeAgo } from "@/utils/format";
import { toRating } from "@/utils/rating";
import { StarRating } from "./ui/star-rating";
import { Poster } from "./ui/poster";

const fetchFeatured = () => getFeaturedReviews();

function framePoster(rank: number): string {
  return `Nº ${String(rank).padStart(2, "0")}`;
}

export default function TrendingReviews() {
  const featured = useFetch("featured", fetchFeatured);
  const reviews = featured.data ?? [];

  // sem reviews (ou com a API fora do ar), a seção some em vez de mostrar um buraco na landing
  if (!featured.loading && reviews.length === 0) return null;

  return (
    <section className="bg-background py-20 md:py-28 px-6 md:px-12 xl:px-24">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-14 sm:mb-20 gap-4">
        <div>
          <span className="text-xs font-bold tracking-[0.2em] uppercase text-brand-orange">
            Comunidade
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight mt-2 text-foreground">
            Direto dos diários.
          </h2>
        </div>
        <Link
          href="/movies"
          className="flex items-center gap-2 text-sm font-medium text-foreground/70 hover:text-brand-orange transition-colors group"
        >
          Explorar filmes{" "}
          <ArrowRightIcon
            size={16}
            weight="bold"
            className="group-hover:translate-x-1 transition-transform"
          />
        </Link>
      </div>

      <div className="divide-y divide-foreground/10 border-t border-foreground/10">
        {featured.loading
          ? Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex gap-5 sm:gap-9 py-10 sm:py-12">
                <div className="w-28 sm:w-32 aspect-2/3 rounded-sm bg-foreground/5 animate-pulse" />
                <div className="flex-1 space-y-3 pt-2">
                  <div className="h-7 w-1/3 rounded bg-foreground/5 animate-pulse" />
                  <div className="h-4 w-1/4 rounded bg-foreground/5 animate-pulse" />
                  <div className="h-16 w-2/3 rounded bg-foreground/5 animate-pulse" />
                </div>
              </div>
            ))
          : reviews.map((review, index) => (
              <article
                key={review.id}
                className="group flex items-start gap-5 sm:gap-9 py-10 sm:py-12"
              >
                <Link href={`/movies/${review.movie.id}`} className="w-28 sm:w-32 shrink-0">
                  <Poster
                    title={review.movie.title}
                    posterPath={review.movie.posterPath}
                    sizes="128px"
                    className="group-hover:ring-brand-orange/40 transition-all duration-500"
                  />
                </Link>

                <div className="flex flex-col justify-center min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-4 mb-1">
                    <h3 className="text-xl sm:text-2xl md:text-[28px] font-medium tracking-tight leading-tight text-foreground">
                      <Link href={`/movies/${review.movie.id}`} className="hover:text-brand-blue transition-colors">
                        {review.movie.title}
                      </Link>{" "}
                      {review.movie.releaseYear && (
                        <span className="text-foreground/50 text-base sm:text-lg font-normal">
                          {review.movie.releaseYear}
                        </span>
                      )}
                    </h3>
                    <span className="hidden sm:block text-[11px] font-mono uppercase tracking-wider text-foreground/40 shrink-0 pt-2">
                      {framePoster(index + 1)}
                    </span>
                  </div>

                  {(review.rating !== null || review.liked) && (
                    <div className="flex items-center gap-3 my-3">
                      {review.rating !== null && <StarRating rating={toRating(review.rating)} size={19} />}
                      {review.liked && (
                        <HeartIcon size={16} weight="fill" className="text-brand-orange" aria-label="Curtiu" />
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 text-sm text-foreground/50 mb-4">
                    <Link
                      href={`/u/${review.user.username}`}
                      className="font-medium text-foreground/70 hover:text-brand-orange transition-colors"
                    >
                      {review.user.name}
                    </Link>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono text-xs uppercase tracking-wide">
                      {timeAgo(review.createdAt)}
                    </span>
                  </div>

                  <p className="text-[15px] sm:text-base leading-[1.75] text-foreground/80 font-normal max-w-2xl line-clamp-5">
                    {review.text}
                  </p>
                </div>
              </article>
            ))}
      </div>
    </section>
  );
}
