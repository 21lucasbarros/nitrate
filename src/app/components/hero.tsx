"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { useFetch } from "@/lib/hooks/use-fetch";
import { FALLBACK_POSTERS, fetchFeaturedReviews, fetchLandingPosters } from "@/lib/landing";
import type { MovieReview } from "@/lib/types/review";
import { fillTo } from "@/utils/fill";
import { posterUrl } from "@/utils/poster";
import { stripMarkup } from "@/utils/review-markup";
import { formatScore } from "./ui/rating-meter";

const COLUMNS = 3;
const MIN_PER_COLUMN = 7;

// cada coluna anda num sentido e numa velocidade, para a parede não parecer uma esteira só
const COLUMN_MOTION = [
  "animate-[marquee-up_70s_linear_infinite]",
  "animate-[marquee-down_85s_linear_infinite]",
  "animate-[marquee-up_60s_linear_infinite]",
];

// granulado de película, o mesmo do hover dos pôsteres
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

const rise = (delay: number) => ({ animationDelay: `${delay}ms` });
const riseClass = "animate-[hero-rise_700ms_cubic-bezier(0.2,0.8,0.2,1)_both] motion-reduce:animate-none";

export default function Hero() {
  const posters = useFetch("posters", fetchLandingPosters);
  const featured = useFetch("featured", fetchFeaturedReviews);

  const paths = posters.data ?? FALLBACK_POSTERS;
  const columns = Array.from({ length: COLUMNS }, (_, c) =>
    fillTo(paths.filter((_, i) => i % COLUMNS === c), MIN_PER_COLUMN),
  );
  // as legendas são reviews de verdade, com texto e sem spoiler
  const reviews = (featured.data ?? []).filter((r) => r.text?.trim() && !r.spoiler);

  return (
    <section className="relative overflow-hidden">
      {/* luz do projetor vindo do canto, e o granulado da película por cima de tudo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 right-[-10%] w-[900px] h-[900px] bg-[radial-gradient(closest-side,rgba(255,122,51,0.16),transparent)]"
      />
      <div
        aria-hidden="true"
        style={{ backgroundImage: GRAIN }}
        className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay"
      />

      <div className="relative pt-28 sm:pt-32 lg:pt-0 px-6 md:px-12 xl:px-24 max-w-[1600px] mx-auto lg:min-h-screen grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] gap-12 lg:gap-8 items-center">
        <div className="lg:py-32">
          {/* a borda de um rolo de película: perfurações e a marcação "NITRATE FILM" que vinha impressa nela */}
          <div style={rise(0)} className={`${riseClass} max-w-md`} aria-hidden="true">
            <div className="h-2.5 bg-[repeating-linear-gradient(to_right,rgba(236,237,238,0.14)_0_10px,transparent_10px_18px)] rounded-[1px]" />
            <p className="mt-2.5 flex items-center gap-3 font-mono text-[11px] tracking-[0.28em] uppercase">
              <span className="text-brand-orange">Nitrate film</span>
              <span className="text-brand-slate/40">▸ 35</span>
              <span className="text-brand-slate/40">▸ Diário de cinema</span>
            </p>
          </div>

          <h1
            style={rise(80)}
            className={`${riseClass} mt-10 text-5xl sm:text-7xl md:text-8xl lg:text-[4.5rem] xl:text-[5.25rem] 2xl:text-[6.5rem] leading-[0.95] font-semibold tracking-tighter text-foreground`}
          >
            A sétima arte,
            <br />
            catalogada<span className="text-brand-orange">.</span>
          </h1>

          <p
            style={rise(160)}
            className={`${riseClass} mt-7 text-lg text-brand-slate max-w-md leading-relaxed`}
          >
            Anote cada filme que você vê e cada série que acompanha, até episódio por episódio, com data, nota
            em meia estrela e o que ficou na cabeça depois dos créditos. Seu diário, suas listas e o que seus
            amigos andam assistindo.
          </p>

          <div style={rise(240)} className={`${riseClass} mt-9 flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-7`}>
            <Link
              href="/sign-in"
              className="group inline-flex items-center justify-center gap-2.5 h-12 px-6 rounded-md bg-brand-btn text-brand-btn-text text-[15px] font-semibold hover:brightness-110 transition"
            >
              Começar meu diário
              <ArrowRightIcon size={16} weight="bold" className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/importar"
              className="text-[15px] text-brand-slate hover:text-foreground underline decoration-foreground/20 underline-offset-[6px] hover:decoration-brand-orange transition-colors"
            >
              Vem do Letterboxd? Traga seu histórico
            </Link>
          </div>

          <p style={rise(320)} className={`${riseClass} mt-14 font-mono text-[11px] tracking-[0.2em] uppercase text-brand-slate/45`}>
            Gratuito · Sem anúncios · Seus dados exportáveis
          </p>
        </div>

        <PosterWall columns={columns} reviews={reviews} />
      </div>
    </section>
  );
}

/** parede de pôsteres em perspectiva, com as reviews passando como legendas na frente */
function PosterWall({ columns, reviews }: { columns: string[][]; reviews: MovieReview[] }) {
  return (
    <div className="relative h-[460px] sm:h-[560px] lg:h-screen -mx-6 md:-mx-12 lg:mx-0 lg:-mr-24 xl:-mr-32">
      <div
        aria-hidden="true"
        // some em cima, embaixo e (no desktop) na borda que encosta no texto: máscara, não um degradê
        // por cima, para não marcar uma emenda sobre a luz do projetor
        className="absolute inset-0 overflow-hidden [perspective:1400px] [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_82%,transparent)] lg:[mask-image:linear-gradient(to_bottom,transparent,black_18%,black_82%,transparent),linear-gradient(to_right,transparent,black_30%)] [mask-composite:intersect]"
      >
        <div className="absolute -inset-y-24 inset-x-0 lg:-left-8 flex gap-4 justify-center [transform:rotateX(14deg)_rotateY(-16deg)_rotateZ(6deg)] lg:[transform:rotateX(18deg)_rotateY(-22deg)_rotateZ(8deg)] origin-center">
          {columns.map((column, c) => (
            <div key={c} className={`w-32 sm:w-40 lg:w-44 shrink-0 ${c === 1 ? "mt-24" : ""}`}>
              <div className={`flex flex-col hover:[animation-play-state:paused] motion-reduce:animate-none ${COLUMN_MOTION[c]}`}>
                {/* duplicada: quando a primeira cópia sai por cima, a segunda está no lugar dela */}
                {[...column, ...column].map((path, i) => {
                  const src = posterUrl(path, "w342");
                  return (
                    // margem em vez de gap: assim metade da altura é exatamente uma cópia
                    <div
                      key={i}
                      className="relative mb-4 aspect-2/3 overflow-hidden rounded-lg ring-1 ring-inset ring-white/10 bg-surface shadow-[0_20px_40px_-12px_rgba(0,0,0,0.8)] opacity-70 hover:opacity-100 transition-opacity duration-500"
                    >
                      {/* eager: com lazy, os pôsteres que entram andando apareciam vazios */}
                      {src && <Image src={src} alt="" fill sizes="176px" loading="eager" className="object-cover" />}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {reviews.length > 0 && <Subtitles reviews={reviews} />}
    </div>
  );
}

// tempo de cada legenda na tela
const SUBTITLE_MS = 7000;
// legenda de cinema tem duas linhas, no máximo
const SUBTITLE_MAX = 76;

/** corta no fim de uma palavra, como quem quebra uma legenda */
function subtitleText(text: string): string {
  const clean = stripMarkup(text).replace(/\s+/g, " ").trim();
  if (clean.length <= SUBTITLE_MAX) return clean;
  return `${clean.slice(0, clean.lastIndexOf(" ", SUBTITLE_MAX)).replace(/[,.;:!?-]+$/, "")}…`;
}

/** as reviews em destaque passando como legendas sobre a parede, uma de cada vez */
function Subtitles({ reviews }: { reviews: MovieReview[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (reviews.length < 2 || paused) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % reviews.length), SUBTITLE_MS);
    return () => clearInterval(timer);
  }, [reviews.length, paused]);

  const review = reviews[index % reviews.length];

  return (
    <div
      className="absolute inset-x-6 bottom-10 sm:bottom-14 lg:left-[14%] lg:right-0 lg:bottom-[15%] flex justify-center"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <Link
        // a key troca a cada review: a legenda nova entra com a animação de novo
        key={review.id}
        href={`/u/${review.user.username}/reviews/${review.id}`}
        style={rise(500)}
        className={`${riseClass} group relative max-w-[44ch] text-center [text-wrap:balance]`}
      >
        {/* sombra difusa atrás, para o crédito não sumir sobre um pôster claro */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -inset-x-16 -inset-y-10 -z-10 bg-[radial-gradient(closest-side,rgba(0,0,0,0.75),transparent)]"
        />
        {/* a tarja preta acompanha cada linha do texto, como nas legendas de verdade */}
        <p className="text-[17px] sm:text-xl font-medium leading-[1.5] text-white">
          <span className="bg-black/85 px-2 py-[3px] [box-decoration-break:clone] [-webkit-box-decoration-break:clone]">
            {subtitleText(review.text ?? "")}
          </span>
        </p>
        <p className="mt-3 text-xs text-white/60 group-hover:text-white/85 transition-colors">
          {review.user.name.split(" ")[0]} sobre <span className="italic font-serif text-[13px] text-white/85">{review.movie.title}</span>
          {review.rating !== null && <span className="ml-1.5 font-semibold tabular-nums text-brand-orange">★ {formatScore(review.rating)}</span>}
        </p>
      </Link>
    </div>
  );
}
