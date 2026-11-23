"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRightIcon, ArrowsClockwiseIcon, EyeIcon, HeartIcon, TelevisionSimpleIcon, WarningIcon } from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth-context";
import type { Rating } from "@/types/review";
import { seasonLabel, seriesBadgeLabel } from "@/types/series";
import { seriesReviewHref } from "@/utils/series-link";
import type { ActivityEntry } from "./activity-poster";
import { reviewHref } from "./review-card";
import { formatScore } from "./ui/rating-meter";
import { Poster } from "./ui/poster";
import { ReviewText } from "./ui/review-text";
import { StarRating } from "./ui/star-rating";

const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

interface Month {
  key: string;
  name: string;
  year: number;
  entries: ActivityEntry[];
}

/**
 * A aba Reviews como um diário: o mês fica preso no topo enquanto rola, a data fica numa coluna à
 * esquerda (só no primeiro registro do dia, para os do mesmo dia ficarem juntos) e cada registro é
 * uma linha com o pôster, as estrelas e o começo do texto, quando tem.
 */
export function DiaryList({ entries }: { entries: ActivityEntry[] }) {
  // a lista já vem do mais recente para o mais antigo: basta cortar quando o mês muda
  const months: Month[] = [];
  for (const entry of entries) {
    const [year, month] = entry.review.watchedOn.split("-").map(Number);
    const key = `${year}-${month}`;
    if (months.at(-1)?.key !== key) months.push({ key, name: MONTHS[month - 1], year, entries: [] });
    months.at(-1)!.entries.push(entry);
  }

  return (
    <div className="flex flex-col gap-10">
      {months.map((month) => (
        <section key={month.key} aria-label={`${month.name} de ${month.year}`}>
          {/* preso embaixo do header enquanto rola, para saber sempre em que mês se está */}
          <h3 className="sticky top-16 z-10 -mx-6 px-6 py-3 bg-background/85 backdrop-blur-md flex items-center gap-4">
            <span className="text-xs font-semibold uppercase tracking-[0.2em]">
              {month.name} <span className="text-brand-slate/60 tabular-nums">{month.year}</span>
            </span>
            <span aria-hidden="true" className="h-px flex-1 bg-foreground/10" />
            <span className="text-xs text-brand-slate/70 tabular-nums">
              {month.entries.length} {month.entries.length === 1 ? "registro" : "registros"}
            </span>
          </h3>

          <ol>
            {month.entries.map((entry, i) => (
              <DiaryRow
                key={`${entry.kind}-${entry.review.id}`}
                entry={entry}
                // a data só aparece quando o dia muda
                showDate={entry.review.watchedOn !== month.entries[i - 1]?.review.watchedOn}
              />
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

/** o que muda entre filme e série */
function describe(entry: ActivityEntry) {
  const isSeries = entry.kind === "series";
  return {
    title: isSeries ? entry.review.series.name : entry.review.movie.title,
    posterPath: isSeries ? entry.review.series.posterPath : entry.review.movie.posterPath,
    // série: até onde a pessoa foi; filme: o ano
    detail: isSeries ? seasonLabel(entry.review.seasonNumber, entry.review.episodeNumber) : entry.review.movie.releaseYear,
    href: isSeries ? seriesReviewHref(entry.review) : reviewHref(entry.review),
    rewatch: !isSeries && entry.review.rewatch,
  };
}

function DayStamp({ date }: { date: string }) {
  const [year, month, day] = date.split("-").map(Number);
  return (
    <time dateTime={date} className="flex flex-col items-center leading-none">
      <span className="text-2xl sm:text-3xl font-semibold tracking-tight tabular-nums">{day}</span>
      <span className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-brand-slate/70">
        {WEEKDAYS[new Date(year, month - 1, day).getDay()]}
      </span>
    </time>
  );
}

function DiaryRow({ entry, showDate }: { entry: ActivityEntry; showDate: boolean }) {
  const { review } = entry;
  const { title, posterPath, detail, href, rewatch } = describe(entry);
  const { user: me } = useAuth();
  const [revealed, setRevealed] = useState(false);
  const hasText = !!review.text?.trim();
  // o autor sempre vê a própria review; os outros precisam pedir para ver
  const hideText = hasText && review.spoiler && me?.username !== review.user.username && !revealed;

  return (
    <li className={`grid grid-cols-[2.5rem_minmax(0,1fr)] sm:grid-cols-[3.5rem_minmax(0,1fr)] gap-3 sm:gap-5 ${showDate ? "pt-5 mt-1 border-t border-foreground/[0.06] first:border-0 first:mt-0" : "pt-2"}`}>
      <div className="pt-3">{showDate && <DayStamp date={review.watchedOn} />}</div>

      <article className="group/row flex gap-4 sm:gap-5 -mx-3 px-3 py-3 rounded-xl hover:bg-surface/60 transition-colors">
        <Link href={href} tabIndex={-1} aria-hidden="true" className="w-[72px] sm:w-24 shrink-0 self-start">
          <Poster
            title={title}
            posterPath={posterPath}
            size="w185"
            sizes="96px"
            className="shadow-lg shadow-black/40 group-hover/row:-translate-y-0.5 transition-transform"
          />
        </Link>

        <div className="min-w-0 flex-1 flex flex-col">
          <h4 className="text-base sm:text-lg font-semibold leading-snug tracking-tight">
            <Link href={href} className="hover:text-brand-orange transition-colors">{title}</Link>
            {detail && <span className="ml-2 text-sm font-normal text-brand-slate tabular-nums">{detail}</span>}
          </h4>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            {review.rating !== null ? (
              <span className="flex items-center gap-1.5" aria-label={`Nota ${formatScore(review.rating)} de 5`}>
                <StarRating rating={review.rating as Rating} size={14} />
              </span>
            ) : (
              <span className="text-xs text-brand-slate/70">sem nota</span>
            )}
            {review.liked && <HeartIcon size={14} weight="fill" className="text-brand-orange" aria-label="Curtiu" />}
            {rewatch && <ArrowsClockwiseIcon size={14} weight="bold" className="text-brand-emerald" aria-label="Reassistiu" />}
            {entry.kind === "series" && (
              <span className="inline-flex items-center gap-1 h-5 px-1.5 rounded bg-foreground/[0.07] text-[11px] font-semibold tabular-nums tracking-wide text-foreground/85">
                <TelevisionSimpleIcon size={11} weight="bold" className="text-brand-orange" />
                {seriesBadgeLabel(entry.review)}
              </span>
            )}
          </div>

          {hideText ? (
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="group/spoiler mt-3 flex items-center gap-3 w-full px-3.5 py-2.5 rounded-lg border border-dashed border-brand-crimson/30 bg-brand-crimson/5 text-left text-sm text-brand-slate hover:border-brand-crimson/60 transition-colors"
            >
              <WarningIcon size={18} className="shrink-0 text-brand-crimson" />
              <span className="flex-1">Esta review contém spoilers.</span>
              <span className="flex items-center gap-1.5 font-medium text-brand-crimson group-hover/spoiler:underline">
                <EyeIcon size={15} />
                Mostrar
              </span>
            </button>
          ) : (
            // sem texto: só o registro (nota, curtida, data), sem o espaço da review
            hasText && <>
              {review.spoiler && (
                <span className="mt-3 flex items-center gap-1.5 w-fit text-[11px] font-bold uppercase tracking-[0.15em] text-brand-crimson">
                  <WarningIcon size={13} weight="bold" />
                  Spoiler
                </span>
              )}
              <ReviewText
                // a linha em branco entre parágrafos fica: separa a citação do resto do texto
                text={(review.text ?? "").replace(/\n{3,}/g, "\n\n")}
                inline
                className={`${review.spoiler ? "mt-1.5" : "mt-2.5"} text-[15px] leading-relaxed text-foreground/80 line-clamp-4`}
              />
            </>
          )}

          <Link
            href={href}
            className="mt-2.5 inline-flex w-fit items-center gap-1 text-xs font-medium text-brand-slate hover:text-brand-orange transition-colors"
          >
            {hasText ? "Ler review" : "Ver registro"}
            <ArrowRightIcon size={12} weight="bold" className="group-hover/row:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </article>
    </li>
  );
}
