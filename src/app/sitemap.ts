import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/brand";
import { getCatalog } from "@/lib/services/movie-service";
import type { Movie } from "@/types/movie";
import { filmHref } from "@/utils/movie-link";

// remontado uma vez por dia, com os filmes que entraram no acervo
export const revalidate = 86400;

const PAGE_SIZE = 60; // o máximo que o /movies/catalog devolve por página
const MAX_PAGES = 200; // trava de segurança: 12 mil filmes

async function catalogMovies(): Promise<Movie[]> {
  const first = await getCatalog(0, PAGE_SIZE);
  const pages = Math.min(first.totalPages, MAX_PAGES);
  const rest = await Promise.all(
    Array.from({ length: pages - 1 }, (_, i) => getCatalog(i + 1, PAGE_SIZE).then((page) => page.items)),
  );
  return [...first.items, ...rest.flat()];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/movies`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/termos`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/privacidade`, changeFrequency: "yearly", priority: 0.2 },
  ];

  // sem a API (ex.: fora do ar), o sitemap sai só com as páginas fixas
  let movies: Movie[] = [];
  try {
    movies = await catalogMovies();
  } catch {
    // segue sem os filmes
  }

  const films: MetadataRoute.Sitemap = movies
    .filter((movie) => movie.slug)
    .map((movie) => ({ url: `${SITE_URL}${filmHref(movie)}`, changeFrequency: "weekly", priority: 0.6 }));

  return [...pages, ...films];
}
