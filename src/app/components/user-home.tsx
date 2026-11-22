"use client";

import Link from "next/link";
import { ArrowRightIcon, SparkleIcon, TelevisionSimpleIcon, UsersThreeIcon } from "@phosphor-icons/react";
import type { UserProfile } from "@/lib/types/user";
import type { MovieReview } from "@/lib/types/review";
import type { SeriesReview } from "@/types/series";
import { useFetch } from "@/lib/hooks/use-fetch";
import { getMyFeed, getMyRecommendations, getUserWatchlist } from "@/lib/services/user-service";
import { getRecentReviews } from "@/lib/services/review-service";
import { getCatalog } from "@/lib/services/movie-service";
import { getMySeriesFeed, getRecentSeriesReviews, getUserSeriesWatchlist } from "@/lib/services/series-service";
import { getFriendsLists, getOfficialLists, getPopularLists } from "@/lib/services/list-service";
import { getMyRetrospectiveMonths } from "@/lib/services/retrospective-service";
import { cachedFetcher } from "@/lib/cache";
import { currentMonth, monthLabel, shiftMonth } from "@/utils/format";
import { seriesHref } from "@/utils/series-link";
import type { MovieList } from "@/lib/types/list";
import type { WatchlistItem } from "@/lib/types/review";
import type { SeriesWatchlistItem } from "@/types/series";
import { MovieGrid, type MovieGridItem } from "./movie-grid";
import { Recommendations } from "./recommendations";
import { WhatToWatchButton } from "./what-to-watch";
import { ActivityPoster, type ActivityEntry } from "./activity-poster";
import { ListCard } from "./list-card";
import { ReviewCard } from "./review-card";
import { SectionHeading } from "./ui/section-heading";

// uma fileira de pôsteres (6) e, abaixo, as reviews escritas mais recentes
const RECENT_LIMIT = 12;
const RECENT_POSTERS = 6;
const RECENT_TEXTS = 3;
// seguindo mais gente que isso, os pôsteres mostram só o registro mais recente de cada pessoa
// (quem registrou 3 filmes seguidos não ocupa a fileira); com poucas pessoas, mostra tudo
const ONE_PER_PERSON_ABOVE = 4;
// o feed vem com folga (máximo da API) para sobrarem 6 pôsteres depois de deixar um por pessoa
const FEED_LIMIT = 30;
// a atividade da comunidade (para quem ainda não segue ninguém) não precisa ser buscada a cada visita
const fetchRecent = cachedFetcher(() => getRecentReviews(RECENT_LIMIT), 5 * 60 * 1000);
const fetchFeed = () => getMyFeed(FEED_LIMIT);
// as séries vêm de outro endpoint e entram na mesma fileira, na ordem de quando foram registradas
const fetchSeriesRecent = cachedFetcher(() => getRecentSeriesReviews(RECENT_LIMIT), 5 * 60 * 1000);
const fetchSeriesFeed = () => getMySeriesFeed(FEED_LIMIT);
const fetchRetroMonths = () => getMyRetrospectiveMonths();
// "Descubra algo novo": uma página do catálogo basta (antes vinha o acervo inteiro)
const DISCOVER_POOL = 30;
const fetchMovies = () => getCatalog(0, DISCOVER_POOL);
const fetchRecommendations = () => getMyRecommendations();
// as listas mais curtidas mudam devagar
const POPULAR_LISTS = 3;
const fetchPopularLists = cachedFetcher(() => getPopularLists(POPULAR_LISTS), 5 * 60 * 1000);
// as listas do Nitrate (feitas pelo admin) mudam menos ainda; uma fileira, o resto no perfil @nitrate
const OFFICIAL_LISTS = 3;
const fetchOfficialLists = cachedFetcher(() => getOfficialLists(), 10 * 60 * 1000);
// as listas de quem você segue: uma fileira, das atualizadas por último
const FRIENDS_LISTS = 3;
const fetchFriendsLists = () => getFriendsLists(FRIENDS_LISTS);
const WATCHLIST_POSTERS = 6;

export default function UserHome({ user }: { user: UserProfile }) {
  const firstName = user.name.split(" ")[0];
  const watchlist = useFetch(user.username, getUserWatchlist);
  const seriesWatchlist = useFetch(user.username, getUserSeriesWatchlist);
  const followsSomeone = user.followingCount > 0;
  // a chave inclui quantas pessoas você segue: seguir alguém novo refaz o feed
  const feed = useFetch(followsSomeone ? `${user.username}:${user.followingCount}` : null, fetchFeed);
  const community = useFetch(followsSomeone ? null : "recent", fetchRecent);
  const activity = followsSomeone ? feed : community;
  const seriesFeed = useFetch(followsSomeone ? `${user.username}:${user.followingCount}` : null, fetchSeriesFeed);
  const seriesCommunity = useFetch(followsSomeone ? null : "recent", fetchSeriesRecent);
  const seriesActivity = followsSomeone ? seriesFeed : seriesCommunity;
  const movies = useFetch("all", fetchMovies);
  // a chave inclui a contagem de filmes: registrar um filme novo refaz as recomendações
  const recommendations = useFetch(`${user.username}:${user.filmsCount}`, fetchRecommendations);
  const retroMonths = useFetch(user.username, fetchRetroMonths);
  const popularLists = useFetch("popular", fetchPopularLists);
  const officialLists = useFetch("official", fetchOfficialLists);
  const friendsLists = useFetch(followsSomeone ? `${user.username}:${user.followingCount}` : null, fetchFriendsLists);
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
  // se as séries falharem, a fileira sai só com os filmes em vez de ficar carregando
  const seriesReady = seriesActivity.data !== undefined || seriesActivity.error !== undefined;
  const entries = activity.data && seriesReady ? mergeActivity(activity.data, seriesActivity.data ?? []) : undefined;
  // filmes e séries da watchlist juntos, dos guardados por último; se as séries falharem, só os filmes
  const watchlistReady = watchlist.data && (seriesWatchlist.data || seriesWatchlist.error);
  const watchlistItems = watchlistReady ? mergeWatchlist(watchlist.data ?? [], seriesWatchlist.data ?? []) : undefined;
  const watchlistCount = user.watchlistCount + (user.seriesWatchlistCount ?? 0);
  // a lista do Nitrate já tem a seção dela: não se repete entre as populares
  const officialIds = new Set(officialLists.data?.map((list) => list.id));
  const popular = (popularLists.data ?? []).filter((list) => !officialIds.has(list.id));
  const posters = followsSomeone && user.followingCount > ONE_PER_PERSON_ABOVE
    ? latestPerPerson(entries ?? [])
    : (entries ?? []);

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
        {entries ? (
          entries.length > 0 ? (
            <ul className="grid grid-cols-3 sm:grid-cols-6 gap-x-3 gap-y-6 sm:gap-x-4">
              {posters.slice(0, RECENT_POSTERS).map((entry) => (
                <ActivityPoster key={`${entry.kind}-${entry.review.id}`} entry={entry} />
              ))}
            </ul>
          ) : (
            <p className="text-brand-slate">Quem você segue ainda não registrou nenhum filme ou série.</p>
          )
        ) : (
          <GridSkeleton />
        )}
      </section>

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
          count={watchlistCount}
          action={
            <span className="flex items-baseline gap-4 sm:gap-5">
              {/* o sorteio daqui é só de filmes; o das séries fica na aba Watchlist do perfil */}
              {watchlist.data && <WhatToWatchButton movies={watchlist.data.map((item) => item.movie)} />}
              <Link href={`/u/${user.username}?tab=watchlist`} className="whitespace-nowrap text-sm text-brand-slate hover:text-foreground transition-colors">
                Ver tudo
              </Link>
            </span>
          }
        />
        {!watchlistItems ? (
          <GridSkeleton />
        ) : watchlistItems.length > 0 ? (
          <MovieGrid variant="compact" items={watchlistItems.slice(0, WATCHLIST_POSTERS)} />
        ) : (
          <p className="text-sm text-brand-slate">
            Sua watchlist está vazia. Abra um filme ou uma série e toque em <strong className="font-medium text-foreground">Watchlist</strong> para guardar para depois.
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

      {/* listas: de quem você segue, as mais curtidas do site e as do Nitrate */}
      {friendsLists.data && friendsLists.data.length > 0 && (
        <ListsSection title="Listas dos amigos" lists={friendsLists.data} showOwner />
      )}

      {popular.length > 0 && <ListsSection title="Listas mais curtidas" lists={popular} showOwner />}

      {officialLists.data && officialLists.data.length > 0 && (
        <section className="mt-12">
          <SectionHeading
            title="Listas do Nitrate"
            href={officialLists.data.length > OFFICIAL_LISTS ? "/u/nitrate?tab=listas" : undefined}
            linkLabel="Ver todas"
          />
          <ListGrid lists={officialLists.data.slice(0, OFFICIAL_LISTS)} />
        </section>
      )}


      <section className="mt-12">
        <SectionHeading title="Descubra algo novo" href="/movies" linkLabel="Mais" />
        {movies.loading ? <GridSkeleton /> : <MovieGrid variant="compact" items={discover.map((movie) => ({ movie }))} />}
      </section>
    </main>
  );
}

function ListsSection({ title, lists, showOwner = false }: { title: string; lists: MovieList[]; showOwner?: boolean }) {
  return (
    <section className="mt-12">
      <SectionHeading title={title} />
      <ListGrid lists={lists} showOwner={showOwner} />
    </section>
  );
}

function ListGrid({ lists, showOwner = false }: { lists: MovieList[]; showOwner?: boolean }) {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
      {lists.map((list) => (
        <li key={list.id}>
          <ListCard list={list} showOwner={showOwner} />
        </li>
      ))}
    </ul>
  );
}

/** a watchlist da home: filmes e séries juntos, dos guardados por último; a série leva o selo */
function mergeWatchlist(movies: WatchlistItem[], series: SeriesWatchlistItem[]): MovieGridItem[] {
  const items: { addedAt: string; item: MovieGridItem }[] = [
    ...movies.map((w) => ({ addedAt: w.addedAt, item: { movie: w.movie } })),
    ...series.map((w) => ({
      addedAt: w.addedAt,
      item: {
        movie: { id: `series-${w.series.id}`, title: w.series.name, posterPath: w.series.posterPath, releaseYear: w.series.firstAirYear },
        href: seriesHref(w.series),
        badge: (
          <>
            <TelevisionSimpleIcon size={11} weight="bold" className="text-brand-orange" /> Série
          </>
        ),
      },
    })),
  ];
  return items.sort((a, b) => Date.parse(b.addedAt) - Date.parse(a.addedAt)).map(({ item }) => item);
}

/** filmes e séries numa fileira só, do registro mais recente para o mais antigo */
function mergeActivity(movies: MovieReview[], series: SeriesReview[]): ActivityEntry[] {
  // Date.parse: o Instant pode vir com mais ou menos casas de fração, e aí comparar texto erra
  return [
    ...movies.map((review): ActivityEntry => ({ kind: "movie", review })),
    ...series.map((review): ActivityEntry => ({ kind: "series", review })),
  ].sort((a, b) => Date.parse(b.review.createdAt) - Date.parse(a.review.createdAt));
}

/** a fileira já vem do mais recente para o mais antigo: fica o primeiro registro de cada pessoa */
function latestPerPerson(entries: ActivityEntry[]): ActivityEntry[] {
  const seen = new Set<string>();
  return entries.filter(({ review }) => {
    if (seen.has(review.user.username)) return false;
    seen.add(review.user.username);
    return true;
  });
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
