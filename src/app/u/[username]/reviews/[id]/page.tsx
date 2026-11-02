"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeftIcon, CircleNotchIcon, EyeIcon, HeartIcon, WarningIcon } from "@phosphor-icons/react";

import Header from "@/app/components/header";
import { Avatar } from "@/app/components/ui/avatar";
import { Poster } from "@/app/components/ui/poster";
import { StarRating } from "@/app/components/ui/star-rating";
import { ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useFetch } from "@/lib/hooks/use-fetch";
import { getReview } from "@/lib/services/review-service";
import type { MovieReview } from "@/lib/types/review";
import { shortDate, timeAgo } from "@/utils/format";
import { toRating } from "@/utils/rating";

export default function ReviewPage() {
  const params = useParams<{ username: string; id: string }>();
  const router = useRouter();
  const reviewId = Number(params.id);
  const validId = Number.isInteger(reviewId) && reviewId > 0 ? reviewId : null;
  const review = useFetch(validId, getReview);

  // a URL tem o username: se a review for de outra pessoa, corrige o endereço
  const author = review.data?.user.username;
  useEffect(() => {
    if (author && author !== params.username) {
      router.replace(`/u/${author}/reviews/${reviewId}`);
    }
  }, [author, params.username, reviewId, router]);

  const notFound = validId === null || (review.error instanceof ApiError && review.error.status === 404);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Header />
      <main className="pt-28 sm:pt-32 pb-24 px-6 md:px-12 xl:px-24 max-w-[1100px] mx-auto">
        {notFound ? (
          <div className="py-32 text-center">
            <h1 className="text-3xl font-medium tracking-tight">Review não encontrada.</h1>
            <Link href={`/u/${params.username}`} className="inline-block mt-6 text-brand-blue hover:underline">
              Voltar ao perfil
            </Link>
          </div>
        ) : !review.data ? (
          <div className="py-32 flex justify-center text-brand-slate/40">
            {review.error ? "Não foi possível carregar a review." : <CircleNotchIcon size={32} className="animate-spin" />}
          </div>
        ) : (
          <ReviewView review={review.data} />
        )}
      </main>
    </div>
  );
}

function ReviewView({ review }: { review: MovieReview }) {
  const { user: me } = useAuth();
  const [revealed, setRevealed] = useState(false);
  const isOwn = me?.username === review.user.username;
  const hideText = review.spoiler && !isOwn && !revealed;
  const { movie, user } = review;

  return (
    <article>
      <Link
        href={`/u/${user.username}?tab=reviews`}
        className="inline-flex items-center gap-2 text-sm font-medium text-brand-slate/60 hover:text-foreground transition-colors"
      >
        <ArrowLeftIcon size={16} /> Reviews de {user.name}
      </Link>

      <div className="mt-8 flex flex-col sm:flex-row gap-8 sm:gap-12">
        <Link href={`/movies/${movie.id}`} className="w-40 sm:w-52 shrink-0 group">
          <Poster title={movie.title} posterPath={movie.posterPath} size="w500" sizes="208px" className="group-hover:ring-brand-orange/50 transition-all" />
        </Link>

        <div className="min-w-0 flex-1">
          <Link href={`/u/${user.username}`} className="inline-flex items-center gap-3 group">
            <Avatar name={user.name} username={user.username} size="md" />
            <span>
              <span className="block text-xs uppercase tracking-[0.15em] text-brand-slate/50">Review de</span>
              <span className="font-medium group-hover:text-brand-orange transition-colors">{user.name}</span>
            </span>
          </Link>

          <h1 className="mt-6 text-4xl sm:text-5xl font-semibold tracking-tighter leading-[0.95]">
            <Link href={`/movies/${movie.id}`} className="hover:text-brand-blue transition-colors">
              {movie.title}
            </Link>{" "}
            {movie.releaseYear && <span className="text-foreground/40 font-light text-3xl sm:text-4xl">{movie.releaseYear}</span>}
          </h1>

          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-brand-slate/60">
            {review.rating !== null && <StarRating rating={toRating(review.rating)} size={20} />}
            {review.liked && <HeartIcon size={18} weight="fill" className="text-brand-orange" aria-label="Curtiu" />}
            <span>Assistido em {shortDate(review.watchedOn)}</span>
            <span aria-hidden="true">·</span>
            <span>registrado {timeAgo(review.createdAt)}</span>
          </div>

          {review.text ? (
            hideText ? (
              <button
                type="button"
                onClick={() => setRevealed(true)}
                className="mt-10 flex items-center gap-3 w-full px-5 py-4 rounded-xl border border-dashed border-brand-crimson/30 bg-brand-crimson/5 text-left text-brand-slate/80 hover:border-brand-crimson/60 transition-colors"
              >
                <WarningIcon size={22} className="shrink-0 text-brand-crimson" />
                <span className="flex-1">Esta review contém spoilers.</span>
                <span className="flex items-center gap-1.5 font-medium text-brand-crimson">
                  <EyeIcon size={18} /> Mostrar mesmo assim
                </span>
              </button>
            ) : (
              <div className="mt-10">
                {review.spoiler && (
                  <span className="mb-3 flex items-center gap-1.5 w-fit text-[11px] font-bold uppercase tracking-[0.15em] text-brand-crimson">
                    <WarningIcon size={13} weight="bold" /> Spoiler
                  </span>
                )}
                <p className="text-lg leading-[1.8] text-foreground/85 whitespace-pre-line">{review.text}</p>
              </div>
            )
          ) : (
            <p className="mt-10 text-brand-slate/50">{user.name} registrou o filme sem escrever uma review.</p>
          )}

          {isOwn && (
            <Link href={`/movies/${movie.id}`} className="inline-block mt-10 text-sm font-medium text-brand-blue hover:underline underline-offset-4">
              Editar na página do filme
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
