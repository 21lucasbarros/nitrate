"use client";

import { useState } from "react";
import Link from "next/link";
import { TrashIcon } from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth-context";
import { useFetch } from "@/lib/hooks/use-fetch";
import { addReviewComment, deleteReviewComment, getReviewComments } from "@/lib/services/review-service";
import type { ReviewComment } from "@/lib/types/review";
import type { UserSummary } from "@/lib/types/user";
import { timeAgo } from "@/utils/format";
import { Avatar } from "./ui/avatar";
import { SectionHeading } from "./ui/section-heading";

const COMMENT_MAX = 1000;

/** de onde vêm os comentários: as reviews de filme e os registros de série têm rotas próprias */
export interface CommentsApi {
  list: (reviewId: number) => Promise<ReviewComment[]>;
  add: (reviewId: number, text: string) => Promise<ReviewComment>;
  remove: (reviewId: number, commentId: number) => Promise<void>;
}

// fora do componente: o useFetch precisa de uma função estável
const movieCommentsApi: CommentsApi = { list: getReviewComments, add: addReviewComment, remove: deleteReviewComment };

/** comentários da review: qualquer pessoa lê; logado, comenta; autor do comentário ou dono da review apagam */
export function ReviewComments({ review, href, api = movieCommentsApi, onCountChange }: {
  review: { id: number; user: UserSummary };
  /** endereço da página, para voltar depois do login */
  href: string;
  api?: CommentsApi;
  onCountChange: (delta: number) => void;
}) {
  const { status, user: me } = useAuth();
  const comments = useFetch(review.id, api.list);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isReviewOwner = me?.username === review.user.username;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !comments.data) return;
    setSending(true);
    setError(null);
    try {
      const comment = await api.add(review.id, text.trim());
      comments.setData([...comments.data, comment]);
      onCountChange(1);
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível comentar agora.");
    } finally {
      setSending(false);
    }
  };

  const remove = async (commentId: number) => {
    if (!comments.data) return;
    try {
      await api.remove(review.id, commentId);
      comments.setData(comments.data.filter((c) => c.id !== commentId));
      onCountChange(-1);
    } catch {
      setError("Não foi possível apagar o comentário.");
    }
  };

  return (
    <section id="comentarios" className="mt-16 scroll-mt-24">
      <SectionHeading title="Comentários" count={comments.data?.length} />

      {comments.data && comments.data.length > 0 && (
        <ul className="flex flex-col divide-y divide-foreground/5 -mt-2 mb-6">
          {comments.data.map((comment) => (
            <li key={comment.id} className="group flex gap-3 py-4">
              <Link href={`/u/${comment.user.username}`} className="shrink-0">
                <Avatar name={comment.user.name} username={comment.user.username} avatar={comment.user.avatar} size="sm" />
              </Link>
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <Link href={`/u/${comment.user.username}`} className="font-semibold hover:text-brand-orange">
                    {comment.user.name}
                  </Link>
                  <span className="ml-2 text-xs text-brand-slate/60">{timeAgo(comment.createdAt)}</span>
                </p>
                <p className="mt-1 text-[15px] leading-relaxed text-foreground/85 whitespace-pre-line break-words">{comment.text}</p>
              </div>
              {(isReviewOwner || me?.username === comment.user.username) && (
                <button
                  onClick={() => remove(comment.id)}
                  aria-label="Apagar comentário"
                  title="Apagar comentário"
                  className="self-start p-1.5 rounded-full text-brand-slate/40 opacity-100 sm:opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-brand-crimson transition-all"
                >
                  <TrashIcon size={15} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {comments.data?.length === 0 && <p className="-mt-1 mb-6 text-sm text-brand-slate">Ninguém comentou ainda.</p>}

      {status === "authenticated" ? (
        <form onSubmit={send} className="flex gap-3">
          <Avatar name={me.name} username={me.username} avatar={me.avatar} size="sm" />
          <div className="flex-1">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={COMMENT_MAX}
              rows={2}
              placeholder={isReviewOwner ? "Responda quem comentou…" : `Comente a review de ${review.user.name.split(" ")[0]}…`}
              aria-label="Escrever comentário"
              className="w-full px-4 py-3 bg-surface border border-transparent rounded-md text-sm placeholder:text-brand-slate/60 focus:outline-none focus:border-foreground/20 resize-y"
            />
            {error && <p className="mt-2 text-sm text-brand-crimson">{error}</p>}
            <div className="mt-2 flex justify-end">
              <button
                type="submit"
                disabled={sending || !text.trim()}
                className="px-4 py-2 rounded-md bg-brand-btn text-brand-btn-text text-sm font-semibold hover:bg-brand-btn/90 disabled:opacity-50 transition-colors"
              >
                {sending ? "Enviando…" : "Comentar"}
              </button>
            </div>
          </div>
        </form>
      ) : (
        status === "anonymous" && (
          <p className="text-sm text-brand-slate">
            <Link
              href={`/sign-in?redirect=${encodeURIComponent(href)}`}
              className="font-semibold text-foreground hover:text-brand-orange"
            >
              Entre
            </Link>{" "}
            para comentar.
          </p>
        )
      )}
    </section>
  );
}
