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
  HeartIcon,
  InstagramLogoIcon,
  LinkSimpleIcon,
  PencilSimpleIcon,
  TelevisionSimpleIcon,
  UsersIcon,
  WarningIcon,
} from "@phosphor-icons/react";

import Header from "@/app/components/header";
import { NitrateRating } from "@/app/components/movie-community";
import { ReviewComments, type CommentsApi } from "@/app/components/review-comments";
import { ReviewLikeButton } from "@/app/components/review-like-button";
import { ShareSeriesStoryModal } from "@/app/components/review-story-share";
import { SeriesReviewForm } from "@/app/components/series-review-form";
import { TogetherWith, acceptedPartners, partnerReviewHref, sharedTextAuthor } from "@/app/components/together-with";
import { Avatar } from "@/app/components/ui/avatar";
import { Modal } from "@/app/components/ui/modal";
import { Poster } from "@/app/components/ui/poster";
import { ReviewText } from "@/app/components/ui/review-text";
import { SlowHint } from "@/app/components/ui/slow-hint";
import { StarRating } from "@/app/components/ui/star-rating";
import { ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useFetch } from "@/lib/hooks/use-fetch";
import {
  addSeriesReviewComment,
  deleteSeriesReviewComment,
  getSeriesDetails,
  getSeriesReview,
  getSeriesReviewComments,
  getSeriesReviewEngagement,
  getSeriesStats,
  getUserSeries,
  likeSeriesReview,
  unlikeSeriesReview,
} from "@/lib/services/series-service";
import { seasonLabel, seriesYears, type SeriesReview } from "@/types/series";
import { joinNames, shortDate, timeAgo } from "@/utils/format";
import { backdropUrl } from "@/utils/poster";
import { toRating } from "@/utils/rating";
import { seriesHref, seriesReviewHref } from "@/utils/series-link";

// "Mais de Fulano": os últimos registros de séries da pessoa, sem o desta página
const MORE_FROM = 6;

const seriesCommentsApi: CommentsApi = {
  list: getSeriesReviewComments,
  add: addSeriesReviewComment,
  remove: deleteSeriesReviewComment,
};

export default function SeriesReviewPage() {
  const params = useParams<{ username: string; id: string }>();
  const router = useRouter();
  const reviewId = Number(params.id);
  const validId = Number.isInteger(reviewId) && reviewId > 0 ? reviewId : null;
  const review = useFetch(validId, getSeriesReview);

  // a URL tem o username: se o registro for de outra pessoa, corrige o endereço
  const author = review.data?.user.username;
  useEffect(() => {
    if (author && author !== params.username) {
      router.replace(`/u/${author}/series/${reviewId}`);
    }
  }, [author, params.username, reviewId, router]);

  const notFound = validId === null || (review.error instanceof ApiError && review.error.status === 404);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Header />
      {notFound ? (
        <div className="pt-48 pb-24 text-center">
          <h1 className="text-3xl font-medium tracking-tight">Review não encontrada.</h1>
          <Link href={`/u/${params.username}?tab=series`} className="inline-block mt-6 text-brand-blue hover:underline">
            Voltar ao perfil
          </Link>
        </div>
      ) : !review.data ? (
        <div className="pt-48 pb-24 flex flex-col items-center gap-6 text-brand-slate/40">
          {review.error ? "Não foi possível carregar a review." : <CircleNotchIcon size={32} className="animate-spin" />}
          {!review.error && <SlowHint className="px-6 text-center" />}
        </div>
      ) : (
        <ReviewView
          review={review.data}
          onSaved={review.reload}
          // apagou o registro: não há mais o que mostrar aqui
          onDeleted={() => router.push(`/u/${review.data?.user.username ?? params.username}?tab=series`)}
        />
      )}
    </div>
  );
}

function ReviewView({ review, onSaved, onDeleted }: {
  review: SeriesReview;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const { status, user: me } = useAuth();
  const [revealed, setRevealed] = useState(false);
  const [editing, setEditing] = useState(false);
  const isOwn = me?.username === review.user.username;
  const { series, user } = review;

  // espera a sessão: com token, a resposta diz se você já curtiu
  const engagement = useFetch(status === "loading" ? null : review.id, getSeriesReviewEngagement);
  const details = useFetch(series.id, getSeriesDetails);
  const stats = useFetch(series.id, getSeriesStats);
  const moreFrom = useFetch(user.username, getUserSeries);

  const href = seriesReviewHref(review);
  const hideText = review.spoiler && !isOwn && !revealed;
  const partners = acceptedPartners(review);
  const sharedFrom = sharedTextAuthor(review);
  // os convites pendentes só aparecem para quem convidou
  const pendingWith = isOwn ? (review.together?.partners ?? []).filter((p) => p.status === "PENDING").map((p) => p.user) : [];
  const backdrop = backdropUrl(details.data?.backdropPath);
  // registro de uma temporada: o pôster é o dela, quando o TMDB tem
  const season = review.seasonNumber !== null ? details.data?.seasons.find((s) => s.seasonNumber === review.seasonNumber) : undefined;
  const firstName = user.name.split(" ")[0];
  const years = seriesYears({ ...series, status: details.data?.status ?? series.status });
  const others = (moreFrom.data ?? []).filter((r) => r.id !== review.id).slice(0, MORE_FROM);
  const seasons = (details.data?.seasons ?? []).filter((s) => (s.episodeCount ?? 0) > 0);

  return (
    <article>
      {/* a cena da série no topo, desbotando para o fundo (o mesmo clima da página da série) */}
      <div className="relative h-[260px] sm:h-[360px] lg:h-[440px] -mb-[160px] sm:-mb-[240px] lg:-mb-[300px]">
        {backdrop && (
          <Image src={backdrop} alt="" fill priority sizes="100vw" className="object-cover object-[center_25%] opacity-35" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-background via-background/60 to-background/10" />
        <div className="absolute inset-0 bg-linear-to-r from-background via-transparent to-background opacity-80" />
      </div>

      <div className={`relative max-w-[1180px] mx-auto px-6 pb-24 ${backdrop ? "" : "pt-32"}`}>
        <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] lg:grid-cols-[200px_1fr_270px] gap-8 lg:gap-12">
          {/* pôster e ficha rápida da série */}
          <aside className="flex md:flex-col gap-5 md:pt-24">
            <Link href={seriesHref(series)} className="group w-28 md:w-full shrink-0">
              <Poster
                title={series.name}
                posterPath={season?.posterPath ?? series.posterPath}
                size="w500"
                sizes="200px"
                className="shadow-2xl shadow-black/60 group-hover:ring-brand-orange/50 transition-all"
              />
            </Link>
            <div className="flex flex-col gap-3 text-sm min-w-0 self-end md:self-auto">
              {series.creators && (
                <p className="text-brand-slate">
                  <span className="block text-[11px] uppercase tracking-[0.14em] text-brand-slate/60">Criação</span>
                  <span className="text-foreground/85">{series.creators}</span>
                </p>
              )}
              {series.genres.length > 0 && (
                <ul className="flex flex-wrap gap-1.5">
                  {series.genres.slice(0, 3).map((genre) => (
                    <li key={genre} className="px-2 py-0.5 rounded-full bg-surface text-xs text-brand-slate">{genre}</li>
                  ))}
                </ul>
              )}
              <Link href={seriesHref(series)} className="group inline-flex items-center gap-1.5 text-brand-blue hover:underline underline-offset-4">
                Página da série <ArrowRightIcon size={13} weight="bold" className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </aside>

          {/* a review */}
          <section className="min-w-0 md:pt-24">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pb-4 border-b border-foreground/10">
              <Link href={`/u/${user.username}?tab=series`} className="group flex items-center gap-3">
                <Avatar name={user.name} username={user.username} avatar={user.avatar} size="sm" />
                <span className="text-sm text-brand-slate">
                  Review de <span className="font-semibold text-foreground group-hover:text-brand-orange transition-colors">{user.name}</span>
                </span>
              </Link>
              {partners.length > 0 && (
                <span className="text-sm text-brand-slate">
                  <TogetherWith partners={partners} emphasis="font-semibold text-foreground" series />
                </span>
              )}
              {pendingWith.length > 0 && (
                <span className="flex items-center gap-2 text-xs text-brand-slate">
                  <UsersIcon size={14} />
                  Aguardando {joinNames(pendingWith.map((u) => u.name))}{" "}
                  {pendingWith.length > 1 ? "aceitarem" : "aceitar"} a review em conjunto
                </span>
              )}
              <span className="ml-auto text-xs text-brand-slate/60">registrada {timeAgo(review.createdAt)}</span>
            </div>

            <p className="mt-6 flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-brand-orange">
              <TelevisionSimpleIcon size={14} weight="bold" /> {seasonLabel(review.seasonNumber, review.episodeNumber)}
              {season?.episodeCount && review.episodeNumber === null ? <span className="text-brand-slate">· {season.episodeCount} episódios</span> : null}
            </p>
            <h1 className="mt-2 font-serif text-4xl sm:text-5xl font-semibold leading-[1.05] tracking-tight">
              <Link href={seriesHref(series)} className="hover:text-brand-blue transition-colors">{series.name}</Link>{" "}
              {years && <span className="font-sans text-2xl sm:text-3xl font-light text-foreground/40">{years}</span>}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-brand-slate">
              {review.rating !== null && <StarRating rating={toRating(review.rating)} size={20} />}
              {review.liked && <HeartIcon size={18} weight="fill" className="text-brand-orange" aria-label="Curtiu a série" />}
              {review.rewatch && (
                <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-brand-emerald">
                  <ArrowsClockwiseIcon size={14} weight="bold" /> Reassistido
                </span>
              )}
              <span>{review.episodeNumber !== null ? "Assistiu" : "Terminou"} em {shortDate(review.watchedOn)}</span>
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
                  {sharedFrom && (
                    <p className="mb-3 text-sm text-brand-slate">
                      {firstName} usou a review de{" "}
                      <Link href={partnerReviewHref(sharedFrom, true)} className="text-foreground hover:text-brand-orange">
                        {sharedFrom.user.name}
                      </Link>
                      .
                    </p>
                  )}
                  <ReviewText text={review.text} className="font-serif text-[19px] leading-[1.75] text-foreground/85" />
                </div>
              )
            ) : (
              <p className="mt-8 font-serif text-lg italic text-brand-slate/70">{firstName} registrou a série sem escrever uma review.</p>
            )}

            <div className="mt-10 pt-5 border-t border-foreground/10 flex flex-wrap items-center gap-x-6 gap-y-3">
              <ReviewLikeButton
                reviewId={review.id}
                href={href}
                isOwn={isOwn}
                engagement={engagement.data}
                onChange={engagement.setData}
                like={likeSeriesReview}
                unlike={unlikeSeriesReview}
              />
              <a href="#comentarios" className="inline-flex items-center gap-2 text-sm text-brand-slate hover:text-foreground transition-colors">
                <ChatCircleIcon size={20} />
                <span className="tabular-nums">{engagement.data?.commentsCount ?? "–"}</span>
                <span>{engagement.data?.commentsCount === 1 ? "comentário" : "comentários"}</span>
              </a>
            </div>

            <ReviewComments
              review={review}
              href={href}
              api={seriesCommentsApi}
              onCountChange={(delta) => {
                if (engagement.data) engagement.setData({ ...engagement.data, commentsCount: engagement.data.commentsCount + delta });
              }}
            />
          </section>

          {/* painel: ações, a nota da comunidade e mais registros da pessoa */}
          <aside className="md:col-span-2 lg:col-span-1 lg:pt-24 grid sm:grid-cols-2 lg:flex lg:flex-col gap-8 content-start min-w-0">
            <ActionPanel review={review} isOwn={isOwn} onEdit={() => setEditing(true)} />

            {stats.data && <NitrateRating stats={stats.data} />}

            {others.length > 0 && (
              <section>
                <div className="flex items-baseline justify-between pb-2.5 mb-4 border-b border-foreground/10">
                  <h2 className="text-xs uppercase tracking-[0.14em] text-brand-slate">Mais séries de {firstName}</h2>
                  <Link href={`/u/${user.username}?tab=series`} className="text-xs text-brand-slate hover:text-foreground">Ver todas</Link>
                </div>
                <ul className="grid grid-cols-3 gap-2.5">
                  {others.map((other) => (
                    <li key={other.id}>
                      <Link href={seriesReviewHref(other)} title={`${other.series.name} · ${seasonLabel(other.seasonNumber, other.episodeNumber)}`} className="group block">
                        <Poster
                          title={other.series.name}
                          posterPath={other.series.posterPath}
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
        <Modal open={editing} onClose={() => setEditing(false)} label={`Editar review de ${series.name}`} size="wide">
          {/* key: reabrir o modal recomeça do que está salvo */}
          <SeriesReviewForm
            key={editing ? "aberto" : "fechado"}
            series={series}
            seasons={seasons}
            existing={review}
            firstAirDate={details.data?.firstAirDate}
            episodeRunTime={details.data?.episodeRunTime}
            onSaved={() => {
              setEditing(false);
              onSaved();
            }}
            onDeleted={() => {
              setEditing(false);
              onDeleted();
            }}
            onCancel={() => setEditing(false)}
          />
        </Modal>
      )}
    </article>
  );
}

/** Ações do registro. O dono edita e compartilha nos Stories; os outros abrem a série e copiam o link. */
function ActionPanel({ review, isOwn, onEdit }: { review: SeriesReview; isOwn: boolean; onEdit: () => void }) {
  const { status } = useAuth();
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    const url = `${window.location.origin}${seriesReviewHref(review)}`;
    // celular: folha de compartilhar; computador: copia o link
    if (navigator.share) {
      try {
        await navigator.share({ title: `${review.series.name} por ${review.user.name} no Nitrate`, url });
      } catch {
        // cancelou
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const linkTile = {
    icon: copied ? <CheckIcon size={22} className="text-brand-emerald" /> : <LinkSimpleIcon size={22} />,
    label: copied ? "Copiado" : "Link",
    onClick: copyLink,
  };
  const tiles = isOwn
    ? [
        { icon: <PencilSimpleIcon size={22} />, label: "Editar", onClick: onEdit },
        { icon: <InstagramLogoIcon size={22} />, label: "Stories", onClick: () => setSharing(true) },
        linkTile,
      ]
    : [
        { icon: <TelevisionSimpleIcon size={22} />, label: "Série", href: seriesHref(review.series) },
        { ...linkTile, label: copied ? "Copiado" : "Compartilhar" },
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
        href={seriesHref(review.series)}
        className="flex items-center justify-between gap-3 px-5 py-3.5 border-t border-foreground/5 text-sm text-brand-slate hover:text-foreground hover:bg-surface-strong transition-colors"
      >
        {isOwn ? "Registrar outra temporada…" : status === "authenticated" ? "Registrar esta série…" : "Temporadas e onde assistir"}
        <ArrowRightIcon size={14} />
      </Link>

      {isOwn && <ShareSeriesStoryModal review={sharing ? review : null} open={sharing} onClose={() => setSharing(false)} />}
    </div>
  );
}
