import type { Metadata } from "next";
import { OPEN_GRAPH_BASE } from "@/lib/brand";
import { describe, fetchForMetadata } from "@/lib/seo";
import { seasonLabel, type SeriesReview } from "@/types/series";
import { posterUrl } from "@/utils/poster";
import { toRating } from "@/utils/rating";
import { stripMarkup } from "@/utils/review-markup";
import { seriesReviewHref } from "@/utils/series-link";
import { sameUsername } from "@/utils/username";

type Props = { params: Promise<{ username: string; id: string }> };

/** 3.5 → "★★★½", como nas prévias de link das reviews de filme */
function starsText(rating: number): string {
  return "★".repeat(Math.floor(rating)) + (rating % 1 ? "½" : "");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, id } = await params;
  const review = /^\d+$/.test(id) ? await fetchForMetadata<SeriesReview>(`/series/reviews/${id}`) : null;
  if (!review || !sameUsername(review.user.username, username)) {
    return { title: "Review não encontrada", robots: { index: false } };
  }

  const { series, user } = review;
  const season = review.seasonNumber !== null ? `, ${seasonLabel(review.seasonNumber)}` : "";
  const stars = review.rating !== null ? ` ${starsText(toRating(review.rating))}` : "";
  const title = `${user.name} sobre ${series.name}${season}`;
  // texto com spoiler fica de fora da prévia, como na página
  const text = review.text && !review.spoiler ? stripMarkup(review.text) : null;
  const description = describe(text) ?? `${user.name} assistiu ${series.name}${season}${stars} no Nitrate.`;
  const poster = posterUrl(series.posterPath, "w500");
  const path = seriesReviewHref(review);

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
      images: poster ? [{ url: poster, width: 500, height: 750, alt: `Pôster de ${series.name}` }] : undefined,
    },
    twitter: { card: "summary", title: `${title}${stars}`, description, images: poster ? [poster] : undefined },
  };
}

export default function SeriesReviewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
