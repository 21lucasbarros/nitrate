"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  BookmarkSimpleIcon,
  CheckCircleIcon,
  CircleNotchIcon,
  HeartIcon,
  PencilSimpleIcon,
  PlusIcon,
} from "@phosphor-icons/react";

import Header from "@/app/components/header";
import { Poster } from "@/app/components/ui/poster";
import { StarRating } from "@/app/components/ui/star-rating";
import { ReviewCard } from "@/app/components/review-card";
import { ReviewForm } from "@/app/components/review-form";
import { Modal } from "@/app/components/ui/modal";
import { ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useFetch } from "@/lib/hooks/use-fetch";
import { getMovie } from "@/lib/services/movie-service";
import { getMovieReviews } from "@/lib/services/review-service";
import { getMovieState } from "@/lib/services/user-service";
import { addToWatchlist, removeFromWatchlist } from "@/lib/services/watchlist-service";
import { shortDate } from "@/utils/format";
import { toRating } from "@/utils/rating";

export default function MoviePage() {
  const params = useParams<{ id: string }>();
  const movieId = Number(params.id);
  const validId = Number.isInteger(movieId) && movieId > 0 ? movieId : null;

  const { status, refreshUser } = useAuth();
  const movie = useFetch(validId, getMovie);
  const reviews = useFetch(validId, getMovieReviews);
  const myState = useFetch(status === "authenticated" ? validId : null, getMovieState);

  const [editing, setEditing] = useState(false);
  const [watchlistBusy, setWatchlistBusy] = useState(false);

  const notFound =
    validId === null || (movie.error instanceof ApiError && movie.error.status === 404);

  if (notFound) {
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

  const film = movie.data;
  const myReview = myState.data?.review ?? null;
  const inWatchlist = myState.data?.inWatchlist ?? false;

  const toggleWatchlist = async () => {
    if (!myState.data || validId === null) return;
    setWatchlistBusy(true);
    try {
      if (inWatchlist) await removeFromWatchlist(validId);
      else await addToWatchlist(validId);
      myState.setData({ ...myState.data, inWatchlist: !inWatchlist });
      refreshUser();
    } finally {
      setWatchlistBusy(false);
    }
  };

  const otherReviews = (reviews.data ?? []).filter((review) => review.id !== myReview?.id);

  return (
    <Shell>
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
            {film.director && (
              <>
                <span aria-hidden="true">·</span>
                <span>
                  Dirigido por <strong className="font-medium text-foreground">{film.director}</strong>
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

          {film.rating !== null && (
            <p className="mt-6 text-sm text-brand-slate/60">
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
              href={`/sign-in?redirect=${encodeURIComponent(`/movies/${film.id}`)}`}
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
                  <CheckCircleIcon size={20} weight="fill" />
                  Assistido em {shortDate(myReview.watchedOn)}
                </span>
                {myReview.rating !== null && <StarRating rating={toRating(myReview.rating)} size={18} />}
                {myReview.liked && <HeartIcon size={18} weight="fill" className="text-brand-orange" />}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 bg-brand-btn text-brand-btn-text px-6 py-3 rounded-full font-semibold hover:bg-brand-btn/90 transition-colors"
              >
                {myReview ? <PencilSimpleIcon size={18} /> : <PlusIcon size={18} weight="bold" />}
                {myReview ? "Editar review" : "Registrar / avaliar"}
              </button>
              {!myReview && (
                <button
                  onClick={toggleWatchlist}
                  disabled={watchlistBusy}
                  aria-pressed={inWatchlist}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium border transition-colors disabled:opacity-60 ${inWatchlist ? "border-brand-orange bg-brand-orange/10 text-brand-orange" : "border-brand-slate/20 text-brand-slate hover:border-brand-slate"}`}
                >
                  <BookmarkSimpleIcon size={18} weight={inWatchlist ? "fill" : "regular"} />
                  {inWatchlist ? "Na watchlist" : "Watchlist"}
                </button>
              )}
            </div>

            <Modal
              open={editing}
              onClose={() => setEditing(false)}
              label={myReview ? `Editar review de ${film.title}` : `Registrar ${film.title}`}
            >
              <ReviewForm
                movie={film}
                existing={myReview}
                onSaved={(saved) => {
                  // registrar tira o filme da watchlist (o backend faz o mesmo)
                  myState.setData({ review: saved, inWatchlist: false });
                  setEditing(false);
                  reviews.reload();
                  refreshUser();
                }}
                onDeleted={() => {
                  myState.setData({ review: null, inWatchlist });
                  setEditing(false);
                  reviews.reload();
                  refreshUser();
                }}
                onCancel={() => setEditing(false)}
              />
            </Modal>
          </div>
        )}
      </section>

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
    </Shell>
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
