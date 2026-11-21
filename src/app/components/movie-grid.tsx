"use client";

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
  /** quantas vezes a pessoa assistiu; acima de 1, aparece "2×" abaixo do pôster */
  watchCount?: number;
  /** se a pessoa escreveu uma review, link para ela (ícone abaixo do pôster) */
  reviewHref?: string;
  /** linha de contexto no painel do hover ("1 nov", "na lista há 3 meses"...) */
  caption?: React.ReactNode;
  /** selo no canto do pôster (nota, "Em breve"...) */
  badge?: React.ReactNode;
  /** linha abaixo do título, com showTitles (personagem, função...) */
  subtitle?: React.ReactNode;
  /** troca a navegação do clique por uma ação (o href continua valendo para abrir em nova aba) */
  onOpen?: () => void;
}

interface MovieGridProps {
  items: MovieGridItem[];
  /** "compact" para faixas na home; "five" para alinhar com os 5 favoritos do perfil; "library" para as abas Filmes e Watchlist */
  variant?: "default" | "compact" | "five" | "library";
  /** mostra título e ano abaixo do pôster (útil em resultados de busca) */
  showTitles?: boolean;
}

// granulado de película (ruído SVG) e as perfurações das laterais, que aparecem no hover
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";
const SPROCKETS = "repeating-linear-gradient(to bottom, transparent 0 5px, rgba(255,255,255,0.5) 5px 9px, transparent 9px 13px)";

// o efeito aparece tanto no hover quanto no foco pelo teclado
const reveal = "group-hover:translate-x-0 group-focus-visible:translate-x-0";

export function MovieGrid({ items, variant = "default", showTitles = false }: MovieGridProps) {
  const cols =
    variant === "compact"
      ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-6"
      : variant === "five"
        ? "grid-cols-3 sm:grid-cols-5"
        : variant === "library"
          ? "grid-cols-3 sm:grid-cols-4 lg:grid-cols-6"
          : "grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8";

  return (
    <ul className={`grid ${cols} gap-x-3 gap-y-5 sm:gap-x-4`}>
      {items.map(({ movie, href, rating, liked, rewatch, watchCount = 1, reviewHref, caption, badge, subtitle, onOpen }, index) => (
        // o mesmo filme pode aparecer mais de uma vez no diário (reassistido)
        <li key={`${movie.id}-${index}`}>
          <Link
            href={href ?? filmHref(movie)}
            onClick={(e) => {
              // ctrl/cmd+clique e botão do meio continuam abrindo o link em nova aba
              if (!onOpen || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
              e.preventDefault();
              onOpen();
            }}
            aria-haspopup={onOpen ? "dialog" : undefined}
            className="group block rounded-md outline-none transition-transform duration-300 ease-out hover:-translate-y-1 focus-visible:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:focus-visible:translate-y-0"
            title={showTitles ? movie.title : undefined}
          >
            <div className="relative overflow-hidden rounded-md transition-shadow duration-300 group-hover:ring-2 group-hover:ring-brand-orange/80 group-hover:shadow-[0_10px_30px_-8px_rgba(255,122,51,0.45)] group-focus-visible:ring-2 group-focus-visible:ring-brand-orange/80">
              <Poster
                title={movie.title}
                posterPath={movie.posterPath}
                sizes="(min-width: 1024px) 180px, 30vw"
              />
              {badge && (
                <span className="pointer-events-none absolute top-1.5 left-1.5 inline-flex items-center gap-1 h-6 px-1.5 rounded-md bg-black/75 backdrop-blur-sm text-[11px] font-semibold tabular-nums text-white ring-1 ring-white/10">
                  {badge}
                </span>
              )}
              <div
                aria-hidden="true"
                style={{ backgroundImage: GRAIN }}
                className="pointer-events-none absolute inset-0 opacity-0 mix-blend-overlay transition-opacity duration-300 group-hover:opacity-40 group-focus-visible:opacity-40"
              />
              <div aria-hidden="true" className={`pointer-events-none absolute inset-y-0 left-0 w-2 bg-black/70 -translate-x-full transition-transform duration-300 motion-reduce:transition-none ${reveal}`}>
                <div className="absolute inset-y-0 left-[2.5px] w-[3px]" style={{ backgroundImage: SPROCKETS }} />
              </div>
              <div aria-hidden="true" className={`pointer-events-none absolute inset-y-0 right-0 w-2 bg-black/70 translate-x-full transition-transform duration-300 motion-reduce:transition-none ${reveal}`}>
                <div className="absolute inset-y-0 right-[2.5px] w-[3px]" style={{ backgroundImage: SPROCKETS }} />
              </div>
              {/* painel que sobe com título, ano e o contexto da aba; com showTitles o título já está embaixo */}
              {(!showTitles || caption) && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 px-3 pt-10 pb-2 bg-linear-to-t from-black/95 via-black/75 to-transparent translate-y-full transition-transform duration-300 ease-out group-hover:translate-y-0 group-focus-visible:translate-y-0 motion-reduce:transition-none">
                  {!showTitles && (
                    <p className="text-[12px] font-semibold leading-tight text-white line-clamp-2">
                      {movie.title}
                      {movie.releaseYear && <span className="font-normal text-white/55"> {movie.releaseYear}</span>}
                    </p>
                  )}
                  {caption && (
                    <span className="mt-1 flex items-center gap-1 text-[10px] uppercase tracking-wider text-white/65 whitespace-nowrap overflow-hidden">
                      {caption}
                    </span>
                  )}
                </div>
              )}
            </div>
            {showTitles && (
              <p className="mt-2 text-sm leading-snug line-clamp-2 group-hover:text-brand-blue transition-colors">
                {movie.title}{" "}
                {movie.releaseYear && <span className="text-foreground/40">{movie.releaseYear}</span>}
              </p>
            )}
            {showTitles && subtitle && (
              <p className="mt-0.5 text-xs text-brand-slate/70 truncate">{subtitle}</p>
            )}
          </Link>
          {(rating != null || liked || rewatch || watchCount > 1 || reviewHref) && (
            <div className="flex items-center gap-1.5 mt-2">
              {rating != null && <StarRating rating={toRating(rating)} size={12} />}
              {liked && <HeartIcon size={12} weight="fill" className="text-brand-orange" />}
              {watchCount > 1 ? (
                <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-brand-emerald" title={`Assistido ${watchCount} vezes`}>
                  <ArrowsClockwiseIcon size={11} weight="bold" aria-hidden="true" />
                  {watchCount}×
                </span>
              ) : (
                rewatch && (
                  <ArrowsClockwiseIcon size={12} weight="bold" className="text-brand-emerald" aria-label="Reassistido">
                    <title>Reassistido</title>
                  </ArrowsClockwiseIcon>
                )
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
