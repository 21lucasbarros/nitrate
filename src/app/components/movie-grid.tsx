import Link from "next/link";
import { ArrowsClockwiseIcon, ChatTextIcon, HeartIcon } from "@phosphor-icons/react";
import { toRating } from "@/utils/rating";
import { filmHref } from "@/utils/movie-link";
import { StarRating } from "./ui/star-rating";
import { Poster } from "./ui/poster";

export interface MovieGridItem {
  movie: { id: number | string; slug?: string | null; title: string; posterPath: string | null; releaseYear?: number | null };
  /** padrão: /movies/{movie.id} */
  href?: string;
  /** nota do usuário, exibida abaixo do pôster */
  rating?: number | null;
  liked?: boolean;
  rewatch?: boolean;
  /** se a pessoa escreveu uma review, link para ela (ícone abaixo do pôster) */
  reviewHref?: string;
}

interface MovieGridProps {
  items: MovieGridItem[];
  /** "compact" para faixas na home; "five" para alinhar com os 5 favoritos do perfil */
  variant?: "default" | "compact" | "five";
  /** mostra título e ano abaixo do pôster (útil em resultados de busca) */
  showTitles?: boolean;
}

export function MovieGrid({ items, variant = "default", showTitles = false }: MovieGridProps) {
  const cols =
    variant === "compact"
      ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-6"
      : variant === "five"
        ? "grid-cols-3 sm:grid-cols-5"
        : "grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8";

  return (
    <ul className={`grid ${cols} gap-x-3 gap-y-5 sm:gap-x-4`}>
      {items.map(({ movie, href, rating, liked, rewatch, reviewHref }, index) => (
        // o mesmo filme pode aparecer mais de uma vez no diário (reassistido)
        <li key={`${movie.id}-${index}`}>
          <Link href={href ?? filmHref(movie)} className="group block" title={movie.title}>
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
          {(rating != null || liked || rewatch || reviewHref) && (
            <div className="flex items-center gap-1.5 mt-2">
              {rating != null && <StarRating rating={toRating(rating)} size={12} />}
              {liked && <HeartIcon size={12} weight="fill" className="text-brand-orange" />}
              {rewatch && (
                <ArrowsClockwiseIcon size={12} weight="bold" className="text-brand-emerald" aria-label="Reassistido">
                  <title>Reassistido</title>
                </ArrowsClockwiseIcon>
              )}
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
