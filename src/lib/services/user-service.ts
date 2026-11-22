import { apiFetch } from "../api-client";
import type { FilmEntry, MovieReview, MovieUserState, Recommendation, WatchlistItem } from "../types/review";
import type { Page } from "../types/page";
import type { AuthResponse } from "../types/auth";
import type { AppNotification, MovieBackdrops, ProfileUpdate, SimilarUser, UserProfile, UserSummary } from "../types/user";
import type { Movie } from "@/types/movie";
import type { SeriesReview } from "@/types/series";
import type { FavoritePeople, FavoritePeopleKind, FavoritePerson } from "@/types/person";
import type { Activity } from "./friends-service";

export function getMe(): Promise<UserProfile> {
  return apiFetch<UserProfile>("/users/me");
}

export function updateMyProfile(data: ProfileUpdate): Promise<UserProfile> {
  return apiFetch<UserProfile>("/users/me/profile", { method: "PUT", body: JSON.stringify(data) });
}

/** a foto vai como multipart; o backend recorta, reduz e devolve o perfil atualizado */
export function uploadMyAvatar(image: Blob): Promise<UserProfile> {
  const body = new FormData();
  body.append("file", image, "avatar.jpg");
  return apiFetch<UserProfile>("/users/me/avatar", { method: "PUT", body });
}

export function removeMyAvatar(): Promise<UserProfile> {
  return apiFetch<UserProfile>("/users/me/avatar", { method: "DELETE" });
}

/** cópia de tudo o que o Nitrate guarda sobre a pessoa (LGPD) */
export function exportMyData(): Promise<unknown> {
  return apiFetch<unknown>("/users/me/export");
}

/** troca a senha; o backend derruba as outras sessões e devolve um token novo para esta */
export function changeMyPassword(currentPassword: string, newPassword: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/users/me/password", {
    method: "PUT",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

/** troca o e-mail; o token guarda o e-mail, então o backend devolve um token novo para esta sessão */
export function changeMyEmail(email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/users/me/email", {
    method: "PUT",
    body: JSON.stringify({ email, password }),
  });
}

/** as cenas de um filme do TMDB, para escolher o fundo do perfil */
export function getMovieBackdrops(tmdbId: number): Promise<MovieBackdrops> {
  return apiFetch<MovieBackdrops>(`/movies/tmdb/${tmdbId}/backdrops`);
}

/** fundo do topo do perfil: uma das cenas de getMovieBackdrops */
export function setMyCover(tmdbId: number, path: string): Promise<UserProfile> {
  return apiFetch<UserProfile>("/users/me/cover", { method: "PUT", body: JSON.stringify({ tmdbId, path }) });
}

/** volta para a cena do primeiro filme favorito */
export function removeMyCover(): Promise<UserProfile> {
  return apiFetch<UserProfile>("/users/me/cover", { method: "DELETE" });
}

/** exclusão definitiva; a senha confirma que é a dona da conta */
export function deleteMyAccount(password: string): Promise<void> {
  return apiFetch<void>("/users/me", { method: "DELETE", body: JSON.stringify({ password }) });
}

export function getMyNotifications(): Promise<AppNotification[]> {
  return apiFetch<AppNotification[]>("/users/me/notifications");
}

export function getUnreadNotificationsCount(): Promise<{ count: number }> {
  return apiFetch<{ count: number }>("/users/me/notifications/unread-count");
}

export function markNotificationsRead(): Promise<void> {
  return apiFetch<void>("/users/me/notifications/read", { method: "POST" });
}

export function getMyRecommendations(): Promise<Recommendation[]> {
  return apiFetch<Recommendation[]>("/users/me/recommendations");
}

export function getMovieState(movieId: number): Promise<MovieUserState> {
  return apiFetch<MovieUserState>(`/users/me/movies/${movieId}`);
}

/** tudo o que eu fiz com o filme (registros, watchlist, listas, curtidas e comentários), do mais recente ao mais antigo */
export function getMyMovieActivity(movieId: number): Promise<Activity[]> {
  return apiFetch<Activity[]>(`/users/me/movies/${movieId}/activity`);
}

export function getProfile(username: string): Promise<UserProfile> {
  return apiFetch<UserProfile>(`/users/${encodeURIComponent(username)}`);
}

/** diário paginado (page começa em 0); withText = só reviews escritas */
export function getUserReviews(
  username: string,
  { page, size, withText = false }: { page: number; size: number; withText?: boolean },
): Promise<Page<MovieReview>> {
  return apiFetch<Page<MovieReview>>(
    `/users/${encodeURIComponent(username)}/reviews?page=${page}&size=${size}&withText=${withText}`,
  );
}

// Espelha DiaryEntryDTO: um registro de filme ou de série; o outro campo vem nulo
export type DiaryEntry =
  | { kind: "MOVIE"; review: MovieReview; seriesReview: null }
  | { kind: "SERIES"; review: null; seriesReview: SeriesReview };

export type DiaryType = "tudo" | "filmes" | "series";

/** diário da aba Reviews: filmes e séries juntos, do que assistiu por último para trás */
export function getUserDiary(
  username: string,
  { page, size, withText, type }: { page: number; size: number; withText: boolean; type: DiaryType },
): Promise<Page<DiaryEntry>> {
  const params = new URLSearchParams({ page: String(page), size: String(size), withText: String(withText) });
  if (type !== "tudo") params.set("type", type);
  return apiFetch<Page<DiaryEntry>>(`/users/${encodeURIComponent(username)}/diary?${params}`);
}

/** ordens da aba "Filmes" (espelha UserService.OrdemFilmes) */
export const FILM_SORTS = [
  { id: "lancamento", label: "Lançamento: mais novos" },
  { id: "lancamento-antigos", label: "Lançamento: mais antigos" },
  { id: "nota", label: "Maior nota" },
  { id: "nota-menor", label: "Menor nota" },
  { id: "assistidos", label: "Assistidos recentemente" },
  { id: "titulo", label: "Título (A–Z)" },
] as const;

export type FilmSort = (typeof FILM_SORTS)[number]["id"];

/** todos os filmes assistidos, um item por filme (com todas as vezes que a pessoa assistiu) */
export async function getUserFilms(
  username: string,
  { page, size, sort, liked = false }: { page: number; size: number; sort: FilmSort; liked?: boolean },
): Promise<Page<FilmEntry>> {
  const data = await apiFetch<Page<FilmEntry | MovieReview>>(
    `/users/${encodeURIComponent(username)}/films?page=${page}&size=${size}&sort=${sort}&liked=${liked}`,
  );
  return { ...data, items: data.items.map(toFilmEntry) };
}

/**
 * O site e a API são publicados separadamente: uma API anterior ao FilmDTO devolve só a review
 * mais recente. Nesse caso o filme vira "assistido uma vez", em vez de a aba quebrar.
 */
function toFilmEntry(item: FilmEntry | MovieReview): FilmEntry {
  if ("viewings" in item && Array.isArray(item.viewings)) return item;
  const review = item as MovieReview;
  return {
    review,
    viewings: [
      {
        id: review.id,
        watchedOn: review.watchedOn,
        rating: review.rating,
        liked: review.liked,
        rewatch: review.rewatch,
        hasText: !!review.text,
      },
    ],
  };
}

export function getUserWatchlist(username: string): Promise<WatchlistItem[]> {
  return apiFetch<WatchlistItem[]>(`/users/${encodeURIComponent(username)}/watchlist`);
}

/** o que as pessoas que eu sigo registraram por último */
export function getMyFeed(limit: number): Promise<MovieReview[]> {
  return apiFetch<MovieReview[]>(`/users/me/feed?limit=${limit}`);
}

export const MAX_FAVORITES = 5;

/** substitui a lista inteira de favoritos; a ordem do array é a ordem do perfil */
export function setMyFavorites(movieIds: number[]): Promise<Movie[]> {
  return apiFetch<Movie[]>("/users/me/favorites", { method: "PUT", body: JSON.stringify({ movieIds }) });
}

export const MAX_FAVORITE_PEOPLE = 5;

export function getFavoritePeople(username: string): Promise<FavoritePeople> {
  return apiFetch<FavoritePeople>(`/users/${encodeURIComponent(username)}/favorites/people`);
}

/** substitui a lista inteira (atores ou diretores); a ordem do array é a ordem do perfil */
export function setMyFavoritePeople(kind: FavoritePeopleKind, tmdbIds: number[]): Promise<FavoritePerson[]> {
  return apiFetch<FavoritePerson[]>(`/users/me/favorites/${kind}`, { method: "PUT", body: JSON.stringify({ tmdbIds }) });
}

export function followUser(username: string): Promise<void> {
  return apiFetch<void>(`/users/${encodeURIComponent(username)}/follow`, { method: "POST" });
}

export function unfollowUser(username: string): Promise<void> {
  return apiFetch<void>(`/users/${encodeURIComponent(username)}/follow`, { method: "DELETE" });
}

export function getFollowers(username: string): Promise<UserSummary[]> {
  return apiFetch<UserSummary[]>(`/users/${encodeURIComponent(username)}/followers`);
}

export function getFollowing(username: string): Promise<UserSummary[]> {
  return apiFetch<UserSummary[]>(`/users/${encodeURIComponent(username)}/following`);
}

/** quem avaliou os mesmos filmes com notas parecidas (sem quem eu já sigo) */
export function getSimilarUsers(): Promise<SimilarUser[]> {
  return apiFetch<SimilarUser[]>("/users/me/similar");
}

export function searchUsers(query: string): Promise<UserSummary[]> {
  return apiFetch<UserSummary[]>(`/users/search?q=${encodeURIComponent(query.normalize("NFC"))}`);
}
