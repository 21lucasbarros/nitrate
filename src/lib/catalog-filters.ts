/** filtros dos catálogos de /movies e /series (espelha CatalogoFiltro no back-end) */

export const CATALOG_SORTS = [
  { id: "padrao", label: "Ordem do catálogo" },
  { id: "lancamento", label: "Lançamento: mais novos" },
  { id: "lancamento-antigos", label: "Lançamento: mais antigos" },
  { id: "nota-tmdb", label: "Maior nota no TMDB" },
  // maior média no Nitrate entre os que várias pessoas avaliaram (era a fileira de mesmo nome)
  { id: "comunidade", label: "Mais bem avaliados pela comunidade" },
  { id: "titulo", label: "Título (A–Z)" },
] as const;

export type CatalogSort = (typeof CATALOG_SORTS)[number]["id"];

export const TMDB_MINIMUMS = [6, 7, 8] as const;
export const NITRATE_MINIMUMS = [3, 3.5, 4, 4.5] as const;

export interface CatalogFilters {
  genres: string[];
  minTmdb: number | null;
  minNitrate: number | null;
  sort: CatalogSort;
}

export const NO_FILTERS: CatalogFilters = { genres: [], minTmdb: null, minNitrate: null, sort: "padrao" };

export function hasFilters(filters: CatalogFilters): boolean {
  return filters.genres.length > 0 || filters.minTmdb !== null || filters.minNitrate !== null || filters.sort !== "padrao";
}

function pick<T extends number>(raw: string | null, allowed: readonly T[]): T | null {
  const value = Number(raw);
  return raw !== null && allowed.includes(value as T) ? (value as T) : null;
}

/** lê da URL da página (?genero=Terror&genero=Comédia&tmdb=7&nitrate=4&ordem=nota-tmdb) */
export function filtersFromUrl(params: URLSearchParams): CatalogFilters {
  const rawSort = params.get("ordem");
  return {
    genres: [...new Set(params.getAll("genero").filter(Boolean))],
    minTmdb: pick(params.get("tmdb"), TMDB_MINIMUMS),
    minNitrate: pick(params.get("nitrate"), NITRATE_MINIMUMS),
    sort: CATALOG_SORTS.some((s) => s.id === rawSort) ? (rawSort as CatalogSort) : "padrao",
  };
}

/** grava na URL da página só o que foge do padrão; o resto da query (ex.: ?q=) fica como está */
export function filtersToUrl(filters: CatalogFilters, current: URLSearchParams): string {
  const params = new URLSearchParams(current);
  // "decada" saiu dos filtros: some de links antigos na primeira mudança
  for (const key of ["genero", "decada", "tmdb", "nitrate", "ordem"]) params.delete(key);
  filters.genres.forEach((genre) => params.append("genero", genre));
  if (filters.minTmdb !== null) params.set("tmdb", String(filters.minTmdb));
  if (filters.minNitrate !== null) params.set("nitrate", String(filters.minNitrate));
  if (filters.sort !== "padrao") params.set("ordem", filters.sort);
  return params.toString();
}

/** parâmetros da API (/movies/catalog e /series/catalog) */
export function filtersToApi(filters: CatalogFilters): URLSearchParams {
  const params = new URLSearchParams();
  filters.genres.forEach((genre) => params.append("genre", genre));
  if (filters.minTmdb !== null) params.set("minTmdb", String(filters.minTmdb));
  if (filters.minNitrate !== null) params.set("minNitrate", String(filters.minNitrate));
  if (filters.sort !== "padrao") params.set("sort", filters.sort);
  return params;
}

/** chave estável para o useFetch: muda quando qualquer filtro muda */
export function filtersKey(filters: CatalogFilters): string {
  return filtersToApi(filters).toString();
}
