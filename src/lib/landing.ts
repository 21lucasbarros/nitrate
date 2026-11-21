import { cachedFetcher } from "@/lib/cache";
import { getTopRatedMovies, getTrendingMovies } from "@/lib/services/movie-service";
import { getFeaturedReviews } from "@/lib/services/review-service";

// dados da landing (hero, reviews em destaque e CTA), com cache para as seções não repetirem a busca

// pôsteres de reserva, para as faixas nunca ficarem vazias (API fora do ar, comunidade ainda pequena)
export const FALLBACK_POSTERS = [
  "/Ae0pbv4E6YfqfN3UjKWIfQSzP9v.jpg",
  "/lzyh1lsD4Qaid6bG5zk57Y3bEM.jpg",
  "/y5ibL0vFnzsRiIHosw0WOfHtIj1.jpg",
  "/rFHzJrkO1kNIezb6rFog5oCJUEn.jpg",
  "/is1U9n0e9ofg50U1T7p2WZuIwiO.jpg",
  "/zNAw7jK8bwCK56rIW676pdgkwhd.jpg",
  "/AvMietG6xuobpSSdmVnKuTjv4bL.jpg",
];

// os filmes das faixas vêm da própria comunidade: em alta e mais bem avaliados
export const fetchLandingPosters = cachedFetcher(async () => {
  const [trending, topRated] = await Promise.all([
    getTrendingMovies().catch(() => []),
    getTopRatedMovies().catch(() => []),
  ]);
  const paths = [...trending, ...topRated].map((m) => m.posterPath).filter((p): p is string => Boolean(p));
  return [...new Set([...paths, ...FALLBACK_POSTERS])];
}, 10 * 60 * 1000);

export const fetchFeaturedReviews = cachedFetcher(() => getFeaturedReviews(), 10 * 60 * 1000);
