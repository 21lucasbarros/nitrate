import type { Metadata } from "next";
import { OPEN_GRAPH_BASE, SITE_URL } from "@/lib/brand";
import { describe, fetchForMetadata } from "@/lib/seo";
import type { Movie } from "@/types/movie";
import { filmHref } from "@/utils/movie-link";
import { posterUrl } from "@/utils/poster";
import { JsonLd } from "@/app/components/json-ld";

type Props = { params: Promise<{ slug: string }> };

// a página é client component; o título, a prévia do link e os dados para o Google vêm daqui
function getFilm(slug: string) {
  return fetchForMetadata<Movie>(`/movies/slug/${encodeURIComponent(slug)}`);
}

function filmTitle(movie: Movie): string {
  return movie.releaseYear ? `${movie.title} (${movie.releaseYear})` : movie.title;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const movie = await getFilm((await params).slug);
  if (!movie) return { title: "Filme não encontrado", robots: { index: false } };

  const title = filmTitle(movie);
  const description =
    describe(movie.overview) ??
    `${title}${movie.director ? `, de ${movie.director}` : ""}: notas, reviews e listas no Nitrate.`;
  const poster = posterUrl(movie.posterPath, "w500");

  return {
    title,
    description,
    alternates: { canonical: filmHref(movie) },
    openGraph: {
      ...OPEN_GRAPH_BASE,
      type: "video.movie",
      title,
      description,
      url: filmHref(movie),
      images: poster ? [{ url: poster, width: 500, height: 750, alt: `Pôster de ${movie.title}` }] : undefined,
    },
    twitter: { card: "summary", title, description, images: poster ? [poster] : undefined },
  };
}

export default async function FilmLayout({ children, params }: Props & { children: React.ReactNode }) {
  const movie = await getFilm((await params).slug);
  return (
    <>
      {movie && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Movie",
            name: movie.title,
            url: `${SITE_URL}${filmHref(movie)}`,
            image: posterUrl(movie.posterPath, "w500") ?? undefined,
            description: describe(movie.overview, 300),
            dateCreated: movie.releaseYear ? String(movie.releaseYear) : undefined,
            genre: movie.genres.length > 0 ? movie.genres : undefined,
            director: movie.director ? { "@type": "Person", name: movie.director } : undefined,
          }}
        />
      )}
      {children}
    </>
  );
}
