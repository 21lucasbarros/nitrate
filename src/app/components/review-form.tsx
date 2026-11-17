"use client";

import { useState } from "react";
import { ArrowsClockwiseIcon, CircleNotchIcon, HeartIcon, TrashIcon, WarningIcon } from "@phosphor-icons/react";
import { ApiError } from "@/lib/api-client";
import { createReview, deleteReview, updateReview } from "@/lib/services/review-service";
import type { MovieReview } from "@/lib/types/review";
import type { Movie } from "@/types/movie";
import { easterEggFor } from "@/lib/easter-eggs";
import { showQuote } from "@/lib/hooks/use-easter-eggs";
import { todayIso } from "@/utils/format";
import { Poster } from "./ui/poster";
import { RichTextEditor } from "./ui/rich-text-editor";
import { StarInput } from "./ui/star-input";

const TEXT_MAX = 20000; // igual ao limite do backend (reviews importadas do Letterboxd são longas)

interface ReviewFormProps {
  movie: Movie;
  existing: MovieReview | null;
  /** já existe alguma review deste filme: a nova é um reassistido */
  previouslyWatched?: boolean;
  onSaved: (review: MovieReview) => void;
  onDeleted: () => void;
  onCancel: () => void;
}

export function ReviewForm({ movie, existing, previouslyWatched = false, onSaved, onDeleted, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState<number | null>(existing?.rating ?? null);
  const [liked, setLiked] = useState(existing?.liked ?? false);
  const [watchedOn, setWatchedOn] = useState(existing?.watchedOn ?? todayIso());
  const [text, setText] = useState(existing?.text ?? "");
  const [spoiler, setSpoiler] = useState(existing?.spoiler ?? false);
  const [rewatch, setRewatch] = useState(existing?.rewatch ?? previouslyWatched);
  // a segunda review de um filme no Nitrate é sempre reassistido (o backend garante)
  const rewatchLocked = !existing && previouslyWatched;
  const [busy, setBusy] = useState<"save" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasText = text.trim().length > 0;

  // easter egg (Clube da Luta): a primeira letra digitada dispara as regras, uma de cada vez
  const warnings = easterEggFor(movie)?.reviewWarnings ?? [];
  const [nextWarning, setNextWarning] = useState(0);
  const [ruleBroken, setRuleBroken] = useState(false);
  // o texto com a letra que disparou o aviso: só entra se a pessoa quebrar a regra
  const [pending, setPending] = useState<string | null>(null);

  const handleText = (value: string) => {
    if (!ruleBroken && nextWarning < warnings.length && value.length > text.length) {
      setPending(value);
      return;
    }
    setText(value);
  };

  const respectRule = () => {
    setPending(null);
    setNextWarning((i) => i + 1);
  };

  const breakRule = () => {
    if (pending !== null) setText(pending);
    setPending(null);
    setRuleBroken(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy("save");
    setError(null);
    const data = {
      rating,
      liked,
      watchedOn,
      text: text.trim() || null,
      spoiler: hasText && spoiler,
      rewatch: rewatch || rewatchLocked,
    };
    try {
      const saved = existing
        ? await updateReview(existing.id, data)
        : await createReview({ ...data, movieId: movie.id });
      onSaved(saved);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível salvar. Tente novamente.");
      setBusy(null);
    }
  };

  const handleDelete = async () => {
    if (!existing || !window.confirm("Apagar sua review deste filme?")) return;
    setBusy("delete");
    setError(null);
    try {
      await deleteReview(existing.id);
      onDeleted();
    } catch {
      setError("Não foi possível apagar. Tente novamente.");
      setBusy(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* cabeçalho: qual filme está sendo registrado */}
      <div className="flex items-center gap-4 pr-10">
        <div className="w-14 shrink-0">
          <Poster title={movie.title} posterPath={movie.posterPath} size="w185" sizes="56px" />
        </div>
        <div className="min-w-0">
          <span className="text-xs font-bold tracking-[0.2em] uppercase text-brand-orange">
            {existing ? "Editar review" : previouslyWatched ? "Assisti de novo…" : "Eu assisti…"}
          </span>
          <h2 className="text-xl sm:text-2xl font-medium tracking-tight leading-tight mt-1 truncate">
            {movie.title}{" "}
            {movie.releaseYear && <span className="text-foreground/40 font-normal">{movie.releaseYear}</span>}
          </h2>
        </div>
      </div>

      {/* nota, curtida e data na mesma faixa */}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-5 py-5 border-y border-foreground/10">
        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-[0.15em] text-brand-slate/60">Nota</span>
          <StarInput
            value={rating}
            onChange={(value) => {
              setRating(value);
              // easter egg (Whiplash): certas notas ganham uma fala
              const quote = value !== null ? easterEggFor(movie)?.ratingQuotes?.[value] : undefined;
              if (quote) showQuote(quote);
            }}
            size={30}
          />
        </div>

        <div className="flex flex-col gap-2 items-center">
          <span className="text-xs uppercase tracking-[0.15em] text-brand-slate/60">Curtir</span>
          <button
            type="button"
            onClick={() => setLiked(!liked)}
            aria-pressed={liked}
            aria-label={liked ? "Descurtir" : "Curtir"}
            className={`p-1 transition-all active:scale-90 ${liked ? "text-brand-orange" : "text-brand-slate/25 hover:text-brand-orange/60"}`}
          >
            <HeartIcon size={30} weight="fill" />
          </button>
        </div>

        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-[0.15em] text-brand-slate/60">Assistido em</span>
          <input
            type="date"
            value={watchedOn}
            max={todayIso()}
            onChange={(e) => setWatchedOn(e.target.value)}
            className="px-3 py-2 bg-transparent border border-brand-slate/20 rounded-lg text-sm text-foreground focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
          />
        </label>
      </div>

      <label
        className={`flex items-center gap-2.5 w-fit text-sm select-none ${rewatchLocked ? "text-brand-slate/50" : "cursor-pointer text-brand-slate/80"}`}
      >
        <input
          type="checkbox"
          checked={rewatch || rewatchLocked}
          disabled={rewatchLocked}
          onChange={(e) => setRewatch(e.target.checked)}
          className="w-4 h-4 accent-brand-orange"
        />
        <ArrowsClockwiseIcon size={16} weight="bold" className={rewatch || rewatchLocked ? "text-brand-orange" : ""} />
        {rewatchLocked ? "Reassistido (você já registrou este filme)" : "Já tinha assistido antes"}
      </label>

      <div className="flex flex-col gap-2">
        <div className="relative">
          <RichTextEditor
            label={`Sua review de ${movie.title}`}
            value={text}
            onChange={handleText}
            maxLength={TEXT_MAX}
            placeholder="Escreva sua review… (opcional)"
          />
          {pending !== null && warnings[nextWarning] && (
            <RuleWarning
              rule={nextWarning + 1}
              text={warnings[nextWarning]}
              onRespect={respectRule}
              onBreak={breakRule}
            />
          )}
        </div>
        <div className="flex items-center gap-4">
          <label
            className={`flex items-center gap-2.5 text-sm select-none ${hasText ? "cursor-pointer text-brand-slate/80" : "cursor-not-allowed text-brand-slate/35"}`}
            title={hasText ? undefined : "Escreva algo para poder marcar spoilers"}
          >
            <input
              type="checkbox"
              checked={hasText && spoiler}
              disabled={!hasText}
              onChange={(e) => setSpoiler(e.target.checked)}
              className="peer sr-only"
            />
            {/* switch */}
            <span className="relative w-9 h-5 rounded-full bg-brand-slate/20 transition-colors peer-checked:bg-brand-crimson peer-focus-visible:ring-2 peer-focus-visible:ring-brand-blue after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4" />
            <WarningIcon size={16} className={hasText && spoiler ? "text-brand-crimson" : ""} />
            Contém spoilers
          </label>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {existing && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy !== null}
            className="flex items-center gap-2 px-2 py-3 text-sm font-medium text-brand-crimson/70 hover:text-brand-crimson transition-colors"
          >
            {busy === "delete" ? <CircleNotchIcon size={18} className="animate-spin" /> : <TrashIcon size={18} />}
            Apagar
          </button>
        )}
        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy !== null}
            className="px-5 py-3 rounded-full font-medium text-brand-slate/70 hover:text-foreground transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={busy !== null}
            className="flex items-center justify-center gap-2 min-w-32 bg-brand-btn text-brand-btn-text px-6 py-3 rounded-full font-semibold hover:bg-brand-btn/90 transition-colors disabled:opacity-70"
          >
            {busy === "save" ? <CircleNotchIcon size={20} className="animate-spin" /> : existing ? "Salvar" : "Registrar"}
          </button>
        </div>
      </div>
    </form>
  );
}

/** o aviso do Clube da Luta, por cima do editor */
function RuleWarning({ rule, text, onRespect, onBreak }: {
  rule: number;
  text: string;
  onRespect: () => void;
  onBreak: () => void;
}) {
  return (
    <div
      role="alertdialog"
      aria-label="Tem certeza que quer continuar?"
      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 px-6 rounded-xl bg-background/95 backdrop-blur-sm ring-1 ring-brand-crimson/40 text-center animate-[modal-in_180ms_ease-out]"
    >
      <span className="font-mono text-[11px] tracking-[0.3em] uppercase text-brand-crimson">Regra nº {rule}</span>
      <p className="max-w-md">
        <strong className="block text-lg font-semibold">Tem certeza que quer continuar?</strong>
        <span className="mt-2 block font-serif text-[17px] italic leading-relaxed text-foreground/80">{text}</span>
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={onRespect}
          autoFocus
          className="px-4 py-2 rounded-full text-sm font-medium text-brand-slate hover:text-foreground hover:bg-surface-strong transition-colors"
        >
          Respeitar a regra
        </button>
        <button
          type="button"
          onClick={onBreak}
          className="px-4 py-2 rounded-full bg-brand-crimson text-background text-sm font-semibold hover:bg-brand-crimson/90 transition-colors"
        >
          Quebrar a regra
        </button>
      </div>
    </div>
  );
}
