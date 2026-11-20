import type { Metadata } from "next";
import { OPEN_GRAPH_BASE, SITE_URL } from "@/lib/brand";
import { describe, fetchForMetadata } from "@/lib/seo";
import type { PersonDetail } from "@/types/person";
import { profileUrl } from "@/utils/poster";
import { JsonLd } from "@/app/components/json-ld";

type Props = { params: Promise<{ tmdbId: string }> };

function getPerson(tmdbId: string) {
  return /^\d+$/.test(tmdbId) ? fetchForMetadata<PersonDetail>(`/people/${tmdbId}`) : Promise.resolve(null);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tmdbId } = await params;
  const person = await getPerson(tmdbId);
  if (!person) return { title: "Pessoa não encontrada", robots: { index: false } };

  const known = [...person.directed, ...person.acted].slice(0, 3).map((credit) => credit.title);
  const description =
    describe(person.biography) ??
    `Filmes de ${person.name}${known.length > 0 ? `, como ${known.join(", ")}` : ""}, no Nitrate.`;
  const photo = profileUrl(person.profilePath, "h632");
  const path = `/person/${person.tmdbId}`;

  return {
    title: person.name,
    description,
    alternates: { canonical: path },
    openGraph: {
      ...OPEN_GRAPH_BASE,
      type: "profile",
      title: person.name,
      description,
      url: path,
      images: photo ? [{ url: photo, alt: person.name }] : undefined,
    },
    twitter: { card: "summary", title: person.name, description, images: photo ? [photo] : undefined },
  };
}

export default async function PersonLayout({ children, params }: Props & { children: React.ReactNode }) {
  const person = await getPerson((await params).tmdbId);
  return (
    <>
      {person && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Person",
            name: person.name,
            url: `${SITE_URL}/person/${person.tmdbId}`,
            image: profileUrl(person.profilePath, "h632") ?? undefined,
            description: describe(person.biography, 300),
            birthDate: person.birthday ?? undefined,
            deathDate: person.deathday ?? undefined,
          }}
        />
      )}
      {children}
    </>
  );
}
