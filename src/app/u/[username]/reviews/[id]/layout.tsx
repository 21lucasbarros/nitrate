import type { Metadata } from "next";
import { OPEN_GRAPH_BASE } from "@/lib/brand";
import { describe, fetchForMetadata } from "@/lib/seo";
import type { MovieReview } from "@/lib/types/review";
import { posterUrl } from "@/utils/poster";
import { toRating } from "@/utils/rating";
import { stripMarkup } from "@/utils/review-markup";
import { sameUsername } from "@/utils/username";

type Props = { params: Promise<{ username: string; id: string }> };

/** 3.5 → "★★★½", como as notas aparecem no Letterboxd e nas prévias de link */
function starsText(rating: number): string {
  return "★".repeat(Math.floor(rating)) + (rating % 1 ? "½" : "");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, id } = await params;
  const review = /^\d+$/.test(id) ? await fetchForMetadata<MovieReview>(`/reviews/${id}`) : null;
  if (!review || !sameUsername(review.user.username, username)) {
    return { title: "Review não encontrada", robots: { index: false } };
  }

  const { movie, user } = review;
  const year = movie.releaseYear ? ` (${movie.releaseYear})` : "";
  const stars = review.rating !== null ? ` ${starsText(toRating(review.rating))}` : "";
  const title = `${user.name} sobre ${movie.title}${year}`;
  // texto com spoiler fica de fora da prévia, como na página
  const text = review.text && !review.spoiler ? stripMarkup(review.text) : null;
  const description = describe(text) ?? `${user.name} assistiu ${movie.title}${year}${stars} no Nitrate.`;
  const poster = posterUrl(movie.posterPath, "w500");
  const path = `/u/${user.username}/reviews/${review.id}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      ...OPEN_GRAPH_BASE,
      type: "article",
      title: `${title}${stars}`,
      description,
      url: path,
      images: poster ? [{ url: poster, width: 500, height: 750, alt: `Pôster de ${movie.title}` }] : undefined,
    },
    twitter: { card: "summary", title: `${title}${stars}`, description, images: poster ? [poster] : undefined },
  };
}

export default function ReviewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
