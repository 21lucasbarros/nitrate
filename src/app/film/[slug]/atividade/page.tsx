"use client";

import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeftIcon,
  ArrowsClockwiseIcon,
  BookmarkSimpleIcon,
  ChatCircleIcon,
  CircleNotchIcon,
  EyeIcon,
  HeartIcon,
  ListPlusIcon,
  NotePencilIcon,
} from "@phosphor-icons/react";

import Header from "@/app/components/header";
import { listHref } from "@/app/components/list-card";
import { ReviewCard, reviewHref } from "@/app/components/review-card";
import { Poster } from "@/app/components/ui/poster";
import { StarRating } from "@/app/components/ui/star-rating";
import { ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useFetch } from "@/lib/hooks/use-fetch";
import type { Activity } from "@/lib/services/friends-service";
import { getMovieBySlug, getMovieCredits } from "@/lib/services/movie-service";
import { getMyMovieActivity } from "@/lib/services/user-service";
import type { MovieReview } from "@/lib/types/review";
import type { Movie } from "@/types/movie";
import { shortDate } from "@/utils/format";
import { backdropUrl } from "@/utils/poster";
import { toRating } from "@/utils/rating";

const TABS = [
  { id: "atividade", label: "Atividade" },
  { id: "diario", label: "Diário" },
  { id: "reviews", label: "Reviews" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function FilmActivityPage() {
  // useSearchParams precisa de Suspense para o build estático do Next
  return (
    <div className="relative isolate min-h-screen bg-background text-foreground font-sans">
      <Header />
      <main>
        <Suspense fallback={<Loading />}>
          <FilmActivity />
        </Suspense>
      </main>
    </div>
  );
}

function FilmActivity() {
  const { slug } = useParams<{ slug: string }>();
  const { status } = useAuth();
  const movie = useFetch(slug, getMovieBySlug);

  if (status === "anonymous") {
    return (
      <Centered>
        <Link href={`/sign-in?redirect=${encodeURIComponent(`/film/${slug}/atividade`)}`} className="font-semibold text-foreground hover:text-brand-orange">
          Entre
        </Link>{" "}
        para ver a sua atividade com este filme.
      </Centered>
    );
  }
  if (movie.error instanceof ApiError && movie.error.status === 404) {
    return <Centered>Filme não encontrado.</Centered>;
  }
  if (!movie.data || status !== "authenticated") {
    return movie.error ? <Centered>Não foi possível carregar o filme.</Centered> : <Loading />;
  }
  return <ActivityView film={movie.data} />;
}

function ActivityView({ film }: { film: Movie }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const activity = useFetch(film.id, getMyMovieActivity);
  const credits = useFetch(film.id, getMovieCredits);

  const param = searchParams.get("tab");
  const tab: TabId = TABS.some((t) => t.id === param) ? (param as TabId) : "atividade";
  const selectTab = (id: TabId) => router.replace(id === "atividade" ? pathname : `${pathname}?tab=${id}`, { scroll: false });

  const items = activity.data ?? [];
  // os registros, do dia assistido mais recente para o mais antigo
  const sessions = items
    .filter((item) => item.type === "REVIEW" && item.review)
    .map((item) => item.review!)
    .toSorted((a, b) => b.watchedOn.localeCompare(a.watchedOn) || b.createdAt.localeCompare(a.createdAt));
  const withText = sessions.filter((review) => review.text);
  const counts: Record<TabId, number | undefined> = activity.data
    ? { atividade: items.length, diario: sessions.length, reviews: withText.length }
    : { atividade: undefined, diario: undefined, reviews: undefined };

  const backdrop = backdropUrl(credits.data?.backdropPath);
  const filmUrl = `/film/${film.slug}`;

  return (
    <>
      {/* a cena do filme no canto, desbotando para a página, como no topo da página do filme */}
      {backdrop && (
        <div className="hidden md:block absolute -z-10 top-0 right-0 w-[62%] h-[380px] pointer-events-none">
          <Image src={backdrop} alt="" fill priority sizes="62vw" className="object-cover object-[center_30%] opacity-70" />
          <div className="absolute inset-0 bg-linear-to-r from-background via-background/40 to-transparent" />
          <div className="absolute inset-0 bg-linear-to-t from-background via-background/30 to-background/60" />
        </div>
      )}

      <div className="max-w-[1100px] mx-auto px-6 pt-28 sm:pt-36 pb-24">
        <Link href={filmUrl} className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-brand-slate hover:text-foreground transition-colors">
          <ArrowLeftIcon size={12} weight="bold" /> Sua atividade com
        </Link>
        <h1 className="mt-2 font-serif text-3xl sm:text-4xl font-semibold leading-tight tracking-tight">
          <Link href={filmUrl} className="hover:text-brand-orange transition-colors">{film.title}</Link>
          {film.releaseYear && <span className="ml-3 font-sans text-xl sm:text-2xl font-light text-foreground/50">{film.releaseYear}</span>}
        </h1>

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div className="min-w-0">
            <div
              role="tablist"
              aria-label="Sua atividade com o filme"
              className="flex gap-6 overflow-x-auto [scrollbar-width:none] shadow-[inset_0_-1px_0_rgb(236_237_238/0.1)]"
            >
              {TABS.map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => selectTab(t.id)}
                  className={`shrink-0 pb-3 text-sm border-b-2 transition-colors ${tab === t.id ? "border-brand-orange text-foreground" : "border-transparent text-brand-slate hover:text-foreground"}`}
                >
                  {t.label}
                  {counts[t.id] !== undefined && <span className="ml-1.5 text-xs text-brand-slate/60">{counts[t.id]}</span>}
                </button>
              ))}
            </div>

            <section role="tabpanel" className="pt-6">
              {!activity.data ? (
                activity.error ? (
                  <p className="py-16 text-center text-sm text-brand-slate">Não foi possível carregar a sua atividade.</p>
                ) : (
                  <div className="py-16 flex justify-center text-brand-slate/40"><CircleNotchIcon size={26} className="animate-spin" /></div>
                )
              ) : tab === "atividade" ? (
                <Timeline items={items} />
              ) : tab === "diario" ? (
                <Diary sessions={sessions} />
              ) : withText.length > 0 ? (
                <div className="divide-y divide-foreground/10 -mt-6">
                  {withText.map((review) => (
                    <ReviewCard key={review.id} review={review} hideMovie hideUser excerpt />
                  ))}
                </div>
              ) : (
                <Empty>Você ainda não escreveu uma review deste filme.</Empty>
              )}
            </section>
          </div>

          <Summary film={film} items={items} sessions={sessions} loaded={Boolean(activity.data)} />
        </div>
      </div>
    </>
  );
}

/** lateral: o pôster e o resumo da relação com o filme */
function Summary({ film, items, sessions, loaded }: { film: Movie; items: Activity[]; sessions: MovieReview[]; loaded: boolean }) {
  const watchlist = items.find((item) => item.type === "WATCHLIST");
  const lists = items.filter((item) => item.type === "LIST_ENTRY");
  const latestRating = sessions.find((s) => s.rating !== null)?.rating ?? null;
  const first = sessions.at(-1);
  const liked = sessions[0]?.liked ?? false;

  const facts: { icon: React.ReactNode; label: React.ReactNode }[] = [];
  if (sessions.length > 0) {
    facts.push({
      icon: <EyeIcon size={16} weight="fill" className="text-brand-emerald" />,
      label: <>{sessions.length} {sessions.length === 1 ? "sessão" : "sessões"}{first && <span className="text-brand-slate"> · desde {shortDate(first.watchedOn)}</span>}</>,
    });
  }
  if (liked) facts.push({ icon: <HeartIcon size={16} weight="fill" className="text-brand-orange" />, label: "Você curtiu" });
  if (watchlist) {
    facts.push({
      icon: <BookmarkSimpleIcon size={16} weight="fill" className="text-brand-blue" />,
      label: <>Na watchlist <span className="text-brand-slate">desde {shortDate(watchlist.at.slice(0, 10))}</span></>,
    });
  }
  if (lists.length > 0) {
    facts.push({
      icon: <ListPlusIcon size={16} className="text-brand-slate" />,
      label: `Em ${lists.length} ${lists.length === 1 ? "lista" : "listas"}`,
    });
  }

  return (
    <aside className="order-first lg:order-none">
      <div className="lg:sticky lg:top-24 flex lg:flex-col gap-5">
        <Link href={`/film/${film.slug}`} className="w-24 sm:w-32 lg:w-full shrink-0">
          <Poster title={film.title} posterPath={film.posterPath} size="w342" sizes="(min-width: 1024px) 240px, 128px" className="shadow-2xl shadow-black/50" />
        </Link>
        {loaded && (
          <div className="min-w-0 flex-1">
            {latestRating !== null && (
              <div className="mb-4">
                <span className="text-[11px] uppercase tracking-[0.14em] text-brand-slate">Sua nota</span>
                <div className="mt-1.5"><StarRating rating={toRating(latestRating)} size={18} /></div>
              </div>
            )}
            {facts.length > 0 ? (
              <ul className="flex flex-col gap-2.5 text-sm">
                {facts.map((fact, i) => (
                  <li key={i} className="flex items-center gap-2.5">
                    <span className="shrink-0">{fact.icon}</span>
                    <span className="min-w-0">{fact.label}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-brand-slate">Você ainda não fez nada com este filme.</p>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

const TYPE_STYLE: Record<Activity["type"], { icon: typeof EyeIcon; className: string }> = {
  REVIEW: { icon: EyeIcon, className: "text-brand-emerald bg-brand-emerald/10" },
  WATCHLIST: { icon: BookmarkSimpleIcon, className: "text-brand-blue bg-brand-blue/10" },
  LIST: { icon: ListPlusIcon, className: "text-brand-slate bg-foreground/5" },
  LIST_ENTRY: { icon: ListPlusIcon, className: "text-foreground/80 bg-foreground/5" },
  REVIEW_LIKE: { icon: HeartIcon, className: "text-brand-orange bg-brand-orange/10" },
  COMMENT: { icon: ChatCircleIcon, className: "text-foreground/80 bg-foreground/5" },
  FOLLOW: { icon: EyeIcon, className: "text-brand-slate bg-foreground/5" },
};

/** linha do tempo agrupada por ano: um ícone por tipo, ligado pela linha vertical */
function Timeline({ items }: { items: Activity[] }) {
  if (items.length === 0) return <Empty>Nenhuma atividade com este filme ainda.</Empty>;

  const years = groupBy(items, (item) => item.at.slice(0, 4));
  return (
    <div className="flex flex-col gap-8">
      {years.map(([year, group]) => (
        <section key={year}>
          <h2 className="mb-2 text-xs font-medium tracking-[0.14em] text-brand-slate/70 tabular-nums">{year}</h2>
          <ol>
            {group.map((item, i) => {
              const { icon: Icon, className } = TYPE_STYLE[item.type];
              const last = i === group.length - 1;
              return (
                <li key={item.id} className="relative flex gap-4">
                  {!last && <span aria-hidden="true" className="absolute left-[17px] top-10 bottom-0 w-px bg-foreground/10" />}
                  <span className={`relative z-10 mt-2 w-9 h-9 shrink-0 rounded-full flex items-center justify-center ${className}`}>
                    <Icon size={17} weight="fill" />
                  </span>
                  <div className={`min-w-0 flex-1 pt-3.5 ${last ? "" : "pb-6"}`}>
                    <TimelineEntry item={item} />
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}

function TimelineEntry({ item }: { item: Activity }) {
  const when = (
    <time dateTime={item.at} title={new Date(item.at).toLocaleString("pt-BR")} className="shrink-0 text-xs text-brand-slate/70 tabular-nums">
      {new Date(item.at).toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
    </time>
  );
  const line = (content: React.ReactNode) => (
    <div className="flex items-baseline justify-between gap-4">
      <div className="text-sm leading-relaxed text-brand-slate">{content}</div>
      {when}
    </div>
  );

  switch (item.type) {
    case "REVIEW": {
      const r = item.review!;
      return (
        <>
          {line(
            <>
              <span className="text-foreground">{sessionVerbs(r)}</span>
              {r.rating !== null && <span className="inline-flex align-[-1px] ml-1.5"><StarRating rating={toRating(r.rating)} size={11} /></span>}
              {r.watchedOn !== item.at.slice(0, 10) && <> · assistido em {shortDate(r.watchedOn)}</>}
            </>,
          )}
          {r.text && (
            <Link
              href={reviewHref(r)}
              className="group mt-2.5 block rounded-md bg-surface/60 px-4 py-3 hover:bg-surface transition-colors"
            >
              {r.spoiler && <span className="block mb-1 text-[11px] font-bold uppercase tracking-[0.15em] text-brand-crimson">Spoiler</span>}
              <span className="font-serif text-[15px] leading-relaxed text-foreground/80 line-clamp-3">{r.text}</span>
              <span className="mt-2 flex items-center gap-4 text-xs text-brand-slate">
                <span className="flex items-center gap-1">
                  <HeartIcon size={13} weight={item.likesCount ? "fill" : "regular"} className={item.likesCount ? "text-brand-orange" : ""} />
                  {item.likesCount ?? 0} {item.likesCount === 1 ? "curtida" : "curtidas"}
                </span>
                <span className="group-hover:text-foreground">Abrir review</span>
              </span>
            </Link>
          )}
          {!r.text && (
            <Link href={reviewHref(r)} className="mt-1 inline-block text-xs text-brand-slate hover:text-foreground">Ver registro</Link>
          )}
        </>
      );
    }
    case "WATCHLIST":
      return line(<><span className="text-foreground">Colocou na watchlist</span></>);
    case "LIST_ENTRY":
      return line(
        <>
          Adicionou à lista{" "}
          <Link href={listHref(item.list!)} className="text-foreground hover:text-brand-orange">{item.list!.name}</Link>
          {!item.list!.isPublic && <span className="text-brand-slate/70"> · privada</span>}
        </>,
      );
    case "REVIEW_LIKE": {
      const r = item.review!;
      return line(
        <>
          Curtiu a{" "}
          <Link href={reviewHref(r)} className="text-foreground hover:text-brand-orange">review de {r.user.name}</Link>
          {r.rating !== null && <span className="inline-flex align-[-1px] ml-1.5"><StarRating rating={toRating(r.rating)} size={11} /></span>}
        </>,
      );
    }
    case "COMMENT": {
      const r = item.review!;
      return (
        <>
          {line(
            <>
              Comentou na{" "}
              <Link href={`${reviewHref(r)}#comentarios`} className="text-foreground hover:text-brand-orange">
                {r.user.username === item.user.username ? "sua review" : `review de ${r.user.name}`}
              </Link>
            </>,
          )}
          {item.comment && <p className="mt-1 text-sm italic text-foreground/70 line-clamp-2">“{item.comment}”</p>}
        </>
      );
    }
    default:
      return null;
  }
}

/** "Assistiu", "Reassistiu, curtiu e avaliou", "Assistiu e escreveu uma review"... */
function sessionVerbs(review: MovieReview): string {
  const verbs = [review.rewatch ? "Reassistiu" : "Assistiu"];
  if (review.liked) verbs.push("curtiu");
  if (review.text) verbs.push("escreveu uma review");
  else if (review.rating !== null) verbs.push("avaliou");
  return verbs.length === 1 ? verbs[0] : `${verbs.slice(0, -1).join(", ")} e ${verbs[verbs.length - 1]}`;
}

/** diário: uma linha por sessão, agrupadas por mês, com o dia em destaque */
function Diary({ sessions }: { sessions: MovieReview[] }) {
  if (sessions.length === 0) return <Empty>Você ainda não registrou este filme.</Empty>;

  const months = groupBy(sessions, (s) => s.watchedOn.slice(0, 7));
  return (
    <div className="flex flex-col gap-6">
      {months.map(([month, group]) => {
        const [year, m] = month.split("-").map(Number);
        const label = new Date(year, m - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
        return (
          <section key={month}>
            <h2 className="mb-1 text-xs font-medium uppercase tracking-[0.14em] text-brand-slate/70">{label}</h2>
            <ul className="divide-y divide-foreground/5">
              {group.map((s) => {
                const [y, mo, d] = s.watchedOn.split("-").map(Number);
                const weekday = new Date(y, mo - 1, d).toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
                return (
                  <li key={s.id}>
                    <Link href={reviewHref(s)} className="group flex items-center gap-4 -mx-3 px-3 py-3 rounded-md hover:bg-surface transition-colors">
                      <span className="w-10 shrink-0 text-center">
                        <span className="block text-2xl font-light leading-none tabular-nums">{d}</span>
                        <span className="block mt-1 text-[10px] uppercase tracking-[0.12em] text-brand-slate">{weekday}</span>
                      </span>
                      <span className="flex-1 min-w-0 flex items-center gap-3">
                        {s.rating !== null ? <StarRating rating={toRating(s.rating)} size={14} /> : <span className="text-xs text-brand-slate/60">sem nota</span>}
                        {s.liked && <HeartIcon size={14} weight="fill" className="text-brand-orange" aria-label="Curtiu" />}
                        {s.rewatch && <ArrowsClockwiseIcon size={14} weight="bold" className="text-brand-emerald" aria-label="Reassistiu" />}
                        {s.text && <NotePencilIcon size={14} className="text-brand-slate" aria-label="Com review" />}
                      </span>
                      <span className="text-xs text-brand-slate opacity-0 group-hover:opacity-100 transition-opacity">
                        {s.text ? "Ler review" : "Ver registro"}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

/** agrupa mantendo a ordem em que os grupos aparecem */
function groupBy<T>(list: T[], key: (item: T) => string): [string, T[]][] {
  const groups = new Map<string, T[]>();
  for (const item of list) {
    const k = key(item);
    groups.set(k, [...(groups.get(k) ?? []), item]);
  }
  return [...groups];
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-16 text-center text-brand-slate">{children}</p>;
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="pt-48 pb-24 px-6 text-center text-brand-slate">{children}</div>;
}

function Loading() {
  return (
    <div className="pt-48 pb-24 flex justify-center text-brand-slate/40">
      <CircleNotchIcon size={32} className="animate-spin" />
    </div>
  );
}
