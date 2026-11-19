"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowsClockwiseIcon,
  CalendarBlankIcon,
  CaretDownIcon,
  CircleNotchIcon,
  DownloadSimpleIcon,
  HeartIcon,
  InstagramLogoIcon,
  PencilSimpleIcon,
  PlusIcon,
  SortAscendingIcon,
  SparkleIcon,
  StackIcon,
  XLogoIcon,
} from "@phosphor-icons/react";

import Header from "@/app/components/header";
import { Avatar } from "@/app/components/ui/avatar";
import { MovieGrid } from "@/app/components/movie-grid";
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
import { ReviewCard, reviewHref } from "@/app/components/review-card";
import { Pagination } from "@/app/components/ui/pagination";
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
  getUserReviews,
  getUserWatchlist,
  FILM_SORTS,
  type FilmSort,
} from "@/lib/services/user-service";
import { getUserLists } from "@/lib/services/list-service";
import type { FilmEntry, MovieReview } from "@/lib/types/review";
import type { FavoritePeopleKind } from "@/types/person";
import { compactDate, monthYear, timeAgo } from "@/utils/format";

const TABS = [
  { id: "perfil", label: "Perfil" },
  { id: "filmes", label: "Filmes" },
  { id: "reviews", label: "Reviews" },
  { id: "watchlist", label: "Watchlist" },
  { id: "listas", label: "Listas" },
  { id: "rede", label: "Amigos" },
] as const;

type TabId = (typeof TABS)[number]["id"];

// links antigos: a aba Filmes se chamava Diário; os favoritos tinham aba própria e agora ficam no Perfil
const TAB_ALIASES: Record<string, TabId> = { diario: "filmes", favoritos: "perfil" };

const FILMS_PER_PAGE = 48; // Filmes e Watchlist: 8 linhas de 6 (12 de 4, 16 de 3 no celular)
const REVIEWS_PER_PAGE = 10;
const RECENT_FILMS = 5; // uma linha, alinhada com os 5 favoritos
const RECENT_REVIEWS = 2;
const SIDE_LISTS = 3; // listas na coluna lateral do Perfil

// o useFetch compara o argumento por igualdade, então a chave é texto: "usuario|ordem|curtidos|pagina"
const fetchFilmsPage = (key: string) => {
  const [username, sort, liked, page] = key.split("|");
  return getUserFilms(username, { page: Number(page) - 1, size: FILMS_PER_PAGE, sort: sort as FilmSort, liked: liked === "1" });
};
const fetchReviewsPage = (key: string) => {
  const [username, page] = key.split("|");
  return getUserReviews(username, { page: Number(page) - 1, size: REVIEWS_PER_PAGE, withText: true });
};
const fetchRecentFilms = (username: string) => getUserReviews(username, { page: 0, size: RECENT_FILMS });
const fetchSimilar = () => getSimilarUsers();
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
  const [editingPeople, setEditingPeople] = useState<FavoritePeopleKind | null>(null);
  const [creatingList, setCreatingList] = useState(false);
  // aba Filmes: o filme visto mais de uma vez cujo seletor de registros está aberto
  const [pickingFilm, setPickingFilm] = useState<FilmEntry | null>(null);
  // modal aberto pelos números "seguindo" / "seguidores" do topo
  const [peopleModal, setPeopleModal] = useState<"following" | "followers" | null>(null);

  const rawTab = searchParams.get("tab") ?? "";
  const tabParam = TAB_ALIASES[rawTab] ?? rawTab;
  const tab: TabId = TABS.some((t) => t.id === tabParam) ? (tabParam as TabId) : "perfil";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  // aba Filmes: a ordem e o filtro ficam na URL, então dá para compartilhar e voltar
  const rawSort = searchParams.get("ordem");
  const sort: FilmSort = FILM_SORTS.some((s) => s.id === rawSort) ? (rawSort as FilmSort) : "lancamento";
  const likedOnly = searchParams.get("curtidos") === "1";

  // espera a sessão carregar: com token, o perfil diz se você segue a pessoa
  const profile = useFetch(status === "loading" ? null : username, getProfile);
  const films = useFetch(tab === "filmes" ? `${username}|${sort}|${likedOnly ? 1 : 0}|${page}` : null, fetchFilmsPage);
  const reviewsPage = useFetch(tab === "reviews" ? `${username}|${page}` : null, fetchReviewsPage);
  const watchlist = useFetch(tab === "watchlist" ? username : null, getUserWatchlist);
  const recentFilms = useFetch(tab === "perfil" ? username : null, fetchRecentFilms);
  const recentReviews = useFetch(tab === "perfil" ? username : null, fetchRecentReviews);
  const following = useFetch(tab === "rede" || peopleModal === "following" ? username : null, getFollowing);
  const followers = useFetch(tab === "rede" || peopleModal === "followers" ? username : null, getFollowers);
  const lists = useFetch(tab === "listas" || tab === "perfil" ? username : null, getUserLists);
  const favoritePeople = useFetch(tab === "perfil" ? username : null, getFavoritePeople);
  // gostos parecidos: só na própria aba de amigos
  const similar = useFetch(tab === "rede" && me?.username === username ? username : null, fetchSimilar);

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
  ) => {
    const params = new URLSearchParams();
    if (id !== "perfil") params.set("tab", id);
    if (id === "filmes") {
      if (filters.sort !== "lancamento") params.set("ordem", filters.sort);
      if (filters.liked) params.set("curtidos", "1");
    }
    if (newPage > 1) params.set("page", String(newPage));
    const qs = params.toString();
    router[mode](qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  // trocar de aba volta para a página 1 (e a aba Filmes, para a ordem padrão)
  const selectTab = (id: TabId) => navigate(id, 1, "replace", { sort: "lancamento", liked: false });

  // mudar a ordem ou o filtro também volta para a página 1
  const setFilmFilters = (filters: { sort: FilmSort; liked: boolean }) => navigate("filmes", 1, "replace", filters);

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

  const counts: Partial<Record<TabId, number>> = {
    filmes: user.filmsCount,
    reviews: user.reviewsCount,
    watchlist: user.watchlistCount,
  };

  const stats: { label: string; value: number; onClick: () => void }[] = [
    { label: user.filmsCount === 1 ? "filme" : "filmes", value: user.filmsCount, onClick: () => selectTab("filmes") },
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
          <Avatar name={user.name} username={user.username} avatar={user.avatar} size="lg" />
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
                    href={user.filmsCount > RECENT_FILMS ? `${pathname}?tab=filmes` : undefined}
                    linkLabel="Ver todos"
                  />
                  {!recentFilms.data ? (
                    <Loading />
                  ) : recentFilms.data.items.length > 0 ? (
                    <MovieGrid
                      variant="five"
                      items={recentFilms.data.items.map((review) => ({
                        movie: review.movie,
                        // o pôster abre o registro (nota, review, curtidas e comentários), não a página do filme
                        href: reviewHref(review),
                        rating: review.rating,
                        liked: review.liked,
                        rewatch: review.rewatch,
                        reviewHref: review.text ? reviewHref(review) : undefined,
                        caption: <WatchedCaption review={review} />,
                      }))}
                    />
                  ) : (
                    <Empty isMe={isMe} me="Você ainda não registrou nenhum filme." other={`${user.name} ainda não registrou nenhum filme.`} />
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
                      caption: several ? `Visto ${viewings.length} vezes` : <WatchedCaption review={review} />,
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

        {tab === "reviews" &&
          (!reviewsPage.data ? (
            <Loading />
          ) : reviewsPage.data.items.length > 0 ? (
            <div className={reviewsPage.loading ? "opacity-50 transition-opacity" : ""}>
              <div className="divide-y divide-foreground/10 -mt-8">
                {reviewsPage.data.items.map((review) => (
                  <ReviewCard key={review.id} review={review} hideUser excerpt />
                ))}
              </div>
              <Pagination page={page} totalPages={reviewsPage.data.totalPages} onChange={selectPage} />
            </div>
          ) : (
            <Empty isMe={isMe} me="Você ainda não escreveu nenhuma review." other={`${user.name} ainda não escreveu nenhuma review.`} />
          ))}

        {tab === "watchlist" &&
          (watchlist.loading ? (
            <Loading />
          ) : watchlist.data && watchlist.data.length > 0 ? (
            <>
              {isMe && <WhatToWatchButton variant="banner" movies={watchlist.data.map((item) => item.movie)} className="mb-8" />}
              {/* a API devolve a watchlist inteira (o sorteio precisa dela toda): a página é só um recorte */}
              {(() => {
                const totalPages = Math.ceil(watchlist.data.length / FILMS_PER_PAGE);
                const current = Math.min(page, totalPages); // ?page=9 numa watchlist de 3 páginas
                return (
                  <>
                    <MovieGrid
                      variant="library"
                      items={watchlist.data
                        .slice((current - 1) * FILMS_PER_PAGE, current * FILMS_PER_PAGE)
                        .map((item) => ({ movie: item.movie, caption: `Na lista ${timeAgo(item.addedAt)}` }))}
                    />
                    <Pagination page={current} totalPages={totalPages} onChange={selectPage} />
                  </>
                );
              })()}
            </>
          ) : (
            <Empty isMe={isMe} me="Sua watchlist está vazia." other={`A watchlist de ${user.name} está vazia.`} />
          ))}

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
              <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
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

/** barra da aba Filmes: quantos são, a ordem e o filtro de curtidos */
function FilmsToolbar({ total, sort, likedOnly, onChange }: {
  total: number | undefined;
  sort: FilmSort;
  likedOnly: boolean;
  onChange: (filters: { sort: FilmSort; liked: boolean }) => void;
}) {
  return (
    <div className="-mt-2 mb-6 flex flex-wrap items-center gap-x-4 gap-y-3">
      <p className="text-sm text-brand-slate tabular-nums">
        {total === undefined ? "\u00a0" : `${total} ${total === 1 ? "filme" : "filmes"}${likedOnly ? (total === 1 ? " curtido" : " curtidos") : ""}`}
      </p>
      {/* no celular os controles ocupam a linha toda, e o seletor encolhe para caber */}
      <div className="flex w-full sm:w-auto sm:ml-auto items-center gap-2">
        <button
          type="button"
          onClick={() => onChange({ sort, liked: !likedOnly })}
          aria-pressed={likedOnly}
          className={`shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-md border text-sm transition-colors ${likedOnly ? "border-brand-orange/60 bg-brand-orange/10 text-foreground" : "border-foreground/15 text-brand-slate hover:text-foreground hover:border-foreground/30"}`}
        >
          <HeartIcon size={14} weight={likedOnly ? "fill" : "regular"} className={likedOnly ? "text-brand-orange" : ""} />
          Curtidos
        </button>
        <label className="relative flex flex-1 sm:flex-none min-w-0 items-center">
          <span className="sr-only">Ordenar por</span>
          <SortAscendingIcon size={16} className="pointer-events-none absolute left-3 text-brand-slate" />
          <select
            value={sort}
            onChange={(e) => onChange({ sort: e.target.value as FilmSort, liked: likedOnly })}
            className="w-full truncate appearance-none h-9 pl-9 pr-9 rounded-md border border-foreground/15 bg-background text-sm text-foreground hover:border-foreground/30 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-colors cursor-pointer"
          >
            {FILM_SORTS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <CaretDownIcon size={14} className="pointer-events-none absolute right-3 text-brand-slate" />
        </label>
      </div>
    </div>
  );
}

/** contexto do painel do pôster: quando assistiu (e se foi reassistido) */
function WatchedCaption({ review }: { review: MovieReview }) {
  if (!review.watchedOn) return null;
  return (
    <>
      {review.rewatch ? (
        <ArrowsClockwiseIcon size={10} weight="bold" className="shrink-0 text-brand-emerald" aria-label="Reassistido" />
      ) : (
        <CalendarBlankIcon size={10} className="shrink-0" />
      )}
      {compactDate(review.watchedOn)}
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

function Loading() {
  return (
    <div className="py-24 flex justify-center text-brand-slate/40">
      <CircleNotchIcon size={28} className="animate-spin" />
    </div>
  );
}
