"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CircleNotchIcon,
  DownloadSimpleIcon,
  InstagramLogoIcon,
  PencilSimpleIcon,
  SparkleIcon,
  XLogoIcon,
} from "@phosphor-icons/react";

import Header from "@/app/components/header";
import { Avatar } from "@/app/components/ui/avatar";
import { MovieGrid } from "@/app/components/movie-grid";
import { EditFavoritesButton, FavoriteFilms, FavoritesEditor } from "@/app/components/favorite-films";
import { FollowButton } from "@/app/components/follow-button";
import { UserList } from "@/app/components/user-list";
import { Modal } from "@/app/components/ui/modal";
import { SectionHeading } from "@/app/components/ui/section-heading";
import { ReviewCard, reviewHref } from "@/app/components/review-card";
import { Pagination } from "@/app/components/ui/pagination";
import { ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useFetch } from "@/lib/hooks/use-fetch";
import {
  getFollowers,
  getFollowing,
  getProfile,
  getUserReviews,
  getUserWatchlist,
} from "@/lib/services/user-service";
import { monthYear } from "@/utils/format";

const TABS = [
  { id: "perfil", label: "Perfil" },
  { id: "diario", label: "Diário" },
  { id: "reviews", label: "Reviews" },
  { id: "watchlist", label: "Watchlist" },
  { id: "rede", label: "Amigos" },
] as const;

type TabId = (typeof TABS)[number]["id"];

// links antigos usavam ?tab=filmes para o diário
const TAB_ALIASES: Record<string, TabId> = { filmes: "diario" };

const FILMS_PER_PAGE = 48; // 6 linhas de 8
const REVIEWS_PER_PAGE = 10;
const RECENT_FILMS = 6; // uma linha da grade
const RECENT_REVIEWS = 2;

// o useFetch compara o argumento por igualdade, então a chave é texto: "usuario|aba|pagina"
const fetchDiaryPage = (key: string) => {
  const [username, tab, page] = key.split("|");
  return getUserReviews(
    username,
    tab === "reviews"
      ? { page: Number(page) - 1, size: REVIEWS_PER_PAGE, withText: true }
      : { page: Number(page) - 1, size: FILMS_PER_PAGE },
  );
};
const fetchRecentFilms = (username: string) => getUserReviews(username, { page: 0, size: RECENT_FILMS });
const fetchRecentReviews = (username: string) =>
  getUserReviews(username, { page: 0, size: RECENT_REVIEWS, withText: true });

export default function ProfilePage() {
  // useSearchParams precisa de Suspense para o build estático do Next
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Header />
      <main className="pt-28 sm:pt-32 pb-24 px-6 max-w-[1100px] mx-auto">
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
  const { status, user: me, refreshUser } = useAuth();
  const [editingFavorites, setEditingFavorites] = useState(false);
  // modal aberto pelos números "seguindo" / "seguidores" do topo
  const [peopleModal, setPeopleModal] = useState<"following" | "followers" | null>(null);

  const rawTab = searchParams.get("tab") ?? "";
  const tabParam = TAB_ALIASES[rawTab] ?? rawTab;
  const tab: TabId = TABS.some((t) => t.id === tabParam) ? (tabParam as TabId) : "perfil";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  // espera a sessão carregar: com token, o perfil diz se você segue a pessoa
  const profile = useFetch(status === "loading" ? null : username, getProfile);
  const diary = useFetch(tab === "diario" || tab === "reviews" ? `${username}|${tab}|${page}` : null, fetchDiaryPage);
  const watchlist = useFetch(tab === "watchlist" ? username : null, getUserWatchlist);
  const recentFilms = useFetch(tab === "perfil" ? username : null, fetchRecentFilms);
  const recentReviews = useFetch(tab === "perfil" ? username : null, fetchRecentReviews);
  const following = useFetch(tab === "rede" || peopleModal === "following" ? username : null, getFollowing);
  const followers = useFetch(tab === "rede" || peopleModal === "followers" ? username : null, getFollowers);

  if (profile.error instanceof ApiError && profile.error.status === 404) {
    return (
      <div className="py-32 text-center">
        <h1 className="text-2xl font-semibold">Usuário não encontrado.</h1>
        <p className="mt-3 text-brand-slate">Ninguém usa o nome @{username} no Nitrate.</p>
      </div>
    );
  }

  if (!profile.data) {
    return profile.error ? (
      <p className="py-32 text-center text-brand-slate">Não foi possível carregar o perfil.</p>
    ) : (
      <Loading />
    );
  }

  const user = profile.data;
  const isMe = me?.username === user.username;

  const navigate = (id: TabId, newPage: number, mode: "push" | "replace") => {
    const params = new URLSearchParams();
    if (id !== "perfil") params.set("tab", id);
    if (newPage > 1) params.set("page", String(newPage));
    const qs = params.toString();
    router[mode](qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  // trocar de aba volta para a página 1
  const selectTab = (id: TabId) => navigate(id, 1, "replace");

  // push: o "voltar" do navegador volta para a página anterior
  const selectPage = (newPage: number) => {
    navigate(tab, newPage, "push");
    document.getElementById("profile-tabs")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const setFollowing = (value: boolean) => {
    profile.setData({
      ...user,
      followedByMe: value,
      followersCount: user.followersCount + (value ? 1 : -1),
    });
  };

  // depois de confirmado: a lista de seguidores e o total de quem você segue (usado na home)
  const afterFollowSaved = () => {
    if (tab === "rede" || peopleModal === "followers") followers.reload();
    refreshUser();
  };

  const counts: Partial<Record<TabId, number>> = {
    diario: user.filmsCount,
    reviews: user.reviewsCount,
    watchlist: user.watchlistCount,
  };

  const stats: { label: string; value: number; onClick: () => void }[] = [
    { label: user.filmsCount === 1 ? "filme" : "filmes", value: user.filmsCount, onClick: () => selectTab("diario") },
    { label: user.reviewsCount === 1 ? "review" : "reviews", value: user.reviewsCount, onClick: () => selectTab("reviews") },
    { label: "seguindo", value: user.followingCount, onClick: () => setPeopleModal("following") },
    {
      label: user.followersCount === 1 ? "seguidor" : "seguidores",
      value: user.followersCount,
      onClick: () => setPeopleModal("followers"),
    },
  ];

  return (
    <>
      <section className="flex flex-col md:flex-row md:items-center gap-6 pb-8">
        <div className="flex items-center gap-5 min-w-0">
          <Avatar name={user.name} username={user.username} size="lg" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{user.name}</h1>
              {!isMe && status === "authenticated" && user.followedByMe !== null && (
                <FollowButton username={user.username} following={user.followedByMe} onChange={setFollowing} onSaved={afterFollowSaved} />
              )}
              {isMe && (
                <Link
                  href="/configuracoes"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-surface-strong text-xs font-semibold text-foreground hover:bg-foreground/15 transition-colors"
                >
                  <PencilSimpleIcon size={12} weight="bold" /> Editar perfil
                </Link>
              )}
              {!isMe && status === "anonymous" && (
                <Link
                  href={`/sign-in?redirect=${encodeURIComponent(`/u/${user.username}`)}`}
                  className="px-3 py-1 rounded-md bg-surface-strong text-xs font-semibold text-foreground hover:bg-brand-orange hover:text-background transition-colors"
                >
                  Entre para seguir
                </Link>
              )}
            </div>
            <p className="mt-1 text-sm text-brand-slate">
              @{user.username}
              <span aria-hidden="true"> · </span>
              desde {monthYear(user.createdAt)}
            </p>
            {user.bio && <p className="mt-3 max-w-xl text-sm leading-relaxed text-foreground/85 whitespace-pre-line">{user.bio}</p>}
            {(user.twitter || user.instagram) && (
              <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {/* só o @ vem do banco: o domínio é fixo aqui, então o link nunca aponta para outro site */}
                {user.twitter && (
                  <a
                    href={`https://x.com/${encodeURIComponent(user.twitter)}`}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex items-center gap-1.5 text-brand-slate hover:text-foreground"
                  >
                    <XLogoIcon size={14} /> @{user.twitter}
                  </a>
                )}
                {user.instagram && (
                  <a
                    href={`https://instagram.com/${encodeURIComponent(user.instagram)}`}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex items-center gap-1.5 text-brand-slate hover:text-foreground"
                  >
                    <InstagramLogoIcon size={14} /> @{user.instagram}
                  </a>
                )}
              </div>
            )}
            {isMe && (
              <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                {/* a retrospectiva é só do dono do diário */}
                {user.filmsCount > 0 && (
                  <Link href={`/u/${user.username}/retrospectiva`} className="inline-flex items-center gap-1.5 text-brand-orange hover:underline underline-offset-4">
                    <SparkleIcon size={14} weight="fill" />
                    Retrospectiva
                  </Link>
                )}
                <Link href="/importar" className="inline-flex items-center gap-1.5 text-brand-slate hover:text-foreground">
                  <DownloadSimpleIcon size={14} />
                  Importar do Letterboxd
                </Link>
              </div>
            )}
          </div>
        </div>

        <dl className="md:ml-auto flex gap-6 sm:gap-8">
          {stats.map((stat) => (
            <div key={stat.label}>
              <button onClick={stat.onClick} className="group flex flex-col-reverse items-center">
                <dt className="text-xs text-brand-slate group-hover:text-foreground transition-colors">{stat.label}</dt>
                <dd className="text-xl font-semibold tabular-nums">{stat.value}</dd>
              </button>
            </div>
          ))}
        </dl>
      </section>

      <div
        id="profile-tabs"
        role="tablist"
        aria-label="Seções do perfil"
        // a linha de baixo é uma sombra interna (e não borda) para o sublinhado da aba ficar por cima
        // sem transbordar: com -mb-px, o overflow-x-auto criava uma barra de rolagem vertical
        className="flex gap-6 overflow-x-auto [scrollbar-width:none] shadow-[inset_0_-1px_0_rgb(236_237_238/0.1)] scroll-mt-24"
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

      <section role="tabpanel" className="pt-8">
        {tab === "perfil" && (
          <div className="flex flex-col gap-12">
            {(user.favorites.length > 0 || isMe) && (
              <div>
                <SectionHeading
                  title="Filmes favoritos"
                  action={isMe && user.favorites.length > 0 ? <EditFavoritesButton onClick={() => setEditingFavorites(true)} /> : undefined}
                />
                <FavoriteFilms films={user.favorites} isMe={isMe} onEdit={() => setEditingFavorites(true)} />
              </div>
            )}

            <div>
              <SectionHeading
                title="Assistidos recentemente"
                href={user.filmsCount > RECENT_FILMS ? `${pathname}?tab=diario` : undefined}
                linkLabel="Diário completo"
              />
              {!recentFilms.data ? (
                <Loading />
              ) : recentFilms.data.items.length > 0 ? (
                <MovieGrid
                  variant="compact"
                  items={recentFilms.data.items.map((review) => ({
                    movie: review.movie,
                    rating: review.rating,
                    liked: review.liked,
                    rewatch: review.rewatch,
                    reviewHref: review.text ? reviewHref(review) : undefined,
                  }))}
                />
              ) : (
                <Empty isMe={isMe} me="Você ainda não registrou nenhum filme." other={`${user.name} ainda não registrou nenhum filme.`} />
              )}
            </div>

            {recentReviews.data && recentReviews.data.items.length > 0 && (
              <div>
                <SectionHeading
                  title="Últimas reviews"
                  href={user.reviewsCount > RECENT_REVIEWS ? `${pathname}?tab=reviews` : undefined}
                />
                <div className="divide-y divide-foreground/10 -mt-5">
                  {recentReviews.data.items.map((review) => (
                    <ReviewCard key={review.id} review={review} hideUser excerpt />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "diario" &&
          (!diary.data ? (
            <Loading />
          ) : diary.data.items.length > 0 ? (
            <div className={diary.loading ? "opacity-50 transition-opacity" : ""}>
              <MovieGrid
                items={diary.data.items.map((review) => ({
                  movie: review.movie,
                  rating: review.rating,
                  liked: review.liked,
                  rewatch: review.rewatch,
                  reviewHref: review.text ? reviewHref(review) : undefined,
                }))}
              />
              <Pagination page={page} totalPages={diary.data.totalPages} onChange={selectPage} />
            </div>
          ) : (
            <Empty isMe={isMe} me="Você ainda não registrou nenhum filme." other={`${user.name} ainda não registrou nenhum filme.`} />
          ))}

        {tab === "reviews" &&
          (!diary.data ? (
            <Loading />
          ) : diary.data.items.length > 0 ? (
            <div className={diary.loading ? "opacity-50 transition-opacity" : ""}>
              <div className="divide-y divide-foreground/10 -mt-8">
                {diary.data.items.map((review) => (
                  <ReviewCard key={review.id} review={review} hideUser excerpt />
                ))}
              </div>
              <Pagination page={page} totalPages={diary.data.totalPages} onChange={selectPage} />
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

        {tab === "rede" && (
          <div className="flex flex-col gap-12">
            <div>
              <SectionHeading title="Seguindo" count={user.followingCount} />
              {following.data ? (
                <UserList
                  users={following.data}
                  empty={isMe ? "Você ainda não segue ninguém. Busque perfis pelo nome na busca do topo." : `${user.name} ainda não segue ninguém.`}
                />
              ) : (
                <Loading />
              )}
            </div>
            <div>
              <SectionHeading title="Seguidores" count={user.followersCount} />
              {followers.data ? (
                <UserList users={followers.data} empty={isMe ? "Ninguém segue você ainda." : `Ninguém segue ${user.name} ainda.`} />
              ) : (
                <Loading />
              )}
            </div>
          </div>
        )}
      </section>

      <Modal
        open={peopleModal !== null}
        onClose={() => setPeopleModal(null)}
        label={peopleModal === "following" ? `Quem ${user.name} segue` : `Quem segue ${user.name}`}
      >
        <h2 className="pr-10 text-lg font-semibold">
          {peopleModal === "following" ? "Seguindo" : "Seguidores"}
          <span className="ml-2 text-sm font-normal text-brand-slate/70">
            {peopleModal === "following" ? user.followingCount : user.followersCount}
          </span>
        </h2>
        <div className="mt-5 -mx-3">
          {(() => {
            const list = peopleModal === "following" ? following : followers;
            if (!list.data) return <Loading />;
            return (
              <UserList
                users={list.data}
                columns={1}
                // ir para outro perfil reaproveita esta página, então o modal precisa fechar
                onSelect={() => setPeopleModal(null)}
                empty={
                  peopleModal === "following"
                    ? isMe ? "Você ainda não segue ninguém." : `${user.name} ainda não segue ninguém.`
                    : isMe ? "Ninguém segue você ainda." : `Ninguém segue ${user.name} ainda.`
                }
              />
            );
          })()}
        </div>
      </Modal>

      {isMe && (
        <FavoritesEditor
          open={editingFavorites}
          initial={user.favorites}
          onClose={() => setEditingFavorites(false)}
          onSaved={(favorites) => {
            profile.setData({ ...user, favorites });
            setEditingFavorites(false);
          }}
        />
      )}
    </>
  );
}

function Empty({ isMe, me, other }: { isMe: boolean; me: string; other: string }) {
  return (
    <div className="py-12 text-center text-brand-slate">
      <p>{isMe ? me : other}</p>
      {isMe && (
        <Link href="/movies" className="inline-block mt-4 font-medium text-brand-orange hover:underline underline-offset-4">
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
