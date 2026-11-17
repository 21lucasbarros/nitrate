"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRightIcon,
  ArrowsClockwiseIcon,
  ChatCircleIcon,
  CheckIcon,
  CircleNotchIcon,
  EyeIcon,
  FilmSlateIcon,
  HeartIcon,
  InstagramLogoIcon,
  LinkSimpleIcon,
  ListPlusIcon,
  PencilSimpleIcon,
  WarningIcon,
} from "@phosphor-icons/react";

import Header from "@/app/components/header";
import { AddToListModal } from "@/app/components/add-to-list";
import { NitrateRating } from "@/app/components/movie-community";
import { ReviewComments } from "@/app/components/review-comments";
import { ReviewForm } from "@/app/components/review-form";
import { reviewHref } from "@/app/components/review-card";
import { ShareReviewStoryModal } from "@/app/components/review-story-share";
import { Avatar } from "@/app/components/ui/avatar";
import { Modal } from "@/app/components/ui/modal";
import { Poster } from "@/app/components/ui/poster";
import { ReviewText } from "@/app/components/ui/review-text";
import { StarRating } from "@/app/components/ui/star-rating";
import { ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useMovieEasterEgg } from "@/lib/easter-eggs";
import { useFetch } from "@/lib/hooks/use-fetch";
import { getMovieCredits, getMovieStats } from "@/lib/services/movie-service";
import { getReview, getReviewEngagement, likeReview, unlikeReview } from "@/lib/services/review-service";
import { getUserReviews } from "@/lib/services/user-service";
import type { MovieReview, ReviewEngagement } from "@/lib/types/review";
import { shortDate, timeAgo } from "@/utils/format";
import { filmHref } from "@/utils/movie-link";
import { backdropUrl } from "@/utils/poster";
import { toRating } from "@/utils/rating";

// "Mais de Fulano": os últimos registros da pessoa, sem o desta página
const MORE_FROM = 6;
const fetchMoreFrom = (username: string) => getUserReviews(username, { page: 0, size: MORE_FROM + 1 });

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
      {notFound ? (
        <div className="pt-48 pb-24 text-center">
          <h1 className="text-3xl font-medium tracking-tight">Review não encontrada.</h1>
          <Link href={`/u/${params.username}`} className="inline-block mt-6 text-brand-blue hover:underline">
            Voltar ao perfil
          </Link>
        </div>
      ) : !review.data ? (
        <div className="pt-48 pb-24 flex justify-center text-brand-slate/40">
          {review.error ? "Não foi possível carregar a review." : <CircleNotchIcon size={32} className="animate-spin" />}
        </div>
      ) : (
        <ReviewView
          review={review.data}
          onChange={review.setData}
          // apagou a review: não há mais o que mostrar aqui
          onDeleted={() => router.push(`/u/${review.data?.user.username ?? params.username}`)}
        />
      )}
    </div>
  );
}

function ReviewView({ review, onChange, onDeleted }: {
  review: MovieReview;
  onChange: (review: MovieReview) => void;
  onDeleted: () => void;
}) {
  const { status, user: me, refreshUser } = useAuth();
  const [revealed, setRevealed] = useState(false);
  const [editing, setEditing] = useState(false);
  const isOwn = me?.username === review.user.username;
  const { movie, user } = review;

  // espera a sessão: com token, a resposta diz se você já curtiu
  const engagement = useFetch(status === "loading" ? null : review.id, getReviewEngagement);
  const credits = useFetch(movie.id, getMovieCredits);
  const stats = useFetch(movie.id, getMovieStats);
  const moreFrom = useFetch(user.username, fetchMoreFrom);
  useMovieEasterEgg(movie);

  const hideText = review.spoiler && !isOwn && !revealed;
  const backdrop = backdropUrl(credits.data?.backdropPath);
  const director = credits.data?.directors[0]?.name ?? movie.director;
  const firstName = user.name.split(" ")[0];
  const others = (moreFrom.data?.items ?? []).filter((r) => r.id !== review.id).slice(0, MORE_FROM);

  return (
    <article>
      {/* a cena do filme no topo, desbotando para o fundo (o mesmo clima da página do filme) */}
      <div className="relative h-[260px] sm:h-[360px] lg:h-[440px] -mb-[160px] sm:-mb-[240px] lg:-mb-[300px]">
        {backdrop && (
          <Image src={backdrop} alt="" fill priority sizes="100vw" className="object-cover object-[center_25%] opacity-35" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-background via-background/60 to-background/10" />
        <div className="absolute inset-0 bg-linear-to-r from-background via-transparent to-background opacity-80" />
      </div>

      <div className={`relative max-w-[1180px] mx-auto px-6 pb-24 ${backdrop ? "" : "pt-32"}`}>
        <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] lg:grid-cols-[200px_1fr_270px] gap-8 lg:gap-12">
          {/* pôster e ficha rápida do filme */}
          <aside className="flex md:flex-col gap-5 md:pt-24">
            <Link href={filmHref(movie)} className="group w-28 md:w-full shrink-0">
              <Poster
                title={movie.title}
                posterPath={movie.posterPath}
                size="w500"
                sizes="200px"
                className="shadow-2xl shadow-black/60 group-hover:ring-brand-orange/50 transition-all"
              />
            </Link>
            <div className="flex flex-col gap-3 text-sm min-w-0 self-end md:self-auto">
              {director && (
                <p className="text-brand-slate">
                  <span className="block text-[11px] uppercase tracking-[0.14em] text-brand-slate/60">Direção</span>
                  <span className="text-foreground/85">{director}</span>
                </p>
              )}
              {movie.genres.length > 0 && (
                <ul className="flex flex-wrap gap-1.5">
                  {movie.genres.slice(0, 3).map((genre) => (
                    <li key={genre} className="px-2 py-0.5 rounded-full bg-surface text-xs text-brand-slate">{genre}</li>
                  ))}
                </ul>
              )}
              <Link href={filmHref(movie)} className="group inline-flex items-center gap-1.5 text-brand-blue hover:underline underline-offset-4">
                Página do filme <ArrowRightIcon size={13} weight="bold" className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </aside>

          {/* a review */}
          <section className="min-w-0 md:pt-24">
            <Link href={`/u/${user.username}`} className="group flex items-center gap-3 pb-4 border-b border-foreground/10">
              <Avatar name={user.name} username={user.username} size="sm" />
              <span className="text-sm text-brand-slate">
                Review de <span className="font-semibold text-foreground group-hover:text-brand-orange transition-colors">{user.name}</span>
              </span>
              <span className="ml-auto text-xs text-brand-slate/60">registrada {timeAgo(review.createdAt)}</span>
            </Link>

            <h1 className="mt-6 font-serif text-4xl sm:text-5xl font-semibold leading-[1.05] tracking-tight">
              <Link href={filmHref(movie)} className="hover:text-brand-blue transition-colors">{movie.title}</Link>{" "}
              {movie.releaseYear && <span className="font-sans text-2xl sm:text-3xl font-light text-foreground/40">{movie.releaseYear}</span>}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-brand-slate">
              {review.rating !== null && <StarRating rating={toRating(review.rating)} size={20} />}
              {review.liked && <HeartIcon size={18} weight="fill" className="text-brand-orange" aria-label="Curtiu o filme" />}
              {review.rewatch && (
                <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-brand-emerald">
                  <ArrowsClockwiseIcon size={14} weight="bold" /> Reassistido
                </span>
              )}
              <span>Sessão de {shortDate(review.watchedOn)}</span>
            </div>

            {review.text ? (
              hideText ? (
                <button
                  type="button"
                  onClick={() => setRevealed(true)}
                  className="mt-8 flex items-center gap-3 w-full px-5 py-4 rounded-xl border border-dashed border-brand-crimson/30 bg-brand-crimson/5 text-left text-brand-slate/80 hover:border-brand-crimson/60 transition-colors"
                >
                  <WarningIcon size={22} className="shrink-0 text-brand-crimson" />
                  <span className="flex-1">Esta review contém spoilers.</span>
                  <span className="flex items-center gap-1.5 font-medium text-brand-crimson">
                    <EyeIcon size={18} /> Mostrar mesmo assim
                  </span>
                </button>
              ) : (
                <div className="mt-8">
                  {review.spoiler && (
                    <span className="mb-3 flex items-center gap-1.5 w-fit text-[11px] font-bold uppercase tracking-[0.15em] text-brand-crimson">
                      <WarningIcon size={13} weight="bold" /> Spoiler
                    </span>
                  )}
                  <ReviewText text={review.text} className="font-serif text-[19px] leading-[1.75] text-foreground/85" />
                </div>
              )
            ) : (
              <p className="mt-8 font-serif text-lg italic text-brand-slate/70">{firstName} registrou a sessão sem escrever uma review.</p>
            )}

            <div className="mt-10 pt-5 border-t border-foreground/10 flex flex-wrap items-center gap-x-6 gap-y-3">
              <LikeButton review={review} isOwn={isOwn} engagement={engagement.data} onChange={engagement.setData} />
              <a href="#comentarios" className="inline-flex items-center gap-2 text-sm text-brand-slate hover:text-foreground transition-colors">
                <ChatCircleIcon size={20} />
                <span className="tabular-nums">{engagement.data?.commentsCount ?? "–"}</span>
                <span>{engagement.data?.commentsCount === 1 ? "comentário" : "comentários"}</span>
              </a>
            </div>

            <ReviewComments
              review={review}
              onCountChange={(delta) => {
                if (engagement.data) engagement.setData({ ...engagement.data, commentsCount: engagement.data.commentsCount + delta });
              }}
            />
          </section>

          {/* painel: ações, a nota da comunidade e mais registros da pessoa */}
          {/* no tablet, os blocos do painel ficam lado a lado embaixo da review */}
          <aside className="md:col-span-2 lg:col-span-1 lg:pt-24 grid sm:grid-cols-2 lg:flex lg:flex-col gap-8 content-start min-w-0">
            <ActionPanel review={review} isOwn={isOwn} onEdit={() => setEditing(true)} />

            {stats.data && <NitrateRating stats={stats.data} />}

            {others.length > 0 && (
              <section>
                <div className="flex items-baseline justify-between pb-2.5 mb-4 border-b border-foreground/10">
                  <h2 className="text-xs uppercase tracking-[0.14em] text-brand-slate">Mais de {firstName}</h2>
                  <Link href={`/u/${user.username}?tab=diario`} className="text-xs text-brand-slate hover:text-foreground">Diário</Link>
                </div>
                <ul className="grid grid-cols-3 gap-2.5">
                  {others.map((other) => (
                    <li key={other.id}>
                      <Link href={reviewHref(other)} title={other.movie.title} className="group block">
                        <Poster
                          title={other.movie.title}
                          posterPath={other.movie.posterPath}
                          size="w185"
                          sizes="90px"
                          className="group-hover:ring-brand-orange/50 transition-all"
                        />
                        {other.rating !== null && (
                          <span className="mt-1.5 flex justify-center">
                            <StarRating rating={toRating(other.rating)} size={9} />
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </aside>
        </div>
      </div>

      {isOwn && (
        <Modal open={editing} onClose={() => setEditing(false)} label={`Editar review de ${movie.title}`}>
          {/* key: reabrir o modal recomeça do que está salvo */}
          <ReviewForm
            key={editing ? "aberto" : "fechado"}
            movie={movie}
            existing={review}
            onSaved={(saved) => {
              onChange(saved);
              setEditing(false);
              refreshUser();
            }}
            onDeleted={() => {
              setEditing(false);
              refreshUser();
              onDeleted();
            }}
            onCancel={() => setEditing(false)}
          />
        </Modal>
      )}
    </article>
  );
}

/** Ações da review. O dono edita, compartilha nos Stories e põe em listas; os outros abrem o filme e copiam o link. */
function ActionPanel({ review, isOwn, onEdit }: { review: MovieReview; isOwn: boolean; onEdit: () => void }) {
  const { status } = useAuth();
  const [sharing, setSharing] = useState(false);
  const [addingToList, setAddingToList] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    const url = `${window.location.origin}${reviewHref(review)}`;
    // celular: folha de compartilhar; computador: copia o link
    if (navigator.share) {
      try {
        await navigator.share({ title: `${review.movie.title} por ${review.user.name} no Nitrate`, url });
      } catch {
        // cancelou
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tiles = isOwn
    ? [
        { icon: <PencilSimpleIcon size={22} />, label: "Editar", onClick: onEdit },
        { icon: <InstagramLogoIcon size={22} />, label: "Stories", onClick: () => setSharing(true) },
        { icon: <ListPlusIcon size={22} />, label: "Lista", onClick: () => setAddingToList(true) },
      ]
    : [
        { icon: <FilmSlateIcon size={22} />, label: "Filme", href: filmHref(review.movie) },
        ...(status === "authenticated" ? [{ icon: <ListPlusIcon size={22} />, label: "Lista", onClick: () => setAddingToList(true) }] : []),
        {
          icon: copied ? <CheckIcon size={22} className="text-brand-emerald" /> : <LinkSimpleIcon size={22} />,
          label: copied ? "Copiado" : "Compartilhar",
          onClick: copyLink,
        },
      ];

  const tile = "group flex flex-col items-center gap-2 py-5 text-xs text-brand-slate hover:text-foreground hover:bg-surface-strong transition-colors";

  return (
    <div className="rounded-md bg-surface overflow-hidden">
      <div className={`grid divide-x divide-foreground/5 ${tiles.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
        {tiles.map((t) =>
          "href" in t && t.href ? (
            <Link key={t.label} href={t.href} className={tile}>
              <span className="group-hover:text-brand-orange transition-colors">{t.icon}</span>
              {t.label}
            </Link>
          ) : (
            <button key={t.label} type="button" onClick={"onClick" in t ? t.onClick : undefined} className={tile}>
              <span className="group-hover:text-brand-orange transition-colors">{t.icon}</span>
              {t.label}
            </button>
          ),
        )}
      </div>

      <Link
        href={filmHref(review.movie)}
        className="flex items-center justify-between gap-3 px-5 py-3.5 border-t border-foreground/5 text-sm text-brand-slate hover:text-foreground hover:bg-surface-strong transition-colors"
      >
        {isOwn ? "Assisti de novo…" : status === "authenticated" ? "Registrar este filme…" : "Onde assistir e elenco"}
        <ArrowRightIcon size={14} />
      </Link>

      {isOwn && <ShareReviewStoryModal review={review} open={sharing} onClose={() => setSharing(false)} />}
      {status === "authenticated" && (
        <AddToListModal open={addingToList} movie={review.movie} onClose={() => setAddingToList(false)} />
      )}
    </div>
  );
}

/** curtir a review (não o filme). Quem escreveu só vê quantas curtidas recebeu. */
function LikeButton({ review, isOwn, engagement, onChange }: {
  review: MovieReview;
  isOwn: boolean;
  engagement: ReviewEngagement | undefined;
  onChange: (engagement: ReviewEngagement) => void;
}) {
  const { status } = useAuth();
  const [busy, setBusy] = useState(false);
  const count = engagement?.likesCount ?? 0;
  const liked = engagement?.likedByMe ?? false;
  const label = `${count} ${count === 1 ? "curtida" : "curtidas"}`;

  if (isOwn || !engagement) {
    return (
      <span className="inline-flex items-center gap-2 text-sm text-brand-slate">
        <HeartIcon size={20} weight={count > 0 ? "fill" : "regular"} className={count > 0 ? "text-brand-orange" : ""} />
        <span className="tabular-nums">{engagement ? label : "–"}</span>
      </span>
    );
  }

  if (status !== "authenticated") {
    return (
      <Link
        href={`/sign-in?redirect=${encodeURIComponent(reviewHref(review))}`}
        className="inline-flex items-center gap-2 text-sm text-brand-slate hover:text-brand-orange transition-colors"
      >
        <HeartIcon size={20} />
        <span className="tabular-nums">{label}</span>
      </Link>
    );
  }

  const toggle = async () => {
    setBusy(true);
    // otimista: o coração responde na hora; a resposta do servidor confirma o número
    onChange({ ...engagement, likedByMe: !liked, likesCount: count + (liked ? -1 : 1) });
    try {
      onChange(liked ? await unlikeReview(review.id) : await likeReview(review.id));
    } catch {
      onChange(engagement);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={liked}
      className={`group inline-flex items-center gap-2 text-sm transition-colors ${liked ? "text-brand-orange" : "text-brand-slate hover:text-brand-orange"}`}
    >
      <HeartIcon
        size={20}
        weight={liked ? "fill" : "regular"}
        className={`transition-transform ${liked ? "scale-110" : "group-hover:scale-110"}`}
      />
      <span className="tabular-nums">{label}</span>
      <span className="sr-only">{liked ? "Descurtir a review" : "Curtir a review"}</span>
    </button>
  );
}
