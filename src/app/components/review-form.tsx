"use client";

import { useState } from "react";
import { CircleNotchIcon, HeartIcon, TrashIcon, WarningIcon } from "@phosphor-icons/react";
import { ApiError } from "@/lib/api-client";
import { createReview, deleteReview, updateReview } from "@/lib/services/review-service";
import type { MovieReview } from "@/lib/types/review";
import type { Movie } from "@/types/movie";
import { todayIso } from "@/utils/format";
import { Poster } from "./ui/poster";
import { StarInput } from "./ui/star-input";

const TEXT_MAX = 5000;

interface ReviewFormProps {
  movie: Movie;
  existing: MovieReview | null;
  onSaved: (review: MovieReview) => void;
  onDeleted: () => void;
  onCancel: () => void;
}

export function ReviewForm({ movie, existing, onSaved, onDeleted, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState<number | null>(existing?.rating ?? null);
  const [liked, setLiked] = useState(existing?.liked ?? false);
  const [watchedOn, setWatchedOn] = useState(existing?.watchedOn ?? todayIso());
  const [text, setText] = useState(existing?.text ?? "");
  const [spoiler, setSpoiler] = useState(existing?.spoiler ?? false);
  const [busy, setBusy] = useState<"save" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasText = text.trim().length > 0;

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
            {existing ? "Editar review" : "Eu assisti…"}
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
          <StarInput value={rating} onChange={setRating} size={30} />
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

      <div className="flex flex-col gap-2">
        <textarea
          aria-label={`Sua review de ${movie.title}`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={TEXT_MAX}
          rows={6}
          placeholder="Escreva sua review… (opcional)"
          className="w-full px-4 py-3.5 bg-transparent border border-brand-slate/20 rounded-xl text-foreground text-base leading-relaxed placeholder:text-brand-slate/40 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue resize-y"
        />
        <div className="flex items-center justify-between gap-4">
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
          <span className="text-xs font-mono text-brand-slate/40">
            {text.length}/{TEXT_MAX}
          </span>
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
