"use client";

import Link from "next/link";
import { ArrowRightIcon, SparkleIcon, UsersThreeIcon } from "@phosphor-icons/react";
import type { UserProfile } from "@/lib/types/user";
import { useFetch } from "@/lib/hooks/use-fetch";
import { getMyFeed, getMyRecommendations, getSimilarUsers, getUserWatchlist } from "@/lib/services/user-service";
import { getRecentReviews } from "@/lib/services/review-service";
import { getCatalog } from "@/lib/services/movie-service";
import { getMyRetrospectiveMonths } from "@/lib/services/retrospective-service";
import { cachedFetcher } from "@/lib/cache";
import { currentMonth, monthLabel, shiftMonth } from "@/utils/format";
import { MovieGrid } from "./movie-grid";
import { Recommendations } from "./recommendations";
import { SimilarUsers } from "./similar-users";
import { WhatToWatchButton } from "./what-to-watch";
import { ActivityPoster } from "./activity-poster";
import { ReviewCard } from "./review-card";
import { SectionHeading } from "./ui/section-heading";

// uma fileira de pôsteres (6) e, abaixo, as reviews escritas mais recentes
const RECENT_LIMIT = 12;
const RECENT_POSTERS = 6;
const RECENT_TEXTS = 3;
// a atividade da comunidade (para quem ainda não segue ninguém) não precisa ser buscada a cada visita
const fetchRecent = cachedFetcher(() => getRecentReviews(RECENT_LIMIT), 5 * 60 * 1000);
const fetchFeed = () => getMyFeed(RECENT_LIMIT);
const fetchRetroMonths = () => getMyRetrospectiveMonths();
// "Descubra algo novo": uma página do catálogo basta (antes vinha o acervo inteiro)
const DISCOVER_POOL = 30;
const fetchMovies = () => getCatalog(0, DISCOVER_POOL);
const fetchRecommendations = () => getMyRecommendations();
const fetchSimilar = () => getSimilarUsers();

export default function UserHome({ user }: { user: UserProfile }) {
  const firstName = user.name.split(" ")[0];
  const watchlist = useFetch(user.username, getUserWatchlist);
  const followsSomeone = user.followingCount > 0;
  // a chave inclui quantas pessoas você segue: seguir alguém novo refaz o feed
  const feed = useFetch(followsSomeone ? `${user.username}:${user.followingCount}` : null, fetchFeed);
  const community = useFetch(followsSomeone ? null : "recent", fetchRecent);
  const activity = followsSomeone ? feed : community;
  const movies = useFetch("all", fetchMovies);
  // a chave inclui a contagem de filmes: registrar um filme novo refaz as recomendações
  const recommendations = useFetch(`${user.username}:${user.filmsCount}`, fetchRecommendations);
  const retroMonths = useFetch(user.username, fetchRetroMonths);
  // a chave inclui quem você segue e quantos filmes registrou: os dois mudam as sugestões
  const similar = useFetch(`${user.username}:${user.followingCount}:${user.filmsCount}`, fetchSimilar);
  // o mês que acabou ganha destaque; se ele estiver vazio, mostramos o mês em andamento
  const lastMonth = shiftMonth(currentMonth(), -1);
  const retroMonth = retroMonths.data?.includes(lastMonth)
    ? lastMonth
    : retroMonths.data?.includes(currentMonth())
      ? currentMonth()
      : null;

  const watchlistIds = new Set(watchlist.data?.map((item) => item.movie.id));
  const discover = (movies.data?.items ?? []).filter((movie) => !watchlistIds.has(movie.id)).slice(0, 12);
  const recentWritten = (activity.data ?? []).filter((r) => r.text && !r.spoiler).slice(0, RECENT_TEXTS);

  return (
    <main className="pt-28 sm:pt-32 pb-24 px-6 max-w-[1100px] mx-auto w-full">
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
        {greeting()}, {firstName}.
      </h1>
      <p className="mt-1.5 text-brand-slate">
        {followsSomeone ? "Veja o que seus amigos andam assistindo." : "Veja o que a comunidade anda assistindo."}
      </p>

      <section className="mt-10">
        <SectionHeading
          title={followsSomeone ? "Seus amigos assistiram" : "Na comunidade"}
          href={followsSomeone ? "/amigos" : undefined}
          linkLabel="Ver tudo"
        />
        {!followsSomeone && (
          <p className="-mt-1 mb-5 flex items-center gap-2 text-sm text-brand-slate">
            <UsersThreeIcon size={16} />
            Siga pessoas para ver aqui o que elas assistem. Busque perfis pelo nome na{" "}
            <Link href="/movies" className="text-foreground underline underline-offset-4 decoration-foreground/30 hover:decoration-brand-orange">
              busca
            </Link>.
          </p>
        )}
        {activity.data ? (
          activity.data.length > 0 ? (
            <ul className="grid grid-cols-3 sm:grid-cols-6 gap-x-3 gap-y-6 sm:gap-x-4">
              {activity.data.slice(0, RECENT_POSTERS).map((review) => (
                <ActivityPoster key={review.id} review={review} />
              ))}
            </ul>
          ) : (
            <p className="text-brand-slate">Quem você segue ainda não registrou nenhum filme.</p>
          )
        ) : (
          <GridSkeleton />
        )}
      </section>

      {similar.data && similar.data.length > 0 && (
        <section className="mt-12">
          <SectionHeading title="Cinéfilos com gosto parecido" href="/amigos?tab=pessoas" linkLabel="Amigos" />
          <SimilarUsers users={similar.data.slice(0, 4)} />
        </section>
      )}

      {retroMonth && (
        <Link
          href={`/u/${user.username}/retrospectiva/${retroMonth}`}
          className="group mt-10 flex items-center justify-between gap-6 rounded-md bg-surface px-5 py-4 hover:bg-surface-strong transition-colors"
        >
          <span className="flex items-center gap-4">
            <SparkleIcon size={22} weight="fill" className="shrink-0 text-brand-orange" />
            <span>
              <span className="block text-[11px] font-semibold tracking-[0.15em] uppercase text-brand-orange">
                {retroMonth === lastMonth ? "Retrospectiva pronta" : "Retrospectiva em andamento"}
              </span>
              <span className="block mt-0.5 font-medium">
                Seu mês no cinema: {monthLabel(retroMonth)}
              </span>
            </span>
          </span>
          <ArrowRightIcon size={20} weight="bold" className="shrink-0 text-brand-slate group-hover:translate-x-1 group-hover:text-foreground transition-all" />
        </Link>
      )}

      <section className="mt-12">
        <SectionHeading title="Recomendado para você" />
        <Recommendations items={recommendations.data} loading={recommendations.loading} />
      </section>

      <section className="mt-12">
        <SectionHeading
          title="Sua watchlist"
          count={user.watchlistCount}
          action={
            <span className="flex items-baseline gap-5">
              {watchlist.data && <WhatToWatchButton movies={watchlist.data.map((item) => item.movie)} />}
              <Link href={`/u/${user.username}?tab=watchlist`} className="text-sm text-brand-slate hover:text-foreground transition-colors">
                Ver tudo
              </Link>
            </span>
          }
        />
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
        <section className="mt-12">
          <SectionHeading title={followsSomeone ? "Reviews dos amigos" : "Reviews recentes"} />
          <div className="divide-y divide-foreground/10 -mt-5">
            {recentWritten.map((review) => (
              <ReviewCard key={review.id} review={review} excerpt />
            ))}
          </div>
        </section>
      )}

      <section className="mt-12">
        <SectionHeading title="Descubra algo novo" href="/movies" linkLabel="Mais" />
        {movies.loading ? <GridSkeleton /> : <MovieGrid variant="compact" items={discover.map((movie) => ({ movie }))} />}
      </section>
    </main>
  );
}

/** saudação pela hora do dia */
function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Boa madrugada";
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="aspect-2/3 rounded-md bg-surface animate-pulse" />
      ))}
    </div>
  );
}
