"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { CircleNotchIcon, DownloadSimpleIcon, SparkleIcon } from "@phosphor-icons/react";

import Header from "@/app/components/header";
import { Avatar } from "@/app/components/ui/avatar";
import { MovieGrid } from "@/app/components/movie-grid";
import { ReviewCard } from "@/app/components/review-card";
import { ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useFetch } from "@/lib/hooks/use-fetch";
import { getProfile, getUserReviews, getUserWatchlist } from "@/lib/services/user-service";
import { monthYear } from "@/utils/format";

const TABS = [
  { id: "filmes", label: "Filmes" },
  { id: "reviews", label: "Reviews" },
  { id: "watchlist", label: "Watchlist" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function ProfilePage() {
  // useSearchParams precisa de Suspense para o build estático do Next
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Header />
      <main className="pt-28 sm:pt-32 pb-24 px-6 md:px-12 xl:px-24 max-w-[1400px] mx-auto">
        <Suspense fallback={<Loading />}>
          <Profile />
        </Suspense>
      </main>
    </div>
  );
}

function Profile() {
  const { username } = useParams<{ username: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { user: me } = useAuth();

  const tabParam = searchParams.get("tab");
  const tab: TabId = TABS.some((t) => t.id === tabParam) ? (tabParam as TabId) : "filmes";

  const profile = useFetch(username, getProfile);
  const reviews = useFetch(username, getUserReviews);
  const watchlist = useFetch(tab === "watchlist" ? username : null, getUserWatchlist);

  if (profile.error instanceof ApiError && profile.error.status === 404) {
    return (
      <div className="py-32 text-center">
        <h1 className="text-3xl font-medium tracking-tight">Usuário não encontrado.</h1>
        <p className="mt-3 text-brand-slate/60">Ninguém usa o nome @{username} no Nitrate.</p>
      </div>
    );
  }

  if (!profile.data) {
    return profile.error ? (
      <p className="py-32 text-center text-brand-slate/60">Não foi possível carregar o perfil.</p>
    ) : (
      <Loading />
    );
  }

  const user = profile.data;
  const isMe = me?.username === user.username;
  const writtenReviews = (reviews.data ?? []).filter((review) => review.text);

  const selectTab = (id: TabId) => {
    const params = new URLSearchParams(searchParams);
    if (id === "filmes") params.delete("tab");
    else params.set("tab", id);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const counts: Record<TabId, number> = {
    filmes: user.filmsCount,
    reviews: user.reviewsCount,
    watchlist: user.watchlistCount,
  };

  return (
    <>
      <section className="flex flex-col lg:flex-row lg:items-center gap-8 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8 min-w-0">
          <Avatar name={user.name} username={user.username} size="xl" />
          <div className="min-w-0">
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tighter leading-none">{user.name}</h1>
            <p className="mt-3 text-brand-slate/60">
              <span className="font-mono">@{user.username}</span>
              <span aria-hidden="true"> · </span>
              membro desde {monthYear(user.createdAt)}
            </p>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            {user.filmsCount > 0 && (
              <Link
                href={`/u/${user.username}/retrospectiva`}
                className="inline-flex items-center gap-2 text-sm font-medium text-brand-orange hover:underline underline-offset-4"
              >
                <SparkleIcon size={16} weight="fill" />
                Retrospectiva mensal
              </Link>
            )}
            {isMe && (
              <Link
                href="/importar"
                className="inline-flex items-center gap-2 text-sm font-medium text-brand-slate/70 hover:text-brand-blue hover:underline underline-offset-4"
              >
                <DownloadSimpleIcon size={16} />
                Importar do Letterboxd
              </Link>
            )}
            </div>
          </div>
        </div>
        <dl className="lg:ml-auto flex gap-8 sm:gap-10">
          {[
            ["Filmes", user.filmsCount],
            ["Curtidos", user.likesCount],
            ["Watchlist", user.watchlistCount],
          ].map(([label, value]) => (
            <div key={label} className="flex flex-col-reverse">
              <dt className="text-xs uppercase tracking-[0.15em] text-brand-slate/60 mt-1">{label}</dt>
              <dd className="text-3xl font-semibold tracking-tight">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div role="tablist" aria-label="Seções do perfil" className="flex gap-8 border-b border-foreground/10">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => selectTab(t.id)}
            className={`-mb-px pb-4 text-sm font-medium tracking-wide border-b-2 transition-colors ${tab === t.id ? "border-brand-orange text-foreground" : "border-transparent text-brand-slate/50 hover:text-foreground"}`}
          >
            {t.label} <span className="font-mono text-xs text-brand-slate/40 ml-1">{counts[t.id]}</span>
          </button>
        ))}
      </div>

      <section role="tabpanel" className="pt-10">
        {tab === "filmes" &&
          (reviews.loading ? (
            <Loading />
          ) : reviews.data && reviews.data.length > 0 ? (
            <MovieGrid
              items={reviews.data.map((review) => ({
                movie: review.movie,
                rating: review.rating,
                liked: review.liked,
              }))}
            />
          ) : (
            <Empty isMe={isMe} me="Você ainda não registrou nenhum filme." other={`${user.name} ainda não registrou nenhum filme.`} />
          ))}

        {tab === "reviews" &&
          (reviews.loading ? (
            <Loading />
          ) : writtenReviews.length > 0 ? (
            <div className="divide-y divide-foreground/10 -mt-8">
              {writtenReviews.map((review) => (
                <ReviewCard key={review.id} review={review} hideUser />
              ))}
            </div>
          ) : (
            <Empty isMe={isMe} me="Você ainda não escreveu nenhuma review." other={`${user.name} ainda não escreveu nenhuma review.`} />
          ))}

        {tab === "watchlist" &&
          (watchlist.loading ? (
            <Loading />
          ) : watchlist.data && watchlist.data.length > 0 ? (
            <MovieGrid items={watchlist.data.map((item) => ({ movie: item.movie }))} />
          ) : (
            <Empty isMe={isMe} me="Sua watchlist está vazia." other={`A watchlist de ${user.name} está vazia.`} />
          ))}
      </section>
    </>
  );
}

function Empty({ isMe, me, other }: { isMe: boolean; me: string; other: string }) {
  return (
    <div className="py-16 text-center text-brand-slate/60">
      <p>{isMe ? me : other}</p>
      {isMe && (
        <Link href="/movies" className="inline-block mt-4 font-medium text-brand-blue hover:underline">
          Explorar filmes
        </Link>
      )}
    </div>
  );
}

function Loading() {
  return (
    <div className="py-24 flex justify-center text-brand-slate/40">
      <CircleNotchIcon size={28} className="animate-spin" />
    </div>
  );
}
