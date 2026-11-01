"use client";

import { useState } from "react";
import { CircleNotchIcon, HeartIcon, TrashIcon } from "@phosphor-icons/react";
import { ApiError } from "@/lib/api-client";
import { createReview, deleteReview, updateReview } from "@/lib/services/review-service";
import type { MovieReview } from "@/lib/types/review";
import { todayIso } from "@/utils/format";
import { StarInput } from "./ui/star-input";

const TEXT_MAX = 5000;

interface ReviewFormProps {
  movieId: number;
  movieTitle: string;
  existing: MovieReview | null;
  onSaved: (review: MovieReview) => void;
  onDeleted: () => void;
  onCancel: () => void;
}

export function ReviewForm({ movieId, movieTitle, existing, onSaved, onDeleted, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState<number | null>(existing?.rating ?? null);
  const [liked, setLiked] = useState(existing?.liked ?? false);
  const [watchedOn, setWatchedOn] = useState(existing?.watchedOn ?? todayIso());
  const [text, setText] = useState(existing?.text ?? "");
  const [busy, setBusy] = useState<"save" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy("save");
    setError(null);
    const data = { rating, liked, watchedOn, text: text.trim() || null };
    try {
      const saved = existing
        ? await updateReview(existing.id, data)
        : await createReview({ ...data, movieId });
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
      <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
        <StarInput value={rating} onChange={setRating} />
        <button
          type="button"
          onClick={() => setLiked(!liked)}
          aria-pressed={liked}
          className={`flex items-center gap-2 text-sm font-medium transition-colors ${liked ? "text-brand-orange" : "text-brand-slate/50 hover:text-brand-orange"}`}
        >
          <HeartIcon size={26} weight={liked ? "fill" : "regular"} />
          {liked ? "Curtiu" : "Curtir"}
        </button>
      </div>

      <label className="flex flex-col gap-2 text-sm text-brand-slate/70 w-fit">
        Assistido em
        <input
          type="date"
          value={watchedOn}
          max={todayIso()}
          onChange={(e) => setWatchedOn(e.target.value)}
          className="px-4 py-2.5 bg-transparent border border-brand-slate/20 rounded-xl text-foreground focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm text-brand-slate/70">
        Sua review <span className="sr-only">de {movieTitle}</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={TEXT_MAX}
          rows={6}
          placeholder={`O que você achou de ${movieTitle}? (opcional)`}
          className="w-full px-4 py-3.5 bg-transparent border border-brand-slate/20 rounded-xl text-foreground text-base leading-relaxed placeholder:text-brand-slate/40 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue resize-y"
        />
        <span className="self-end text-xs font-mono text-brand-slate/40">
          {text.length}/{TEXT_MAX}
        </span>
      </label>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={busy !== null}
          className="flex items-center justify-center gap-2 min-w-36 bg-brand-btn text-brand-btn-text px-6 py-3 rounded-full font-semibold hover:bg-brand-btn/90 transition-colors disabled:opacity-70"
        >
          {busy === "save" ? <CircleNotchIcon size={20} className="animate-spin" /> : existing ? "Salvar alterações" : "Registrar"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={busy !== null}
          className="px-6 py-3 rounded-full font-medium text-brand-slate/70 hover:text-foreground transition-colors"
        >
          Cancelar
        </button>
        {existing && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy !== null}
            className="ml-auto flex items-center gap-2 px-4 py-3 text-sm font-medium text-brand-crimson/80 hover:text-brand-crimson transition-colors"
          >
            {busy === "delete" ? <CircleNotchIcon size={18} className="animate-spin" /> : <TrashIcon size={18} />}
            Apagar
          </button>
        )}
      </div>
    </form>
  );
}
