import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { OPEN_GRAPH_BASE, SITE_URL } from "@/lib/brand";
import { describe, fetchForMetadata } from "@/lib/seo";
import type { PersonDetail } from "@/types/person";
import { profileUrl } from "@/utils/poster";
import { personHref } from "@/utils/person-link";
import { JsonLd } from "@/app/components/json-ld";

// slug ("ben-stiller") ou, nos links antigos, o id do TMDB
type Props = { params: Promise<{ slug: string }> };

function getPerson(ref: string) {
  return /^[a-z0-9-]{1,100}$/i.test(ref) ? fetchForMetadata<PersonDetail>(`/people/${ref}`) : Promise.resolve(null);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const person = await getPerson(slug);
  if (!person) return { title: "Pessoa não encontrada", robots: { index: false } };

  const known = [...person.directed, ...person.acted].slice(0, 3).map((credit) => credit.title);
  const description =
    describe(person.biography) ??
    `Filmes de ${person.name}${known.length > 0 ? `, como ${known.join(", ")}` : ""}, no Nitrate.`;
  const photo = profileUrl(person.profilePath, "h632");
  const path = personHref(person);

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
  const { slug } = await params;
  const person = await getPerson(slug);
  // /person/7399 e /person/Ben-Stiller viram /person/ben-stiller
  if (person?.slug && person.slug !== slug) permanentRedirect(personHref(person));
  return (
    <>
      {person && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Person",
            name: person.name,
            url: `${SITE_URL}${personHref(person)}`,
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
