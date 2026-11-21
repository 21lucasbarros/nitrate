"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowRightIcon,
  BookmarkSimpleIcon,
  CheckIcon,
  CircleNotchIcon,
  ClockCounterClockwiseIcon,
  DotsThreeIcon,
  EyeIcon,
  HeartIcon,
  ListPlusIcon,
  ShareNetworkIcon,
  StarIcon,
} from "@phosphor-icons/react";

import Header from "@/app/components/header";
import { AddToListModal } from "@/app/components/add-to-list";
import { Poster } from "@/app/components/ui/poster";
import { PersonPhoto } from "@/app/components/ui/person-photo";
import { RatingMeterInput } from "@/app/components/ui/rating-meter";
import { SectionHeading } from "@/app/components/ui/section-heading";
import { ReviewCard } from "@/app/components/review-card";
import { Avatar } from "@/app/components/ui/avatar";
import { BottomSheet } from "@/app/components/ui/bottom-sheet";
import { SlowHint } from "@/app/components/ui/slow-hint";
import { StarRating } from "@/app/components/ui/star-rating";
import { formatScore } from "@/app/components/ui/rating-meter";
import { ReviewForm } from "@/app/components/review-form";
import { Modal } from "@/app/components/ui/modal";
import { NitrateRating, WhereToWatch } from "@/app/components/movie-community";
import { ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { easterEggFor } from "@/lib/easter-eggs";
import { showQuote, useMovieEasterEgg } from "@/lib/hooks/use-easter-eggs";
import { MatrixPills } from "@/app/components/easter-eggs/matrix-pills";
import { MatrixRain } from "@/app/components/easter-eggs/matrix-rain";
import { TrumanPoster } from "@/app/components/easter-eggs/truman-poster";
import { useFetch } from "@/lib/hooks/use-fetch";
import {
  getMovieBySlug,
  getMovieCredits,
  getMovieStats,
  getWatchProviders,
  type CreditPerson,
} from "@/lib/services/movie-service";
import { createReview, getMovieReviews, updateReview } from "@/lib/services/review-service";
import { getMovieState } from "@/lib/services/user-service";
import { addToWatchlist, removeFromWatchlist } from "@/lib/services/watchlist-service";
import type { MovieReview, ReviewRequest } from "@/lib/types/review";
import type { Movie } from "@/types/movie";
import { todayIso } from "@/utils/format";
import { backdropUrl } from "@/utils/poster";
import { toRating } from "@/utils/rating";
import type { MovieStats } from "@/lib/services/movie-service";

const CAST_PREVIEW = 8;

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
        <div className="pt-48 pb-24 flex flex-col items-center gap-6 text-brand-slate/40">
          {movie.error ? "Não foi possível carregar o filme." : <CircleNotchIcon size={32} className="animate-spin" />}
          {!movie.error && <SlowHint className="px-6 text-center" />}
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
  const { status, user: me, refreshUser } = useAuth();
  const reviews = useFetch(film.id, getMovieReviews);
  const credits = useFetch(film.id, getMovieCredits);
  const stats = useFetch(film.id, getMovieStats);
  const providers = useFetch(film.id, getWatchProviders);
  const myState = useFetch(status === "authenticated" ? film.id : null, getMovieState);
  useMovieEasterEgg(film);
  const egg = easterEggFor(film);

  // "edit" = editar a review mais recente; "new" = registrar (ou registrar de novo)
  const [editing, setEditing] = useState<"edit" | "new" | null>(null);
  const [watchlistBusy, setWatchlistBusy] = useState(false);
  // a gaveta de ações do celular
  const [sheetOpen, setSheetOpen] = useState(false);

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
      // easter egg (O Poderoso Chefão): uma oferta irrecusável
      if (!inWatchlist && typeof egg?.watchlist === "object") showQuote(egg.watchlist.quote);
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

  const poster = (
    <Poster title={film.title} posterPath={film.posterPath} size="w500" sizes="(min-width: 768px) 230px, 112px" className="shadow-2xl shadow-black/60" />
  );
  const posterWithEgg = egg?.posterClicks === "truman-crack" ? <TrumanPoster>{poster}</TrumanPoster> : poster;

  // o mesmo painel no lado direito (desktop) e dentro da gaveta (celular)
  const actionPanel = (inSheet: boolean) =>
    status === "authenticated" && myState.data ? (
      <ActionPanel
        film={film}
        review={myReview}
        timesWatched={timesWatched}
        inWatchlist={inWatchlist}
        watchlistBusy={watchlistBusy}
        // abrir o formulário fecha a gaveta: um modal de cada vez
        onLog={() => {
          if (inSheet) setSheetOpen(false);
          setEditing("new");
        }}
        onEdit={myReview ? () => {
          if (inSheet) setSheetOpen(false);
          setEditing("edit");
        } : undefined}
        onToggleWatchlist={toggleWatchlist}
        onChanged={afterChange}
        watchlistPills={egg?.watchlist === "pills"}
        ratingQuotes={egg?.ratingQuotes}
      />
    ) : null;

  return (
    <>
      {egg?.pageIntro === "matrix-rain" && <MatrixRain />}

      {/* celular: cena no topo, título e pôster lado a lado, notas e a barra que abre a gaveta */}
      <MobileFilmHeader
        film={film}
        backdrop={backdrop}
        directors={directors}
        tagline={credits.data?.tagline ?? null}
        poster={posterWithEgg}
        stats={stats.data}
        myRating={myReview?.rating ?? null}
        onOpenSheet={status === "authenticated" ? () => setSheetOpen(true) : undefined}
      >
        {status === "authenticated" && me && myState.data && (
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-surface hover:bg-surface-strong transition-colors text-left"
          >
            <Avatar name={me.name} username={me.username} avatar={me.avatar} size="xs" />
            <span className="flex-1 min-w-0 text-sm truncate">
              {timesWatched > 0 ? "Você registrou este filme" : inWatchlist ? "Está na sua watchlist" : "Registrar, avaliar ou guardar"}
            </span>
            {myReview?.rating != null && <StarRating rating={toRating(myReview.rating)} size={12} />}
            <DotsThreeIcon size={22} weight="bold" className="shrink-0 text-brand-slate" />
          </button>
        )}
        {status === "anonymous" && (
          <Link
            href={`/sign-in?redirect=${encodeURIComponent(`/film/${film.slug}`)}`}
            className="block w-full px-4 py-3.5 rounded-xl bg-surface text-sm text-brand-slate"
          >
            <span className="font-semibold text-foreground">Entre</span> para registrar, avaliar ou guardar na watchlist.
          </Link>
        )}
      </MobileFilmHeader>

      {/* imagem de fundo: uma cena do filme, desbotando para o fundo da página */}
      <div className="hidden md:block relative h-[460px] lg:h-[580px] -mb-[260px] lg:-mb-[340px]">
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
        {/* desbota para o fundo embaixo e nas laterais, como uma tela de cinema; escurece mais onde entra o texto */}
        <div className="absolute inset-0 bg-linear-to-t from-background from-15% via-background/75 via-55% to-background/10" />
        <div className="absolute inset-0 bg-linear-to-r from-background via-transparent to-background opacity-80" />
      </div>

      <div className={`relative max-w-[1180px] mx-auto px-6 pb-24 ${backdrop ? "" : "md:pt-32"}`}>
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] lg:grid-cols-[230px_1fr_280px] gap-8 lg:gap-10">
          {/* pôster: alinhado ao topo do título e acompanhando a rolagem */}
          <aside className="hidden md:block md:pt-10 lg:pt-16">
            <div className="sticky top-24">{posterWithEgg}</div>
          </aside>

          {/* título, sinopse, elenco, ficha */}
          <section className="min-w-0 md:pt-10 lg:pt-16">
            <div className="hidden md:block">
            {/* linha de contexto acima do título: ano e gêneros */}
            <p className="flex flex-wrap items-center gap-x-2 text-xs uppercase tracking-[0.14em] text-foreground/70">
              {[film.releaseYear, ...film.genres.slice(0, 3)].filter(Boolean).map((item, i) => (
                <span key={String(item)} className="flex items-center gap-2">
                  {i > 0 && <span className="w-1 h-1 rounded-full bg-brand-orange" />}
                  {item}
                </span>
              ))}
            </p>
            <h1 className="mt-3 font-serif text-4xl lg:text-[56px] font-semibold leading-[1.02] tracking-tight text-balance [text-shadow:0_2px_24px_rgb(0_0_0/0.45)]">
              {film.title}
            </h1>
            <FilmHighlights film={film} directors={directors} stats={stats.data} />

            {credits.data?.tagline && (
              <p className="mt-7 font-serif text-lg italic text-foreground/60 max-w-2xl">“{credits.data.tagline}”</p>
            )}
            {film.overview && (
              <p className={`${credits.data?.tagline ? "mt-3" : "mt-7"} text-base leading-[1.75] text-foreground/80 max-w-2xl`}>{film.overview}</p>
            )}
            </div>

            <CastList cast={credits.data?.cast} />
            <FactSheet film={film} directors={directors} />

            <section className="mt-12">
              <SectionHeading title="Onde assistir" />
              {providers.data ? <WhereToWatch providers={providers.data} /> : <p className="text-sm text-brand-slate">Carregando…</p>}
            </section>
          </section>

          {/* painel de ações + nota do Nitrate */}
          <aside className="hidden md:grid md:col-span-2 lg:col-span-1 lg:pt-16 sm:grid-cols-2 lg:grid-cols-1 gap-6 content-start">
            {actionPanel(false)}
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
        <BottomSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          label={`Ações para ${film.title}`}
          header={
            <>
              <p className="font-serif text-xl font-semibold leading-tight">{film.title}</p>
              {film.releaseYear && <p className="mt-0.5 text-sm text-brand-slate">{film.releaseYear}</p>}
            </>
          }
        >
          {actionPanel(true)}
          <ShareFilmRow film={film} />
        </BottomSheet>
      )}

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

/** Painel lateral: nota rápida, o que a pessoa já fez com o filme e o atalho para registrar. */
function ActionPanel(props: {
  film: Movie;
  review: MovieReview | null;
  timesWatched: number;
  inWatchlist: boolean;
  watchlistBusy: boolean;
  onLog: () => void;
  onEdit?: () => void;
  onToggleWatchlist: () => void;
  onChanged: () => void;
  /** easter egg de Matrix: pílula vermelha ou azul no lugar do botão da watchlist */
  watchlistPills?: boolean;
  /** easter egg: fala ao escolher certas notas */
  ratingQuotes?: Record<number, string>;
}) {
  const { review } = props;
  const watched = props.timesWatched > 0;
  const liked = review?.liked ?? false;
  const [busy, setBusy] = useState(false);
  const [addingToList, setAddingToList] = useState(false);

  // salva direto da página, sem abrir o formulário: atualiza a última review ou cria um registro de hoje
  const quickSave = async (changes: Partial<ReviewRequest>) => {
    setBusy(true);
    try {
      if (review) {
        await updateReview(review.id, {
          rating: review.rating,
          text: review.text,
          liked: review.liked,
          rewatch: review.rewatch,
          spoiler: review.spoiler,
          watchedOn: review.watchedOn,
          ...changes,
        });
      } else {
        await createReview({
          movieId: props.film.id,
          rating: null,
          text: null,
          liked: false,
          rewatch: false,
          spoiler: false,
          watchedOn: todayIso(),
          ...changes,
        });
      }
      props.onChanged();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg bg-surface overflow-hidden ring-1 ring-foreground/5 shadow-xl shadow-black/30">
      {/* atalhos: ícone em cima, rótulo embaixo; colorido quando ativo */}
      <div className={`grid ${props.watchlistPills ? "grid-cols-3" : "grid-cols-4"} gap-1 p-2`}>
        <ActionToggle
          icon={EyeIcon}
          label={watched ? "Assistido" : "Assisti"}
          active={watched}
          activeClass="text-brand-emerald"
          onClick={props.onLog}
        />
        <ActionToggle
          icon={HeartIcon}
          label={liked ? "Curti" : "Curtir"}
          active={liked}
          activeClass="text-brand-orange"
          onClick={() => (review ? quickSave({ liked: !liked }) : props.onLog())}
          disabled={busy}
          pressed={liked}
        />
        {!props.watchlistPills && (
          <ActionToggle
            icon={BookmarkSimpleIcon}
            label="Watchlist"
            active={props.inWatchlist}
            activeClass="text-brand-blue"
            onClick={props.onToggleWatchlist}
            disabled={props.watchlistBusy}
            pressed={props.inWatchlist}
          />
        )}
        <ActionToggle icon={ListPlusIcon} label="Lista" active={false} activeClass="" onClick={() => setAddingToList(true)} />
      </div>
      {props.watchlistPills && (
        <div className="border-t border-foreground/5">
          <MatrixPills inWatchlist={props.inWatchlist} busy={props.watchlistBusy} onToggle={props.onToggleWatchlist} />
        </div>
      )}
      <AddToListModal open={addingToList} movie={props.film} onClose={() => setAddingToList(false)} />

      <div className="border-t border-foreground/5 p-5">
        <span className="text-xs uppercase tracking-[0.14em] text-brand-slate">Sua nota</span>
        <div className="mt-3">
          <RatingMeterInput
            value={review?.rating ?? null}
            onChange={(rating) => {
              quickSave({ rating });
              const quote = rating !== null ? props.ratingQuotes?.[rating] : undefined;
              if (quote) showQuote(quote);
            }}
            disabled={busy}
          />
        </div>
      </div>

      <div className="px-5 pb-5 flex gap-2">
        <button
          onClick={props.onLog}
          className="flex-1 py-2.5 rounded-md bg-brand-btn text-brand-btn-text text-sm font-semibold hover:bg-brand-btn/90 transition-colors"
        >
          {watched ? "Registrar nova sessão" : "Escrever review"}
        </button>
        {props.onEdit && (
          <button
            onClick={props.onEdit}
            title="Editar a última review"
            className="px-3.5 py-2.5 rounded-md ring-1 ring-foreground/10 text-sm text-brand-slate hover:text-foreground hover:ring-foreground/25 transition-colors"
          >
            Editar
          </button>
        )}
      </div>

      <Link
        href={`/film/${props.film.slug}/atividade`}
        className="group flex items-center justify-between gap-3 px-5 py-3.5 border-t border-foreground/5 text-sm text-brand-slate hover:text-foreground hover:bg-surface-strong transition-colors"
      >
        <span className="flex items-center gap-2.5">
          <ClockCounterClockwiseIcon size={16} />
          Ver minha atividade
        </span>
        <span className="flex items-center gap-2 text-xs text-brand-slate/70">
          {props.timesWatched > 0 && `${props.timesWatched} ${props.timesWatched === 1 ? "sessão" : "sessões"}`}
          <ArrowRightIcon size={13} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>
    </div>
  );
}

/** botão quadrado da grade de atalhos do painel */
function ActionToggle({ icon: Icon, label, active, activeClass, onClick, disabled, pressed }: {
  icon: typeof EyeIcon;
  label: string;
  active: boolean;
  activeClass: string;
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={pressed}
      className={`flex flex-col items-center gap-1.5 py-3 rounded-md text-[11px] font-medium transition-colors hover:bg-surface-strong disabled:opacity-50 ${
        active ? activeClass : "text-brand-slate hover:text-foreground"
      }`}
    >
      <Icon size={22} weight={active ? "fill" : "regular"} />
      {label}
    </button>
  );
}

/** faixa logo abaixo do título: quem dirigiu e as notas, para ver de cara sem rolar */
function FilmHighlights({ film, directors, stats }: { film: Movie; directors: CreditPerson[]; stats: MovieStats | undefined }) {
  const items: React.ReactNode[] = [];

  if (directors.length > 0 || film.director) {
    items.push(
      <span key="director">
        <span className="text-brand-slate">Direção </span>
        {directors.length > 0
          ? directors.map((d, i) => (
              <span key={d.tmdbId}>
                {i > 0 && ", "}
                <Link href={`/person/${d.tmdbId}`} className="font-medium text-foreground hover:text-brand-orange transition-colors">{d.name}</Link>
              </span>
            ))
          : <span className="font-medium text-foreground">{film.director}</span>}
      </span>,
    );
  }
  if (stats?.averageRating != null) {
    items.push(
      <span key="nitrate" className="flex items-center gap-1.5" title={`${stats.ratingsCount} ${stats.ratingsCount === 1 ? "nota" : "notas"} no Nitrate`}>
        <StarIcon size={14} weight="fill" className="text-brand-orange" />
        <span className="font-semibold tabular-nums text-foreground">{formatScore(stats.averageRating)}</span>
        <span className="text-brand-slate">no Nitrate</span>
      </span>,
    );
  }
  if (stats && stats.watchedCount > 0) {
    items.push(
      <span key="watched" className="flex items-center gap-1.5 text-brand-slate">
        <EyeIcon size={14} />
        <span className="tabular-nums">{stats.watchedCount}</span> {stats.watchedCount === 1 ? "assistiu" : "assistiram"}
      </span>,
    );
  }
  if (film.rating !== null) {
    items.push(
      <span key="tmdb" className="text-brand-slate">
        TMDB <span className="font-medium tabular-nums text-foreground/90">{film.rating.toFixed(1)}</span>
      </span>,
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-5">
          {i > 0 && <span aria-hidden="true" className="h-3.5 w-px bg-foreground/15" />}
          {item}
        </span>
      ))}
    </div>
  );
}

/** Elenco em lista de duas colunas (foto, nome e personagem); "ver todos" abre o resto no lugar. */
function CastList({ cast: castOrNull }: { cast: CreditPerson[] | undefined }) {
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
              <li key={`${person.tmdbId}-${person.role}`}>
                <Link
                  href={`/person/${person.tmdbId}`}
                  className="group flex items-center gap-3 -mx-2 px-2 py-2 rounded-md hover:bg-surface transition-colors"
                >
                  <PersonPhoto name={person.name} profilePath={person.profilePath} sizes="44px" className="w-11 shrink-0" />
                  <span className="min-w-0">
                    <span className="block text-sm text-foreground/90 truncate group-hover:text-foreground">{person.name}</span>
                    {person.role && <span className="block text-xs text-brand-slate truncate">{person.role}</span>}
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

/** Ficha técnica: os dados do filme em blocos, cada um com o rótulo em cima. */
function FactSheet({ film, directors }: { film: Movie; directors: CreditPerson[] }) {
  const facts: { label: string; value: React.ReactNode }[] = [];

  if (directors.length > 0 || film.director) {
    facts.push({
      label: "Direção",
      value: directors.length > 0
        ? directors.map((d, i) => (
            <span key={d.tmdbId}>
              {i > 0 && ", "}
              <Link href={`/person/${d.tmdbId}`} className="hover:text-brand-orange transition-colors">{d.name}</Link>
            </span>
          ))
        : film.director,
    });
  }
  if (film.releaseYear) facts.push({ label: "Lançamento", value: film.releaseYear });
  if (film.genres.length > 0) facts.push({ label: "Gêneros", value: film.genres.join(", ") });
  if (film.franchise) facts.push({ label: "Franquia", value: film.franchise });
  if (film.rating !== null) {
    facts.push({
      label: "Nota TMDB",
      value: <><span className="tabular-nums">{film.rating.toFixed(1)}</span><span className="text-brand-slate"> /10</span></>,
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

/** Topo da página do filme no celular: cena, título e pôster lado a lado, sinopse, notas e a barra de ações. */
function MobileFilmHeader({ film, backdrop, directors, tagline, poster, stats, myRating, onOpenSheet, children }: {
  film: Movie;
  backdrop: string | null;
  directors: CreditPerson[];
  tagline: string | null;
  poster: React.ReactNode;
  stats: MovieStats | undefined;
  myRating: number | null;
  onOpenSheet?: () => void;
  children: React.ReactNode;
}) {
  const director = directors[0];

  return (
    <div className="md:hidden">
      {/* a cena ocupa o topo, por baixo do cabeçalho translúcido */}
      <div className={`relative ${backdrop ? "h-[56vh] min-h-[320px] max-h-[520px]" : "h-48"}`}>
        {backdrop && <Image src={backdrop} alt="" fill priority sizes="100vw" className="object-cover object-[center_30%]" />}
        <div className="absolute inset-0 bg-linear-to-t from-background via-background/20 to-background/40" />
        {onOpenSheet && (
          <button
            type="button"
            onClick={onOpenSheet}
            aria-label="Ações do filme"
            className="absolute top-20 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-black/45 backdrop-blur-md text-foreground"
          >
            <DotsThreeIcon size={22} weight="bold" />
          </button>
        )}
      </div>

      <div className="relative px-5 -mt-24 flex items-end gap-4">
        <div className="flex-1 min-w-0 pb-1">
          <h1 className="font-serif text-[28px] font-semibold leading-[1.1] tracking-tight">{film.title}</h1>
          <p className="mt-3 text-[11px] uppercase tracking-[0.16em] text-brand-slate">
            {[film.releaseYear, director || film.director ? "Direção" : null].filter(Boolean).join(" · ")}
          </p>
          {director ? (
            <Link href={`/person/${director.tmdbId}`} className="mt-0.5 block font-semibold text-foreground/90">
              {director.name}
            </Link>
          ) : (
            film.director && <p className="mt-0.5 font-semibold text-foreground/90">{film.director}</p>
          )}
          {film.genres.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {film.genres.slice(0, 2).map((genre) => (
                <li key={genre} className="px-2 py-0.5 rounded-full bg-surface text-[11px] text-brand-slate">{genre}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="w-28 shrink-0">{poster}</div>
      </div>

      {(tagline || film.overview) && (
        <div className="px-5 mt-7">
          {tagline && <p className="text-xs uppercase tracking-[0.16em] text-brand-orange">{tagline}</p>}
          {film.overview && <p className="mt-2 text-[15px] leading-relaxed text-foreground/80">{film.overview}</p>}
        </div>
      )}

      {stats && (
        <div className="mt-7 px-5 py-6 border-y border-foreground/10">
          <MobileRatings stats={stats} myRating={myRating} />
        </div>
      )}

      <div className="px-5 py-6 border-b border-foreground/10">{children}</div>
    </div>
  );
}

const HISTOGRAM_STEPS = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

/** histograma das notas em meias estrelas, com a média ao lado; a barra da sua nota fica laranja */
function MobileRatings({ stats, myRating }: { stats: MovieStats; myRating: number | null }) {
  const counts = HISTOGRAM_STEPS.map((step) => stats.ratingDistribution[step.toFixed(1)] ?? 0);
  const max = Math.max(1, ...counts);

  return (
    <section>
      <div className="flex items-baseline justify-between">
        <h2 className="text-[11px] uppercase tracking-[0.16em] text-brand-slate">Notas no Nitrate</h2>
        <span className="text-xs text-brand-slate/70">
          {stats.ratingsCount} {stats.ratingsCount === 1 ? "nota" : "notas"} · {stats.watchedCount} {stats.watchedCount === 1 ? "assistiu" : "assistiram"}
        </span>
      </div>
      {stats.averageRating === null ? (
        <p className="mt-3 text-sm text-brand-slate/70">Ninguém avaliou ainda. Seja a primeira nota.</p>
      ) : (
        <div className="mt-4 flex items-end gap-3">
          <StarIcon size={12} weight="fill" className="mb-0.5 shrink-0 text-brand-orange" />
          <div className="flex-1 flex items-end gap-[3px] h-16" aria-label="Distribuição das notas">
            {counts.map((count, i) => (
              <span
                key={HISTOGRAM_STEPS[i]}
                title={`${formatScore(HISTOGRAM_STEPS[i])}: ${count}`}
                className={`flex-1 rounded-t-[2px] ${myRating === HISTOGRAM_STEPS[i] ? "bg-brand-orange" : "bg-brand-slate/35"}`}
                style={{ height: `${Math.max(3, (count / max) * 100)}%` }}
              />
            ))}
          </div>
          <div className="shrink-0 flex flex-col items-end">
            <span className="text-3xl font-light tabular-nums leading-none">{formatScore(stats.averageRating)}</span>
            <span className="mt-1.5"><StarRating rating={toRating(stats.averageRating)} size={9} /></span>
          </div>
        </div>
      )}
    </section>
  );
}

/** linha "Compartilhar" da gaveta: folha nativa do celular ou copia o link */
function ShareFilmRow({ film }: { film: Movie }) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = `${window.location.origin}/film/${film.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${film.title} no Nitrate`, url });
      } catch {
        // cancelou
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={share}
      className="w-full flex items-center justify-between px-5 py-4 border-t border-foreground/5 text-sm text-brand-slate hover:text-foreground"
    >
      {copied ? "Link copiado" : "Compartilhar"}
      {copied ? <CheckIcon size={16} className="text-brand-emerald" /> : <ShareNetworkIcon size={16} />}
    </button>
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
