import Image from "next/image";
import { ArrowSquareOutIcon, EyeIcon, HeartIcon } from "@phosphor-icons/react";
import type { MovieStats, WatchProvider, WatchProviders } from "@/lib/services/movie-service";
import { logoUrl } from "@/utils/poster";
import { RatingMeter, formatScore } from "./ui/rating-meter";

// faixas da distribuição: cada uma junta a nota cheia e a meia abaixo dela ("4" = 3,5 e 4,0)
const RATING_BANDS = [5, 4, 3, 2, 1].map((n) => ({
  label: String(n),
  keys: [(n - 0.5).toFixed(1), n.toFixed(1)],
}));

/** nota média no Nitrate, com a distribuição em faixas horizontais */
export function NitrateRating({ stats }: { stats: MovieStats }) {
  const bands = RATING_BANDS.map((band) => ({
    ...band,
    count: band.keys.reduce((sum, k) => sum + (stats.ratingDistribution[k] ?? 0), 0),
  }));
  const total = Math.max(1, stats.ratingsCount);

  return (
    <div className="rounded-md border border-foreground/10 p-5">
      <span className="text-xs uppercase tracking-[0.14em] text-brand-slate">Nota no Nitrate</span>

      {stats.averageRating === null ? (
        <p className="mt-3 text-sm text-brand-slate/70">
          {stats.watchedCount > 0
            ? `${stats.watchedCount} ${stats.watchedCount === 1 ? "pessoa registrou" : "pessoas registraram"}, sem nota ainda.`
            : "Ninguém avaliou ainda. Seja a primeira nota."}
        </p>
      ) : (
        <>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-5xl font-bold tracking-tighter leading-none tabular-nums">{formatScore(stats.averageRating)}</span>
            <span className="text-sm text-brand-slate">/5</span>
          </div>
          <RatingMeter value={stats.averageRating} className="mt-3 h-1.5" />

          <ul className="mt-5 flex flex-col gap-1.5" aria-label="Distribuição das notas">
            {bands.map((band) => (
              <li
                key={band.label}
                title={`${band.count} ${band.count === 1 ? "pessoa" : "pessoas"}`}
                className="grid grid-cols-[12px_1fr_28px] items-center gap-2.5 text-xs text-brand-slate tabular-nums"
              >
                <span>{band.label}</span>
                <span className="h-1 rounded-full bg-foreground/5 overflow-hidden">
                  <span
                    className="block h-full rounded-full bg-brand-slate/60"
                    style={{ width: `${(band.count / total) * 100}%` }}
                  />
                </span>
                <span className="text-right">{band.count > 0 ? `${Math.round((band.count / total) * 100)}%` : "–"}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* quem passou por aqui */}
      <div className="mt-5 pt-4 border-t border-foreground/10 flex flex-wrap gap-x-4 gap-y-1 text-xs text-brand-slate whitespace-nowrap">
        <span className="flex items-center gap-1.5">
          <EyeIcon size={14} className="text-brand-emerald" />
          {stats.watchedCount} {stats.watchedCount === 1 ? "assistiu" : "assistiram"}
        </span>
        <span className="flex items-center gap-1.5">
          <HeartIcon size={14} className="text-brand-orange" />
          {stats.likesCount} {stats.likesCount === 1 ? "curtiu" : "curtiram"}
        </span>
        {stats.averageRating !== null && (
          <span className="ml-auto">{stats.ratingsCount} {stats.ratingsCount === 1 ? "nota" : "notas"}</span>
        )}
      </div>
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
export function WhereToWatch({ providers, subject = "este filme" }: { providers: WatchProviders; subject?: string }) {
  const groups = GROUPS.filter((g) => providers[g.key].length > 0);

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-5">
        <span className="text-sm text-brand-slate">No Brasil</span>
        {/* o link vem do TMDB pela API: só abre se for https (nada de javascript: ou data:) */}
        {providers.link?.startsWith("https://") && (
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
          Não encontramos {subject} em nenhum serviço no Brasil no momento.
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
