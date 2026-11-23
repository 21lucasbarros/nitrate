"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CheckIcon, CircleNotchIcon, CopyIcon, HeartIcon, PencilSimpleLineIcon, XIcon } from "@phosphor-icons/react";

import Header from "@/app/components/header";
import { ChoiceButton } from "@/app/components/invite-choice";
import { SeriesReviewForm } from "@/app/components/series-review-form";
import { Avatar } from "@/app/components/ui/avatar";
import { Modal } from "@/app/components/ui/modal";
import { Poster } from "@/app/components/ui/poster";
import { ReviewText } from "@/app/components/ui/review-text";
import { StarRating } from "@/app/components/ui/star-rating";
import { ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useFetch } from "@/lib/hooks/use-fetch";
import {
  acceptSeriesReviewInvite,
  declineSeriesReviewInvite,
  getSeriesDetails,
  getSeriesReviewInvite,
  getSeriesState,
} from "@/lib/services/series-service";
import { seasonLabel, type SeriesReview, type SeriesReviewInvite } from "@/types/series";
import { joinNames, shortDate } from "@/utils/format";
import { toRating } from "@/utils/rating";
import { seriesReviewHref } from "@/utils/series-link";

/** O convite de registro de série em conjunto, como o dos filmes (/convite/[id]). */
export default function SeriesInvitePage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const validId = Number.isInteger(id) && id > 0 ? id : null;
  const invite = useFetch(validId, getSeriesReviewInvite);
  // convite desfeito (o registro foi apagado) ou de outra pessoa
  const missing =
    validId === null || (invite.error instanceof ApiError && (invite.error.status === 404 || invite.error.status === 403));

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Header />
      <main className="pt-28 sm:pt-32 pb-24 px-6 max-w-[760px] mx-auto">
        {missing ? (
          <div className="pt-16 text-center">
            <h1 className="text-3xl font-medium tracking-tight">Convite não encontrado.</h1>
            <p className="mt-3 text-brand-slate">O registro pode ter sido apagado ou o convite foi desfeito.</p>
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

function InviteView({ invite }: { invite: SeriesReviewInvite }) {
  const { user: me, refreshUser } = useAuth();
  const router = useRouter();
  const { author, review } = invite;
  const series = review.series;
  // "Ruptura" ou "Ruptura, Temporada 2"
  const title = review.seasonNumber === null ? series.name : `${series.name}, ${seasonLabel(review.seasonNumber, review.episodeNumber)}`;
  const isInvitee = me?.username === invite.invitee.username;
  const firstName = author.name.split(" ")[0];
  // as outras pessoas que quem convidou marcou na mesma sessão
  const others = invite.companions.map((p) => p.user);

  const [step, setStep] = useState<"ask" | "choose">("ask");
  const [writing, setWriting] = useState(false);
  const [busy, setBusy] = useState<"decline" | "shared" | null>(null);
  const [declined, setDeclined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = isInvitee && invite.status === "PENDING";
  // escrevendo o próprio: as temporadas (para o formulário) e os registros que a pessoa já tem (reassistido)
  const details = useFetch(pending ? series.id : null, getSeriesDetails);
  const state = useFetch(pending ? series.id : null, getSeriesState);

  const done = (saved: SeriesReview) => {
    refreshUser();
    router.push(seriesReviewHref(saved));
  };

  const decline = async () => {
    setBusy("decline");
    setError(null);
    try {
      await declineSeriesReviewInvite(invite.id);
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
      done(await acceptSeriesReviewInvite(invite.id));
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
            {author.name} assistiu <span className="font-serif font-semibold">{title}</span> com você
            {others.length > 0 && <> e com {joinNames(others.map((u) => u.name))}</>}.
          </>
        ) : (
          <>
            Você marcou {invite.invitee.name} em <span className="font-serif font-semibold">{title}</span>.
          </>
        )}
      </h1>

      <AuthorReview review={review} />

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
            <Link href={`/u/${invite.invitee.username}/series/${invite.inviteeReviewId}`} className="text-brand-blue hover:underline">
              Ver o seu registro
            </Link>
          )}
        </p>
      ) : status === "DECLINED" ? (
        <p className="mt-8 text-brand-slate">
          Você recusou o convite. O registro de {firstName} continua no perfil sem você marcado.
        </p>
      ) : step === "ask" ? (
        <div className="mt-8">
          <p className="text-brand-slate">
            Aceitando, {title} entra no seu diário e {others.length > 0 ? "as reviews de quem aceitar aparecem" : "as duas reviews aparecem"}{" "}
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

      {pending && (
        <Modal open={writing} onClose={() => setWriting(false)} label={`Sua review de ${series.name}`} size="wide">
          <SeriesReviewForm
            key={writing ? "aberto" : "fechado"}
            series={series}
            seasons={(details.data?.seasons ?? []).filter((s) => (s.episodeCount ?? 0) > 0)}
            existing={null}
            invite={invite}
            firstAirDate={details.data?.firstAirDate}
            episodeRunTime={details.data?.episodeRunTime}
            myReviews={state.data?.reviews}
            onSaved={done}
            onDeleted={() => setWriting(false)}
            onCancel={() => setWriting(false)}
          />
        </Modal>
      )}
    </>
  );
}

/** o registro de quem convidou: o que assistiu, nota, curtida e o começo da review */
function AuthorReview({ review }: { review: SeriesReview }) {
  return (
    <Link href={seriesReviewHref(review)} className="mt-8 flex gap-4 p-5 rounded-xl bg-surface hover:bg-surface-strong transition-colors">
      <div className="w-16 shrink-0">
        <Poster title={review.series.name} posterPath={review.series.posterPath} size="w185" sizes="64px" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium truncate">{review.series.name}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-brand-slate">
          <span className="px-2 py-0.5 rounded-full bg-background/60 text-xs">{seasonLabel(review.seasonNumber, review.episodeNumber)}</span>
          {review.rating !== null && <StarRating rating={toRating(review.rating)} size={15} />}
          {review.liked && <HeartIcon size={14} weight="fill" className="text-brand-orange" aria-label="Curtiu" />}
          <span>{shortDate(review.watchedOn)}</span>
        </div>
        {review.text && !review.spoiler && (
          <ReviewText text={review.text} inline className="mt-3 font-serif text-[16px] leading-[1.65] text-foreground/85 line-clamp-3" />
        )}
        {review.text && review.spoiler && <p className="mt-3 text-sm text-brand-slate">A review contém spoilers.</p>}
      </div>
    </Link>
  );
}
