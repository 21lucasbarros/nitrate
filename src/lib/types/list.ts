import type { Movie } from "@/types/movie";
import type { Series } from "@/types/series";
import type { UserSummary } from "./user";

// Espelha MovieListDTO e MovieListRequestDTO do backend
export interface MovieList {
  id: number;
  slug: string; // endereço: /u/{dona}/lista/{slug}
  name: string;
  description: string | null;
  isPublic: boolean;
  filmsCount: number; // filmes e séries
  seriesCount: number;
  movies: Movie[]; // o mesmo recorte de `items`, só com os filmes
  items: ListItem[]; // nas listagens, só os primeiros (prévia); na página da lista, todos em ordem
  owner: UserSummary;
  official: boolean; // lista do Nitrate (da conta de sistema, criada pelo admin)
  createdAt: string; // ISO
  updatedAt: string; // ISO
  containsMovie: boolean | null; // só em getMyLists(movieId)
  likesCount: number;
  commentsCount: number;
  likedByMe: boolean | null; // null para visitantes
  savedByMe: boolean | null;
}

// Espelha ListItemDTO: um filme ou uma série da lista
export type ListItem =
  | { kind: "MOVIE"; movie: Movie; series: null }
  | { kind: "SERIES"; movie: null; series: Series };

/** "15 filmes", ou "15 títulos" quando a lista tem série */
export function listCountLabel(list: Pick<MovieList, "filmsCount" | "seriesCount">): string {
  const n = list.filmsCount;
  if (list.seriesCount > 0) return `${n} ${n === 1 ? "título" : "títulos"}`;
  return `${n} ${n === 1 ? "filme" : "filmes"}`;
}

/** os itens da lista; com a API de antes das séries (sem `items`), monta a partir dos filmes */
export function listItems(list: Pick<MovieList, "items" | "movies">): ListItem[] {
  return list.items ?? list.movies.map((movie): ListItem => ({ kind: "MOVIE", movie, series: null }));
}

/** pôster e título do item, sem precisar olhar o tipo */
export function listItemInfo(item: ListItem): { key: string; title: string; posterPath: string | null; year: number | null } {
  return item.kind === "SERIES"
    ? { key: `S${item.series.id}`, title: item.series.name, posterPath: item.series.posterPath, year: item.series.firstAirYear }
    : { key: `M${item.movie.id}`, title: item.movie.title, posterPath: item.movie.posterPath, year: item.movie.releaseYear };
}

// Espelha ListEngagementDTO: a resposta de curtir/salvar
export type ListEngagement = Pick<MovieList, "likesCount" | "commentsCount" | "likedByMe" | "savedByMe">;

// Espelha ListCommentDTO
export interface ListComment {
  id: number;
  user: UserSummary;
  text: string;
  createdAt: string; // ISO
}

export interface MovieListRequest {
  name: string;
  description: string;
  isPublic: boolean;
  movieIds: number[]; // só os filmes (clientes antigos); quem manda é `items`
  items: { kind: "MOVIE" | "SERIES"; id: number }[]; // a ordem do array é a ordem da lista
}
