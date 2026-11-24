import { DECADES, type CatalogSort } from "./catalog-filters";
import { getCatalog } from "./services/movie-service";
import { getSeriesCatalog } from "./services/series-service";
import { filmHref } from "@/utils/movie-link";
import { seriesHref } from "@/utils/series-link";

/**
 * "Não sabe o que quer assistir?": as respostas do questionário viram buscas no catálogo
 * (os mesmos filtros de /movies e /series) e o resultado é sorteado entre o que voltou.
 */

export type PickKind = "movies" | "series";

// os gêneros vêm do catálogo (TMDB em português, e nas séries às vezes em inglês, como
// "Action & Adventure"): cada clima casa com pedaços do nome, sem acento e em minúsculas
export const MOODS = [
  { id: "rir", label: "Quero rir", hint: "Algo leve e divertido", keywords: ["comedia"] },
  { id: "tensao", label: "Quero tensão", hint: "Suspense, medo, roer as unhas", keywords: ["terror", "thriller", "suspense", "misterio"] },
  { id: "emocao", label: "Quero me emocionar", hint: "Uma história que fica", keywords: ["drama", "romance"] },
  { id: "adrenalina", label: "Quero adrenalina", hint: "Ação, aventura, explosões", keywords: ["acao", "aventura", "action", "adventure", "guerra", "war"] },
  { id: "viajar", label: "Quero viajar", hint: "Outros mundos e outras realidades", keywords: ["ficcao", "fantasia", "sci-fi", "fantasy", "animacao"] },
  { id: "pensar", label: "Quero pensar", hint: "Crimes, mistérios e histórias reais", keywords: ["documentario", "crime", "historia", "misterio"] },
] as const;

export const COMPANIES = [
  { id: "sozinho", label: "Sozinho", hint: "Só eu e a tela", keywords: [] },
  { id: "par", label: "Em casal", hint: "Para dividir o sofá", keywords: ["romance", "comedia", "drama"] },
  { id: "amigos", label: "Com amigos", hint: "Para comentar junto", keywords: ["comedia", "acao", "action", "terror", "aventura"] },
  { id: "familia", label: "Em família", hint: "Para todas as idades", keywords: [] },
] as const;

// "em família" é obrigatório (todos os gêneros marcados na busca), e não só uma sugestão
const FAMILY_KEYWORDS = ["familia", "kids", "animacao"];

export const ERAS = [
  { id: "recentes", label: "Bem recente", hint: `Dos anos ${DECADES[0]} para cá`, decades: [DECADES[0]] },
  { id: "2000", label: "Anos 2000 e 2010", hint: "Os que marcaram as últimas décadas", decades: [2010, 2000] },
  { id: "80", label: "Anos 80 e 90", hint: "Clima de locadora", decades: [1990, 1980] },
  { id: "classicos", label: "Clássicos", hint: "Antes dos anos 80", decades: [1970, 1960, 1950] },
  { id: "qualquer", label: "Tanto faz", hint: "Qualquer época", decades: [] },
] as const;

export const STYLES = [
  // na ordem do catálogo, e não por nota: "nota-tmdb" põe na frente os obscuros com nota 10 de poucos votos
  { id: "aclamados", label: "Os mais aclamados", hint: "Nota 7+ no TMDB", minTmdb: 7, sort: "padrao" },
  { id: "comunidade", label: "Os queridinhos do Nitrate", hint: "O que a comunidade mais curtiu", minTmdb: null, sort: "comunidade" },
  { id: "surpresa", label: "Me surpreenda", hint: "Qualquer coisa do catálogo", minTmdb: null, sort: "padrao" },
] as const satisfies readonly { id: string; label: string; hint: string; minTmdb: number | null; sort: CatalogSort }[];

type Id<T extends readonly { id: string }[]> = T[number]["id"];

export interface PickAnswers {
  mood: Id<typeof MOODS> | null; // null: pulou ("tanto faz")
  genres: string[]; // escolhidos à mão: combinam com o clima ("quero rir" + Terror = comédia de terror)
  company: Id<typeof COMPANIES> | null;
  era: Id<typeof ERAS> | null;
  style: Id<typeof STYLES> | null;
}

export const NO_ANSWERS: PickAnswers = { mood: null, genres: [], company: null, era: null, style: null };

export interface PickResult {
  key: string;
  title: string;
  year: number | null;
  posterPath: string | null;
  href: string;
  rating: number | null;
  overview: string | null;
  /** posição na busca que achou o título (0 = primeiro): no catálogo, os conhecidos vêm antes */
  position: number;
  /** por que entrou: os gêneros e a década da busca que achou o título */
  tags: string[];
}

export interface PickOutcome {
  items: PickResult[];
  /** quantos do começo de `items` batem com todas as respostas */
  exact: number;
  /** o que precisou ser deixado de lado para completar a lista */
  relaxed: string | null;
}

const PAGE_SIZE = 40;
const PER_QUERY = 20; // de cada busca, só o começo (o mais bem ordenado) entra no sorteio
const MAX_QUERIES = 6;
export const MIN_RESULTS = 6;

const normalize = (text: string) => text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/** os gêneros do catálogo que casam com algum dos pedaços */
function matching(genres: string[], keywords: readonly string[]): string[] {
  return genres.filter((genre) => keywords.some((k) => normalize(genre).includes(k)));
}

interface Query {
  genres: string[]; // todos precisam bater (é assim que o catálogo filtra)
  decade: number | null;
}

interface Plan {
  queries: Query[];
  minTmdb: number | null;
  sort: CatalogSort;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

type Drop = { era?: boolean; company?: boolean; mood?: boolean; genres?: boolean; style?: boolean };

function plan(answers: PickAnswers, catalogGenres: string[], drop: Drop): Plan {
  const style = (!drop.style && STYLES.find((s) => s.id === answers.style)) || STYLES[2];
  const mood = drop.mood ? undefined : MOODS.find((m) => m.id === answers.mood);
  const company = drop.company ? undefined : COMPANIES.find((c) => c.id === answers.company);
  const era = drop.era ? undefined : ERAS.find((e) => e.id === answers.era);

  // cada gênero do clima é uma busca à parte: "quero tensão" é terror OU thriller, não os dois
  let genreSets: string[][] = [];
  if (!drop.genres) {
    const moodGenres = mood ? matching(catalogGenres, mood.keywords) : [];
    if (answers.genres.length > 0 && moodGenres.length > 0) {
      // gênero marcado + clima combinam: "quero rir" + Terror = comédia E terror. Se o gênero
      // marcado já é do clima ("quero rir" + Comédia), ele vale sozinho
      genreSets = answers.genres.flatMap((g) => (moodGenres.includes(g) ? [[g]] : moodGenres.map((m) => [g, m])));
    } else {
      const pool = answers.genres.length > 0 ? answers.genres : moodGenres;
      genreSets = pool.map((g) => [g]);
    }
    if (genreSets.length === 0 && company) genreSets = matching(catalogGenres, company.keywords).map((g) => [g]);
  }

  if (company?.id === "familia") {
    const family = matching(catalogGenres, FAMILY_KEYWORDS);
    if (family.length > 0) {
      genreSets = genreSets.length > 0
        ? genreSets.flatMap((set) => family.filter((f) => !set.includes(f)).map((f) => [...set, f]))
        : family.map((f) => [f]);
    }
  }
  if (genreSets.length === 0) genreSets = [[]];

  const decades: (number | null)[] = era && era.decades.length > 0 ? [...era.decades] : [null];
  const queries = genreSets.flatMap((genres) => decades.map((decade) => ({ genres, decade })));
  return { queries: shuffle(queries).slice(0, MAX_QUERIES), minTmdb: style.minTmdb, sort: style.sort };
}

function apiParams(query: Query, p: Plan): URLSearchParams {
  const params = new URLSearchParams();
  query.genres.forEach((g) => params.append("genre", g));
  if (query.decade !== null) params.set("decade", String(query.decade));
  if (p.minTmdb !== null) params.set("minTmdb", String(p.minTmdb));
  if (p.sort !== "padrao") params.set("sort", p.sort);
  return params;
}

function tagsOf(query: Query): string[] {
  return [...query.genres, ...(query.decade !== null ? [`Anos ${query.decade}`] : [])];
}

/** busca, junta e tira o que se repete e o que ainda não estreou */
async function run(kind: PickKind, p: Plan): Promise<PickResult[]> {
  const year = new Date().getFullYear();
  const pages = await Promise.allSettled(
    p.queries.map(async (query) => {
      const params = apiParams(query, p);
      const tags = tagsOf(query);
      if (kind === "movies") {
        const page = await getCatalog(0, PAGE_SIZE, params);
        return page.items
          .filter((m) => m.released !== false && (m.releaseYear === null || m.releaseYear <= year))
          .slice(0, PER_QUERY)
          .map<PickResult>((m, position) => ({
            key: `m-${m.id}`, title: m.title, year: m.releaseYear, posterPath: m.posterPath, href: filmHref(m), rating: m.rating, overview: m.overview || null, position, tags,
          }));
      }
      const page = await getSeriesCatalog(0, PAGE_SIZE, params);
      return page.items
        .filter((s) => s.firstAirYear === null || s.firstAirYear <= year)
        .slice(0, PER_QUERY)
        .map<PickResult>((s, position) => ({
          key: `s-${s.id ?? s.tmdbId}`, title: s.name, year: s.firstAirYear, posterPath: s.posterPath, href: seriesHref(s), rating: s.rating, overview: s.overview || null, position, tags,
        }));
    }),
  );

  if (pages.every((r) => r.status === "rejected")) throw (pages[0] as PromiseRejectedResult).reason;
  const byKey = new Map<string, PickResult>();
  for (const r of pages) {
    if (r.status !== "fulfilled") continue;
    for (const item of r.value) if (!byKey.has(item.key)) byKey.set(item.key, item);
  }
  return [...byKey.values()];
}

/**
 * Busca com todas as respostas; se não sobrar o bastante, vai abrindo mão da época, da companhia,
 * da combinação com o clima e dos gêneros. O que bate com tudo fica sempre na frente: as buscas
 * mais soltas só completam a lista.
 */
export async function findPicks(kind: PickKind, answers: PickAnswers, catalogGenres: string[]): Promise<PickOutcome> {
  // só entra no afrouxamento o que foi respondido de fato ("tanto faz" não tem do que abrir mão)
  const hasEra = (ERAS.find((e) => e.id === answers.era)?.decades.length ?? 0) > 0;
  const hasCompany = answers.company !== null && answers.company !== "sozinho";
  const hasCombo = answers.genres.length > 0 && answers.mood !== null;
  const hasGenres = answers.genres.length > 0 || answers.mood !== null;
  // a comunidade ainda avaliou pouca coisa (nas séries, quase nada): o estilo também pode cair
  const hasStyle = answers.style !== null && answers.style !== "surpresa";
  const dimensions: { key: keyof Drop; label: string }[] = [
    ...(hasStyle && answers.style === "comunidade" ? [{ key: "style" as const, label: "os queridinhos do Nitrate" }] : []),
    ...(hasEra ? [{ key: "era" as const, label: "a época" }] : []),
    ...(hasCompany ? [{ key: "company" as const, label: "a companhia" }] : []),
    ...(hasCombo ? [{ key: "mood" as const, label: "o clima" }] : []),
    ...(hasGenres ? [{ key: "genres" as const, label: "os gêneros" }] : []),
    ...(hasStyle && answers.style === "aclamados" ? [{ key: "style" as const, label: "a nota mínima" }] : []),
  ];

  const surprise = answers.style === "surpresa";
  const byKey = new Map<string, PickResult>();
  let exact = 0;
  let relaxed: string | null = null;
  for (let dropped = 0; dropped <= dimensions.length; dropped++) {
    const off = dimensions.slice(0, dropped);
    const drop: Drop = Object.fromEntries(off.map((d) => [d.key, true]));
    const found = rank(await run(kind, plan(answers, catalogGenres, drop)), surprise).filter((item) => !byKey.has(item.key));
    found.forEach((item) => byKey.set(item.key, item));
    if (dropped === 0) exact = byKey.size;
    else if (found.length > 0) relaxed = listJoin(off.map((d) => d.label));
    if (byKey.size >= MIN_RESULTS) break;
  }
  // sem pôster, por último (mesmo os que batem com tudo): ficam feios no destaque e nas miniaturas
  const items = [...byKey.values()].sort((a, b) => Number(!a.posterPath) - Number(!b.posterPath));
  return { items, exact, relaxed };
}

/**
 * As melhores notas primeiro, com um pouco de sorte para cada resposta não dar sempre o mesmo.
 * Acima de 8,5 conta como 8,5: nota 10 no TMDB costuma ser de poucos votos. Sem pôster ou sem
 * sinopse (os obscuros) e lá no fim da busca, perde pontos. "Me surpreenda" é só sorte, mas os
 * sem pôster ainda vão para o fim.
 */
function rank(items: PickResult[], surprise: boolean): PickResult[] {
  const penalty = (item: PickResult) => (item.posterPath ? 0 : 4) + (item.overview ? 0 : 1.5);
  if (surprise) return shuffle(items).sort((a, b) => Number(!a.posterPath) - Number(!b.posterPath));
  return items
    .map((item) => ({
      item,
      score: Math.min(item.rating ?? 5, 8.5) - penalty(item) - (item.position / PER_QUERY) * 1.5 + Math.random() * 1.5,
    }))
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
}

/** ["a", "b", "c"] → "a, b e c" */
function listJoin(parts: string[]): string {
  return parts.length <= 1 ? parts.join("") : `${parts.slice(0, -1).join(", ")} e ${parts[parts.length - 1]}`;
}
