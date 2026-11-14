"use client";

import Link from "next/link";
import { ArrowRightIcon, ArrowsClockwiseIcon, ChatTextIcon, HeartIcon, SparkleIcon } from "@phosphor-icons/react";
import type { UserProfile } from "@/lib/types/user";
import type { MovieReview } from "@/lib/types/review";
import { useFetch } from "@/lib/hooks/use-fetch";
import { getMyRecommendations, getUserWatchlist } from "@/lib/services/user-service";
import { getRecentReviews } from "@/lib/services/review-service";
import { getMovies } from "@/lib/services/movie-service";
import { getMyRetrospectiveMonths } from "@/lib/services/retrospective-service";
import { cachedFetcher } from "@/lib/cache";
import { currentMonth, monthLabel, shiftMonth } from "@/utils/format";
import { filmHref } from "@/utils/movie-link";
import { toRating } from "@/utils/rating";
import { MovieGrid } from "./movie-grid";
import { Recommendations } from "./recommendations";
import { reviewHref, ReviewCard } from "./review-card";
import { Avatar } from "./ui/avatar";
import { Poster } from "./ui/poster";
import { SectionHeading } from "./ui/section-heading";
import { StarRating } from "./ui/star-rating";

// uma fileira de pôsteres (6) e, abaixo, as reviews escritas mais recentes
const RECENT_LIMIT = 12;
const RECENT_POSTERS = 6;
const RECENT_TEXTS = 3;
// a atividade recente não precisa ser buscada de novo a cada visita à home
const fetchRecent = cachedFetcher(() => getRecentReviews(RECENT_LIMIT), 5 * 60 * 1000);
const fetchRetroMonths = () => getMyRetrospectiveMonths();
const fetchMovies = () => getMovies();
const fetchRecommendations = () => getMyRecommendations();

export default function UserHome({ user }: { user: UserProfile }) {
  const firstName = user.name.split(" ")[0];
  const watchlist = useFetch(user.username, getUserWatchlist);
  const recent = useFetch("recent", fetchRecent);
  const movies = useFetch("all", fetchMovies);
  // a chave inclui a contagem de filmes: registrar um filme novo refaz as recomendações
  const recommendations = useFetch(`${user.username}:${user.filmsCount}`, fetchRecommendations);
  const retroMonths = useFetch(user.username, fetchRetroMonths);
  // o mês que acabou ganha destaque; se ele estiver vazio, mostramos o mês em andamento
  const lastMonth = shiftMonth(currentMonth(), -1);
  const retroMonth = retroMonths.data?.includes(lastMonth)
    ? lastMonth
    : retroMonths.data?.includes(currentMonth())
      ? currentMonth()
      : null;

  const watchlistIds = new Set(watchlist.data?.map((item) => item.movie.id));
  const discover = (movies.data ?? []).filter((movie) => !watchlistIds.has(movie.id)).slice(0, 12);
  const recentWritten = (recent.data ?? []).filter((r) => r.text && !r.spoiler).slice(0, RECENT_TEXTS);

  return (
    <main className="pt-28 sm:pt-32 pb-24 px-6 max-w-[1180px] mx-auto w-full">
      <p className="text-center text-2xl sm:text-3xl font-light text-brand-slate leading-snug">
        Bem-vindo de volta,{" "}
        <Link href={`/u/${user.username}`} className="text-foreground underline underline-offset-8 decoration-foreground/30 hover:decoration-brand-orange">
          {firstName}
        </Link>
        . Veja o que a comunidade anda assistindo…
      </p>

      <section className="mt-12">
        <SectionHeading title="Novidades da comunidade" />
        {recent.data ? (
          <ul className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4">
            {recent.data.slice(0, RECENT_POSTERS).map((review) => (
              <ActivityPoster key={review.id} review={review} />
            ))}
          </ul>
        ) : (
          <GridSkeleton />
        )}
      </section>

      {retroMonth && (
        <Link
          href={`/u/${user.username}/retrospectiva/${retroMonth}`}
          className="group mt-12 flex items-center justify-between gap-6 rounded-md bg-surface px-6 py-5 hover:bg-surface-strong transition-colors"
        >
          <span className="flex items-center gap-4">
            <SparkleIcon size={26} weight="fill" className="shrink-0 text-brand-orange" />
            <span>
              <span className="block text-[11px] font-semibold tracking-[0.15em] uppercase text-brand-orange">
                {retroMonth === lastMonth ? "Retrospectiva pronta" : "Retrospectiva em andamento"}
              </span>
              <span className="block mt-1 font-serif text-xl font-semibold">
                Seu mês no cinema: {monthLabel(retroMonth)}
              </span>
            </span>
          </span>
          <ArrowRightIcon size={20} weight="bold" className="shrink-0 text-brand-slate group-hover:translate-x-1 group-hover:text-foreground transition-all" />
        </Link>
      )}

      <section className="mt-14">
        <SectionHeading title="Recomendado para você" />
        <Recommendations items={recommendations.data} loading={recommendations.loading} />
      </section>

      <section className="mt-14">
        <SectionHeading title="Sua watchlist" href={`/u/${user.username}?tab=watchlist`} count={user.watchlistCount} />
        {watchlist.data && watchlist.data.length > 0 ? (
          <MovieGrid variant="compact" items={watchlist.data.slice(0, 6)} />
        ) : watchlist.loading ? (
          <GridSkeleton />
        ) : (
          <p className="text-sm text-brand-slate">
            Sua watchlist está vazia. Abra um filme e toque em <strong className="font-medium text-foreground">Watchlist</strong> para guardar para depois.
          </p>
        )}
      </section>

      {recentWritten.length > 0 && (
        <section className="mt-14">
          <SectionHeading title="Reviews recentes" />
          <div className="divide-y divide-foreground/10 -mt-5">
            {recentWritten.map((review) => (
              <ReviewCard key={review.id} review={review} excerpt />
            ))}
          </div>
        </section>
      )}

      <section className="mt-14">
        <SectionHeading title="Descubra algo novo" href="/movies" linkLabel="Mais" />
        {movies.loading ? <GridSkeleton /> : <MovieGrid variant="compact" items={discover.map((movie) => ({ movie }))} />}
      </section>
    </main>
  );
}

/** pôster da atividade: avatar de quem registrou por cima, nome e nota embaixo */
function ActivityPoster({ review }: { review: MovieReview }) {
  return (
    <li>
      <div className="relative">
        <Link href={filmHref(review.movie)} title={review.movie.title} className="group block">
          <Poster
            title={review.movie.title}
            posterPath={review.movie.posterPath}
            sizes="(min-width: 640px) 180px, 30vw"
            className="group-hover:ring-2 group-hover:ring-brand-orange transition-all"
          />
        </Link>
        <Link href={`/u/${review.user.username}`} className="absolute -bottom-3 left-1.5 rounded-full ring-2 ring-background" title={review.user.name}>
          <Avatar name={review.user.name} username={review.user.username} size="sm" />
        </Link>
      </div>
      <Link href={`/u/${review.user.username}`} className="mt-4 block text-sm font-semibold truncate hover:text-brand-orange">
        {review.user.name}
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

function GridSkeleton() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="aspect-2/3 rounded-[4px] bg-surface animate-pulse" />
      ))}
    </div>
  );
}
