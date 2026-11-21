"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CircleNotchIcon, StarIcon, TrophyIcon } from "@phosphor-icons/react";

import Header from "@/app/components/header";
import { MovieGrid } from "@/app/components/movie-grid";
import { PersonPhoto } from "@/app/components/ui/person-photo";
import { formatScore } from "@/app/components/ui/rating-meter";
import { ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useFetch } from "@/lib/hooks/use-fetch";
import { getPerson, getPersonProgress } from "@/lib/services/person-service";
import { departmentLabel, type PersonCredit, type PersonDetail, type PersonProgress } from "@/types/person";
import { shortDate } from "@/utils/format";
import { movieHref } from "@/utils/movie-link";

const BIO_PREVIEW = 420;

export default function PersonPage() {
  // slug ("ben-stiller") ou, nos links antigos, o id do TMDB (o layout redireciona para o slug)
  const params = useParams<{ slug: string }>();
  const ref = /^[a-z0-9-]{1,100}$/i.test(params.slug) ? params.slug : null;
  const person = useFetch(ref, getPerson);
  const { status } = useAuth();
  // quanto da filmografia eu já vi: só com sessão
  const progress = useFetch(status === "authenticated" && person.data ? person.data.tmdbId : null, getPersonProgress);

  const notFound = ref === null || (person.error instanceof ApiError && person.error.status === 404);

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
          <PersonView person={person.data} progress={progress.data ?? null} />
        )}
      </main>
    </div>
  );
}

function PersonView({ person, progress }: { person: PersonDetail; progress: PersonProgress | null }) {
  const { user: me } = useAuth();
  const [bioExpanded, setBioExpanded] = useState(false);

  // quem dirigiu vê primeiro o que dirigiu; atores, onde atuaram.
  // o departamento do TMDB nem sempre ajuda (ex.: James Gunn está como "Writing")
  const directsFirst =
    person.department === "Directing" || (person.department !== "Acting" && person.directed.length > 0);
  const sections: FilmographySection[] = [
    { id: "directed", title: "Dirigiu", credits: person.directed },
    { id: "acted", title: "Atuou em", credits: person.acted },
  ];
  if (!directsFirst) sections.reverse();

  const bio = person.biography?.trim() ?? "";
  const longBio = bio.length > BIO_PREVIEW;
  const stats = careerStats(person);
  // o progresso entra no lugar do período em atividade, entre os filmes e a média
  const watchedStat = progress && progress.total > 0 ? progressStat(progress, me?.username ?? null) : null;
  if (watchedStat) stats.splice(stats.length > 0 ? 1 : 0, 0, watchedStat);

  return (
    <>
      <section className="flex flex-col sm:flex-row sm:items-center gap-8 sm:gap-12 pb-12 border-b border-foreground/10">
        <PersonPhoto
          name={person.name}
          profilePath={person.profilePath}
          size="h632"
          sizes="224px"
          className="w-36 sm:w-44 md:w-52 shrink-0"
        />
        <div className="min-w-0 flex flex-col justify-center">
          <span className="text-xs font-bold tracking-[0.2em] uppercase text-brand-orange">
            {directsFirst ? "Direção" : departmentLabel(person.department)}
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tighter leading-[0.95] mt-2">
            {person.name}
          </h1>
          {person.birthday && (
            <p className="mt-4 text-sm text-brand-slate/70">
              Nascimento: {shortDate(person.birthday)}
              {!person.deathday && <> · {age(person.birthday)} anos</>}
              {person.deathday && <> · Falecimento: {shortDate(person.deathday)}</>}
            </p>
          )}
          {stats.length > 0 && (
            <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-4">
              {stats.map((stat) => {
                const content = (
                  <>
                    <dd className="text-2xl font-semibold tracking-tight tabular-nums inline-flex items-center gap-1.5">
                      {stat.icon}
                      {stat.value}
                    </dd>
                    <dt className="mt-0.5 text-[11px] uppercase tracking-wider text-brand-slate/60">{stat.label}</dt>
                  </>
                );
                return stat.href ? (
                  <Link key={stat.label} href={stat.href} title={stat.title} className="block hover:[&_dd]:text-brand-orange [&_dd]:transition-colors">
                    {content}
                  </Link>
                ) : (
                  <div key={stat.label} title={stat.title}>
                    {content}
                  </div>
                );
              })}
            </dl>
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

      <Filmography sections={sections.filter((s) => s.credits.length > 0)} />
    </>
  );
}

/** idade hoje a partir de "yyyy-mm-dd" */
function age(birthday: string): number {
  const [year, month, day] = birthday.split("-").map(Number);
  const now = new Date();
  const hadBirthday = now.getMonth() + 1 > month || (now.getMonth() + 1 === month && now.getDate() >= day);
  return now.getFullYear() - year - (hadBirthday ? 0 : 1);
}

interface Stat {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  href?: string;
  title?: string;
}

/** números da carreira no topo: filmes e a média dos filmes no Nitrate */
function careerStats(person: PersonDetail): Stat[] {
  const unique = new Map<number, PersonCredit>();
  for (const credit of [...person.directed, ...person.acted]) unique.set(credit.tmdbId, credit);
  const credits = [...unique.values()];
  const rated = credits.filter((c) => c.nitrateRating !== null);

  const stats: Stat[] = [];
  if (credits.length > 0) stats.push({ label: credits.length === 1 ? "filme" : "filmes", value: credits.length });
  if (rated.length > 0) {
    // média ponderada pelo número de pessoas que avaliaram cada filme
    const votes = rated.reduce((sum, c) => sum + c.nitrateRatings, 0);
    const avg = rated.reduce((sum, c) => sum + c.nitrateRating! * c.nitrateRatings, 0) / votes;
    stats.push({
      label: "média no Nitrate",
      value: formatScore(round1(avg)),
      icon: <StarIcon size={18} weight="fill" className="text-brand-orange" />,
    });
  }
  return stats;
}

/**
 * Quanto da filmografia você já viu. Só conta o que já foi lançado; arredonda para baixo,
 * para os 100% aparecerem só quando faltar nada. Completa e virou conquista: leva à aba do perfil.
 */
function progressStat(progress: PersonProgress, username: string | null): Stat {
  const { watched, total, achievement } = progress;
  const percent = Math.floor((watched / total) * 100);
  const complete = watched >= total;
  return {
    label: complete ? "filmografia completa" : `você viu ${watched} de ${total}`,
    value: `${percent}%`,
    icon: complete ? (
      <TrophyIcon size={20} weight="fill" className="text-brand-orange" />
    ) : (
      <ProgressRing value={watched / total} />
    ),
    href: achievement && username ? `/u/${username}?tab=conquistas` : undefined,
    title: complete
      ? `Você viu todos os ${total} filmes já lançados`
      : `Você viu ${watched} dos ${total} filmes já lançados`,
  };
}

function ProgressRing({ value }: { value: number }) {
  const radius = 7;
  const circumference = 2 * Math.PI * radius;
  return (
    <svg width={18} height={18} viewBox="0 0 18 18" aria-hidden="true" className="-rotate-90">
      <circle cx={9} cy={9} r={radius} fill="none" strokeWidth={2.5} className="stroke-foreground/15" />
      <circle
        cx={9}
        cy={9}
        r={radius}
        fill="none"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - value)}
        className="stroke-brand-orange"
      />
    </svg>
  );
}

const round1 = (value: number) => Math.round(value * 10) / 10;

interface FilmographySection {
  id: "directed" | "acted";
  title: string;
  credits: PersonCredit[];
}

type CreditSort = "newest" | "oldest" | "nitrate" | "tmdb" | "popular";

const SORTS: { id: CreditSort; label: string }[] = [
  { id: "newest", label: "Mais recentes" },
  { id: "oldest", label: "Mais antigos" },
  { id: "nitrate", label: "Nota no Nitrate" },
  { id: "tmdb", label: "Nota no TMDB" },
  { id: "popular", label: "Mais populares" },
];

// sem data vai para o fim em qualquer direção
const dateKey = (c: PersonCredit) => c.releaseDate ?? (c.releaseYear ? `${c.releaseYear}-12-31` : null);

function byDate(a: PersonCredit, b: PersonCredit, direction: 1 | -1): number {
  const da = dateKey(a);
  const db = dateKey(b);
  if (da === db) return 0;
  if (da === null) return 1;
  if (db === null) return -1;
  return da < db ? -direction : direction;
}

// notas nulas vão para o fim; empate desempata por quem tem mais votos
function byScore(a: number | null, b: number | null, votesA: number, votesB: number): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return b - a || votesB - votesA;
}

function sortCredits(credits: PersonCredit[], sort: CreditSort): PersonCredit[] {
  const sorted = [...credits];
  switch (sort) {
    case "newest":
      return sorted.sort((a, b) => byDate(a, b, -1));
    case "oldest":
      return sorted.sort((a, b) => byDate(a, b, 1));
    case "nitrate":
      return sorted.sort(
        (a, b) => byScore(a.nitrateRating, b.nitrateRating, a.nitrateRatings, b.nitrateRatings) || byDate(a, b, -1),
      );
    case "tmdb":
      return sorted.sort((a, b) => byScore(a.tmdbRating, b.tmdbRating, a.tmdbVotes, b.tmdbVotes) || byDate(a, b, -1));
    case "popular":
      return sorted.sort((a, b) => b.tmdbVotes - a.tmdbVotes || byDate(a, b, -1));
  }
}

function Filmography({ sections }: { sections: FilmographySection[] }) {
  const [activeId, setActiveId] = useState(sections[0]?.id);
  const [sort, setSort] = useState<CreditSort>("newest");
  const active = sections.find((s) => s.id === activeId) ?? sections[0];
  const credits = useMemo(() => (active ? sortCredits(active.credits, sort) : []), [active, sort]);
  if (!active) return null;

  const today = new Date().toISOString().slice(0, 10);
  const unratedOnNitrate = sort === "nitrate" && credits.every((c) => c.nitrateRating === null);

  return (
    <section className="pt-10">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 pb-4 mb-6 border-b border-foreground/10">
        {sections.length > 1 ? (
          <div role="tablist" className="flex gap-6 -mb-4">
            {sections.map((s) => (
              <button
                key={s.id}
                role="tab"
                aria-selected={s.id === active.id}
                onClick={() => setActiveId(s.id)}
                className={`pb-4 text-sm font-medium border-b-2 transition-colors ${s.id === active.id ? "border-brand-orange text-foreground" : "border-transparent text-brand-slate hover:text-foreground"}`}
              >
                {s.title}
                <span className="ml-1.5 text-xs font-normal text-brand-slate/60 tabular-nums">{s.credits.length}</span>
              </button>
            ))}
          </div>
        ) : (
          <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-brand-orange">
            {active.title} <span className="text-brand-slate/40 font-mono ml-1">{active.credits.length}</span>
          </h2>
        )}

        <div role="radiogroup" aria-label="Ordenar filmes" className="flex gap-1.5 overflow-x-auto -mx-6 px-6 lg:mx-0 lg:px-0 [scrollbar-width:none]">
          {SORTS.map((s) => (
            <button
              key={s.id}
              role="radio"
              aria-checked={sort === s.id}
              onClick={() => setSort(s.id)}
              className={`shrink-0 h-8 px-3 rounded-full border text-[13px] transition-colors ${sort === s.id ? "border-brand-orange/60 bg-brand-orange/10 text-foreground" : "border-foreground/15 text-brand-slate hover:text-foreground hover:border-foreground/30"}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {unratedOnNitrate && (
        <p className="mb-6 text-sm text-brand-slate/70">
          Ninguém avaliou estes filmes no Nitrate ainda. Que tal ser a primeira pessoa?
        </p>
      )}

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
          badge: creditBadge(credit, sort, today),
          // na direção a função é sempre "Director"; no elenco, o personagem
          subtitle: active.id === "acted" ? credit.role : null,
        }))}
      />
    </section>
  );
}

/** o selo do pôster acompanha a ordenação: a nota que está sendo comparada, ou "Em breve" */
function creditBadge(credit: PersonCredit, sort: CreditSort, today: string): React.ReactNode {
  if (sort === "nitrate" && credit.nitrateRating !== null) {
    return (
      <span title={`${credit.nitrateRatings} ${credit.nitrateRatings === 1 ? "avaliação" : "avaliações"} no Nitrate`} className="inline-flex items-center gap-1">
        <StarIcon size={11} weight="fill" className="text-brand-orange" />
        {formatScore(round1(credit.nitrateRating))}
      </span>
    );
  }
  if (sort === "tmdb" && credit.tmdbRating !== null) {
    return (
      <>
        <span className="text-[9px] font-bold tracking-wider text-[#01b4e4]">TMDB</span>
        {formatScore(round1(credit.tmdbRating))}
      </>
    );
  }
  if (credit.releaseDate && credit.releaseDate > today) {
    return <span className="text-brand-orange">Em breve</span>;
  }
  return null;
}
