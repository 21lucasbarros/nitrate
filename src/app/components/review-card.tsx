import Link from "next/link";
import { HeartIcon } from "@phosphor-icons/react";
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
}

export function ReviewCard({ review, hideMovie = false, hideUser = false }: ReviewCardProps) {
  const { movie, user } = review;

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

        {review.text && (
          <p className="mt-3 text-[15px] leading-[1.75] text-foreground/80 max-w-2xl whitespace-pre-line">
            {review.text}
          </p>
        )}
      </div>
    </article>
  );
}
