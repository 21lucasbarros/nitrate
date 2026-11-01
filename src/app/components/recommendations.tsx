"use client";

import Link from "next/link";
import { SparkleIcon } from "@phosphor-icons/react";
import type { Recommendation } from "@/lib/types/review";
import { Poster } from "./ui/poster";

const MAX_CARDS = 6;
const MAX_REASONS = 2;

// "mesma franquia: X" -> "Mesma franquia: X"
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

interface RecommendationsProps {
  items: Recommendation[] | undefined;
  loading: boolean;
}

export function Recommendations({ items, loading }: RecommendationsProps) {
  if (loading && !items) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="h-36 rounded-xl bg-foreground/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="flex items-center gap-4 rounded-xl border border-dashed border-foreground/15 px-6 py-8 text-brand-slate/70">
        <SparkleIcon size={28} weight="light" className="shrink-0 text-brand-orange" />
        <p className="text-sm sm:text-base">
          Registre e curta alguns filmes. O Nitrate liga diretores, elenco, franquias e gêneros
          para descobrir o que você vai gostar em seguida.
        </p>
      </div>
    );
  }

  return (
    <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.slice(0, MAX_CARDS).map((rec) => (
        <li key={rec.movieId}>
          <Link
            href={`/movies/${rec.movieId}`}
            className="group flex gap-4 h-full p-3 rounded-xl border border-foreground/10 hover:border-brand-orange/40 hover:bg-white transition-colors"
          >
            <div className="w-20 shrink-0">
              <Poster title={rec.title} posterPath={rec.posterPath} size="w185" sizes="80px" />
            </div>
            <div className="flex flex-col min-w-0 py-1">
              <h3 className="font-medium leading-tight group-hover:text-brand-blue transition-colors">
                {rec.title}{" "}
                {rec.releaseYear && <span className="text-foreground/40 font-normal text-sm">{rec.releaseYear}</span>}
              </h3>
              <ul className="mt-2.5 flex flex-col gap-1.5">
                {rec.reasons.slice(0, MAX_REASONS).map((reason) => (
                  <li key={reason} className="flex gap-2 text-[13px] leading-snug text-brand-slate/70">
                    <span aria-hidden="true" className="mt-1.5 w-1 h-1 shrink-0 rounded-full bg-brand-orange" />
                    {capitalize(reason)}
                  </li>
                ))}
              </ul>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
