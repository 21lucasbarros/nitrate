"use client";

import { useState } from "react";
import Link from "next/link";
import { HeartIcon } from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth-context";
import type { ReviewEngagement } from "@/lib/types/review";

/** curtir a review (não o filme ou a série). Quem escreveu só vê quantas curtidas recebeu. */
export function ReviewLikeButton({ reviewId, href, isOwn, engagement, onChange, like, unlike }: {
  reviewId: number;
  /** endereço da página, para voltar depois do login */
  href: string;
  isOwn: boolean;
  engagement: ReviewEngagement | undefined;
  onChange: (engagement: ReviewEngagement) => void;
  like: (reviewId: number) => Promise<ReviewEngagement>;
  unlike: (reviewId: number) => Promise<ReviewEngagement>;
}) {
  const { status } = useAuth();
  const [busy, setBusy] = useState(false);
  const count = engagement?.likesCount ?? 0;
  const liked = engagement?.likedByMe ?? false;
  const label = `${count} ${count === 1 ? "curtida" : "curtidas"}`;

  if (isOwn || !engagement) {
    return (
      <span className="inline-flex items-center gap-2 text-sm text-brand-slate">
        <HeartIcon size={20} weight={count > 0 ? "fill" : "regular"} className={count > 0 ? "text-brand-orange" : ""} />
        <span className="tabular-nums">{engagement ? label : "–"}</span>
      </span>
    );
  }

  if (status !== "authenticated") {
    return (
      <Link
        href={`/sign-in?redirect=${encodeURIComponent(href)}`}
        className="inline-flex items-center gap-2 text-sm text-brand-slate hover:text-brand-orange transition-colors"
      >
        <HeartIcon size={20} />
        <span className="tabular-nums">{label}</span>
      </Link>
    );
  }

  const toggle = async () => {
    setBusy(true);
    // otimista: o coração responde na hora; a resposta do servidor confirma o número
    onChange({ ...engagement, likedByMe: !liked, likesCount: count + (liked ? -1 : 1) });
    try {
      onChange(liked ? await unlike(reviewId) : await like(reviewId));
    } catch {
      onChange(engagement);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={liked}
      className={`group inline-flex items-center gap-2 text-sm transition-colors ${liked ? "text-brand-orange" : "text-brand-slate hover:text-brand-orange"}`}
    >
      <HeartIcon
        size={20}
        weight={liked ? "fill" : "regular"}
        className={`transition-transform ${liked ? "scale-110" : "group-hover:scale-110"}`}
      />
      <span className="tabular-nums">{label}</span>
      <span className="sr-only">{liked ? "Descurtir a review" : "Curtir a review"}</span>
    </button>
  );
}
