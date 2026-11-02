import Link from "next/link";
import { ChatTextIcon, HeartIcon } from "@phosphor-icons/react";
import { toRating } from "@/utils/rating";
import { StarRating } from "./ui/star-rating";
import { Poster } from "./ui/poster";

export interface MovieGridItem {
  movie: { id: number | string; title: string; posterPath: string | null; releaseYear?: number | null };
  /** padrão: /movies/{movie.id} */
  href?: string;
  /** nota do usuário, exibida abaixo do pôster */
  rating?: number | null;
  liked?: boolean;
  /** se a pessoa escreveu uma review, link para ela (ícone abaixo do pôster) */
  reviewHref?: string;
}

interface MovieGridProps {
  items: MovieGridItem[];
  /** "compact" para faixas na home */
  variant?: "default" | "compact";
  /** mostra título e ano abaixo do pôster (útil em resultados de busca) */
  showTitles?: boolean;
}

export function MovieGrid({ items, variant = "default", showTitles = false }: MovieGridProps) {
  const cols =
    variant === "compact"
      ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-6"
      : "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6";

  return (
    <ul className={`grid ${cols} gap-x-4 gap-y-6 sm:gap-x-5`}>
      {items.map(({ movie, href, rating, liked, reviewHref }) => (
        <li key={movie.id}>
          <Link href={href ?? `/movies/${movie.id}`} className="group block" title={movie.title}>
            <Poster
              title={movie.title}
              posterPath={movie.posterPath}
              sizes="(min-width: 1024px) 180px, 30vw"
              className="group-hover:ring-brand-orange/50 transition-all"
            />
            {showTitles && (
              <p className="mt-2 text-sm leading-snug line-clamp-2 group-hover:text-brand-blue transition-colors">
                {movie.title}{" "}
                {movie.releaseYear && <span className="text-foreground/40">{movie.releaseYear}</span>}
              </p>
            )}
          </Link>
          {(rating != null || liked || reviewHref) && (
            <div className="flex items-center gap-1.5 mt-2">
              {rating != null && <StarRating rating={toRating(rating)} size={12} />}
              {liked && <HeartIcon size={12} weight="fill" className="text-brand-orange" />}
              {/* fora do link do pôster: um link não pode ficar dentro de outro */}
              {reviewHref && (
                <Link
                  href={reviewHref}
                  title="Ler a review"
                  aria-label={`Ler a review de ${movie.title}`}
                  className="ml-auto p-0.5 text-brand-slate/50 hover:text-brand-blue transition-colors"
                >
                  <ChatTextIcon size={14} weight="fill" />
                </Link>
              )}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
