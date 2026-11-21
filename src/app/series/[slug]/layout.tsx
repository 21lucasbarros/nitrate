import type { Metadata } from "next";
import { OPEN_GRAPH_BASE, SITE_URL } from "@/lib/brand";
import { describe, fetchForMetadata } from "@/lib/seo";
import { seriesYears, type Series } from "@/types/series";
import { seriesHref } from "@/utils/series-link";
import { posterUrl } from "@/utils/poster";
import { JsonLd } from "@/app/components/json-ld";

type Props = { params: Promise<{ slug: string }> };

// a página é client component; o título, a prévia do link e os dados para o Google vêm daqui
function getSeries(slug: string) {
  return fetchForMetadata<Series>(`/series/slug/${encodeURIComponent(slug)}`);
}

function seriesTitle(series: Series): string {
  const years = seriesYears(series);
  return years ? `${series.name} (${years})` : series.name;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const series = await getSeries((await params).slug);
  if (!series) return { title: "Série não encontrada", robots: { index: false } };

  const title = seriesTitle(series);
  const description =
    describe(series.overview) ??
    `${title}${series.creators ? `, criada por ${series.creators}` : ""}: temporadas, notas e reviews no Nitrate.`;
  const poster = posterUrl(series.posterPath, "w500");

  return {
    title,
    description,
    alternates: { canonical: seriesHref(series) },
    openGraph: {
      ...OPEN_GRAPH_BASE,
      type: "video.tv_show",
      title,
      description,
      url: seriesHref(series),
      images: poster ? [{ url: poster, width: 500, height: 750, alt: `Pôster de ${series.name}` }] : undefined,
    },
    twitter: { card: "summary", title, description, images: poster ? [poster] : undefined },
  };
}

export default async function SeriesLayout({ children, params }: Props & { children: React.ReactNode }) {
  const series = await getSeries((await params).slug);
  return (
    <>
      {series && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "TVSeries",
            name: series.name,
            url: `${SITE_URL}${seriesHref(series)}`,
            image: posterUrl(series.posterPath, "w500") ?? undefined,
            description: describe(series.overview, 300),
            startDate: series.firstAirYear ? String(series.firstAirYear) : undefined,
            endDate: series.lastAirYear ? String(series.lastAirYear) : undefined,
            numberOfSeasons: series.numberOfSeasons ?? undefined,
            genre: series.genres.length > 0 ? series.genres : undefined,
            creator: series.creators ? series.creators.split(", ").map((name) => ({ "@type": "Person", name })) : undefined,
          }}
        />
      )}
      {children}
    </>
  );
}
