import Link from "next/link";
import { HeartIcon } from "@phosphor-icons/react";
import type { Movie } from "@/types/movie";
import { toRating } from "@/utils/rating";
import { StarRating } from "./ui/star-rating";
import { Poster } from "./ui/poster";

export interface MovieGridItem {
  movie: Movie;
  /** nota do usuário, exibida abaixo do pôster */
  rating?: number | null;
  liked?: boolean;
}

interface MovieGridProps {
  items: MovieGridItem[];
  /** "compact" para faixas na home */
  variant?: "default" | "compact";
}

export function MovieGrid({ items, variant = "default" }: MovieGridProps) {
  const cols =
    variant === "compact"
      ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-6"
      : "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6";

  return (
    <ul className={`grid ${cols} gap-x-4 gap-y-6 sm:gap-x-5`}>
      {items.map(({ movie, rating, liked }) => (
        <li key={movie.id}>
          <Link href={`/movies/${movie.id}`} className="group block" title={movie.title}>
            <Poster
              title={movie.title}
              posterPath={movie.posterPath}
              sizes="(min-width: 1024px) 180px, 30vw"
              className="group-hover:ring-brand-orange/50 transition-all"
            />
            {(rating != null || liked) && (
              <div className="flex items-center gap-1.5 mt-2">
                {rating != null && <StarRating rating={toRating(rating)} size={12} />}
                {liked && <HeartIcon size={12} weight="fill" className="text-brand-orange" />}
              </div>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
