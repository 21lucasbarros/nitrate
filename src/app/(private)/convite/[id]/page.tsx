"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CheckIcon, CircleNotchIcon, CopyIcon, PencilSimpleLineIcon, XIcon } from "@phosphor-icons/react";

import Header from "@/app/components/header";
import { ReviewCard, reviewHref } from "@/app/components/review-card";
import { ReviewForm } from "@/app/components/review-form";
import { Avatar } from "@/app/components/ui/avatar";
import { Modal } from "@/app/components/ui/modal";
import { ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useFetch } from "@/lib/hooks/use-fetch";
import { acceptReviewInvite, declineReviewInvite, getReviewInvite } from "@/lib/services/review-service";
import { getMovieState } from "@/lib/services/user-service";
import type { MovieReview, ReviewInvite } from "@/lib/types/review";
import { joinNames } from "@/utils/format";

export default function InvitePage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const validId = Number.isInteger(id) && id > 0 ? id : null;
  const invite = useFetch(validId, getReviewInvite);
  // convite desfeito (a review foi apagada) ou de outra pessoa
  const missing =
    validId === null || (invite.error instanceof ApiError && (invite.error.status === 404 || invite.error.status === 403));

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Header />
      <main className="pt-28 sm:pt-32 pb-24 px-6 max-w-[760px] mx-auto">
        {missing ? (
          <div className="pt-16 text-center">
            <h1 className="text-3xl font-medium tracking-tight">Convite não encontrado.</h1>
            <p className="mt-3 text-brand-slate">A review pode ter sido apagada ou o convite foi desfeito.</p>
          </div>
        ) : !invite.data ? (
          <div className="pt-16 flex justify-center text-brand-slate/40">
            {invite.error ? "Não foi possível carregar o convite." : <CircleNotchIcon size={32} className="animate-spin" />}
          </div>
        ) : (
          <InviteView invite={invite.data} />
        )}
      </main>
    </div>
  );
}

function InviteView({ invite }: { invite: ReviewInvite }) {
  const { user: me, refreshUser } = useAuth();
  const router = useRouter();
  const { author, review } = invite;
  const movie = review.movie;
  const isInvitee = me?.username === invite.invitee.username;
  const firstName = author.name.split(" ")[0];
  // as outras pessoas que quem convidou marcou na mesma sessão
  const others = invite.companions.map((p) => p.user);

  const [step, setStep] = useState<"ask" | "choose">("ask");
  const [writing, setWriting] = useState(false);
  const [busy, setBusy] = useState<"decline" | "shared" | null>(null);
  const [declined, setDeclined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // o filme já está no diário: a review nova entra como reassistido
  const state = useFetch(isInvitee && invite.status === "PENDING" ? movie.id : null, getMovieState);

  const done = (saved: MovieReview) => {
    refreshUser();
    router.push(reviewHref(saved));
  };

  const decline = async () => {
    setBusy("decline");
    setError(null);
    try {
      await declineReviewInvite(invite.id);
      setDeclined(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível recusar. Tente novamente.");
    }
    setBusy(null);
  };

  const useTheirs = async () => {
    setBusy("shared");
    setError(null);
    try {
      done(await acceptReviewInvite(invite.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível aceitar. Tente novamente.");
      setBusy(null);
    }
  };

  const status = declined ? "DECLINED" : invite.status;

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="flex -space-x-2">
          {[author, invite.invitee, ...others].slice(0, 5).map((u) => (
            <span key={u.username} className="rounded-full ring-2 ring-background">
              <Avatar name={u.name} username={u.username} avatar={u.avatar} size="md" />
            </span>
          ))}
        </div>
        <span className="text-xs font-bold tracking-[0.2em] uppercase text-brand-orange">Review em conjunto</span>
      </div>
      <h1 className="mt-4 text-3xl sm:text-4xl font-medium tracking-tight leading-tight">
        {isInvitee ? (
          <>
            {author.name} assistiu <span className="font-serif font-semibold">{movie.title}</span> com você
            {others.length > 0 && <> e com {joinNames(others.map((u) => u.name))}</>}.
          </>
        ) : (
          <>
            Você marcou {invite.invitee.name} em <span className="font-serif font-semibold">{movie.title}</span>.
          </>
        )}
      </h1>

      <div className="mt-8 px-5 rounded-xl bg-surface">
        <ReviewCard review={review} />
      </div>

      {!isInvitee ? (
        <p className="mt-8 text-brand-slate">
          {status === "PENDING"
            ? `Aguardando ${invite.invitee.name} responder.`
            : status === "ACCEPTED"
              ? `${invite.invitee.name} aceitou a review em conjunto.`
              : `${invite.invitee.name} recusou o convite.`}
        </p>
      ) : status === "ACCEPTED" ? (
        <p className="mt-8 text-brand-slate">
          Você já aceitou.{" "}
          {invite.inviteeReviewId && (
            <Link href={`/u/${invite.invitee.username}/reviews/${invite.inviteeReviewId}`} className="text-brand-blue hover:underline">
              Ver a sua review
            </Link>
          )}
        </p>
      ) : status === "DECLINED" ? (
        <p className="mt-8 text-brand-slate">
          Você recusou o convite. A review de {firstName} continua no perfil sem você marcado.
        </p>
      ) : step === "ask" ? (
        <div className="mt-8">
          <p className="text-brand-slate">
            Aceitando, {movie.title} entra no seu diário e {others.length > 0 ? "as reviews de quem aceitar aparecem" : "as duas reviews aparecem"}{" "}
            juntas, com vocês marcados.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setStep("choose")}
              className="flex items-center gap-2 bg-brand-btn text-brand-btn-text px-6 py-3 rounded-full font-semibold hover:bg-brand-btn/90 transition-colors"
            >
              <CheckIcon size={18} weight="bold" />
              Aceitar
            </button>
            <button
              type="button"
              onClick={decline}
              disabled={busy !== null}
              className="flex items-center gap-2 px-5 py-3 rounded-full font-medium text-brand-slate hover:text-foreground transition-colors disabled:opacity-60"
            >
              {busy === "decline" ? <CircleNotchIcon size={18} className="animate-spin" /> : <XIcon size={18} />}
              Recusar
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-8">
          <p className="font-medium">Como você quer registrar?</p>
          <div className="mt-4 grid sm:grid-cols-2 gap-3">
            <ChoiceButton
              icon={busy === "shared" ? <CircleNotchIcon size={22} className="animate-spin" /> : <CopyIcon size={22} />}
              title={`Usar a review de ${firstName}`}
              text={`A nota, a curtida e o texto de ${firstName} vão para o seu diário. Dá para editar depois.`}
              onClick={useTheirs}
              disabled={busy !== null}
            />
            <ChoiceButton
              icon={<PencilSimpleLineIcon size={22} />}
              title="Escrever a minha"
              text="Sua própria nota e review, que continuam aparecendo como review em conjunto."
              onClick={() => setWriting(true)}
              disabled={busy !== null}
            />
          </div>
          <button type="button" onClick={() => setStep("ask")} className="mt-4 text-sm text-brand-slate hover:text-foreground">
            Voltar
          </button>
        </div>
      )}

      {error && (
        <div className="mt-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm">{error}</div>
      )}

      {isInvitee && status === "PENDING" && (
        <Modal open={writing} onClose={() => setWriting(false)} label={`Sua review de ${movie.title}`} size="wide">
          <ReviewForm
            key={writing ? "aberto" : "fechado"}
            movie={movie}
            existing={null}
            invite={invite}
            previouslyWatched={(state.data?.reviewsCount ?? 0) > 0}
            previous={state.data?.review}
            onSaved={done}
            onDeleted={() => setWriting(false)}
            onCancel={() => setWriting(false)}
          />
        </Modal>
      )}
    </>
  );
}

function ChoiceButton({ icon, title, text, onClick, disabled }: {
  icon: React.ReactNode;
  title: string;
  text: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group flex flex-col items-start gap-2 p-5 rounded-xl border border-foreground/10 text-left hover:border-brand-orange/50 hover:bg-surface transition-colors disabled:opacity-60"
    >
      <span className="text-brand-slate group-hover:text-brand-orange transition-colors">{icon}</span>
      <span className="font-semibold">{title}</span>
      <span className="text-sm text-brand-slate leading-relaxed">{text}</span>
    </button>
  );
}
