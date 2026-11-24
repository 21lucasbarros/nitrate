"use client";

import { useState } from "react";
import Link from "next/link";
import { SparkleIcon, XIcon } from "@phosphor-icons/react";
import type { Recommendation } from "@/lib/types/review";
import { dismissRecommendation, undoDismissRecommendation } from "@/lib/services/user-service";
import { Poster } from "./ui/poster";
import { filmHref } from "@/utils/movie-link";

// 6 de cara e o resto (a API manda até 12) no "Ver mais"
const MAX_CARDS = 6;
const MAX_REASONS = 2;

// "mesma franquia: X" -> "Mesma franquia: X"
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

type DismissState = "dismissed" | "failed";

interface RecommendationsProps {
  items: Recommendation[] | undefined;
  loading: boolean;
}

export function Recommendations({ items, loading }: RecommendationsProps) {
  const [dismissed, setDismissed] = useState<Map<number, DismissState>>(new Map());
  const [showAll, setShowAll] = useState(false);

  if (loading && !items) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="h-36 rounded-md bg-surface animate-pulse" />
        ))}
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-md bg-surface px-6 py-6 text-brand-slate">
        <SparkleIcon size={28} weight="light" className="shrink-0 text-brand-orange" />
        <p className="text-sm sm:text-base">
          Registre e curta alguns filmes, ou conte o que você curte. O Nitrate liga diretores, elenco,
          franquias, gêneros e o que gente com gosto parecido curtiu para descobrir o que você vai gostar em seguida.
        </p>
        {/* quem pulou o questionário depois do cadastro pode responder por aqui */}
        <Link
          href="/comecar"
          className="sm:ml-auto shrink-0 self-start sm:self-center px-4 py-2 rounded-md bg-brand-btn text-brand-btn-text text-sm font-semibold hover:bg-brand-btn/90 transition-colors"
        >
          Contar meus gostos
        </Link>
      </div>
    );
  }

  const mark = (movieId: number, state: DismissState | null) =>
    setDismissed((current) => {
      const next = new Map(current);
      if (state) next.set(movieId, state);
      else next.delete(movieId);
      return next;
    });

  // o card some na hora; se a API recusar, ele volta com o aviso
  const dismiss = (movieId: number) => {
    mark(movieId, "dismissed");
    dismissRecommendation(movieId).catch(() => mark(movieId, "failed"));
  };

  const undo = (movieId: number) => {
    mark(movieId, null);
    undoDismissRecommendation(movieId).catch(() => mark(movieId, "dismissed"));
  };

  const visible = showAll ? items : items.slice(0, MAX_CARDS);

  return (
    <>
      <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visible.map((rec) => (
          <li key={rec.movieId} className="relative group/rec">
            {dismissed.get(rec.movieId) === "dismissed" ? (
              <div className="flex flex-col items-start justify-center gap-2 h-full min-h-36 px-5 py-4 rounded-md border border-dashed border-foreground/15 text-sm text-brand-slate">
                <p>
                  Ok, não vamos mais sugerir <span className="text-foreground">{rec.title}</span>.
                </p>
                <button
                  type="button"
                  onClick={() => undo(rec.movieId)}
                  className="font-medium text-foreground underline underline-offset-4 decoration-foreground/30 hover:decoration-brand-orange"
                >
                  Desfazer
                </button>
              </div>
            ) : (
              <>
                <Link
                  href={filmHref({ id: rec.movieId, slug: rec.slug })}
                  className="group flex gap-4 h-full p-3 pr-9 rounded-md bg-surface hover:bg-surface-strong transition-colors"
                >
                  <div className="w-20 shrink-0">
                    <Poster title={rec.title} posterPath={rec.posterPath} size="w185" sizes="80px" />
                  </div>
                  <div className="flex flex-col min-w-0 py-1">
                    <h3 className="font-medium leading-tight group-hover:text-brand-orange transition-colors">
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
                    {dismissed.get(rec.movieId) === "failed" && (
                      <p role="status" className="mt-2 text-[13px] text-red-500">
                        Não deu para tirar este agora. Tente de novo.
                      </p>
                    )}
                  </div>
                </Link>
                {/* fora do Link: um botão dentro de um link abriria o filme junto */}
                <button
                  type="button"
                  onClick={() => dismiss(rec.movieId)}
                  aria-label={`Não tenho interesse em ${rec.title}`}
                  title="Não tenho interesse"
                  className="absolute top-2 right-2 p-1.5 rounded-full text-brand-slate bg-surface hover:text-foreground hover:bg-surface-strong opacity-0 group-hover/rec:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity"
                >
                  <XIcon size={14} weight="bold" />
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
      {items.length > MAX_CARDS && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-4 text-sm text-brand-slate hover:text-foreground transition-colors"
        >
          {showAll ? "Ver menos" : `Ver mais ${items.length - MAX_CARDS}`}
        </button>
      )}
    </>
  );
}
