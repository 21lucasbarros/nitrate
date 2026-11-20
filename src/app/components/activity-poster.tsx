import Link from "next/link";
import { ArrowsClockwiseIcon, ChatTextIcon, HeartIcon } from "@phosphor-icons/react";
import type { MovieReview } from "@/lib/types/review";
import { shortAgo } from "@/utils/format";
import { toRating } from "@/utils/rating";
import { reviewHref } from "./review-card";
import { Avatar } from "./ui/avatar";
import { Poster } from "./ui/poster";
import { StarRating } from "./ui/star-rating";

/**
 * Pôster da atividade. Embaixo vem primeiro o que a pessoa achou (nota, curtida) e, menor,
 * quem foi e quando: nesta seção o destaque é o filme e a opinião, não o nome.
 */
export function ActivityPoster({ review }: { review: MovieReview }) {
  const { movie, user } = review;
  // só o primeiro nome: o completo cortava ("Beatriz Velardo Cor…"); ele fica no title
  const firstName = user.name.trim().split(/\s+/)[0] || user.username;

  return (
    <li className="min-w-0">
      {/* o pôster abre o registro da pessoa (nota, review, curtidas), não a página do filme */}
      <Link href={reviewHref(review)} aria-label={`${movie.title}, por ${user.name}`} className="group block">
        <div className="relative rounded-md group-hover:ring-2 group-hover:ring-brand-orange group-focus-visible:ring-2 group-focus-visible:ring-brand-orange transition-shadow">
          <Poster title={movie.title} posterPath={movie.posterPath} sizes="(min-width: 640px) 180px, 30vw" />
          {/* nem todo pôster tem o título legível: no hover ele aparece sobre um degradê */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-md bg-linear-to-t from-black/90 via-black/55 to-transparent px-2.5 pb-2.5 pt-10 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
            <p className="text-xs font-semibold leading-tight text-white line-clamp-2">{movie.title}</p>
            {movie.releaseYear && <p className="mt-0.5 text-[11px] text-white/65">{movie.releaseYear}</p>}
          </div>
        </div>
      </Link>

      {/* altura fixa: com ou sem nota, as legendas da fileira ficam alinhadas */}
      <div className="mt-2.5 h-4 flex items-center gap-1.5 overflow-hidden [&>svg]:shrink-0">
        {review.rating !== null ? (
          <StarRating rating={toRating(review.rating)} size={11} />
        ) : (
          <span className="text-xs text-brand-slate">{review.rewatch ? "reassistiu" : "assistiu"}</span>
        )}
        {review.liked && <HeartIcon size={12} weight="fill" className="text-brand-crimson" aria-label="Curtiu" />}
        {/* sem nota, o "reassistiu" já diz isso; no celular não cabe ao lado de 5 estrelas e do coração */}
        {review.rewatch && review.rating !== null && (
          <ArrowsClockwiseIcon size={11} weight="bold" className="hidden sm:block text-brand-slate/60" aria-label="Reassistiu" />
        )}
        {/* o pôster já leva à review: aqui o ícone só avisa que tem texto */}
        {review.text && <ChatTextIcon size={12} weight="fill" className="text-brand-slate/60" aria-label="Com review escrita" />}
      </div>

      {/* o nome tem prioridade. O tempo aparece inteiro ou some: sem espaço, ele quebra para uma
          segunda linha, escondida pela altura fixa (melhor do que "2…") */}
      <div className="mt-1.5 h-5 flex flex-wrap items-center gap-x-1.5 overflow-hidden text-xs">
        <Link
          href={`/u/${user.username}`}
          title={`${user.name} (@${user.username})`}
          className="flex items-center gap-1.5 shrink-0 max-w-full text-brand-slate hover:text-foreground transition-colors"
        >
          <Avatar name={user.name} username={user.username} avatar={user.avatar} size="xs" />
          <span className="min-w-0 truncate">{firstName}</span>
        </Link>
        <time dateTime={review.createdAt} className="h-5 leading-5 whitespace-nowrap text-brand-slate/60">
          <span aria-hidden="true" className="mr-1.5 text-brand-slate/40">·</span>
          {shortAgo(review.createdAt)}
        </time>
      </div>
    </li>
  );
}
