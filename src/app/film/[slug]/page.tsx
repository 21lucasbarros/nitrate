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
  ListPlusIcon,
} from "@phosphor-icons/react";

import Header from "@/app/components/header";
import { AddToListModal } from "@/app/components/add-to-list";
import { Poster } from "@/app/components/ui/poster";
import { PersonPhoto } from "@/app/components/ui/person-photo";
import { RatingMeterInput } from "@/app/components/ui/rating-meter";
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
} from "@/lib/services/movie-service";
import { createReview, getMovieReviews, updateReview } from "@/lib/services/review-service";
import { getMovieState } from "@/lib/services/user-service";
import { addToWatchlist, removeFromWatchlist } from "@/lib/services/watchlist-service";
import type { MovieReview, ReviewRequest } from "@/lib/types/review";
import type { Movie } from "@/types/movie";
import { shortDate, todayIso } from "@/utils/format";
import { backdropUrl } from "@/utils/poster";

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
          {/* pôster */}
          <aside className="flex justify-center md:block">
            <div className="w-44 md:w-full">
              <Poster title={film.title} posterPath={film.posterPath} size="w500" sizes="230px" className="shadow-2xl shadow-black/60" />
            </div>
          </aside>

          {/* título, sinopse, elenco, ficha */}
          <section className="min-w-0 md:pt-10 lg:pt-16">
            {/* linha de contexto acima do título: ano e gêneros */}
            <p className="flex flex-wrap items-center gap-x-2 text-xs uppercase tracking-[0.14em] text-foreground/70">
              {[film.releaseYear, ...film.genres.slice(0, 3)].filter(Boolean).map((item, i) => (
                <span key={String(item)} className="flex items-center gap-2">
                  {i > 0 && <span className="w-1 h-1 rounded-full bg-brand-orange" />}
                  {item}
                </span>
              ))}
            </p>
            <h1 className="mt-3 font-serif text-4xl sm:text-5xl font-semibold leading-[1.05] tracking-tight">{film.title}</h1>
            {credits.data?.tagline && (
              <p className="mt-4 font-serif text-lg italic text-brand-slate">“{credits.data.tagline}”</p>
            )}

            {film.overview && (
              <p className="mt-6 text-base leading-[1.75] text-foreground/80 max-w-2xl">{film.overview}</p>
            )}

            <CastList cast={credits.data?.cast} />
            <FactSheet film={film} directors={directors} />

            <section className="mt-12">
              <SectionHeading title="Onde assistir" />
              {providers.data ? <WhereToWatch providers={providers.data} /> : <p className="text-sm text-brand-slate">Carregando…</p>}
            </section>
          </section>

          {/* painel de ações + nota do Nitrate */}
          <aside className="md:col-span-2 lg:col-span-1 lg:pt-16 grid sm:grid-cols-2 lg:grid-cols-1 gap-6 content-start">
            {status === "authenticated" && myState.data && (
              <ActionPanel
                film={film}
                review={myReview}
                timesWatched={timesWatched}
                inWatchlist={inWatchlist}
                watchlistBusy={watchlistBusy}
                onLog={() => setEditing("new")}
                onEdit={myReview ? () => setEditing("edit") : undefined}
                onToggleWatchlist={toggleWatchlist}
                onChanged={afterChange}
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

  const toggle = (active: boolean, activeColor: string) =>
    `flex items-center gap-3 w-full px-4 py-2.5 text-sm text-left transition-colors hover:bg-surface-strong disabled:opacity-50 ${active ? activeColor : "text-brand-slate"}`;

  return (
    <div className="rounded-md bg-surface overflow-hidden">
      <div className="p-5">
        <span className="text-xs uppercase tracking-[0.14em] text-brand-slate">Sua nota</span>
        <div className="mt-3">
          <RatingMeterInput value={review?.rating ?? null} onChange={(rating) => quickSave({ rating })} disabled={busy} />
        </div>
        {review?.watchedOn && (
          <p className="mt-4 flex items-center gap-1.5 text-xs text-brand-slate">
            {props.timesWatched > 1 && <ArrowsClockwiseIcon size={12} weight="bold" className="text-brand-emerald" />}
            {props.timesWatched > 1 ? `${props.timesWatched} sessões · última em ` : "Assistido em "}
            {shortDate(review.watchedOn)}
          </p>
        )}
      </div>

      <div className="border-t border-foreground/5 py-1">
        <button onClick={props.onLog} className={toggle(watched, "text-brand-emerald")}>
          <EyeIcon size={18} weight={watched ? "fill" : "regular"} />
          {watched ? "Já assisti" : "Marcar como assistido"}
        </button>
        <button
          onClick={() => (review ? quickSave({ liked: !liked }) : props.onLog())}
          disabled={busy}
          aria-pressed={liked}
          className={toggle(liked, "text-brand-orange")}
        >
          <HeartIcon size={18} weight={liked ? "fill" : "regular"} />
          {liked ? "Curti" : "Curtir"}
        </button>
        <button
          onClick={props.onToggleWatchlist}
          disabled={props.watchlistBusy}
          aria-pressed={props.inWatchlist}
          className={toggle(props.inWatchlist, "text-brand-blue")}
        >
          <BookmarkSimpleIcon size={18} weight={props.inWatchlist ? "fill" : "regular"} />
          {props.inWatchlist ? "Na watchlist" : "Quero assistir"}
        </button>
        <button onClick={() => setAddingToList(true)} className={toggle(false, "")}>
          <ListPlusIcon size={18} />
          Adicionar à lista
        </button>
      </div>
      <AddToListModal open={addingToList} movie={props.film} onClose={() => setAddingToList(false)} />

      <div className="border-t border-foreground/5 p-3 flex gap-2">
        <button
          onClick={props.onLog}
          className="flex-1 py-2 rounded-md bg-brand-btn text-brand-btn-text text-sm font-semibold hover:bg-brand-btn/90 transition-colors"
        >
          {watched ? "Nova sessão" : "Escrever review"}
        </button>
        {props.onEdit && (
          <button
            onClick={props.onEdit}
            className="px-3 py-2 rounded-md text-sm text-brand-slate hover:text-foreground hover:bg-surface-strong transition-colors"
          >
            Editar
          </button>
        )}
      </div>
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

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Header />
      <main>{children}</main>
    </div>
  );
}
