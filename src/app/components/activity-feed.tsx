"use client";

import { useState } from "react";
import Link from "next/link";
import { ChatCircleIcon, CircleNotchIcon, HeartIcon, WarningIcon } from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth-context";
import { useFetch } from "@/lib/hooks/use-fetch";
import { getFriendsFeed, type Activity } from "@/lib/services/friends-service";
import { likeReview, unlikeReview } from "@/lib/services/review-service";
import type { MovieReview } from "@/lib/types/review";
import type { UserSummary } from "@/lib/types/user";
import { filmHref } from "@/utils/movie-link";
import { toRating } from "@/utils/rating";
import { listHref } from "./list-card";
import { reviewHref } from "./review-card";
import { Avatar } from "./ui/avatar";
import { Poster } from "./ui/poster";
import { ReviewText } from "./ui/review-text";
import { StarRating } from "./ui/star-rating";

const fetchPage = (cursor: string) => getFriendsFeed(cursor || null);

/**
 * Feed de atividade da página "Amigos". Cada "carregar mais" acrescenta uma página que
 * começa logo antes do último item da anterior.
 */
export function ActivityFeed() {
  const [cursors, setCursors] = useState<string[]>([""]);
  return (
    <div className="divide-y divide-foreground/5 border-y border-foreground/5">
      {cursors.map((cursor, i) => (
        <FeedPage
          key={cursor || "primeira"}
          cursor={cursor}
          first={i === 0}
          last={i === cursors.length - 1}
          onMore={(next) => setCursors((c) => [...c, next])}
        />
      ))}
    </div>
  );
}

function FeedPage({ cursor, first, last, onMore }: {
  cursor: string;
  first: boolean;
  last: boolean;
  onMore: (next: string) => void;
}) {
  const page = useFetch(cursor, fetchPage);

  if (!page.data) {
    return (
      <div className="py-16 flex justify-center text-brand-slate/40">
        {page.error ? <span className="text-sm text-brand-slate">Não foi possível carregar a atividade.</span> : <CircleNotchIcon size={26} className="animate-spin" />}
      </div>
    );
  }

  if (first && page.data.items.length === 0) {
    return <p className="py-16 text-center text-brand-slate">Nada por aqui ainda. Quando quem você segue registrar, listar ou curtir algo, aparece aqui.</p>;
  }

  const next = page.data.nextBefore;
  return (
    <>
      {page.data.items.map((item) => (
        <ActivityItem key={item.id} item={item} />
      ))}
      {last && next && (
        <div className="py-6 flex justify-center">
          <button
            type="button"
            onClick={() => onMore(next)}
            className="px-5 py-2 rounded-md border border-foreground/10 text-sm text-brand-slate hover:text-foreground hover:border-foreground/25 transition-colors"
          >
            Carregar mais
          </button>
        </div>
      )}
    </>
  );
}

export function ActivityItem({ item }: { item: Activity }) {
  if (item.type === "REVIEW" && item.review?.text) return <ReviewEntry item={item} review={item.review} />;
  return <CompactEntry item={item} />;
}

/** registro com texto: pôster, título, nota, o começo da review e o botão de curtir */
function ReviewEntry({ item, review }: { item: Activity; review: MovieReview }) {
  const { user: me } = useAuth();
  const isOwn = me?.username === review.user.username;
  const { movie } = review;

  return (
    <article className="flex gap-3 sm:gap-4 py-6">
      <ActorAvatar user={item.user} />
      <Link href={reviewHref(review)} className="group w-16 sm:w-24 shrink-0">
        <Poster title={movie.title} posterPath={movie.posterPath} size="w185" sizes="96px" className="group-hover:ring-brand-orange/50 transition-all" />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <div className="text-sm text-brand-slate">
            <Actor user={item.user} /> {review.rewatch ? "reassistiu" : "assistiu"}
          </div>
          <Time at={item.at} />
        </div>
        <h3 className="mt-1 font-serif text-xl sm:text-2xl font-semibold leading-tight">
          <Link href={reviewHref(review)} className="hover:text-brand-orange transition-colors">{movie.title}</Link>{" "}
          {movie.releaseYear && <span className="font-sans text-base font-light text-foreground/40">{movie.releaseYear}</span>}
        </h3>
        {(review.rating !== null || review.liked) && (
          <div className="mt-2 flex items-center gap-2">
            {review.rating !== null && <StarRating rating={toRating(review.rating)} size={14} />}
            {review.liked && <HeartIcon size={14} weight="fill" className="text-brand-orange" aria-label="Curtiu o filme" />}
          </div>
        )}
        {review.spoiler && !isOwn ? (
          <Link
            href={reviewHref(review)}
            className="mt-3 flex items-center gap-2 w-fit text-sm text-brand-slate hover:text-foreground"
          >
            <WarningIcon size={16} className="text-brand-crimson" /> Contém spoilers. Ler a review
          </Link>
        ) : (
          <ReviewText
            text={review.text ?? ""}
            inline
            className="mt-3 font-serif text-base sm:text-[17px] leading-[1.7] text-foreground/80 line-clamp-4"
          />
        )}
        <div className="mt-3 flex items-center gap-5">
          <LikeReview review={review} isOwn={isOwn} initialCount={item.likesCount ?? 0} initialLiked={item.likedByMe ?? false} />
          <Link href={`${reviewHref(review)}#comentarios`} className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm text-brand-slate hover:text-foreground">
            <ChatCircleIcon size={17} /> Comentar
          </Link>
        </div>
      </div>
    </article>
  );
}

/** as outras atividades numa linha só */
function CompactEntry({ item }: { item: Activity }) {
  const { user: me } = useAuth();
  const sentence = (() => {
    switch (item.type) {
      case "REVIEW": {
        const r = item.review!;
        return (
          <>
            {reviewVerbs(r)} <FilmLink review={r} />
            {r.rating !== null && <> <InlineStars rating={r.rating} /></>}
            {" "}em {sessionDate(r.watchedOn)}
          </>
        );
      }
      case "WATCHLIST":
        return (
          <>
            adicionou{" "}
            <Link href={filmHref(item.movie!)} className="text-foreground hover:text-brand-orange">{item.movie!.title}</Link>{" "}
            à watchlist
          </>
        );
      case "LIST":
        return (
          <>
            criou a lista{" "}
            <Link href={listHref(item.list!)} className="text-foreground hover:text-brand-orange">{item.list!.name}</Link>
            <span className="text-brand-slate/70"> · {item.list!.filmsCount} {item.list!.filmsCount === 1 ? "filme" : "filmes"}</span>
          </>
        );
      case "REVIEW_LIKE": {
        const r = item.review!;
        return (
          <>
            curtiu {reviewOwner(r.user, me?.username)}
            {r.rating !== null && <> <InlineStars rating={r.rating} /></>} de <FilmLink review={r} />
          </>
        );
      }
      case "COMMENT": {
        const r = item.review!;
        return (
          <>
            comentou n{reviewOwner(r.user, me?.username)} de <FilmLink review={r} />
          </>
        );
      }
      case "FOLLOW":
        return (
          <>
            começou a seguir{" "}
            {item.target!.username === me?.username ? (
              "você"
            ) : (
              <Link href={`/u/${item.target!.username}`} className="font-semibold text-foreground/90 hover:text-brand-orange">{item.target!.name}</Link>
            )}
          </>
        );
    }
  })();

  return (
    <div className="flex gap-3 py-3.5 px-3 -mx-3 sm:px-4 sm:-mx-4 bg-surface/40">
      <ActorAvatar user={item.user} />
      <div className="min-w-0 flex-1">
        {/* div e não p: as estrelas da frase são um bloco, e p não pode conter blocos */}
        <div className="text-sm leading-relaxed text-brand-slate">
          <Actor user={item.user} /> {sentence}
        </div>
        {item.type === "COMMENT" && item.comment && (
          <p className="mt-1 text-sm italic text-foreground/70 line-clamp-2">“{item.comment}”</p>
        )}
      </div>
      <Time at={item.at} />
    </div>
  );
}

/** "a review", "a sua review" ou "a review de Fulano" */
function reviewOwner(author: UserSummary, myUsername: string | undefined) {
  if (author.username === myUsername) return "a sua review";
  return (
    <>
      a review de{" "}
      <Link href={`/u/${author.username}`} className="font-semibold text-foreground/90 hover:text-brand-orange">{author.name}</Link>
    </>
  );
}

/** "assistiu", "reassistiu, curtiu e avaliou"... */
function reviewVerbs(review: MovieReview): string {
  const verbs = [review.rewatch ? "reassistiu" : "assistiu"];
  if (review.liked) verbs.push("curtiu");
  if (review.rating !== null) verbs.push("avaliou");
  return verbs.length === 1 ? verbs[0] : `${verbs.slice(0, -1).join(", ")} e ${verbs[verbs.length - 1]}`;
}

/** "segunda, 16 de nov." */
function sessionDate(isoDate: string): string {
  return new Date(`${isoDate}T12:00:00`)
    .toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "short" })
    .replace("-feira", "");
}

/** tempo curto, como nos apps: "agora", "12min", "11h", "4d", "3sem" */
function shortAgo(iso: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d`;
  if (days < 60) return `${Math.round(days / 7)}sem`;
  return new Date(iso).toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
}

function Time({ at }: { at: string }) {
  return (
    <time dateTime={at} title={new Date(at).toLocaleString("pt-BR")} className="shrink-0 text-xs text-brand-slate/60 tabular-nums">
      {shortAgo(at)}
    </time>
  );
}

function Actor({ user }: { user: UserSummary }) {
  const { user: me } = useAuth();
  if (user.username === me?.username) return <span className="font-semibold text-foreground/90">Você</span>;
  return (
    <Link href={`/u/${user.username}`} className="font-semibold text-foreground/90 hover:text-brand-orange">
      {user.name}
    </Link>
  );
}

function ActorAvatar({ user }: { user: UserSummary }) {
  return (
    <Link href={`/u/${user.username}`} className="shrink-0 self-start">
      <Avatar name={user.name} username={user.username} avatar={user.avatar} size="sm" />
    </Link>
  );
}

function FilmLink({ review }: { review: MovieReview }) {
  return (
    <Link href={reviewHref(review)} className="text-foreground hover:text-brand-orange">
      {review.movie.title}
    </Link>
  );
}

function InlineStars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex align-[-1px]">
      <StarRating rating={toRating(rating)} size={11} />
    </span>
  );
}

/** curtir a review direto do feed (o autor só vê quantas curtidas recebeu) */
function LikeReview({ review, isOwn, initialCount, initialLiked }: {
  review: MovieReview;
  isOwn: boolean;
  initialCount: number;
  initialLiked: boolean;
}) {
  const [state, setState] = useState({ count: initialCount, liked: initialLiked });
  const [busy, setBusy] = useState(false);

  if (isOwn) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-brand-slate">
        <HeartIcon size={17} weight={state.count > 0 ? "fill" : "regular"} className={state.count > 0 ? "text-brand-orange" : ""} />
        {state.count} {state.count === 1 ? "curtida" : "curtidas"}
      </span>
    );
  }

  const toggle = async () => {
    const previous = state;
    setBusy(true);
    setState({ liked: !state.liked, count: state.count + (state.liked ? -1 : 1) });
    try {
      const saved = state.liked ? await unlikeReview(review.id) : await likeReview(review.id);
      setState({ liked: Boolean(saved.likedByMe), count: saved.likesCount });
    } catch {
      setState(previous);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={state.liked}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium transition-colors ${state.liked ? "text-brand-orange" : "text-brand-slate hover:text-brand-orange"}`}
    >
      <HeartIcon size={17} weight="fill" className={state.liked ? "" : "opacity-70"} />
      {state.liked ? "Curtiu" : (
        <>
          <span className="sm:hidden">Curtir</span>
          <span className="hidden sm:inline">Curtir review</span>
        </>
      )}
      {state.count > 0 && <span className="text-brand-slate/70 font-normal tabular-nums">· {state.count}</span>}
    </button>
  );
}

