"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowsClockwiseIcon,
  BookmarkSimpleIcon,
  CaretDownIcon,
  CheckIcon,
  CircleNotchIcon,
  EyeIcon,
  HeartIcon,
  InstagramLogoIcon,
  PencilSimpleIcon,
  PlusIcon,
  TelevisionSimpleIcon,
} from "@phosphor-icons/react";

import Header from "@/app/components/header";
import { NitrateRating, WhereToWatch } from "@/app/components/movie-community";
import { ShareSeriesStoryModal } from "@/app/components/review-story-share";
import { SeriesReviewForm } from "@/app/components/series-review-form";
import { TogetherWith, acceptedPartners } from "@/app/components/together-with";
import { Avatar } from "@/app/components/ui/avatar";
import { Modal } from "@/app/components/ui/modal";
import { PersonPhoto } from "@/app/components/ui/person-photo";
import { Poster } from "@/app/components/ui/poster";
import { ReviewText } from "@/app/components/ui/review-text";
import { SectionHeading } from "@/app/components/ui/section-heading";
import { SlowHint } from "@/app/components/ui/slow-hint";
import { StarRating } from "@/app/components/ui/star-rating";
import { ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useFetch } from "@/lib/hooks/use-fetch";
import {
  addSeriesToWatchlist,
  getSeason,
  getSeriesBySlug,
  getSeriesDetails,
  getSeriesReviews,
  getSeriesState,
  getSeriesStats,
  getSeriesWatchProviders,
  removeSeriesFromWatchlist,
} from "@/lib/services/series-service";
import {
  episodeAfter,
  episodeCode,
  seasonLabel,
  seriesStatusLabel,
  seriesYears,
  type SeasonSummary,
  type Series,
  type SeriesDetails,
  type SeriesPerson,
  type SeriesReview,
  watchProgress,
  type EpisodeRef,
} from "@/types/series";
import { runtimeLabel, shortDate, todayIso } from "@/utils/format";
import { backdropUrl, stillUrl } from "@/utils/poster";
import { toRating } from "@/utils/rating";
import { seriesReviewHref } from "@/utils/series-link";
import { personHref } from "@/utils/person-link";

const CAST_PREVIEW = 8;

export default function SeriesDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const series = useFetch(slug, getSeriesBySlug);

  if (series.error instanceof ApiError && series.error.status === 404) {
    return (
      <Shell>
        <div className="pt-48 pb-24 text-center">
          <h1 className="font-serif text-3xl font-semibold">Série não encontrada.</h1>
          <Link href="/series" className="inline-block mt-6 text-brand-blue hover:underline">
            Ver séries
          </Link>
        </div>
      </Shell>
    );
  }

  if (!series.data) {
    return (
      <Shell>
        <div className="pt-48 pb-24 flex flex-col items-center gap-6 text-brand-slate/40">
          {series.error ? "Não foi possível carregar a série." : <CircleNotchIcon size={32} className="animate-spin" />}
          {!series.error && <SlowHint className="px-6 text-center" />}
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <SeriesView series={series.data} />
    </Shell>
  );
}

type Editing = { review: SeriesReview | null; season: number | null; episode: number | null };

function SeriesView({ series }: { series: Series }) {
  const { status } = useAuth();
  const details = useFetch(series.id, getSeriesDetails);
  const stats = useFetch(series.id, getSeriesStats);
  const providers = useFetch(series.id, getSeriesWatchProviders);
  const reviews = useFetch(series.id, getSeriesReviews);
  const myState = useFetch(status === "authenticated" ? series.id : null, getSeriesState);

  const [editing, setEditing] = useState<Editing | null>(null);
  const [watchlistBusy, setWatchlistBusy] = useState(false);
  // o registro cujo ingresso está sendo compartilhado nos Stories
  const [sharing, setSharing] = useState<SeriesReview | null>(null);

  const myReviews = myState.data?.reviews ?? [];
  const inWatchlist = myState.data?.inWatchlist ?? false;
  const seasons = (details.data?.seasons ?? []).filter((s) => (s.episodeCount ?? 0) > 0);
  const backdrop = backdropUrl(details.data?.backdropPath);
  const signInHref = `/sign-in?redirect=${encodeURIComponent(`/series/${series.slug}`)}`;

  const toggleWatchlist = async () => {
    if (!myState.data) return;
    setWatchlistBusy(true);
    try {
      if (inWatchlist) await removeSeriesFromWatchlist(series.id);
      else await addSeriesToWatchlist(series.id);
      myState.setData({ ...myState.data, inWatchlist: !inWatchlist });
    } finally {
      setWatchlistBusy(false);
    }
  };

  const afterChange = () => {
    setEditing(null);
    myState.reload();
    reviews.reload();
    stats.reload();
  };

  const logSeason = status === "authenticated" && myState.data
    ? (season: number | null, episode: number | null = null) => setEditing({ review: null, season, episode })
    : undefined;

  // até onde a pessoa assistiu, para quem acompanha episódio a episódio
  const progress = details.data ? watchProgress(myReviews, seasons) : null;
  const nextUp = progress ? episodeAfter(progress, seasons, details.data?.nextEpisode) : null;

  const years = seriesYears({ ...series, status: details.data?.status ?? series.status });
  const statusLabel = seriesStatusLabel(details.data?.status ?? series.status);
  const runtimePerEpisode = details.data?.episodeRunTime ? `${runtimeLabel(details.data.episodeRunTime)} por episódio` : null;
  // os seus registros primeiro, depois os dos outros
  const otherReviews = (reviews.data ?? []).filter((r) => !myReviews.some((mine) => mine.id === r.id));
  const allReviews = [...myReviews, ...otherReviews];

  return (
    <>
      <div className={`relative ${backdrop ? "h-[46vh] md:h-[420px] lg:h-[520px] -mb-[160px] md:-mb-[260px] lg:-mb-[320px]" : "h-24 md:h-32"}`}>
        {backdrop && (
          <Image src={backdrop} alt="" fill priority sizes="100vw" className="object-cover object-[center_25%]" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-background via-background/30 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-r from-background via-transparent to-background opacity-80" />
      </div>

      <div className="relative max-w-[1180px] mx-auto px-6 pb-24">
        <div className="grid grid-cols-[112px_1fr] md:grid-cols-[200px_1fr] lg:grid-cols-[230px_1fr_260px] gap-5 md:gap-8 lg:gap-10">
          {/* no desktop a coluna desce até o fim do conteúdo e o pôster acompanha a rolagem, como nos filmes */}
          <aside className="lg:row-span-2">
            <div className="lg:sticky lg:top-24">
              <Poster title={series.name} posterPath={series.posterPath} size="w500" sizes="(min-width: 768px) 230px, 112px" className="shadow-2xl shadow-black/60" />
            </div>
          </aside>

          <section className="min-w-0 md:pt-10 lg:pt-16">
            <p className="flex flex-wrap items-center gap-x-2 text-xs uppercase tracking-[0.14em] text-foreground/70">
              <span className="flex items-center gap-1.5 text-brand-orange">
                <TelevisionSimpleIcon size={14} weight="bold" /> Série
              </span>
              {[years, statusLabel, ...series.genres.slice(0, 2), runtimePerEpisode].filter(Boolean).map((item) => (
                <span key={String(item)} className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-brand-orange" />
                  {item}
                </span>
              ))}
            </p>
            <h1 className="mt-3 font-serif text-3xl sm:text-5xl font-semibold leading-[1.05] tracking-tight">{series.name}</h1>
            {details.data?.tagline && (
              <p className="mt-4 font-serif text-lg italic text-brand-slate">“{details.data.tagline}”</p>
            )}
            {series.overview && (
              <p className="hidden md:block mt-6 text-base leading-[1.75] text-foreground/80 max-w-2xl">{series.overview}</p>
            )}
          </section>

          {series.overview && (
            <p className="md:hidden col-span-2 text-[15px] leading-relaxed text-foreground/80">{series.overview}</p>
          )}

          <aside className="col-span-2 md:col-span-2 lg:col-span-1 lg:row-span-2 lg:pt-16 grid sm:grid-cols-2 lg:grid-cols-1 gap-6 content-start">
            {status === "authenticated" && myState.data && (
              <ActionPanel
                watched={myReviews.length > 0}
                liked={myReviews.some((r) => r.liked)}
                inWatchlist={inWatchlist}
                watchlistBusy={watchlistBusy}
                progress={progress}
                nextUp={nextUp}
                onLog={() => setEditing({ review: null, season: null, episode: null })}
                onLogNext={nextUp ? () => setEditing({ review: null, season: nextUp.seasonNumber, episode: nextUp.episodeNumber }) : undefined}
                onToggleWatchlist={toggleWatchlist}
                onShare={myReviews.length > 0 ? () => setSharing(myReviews[0]) : undefined}
              />
            )}
            {status === "anonymous" && (
              <div className="rounded-md bg-surface p-5 text-center text-sm text-brand-slate">
                <Link href={signInHref} className="font-semibold text-foreground hover:text-brand-orange">Entre</Link>{" "}
                para registrar, avaliar ou guardar na watchlist.
              </div>
            )}
            {stats.data && <NitrateRating stats={stats.data} />}
          </aside>

          <div className="col-span-2 lg:col-span-1 lg:col-start-2 min-w-0">
            {myReviews.length > 0 && (
              <section className="mt-4 md:mt-12">
                <SectionHeading title="Seus registros" count={myReviews.length} />
                <ul className="flex flex-col gap-2">
                  {myReviews.map((review) => (
                    <li key={review.id} className="flex items-stretch rounded-md bg-surface overflow-hidden text-sm">
                      {/* clicar no registro abre a página da review, como nos filmes */}
                      <Link
                        href={seriesReviewHref(review)}
                        className="flex-1 min-w-0 flex items-center gap-3 px-4 py-3 hover:bg-surface-strong transition-colors"
                      >
                        <span className="font-medium text-foreground/90 truncate">{seasonLabel(review.seasonNumber, review.episodeNumber)}</span>
                        {review.rating !== null && <StarRating rating={toRating(review.rating)} size={13} />}
                        {review.liked && <HeartIcon size={14} weight="fill" className="text-brand-orange" />}
                        <span className="ml-auto shrink-0 text-xs text-brand-slate">{shortDate(review.watchedOn)}</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => setEditing({ review, season: review.seasonNumber, episode: review.episodeNumber })}
                        aria-label={`Editar registro: ${seasonLabel(review.seasonNumber, review.episodeNumber)}`}
                        title="Editar"
                        className="px-3.5 border-l border-foreground/5 text-brand-slate hover:text-foreground hover:bg-surface-strong transition-colors"
                      >
                        <PencilSimpleIcon size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSharing(review)}
                        aria-label={`Compartilhar nos Stories: ${seasonLabel(review.seasonNumber, review.episodeNumber)}`}
                        title="Compartilhar nos Stories"
                        className="px-3.5 border-l border-foreground/5 text-brand-slate hover:text-brand-orange hover:bg-surface-strong transition-colors"
                      >
                        <InstagramLogoIcon size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <SeasonList
              seriesId={series.id}
              seasons={details.data ? seasons : undefined}
              episodeRunTime={details.data?.episodeRunTime ?? null}
              myReviews={myReviews}
              onLog={logSeason}
            />
            <CastList cast={details.data?.cast} />
            {details.data && <FactSheet series={series} details={details.data} />}

            <section className="mt-12">
              <SectionHeading title="Onde assistir" />
              {providers.data ? <WhereToWatch providers={providers.data} subject="esta série" /> : <p className="text-sm text-brand-slate">Carregando…</p>}
            </section>

            <section className="mt-16">
              <SectionHeading title="Reviews" count={reviews.data?.length} />
              {allReviews.length > 0 ? (
                <div className="divide-y divide-foreground/10 -mt-5">
                  {allReviews.map((review) => (
                    <SeriesReviewItem key={review.id} review={review} />
                  ))}
                </div>
              ) : (
                !reviews.loading && <p className="py-4 text-brand-slate">Ninguém registrou esta série ainda.</p>
              )}
            </section>
          </div>
        </div>
      </div>

      {status === "authenticated" && myState.data && (
        <Modal
          open={editing !== null}
          onClose={() => setEditing(null)}
          label={editing?.review ? `Editar registro de ${series.name}` : `Registrar ${series.name}`}
          size="wide"
        >
          {editing && (
            <SeriesReviewForm
              key={`${editing.review?.id ?? "new"}-${editing.season}-${editing.episode}`}
              series={series}
              seasons={seasons}
              existing={editing.review}
              initialSeason={editing.season}
              initialEpisode={editing.episode}
              firstAirDate={details.data?.firstAirDate}
              episodeRunTime={details.data?.episodeRunTime}
              myReviews={myState.data.reviews}
              onSaved={afterChange}
              onDeleted={afterChange}
              onCancel={() => setEditing(null)}
            />
          )}
        </Modal>
      )}

      <ShareSeriesStoryModal review={sharing} open={sharing !== null} onClose={() => setSharing(null)} />
    </>
  );
}

function ActionPanel(props: {
  watched: boolean;
  liked: boolean;
  inWatchlist: boolean;
  watchlistBusy: boolean;
  /** o episódio mais adiante que a pessoa registrou */
  progress: EpisodeRef | null;
  /** o episódio seguinte, se já foi ao ar */
  nextUp: EpisodeRef | null;
  onLog: () => void;
  onLogNext?: () => void;
  onToggleWatchlist: () => void;
  /** compartilha o registro mais recente nos Stories */
  onShare?: () => void;
}) {
  const row = (active: boolean, activeColor: string) =>
    `flex items-center gap-3 w-full px-4 py-2.5 text-sm text-left transition-colors hover:bg-surface-strong disabled:opacity-50 ${active ? activeColor : "text-brand-slate"}`;

  return (
    <div className="rounded-md bg-surface overflow-hidden">
      <div className="py-1">
        <button onClick={props.onLog} className={row(props.watched, "text-brand-emerald")}>
          <EyeIcon size={18} weight={props.watched ? "fill" : "regular"} />
          {props.progress
            ? `Parei no ${episodeCode(props.progress.seasonNumber, props.progress.episodeNumber)}`
            : props.watched ? "Já assisti" : "Marcar como assistida"}
        </button>
        {props.liked && (
          <span className={row(true, "text-brand-orange")}>
            <HeartIcon size={18} weight="fill" /> Curti
          </span>
        )}
        <button
          onClick={props.onToggleWatchlist}
          disabled={props.watchlistBusy}
          aria-pressed={props.inWatchlist}
          className={row(props.inWatchlist, "text-brand-blue")}
        >
          <BookmarkSimpleIcon size={18} weight={props.inWatchlist ? "fill" : "regular"} />
          {props.inWatchlist ? "Na watchlist de séries" : "Quero assistir"}
        </button>
        {props.onShare && (
          <button onClick={props.onShare} className={row(false, "")}>
            <InstagramLogoIcon size={18} />
            Compartilhar nos Stories
          </button>
        )}
      </div>
      <div className="border-t border-foreground/5 p-3 flex flex-col gap-2">
        {props.nextUp && props.onLogNext && (
          <button
            onClick={props.onLogNext}
            className="w-full py-2 rounded-md border border-foreground/10 text-sm font-medium text-foreground/90 hover:border-brand-orange/60 hover:text-brand-orange transition-colors"
          >
            Registrar o {episodeCode(props.nextUp.seasonNumber, props.nextUp.episodeNumber)}
          </button>
        )}
        <button
          onClick={props.onLog}
          className="w-full py-2 rounded-md bg-brand-btn text-brand-btn-text text-sm font-semibold hover:bg-brand-btn/90 transition-colors"
        >
          {props.watched ? "Novo registro" : "Registrar ou avaliar"}
        </button>
      </div>
    </div>
  );
}

/** temporadas em sanfona: abrir uma busca os episódios dela */
function SeasonList({ seriesId, seasons, episodeRunTime, myReviews, onLog }: {
  seriesId: number;
  seasons: SeasonSummary[] | undefined;
  episodeRunTime: number | null;
  myReviews: SeriesReview[];
  onLog?: (season: number, episode?: number | null) => void;
}) {
  const [open, setOpen] = useState<number | null>(null);
  if (seasons !== undefined && seasons.length === 0) return null;

  return (
    <section className="mt-12">
      <SectionHeading title="Temporadas" count={seasons?.filter((s) => s.seasonNumber > 0).length || undefined} />
      {seasons === undefined ? (
        <p className="text-sm text-brand-slate">Carregando…</p>
      ) : (
        <ul className="flex flex-col divide-y divide-foreground/10 border-y border-foreground/10">
          {seasons.map((season) => {
            const isOpen = open === season.seasonNumber;
            return (
              <li key={season.seasonNumber}>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : season.seasonNumber)}
                    aria-expanded={isOpen}
                    className="flex-1 flex items-center gap-4 py-3 text-left group"
                  >
                    <span className="flex-1 min-w-0">
                      <span className="block font-medium group-hover:text-brand-orange transition-colors">
                        {season.name || seasonLabel(season.seasonNumber)}
                      </span>
                      <span className="block text-xs text-brand-slate">
                        {[
                          season.airDate?.slice(0, 4),
                          season.episodeCount ? `${season.episodeCount} episódio${season.episodeCount > 1 ? "s" : ""}` : null,
                          season.rating ? `TMDB ${season.rating.toFixed(1)}` : null,
                        ].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    <CaretDownIcon size={16} className={`text-brand-slate transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  {onLog && (
                    <button
                      type="button"
                      onClick={() => onLog(season.seasonNumber)}
                      aria-label={`Registrar ${season.name || seasonLabel(season.seasonNumber)}`}
                      title="Registrar esta temporada"
                      className="p-2 rounded-md text-brand-slate hover:text-brand-orange hover:bg-surface transition-colors"
                    >
                      <PlusIcon size={16} weight="bold" />
                    </button>
                  )}
                </div>
                {isOpen && (
                  <EpisodeList
                    seriesId={seriesId}
                    seasonNumber={season.seasonNumber}
                    episodeRunTime={episodeRunTime}
                    // os episódios que a pessoa já registrou (a temporada inteira marca todos)
                    watched={(ep) => myReviews.some((r) => r.seasonNumber === season.seasonNumber && (r.episodeNumber === null || r.episodeNumber === ep))}
                    onLog={onLog ? (ep) => onLog(season.seasonNumber, ep) : undefined}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function EpisodeList({ seriesId, seasonNumber, episodeRunTime, watched, onLog }: {
  seriesId: number;
  seasonNumber: number;
  /** duração típica da série: aproxima a dos episódios que o TMDB ainda não sabe */
  episodeRunTime: number | null;
  watched: (episodeNumber: number) => boolean;
  onLog?: (episodeNumber: number) => void;
}) {
  const season = useFetch(`${seriesId}|${seasonNumber}`, getSeason);
  const today = todayIso();

  if (!season.data) {
    return (
      <p className="pb-4 text-sm text-brand-slate">
        {season.error ? "Não foi possível carregar os episódios." : "Carregando episódios…"}
      </p>
    );
  }

  return (
    <div className="pb-5">
      {season.data.overview && <p className="mb-4 text-sm leading-relaxed text-foreground/75">{season.data.overview}</p>}
      <ol className="flex flex-col gap-3">
        {season.data.episodes.map((ep) => {
          const still = stillUrl(ep.stillPath);
          const aired = ep.airDate === null || ep.airDate <= today;
          const seen = watched(ep.episodeNumber);
          return (
            <li key={ep.episodeNumber} className="flex gap-3">
              <div className="relative w-28 sm:w-36 aspect-video shrink-0 overflow-hidden rounded bg-surface">
                {still && <Image src={still} alt="" fill sizes="144px" className="object-cover" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  <span className="text-brand-slate tabular-nums">{ep.episodeNumber}.</span> {ep.name}
                </p>
                <p className="text-xs text-brand-slate">
                  {[ep.airDate ? shortDate(ep.airDate) : null, ep.runtime ? runtimeLabel(ep.runtime) : episodeRunTime ? `~${runtimeLabel(episodeRunTime)}` : null, ep.rating ? `TMDB ${ep.rating.toFixed(1)}` : null]
                    .filter(Boolean).join(" · ")}
                </p>
                {ep.overview && <p className="mt-1 text-xs leading-relaxed text-foreground/70 line-clamp-3">{ep.overview}</p>}
              </div>
              {onLog && aired && (
                <button
                  type="button"
                  onClick={() => onLog(ep.episodeNumber)}
                  aria-label={`Registrar ${episodeCode(seasonNumber, ep.episodeNumber)}${seen ? " de novo" : ""}`}
                  title={seen ? "Você já registrou este episódio. Registrar de novo" : "Registrar este episódio"}
                  className={`ml-auto self-start shrink-0 p-2 rounded-md transition-colors hover:bg-surface ${seen ? "text-brand-emerald hover:text-brand-emerald/80" : "text-brand-slate hover:text-brand-orange"}`}
                >
                  {seen ? <CheckIcon size={16} weight="bold" /> : <PlusIcon size={16} weight="bold" />}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function CastList({ cast: castOrNull }: { cast: SeriesPerson[] | undefined }) {
  const [showAll, setShowAll] = useState(false);
  const cast = castOrNull ?? [];
  if (castOrNull !== undefined && cast.length === 0) return null;

  const visible = showAll ? cast : cast.slice(0, CAST_PREVIEW);
  const hidden = cast.length - CAST_PREVIEW;

  return (
    <section className="mt-12">
      <SectionHeading title="Elenco" count={cast.length || undefined} />
      <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
        {castOrNull === undefined
          ? Array.from({ length: CAST_PREVIEW }, (_, i) => (
              <li key={i} className="flex items-center gap-3 py-2">
                <span className="w-11 h-11 shrink-0 rounded-full bg-surface animate-pulse" />
                <span className="h-3 w-32 rounded bg-surface animate-pulse" />
              </li>
            ))
          : visible.map((person) => (
              <li key={person.tmdbId}>
                <Link
                  href={personHref(person)}
                  className="group flex items-center gap-3 -mx-2 px-2 py-2 rounded-md hover:bg-surface transition-colors"
                >
                  <PersonPhoto name={person.name} profilePath={person.profilePath} sizes="44px" className="w-11 shrink-0" />
                  <span className="min-w-0">
                    <span className="block text-sm text-foreground/90 truncate group-hover:text-foreground">{person.name}</span>
                    <span className="block text-xs text-brand-slate truncate">
                      {[person.role, person.episodes ? `${person.episodes} ep.` : null].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
      </ul>
      {hidden > 0 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-3 w-full py-2 rounded-md border border-foreground/10 text-sm text-brand-slate hover:text-foreground hover:border-foreground/20 transition-colors"
        >
          {showAll ? "Mostrar menos" : `Ver mais ${hidden} ${hidden === 1 ? "pessoa" : "pessoas"} do elenco`}
        </button>
      )}
    </section>
  );
}

function FactSheet({ series, details }: { series: Series; details: SeriesDetails }) {
  const facts: { label: string; value: React.ReactNode }[] = [];

  if (details.creators.length > 0) {
    facts.push({
      label: "Criação",
      value: details.creators.map((c, i) => (
        <span key={c.tmdbId}>
          {i > 0 && ", "}
          <Link href={personHref(c)} className="hover:text-brand-orange transition-colors">{c.name}</Link>
        </span>
      )),
    });
  }
  if (details.networks.length > 0) facts.push({ label: "Exibição", value: details.networks.join(", ") });
  if (series.numberOfSeasons) {
    facts.push({
      label: "Temporadas",
      value: `${series.numberOfSeasons}${series.numberOfEpisodes ? ` · ${series.numberOfEpisodes} episódios` : ""}`,
    });
  }
  if (details.episodeRunTime) facts.push({ label: "Duração", value: `${runtimeLabel(details.episodeRunTime)} por episódio` });
  if (details.firstAirDate) facts.push({ label: "Estreia", value: shortDate(details.firstAirDate) });
  if (details.nextEpisode?.airDate) {
    facts.push({
      label: "Próximo episódio",
      value: `${shortDate(details.nextEpisode.airDate)}${details.nextEpisode.seasonNumber ? ` · T${details.nextEpisode.seasonNumber}E${details.nextEpisode.episodeNumber}` : ""}`,
    });
  }
  if (series.genres.length > 0) facts.push({ label: "Gêneros", value: series.genres.join(", ") });
  if (series.rating) {
    facts.push({
      label: "Nota TMDB",
      value: <><span className="tabular-nums">{series.rating.toFixed(1)}</span><span className="text-brand-slate"> /10</span></>,
    });
  }

  if (facts.length === 0) return null;

  return (
    <section className="mt-12">
      <SectionHeading title="Ficha técnica" />
      <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-5">
        {facts.map((fact) => (
          <div key={fact.label} className="border-l-2 border-brand-orange/50 pl-3">
            <dt className="text-[11px] uppercase tracking-[0.14em] text-brand-slate">{fact.label}</dt>
            <dd className="mt-1.5 text-sm text-foreground/90">{fact.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function SeriesReviewItem({ review }: { review: SeriesReview }) {
  const { user: me } = useAuth();
  const [revealed, setRevealed] = useState(false);
  const hideText = review.spoiler && me?.username !== review.user.username && !revealed;
  const partners = acceptedPartners(review);

  return (
    <article className="py-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-brand-slate">
        <Link
          href={`/u/${review.user.username}?tab=series`}
          className="flex items-center gap-2 font-semibold text-foreground/90 hover:text-brand-orange transition-colors"
        >
          <Avatar name={review.user.name} username={review.user.username} avatar={review.user.avatar} size="sm" />
          {review.user.name}
        </Link>
        <span className="px-2 py-0.5 rounded-full bg-surface text-xs">{seasonLabel(review.seasonNumber, review.episodeNumber)}</span>
        {review.rating !== null && <StarRating rating={toRating(review.rating)} size={16} />}
        {review.liked && <HeartIcon size={15} weight="fill" className="text-brand-orange" aria-label="Curtiu" />}
        {review.rewatch && (
          <ArrowsClockwiseIcon size={14} weight="bold" className="text-brand-emerald" aria-label="Reassistido">
            <title>Reassistido</title>
          </ArrowsClockwiseIcon>
        )}
        <Link href={seriesReviewHref(review)} className="hover:text-foreground transition-colors">
          {shortDate(review.watchedOn)}
        </Link>
        {partners.length > 0 && <TogetherWith partners={partners} series />}
      </div>
      {review.text && hideText && (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="mt-3 w-full max-w-2xl px-4 py-3 rounded-xl border border-dashed border-brand-crimson/30 bg-brand-crimson/5 text-left text-sm text-brand-slate hover:border-brand-crimson/60 transition-colors"
        >
          Esta review contém spoilers. <span className="font-medium text-brand-crimson">Mostrar mesmo assim</span>
        </button>
      )}
      {review.text && !hideText && (
        <ReviewText text={review.text} inline className="mt-3 font-serif text-[17px] leading-[1.7] text-foreground/85 max-w-2xl line-clamp-4" />
      )}
      {review.text && (
        <Link
          href={seriesReviewHref(review)}
          className="mt-2 block w-fit font-serif text-[15px] font-semibold text-foreground hover:text-brand-orange"
        >
          ver review completa
        </Link>
      )}
    </article>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Header />
      <main>{children}</main>
    </div>
  );
}
