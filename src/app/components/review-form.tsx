"use client";

import { useEffect, useState } from "react";
import { ArrowsClockwiseIcon, CalendarBlankIcon, CircleNotchIcon, FloppyDiskIcon, HeartIcon, TrashIcon, UsersIcon, WarningIcon } from "@phosphor-icons/react";
import { ApiError } from "@/lib/api-client";
import { acceptReviewInvite, createReview, deleteReview, updateReview } from "@/lib/services/review-service";
import type { MovieReview, ReviewInvite } from "@/lib/types/review";
import type { UserSummary } from "@/lib/types/user";
import { canRate, type Movie } from "@/types/movie";
import { easterEggFor } from "@/lib/easter-eggs";
import { showQuote } from "@/lib/hooks/use-easter-eggs";
import { clearReviewDraft, loadReviewDraft, reviewDraftKey, saveReviewDraft, type ReviewDraft } from "@/lib/review-draft";
import { joinNames, runtimeLabel, shortDate, todayIso } from "@/utils/format";
import { CompanionPicker } from "./companion-picker";
import { DeleteConfirmBar } from "./ui/delete-confirm-bar";
import { Poster } from "./ui/poster";
import { RichTextEditor } from "./ui/rich-text-editor";
import { StarInput } from "./ui/star-input";

const TEXT_MAX = 20000; // igual ao limite do backend (reviews importadas do Letterboxd são longas)

interface ReviewFormProps {
  movie: Movie;
  existing: MovieReview | null;
  /** já existe alguma review deste filme: a nova é um reassistido */
  previouslyWatched?: boolean;
  /** a review mais recente do filme: um registro novo já vem com a nota e a curtida dela */
  previous?: MovieReview | null;
  /** duração do filme, em minutos */
  runtime?: number | null;
  /** aceitando um convite de review em conjunto escrevendo a própria review */
  invite?: ReviewInvite;
  onSaved: (review: MovieReview) => void;
  onDeleted: () => void;
  onCancel: () => void;
}

export function ReviewForm({ movie, existing, previouslyWatched = false, previous = null, runtime = null, invite, onSaved, onDeleted, onCancel }: ReviewFormProps) {
  // antes da estreia a review pode ter texto e curtida, mas não nota
  const rateable = canRate(movie);
  // o que o formulário mostraria sem rascunho: a review salva; num registro novo, a nota e a curtida
  // do último (quem reassiste costuma manter, e muda se quiser); senão, tudo em branco
  const base = existing ?? previous;
  const initial: ReviewDraft = {
    rating: rateable ? base?.rating ?? null : null,
    liked: base?.liked ?? false,
    // no convite, a sessão é a mesma de quem convidou
    watchedOn: existing?.watchedOn ?? invite?.review.watchedOn ?? todayIso(),
    text: existing?.text ?? "",
    spoiler: existing?.spoiler ?? false,
    rewatch: existing?.rewatch ?? previouslyWatched,
  };
  // fechar o modal sem salvar não perde nada: o que foi preenchido volta da próxima vez
  const draftKey = reviewDraftKey(movie.id, existing?.id);
  // ler o sessionStorage na renderização é seguro aqui: o formulário só existe dentro de um modal
  // aberto por clique, então nunca passa pelo SSR (e não há hidratação para divergir)
  const [restored] = useState(() => loadReviewDraft(draftKey));
  const start = restored ? { ...restored, rating: rateable ? restored.rating : null } : initial;
  const [showRestored, setShowRestored] = useState(restored !== null);

  const [rating, setRating] = useState<number | null>(start.rating);
  const [liked, setLiked] = useState(start.liked);
  const [watchedOn, setWatchedOn] = useState(start.watchedOn);
  const [text, setText] = useState(start.text);
  const [spoiler, setSpoiler] = useState(start.spoiler);
  const [rewatch, setRewatch] = useState(start.rewatch);
  // a segunda review de um filme no Nitrate é sempre reassistido (o backend garante)
  const rewatchLocked = !existing && previouslyWatched;
  const [busy, setBusy] = useState<"save" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // "assisti com": quem convidou marca quantas pessoas quiser e pode tirar quem ainda não aceitou;
  // quem entrou por convite só vê a sessão
  const together = existing?.together ?? null;
  const joinedByInvite = invite !== undefined || (together !== null && !together.invitedByMe);
  const initialCompanions: UserSummary[] = invite
    ? [invite.author, ...invite.companions.filter((p) => p.status === "ACCEPTED").map((p) => p.user)]
    : (together?.partners.map((p) => p.user) ?? []);
  const [companions, setCompanions] = useState<UserSummary[]>(initialCompanions);
  const acceptedUsernames = (together?.partners ?? []).filter((p) => p.status === "ACCEPTED").map((p) => p.user.username);
  const companionsChanged =
    companions.map((u) => u.username).join() !== initialCompanions.map((u) => u.username).join();
  const companionHint = joinedByInvite
    ? `Review em conjunto com ${joinNames(initialCompanions.map((u) => u.name))}`
    : companionStatus(companions, initialCompanions, acceptedUsernames);

  const hasText = text.trim().length > 0;

  const current: ReviewDraft = { rating, liked, watchedOn, text, spoiler, rewatch };
  const changed = (Object.keys(current) as (keyof ReviewDraft)[]).some((k) => current[k] !== initial[k]);
  const currentJson = JSON.stringify(current);

  // guarda a cada mudança; voltar ao estado original apaga o rascunho
  useEffect(() => {
    if (busy !== null) return; // salvando/apagando: quem limpa é o fim da operação
    if (changed) saveReviewDraft(draftKey, JSON.parse(currentJson));
    else clearReviewDraft(draftKey);
  }, [draftKey, currentJson, changed, busy]);

  const discardDraft = () => {
    clearReviewDraft(draftKey);
    setRating(initial.rating);
    setLiked(initial.liked);
    setWatchedOn(initial.watchedOn);
    setText(initial.text);
    setSpoiler(initial.spoiler);
    setRewatch(initial.rewatch);
    setShowRestored(false);
  };

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
      // só manda quando muda: "" desfaz o convite pendente
      ...(!joinedByInvite && companionsChanged && { watchedWith: companions.map((u) => u.username) }),
    };
    try {
      const saved = invite
        ? await acceptReviewInvite(invite.id, data)
        : existing
          ? await updateReview(existing.id, data)
          : await createReview({ ...data, movieId: movie.id });
      clearReviewDraft(draftKey);
      onSaved(saved);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível salvar. Tente novamente.");
      setBusy(null);
    }
  };

  const handleDelete = async () => {
    if (!existing) return;
    setBusy("delete");
    setError(null);
    try {
      await deleteReview(existing.id);
      clearReviewDraft(draftKey);
      onDeleted();
    } catch {
      setError("Não foi possível apagar. Tente novamente.");
      setBusy(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* pôster à esquerda (desktop) e o formulário ao lado: o modal cresce para os lados, não para baixo */}
      <div className="grid sm:grid-cols-[150px_minmax(0,1fr)] md:grid-cols-[180px_minmax(0,1fr)] gap-x-8 gap-y-6">
        <div className="hidden sm:block">
          <Poster title={movie.title} posterPath={movie.posterPath} size="w500" sizes="180px" className="shadow-xl shadow-black/40" />
        </div>

        <div className="min-w-0 flex flex-col gap-5">
          {/* cabeçalho: qual filme está sendo registrado */}
          <div className="flex items-center gap-4 pr-10">
            <div className="w-14 shrink-0 sm:hidden">
              <Poster title={movie.title} posterPath={movie.posterPath} size="w185" sizes="56px" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-brand-orange">
                {invite ? "Sua review em conjunto" : existing ? "Editar review" : previouslyWatched ? "Assisti de novo…" : "Eu assisti…"}
              </span>
              <h2 className="text-xl sm:text-2xl font-medium tracking-tight leading-tight mt-1 truncate">
                {movie.title}{" "}
                {movie.releaseYear && <span className="text-foreground/40 font-normal">{movie.releaseYear}</span>}
              </h2>
              {runtime ? <p className="mt-1 text-sm text-brand-slate tabular-nums">{runtimeLabel(runtime)}</p> : null}
            </div>
          </div>

          {showRestored && (
            <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg bg-brand-blue/10 text-sm text-foreground/85">
              <FloppyDiskIcon size={16} className="shrink-0 text-brand-blue" />
              <span className="flex-1">Rascunho recuperado: continuamos de onde você parou.</span>
              <button type="button" onClick={discardDraft} className="shrink-0 text-brand-slate hover:text-brand-crimson transition-colors">
                Descartar
              </button>
            </div>
          )}

          {/* data e reassistido na mesma linha */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <label className="flex items-center gap-2.5 text-sm text-brand-slate/80">
              Assistido em
              <input
                type="date"
                value={watchedOn}
                max={todayIso()}
                onChange={(e) => setWatchedOn(e.target.value)}
                className="px-3 py-1.5 bg-transparent border border-brand-slate/20 rounded-lg text-sm text-foreground focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
              />
            </label>
            <label
              className={`flex items-center gap-2.5 w-fit text-sm select-none ${rewatchLocked ? "text-brand-slate/50" : "cursor-pointer text-brand-slate/80"}`}
              title={rewatchLocked ? "Você já registrou este filme" : undefined}
            >
              <input
                type="checkbox"
                checked={rewatch || rewatchLocked}
                disabled={rewatchLocked}
                onChange={(e) => setRewatch(e.target.checked)}
                className="w-4 h-4 accent-brand-orange"
              />
              <ArrowsClockwiseIcon size={16} weight="bold" className={rewatch || rewatchLocked ? "text-brand-orange" : ""} />
              {rewatchLocked ? "Reassistido" : "Já tinha assistido antes"}
            </label>
          </div>

          <div className="flex flex-col gap-2">
            {together?.sharedText && together.invitedBy && (
              <p className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-background/40 text-sm text-brand-slate">
                <UsersIcon size={16} className="shrink-0 text-brand-orange" />
                Este texto é a review de {together.invitedBy.name}. Se você mudar, a review passa a ser sua.
              </p>
            )}
            <div className="relative">
              <RichTextEditor
                label={`Sua review de ${movie.title}`}
                value={text}
                onChange={handleText}
                maxLength={TEXT_MAX}
                placeholder="Escreva sua review… (opcional)"
                rows={5}
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
            <label
              className={`flex items-center gap-2.5 w-fit text-sm select-none ${hasText ? "cursor-pointer text-brand-slate/80" : "cursor-not-allowed text-brand-slate/35"}`}
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

          {/* assisti com, nota e curtida na mesma faixa, embaixo do texto */}
          <div className="flex flex-wrap items-start gap-x-8 gap-y-5 pt-5 border-t border-foreground/10">
            <div className="flex-1 min-w-[220px]">
              <CompanionPicker
                value={companions}
                onChange={setCompanions}
                lockedUsernames={acceptedUsernames}
                readOnly={joinedByInvite}
                hint={companionHint}
              />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.15em] text-brand-slate/60">Nota</span>
              {rateable ? (
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
              ) : (
                <span className="flex items-center gap-2 min-h-[38px] text-sm text-brand-slate/80">
                  <CalendarBlankIcon size={18} className="shrink-0" />
                  {movie.releaseDate ? `Liberada na estreia, em ${shortDate(movie.releaseDate)}` : "Liberada quando o filme estrear"}
                </span>
              )}
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
          </div>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
          {error}
        </div>
      )}

      {confirmingDelete ? (
        <DeleteConfirmBar
          title="Apagar sua review deste filme?"
          busy={busy === "delete"}
          onKeep={() => setConfirmingDelete(false)}
          onConfirm={handleDelete}
        />
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          {existing && (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              disabled={busy !== null}
              className="flex items-center gap-2 px-2 py-3 text-sm font-medium text-brand-crimson/70 hover:text-brand-crimson transition-colors"
            >
              <TrashIcon size={18} />
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
      )}
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

/** a linha embaixo de quem foi marcado: quem já aceitou, quem ainda não respondeu e quem vai receber o convite */
export function companionStatus(companions: UserSummary[], initial: UserSummary[], accepted: string[]): string | undefined {
  const names = (users: UserSummary[]) => joinNames(users.map((u) => u.name));
  const plural = (users: UserSummary[], one: string, many: string) => (users.length > 1 ? many : one);
  const wasThere = new Set(initial.map((u) => u.username));
  const joined = companions.filter((u) => accepted.includes(u.username));
  const waiting = companions.filter((u) => wasThere.has(u.username) && !accepted.includes(u.username));
  const invited = companions.filter((u) => !wasThere.has(u.username));
  const parts = [
    joined.length > 0 && `${names(joined)} ${plural(joined, "já aceitou", "já aceitaram")}`,
    waiting.length > 0 && `Aguardando ${names(waiting)} ${plural(waiting, "aceitar", "aceitarem")} o convite`,
    invited.length > 0 &&
      `${names(invited)} ${plural(invited, "vai", "vão")} receber um convite para a review em conjunto`,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(". ") : undefined;
}
