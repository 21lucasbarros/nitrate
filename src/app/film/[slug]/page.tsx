"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowsClockwiseIcon,
  BookmarkSimpleIcon,
  CircleNotchIcon,
  EyeIcon,
  HeartIcon,
} from "@phosphor-icons/react";

import Header from "@/app/components/header";
import { Poster } from "@/app/components/ui/poster";
import { StarRating } from "@/app/components/ui/star-rating";
import { SectionHeading } from "@/app/components/ui/section-heading";
import { ReviewCard } from "@/app/components/review-card";
import { ReviewForm } from "@/app/components/review-form";
import { Modal } from "@/app/components/ui/modal";
import { NitrateRating, WhereToWatch } from "@/app/components/movie-community";
import { ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useFetch } from "@/lib/hooks/use-fetch";
import {
  getMovieBySlug,
  getMovieCredits,
  getMovieStats,
  getWatchProviders,
  type CreditPerson,
  type WatchProviders,
} from "@/lib/services/movie-service";
import { getMovieReviews } from "@/lib/services/review-service";
import { getMovieState } from "@/lib/services/user-service";
import { addToWatchlist, removeFromWatchlist } from "@/lib/services/watchlist-service";
import type { Movie } from "@/types/movie";
import { shortDate } from "@/utils/format";
import { backdropUrl } from "@/utils/poster";
import { toRating } from "@/utils/rating";

const CAST_PREVIEW = 15;

export default function FilmPage() {
  const { slug } = useParams<{ slug: string }>();
  const movie = useFetch(slug, getMovieBySlug);

  if (movie.error instanceof ApiError && movie.error.status === 404) {
    return (
      <Shell>
        <div className="pt-48 pb-24 text-center">
          <h1 className="font-serif text-3xl font-semibold">Filme não encontrado.</h1>
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
        <div className="pt-48 pb-24 flex justify-center text-brand-slate/40">
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

  // "edit" = editar a review mais recente; "new" = registrar (ou registrar de novo)
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
  const directors = credits.data?.directors ?? [];
  const backdrop = backdropUrl(credits.data?.backdropPath);

  return (
    <>
      {/* imagem de fundo: uma cena do filme, desbotando para o fundo da página */}
      <div className="relative h-[300px] sm:h-[420px] lg:h-[520px] -mb-[180px] sm:-mb-[260px] lg:-mb-[320px]">
        {backdrop && (
          <Image
            src={backdrop}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_25%]"
          />
        )}
        {/* desbota para o fundo embaixo e nas laterais, como uma tela de cinema */}
        <div className="absolute inset-0 bg-linear-to-t from-background via-background/30 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-r from-background via-transparent to-background opacity-80" />
      </div>

      <div className={`relative max-w-[1180px] mx-auto px-6 pb-24 ${backdrop ? "" : "pt-32"}`}>
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] lg:grid-cols-[230px_1fr_260px] gap-8 lg:gap-10">
          {/* pôster + números */}
          <aside className="flex flex-col items-center md:items-stretch gap-4">
            <div className="w-44 md:w-full">
              <Poster title={film.title} posterPath={film.posterPath} size="w500" sizes="230px" className="shadow-2xl shadow-black/60" />
            </div>
            {stats.data && (stats.data.watchedCount > 0 || stats.data.likesCount > 0) && (
              <div className="flex justify-center gap-5 text-xs text-brand-slate">
                <span className="flex items-center gap-1.5" title="Pessoas que registraram">
                  <EyeIcon size={15} weight="fill" className="text-brand-emerald" /> {stats.data.watchedCount}
                </span>
                <span className="flex items-center gap-1.5" title="Pessoas que curtiram">
                  <HeartIcon size={15} weight="fill" className="text-brand-orange" /> {stats.data.likesCount}
                </span>
              </div>
            )}
          </aside>

          {/* título, sinopse, elenco */}
          <section className="min-w-0 md:pt-10 lg:pt-16">
            <h1 className="font-serif text-4xl sm:text-5xl font-semibold leading-[1.05] tracking-tight">
              {film.title}{" "}
              {film.releaseYear && (
                <span className="font-sans text-xl sm:text-2xl font-normal text-brand-slate align-middle">{film.releaseYear}</span>
              )}
            </h1>
            {(directors.length > 0 || film.director) && (
              <p className="mt-3 text-lg text-brand-slate">
                Dirigido por{" "}
                {directors.length > 0
                  ? directors.map((d, i) => (
                      <span key={d.tmdbId}>
                        {i > 0 && (i === directors.length - 1 ? " e " : ", ")}
                        <Link href={`/person/${d.tmdbId}`} className="text-foreground underline-offset-4 decoration-foreground/30 underline hover:decoration-brand-orange">
                          {d.name}
                        </Link>
                      </span>
                    ))
                  : <span className="text-foreground">{film.director}</span>}
              </p>
            )}

            {credits.data?.tagline && (
              <p className="mt-8 text-sm font-medium tracking-[0.12em] uppercase text-brand-slate">{credits.data.tagline}</p>
            )}
            {film.overview && (
              <p className={`${credits.data?.tagline ? "mt-3" : "mt-8"} font-serif text-lg leading-[1.7] text-foreground/85 max-w-2xl`}>
                {film.overview}
              </p>
            )}

            <FilmTabs film={film} cast={credits.data?.cast} providers={providers.data} />
          </section>

          {/* painel de ações + nota do Nitrate */}
          <aside className="md:col-span-2 lg:col-span-1 lg:pt-16 grid sm:grid-cols-2 lg:grid-cols-1 gap-6 content-start">
            {status === "authenticated" && myState.data && (
              <ActionPanel
                watched={timesWatched > 0}
                timesWatched={timesWatched}
                liked={myReview?.liked ?? false}
                rating={myReview?.rating ?? null}
                lastWatched={myReview?.watchedOn ?? null}
                inWatchlist={inWatchlist}
                watchlistBusy={watchlistBusy}
                onLog={() => setEditing("new")}
                onEdit={myReview ? () => setEditing("edit") : undefined}
                onToggleWatchlist={toggleWatchlist}
              />
            )}
            {status === "anonymous" && (
              <div className="rounded-md bg-surface p-5 text-center text-sm text-brand-slate">
                <Link
                  href={`/sign-in?redirect=${encodeURIComponent(`/film/${film.slug}`)}`}
                  className="font-semibold text-foreground hover:text-brand-orange"
                >
                  Entre
                </Link>{" "}
                para registrar, avaliar ou guardar na watchlist.
              </div>
            )}
            {stats.data && <NitrateRating stats={stats.data} />}
          </aside>
        </div>

        {/* reviews */}
        <section className="mt-16 lg:max-w-[calc(100%-300px)] lg:ml-[270px]">
          <SectionHeading title="Reviews" count={reviews.data?.length} />
          {myReview && (
            <div className="border-b border-foreground/10 -mt-5">
              <ReviewCard review={myReview} hideMovie excerpt />
            </div>
          )}
          {otherReviews.length > 0 ? (
            <div className={`divide-y divide-foreground/10 ${myReview ? "" : "-mt-5"}`}>
              {otherReviews.map((review) => (
                <ReviewCard key={review.id} review={review} hideMovie excerpt />
              ))}
            </div>
          ) : (
            !reviews.loading && !myReview && (
              <p className="py-4 text-brand-slate">Ninguém registrou este filme ainda.</p>
            )
          )}
        </section>
      </div>

      {status === "authenticated" && myState.data && (
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
      )}
    </>
  );
}

/** Painel lateral: o que a pessoa já fez com o filme e os atalhos para registrar. */
function ActionPanel(props: {
  watched: boolean;
  timesWatched: number;
  liked: boolean;
  rating: number | null;
  lastWatched: string | null;
  inWatchlist: boolean;
  watchlistBusy: boolean;
  onLog: () => void;
  onEdit?: () => void;
  onToggleWatchlist: () => void;
}) {
  const iconButton = "flex flex-col items-center gap-1.5 py-4 text-xs font-medium transition-colors hover:bg-surface-strong";
  const row = "w-full py-3.5 text-sm text-foreground/85 border-t border-foreground/5 hover:bg-surface-strong hover:text-foreground transition-colors";

  return (
    <div className="rounded-md bg-surface overflow-hidden text-center">
      <div className="grid grid-cols-3">
        <button onClick={props.onLog} className={`${iconButton} ${props.watched ? "text-brand-emerald" : "text-brand-slate"}`}>
          <EyeIcon size={30} weight={props.watched ? "fill" : "regular"} />
          {props.watched ? "Assistido" : "Assistir"}
        </button>
        <button onClick={props.onEdit ?? props.onLog} className={`${iconButton} ${props.liked ? "text-brand-orange" : "text-brand-slate"}`}>
          <HeartIcon size={30} weight={props.liked ? "fill" : "regular"} />
          {props.liked ? "Curtido" : "Curtir"}
        </button>
        <button
          onClick={props.onToggleWatchlist}
          disabled={props.watchlistBusy}
          aria-pressed={props.inWatchlist}
          className={`${iconButton} disabled:opacity-50 ${props.inWatchlist ? "text-brand-blue" : "text-brand-slate"}`}
        >
          <BookmarkSimpleIcon size={30} weight={props.inWatchlist ? "fill" : "regular"} />
          Watchlist
        </button>
      </div>

      <div className="border-t border-foreground/5 py-4">
        <span className="text-xs text-brand-slate">{props.rating !== null ? "Sua nota" : "Sem nota"}</span>
        <div className="mt-1.5 flex justify-center">
          {props.rating !== null ? (
            <StarRating rating={toRating(props.rating)} size={26} />
          ) : (
            <button onClick={props.onEdit ?? props.onLog} className="text-sm text-brand-slate hover:text-brand-orange">
              Dar uma nota
            </button>
          )}
        </div>
        {props.lastWatched && (
          <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-brand-slate">
            {props.timesWatched > 1 && <ArrowsClockwiseIcon size={12} weight="bold" className="text-brand-emerald" />}
            {props.timesWatched > 1 ? `${props.timesWatched} vezes · última em ` : "Assistido em "}
            {shortDate(props.lastWatched)}
          </p>
        )}
      </div>

      <button onClick={props.onLog} className={row}>
        {props.watched ? "Assisti de novo…" : "Registrar ou avaliar…"}
      </button>
      {props.onEdit && (
        <button onClick={props.onEdit} className={row}>
          Editar última review…
        </button>
      )}
    </div>
  );
}

type TabId = "elenco" | "detalhes" | "onde";

/** Abas abaixo da sinopse: elenco, detalhes e onde assistir. */
function FilmTabs({ film, cast: castOrNull, providers }: {
  film: Movie;
  cast: CreditPerson[] | undefined; // undefined = ainda carregando
  providers: WatchProviders | undefined;
}) {
  const [tab, setTab] = useState<TabId>("elenco");
  const castLoading = castOrNull === undefined;
  const cast = castOrNull ?? [];
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? cast : cast.slice(0, CAST_PREVIEW);

  const tabs: { id: TabId; label: string }[] = [
    { id: "elenco", label: "Elenco" },
    { id: "detalhes", label: "Detalhes" },
    { id: "onde", label: "Onde assistir" },
  ];

  return (
    <div className="mt-10">
      <div role="tablist" className="flex gap-6 border-b border-foreground/10">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px pb-2 text-[13px] font-semibold tracking-[0.1em] uppercase border-b-2 transition-colors ${tab === t.id ? "border-brand-orange text-foreground" : "border-transparent text-brand-orange/80 hover:text-brand-orange"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="pt-5">
        {tab === "elenco" &&
          (castLoading ? (
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 8 }, (_, i) => (
                <span key={i} className="h-8 w-28 rounded-sm bg-surface animate-pulse" />
              ))}
            </div>
          ) : cast.length === 0 ? (
            <p className="text-sm text-brand-slate">Elenco indisponível.</p>
          ) : (
            <>
              <ul className="flex flex-wrap gap-2">
                {visible.map((person) => (
                  <li key={`${person.tmdbId}-${person.role}`}>
                    <Link
                      href={`/person/${person.tmdbId}`}
                      title={person.role ? `${person.name} como ${person.role}` : person.name}
                      className="block px-3 py-1.5 rounded-sm bg-surface text-sm text-foreground/80 hover:bg-surface-strong hover:text-foreground transition-colors"
                    >
                      {person.name}
                    </Link>
                  </li>
                ))}
              </ul>
              {cast.length > CAST_PREVIEW && (
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="mt-3 px-3 py-1.5 rounded-sm bg-surface text-sm text-brand-slate hover:text-foreground"
                >
                  {showAll ? "Mostrar menos" : `Mostrar todos (${cast.length})`}
                </button>
              )}
            </>
          ))}

        {tab === "detalhes" && (
          <dl className="grid grid-cols-[120px_1fr] gap-y-3 text-sm">
            {film.genres.length > 0 && (
              <>
                <dt className="text-brand-slate uppercase tracking-[0.1em] text-xs pt-1.5">Gêneros</dt>
                <dd className="flex flex-wrap gap-2">
                  {film.genres.map((g) => (
                    <span key={g} className="px-3 py-1 rounded-sm bg-surface text-foreground/80">{g}</span>
                  ))}
                </dd>
              </>
            )}
            {film.franchise && (
              <>
                <dt className="text-brand-slate uppercase tracking-[0.1em] text-xs pt-0.5">Franquia</dt>
                <dd className="text-foreground/85">{film.franchise}</dd>
              </>
            )}
            {film.rating !== null && (
              <>
                <dt className="text-brand-slate uppercase tracking-[0.1em] text-xs pt-0.5">Nota TMDB</dt>
                <dd className="text-foreground/85"><span className="font-mono">{film.rating.toFixed(1)}</span>/10</dd>
              </>
            )}
          </dl>
        )}

        {tab === "onde" &&
          (providers ? <WhereToWatch providers={providers} /> : <p className="text-sm text-brand-slate">Carregando…</p>)}
      </div>
    </div>
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
