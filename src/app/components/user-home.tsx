"use client";

import Link from "next/link";
import { ArrowRightIcon, BookmarkSimpleIcon, SparkleIcon } from "@phosphor-icons/react";
import type { UserProfile } from "@/lib/types/user";
import { useFetch } from "@/lib/hooks/use-fetch";
import { getMyRecommendations, getUserWatchlist } from "@/lib/services/user-service";
import { getRecentReviews } from "@/lib/services/review-service";
import { getMovies } from "@/lib/services/movie-service";
import { getRetrospectiveMonths } from "@/lib/services/retrospective-service";
import { currentMonth, monthLabel, shiftMonth } from "@/utils/format";
import { MovieGrid } from "./movie-grid";
import { ReviewCard } from "./review-card";
import { Recommendations } from "./recommendations";

const fetchRecent = () => getRecentReviews();
const fetchMovies = () => getMovies();
const fetchRecommendations = () => getMyRecommendations();

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Boa madrugada";
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function SectionHeader({ eyebrow, title, href, linkLabel }: {
  eyebrow: string;
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex justify-between items-end mb-8 gap-4">
      <div>
        <span className="text-xs font-bold tracking-[0.2em] uppercase text-brand-orange">{eyebrow}</span>
        <h2 className="text-2xl sm:text-3xl font-medium tracking-tight mt-2">{title}</h2>
      </div>
      {href && (
        <Link
          href={href}
          className="flex items-center gap-2 text-sm font-medium text-foreground/60 hover:text-brand-orange transition-colors group shrink-0"
        >
          {linkLabel}
          <ArrowRightIcon size={16} weight="bold" className="group-hover:translate-x-1 transition-transform" />
        </Link>
      )}
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div className="text-3xl sm:text-4xl font-semibold tracking-tight">{value}</div>
      <div className="text-xs uppercase tracking-[0.15em] text-brand-slate/60 mt-1">{label}</div>
    </div>
  );
}

export default function UserHome({ user }: { user: UserProfile }) {
  const firstName = user.name.split(" ")[0];
  const watchlist = useFetch(user.username, getUserWatchlist);
  const recent = useFetch("recent", fetchRecent);
  const movies = useFetch("all", fetchMovies);
  // a chave inclui a contagem de filmes: registrar um filme novo refaz as recomendações
  const recommendations = useFetch(`${user.username}:${user.filmsCount}`, fetchRecommendations);
  const retroMonths = useFetch(user.username, getRetrospectiveMonths);
  // o mês que acabou ganha destaque; se ele estiver vazio, mostramos o mês em andamento
  const lastMonth = shiftMonth(currentMonth(), -1);
  const retroMonth = retroMonths.data?.includes(lastMonth)
    ? lastMonth
    : retroMonths.data?.includes(currentMonth())
      ? currentMonth()
      : null;

  const watchlistIds = new Set(watchlist.data?.map((item) => item.movie.id));
  const discover = (movies.data ?? []).filter((movie) => !watchlistIds.has(movie.id)).slice(0, 12);

  return (
    <main className="pt-28 sm:pt-32 pb-24 px-6 md:px-12 xl:px-24 max-w-[1400px] mx-auto w-full">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-10 pb-14 border-b border-foreground/10">
        <div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tighter leading-none">
            {greeting()},{" "}
            <span className="italic font-light text-brand-slate/60">{firstName}.</span>
          </h1>
          <p className="mt-5 text-lg text-brand-slate/70 font-light">
            O que você assistiu hoje?
          </p>
        </div>
        <div className="flex gap-10 sm:gap-14">
          <Stat value={user.filmsCount} label="Filmes" />
          <Stat value={user.reviewsCount} label="Reviews" />
          <Stat value={user.watchlistCount} label="Watchlist" />
        </div>
      </section>

      {retroMonth && (
        <Link
          href={`/u/${user.username}/retrospectiva/${retroMonth}`}
          className="group mt-10 flex items-center justify-between gap-6 rounded-2xl bg-brand-charcoal text-background px-6 py-6 sm:px-8 hover:bg-brand-charcoal/95 transition-colors"
        >
          <span className="flex items-center gap-4">
            <SparkleIcon size={28} weight="fill" className="shrink-0 text-brand-orange" />
            <span>
              <span className="block text-xs font-bold tracking-[0.2em] uppercase text-brand-orange">
                {retroMonth === lastMonth ? "Retrospectiva pronta" : "Retrospectiva em andamento"}
              </span>
              <span className="block mt-1 text-lg sm:text-xl font-medium">
                Seu mês no cinema: {monthLabel(retroMonth)}
              </span>
            </span>
          </span>
          <ArrowRightIcon size={20} weight="bold" className="shrink-0 group-hover:translate-x-1 transition-transform" />
        </Link>
      )}

      <section className="pt-14">
        <SectionHeader eyebrow="Feito para você" title="Recomendado para você" />
        <Recommendations items={recommendations.data} loading={recommendations.loading} />
      </section>

      <section className="pt-16">
        <SectionHeader
          eyebrow="Para ver"
          title="Sua watchlist"
          href={`/u/${user.username}?tab=watchlist`}
          linkLabel="Ver tudo"
        />
        {watchlist.data && watchlist.data.length > 0 ? (
          <MovieGrid variant="compact" items={watchlist.data.slice(0, 6)} />
        ) : watchlist.loading ? (
          <GridSkeleton />
        ) : (
          <div className="flex items-center gap-4 rounded-xl border border-dashed border-foreground/15 px-6 py-8 text-brand-slate/70">
            <BookmarkSimpleIcon size={28} weight="light" className="shrink-0 text-brand-orange" />
            <p className="text-sm sm:text-base">
              Sua watchlist está vazia. Abra um filme e toque em <strong className="font-medium">Watchlist</strong> para guardar para depois.
            </p>
          </div>
        )}
      </section>

      <section className="pt-16">
        <SectionHeader eyebrow="Catálogo" title="Descubra algo novo" href="/movies" linkLabel="Todos os filmes" />
        {movies.loading ? <GridSkeleton /> : <MovieGrid variant="compact" items={discover.map((movie) => ({ movie }))} />}
      </section>

      <section className="pt-16">
        <SectionHeader eyebrow="Comunidade" title="Atividade recente" />
        {recent.data && recent.data.length > 0 ? (
          <div className="divide-y divide-foreground/10 border-t border-foreground/10">
            {recent.data.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        ) : recent.loading ? null : (
          <p className="text-brand-slate/60">
            Ninguém registrou nada ainda. Que tal ser a primeira review do Nitrate?
          </p>
        )}
      </section>
    </main>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-x-4 gap-y-6 sm:gap-x-5">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="aspect-2/3 rounded-sm bg-foreground/5 animate-pulse" />
      ))}
    </div>
  );
}
