"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, HeartIcon, LockKeyOpenIcon, ProhibitIcon } from "@phosphor-icons/react";
import { cachedFetcher } from "@/lib/cache";
import { useFetch } from "@/lib/hooks/use-fetch";
import { getTopRatedMovies, getTrendingMovies } from "@/lib/services/movie-service";
import { posterUrl } from "@/utils/poster";

// o que o Nitrate promete, no lugar de números: é de graça, sem anúncios, e os dados são seus
const PROMISES = [
  { icon: HeartIcon, title: "Feito por amor", text: "Gratuito, para sempre" },
  { icon: ProhibitIcon, title: "Zero anúncios", text: "Só cinema na tela" },
  { icon: LockKeyOpenIcon, title: "Seus dados", text: "Exporte tudo quando quiser" },
];

// pôsteres de reserva, para a faixa nunca ficar vazia (API fora do ar, comunidade ainda pequena)
const FALLBACK_POSTERS = [
  "/Ae0pbv4E6YfqfN3UjKWIfQSzP9v.jpg",
  "/lzyh1lsD4Qaid6bG5zk57Y3bEM.jpg",
  "/y5ibL0vFnzsRiIHosw0WOfHtIj1.jpg",
  "/rFHzJrkO1kNIezb6rFog5oCJUEn.jpg",
  "/is1U9n0e9ofg50U1T7p2WZuIwiO.jpg",
  "/zNAw7jK8bwCK56rIW676pdgkwhd.jpg",
  "/AvMietG6xuobpSSdmVnKuTjv4bL.jpg",
];

const MIN_PER_ROW = 12;

// os filmes da faixa vêm da própria comunidade: em alta e mais bem avaliados
const fetchPosters = cachedFetcher(async () => {
  const [trending, topRated] = await Promise.all([
    getTrendingMovies().catch(() => []),
    getTopRatedMovies().catch(() => []),
  ]);
  const paths = [...trending, ...topRated].map((m) => m.posterPath).filter((p): p is string => Boolean(p));
  return [...new Set([...paths, ...FALLBACK_POSTERS])];
}, 10 * 60 * 1000);

/** repete os pôsteres até a fileira ter o bastante para cobrir telas largas */
function fill(paths: string[], min: number): string[] {
  if (paths.length === 0) return [];
  const out = [...paths];
  while (out.length < min) out.push(...paths);
  return out;
}

export default function CTA() {
  const posters = useFetch("cta", fetchPosters);
  const paths = posters.data ?? FALLBACK_POSTERS;
  // metade em cada fileira, para as duas não mostrarem os mesmos filmes lado a lado
  const half = Math.ceil(paths.length / 2);
  const rows = [fill(paths.slice(0, half), MIN_PER_ROW), fill(paths.slice(half).concat(paths.slice(0, 2)), MIN_PER_ROW)];

  return (
    // o fundo começa na cor da seção anterior e escurece aos poucos: sem degrau entre as duas
    <section className="relative overflow-hidden bg-linear-to-b from-background via-brand-charcoal to-brand-charcoal text-foreground pt-12 sm:pt-16 pb-20 sm:pb-24">
      <div className="pointer-events-none absolute inset-x-0 top-8 h-[480px] bg-[radial-gradient(ellipse_50%_60%_at_50%_40%,rgba(255,122,51,0.12),transparent_70%)]" />

      <div className="relative max-w-3xl mx-auto px-6 text-center">
        <span className="inline-block text-xs font-mono uppercase tracking-[0.25em] text-brand-orange mb-6">
          Fim de sessão
        </span>

        <h2 className="text-4xl sm:text-6xl md:text-7xl font-medium tracking-tighter leading-[1.05] mb-6 sm:mb-8">
          O filme acabou.
          <br />
          Sua crítica, não.
        </h2>

        <p className="text-lg sm:text-xl text-foreground/65 font-light max-w-xl mx-auto mb-10 sm:mb-12 leading-relaxed">
          Catalogue cada sessão com precisão — meias estrelas incluídas —, monte seu diário, crie
          listas e discuta direção, roteiro e fotografia com gente que também assistiu até os
          créditos finais. Sem anúncios, sem algoritmo de engajamento, só cinema.
        </p>

        <div className="flex flex-col items-center gap-4">
          <Link
            href="/sign-in"
            className="group relative inline-flex items-center gap-3 bg-brand-btn text-brand-btn-text px-9 sm:px-12 py-5 sm:py-6 rounded-full text-base sm:text-lg font-semibold hover:shadow-[0_0_40px_10px_rgba(255,106,28,0.3)] hover:scale-[1.03] active:scale-[0.98] transition-all duration-300"
          >
            Criar minha conta
            <ArrowRightIcon size={20} weight="bold" className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/importar"
            className="text-xs text-foreground/45 hover:text-foreground font-mono uppercase tracking-wider transition-colors"
          >
            Vem do Letterboxd? Traga seu histórico em minutos
          </Link>
        </div>
      </div>

      {/* duas fileiras de pôsteres andando em sentidos opostos, sumindo nas bordas */}
      <div
        aria-hidden="true"
        className="relative mt-16 sm:mt-20 flex flex-col gap-4 overflow-hidden mask-[linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]"
      >
        {rows.map((row, r) => (
          <div
            key={r}
            // a fileira roda devagar e pausa quando o mouse passa por cima
            className={`flex w-max hover:[animation-play-state:paused] motion-reduce:animate-none ${r === 0 ? "animate-[marquee_80s_linear_infinite]" : "animate-[marquee-reverse_95s_linear_infinite]"}`}
          >
            {/* duplicada: quando a primeira cópia sai da tela, a segunda está no lugar exato dela */}
            {[...row, ...row].map((path, i) => {
              const src = posterUrl(path, "w185");
              return (
                // margem em vez de gap: assim metade da largura é exatamente uma cópia
                <div
                  key={i}
                  className="relative mr-4 w-24 sm:w-28 aspect-2/3 shrink-0 overflow-hidden rounded-md ring-1 ring-inset ring-white/10 opacity-40 grayscale-[70%] hover:opacity-100 hover:grayscale-0 transition-[opacity,filter] duration-500"
                >
                  {/* eager: com lazy, os pôsteres que entram andando na tela apareciam vazios */}
                  {src && <Image src={src} alt="" fill sizes="112px" loading="eager" className="object-cover" />}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <ul className="relative mt-16 sm:mt-20 max-w-3xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4 text-center">
        {PROMISES.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex flex-col items-center">
            <Icon size={22} weight="duotone" className="text-brand-orange" />
            <span className="mt-3 text-sm font-medium text-foreground/90">{title}</span>
            <span className="mt-0.5 text-xs uppercase tracking-wider text-foreground/40">{text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
