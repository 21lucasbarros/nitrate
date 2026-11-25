"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowsClockwiseIcon,
  CalendarBlankIcon,
  CircleNotchIcon,
  DownloadSimpleIcon,
  HeartIcon,
  ImageIcon,
  InstagramLogoIcon,
  PencilSimpleIcon,
  PlusIcon,
  SparkleIcon,
  StackIcon,
  TelevisionSimpleIcon,
  TrashIcon,
  XLogoIcon,
} from "@phosphor-icons/react";

import Header from "@/app/components/header";
import { Avatar } from "@/app/components/ui/avatar";
import { CoverPicker } from "@/app/components/cover-picker";
import { ProfileBadges } from "@/app/components/badges";
import { ProfileAchievements } from "@/app/components/profile-achievements";
import type { ActivityEntry } from "@/app/components/activity-poster";
import { DiaryList } from "@/app/components/diary-list";
import { MovieGrid, type MovieGridItem } from "@/app/components/movie-grid";
import { EditFavoritesButton, FavoriteFilms, FavoritesEditor } from "@/app/components/favorite-films";
import { FavoritePeopleCompact, FavoritePeopleEditor } from "@/app/components/favorite-people";
import { FollowButton } from "@/app/components/follow-button";
import { ListCard, ListRow, listHref } from "@/app/components/list-card";
import { ListEditor } from "@/app/components/list-editor";
import { SimilarUsers } from "@/app/components/similar-users";
import { WhatToWatchButton } from "@/app/components/what-to-watch";
import { UserList } from "@/app/components/user-list";
import { Modal } from "@/app/components/ui/modal";
import { SectionHeading } from "@/app/components/ui/section-heading";
import { reviewHref } from "@/app/components/review-card";
import { RecentReviewCard } from "@/app/components/recent-review-card";
import { DeleteConfirmBar } from "@/app/components/ui/delete-confirm-bar";
import { Pagination } from "@/app/components/ui/pagination";
import { SortMenu, filterButtonClass } from "@/app/components/ui/dropdown";
import { ViewingPicker } from "@/app/components/viewing-picker";
import { ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useFetch } from "@/lib/hooks/use-fetch";
import {
  getFollowers,
  getFavoritePeople,
  getFollowing,
  getProfile,
  getSimilarUsers,
  getUserFilms,
  getUserDiary,
  getUserReviews,
  getUserWatchlist,
  FILM_SORTS,
  type DiaryType,
  type FilmSort,
} from "@/lib/services/user-service";
import { getSavedLists, getUserLists } from "@/lib/services/list-service";
import { getUserSeries, getUserSeriesWatchlist, removeSeriesFromWatchlist } from "@/lib/services/series-service";
import { removeFromWatchlist } from "@/lib/services/watchlist-service";
import { episodeCode, seasonLabel, seriesBadgeLabel, type SeriesReview } from "@/types/series";
import { seriesHref, seriesReviewHref } from "@/utils/series-link";
import type { FilmEntry, MovieReview } from "@/lib/types/review";
import type { Page } from "@/lib/types/page";
import type { FavoritePeopleKind } from "@/types/person";
import { getMovieCredits } from "@/lib/services/movie-service";
import { compactDate, timeAgo } from "@/utils/format";
import { filmHref } from "@/utils/movie-link";
import { backdropUrl } from "@/utils/poster";
import { sameUsername } from "@/utils/username";

const TABS = [
  { id: "perfil", label: "Perfil" },
  { id: "reviews", label: "Reviews" },
  { id: "filmes", label: "Filmes" },
  { id: "series", label: "Séries" },
  { id: "watchlist", label: "Watchlist" },
  { id: "listas", label: "Listas" },
  { id: "conquistas", label: "Conquistas" },
  { id: "rede", label: "Amigos" },
] as const;

type TabId = (typeof TABS)[number]["id"];

// links antigos: a aba Filmes se chamava Diário; os favoritos tinham aba própria e agora ficam no Perfil
const TAB_ALIASES: Record<string, TabId> = { diario: "filmes", favoritos: "perfil" };

const FILMS_PER_PAGE = 48; // Filmes e Watchlist: 8 linhas de 6 (12 de 4, 16 de 3 no celular)
const REVIEWS_PER_PAGE = 20;
const RECENT_FILMS = 5; // uma linha, alinhada com os 5 favoritos
const RECENT_REVIEWS = 3;
const SIDE_LISTS = 3; // listas na coluna lateral do Perfil

// o useFetch compara o argumento por igualdade, então a chave é texto: "usuario|ordem|curtidos|pagina"
const fetchFilmsPage = (key: string) => {
  const [username, sort, liked, page] = key.split("|");
  return getUserFilms(username, { page: Number(page) - 1, size: FILMS_PER_PAGE, sort: sort as FilmSort, liked: liked === "1" });
};
// aba Reviews: "usuario|tipo|pagina"; filmes e séries vêm juntos do diário, com e sem review escrita
const fetchDiaryPage = async (key: string, size = REVIEWS_PER_PAGE, withText = false): Promise<Page<ActivityEntry>> => {
  const [username, type, page] = key.split("|");
  const result = await getUserDiary(username, { page: Number(page) - 1, size, withText, type: type as DiaryType });
  return {
    ...result,
    items: result.items.map((entry): ActivityEntry =>
      entry.kind === "MOVIE" ? { kind: "movie", review: entry.review } : { kind: "series", review: entry.seriesReview },
    ),
  };
};
// número da aba Reviews: todos os registros do diário (o reviewsCount do perfil só conta os com texto)
const fetchDiaryTotal = async (username: string) =>
  (await getUserDiary(username, { page: 0, size: 1, withText: false, type: "tudo" })).totalItems;
const fetchRecentFilms = (username: string) => getUserReviews(username, { page: 0, size: RECENT_FILMS });
const fetchSimilar = () => getSimilarUsers();
const fetchSavedLists = () => getSavedLists();
// Últimas reviews: só os registros com texto, de filmes e de séries juntos
const fetchRecentReviews = (username: string) => fetchDiaryPage(`${username}|tudo|1`, RECENT_REVIEWS, true);

export default function ProfilePage() {
  // useSearchParams precisa de Suspense para o build estático do Next
  return (
    // relative + isolate: a cena do filme favorito fica atrás do perfil inteiro, de ponta a ponta
    <div className="relative isolate min-h-screen bg-background text-foreground font-sans">
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
  const [editingPeople, setEditingPeople] = useState<FavoritePeopleKind | null>(null);
  const [creatingList, setCreatingList] = useState(false);
  // aba Filmes: o filme visto mais de uma vez cujo seletor de registros está aberto
  const [pickingFilm, setPickingFilm] = useState<FilmEntry | null>(null);
  // modal aberto pelos números "seguindo" / "seguidores" do topo
  const [peopleModal, setPeopleModal] = useState<"following" | "followers" | null>(null);
  const [pickingCover, setPickingCover] = useState(false);
  // aba Watchlist: a confirmação de limpar tudo e o aviso se alguma remoção falhar
  const [clearing, setClearing] = useState<"confirm" | "busy" | null>(null);
  const [clearError, setClearError] = useState(false);

  const rawTab = searchParams.get("tab") ?? "";
  const tabParam = TAB_ALIASES[rawTab] ?? rawTab;
  const tab: TabId = TABS.some((t) => t.id === tabParam) ? (tabParam as TabId) : "perfil";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  // aba Filmes: a ordem e o filtro ficam na URL, então dá para compartilhar e voltar
  const rawSort = searchParams.get("ordem");
  const sort: FilmSort = FILM_SORTS.some((s) => s.id === rawSort) ? (rawSort as FilmSort) : "lancamento";
  const likedOnly = searchParams.get("curtidos") === "1";
  // aba Reviews: filmes, séries ou tudo
  const rawType = searchParams.get("tipo");
  const diaryType: DiaryType = rawType === "filmes" || rawType === "series" ? rawType : "tudo";
  // aba Watchlist: filmes (padrão) ou séries, cada uma com o seu sorteio
  const watchlistSeries = searchParams.get("tipo") === "series";

  // espera a sessão carregar: com token, o perfil diz se você segue a pessoa
  const profile = useFetch(status === "loading" ? null : username, getProfile);
  const films = useFetch(tab === "filmes" ? `${username}|${sort}|${likedOnly ? 1 : 0}|${page}` : null, fetchFilmsPage);
  const reviewsPage = useFetch(tab === "reviews" ? `${username}|${diaryType}|${page}` : null, fetchDiaryPage);
  const diaryTotal = useFetch(status === "loading" ? null : username, fetchDiaryTotal);
  const watchlist = useFetch(tab === "watchlist" && !watchlistSeries ? username : null, getUserWatchlist);
  const seriesWatchlist = useFetch(tab === "watchlist" && watchlistSeries ? username : null, getUserSeriesWatchlist);
  const recentFilms = useFetch(tab === "perfil" ? username : null, fetchRecentFilms);
  const recentReviews = useFetch(tab === "perfil" ? username : null, fetchRecentReviews);
  // as séries entram em "Assistidos recentemente" junto com os filmes
  const recentSeries = useFetch(tab === "perfil" ? username : null, getUserSeries);
  const following = useFetch(tab === "rede" || peopleModal === "following" ? username : null, getFollowing);
  const followers = useFetch(tab === "rede" || peopleModal === "followers" ? username : null, getFollowers);
  const lists = useFetch(tab === "listas" || tab === "perfil" ? username : null, getUserLists);
  // listas de outras pessoas que salvei: só no meu perfil
  const savedLists = useFetch(tab === "listas" && sameUsername(me?.username, username) ? username : null, fetchSavedLists);
  const favoritePeople = useFetch(tab === "perfil" ? username : null, getFavoritePeople);
  // gostos parecidos: só na própria aba de amigos
  const similar = useFetch(tab === "rede" && sameUsername(me?.username, username) ? username : null, fetchSimilar);
  // sem fundo escolhido, a cena do primeiro filme favorito vira o fundo do topo do perfil
  const coverCredits = useFetch(profile.data && !profile.data.cover ? (profile.data.favorites[0]?.id ?? null) : null, getMovieCredits);

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

  const navigate = (
    id: TabId,
    newPage: number,
    mode: "push" | "replace",
    filters: { sort: FilmSort; liked: boolean } = { sort, liked: likedOnly },
    // na aba Watchlist, só o tipo vale ("series" ou o padrão, filmes)
    kind: DiaryType = id === "watchlist" ? (watchlistSeries ? "series" : "tudo") : diaryType,
  ) => {
    const params = new URLSearchParams();
    if (id !== "perfil") params.set("tab", id);
    if (id === "filmes" || id === "series") {
      if (filters.sort !== "lancamento") params.set("ordem", filters.sort);
      if (filters.liked) params.set("curtidos", "1");
    }
    if (id === "reviews" && kind !== "tudo") params.set("tipo", kind);
    if (id === "watchlist" && kind === "series") params.set("tipo", "series");
    if (newPage > 1) params.set("page", String(newPage));
    const qs = params.toString();
    router[mode](qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  // trocar de aba volta para a página 1 (e a aba Filmes, para a ordem padrão)
  const selectTab = (id: TabId) => {
    setClearing(null);
    setClearError(false);
    navigate(id, 1, "replace", { sort: "lancamento", liked: false }, "tudo");
  };

  // mudar a ordem ou o filtro também volta para a página 1
  const setFilmFilters = (filters: { sort: FilmSort; liked: boolean }) => navigate("filmes", 1, "replace", filters);
  const setSeriesFilters = (filters: { sort: FilmSort; liked: boolean }) => navigate("series", 1, "replace", filters);

  const setWatchlistType = (type: "filmes" | "series") => {
    setClearing(null);
    setClearError(false);
    navigate("watchlist", 1, "replace", undefined, type === "series" ? "series" : "tudo");
  };

  const setDiaryType = (type: DiaryType) => navigate("reviews", 1, "replace", undefined, type);

  // esvazia a watchlist aberta (filmes ou séries); o que falhar continua na lista
  const clearWatchlist = async () => {
    setClearing("busy");
    setClearError(false);
    const remaining = watchlistSeries
      ? await removeAll((seriesWatchlist.data ?? []).map((item) => item.series.id), removeSeriesFromWatchlist)
      : await removeAll((watchlist.data ?? []).map((item) => item.movie.id), removeFromWatchlist);
    setClearing(null);
    profile.setData(watchlistSeries ? { ...user, seriesWatchlistCount: remaining } : { ...user, watchlistCount: remaining });
    if (remaining > 0) {
      setClearError(true);
      (watchlistSeries ? seriesWatchlist : watchlist).reload();
    } else if (watchlistSeries) {
      seriesWatchlist.setData([]);
    } else {
      watchlist.setData([]);
    }
  };

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

  // coluna lateral da aba Perfil: some só para quem visita um perfil sem pessoas favoritas nem listas
  // (enquanto carrega, fica: assim a coluna principal não encolhe depois de aparecer)
  const people = favoritePeople.data;
  const hasPeople = !people || people.actors.length > 0 || people.directors.length > 0;
  const hasLists = !lists.data || lists.data.length > 0;
  const showSide = isMe || hasPeople || hasLists;

  // registros do diário, com e sem review escrita; com a aba Reviews aberta em Tudo, o total da página é o mais atual
  const diaryCount = tab === "reviews" && diaryType === "tudo" ? (reviewsPage.data?.totalItems ?? diaryTotal.data) : diaryTotal.data;

  const counts: Partial<Record<TabId, number>> = {
    filmes: user.filmsCount,
    reviews: diaryCount,
    series: user.seriesCount,
    watchlist: user.watchlistCount + (user.seriesWatchlistCount ?? 0),
  };

  const stats: { label: string; value: number | undefined; onClick: () => void }[] = [
    { label: user.filmsCount === 1 ? "filme" : "filmes", value: user.filmsCount, onClick: () => selectTab("filmes") },
    { label: diaryCount === 1 ? "registro" : "registros", value: diaryCount, onClick: () => selectTab("reviews") },
    { label: "seguindo", value: user.followingCount, onClick: () => setPeopleModal("following") },
    {
      label: user.followersCount === 1 ? "seguidor" : "seguidores",
      value: user.followersCount,
      onClick: () => setPeopleModal("followers"),
    },
  ];

  // de qual filme é a cena: a escolhida (qualquer filme do TMDB) ou a do primeiro favorito
  const favorite = user.favorites[0];
  const cover = user.cover
    ? { src: backdropUrl(user.cover.path), title: user.cover.title, year: user.cover.year, href: `/movies/tmdb/${user.cover.tmdbId}` }
    : favorite && coverCredits.data?.backdropPath
      ? { src: backdropUrl(coverCredits.data.backdropPath), title: favorite.title, year: favorite.releaseYear, href: filmHref(favorite) }
      : null;
  const hasCover = !!user.cover || !!favorite;

  // se as séries falharem, a fileira sai só com os filmes em vez de ficar carregando
  const recentReady = recentFilms.data && (recentSeries.data || recentSeries.error);
  const recentEntries = recentReady ? mergeRecent(recentFilms.data?.items ?? [], recentSeries.data ?? []) : undefined;

  return (
    <>
      <ProfileCover src={cover?.src ?? null} />

      {/* de qual filme é a cena e, no próprio perfil, o botão de trocar: no canto de cima do fundo */}
      {(cover || isMe) && (
        <div className="relative flex items-center justify-end gap-3 -mt-2 sm:-mt-4 mb-2 min-h-8">
          {cover && (
            <Link href={cover.href} className="min-w-0 truncate text-[11px] text-foreground/40 hover:text-foreground/75 transition-colors">
              {cover.title}
              {cover.year && ` (${cover.year})`}
            </Link>
          )}
          {isMe && (
            <button
              type="button"
              onClick={() => setPickingCover(true)}
              className="shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-background/50 backdrop-blur ring-1 ring-foreground/15 text-xs font-medium text-foreground/85 hover:text-foreground hover:bg-background/70 transition-colors"
            >
              <ImageIcon size={14} /> {user.cover ? "Trocar fundo" : "Escolher fundo"}
            </button>
          )}
        </div>
      )}

      <section className={`relative flex flex-col lg:flex-row lg:items-end gap-6 pb-8 sm:pb-10 ${hasCover ? "pt-6 sm:pt-20" : ""}`}>
        <div className="flex flex-col sm:flex-row sm:items-end gap-5 min-w-0">
          <div className="shrink-0 w-fit rounded-full ring-4 ring-background shadow-2xl shadow-black/60">
            <Avatar name={user.name} username={user.username} avatar={user.avatar} size="xl" />
          </div>
          <div className="min-w-0">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight break-words">{user.name}</h1>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-brand-slate">
              <span>@{user.username}</span>
              {user.followsMe && (
                <span className="ml-1 px-1.5 py-0.5 rounded bg-surface-strong text-[11px] font-medium text-brand-slate">
                  Segue você
                </span>
              )}
              {(user.twitter || user.instagram) && (
                <span className="flex items-center gap-0.5 ml-1">
                  {/* só o @ vem do banco: o domínio é fixo aqui, então o link nunca aponta para outro site */}
                  {user.twitter && (
                    <SocialLink href={`https://x.com/${encodeURIComponent(user.twitter)}`} label={`@${user.twitter} no X`}>
                      <XLogoIcon size={15} />
                    </SocialLink>
                  )}
                  {user.instagram && (
                    <SocialLink href={`https://instagram.com/${encodeURIComponent(user.instagram)}`} label={`@${user.instagram} no Instagram`}>
                      <InstagramLogoIcon size={16} />
                    </SocialLink>
                  )}
                </span>
              )}
            </p>
            {user.badges && <ProfileBadges badges={user.badges} name={user.name} />}
            {user.bio && <p className="mt-3 max-w-xl text-sm leading-relaxed text-foreground/85 whitespace-pre-line">{user.bio}</p>}
          </div>
        </div>

        <div className="lg:ml-auto flex flex-col gap-5 lg:items-end shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            {/* a retrospectiva é só do dono do diário */}
            {isMe && user.filmsCount > 0 && (
              <Link
                href={`/u/${user.username}/retrospectiva`}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-brand-orange/10 ring-1 ring-brand-orange/30 text-sm font-medium text-brand-orange hover:bg-brand-orange/20 transition-colors"
              >
                <SparkleIcon size={14} weight="fill" /> Retrospectiva {new Date().getFullYear()}
              </Link>
            )}
            {/* importar só aparece enquanto o diário está vazio: depois fica no menu da conta */}
            {isMe && user.filmsCount === 0 && (
              <Link
                href="/importar"
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-brand-btn text-brand-btn-text text-sm font-semibold hover:bg-brand-btn/90 transition-colors"
              >
                <DownloadSimpleIcon size={14} weight="bold" /> Importar do Letterboxd
              </Link>
            )}
            {isMe && (
              <Link
                href="/configuracoes"
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-surface-strong/80 backdrop-blur ring-1 ring-foreground/10 text-sm font-medium text-foreground hover:bg-foreground/15 transition-colors"
              >
                <PencilSimpleIcon size={14} /> Editar perfil
              </Link>
            )}
            {!isMe && status === "authenticated" && user.followedByMe !== null && (
              <FollowButton username={user.username} following={user.followedByMe} onChange={setFollowing} onSaved={afterFollowSaved} />
            )}
            {!isMe && status === "anonymous" && (
              <Link
                href={`/sign-in?redirect=${encodeURIComponent(`/u/${user.username}`)}`}
                className="inline-flex items-center h-9 px-3.5 rounded-md bg-surface-strong text-sm font-medium text-foreground hover:bg-brand-orange hover:text-background transition-colors"
              >
                Entre para seguir
              </Link>
            )}
          </div>

          {/* no celular os quatro números dividem a largura; do lg em diante ficam à direita */}
          <dl className="grid grid-cols-4 sm:flex divide-x divide-foreground/10 py-3 sm:py-0 border-y border-foreground/10 sm:border-0 sm:-ml-5 lg:ml-0 lg:-mr-5">
            {stats.map((stat) => (
              <div key={stat.label} className="px-1 sm:px-5 min-w-0">
                <button onClick={stat.onClick} className="group w-full flex flex-col-reverse items-center">
                  <dt className="text-[11px] sm:text-xs text-brand-slate group-hover:text-foreground transition-colors truncate max-w-full">{stat.label}</dt>
                  <dd className="text-xl font-semibold tabular-nums group-hover:text-brand-orange transition-colors">{stat.value ?? "–"}</dd>
                </button>
              </div>
            ))}
          </dl>
        </div>
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
            <div className={`grid gap-12 ${showSide ? "lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-10" : ""}`}>
              <div className="flex flex-col gap-12 min-w-0">
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
                    // a aba Reviews, a linha do tempo com filmes e séries
                    href={recentEntries && recentEntries.length >= RECENT_FILMS ? `${pathname}?tab=reviews` : undefined}
                    linkLabel="Ver todos"
                  />
                  {!recentEntries ? (
                    <Loading />
                  ) : recentEntries.length > 0 ? (
                    <MovieGrid variant="five" items={recentEntries.map(recentGridItem)} />
                  ) : (
                    <Empty isMe={isMe} me="Você ainda não registrou nenhum filme ou série." other={`${user.name} ainda não registrou nenhum filme ou série.`} />
                  )}
                </div>
              </div>

              {showSide && (
                <aside className="flex flex-col gap-10 min-w-0">
                  {(["actors", "directors"] as const).map((kind) =>
                    !people ? (
                      <PeopleSkeleton key={kind} />
                    ) : (
                      (people[kind].length > 0 || isMe) && (
                        <div key={kind}>
                          <SectionHeading
                            title={kind === "actors" ? "Atores favoritos" : "Diretores favoritos"}
                            action={isMe && people[kind].length > 0 ? <EditFavoritesButton onClick={() => setEditingPeople(kind)} /> : undefined}
                          />
                          <FavoritePeopleCompact kind={kind} people={people[kind]} isMe={isMe} onEdit={() => setEditingPeople(kind)} />
                        </div>
                      )
                    ),
                  )}

                  <div>
                    <SectionHeading
                      title="Listas"
                      count={lists.data && lists.data.length > 0 ? lists.data.length : undefined}
                      href={lists.data && lists.data.length > SIDE_LISTS ? `${pathname}?tab=listas` : undefined}
                      linkLabel="Ver todas"
                    />
                    {!lists.data ? (
                      <div aria-hidden="true" className="h-14 rounded-md bg-surface animate-pulse" />
                    ) : lists.data.length > 0 ? (
                      <ul className="flex flex-col gap-1 -mt-2">
                        {lists.data.slice(0, SIDE_LISTS).map((list) => (
                          <li key={list.id}>
                            <ListRow list={list} />
                          </li>
                        ))}
                      </ul>
                    ) : isMe ? (
                      <button
                        onClick={() => setCreatingList(true)}
                        className="w-full flex flex-col items-center gap-2 py-5 rounded-md border border-dashed border-foreground/15 text-sm text-brand-slate hover:border-foreground/30 hover:text-foreground transition-colors"
                      >
                        <StackIcon size={24} weight="light" />
                        Criar sua primeira lista
                      </button>
                    ) : (
                      <div className="flex flex-col items-center gap-2 py-5 text-sm text-brand-slate/70">
                        <StackIcon size={24} weight="light" />
                        Nenhuma lista ainda
                      </div>
                    )}
                  </div>
                </aside>
              )}
            </div>

            {recentReviews.data && recentReviews.data.items.length > 0 && (
              <div>
                <SectionHeading
                  title="Últimas reviews"
                  href={recentReviews.data.totalItems > RECENT_REVIEWS ? `${pathname}?tab=reviews` : undefined}
                />
                <div className="-mt-5 divide-y divide-foreground/[0.06]">
                  {recentReviews.data.items.map((entry) => (
                    <RecentReviewCard key={`${entry.kind}-${entry.review.id}`} entry={entry} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "filmes" && (
          <div>
            <FilmsToolbar
              total={films.data?.totalItems}
              sort={sort}
              likedOnly={likedOnly}
              onChange={setFilmFilters}
            />
            {!films.data ? (
              <Loading />
            ) : films.data.items.length > 0 ? (
              <div className={films.loading ? "opacity-50 transition-opacity" : ""}>
                <MovieGrid
                  variant="library"
                  items={films.data.items.map((film) => {
                    const { review, viewings } = film;
                    const several = viewings.length > 1;
                    return {
                      movie: review.movie,
                      // visto mais de uma vez: o clique pergunta qual das vezes abrir
                      href: reviewHref(review),
                      onOpen: several ? () => setPickingFilm(film) : undefined,
                      rating: review.rating,
                      liked: review.liked,
                      watchCount: viewings.length,
                      reviewHref: !several && review.text ? reviewHref(review) : undefined,
                      caption: several ? `Visto ${viewings.length} vezes` : <WatchedCaption watchedOn={review.watchedOn} rewatch={review.rewatch} />,
                    };
                  })}
                />
                <Pagination page={page} totalPages={films.data.totalPages} onChange={selectPage} />
              </div>
            ) : likedOnly ? (
              <p className="py-12 text-center text-brand-slate">
                {isMe ? "Você ainda não curtiu nenhum filme." : `${user.name} ainda não curtiu nenhum filme.`}
              </p>
            ) : (
              <Empty isMe={isMe} me="Você ainda não registrou nenhum filme." other={`${user.name} ainda não registrou nenhum filme.`} />
            )}
          </div>
        )}

        {tab === "reviews" && (
          <div>
            <DiaryToolbar total={reviewsPage.data?.totalItems} type={diaryType} onChange={setDiaryType} />
            {!reviewsPage.data ? (
              <Loading />
            ) : reviewsPage.data.items.length > 0 ? (
              <div className={reviewsPage.loading ? "opacity-50 transition-opacity" : ""}>
                <DiaryList entries={reviewsPage.data.items} />
                <Pagination page={page} totalPages={reviewsPage.data.totalPages} onChange={selectPage} />
              </div>
            ) : (
              <p className="py-12 text-center text-brand-slate">{emptyDiary(diaryType, isMe ? null : user.name)}</p>
            )}
          </div>
        )}

        {tab === "watchlist" && (
          <div>
            <WatchlistToolbar
              series={watchlistSeries}
              movieCount={user.watchlistCount}
              seriesCount={user.seriesWatchlistCount}
              onChange={setWatchlistType}
              // só no próprio perfil, com algo na lista aberta
              onClear={isMe && !clearing && ((watchlistSeries ? seriesWatchlist : watchlist).data?.length ?? 0) > 0 ? () => setClearing("confirm") : undefined}
            />
            {clearing && (
              <div className="-mt-4 mb-8">
                <DeleteConfirmBar
                  title={clearTitle(watchlistSeries, (watchlistSeries ? seriesWatchlist : watchlist).data?.length ?? 0)}
                  busy={clearing === "busy"}
                  onKeep={() => setClearing(null)}
                  onConfirm={clearWatchlist}
                />
              </div>
            )}
            {clearError && (
              <p role="alert" className="-mt-4 mb-8 text-sm text-brand-crimson">
                Não foi possível remover tudo. Tente de novo para tirar o que sobrou.
              </p>
            )}
            {(() => {
              const state = watchlistSeries ? seriesWatchlist : watchlist;
              if (state.loading || !state.data) {
                return state.error ? <p className="py-12 text-center text-brand-slate">Não foi possível carregar a watchlist.</p> : <Loading />;
              }
              const items: MovieGridItem[] = watchlistSeries
                ? (seriesWatchlist.data ?? []).map((item) => ({
                    movie: { id: item.series.id, title: item.series.name, posterPath: item.series.posterPath, releaseYear: item.series.firstAirYear },
                    href: seriesHref(item.series),
                    caption: `Na lista ${timeAgo(item.addedAt)}`,
                  }))
                : (watchlist.data ?? []).map((item) => ({ movie: item.movie, caption: `Na lista ${timeAgo(item.addedAt)}` }));
              if (items.length === 0) {
                const what = watchlistSeries ? "de séries" : "de filmes";
                return <Empty isMe={isMe} me={`Sua watchlist ${what} está vazia.`} other={`A watchlist ${what} de ${user.name} está vazia.`} />;
              }
              // a API devolve a watchlist inteira (o sorteio precisa dela toda): a página é só um recorte
              const totalPages = Math.ceil(items.length / FILMS_PER_PAGE);
              const current = Math.min(page, totalPages); // ?page=9 numa watchlist de 3 páginas
              return (
                <>
                  {/* o sorteio só olha a watchlist que está aberta: filme com filme, série com série */}
                  {isMe &&
                    (watchlistSeries ? (
                      <WhatToWatchButton variant="banner" series={(seriesWatchlist.data ?? []).map((item) => item.series)} className="mb-8" />
                    ) : (
                      <WhatToWatchButton variant="banner" movies={(watchlist.data ?? []).map((item) => item.movie)} className="mb-8" />
                    ))}
                  <MovieGrid variant="library" items={items.slice((current - 1) * FILMS_PER_PAGE, current * FILMS_PER_PAGE)} />
                  <Pagination page={current} totalPages={totalPages} onChange={selectPage} />
                </>
              );
            })()}
          </div>
        )}

        {tab === "series" && (
          <ProfileSeries
            username={user.username}
            name={user.name}
            isMe={isMe}
            sort={sort}
            likedOnly={likedOnly}
            onChange={setSeriesFilters}
          />
        )}

        {tab === "conquistas" && <ProfileAchievements username={user.username} name={user.name} isMe={isMe} />}

        {tab === "listas" && (
          <div>
            {isMe && (
              <div className="-mt-2 mb-6 flex justify-end">
                <button
                  onClick={() => setCreatingList(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-brand-btn text-brand-btn-text text-sm font-semibold hover:bg-brand-btn/90 transition-colors"
                >
                  <PlusIcon size={14} weight="bold" /> Nova lista
                </button>
              </div>
            )}
            {!lists.data ? (
              <Loading />
            ) : lists.data.length > 0 ? (
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
                {lists.data.map((list) => (
                  <li key={list.id}>
                    <ListCard list={list} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-12 text-center text-brand-slate">
                {isMe
                  ? "Você ainda não criou nenhuma lista. Que tal uma maratona ou a filmografia de um diretor?"
                  : `${user.name} ainda não criou nenhuma lista pública.`}
              </p>
            )}

            {savedLists.data && savedLists.data.length > 0 && (
              <div className="mt-16">
                <SectionHeading title="Listas salvas" count={savedLists.data.length} />
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
                  {savedLists.data.map((list) => (
                    <li key={list.id}>
                      <ListCard list={list} showOwner />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {tab === "rede" && (
          <div className="flex flex-col gap-12">
            {isMe && similar.data && similar.data.length > 0 && (
              <div>
                <SectionHeading title="Gostos parecidos com o seu" />
                <SimilarUsers users={similar.data} />
              </div>
            )}
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

      <ViewingPicker film={pickingFilm} onClose={() => setPickingFilm(null)} />

      {isMe && (
        <CoverPicker
          open={pickingCover}
          onClose={() => setPickingCover(false)}
          current={user.cover}
          onSaved={(saved) => {
            profile.setData({ ...user, cover: saved.cover ?? null });
            setPickingCover(false);
          }}
        />
      )}

      {isMe && (
        <ListEditor
          open={creatingList}
          onClose={() => setCreatingList(false)}
          onSaved={(list) => router.push(listHref(list))}
        />
      )}

      {isMe && favoritePeople.data && (
        <FavoritePeopleEditor
          kind={editingPeople}
          initial={editingPeople ? favoritePeople.data[editingPeople] : []}
          onClose={() => setEditingPeople(null)}
          onSaved={(kind, people) => {
            favoritePeople.setData({ ...favoritePeople.data!, [kind]: people });
            setEditingPeople(null);
          }}
        />
      )}

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

// granulado de película, o mesmo do hero da landing
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

/** fundo do topo do perfil: a cena do filme favorito desbotando para o fundo, com granulado e luz de projetor */
function ProfileCover({ src }: { src: string | null }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute -z-10 inset-x-0 top-0 h-[340px] sm:h-[440px] overflow-hidden">
      {src && <Image src={src} alt="" fill priority sizes="100vw" className="object-cover object-[center_30%] opacity-40" />}
      {/* sem filme favorito: só a luz do projetor */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgb(255_122_51/0.10),transparent)]" />
      <div className="absolute inset-0 bg-linear-to-t from-background via-background/70 to-background/20" />
      <div className="absolute inset-0 bg-linear-to-r from-background/80 via-transparent to-background/80" />
      <div className="absolute inset-0 opacity-[0.07] mix-blend-overlay" style={{ backgroundImage: GRAIN }} />
    </div>
  );
}

function SocialLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      aria-label={label}
      title={label}
      className="p-1 rounded text-brand-slate hover:text-foreground hover:bg-foreground/5 transition-colors"
    >
      {children}
    </a>
  );
}

/** barra da aba Watchlist: filmes e séries separados, com o total de cada uma, e o botão de limpar */
function WatchlistToolbar({ series, movieCount, seriesCount, onChange, onClear }: {
  series: boolean;
  movieCount: number;
  seriesCount: number | undefined;
  onChange: (type: "filmes" | "series") => void;
  onClear?: () => void;
}) {
  const options = [
    { id: "filmes" as const, label: "Filmes", count: movieCount, active: !series },
    { id: "series" as const, label: "Séries", count: seriesCount, active: series },
  ];
  return (
    <div className="-mt-2 mb-8 flex items-center gap-3">
      <SegmentedControl label="Watchlist de" options={options} onChange={onChange} />
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="ml-auto shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-sm text-brand-slate hover:text-brand-crimson hover:bg-brand-crimson/10 transition-colors"
        >
          <TrashIcon size={15} />
          Limpar watchlist
        </button>
      )}
    </div>
  );
}

/** abas pequenas em pílula: a opção ativa ganha fundo, o resto fica discreto */
function SegmentedControl<T extends string>({ label, options, onChange }: {
  label: string;
  options: { id: T; label: string; count?: number; active: boolean }[];
  onChange: (id: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex h-9 p-1 gap-1 rounded-full bg-surface/80 ring-1 ring-inset ring-foreground/[0.06]">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="radio"
          aria-checked={option.active}
          onClick={() => onChange(option.id)}
          className={`px-3.5 rounded-full text-sm font-medium transition-colors ${option.active ? "bg-foreground text-background" : "text-brand-slate hover:text-foreground"}`}
        >
          {option.label}
          {option.count !== undefined && (
            <span className={`ml-1.5 text-xs tabular-nums ${option.active ? "text-background/60" : "text-brand-slate/60"}`}>{option.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

const DIARY_TYPES: { id: DiaryType; label: string }[] = [
  { id: "tudo", label: "Tudo" },
  { id: "filmes", label: "Filmes" },
  { id: "series", label: "Séries" },
];

/** barra da aba Reviews: o total e o filtro de filmes, séries ou tudo */
function DiaryToolbar({ total, type, onChange }: {
  total: number | undefined;
  type: DiaryType;
  onChange: (type: DiaryType) => void;
}) {
  return (
    <div className="-mt-2 mb-6 flex items-center justify-between gap-4">
      <p className="text-sm text-brand-slate tabular-nums min-h-5">
        {total !== undefined && `${total} ${total === 1 ? "registro" : "registros"}`}
      </p>
      <SegmentedControl
        label="Mostrar"
        options={DIARY_TYPES.map((option) => ({ ...option, active: type === option.id }))}
        onChange={onChange}
      />
    </div>
  );
}

/** "Você ainda não registrou nenhuma série." e afins, conforme o filtro */
function emptyDiary(type: DiaryType, name: string | null): string {
  const what = type === "filmes" ? "nenhum filme" : type === "series" ? "nenhuma série" : "nenhum filme ou série";
  return name ? `${name} ainda não registrou ${what}.` : `Você ainda não registrou ${what}.`;
}

function clearTitle(series: boolean, n: number): string {
  if (series) return `Remover ${n === 1 ? "a série" : `as ${n} séries`} da watchlist?`;
  return `Remover ${n === 1 ? "o filme" : `os ${n} filmes`} da watchlist?`;
}

/** a API remove um item por vez: vai de 6 em 6 para não abrir centenas de requisições juntas; devolve quantos falharam */
async function removeAll(ids: number[], remove: (id: number) => Promise<void>): Promise<number> {
  let failed = 0;
  for (let i = 0; i < ids.length; i += 6) {
    const results = await Promise.allSettled(ids.slice(i, i + 6).map(remove));
    failed += results.filter((result) => result.status === "rejected").length;
  }
  return failed;
}

/** barra das abas Filmes e Séries: a ordem e o filtro de curtidos (o total já aparece na aba) */
function FilmsToolbar({ total, sort, likedOnly, onChange, series = false }: {
  total: number | undefined;
  sort: FilmSort;
  likedOnly: boolean;
  onChange: (filters: { sort: FilmSort; liked: boolean }) => void;
  series?: boolean;
}) {
  const [one, many] = series ? ["série curtida", "séries curtidas"] : ["filme curtido", "filmes curtidos"];
  return (
    <div className="-mt-2 mb-6 flex flex-wrap items-center gap-x-4 gap-y-3">
      {/* o total geral já está na aba: aqui só o de curtidos, que muda com o filtro */}
      {likedOnly && total !== undefined && (
        <p className="text-sm text-brand-slate tabular-nums">
          {total} {total === 1 ? one : many}
        </p>
      )}
      {/* no celular os controles ocupam a linha toda, e o seletor encolhe para caber */}
      <div className="flex w-full sm:w-auto sm:ml-auto items-center gap-2">
        <button
          type="button"
          onClick={() => onChange({ sort, liked: !likedOnly })}
          aria-pressed={likedOnly}
          className={`shrink-0 ${filterButtonClass({ active: likedOnly })}`}
        >
          <HeartIcon size={14} weight={likedOnly ? "fill" : "regular"} className={likedOnly ? "text-brand-orange" : ""} />
          Curtidos
        </button>
        <SortMenu
          value={sort}
          options={FILM_SORTS}
          onChange={(next) => onChange({ sort: next, liked: likedOnly })}
          className="flex-1 sm:flex-none"
        />
      </div>
    </div>
  );
}

/** filmes e séries numa fileira só, na ordem do diário: data em que assistiu, depois a do registro */
function mergeRecent(movies: MovieReview[], series: SeriesReview[]): ActivityEntry[] {
  return [
    ...movies.map((review): ActivityEntry => ({ kind: "movie", review })),
    ...series.map((review): ActivityEntry => ({ kind: "series", review })),
  ]
    .sort((a, b) => b.review.watchedOn.localeCompare(a.review.watchedOn) || Date.parse(b.review.createdAt) - Date.parse(a.review.createdAt))
    .slice(0, RECENT_FILMS);
}

/** item do MovieGrid: o pôster abre o registro (nota, review, curtidas e comentários), não a página do filme */
function recentGridItem(entry: ActivityEntry): MovieGridItem {
  if (entry.kind === "movie") {
    const review = entry.review;
    return {
      movie: review.movie,
      href: reviewHref(review),
      rating: review.rating,
      liked: review.liked,
      rewatch: review.rewatch,
      reviewHref: review.text ? reviewHref(review) : undefined,
      caption: <WatchedCaption watchedOn={review.watchedOn} rewatch={review.rewatch} />,
    };
  }
  const review = entry.review;
  return {
    movie: { id: `series-${review.series.id}`, title: review.series.name, posterPath: review.series.posterPath, releaseYear: review.series.firstAirYear },
    href: seriesReviewHref(review),
    rating: review.rating,
    liked: review.liked,
    reviewHref: review.text ? seriesReviewHref(review) : undefined,
    // o selo diz que é série e até onde a pessoa foi
    badge: (
      <>
        <TelevisionSimpleIcon size={11} weight="bold" className="text-brand-orange" />
        {seriesBadgeLabel(review)}
      </>
    ),
    rewatch: review.rewatch,
    caption: <WatchedCaption watchedOn={review.watchedOn} rewatch={review.rewatch} />,
  };
}

/** contexto do painel do pôster: quando assistiu (e se foi reassistido) */
function WatchedCaption({ watchedOn, rewatch }: { watchedOn: string | null; rewatch: boolean }) {
  if (!watchedOn) return null;
  return (
    <>
      {rewatch ? (
        <ArrowsClockwiseIcon size={10} weight="bold" className="shrink-0 text-brand-emerald" aria-label="Reassistido" />
      ) : (
        <CalendarBlankIcon size={10} className="shrink-0" />
      )}
      {compactDate(watchedOn)}
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

function PeopleSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="h-4 w-32 mb-5 rounded bg-surface animate-pulse" />
      <div className="flex gap-3">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="w-[calc((100%-3rem)/5)] max-w-20 aspect-square rounded-full bg-surface animate-pulse" />
        ))}
      </div>
    </div>
  );
}

/** aba Séries: o diário de séries fica à parte dos filmes (uma série por pôster, com o registro mais recente) */
function ProfileSeries({ username, name, isMe, sort, likedOnly, onChange }: {
  username: string;
  name: string;
  isMe: boolean;
  sort: FilmSort;
  likedOnly: boolean;
  onChange: (filters: { sort: FilmSort; liked: boolean }) => void;
}) {
  const diary = useFetch(username, getUserSeries);

  if (!diary.data) {
    return diary.error ? <p className="py-12 text-center text-brand-slate">Não foi possível carregar as séries.</p> : <Loading />;
  }

  // a API devolve do mais recente para o mais antigo: o primeiro de cada série é o que aparece
  const latest = new Map<number, SeriesReview>();
  // curtiu em algum registro (uma temporada, um episódio): conta como série curtida
  const liked = new Set<number>();
  for (const review of diary.data) {
    if (!latest.has(review.series.id)) latest.set(review.series.id, review);
    if (review.liked) liked.add(review.series.id);
  }
  const all = [...latest.values()];
  // a API não ordena nem filtra as séries: a ordem e os curtidos são feitos aqui, como na aba Filmes
  const watched = sortSeries(likedOnly ? all.filter((review) => liked.has(review.series.id)) : all, sort);

  if (all.length === 0) {
    return (
      <div className="py-12 text-center text-brand-slate">
        <p>{isMe ? "Você ainda não registrou nenhuma série." : `${name} ainda não registrou nenhuma série.`}</p>
        {isMe && (
          <Link href="/series" className="inline-block mt-4 font-medium text-brand-orange hover:underline underline-offset-4">
            Explorar séries
          </Link>
        )}
      </div>
    );
  }

  return (
    <div>
      <FilmsToolbar series total={watched.length} sort={sort} likedOnly={likedOnly} onChange={onChange} />
      {watched.length > 0 ? (
        // as que a pessoa quer ver ficam na aba Watchlist, separadas dos filmes
        <MovieGrid
          variant="library"
          items={watched.map((review) => ({
            movie: { id: review.series.id, title: review.series.name, posterPath: review.series.posterPath, releaseYear: review.series.firstAirYear },
            // como na aba Filmes: o pôster abre o registro mais recente da pessoa
            href: seriesReviewHref(review),
            rating: review.rating,
            liked: liked.has(review.series.id),
            caption: `${review.seasonNumber !== null && review.episodeNumber !== null ? episodeCode(review.seasonNumber, review.episodeNumber) : seasonLabel(review.seasonNumber)} · ${compactDate(review.watchedOn)}`,
          }))}
        />
      ) : (
        <p className="py-12 text-center text-brand-slate">
          {isMe ? "Você ainda não curtiu nenhuma série." : `${name} ainda não curtiu nenhuma série.`}
        </p>
      )}
    </div>
  );
}

/** as mesmas ordens da aba Filmes; sem data de estreia, a série vai para o fim. Empates: a assistida por último primeiro */
function sortSeries(reviews: SeriesReview[], sort: FilmSort): SeriesReview[] {
  const byWatched = (a: SeriesReview, b: SeriesReview) => b.watchedOn.localeCompare(a.watchedOn) || Date.parse(b.createdAt) - Date.parse(a.createdAt);
  const nullsLast = (a: number | null, b: number | null, desc: boolean) => {
    if (a === b) return 0;
    if (a === null) return 1;
    if (b === null) return -1;
    return desc ? b - a : a - b;
  };
  const compare: Record<FilmSort, (a: SeriesReview, b: SeriesReview) => number> = {
    lancamento: (a, b) => nullsLast(a.series.firstAirYear, b.series.firstAirYear, true),
    "lancamento-antigos": (a, b) => nullsLast(a.series.firstAirYear, b.series.firstAirYear, false),
    nota: (a, b) => nullsLast(a.rating, b.rating, true),
    "nota-menor": (a, b) => nullsLast(a.rating, b.rating, false),
    assistidos: () => 0,
    titulo: (a, b) => a.series.name.localeCompare(b.series.name, "pt-BR"),
  };
  return [...reviews].sort((a, b) => compare[sort](a, b) || byWatched(a, b));
}

function Loading() {
  return (
    <div className="py-24 flex justify-center text-brand-slate/40">
      <CircleNotchIcon size={28} className="animate-spin" />
    </div>
  );
}
