"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  CaretLeftIcon,
  CaretRightIcon,
  CircleNotchIcon,
  HeartIcon,
  InstagramLogoIcon,
} from "@phosphor-icons/react";

import Header from "@/app/components/header";
import { Poster } from "@/app/components/ui/poster";
import { StarRating } from "@/app/components/ui/star-rating";
import { ApiError } from "@/lib/api-client";
import { getToken } from "@/lib/auth-storage";
import { useFetch } from "@/lib/hooks/use-fetch";
import { getMyRetrospective, getMyRetrospectiveMonths } from "@/lib/services/retrospective-service";
import { PrivateNotice, useOwnerAccess } from "../retrospective-access";
import type { RankedItem, Retrospective, RetrospectiveFilm } from "@/lib/types/retrospective";
import { monthLabel } from "@/utils/format";
import { posterUrl } from "@/utils/poster";
import { toRating } from "@/utils/rating";

const fetchMonths = () => getMyRetrospectiveMonths();

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export default function RetrospectivePage() {
  const { username, month } = useParams<{ username: string; month: string }>();
  const validMonth = MONTH_PATTERN.test(month);
  const access = useOwnerAccess(username);

  // a retrospectiva é exclusiva do dono: só busca quando é a própria pessoa
  const retro = useFetch(access === "owner" && validMonth ? month : null, getMyRetrospective);
  const months = useFetch(access === "owner" ? "months" : null, fetchMonths);

  const notFound = !validMonth || (retro.error instanceof ApiError && retro.error.status === 404);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Header />
      {access === "other" ? (
        <PrivateNotice username={username} />
      ) : access !== "owner" ? (
        <Centered>
          <CircleNotchIcon size={32} className="animate-spin text-brand-slate/40" />
        </Centered>
      ) : notFound ? (
        <Centered>
          <h1 className="text-3xl font-medium tracking-tight">Retrospectiva não encontrada.</h1>
          <Link href={`/u/${username}`} className="mt-6 text-brand-blue hover:underline">Voltar ao perfil</Link>
        </Centered>
      ) : !retro.data ? (
        <Centered>
          {retro.error ? (
            <p className="text-brand-slate/60">Não foi possível carregar a retrospectiva.</p>
          ) : (
            <CircleNotchIcon size={32} className="animate-spin text-brand-slate/40" />
          )}
        </Centered>
      ) : (
        <Dossier retro={retro.data} months={months.data ?? []} />
      )}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <main className="pt-48 pb-24 px-6 flex flex-col items-center text-center">{children}</main>;
}

function Dossier({ retro, months }: { retro: Retrospective; months: string[] }) {
  const [monthName, year] = monthLabel(retro.month).split(" de ");
  const firstName = retro.name.split(" ")[0];

  // meses vêm do mais recente para o mais antigo
  const index = months.indexOf(retro.month);
  const newer = index > 0 ? months[index - 1] : null;
  const older = index >= 0 && index < months.length - 1 ? months[index + 1] : null;

  return (
    <main>
      {/* capa */}
      <section className="relative overflow-hidden bg-brand-charcoal text-background pt-36 sm:pt-40 pb-16 sm:pb-20 px-6 md:px-12 xl:px-24">
        <PosterMosaic films={retro.films} />
        <div className="relative max-w-[1400px] mx-auto">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-bold tracking-[0.25em] uppercase text-brand-orange">
              Retrospectiva · Nitrate
            </span>
            <MonthNav username={retro.username} newer={newer} older={older} />
          </div>

          <h1 className="mt-6 text-6xl sm:text-8xl md:text-9xl font-semibold tracking-tighter leading-[0.85] capitalize">
            {monthName}
            <span className="block italic font-light text-background/50 text-4xl sm:text-6xl md:text-7xl mt-2 normal-case">
              de {year}
            </span>
          </h1>

          <div className="mt-12 flex flex-col sm:flex-row sm:items-end justify-between gap-8">
            <p className="text-lg sm:text-xl text-background/70 font-light max-w-md">
              O mês de{" "}
              <Link href={`/u/${retro.username}`} className="font-medium text-background hover:text-brand-orange transition-colors">
                {firstName}
              </Link>{" "}
              no cinema.
            </p>
            <div className="flex items-end gap-4">
              <span className="text-8xl sm:text-9xl font-semibold tracking-tighter leading-none text-brand-orange">
                {retro.filmsCount}
              </span>
              <span className="pb-3 text-sm uppercase tracking-[0.2em] text-background/60 leading-tight">
                {retro.filmsCount === 1 ? "filme" : "filmes"}
                <br />
                assistidos
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-6 md:px-12 xl:px-24 pb-24">
        {retro.filmsCount === 0 ? (
          <div className="py-24 text-center text-brand-slate/60">
            <p className="text-lg">Nenhum filme registrado em {monthLabel(retro.month)}.</p>
            <Link href="/movies" className="inline-block mt-4 font-medium text-brand-blue hover:underline">
              Explorar filmes
            </Link>
          </div>
        ) : (
          <>
            <StatsStrip retro={retro} />
            {retro.favorites.length > 0 && <Favorites films={retro.favorites} />}

            <div className="grid lg:grid-cols-2 gap-x-16 gap-y-20 pt-20">
              {retro.topDirectors.length > 0 && (
                <RankedBars eyebrow="Atrás das câmeras" title="Diretores em destaque" items={retro.topDirectors} unit="filme" />
              )}
              {retro.topGenres.length > 0 && (
                <RankedBars
                  eyebrow="Seu humor do mês"
                  title="Gêneros mais frequentes"
                  items={retro.topGenres}
                  unit="filme"
                  total={retro.filmsCount}
                />
              )}
            </div>

            {retro.topActors.length > 0 && <Actors items={retro.topActors} />}
            {retro.averageRating !== null && <RatingChart distribution={retro.ratingDistribution} />}
            <MonthWall films={retro.films} />
          </>
        )}

        <ShareFooter retro={retro} />
      </div>
    </main>
  );
}

/** fundo da capa: pôsteres do mês, apagados, em grade */
function PosterMosaic({ films }: { films: RetrospectiveFilm[] }) {
  const posters = films.map((f) => posterUrl(f.movie.posterPath, "w185")).filter((src): src is string => !!src);
  if (posters.length === 0) return null;
  // repete os pôsteres para preencher a grade mesmo em meses com poucos filmes
  const tiles = Array.from({ length: 24 }, (_, i) => posters[i % posters.length]);
  return (
    <div aria-hidden="true" className="absolute inset-0">
      <div className="grid grid-cols-6 sm:grid-cols-8 gap-1 -rotate-6 scale-125 opacity-25 grayscale">
        {tiles.map((src, i) => (
          <div key={i} className="relative aspect-2/3">
            <Image src={src} alt="" fill sizes="120px" className="object-cover" />
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-linear-to-t from-brand-charcoal via-brand-charcoal/85 to-brand-charcoal/60" />
    </div>
  );
}

function MonthNav({ username, newer, older }: { username: string; newer: string | null; older: string | null }) {
  const base = "p-2 rounded-full border border-background/20 transition-colors";
  return (
    <nav aria-label="Outros meses" className="flex gap-2">
      {older ? (
        <Link href={`/u/${username}/retrospectiva/${older}`} className={`${base} hover:border-brand-orange hover:text-brand-orange`} aria-label={`Retrospectiva de ${monthLabel(older)}`}>
          <CaretLeftIcon size={18} />
        </Link>
      ) : (
        <span className={`${base} opacity-30`} aria-hidden="true"><CaretLeftIcon size={18} /></span>
      )}
      {newer ? (
        <Link href={`/u/${username}/retrospectiva/${newer}`} className={`${base} hover:border-brand-orange hover:text-brand-orange`} aria-label={`Retrospectiva de ${monthLabel(newer)}`}>
          <CaretRightIcon size={18} />
        </Link>
      ) : (
        <span className={`${base} opacity-30`} aria-hidden="true"><CaretRightIcon size={18} /></span>
      )}
    </nav>
  );
}

function StatsStrip({ retro }: { retro: Retrospective }) {
  const stats: [string, React.ReactNode][] = [
    ["Filmes", retro.filmsCount],
    ["Reviews escritas", retro.reviewsCount],
    ["Curtidos", retro.likesCount],
    ["Nota média", retro.averageRating !== null ? retro.averageRating.toLocaleString("pt-BR") : "—"],
  ];
  return (
    <dl className="grid grid-cols-2 md:grid-cols-4 border-b border-foreground/10">
      {stats.map(([label, value]) => (
        <div key={label} className="flex flex-col-reverse py-10 md:px-6 md:first:pl-0 md:border-l md:first:border-l-0 border-foreground/10">
          <dt className="text-xs uppercase tracking-[0.15em] text-brand-slate/60 mt-2">{label}</dt>
          <dd className="text-4xl sm:text-5xl font-semibold tracking-tight">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-8">
      <span className="text-xs font-bold tracking-[0.2em] uppercase text-brand-orange">{eyebrow}</span>
      <h2 className="text-2xl sm:text-3xl font-medium tracking-tight mt-2">{title}</h2>
    </div>
  );
}

/** pódio: o favorito maior, os outros ao lado */
function Favorites({ films }: { films: RetrospectiveFilm[] }) {
  const [first, ...rest] = films;
  return (
    <section className="pt-20">
      <SectionTitle eyebrow="Pelas suas notas" title="Suas obras favoritas" />
      <div className="flex flex-col md:flex-row gap-8 md:gap-10">
        <FavoriteCard film={first} rank={1} large />
        {rest.length > 0 && (
          <ol className="grid grid-cols-2 sm:grid-cols-4 gap-5 flex-1 content-start">
            {rest.map((film, i) => (
              <li key={film.movie.id}>
                <FavoriteCard film={film} rank={i + 2} />
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

function FavoriteCard({ film, rank, large = false }: { film: RetrospectiveFilm; rank: number; large?: boolean }) {
  return (
    <Link href={`/movies/${film.movie.id}`} className={`group block ${large ? "w-56 sm:w-64 shrink-0" : ""}`}>
      <div className="relative">
        <Poster
          title={film.movie.title}
          posterPath={film.movie.posterPath}
          size={large ? "w500" : "w342"}
          sizes={large ? "256px" : "180px"}
          className="group-hover:ring-brand-orange/50 transition-all"
        />
        <span
          className={`absolute -top-3 -left-3 flex items-center justify-center rounded-full bg-brand-orange text-white font-semibold shadow-lg ${large ? "w-12 h-12 text-xl" : "w-8 h-8 text-sm"}`}
        >
          {rank}
        </span>
      </div>
      <p className={`mt-3 font-medium leading-tight group-hover:text-brand-blue transition-colors ${large ? "text-lg" : "text-sm"}`}>
        {film.movie.title}
      </p>
      <div className="flex items-center gap-1.5 mt-1.5">
        {film.rating !== null && <StarRating rating={toRating(film.rating)} size={large ? 16 : 12} />}
        {film.liked && <HeartIcon size={large ? 15 : 12} weight="fill" className="text-brand-orange" />}
      </div>
    </Link>
  );
}

/** ranking com barras proporcionais; com `total`, mostra também a porcentagem */
function RankedBars({ eyebrow, title, items, unit, total }: {
  eyebrow: string;
  title: string;
  items: RankedItem[];
  unit: string;
  total?: number;
}) {
  const max = Math.max(...items.map((i) => i.count));
  return (
    <section>
      <SectionTitle eyebrow={eyebrow} title={title} />
      <ol className="flex flex-col gap-5">
        {items.map((item, i) => (
          <li key={item.name}>
            <div className="flex items-baseline justify-between gap-4">
              <span className="flex items-baseline gap-3 min-w-0">
                <span className="font-mono text-xs text-brand-slate/40 w-5">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-medium truncate">{item.name}</span>
              </span>
              <span className="text-sm text-brand-slate/60 shrink-0">
                {total ? `${Math.round((item.count / total) * 100)}%` : `${item.count} ${unit}${item.count > 1 ? "s" : ""}`}
              </span>
            </div>
            <div className="mt-2 ml-8 h-1.5 rounded-full bg-foreground/5 overflow-hidden">
              <div
                className={`h-full rounded-full ${i === 0 ? "bg-brand-orange" : "bg-brand-slate/40"}`}
                style={{ width: `${(item.count / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Actors({ items }: { items: RankedItem[] }) {
  return (
    <section className="pt-20">
      <SectionTitle eyebrow="Rostos de sempre" title="Atores recorrentes" />
      <ul className="flex flex-wrap gap-3">
        {items.map((actor) => (
          <li
            key={actor.name}
            className="flex items-center gap-3 pl-5 pr-2 py-2 rounded-full border border-foreground/10 bg-white"
          >
            <span className="font-medium">{actor.name}</span>
            <span className="px-2.5 py-1 rounded-full bg-brand-orange/10 text-brand-orange text-xs font-semibold">
              {actor.count} filmes
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

const RATING_STEPS = ["0.5", "1.0", "1.5", "2.0", "2.5", "3.0", "3.5", "4.0", "4.5", "5.0"];

function RatingChart({ distribution }: { distribution: Record<string, number> }) {
  const max = Math.max(1, ...RATING_STEPS.map((k) => distribution[k] ?? 0));
  return (
    <section className="pt-20">
      <SectionTitle eyebrow="Como você avaliou" title="Distribuição das notas" />
      <div className="flex items-end gap-2 sm:gap-3 h-44">
        {RATING_STEPS.map((step) => {
          const count = distribution[step] ?? 0;
          return (
            <div key={step} className="flex-1 flex flex-col items-center justify-end h-full gap-2">
              {count > 0 && <span className="text-xs font-mono text-brand-slate/60">{count}</span>}
              <div
                className={`w-full rounded-t-md ${count > 0 ? "bg-brand-orange" : "bg-foreground/5"}`}
                style={{ height: count > 0 ? `${(count / max) * 100}%` : "4px" }}
              />
              <span className="text-[11px] font-mono text-brand-slate/50">
                {Number(step).toLocaleString("pt-BR")}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function MonthWall({ films }: { films: RetrospectiveFilm[] }) {
  return (
    <section className="pt-20">
      <SectionTitle eyebrow="Diário" title="O mês inteiro" />
      <ol className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-4">
        {films.map((film) => (
          <li key={`${film.movie.id}-${film.watchedOn}`}>
            <Link href={`/movies/${film.movie.id}`} className="group block" title={film.movie.title}>
              <div className="relative">
                <Poster
                  title={film.movie.title}
                  posterPath={film.movie.posterPath}
                  size="w185"
                  sizes="150px"
                  className="group-hover:ring-brand-orange/50 transition-all"
                />
                <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-brand-charcoal/80 text-background text-[11px] font-mono">
                  {film.watchedOn.slice(8, 10)}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ShareFooter({ retro }: { retro: Retrospective }) {
  const story = useStoryImage(retro);
  const [saved, setSaved] = useState(false);
  const fileName = `nitrate-retrospectiva-${retro.month}.png`;

  const shareStory = async () => {
    const file = story.file ?? (await story.load());
    if (!file) return;
    // celular: folha de compartilhar com a imagem anexada (Instagram -> Stories)
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
      } catch {
        // usuário cancelou: nada a fazer
      }
      return;
    }
    // computador: baixa a imagem
    const link = document.createElement("a");
    link.href = URL.createObjectURL(file);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
    setSaved(true);
  };

  return (
    <section className="mt-24 rounded-2xl bg-brand-charcoal text-background p-8 sm:p-12 flex flex-col md:flex-row md:items-center gap-10">
      {/* prévia do story */}
      <div className="w-40 sm:w-48 shrink-0 aspect-9/16 rounded-xl overflow-hidden ring-1 ring-background/10 bg-background/5 relative self-center">
        {story.previewUrl ? (
          <Image src={story.previewUrl} alt="Prévia da imagem para os Stories" fill unoptimized className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-background/30">
            <CircleNotchIcon size={24} className="animate-spin" />
          </div>
        )}
      </div>

      <div className="flex-1">
        <span className="text-xs font-bold tracking-[0.2em] uppercase text-brand-orange">Compartilhe</span>
        <h2 className="mt-2 text-2xl sm:text-3xl font-medium tracking-tight">Celebre a sua jornada.</h2>
        <p className="mt-2 text-background/60 font-light max-w-md">
          A retrospectiva é só sua; o que você compartilha é a imagem. No celular, escolha{" "}
          <strong className="font-medium text-background/80">Instagram → Stories</strong> na hora de compartilhar.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            onClick={shareStory}
            disabled={story.failed}
            className="flex items-center justify-center gap-2 bg-brand-orange text-white px-7 py-3.5 rounded-full font-semibold hover:bg-brand-orange/90 transition-colors disabled:opacity-50"
          >
            <InstagramLogoIcon size={20} weight="bold" />
            Compartilhar nos Stories
          </button>
        </div>

        {saved && (
          <p className="mt-4 text-sm text-background/70">
            Imagem salva. Envie para o celular e poste nos seus Stories.
          </p>
        )}
        {story.failed && (
          <p className="mt-4 text-sm text-red-300">Não foi possível gerar a imagem agora.</p>
        )}
      </div>
    </section>
  );
}

interface StoryImage {
  url: string;
  file: File | null;
  previewUrl: string | null;
  failed: boolean;
}

async function fetchStoryImage(url: string, month: string): Promise<StoryImage> {
  try {
    const token = getToken();
    const response = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!response.ok) throw new Error(String(response.status));
    const blob = await response.blob();
    const file = new File([blob], `nitrate-retrospectiva-${month}.png`, { type: "image/png" });
    return { url, file, previewUrl: URL.createObjectURL(blob), failed: false };
  } catch {
    return { url, file: null, previewUrl: null, failed: true };
  }
}

/**
 * Pré-carrega a imagem do story assim que a página abre. O iOS só deixa abrir o
 * compartilhamento logo após o toque, então o arquivo precisa estar pronto antes.
 */
function useStoryImage(retro: Retrospective) {
  const url = `/u/${retro.username}/retrospectiva/${retro.month}/story`;
  const [state, setState] = useState<StoryImage | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchStoryImage(url, retro.month).then((image) => {
      if (!cancelled) setState(image);
    });
    return () => {
      cancelled = true;
    };
  }, [url, retro.month]);

  // libera a URL da prévia quando ela é trocada ou a página sai
  useEffect(() => {
    const preview = state?.previewUrl;
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [state?.previewUrl]);

  // se tocarem em compartilhar antes do pré-carregamento terminar
  const load = useCallback(async () => {
    const image = await fetchStoryImage(url, retro.month);
    setState(image);
    return image.file;
  }, [url, retro.month]);

  const current = state?.url === url ? state : null;
  return {
    file: current?.file ?? null,
    previewUrl: current?.previewUrl ?? null,
    failed: current?.failed ?? false,
    load,
  };
}
