import Link from "next/link";
import { ArrowsClockwiseIcon, ChatTextIcon, HeartIcon } from "@phosphor-icons/react";
import type { MovieReview } from "@/lib/types/review";
import { filmHref } from "@/utils/movie-link";
import { toRating } from "@/utils/rating";
import { reviewHref } from "./review-card";
import { Avatar } from "./ui/avatar";
import { Poster } from "./ui/poster";
import { StarRating } from "./ui/star-rating";

/** pôster da atividade, com quem registrou e a nota numa legenda embaixo */
export function ActivityPoster({ review }: { review: MovieReview }) {
  return (
    <li className="min-w-0">
      <Link href={filmHref(review.movie)} title={review.movie.title} className="group block">
        <Poster
          title={review.movie.title}
          posterPath={review.movie.posterPath}
          sizes="(min-width: 640px) 180px, 30vw"
          className="group-hover:ring-2 group-hover:ring-brand-orange transition-shadow"
        />
      </Link>
      <Link href={`/u/${review.user.username}`} className="mt-2.5 flex items-center gap-2 min-w-0 group">
        <Avatar name={review.user.name} username={review.user.username} avatar={review.user.avatar} size="xs" />
        <span className="text-sm truncate text-foreground/85 group-hover:text-brand-orange">{review.user.name}</span>
      </Link>
      <div className="mt-1 flex items-center gap-1.5 text-brand-slate">
        {review.rating !== null && <StarRating rating={toRating(review.rating)} size={11} />}
        {review.liked && <HeartIcon size={11} weight="fill" className="text-brand-orange" />}
        {review.rewatch && <ArrowsClockwiseIcon size={11} weight="bold" />}
        {review.text && (
          <Link href={reviewHref(review)} aria-label="Ler a review" className="hover:text-foreground">
            <ChatTextIcon size={12} weight="fill" />
          </Link>
        )}
      </div>
    </li>
  );
}
