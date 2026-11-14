"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowsClockwiseIcon,
  BookmarkSimpleIcon,
  CheckCircleIcon,
  CircleNotchIcon,
  HeartIcon,
  PencilSimpleIcon,
  PlusIcon,
} from "@phosphor-icons/react";

import Header from "@/app/components/header";
import { Poster } from "@/app/components/ui/poster";
import { PersonPhoto } from "@/app/components/ui/person-photo";
import { StarRating } from "@/app/components/ui/star-rating";
import { ReviewCard } from "@/app/components/review-card";
import { ReviewForm } from "@/app/components/review-form";
import { Modal } from "@/app/components/ui/modal";
import { ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useFetch } from "@/lib/hooks/use-fetch";
import { getMovieBySlug, getMovieCredits, getMovieStats, getWatchProviders, type CreditPerson } from "@/lib/services/movie-service";
import { NitrateRating, WhereToWatch } from "@/app/components/movie-community";
import { getMovieReviews } from "@/lib/services/review-service";
import { getMovieState } from "@/lib/services/user-service";
import { addToWatchlist, removeFromWatchlist } from "@/lib/services/watchlist-service";
import type { Movie } from "@/types/movie";
import { shortDate } from "@/utils/format";
import { toRating } from "@/utils/rating";

const CAST_PREVIEW = 12;

export default function FilmPage() {
  const { slug } = useParams<{ slug: string }>();
  const movie = useFetch(slug, getMovieBySlug);

  if (movie.error instanceof ApiError && movie.error.status === 404) {
    return (
      <Shell>
        <div className="py-32 text-center">
          <h1 className="text-3xl font-medium tracking-tight">Filme não encontrado.</h1>
          <Link href="/movies" className="inline-block mt-6 text-brand-blue hover:underline">
            Ver todos os filmes
          </Link>
        </div>
      </Shell>
    );
  }

  if (!movie.data) {
    return (
      <Shell>
        <div className="py-32 flex justify-center text-brand-slate/40">
          {movie.error ? "Não foi possível carregar o filme." : <CircleNotchIcon size={32} className="animate-spin" />}
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <FilmView film={movie.data} />
    </Shell>
  );
}

function FilmView({ film }: { film: Movie }) {
  const { status, refreshUser } = useAuth();
  const reviews = useFetch(film.id, getMovieReviews);
  const credits = useFetch(film.id, getMovieCredits);
  const stats = useFetch(film.id, getMovieStats);
  const providers = useFetch(film.id, getWatchProviders);
  const myState = useFetch(status === "authenticated" ? film.id : null, getMovieState);

  // "edit" = editar a review mais recente; "new" = registrar de novo (reassistido)
  const [editing, setEditing] = useState<"edit" | "new" | null>(null);
  const [watchlistBusy, setWatchlistBusy] = useState(false);

  const myReview = myState.data?.review ?? null;
  const timesWatched = myState.data?.reviewsCount ?? 0;
  const inWatchlist = myState.data?.inWatchlist ?? false;

  const toggleWatchlist = async () => {
    if (!myState.data) return;
    setWatchlistBusy(true);
    try {
      if (inWatchlist) await removeFromWatchlist(film.id);
      else await addToWatchlist(film.id);
      myState.setData({ ...myState.data, inWatchlist: !inWatchlist });
      refreshUser();
    } finally {
      setWatchlistBusy(false);
    }
  };

  const afterChange = () => {
    setEditing(null);
    myState.reload();
    reviews.reload();
    stats.reload(); // a nota média muda com a nova review
    refreshUser();
  };

  const otherReviews = (reviews.data ?? []).filter((review) => review.id !== myReview?.id);
  // a direção vem do TMDB (com link); enquanto carrega, mostramos o nome que já temos
  const directors = credits.data?.directors ?? [];

  return (
    <>
      <section className="flex flex-col sm:flex-row gap-8 sm:gap-12 pb-14 border-b border-foreground/10">
        <div className="w-44 sm:w-56 md:w-64 shrink-0">
          <Poster title={film.title} posterPath={film.posterPath} size="w500" sizes="256px" />
        </div>

        <div className="flex flex-col min-w-0">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tighter leading-[0.95]">
            {film.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-4 text-brand-slate/70">
            {film.releaseYear && <span className="font-mono">{film.releaseYear}</span>}
            {(directors.length > 0 || film.director) && (
              <>
                <span aria-hidden="true">·</span>
                <span>
                  Dirigido por{" "}
                  {directors.length > 0
                    ? directors.map((d, i) => (
                        <span key={d.tmdbId}>
                          {i > 0 && (i === directors.length - 1 ? " e " : ", ")}
                          <Link
                            href={`/person/${d.tmdbId}`}
                            className="font-medium text-foreground hover:text-brand-orange underline-offset-4 hover:underline"
                          >
                            {d.name}
                          </Link>
                        </span>
                      ))
                    : <strong className="font-medium text-foreground">{film.director}</strong>}
                </span>
              </>
            )}
          </div>

          {film.genres.length > 0 && (
            <ul className="flex flex-wrap gap-2 mt-5">
              {film.genres.map((genre) => (
                <li key={genre} className="px-3 py-1 rounded-full border border-foreground/10 text-xs text-brand-slate/80">
                  {genre}
                </li>
              ))}
            </ul>
          )}

          {film.overview && (
            <p className="mt-6 text-base sm:text-lg leading-relaxed text-foreground/80 font-light max-w-2xl">
              {film.overview}
            </p>
          )}

          <div className="mt-8 w-full max-w-sm">
            {stats.data ? (
              <NitrateRating stats={stats.data} />
            ) : (
              <div className="h-36 rounded-2xl bg-foreground/5 animate-pulse" />
            )}
          </div>

          {film.rating !== null && (
            <p className="mt-4 text-sm text-brand-slate/60">
              Nota TMDB <span className="font-mono text-foreground">{film.rating.toFixed(1)}</span>/10
            </p>
          )}
        </div>
      </section>

      {/* ações do usuário */}
      <section className="py-10 border-b border-foreground/10">
        {status === "anonymous" && (
          <p className="text-brand-slate/70">
            <Link
              href={`/sign-in?redirect=${encodeURIComponent(`/film/${film.slug}`)}`}
              className="font-medium text-brand-blue hover:underline"
            >
              Entre
            </Link>{" "}
            para registrar este filme no seu diário ou guardar na watchlist.
          </p>
        )}

        {status === "authenticated" && myState.data && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            {myReview && (
              <div className="flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-2 text-sm font-medium text-brand-emerald">
                  {timesWatched > 1 ? <ArrowsClockwiseIcon size={20} weight="bold" /> : <CheckCircleIcon size={20} weight="fill" />}
                  {timesWatched > 1
                    ? `Assistido ${timesWatched} vezes · último em ${shortDate(myReview.watchedOn)}`
                    : `Assistido em ${shortDate(myReview.watchedOn)}`}
                </span>
                {myReview.rating !== null && <StarRating rating={toRating(myReview.rating)} size={18} />}
                {myReview.liked && <HeartIcon size={18} weight="fill" className="text-brand-orange" />}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              {myReview ? (
                <>
                  <button
                    onClick={() => setEditing("new")}
                    className="flex items-center gap-2 bg-brand-btn text-brand-btn-text px-6 py-3 rounded-full font-semibold hover:bg-brand-btn/90 transition-colors"
                  >
                    <ArrowsClockwiseIcon size={18} weight="bold" />
                    Assisti de novo
                  </button>
                  <button
                    onClick={() => setEditing("edit")}
                    className="flex items-center gap-2 px-6 py-3 rounded-full font-medium border border-brand-slate/20 text-brand-slate hover:border-brand-slate transition-colors"
                  >
                    <PencilSimpleIcon size={18} />
                    Editar última review
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setEditing("new")}
                    className="flex items-center gap-2 bg-brand-btn text-brand-btn-text px-6 py-3 rounded-full font-semibold hover:bg-brand-btn/90 transition-colors"
                  >
                    <PlusIcon size={18} weight="bold" />
                    Registrar / avaliar
                  </button>
                  <button
                    onClick={toggleWatchlist}
                    disabled={watchlistBusy}
                    aria-pressed={inWatchlist}
                    className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium border transition-colors disabled:opacity-60 ${inWatchlist ? "border-brand-orange bg-brand-orange/10 text-brand-orange" : "border-brand-slate/20 text-brand-slate hover:border-brand-slate"}`}
                  >
                    <BookmarkSimpleIcon size={18} weight={inWatchlist ? "fill" : "regular"} />
                    {inWatchlist ? "Na watchlist" : "Watchlist"}
                  </button>
                </>
              )}
            </div>

            <Modal
              open={editing !== null}
              onClose={() => setEditing(null)}
              label={editing === "edit" ? `Editar review de ${film.title}` : `Registrar ${film.title}`}
            >
              {/* key: trocar entre "editar" e "assisti de novo" recria o formulário */}
              <ReviewForm
                key={editing ?? "closed"}
                movie={film}
                existing={editing === "edit" ? myReview : null}
                previouslyWatched={timesWatched > 0}
                onSaved={afterChange}
                onDeleted={afterChange}
                onCancel={() => setEditing(null)}
              />
            </Modal>
          </div>
        )}
      </section>

      {providers.data && <WhereToWatch providers={providers.data} />}

      {credits.data && credits.data.cast.length > 0 && <Cast cast={credits.data.cast} />}

      <section className="pt-12">
        <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-brand-orange mb-2">Reviews</h2>
        {myReview && (
          <div className="border-b border-foreground/10">
            <ReviewCard review={myReview} hideMovie />
          </div>
        )}
        {otherReviews.length > 0 ? (
          <div className="divide-y divide-foreground/10">
            {otherReviews.map((review) => (
              <ReviewCard key={review.id} review={review} hideMovie />
            ))}
          </div>
        ) : (
          !reviews.loading && !myReview && (
            <p className="py-8 text-brand-slate/60">Ninguém registrou este filme ainda.</p>
          )
        )}
      </section>
    </>
  );
}

function Cast({ cast }: { cast: CreditPerson[] }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? cast : cast.slice(0, CAST_PREVIEW);

  return (
    <section className="py-12 border-b border-foreground/10">
      <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-brand-orange mb-6">Elenco</h2>
      <ul className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-x-4 gap-y-7">
        {visible.map((person) => (
          <li key={`${person.tmdbId}-${person.role}`}>
            <Link href={`/person/${person.tmdbId}`} className="group flex flex-col items-center text-center">
              <PersonPhoto
                name={person.name}
                profilePath={person.profilePath}
                sizes="96px"
                className="w-20 sm:w-24 group-hover:ring-brand-orange/50 transition-all"
              />
              <span className="mt-3 text-sm font-medium leading-tight group-hover:text-brand-blue transition-colors">
                {person.name}
              </span>
              {person.role && (
                <span className="mt-1 text-xs text-brand-slate/50 leading-snug line-clamp-2">{person.role}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
      {cast.length > CAST_PREVIEW && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-8 text-sm font-medium text-brand-blue hover:underline underline-offset-4"
        >
          {showAll ? "Mostrar menos" : `Ver elenco completo (${cast.length})`}
        </button>
      )}
    </section>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Header />
      <main className="pt-28 sm:pt-32 pb-24 px-6 md:px-12 xl:px-24 max-w-[1400px] mx-auto">{children}</main>
    </div>
  );
}
