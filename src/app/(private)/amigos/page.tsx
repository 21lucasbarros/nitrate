"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CircleNotchIcon, MagnifyingGlassIcon, UsersThreeIcon } from "@phosphor-icons/react";

import Header from "@/app/components/header";
import { ActivityPoster } from "@/app/components/activity-poster";
import { ListCard } from "@/app/components/list-card";
import { SimilarUsers } from "@/app/components/similar-users";
import { UserList } from "@/app/components/user-list";
import { Avatar } from "@/app/components/ui/avatar";
import { Pagination } from "@/app/components/ui/pagination";
import { Poster } from "@/app/components/ui/poster";
import { SectionHeading } from "@/app/components/ui/section-heading";
import { useAuth } from "@/lib/auth-context";
import { useFetch } from "@/lib/hooks/use-fetch";
import {
  getFriendsActivity,
  getFriendsLists,
  getFriendsWatchlist,
  type FriendWatchlistItem,
} from "@/lib/services/friends-service";
import { getFollowing, getSimilarUsers } from "@/lib/services/user-service";
import type { SimilarUser } from "@/lib/types/user";
import type { Movie } from "@/types/movie";
import { timeAgo } from "@/utils/format";
import { filmHref } from "@/utils/movie-link";

const TABS = [
  { id: "assistiram", label: "Assistiram" },
  { id: "listas", label: "Listas" },
  { id: "watchlists", label: "Watchlists" },
  { id: "pessoas", label: "Pessoas" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const ACTIVITY_PER_PAGE = 24; // 4 linhas de 6
const IN_COMMON_MIN = 2; // a partir de quantos amigos um filme entra em "vários amigos querem ver"

const fetchActivity = (page: number) => getFriendsActivity(page - 1, ACTIVITY_PER_PAGE);
const fetchLists = () => getFriendsLists();
const fetchWatchlist = () => getFriendsWatchlist();
const fetchSimilar = () => getSimilarUsers();

export default function FriendsPage() {
  // useSearchParams precisa de Suspense para o build estático do Next
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Header />
      <main className="pt-28 sm:pt-32 pb-24 px-6 max-w-[1100px] mx-auto">
        <Suspense fallback={<Loading />}>
          <Friends />
        </Suspense>
      </main>
    </div>
  );
}

function Friends() {
  const { status, user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const rawTab = searchParams.get("tab") ?? "";
  const tab: TabId = TABS.some((t) => t.id === rawTab) ? (rawTab as TabId) : "assistiram";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const followsSomeone = status === "authenticated" && user.followingCount > 0;
  const activity = useFetch(followsSomeone && tab === "assistiram" ? page : null, fetchActivity);
  const lists = useFetch(followsSomeone && tab === "listas" ? "listas" : null, fetchLists);
  const watchlist = useFetch(followsSomeone && tab === "watchlists" ? "watchlists" : null, fetchWatchlist);
  const following = useFetch(status === "authenticated" && tab === "pessoas" ? user.username : null, getFollowing);
  const similar = useFetch(status === "authenticated" && (tab === "pessoas" || !followsSomeone) ? "parecidos" : null, fetchSimilar);

  if (status !== "authenticated") return <Loading />;

  const navigate = (id: TabId, newPage: number, mode: "push" | "replace") => {
    const params = new URLSearchParams();
    if (id !== "assistiram") params.set("tab", id);
    if (newPage > 1) params.set("page", String(newPage));
    const qs = params.toString();
    router[mode](qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <>
      <span className="text-xs font-bold tracking-[0.2em] uppercase text-brand-orange">Sua rede</span>
      <h1 className="mt-2 text-4xl sm:text-5xl font-medium tracking-tight">Amigos.</h1>
      <p className="mt-2 text-brand-slate">
        {followsSomeone
          ? `O que as ${user.followingCount === 1 ? "pessoa que você segue anda" : `${user.followingCount} pessoas que você segue andam`} assistindo, listando e guardando para depois.`
          : "Siga pessoas para acompanhar aqui o que elas assistem, listam e querem ver."}
      </p>

      {!followsSomeone ? (
        <EmptyNetwork similar={similar.data} />
      ) : (
        <>
          <div
            role="tablist"
            aria-label="Atividade dos amigos"
            className="mt-10 flex gap-6 overflow-x-auto [scrollbar-width:none] shadow-[inset_0_-1px_0_rgb(236_237_238/0.1)]"
          >
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => navigate(t.id, 1, "replace")}
                className={`shrink-0 pb-3 text-sm border-b-2 transition-colors ${tab === t.id ? "border-brand-orange text-foreground" : "border-transparent text-brand-slate hover:text-foreground"}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <section role="tabpanel" className="pt-8">
            {tab === "assistiram" &&
              (!activity.data ? (
                <Loading />
              ) : activity.data.items.length > 0 ? (
                <div className={activity.loading ? "opacity-50 transition-opacity" : ""}>
                  <ul className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-x-3 gap-y-6 sm:gap-x-4">
                    {activity.data.items.map((review) => (
                      <ActivityPoster key={review.id} review={review} />
                    ))}
                  </ul>
                  <Pagination
                    page={page}
                    totalPages={activity.data.totalPages}
                    onChange={(p) => {
                      navigate("assistiram", p, "push");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  />
                </div>
              ) : (
                <Empty text="Quem você segue ainda não registrou nenhum filme." />
              ))}

            {tab === "listas" &&
              (!lists.data ? (
                <Loading />
              ) : lists.data.length > 0 ? (
                <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
                  {lists.data.map((list) => (
                    <li key={list.id}>
                      <ListCard list={list} showOwner />
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty text="Quem você segue ainda não criou nenhuma lista pública." />
              ))}

            {tab === "watchlists" &&
              (!watchlist.data ? (
                <Loading />
              ) : watchlist.data.length > 0 ? (
                <FriendsWatchlist items={watchlist.data} />
              ) : (
                <Empty text="As watchlists de quem você segue estão vazias." />
              ))}

            {tab === "pessoas" && (
              <div className="flex flex-col gap-12">
                {similar.data && similar.data.length > 0 && (
                  <div>
                    <SectionHeading title="Gostos parecidos com o seu" />
                    <SimilarUsers users={similar.data} />
                  </div>
                )}
                <div>
                  <SectionHeading title="Você segue" count={user.followingCount} href={`/u/${user.username}?tab=rede`} linkLabel="Seguidores" />
                  {following.data ? <UserList users={following.data} /> : <Loading />}
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}

/**
 * As watchlists dos amigos: primeiro os filmes que vários deles querem ver (bom para combinar
 * uma sessão), depois tudo o que foi guardado, mais recente primeiro.
 */
function FriendsWatchlist({ items }: { items: FriendWatchlistItem[] }) {
  const byMovie = new Map<number, { movie: Movie; items: FriendWatchlistItem[] }>();
  for (const item of items) {
    const entry = byMovie.get(item.movie.id) ?? { movie: item.movie, items: [] };
    entry.items.push(item);
    byMovie.set(item.movie.id, entry);
  }
  const inCommon = [...byMovie.values()]
    .filter((entry) => entry.items.length >= IN_COMMON_MIN)
    .sort((a, b) => b.items.length - a.items.length);

  return (
    <div className="flex flex-col gap-12">
      {inCommon.length > 0 && (
        <div>
          <SectionHeading title="Vários amigos querem ver" />
          <ul className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-x-3 gap-y-6 sm:gap-x-4">
            {inCommon.map(({ movie, items: saved }) => (
              <li key={movie.id} className="min-w-0">
                <Link href={filmHref(movie)} title={movie.title} className="group block">
                  <Poster title={movie.title} posterPath={movie.posterPath} sizes="(min-width: 640px) 180px, 30vw" className="group-hover:ring-2 group-hover:ring-brand-orange transition-shadow" />
                </Link>
                <div className="mt-2.5 flex items-center gap-2">
                  {/* avatares sobrepostos de quem guardou */}
                  <span className="flex -space-x-2">
                    {saved.slice(0, 3).map((s) => (
                      <span key={s.user.username} className="rounded-full ring-2 ring-background">
                        <Avatar name={s.user.name} username={s.user.username} size="xs" />
                      </span>
                    ))}
                  </span>
                  <span className="text-xs text-brand-slate">{saved.length} amigos</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <SectionHeading title="Guardados recentemente" />
        <ul className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-x-3 gap-y-6 sm:gap-x-4">
          {items.map((item) => (
            <li key={`${item.user.username}-${item.movie.id}`} className="min-w-0">
              <Link href={filmHref(item.movie)} title={item.movie.title} className="group block">
                <Poster title={item.movie.title} posterPath={item.movie.posterPath} sizes="(min-width: 640px) 180px, 30vw" className="group-hover:ring-2 group-hover:ring-brand-orange transition-shadow" />
              </Link>
              <Link href={`/u/${item.user.username}?tab=watchlist`} className="mt-2.5 flex items-center gap-2 min-w-0 group">
                <Avatar name={item.user.name} username={item.user.username} size="xs" />
                <span className="text-sm truncate text-foreground/85 group-hover:text-brand-orange">{item.user.name}</span>
              </Link>
              <p className="mt-0.5 text-xs text-brand-slate/70">guardou {timeAgo(item.addedAt)}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** ainda não segue ninguém: sugestões por gosto parecido e a busca */
function EmptyNetwork({ similar }: { similar: SimilarUser[] | undefined }) {
  return (
    <div className="mt-10 flex flex-col gap-12">
      <div className="flex flex-col items-center text-center py-12 rounded-md border border-dashed border-foreground/10">
        <UsersThreeIcon size={40} weight="light" className="text-brand-slate/50" />
        <p className="mt-4 max-w-sm text-brand-slate">Encontre cinéfilos pelo nome ou comece pelas pessoas que dão notas parecidas com as suas.</p>
        <Link
          href="/movies?buscar=1"
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-brand-btn text-brand-btn-text text-sm font-semibold hover:bg-brand-btn/90 transition-colors"
        >
          <MagnifyingGlassIcon size={16} weight="bold" /> Buscar pessoas
        </Link>
      </div>
      {similar && similar.length > 0 && (
        <div>
          <SectionHeading title="Gostos parecidos com o seu" />
          <SimilarUsers users={similar} />
        </div>
      )}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-12 text-center text-brand-slate">{text}</p>;
}

function Loading() {
  return (
    <div className="py-24 flex justify-center text-brand-slate/40">
      <CircleNotchIcon size={28} className="animate-spin" />
    </div>
  );
}
