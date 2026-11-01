"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CircleNotchIcon } from "@phosphor-icons/react";

import Header from "@/app/components/header";
import { MovieGrid } from "@/app/components/movie-grid";
import { PersonPhoto } from "@/app/components/ui/person-photo";
import { ApiError } from "@/lib/api-client";
import { useFetch } from "@/lib/hooks/use-fetch";
import { getPerson } from "@/lib/services/person-service";
import { departmentLabel, type PersonCredit, type PersonDetail } from "@/types/person";
import { shortDate } from "@/utils/format";
import { movieHref } from "@/utils/movie-link";

const BIO_PREVIEW = 420;

export default function PersonPage() {
  const params = useParams<{ tmdbId: string }>();
  const tmdbId = Number(params.tmdbId);
  const validId = Number.isInteger(tmdbId) && tmdbId > 0 ? tmdbId : null;
  const person = useFetch(validId, getPerson);

  const notFound = validId === null || (person.error instanceof ApiError && person.error.status === 404);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Header />
      <main className="pt-28 sm:pt-32 pb-24 px-6 md:px-12 xl:px-24 max-w-[1400px] mx-auto">
        {notFound ? (
          <div className="py-32 text-center">
            <h1 className="text-3xl font-medium tracking-tight">Pessoa não encontrada.</h1>
            <Link href="/movies" className="inline-block mt-6 text-brand-blue hover:underline">Voltar para a busca</Link>
          </div>
        ) : !person.data ? (
          <div className="py-32 flex justify-center text-brand-slate/40">
            {person.error ? "Não foi possível carregar esta pessoa." : <CircleNotchIcon size={32} className="animate-spin" />}
          </div>
        ) : (
          <PersonView person={person.data} />
        )}
      </main>
    </div>
  );
}

function PersonView({ person }: { person: PersonDetail }) {
  const [bioExpanded, setBioExpanded] = useState(false);

  // quem dirigiu vê primeiro o que dirigiu; atores, onde atuaram.
  // o departamento do TMDB nem sempre ajuda (ex.: James Gunn está como "Writing")
  const directsFirst =
    person.department === "Directing" || (person.department !== "Acting" && person.directed.length > 0);
  const sections = [
    { title: "Dirigiu", credits: person.directed },
    { title: "Atuou em", credits: person.acted },
  ];
  if (!directsFirst) sections.reverse();

  const bio = person.biography?.trim() ?? "";
  const longBio = bio.length > BIO_PREVIEW;

  return (
    <>
      <section className="flex flex-col sm:flex-row gap-8 sm:gap-12 pb-14 border-b border-foreground/10">
        <PersonPhoto
          name={person.name}
          profilePath={person.profilePath}
          size="h632"
          sizes="224px"
          className="w-40 sm:w-48 md:w-56 shrink-0"
        />
        <div className="min-w-0 flex flex-col justify-center">
          <span className="text-xs font-bold tracking-[0.2em] uppercase text-brand-orange">
            {directsFirst ? "Direção" : departmentLabel(person.department)}
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tighter leading-[0.95] mt-2">
            {person.name}
          </h1>
          {person.birthday && (
            <p className="mt-4 text-sm text-brand-slate/60">
              Nascimento: {shortDate(person.birthday)}
              {person.deathday && <> · Falecimento: {shortDate(person.deathday)}</>}
            </p>
          )}
          {bio && (
            <div className="mt-5 max-w-3xl">
              <p className="text-base leading-relaxed text-foreground/80 font-light whitespace-pre-line">
                {longBio && !bioExpanded ? `${bio.slice(0, BIO_PREVIEW).trimEnd()}…` : bio}
              </p>
              {longBio && (
                <button
                  onClick={() => setBioExpanded(!bioExpanded)}
                  className="mt-2 text-sm font-medium text-brand-blue hover:underline"
                >
                  {bioExpanded ? "Mostrar menos" : "Ler mais"}
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {sections.map(({ title, credits }) =>
        credits.length > 0 ? <Filmography key={title} title={title} credits={credits} /> : null,
      )}
    </>
  );
}

function Filmography({ title, credits }: { title: string; credits: PersonCredit[] }) {
  return (
    <section className="pt-12">
      <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-brand-orange mb-6">
        {title} <span className="text-brand-slate/40 font-mono ml-1">{credits.length}</span>
      </h2>
      <MovieGrid
        showTitles
        items={credits.map((credit) => ({
          movie: {
            id: credit.id ?? `tmdb-${credit.tmdbId}`,
            title: credit.title,
            posterPath: credit.posterPath,
            releaseYear: credit.releaseYear,
          },
          href: movieHref(credit),
        }))}
      />
    </section>
  );
}
