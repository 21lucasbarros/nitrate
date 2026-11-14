import Image from "next/image";
import { ArrowSquareOutIcon, HeartIcon } from "@phosphor-icons/react";
import type { MovieStats, WatchProvider, WatchProviders } from "@/lib/services/movie-service";
import { toRating } from "@/utils/rating";
import { logoUrl } from "@/utils/poster";
import { StarRating } from "./ui/star-rating";

const RATING_STEPS = ["0.5", "1.0", "1.5", "2.0", "2.5", "3.0", "3.5", "4.0", "4.5", "5.0"];

/** nota média no Nitrate, com o histograma das notas (estilo Letterboxd) */
export function NitrateRating({ stats }: { stats: MovieStats }) {
  const max = Math.max(1, ...RATING_STEPS.map((k) => stats.ratingDistribution[k] ?? 0));

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4 pb-2.5 border-b border-foreground/10">
        <span className="text-[15px] font-medium text-foreground/90">Nota no Nitrate</span>
        {stats.likesCount > 0 && (
          <span className="flex items-center gap-1 text-xs text-brand-slate/60" title="Pessoas que curtiram">
            <HeartIcon size={13} weight="fill" className="text-brand-orange" />
            {stats.likesCount}
          </span>
        )}
      </div>

      {stats.averageRating === null ? (
        <p className="mt-3 text-sm text-brand-slate/60">
          {stats.watchedCount > 0
            ? `${stats.watchedCount} ${stats.watchedCount === 1 ? "pessoa registrou" : "pessoas registraram"}, sem nota ainda.`
            : "Ninguém avaliou ainda. Seja a primeira nota."}
        </p>
      ) : (
        <div className="mt-3 flex items-end gap-5">
          <div className="shrink-0">
            <div className="font-serif text-5xl font-semibold leading-none">
              {stats.averageRating.toLocaleString("pt-BR", { minimumFractionDigits: 1 })}
            </div>
            <div className="mt-2">
              <StarRating rating={toRating(stats.averageRating)} size={14} />
            </div>
            <div className="mt-1.5 text-xs text-brand-slate/60">
              {stats.ratingsCount} {stats.ratingsCount === 1 ? "nota" : "notas"}
            </div>
          </div>

          {/* histograma: uma barra por meia estrela */}
          <div className="flex-1 flex items-end gap-[3px] h-14" aria-label="Distribuição das notas">
            {RATING_STEPS.map((step) => {
              const count = stats.ratingDistribution[step] ?? 0;
              return (
                <div
                  key={step}
                  title={`${Number(step).toLocaleString("pt-BR")}★: ${count} ${count === 1 ? "pessoa" : "pessoas"}`}
                  className={`flex-1 rounded-t-[2px] ${count > 0 ? "bg-brand-slate/50 hover:bg-brand-orange" : "bg-foreground/5"}`}
                  style={{ height: count > 0 ? `${Math.max(8, (count / max) * 100)}%` : "3px" }}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const GROUPS: { key: keyof Omit<WatchProviders, "link">; label: string }[] = [
  { key: "streaming", label: "Streaming" },
  { key: "free", label: "Grátis" },
  { key: "rent", label: "Alugar" },
  { key: "buy", label: "Comprar" },
];

/** onde assistir no Brasil. A atribuição à JustWatch é exigida pelos termos do TMDB. */
export function WhereToWatch({ providers }: { providers: WatchProviders }) {
  const groups = GROUPS.filter((g) => providers[g.key].length > 0);

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-5">
        <span className="text-sm text-brand-slate">No Brasil</span>
        {providers.link && (
          <a
            href={providers.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm font-medium text-brand-blue hover:underline underline-offset-4"
          >
            Ver links para assistir <ArrowSquareOutIcon size={14} />
          </a>
        )}
      </div>

      {groups.length === 0 ? (
        <p className="text-brand-slate/60">
          Não encontramos este filme em nenhum serviço no Brasil no momento.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map((group) => (
            <div key={group.key} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-5">
              <span className="w-20 shrink-0 text-xs uppercase tracking-[0.12em] text-brand-slate">{group.label}</span>
              <ul className="flex flex-wrap gap-3">
                {providers[group.key].map((p) => (
                  <ProviderLogo key={p.id} provider={p} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <p className="mt-6 text-xs text-brand-slate/50">Disponibilidade fornecida pela JustWatch.</p>
    </div>
  );
}

function ProviderLogo({ provider }: { provider: WatchProvider }) {
  const src = logoUrl(provider.logoPath);
  return (
    <li title={provider.name} className="flex items-center gap-2 pl-1 pr-3 py-1 rounded bg-surface">
      {src ? (
        <Image src={src} alt="" width={28} height={28} className="w-7 h-7 rounded object-cover" />
      ) : (
        <span className="w-7 h-7 rounded bg-foreground/10" />
      )}
      <span className="text-sm text-foreground/85">{provider.name}</span>
    </li>
  );
}
