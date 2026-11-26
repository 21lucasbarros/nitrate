"use client";

import { useEffect, useState } from "react";
import { ArrowsClockwiseIcon, CalendarBlankIcon, CircleNotchIcon, FloppyDiskIcon, HeartIcon, TrashIcon, UsersIcon, WarningIcon } from "@phosphor-icons/react";
import { ApiError } from "@/lib/api-client";
import { useFetch } from "@/lib/hooks/use-fetch";
import {
  acceptSeriesReviewInvite,
  createSeriesReview,
  deleteSeriesReview,
  getSeason,
  getSeriesPosters,
  updateSeriesReview,
} from "@/lib/services/series-service";
import { clearReviewDraft, loadReviewDraft, saveReviewDraft, seriesReviewDraftKey, type SeriesReviewDraft } from "@/lib/review-draft";
import type { UserSummary } from "@/lib/types/user";
import { episodeCode, seasonLabel, type SeasonSummary, type Series, type SeriesReview, type SeriesReviewInvite } from "@/types/series";
import { joinNames, runtimeLabel, shortDate, todayIso } from "@/utils/format";
import { CompanionPicker } from "./companion-picker";
import { companionStatus } from "./review-form";
import { DeleteConfirmBar } from "./ui/delete-confirm-bar";
import { ChangeablePoster, ChangeablePosterSmall, PosterPicker } from "./poster-picker";
import { RichTextEditor } from "./ui/rich-text-editor";
import { StarInput } from "./ui/star-input";

const TEXT_MAX = 20000; // igual ao limite do backend

const selectClass =
  "w-full px-3 py-2 bg-surface border border-brand-slate/20 rounded-lg text-sm text-foreground focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue disabled:opacity-60 disabled:cursor-not-allowed";

interface SeriesReviewFormProps {
  series: Series;
  /** temporadas para escolher (vazio: só a série inteira) */
  seasons: SeasonSummary[];
  existing: SeriesReview | null;
  /** temporada já escolhida ao abrir (ex.: o botão "registrar" de uma temporada) */
  initialSeason?: number | null;
  /** episódio já escolhido ao abrir, junto com `initialSeason` */
  initialEpisode?: number | null;
  /** estreia da série (yyyy-mm-dd), para dizer quando a nota fica liberada */
  firstAirDate?: string | null;
  /** duração típica de um episódio, em minutos (quando o TMDB não sabe a do episódio) */
  episodeRunTime?: number | null;
  /** os registros que a pessoa já tem desta série: registrar de novo o mesmo é um reassistido */
  myReviews?: SeriesReview[];
  /** aceitando um convite de registro em conjunto escrevendo o próprio */
  invite?: SeriesReviewInvite;
  onSaved: (review: SeriesReview) => void;
  onDeleted: () => void;
  onCancel: () => void;
}

/**
 * Registro de uma série (a série inteira, uma temporada ou um episódio), no mesmo formato da review de
 * filme: data, reassistido, review, com quem assistiu, nota e curtida.
 */
export function SeriesReviewForm({
  series,
  seasons,
  existing,
  initialSeason = null,
  initialEpisode = null,
  firstAirDate = null,
  episodeRunTime = null,
  myReviews = [],
  invite,
  onSaved,
  onDeleted,
  onCancel,
}: SeriesReviewFormProps) {
  // no convite, o que foi assistido é o que quem convidou registrou
  const startSeason = invite ? invite.review.seasonNumber : existing ? existing.seasonNumber : initialSeason;
  const startEpisode = invite ? invite.review.episodeNumber : existing ? existing.episodeNumber : initialEpisode;
  // fechar o modal sem salvar não perde nada: o que foi preenchido volta da próxima vez (como nos filmes)
  const draftKey = seriesReviewDraftKey(series.id, {
    reviewId: existing?.id,
    inviteId: invite?.id,
    season: startSeason,
    episode: startEpisode,
  });
  // ler o sessionStorage na renderização é seguro: o formulário só existe dentro de um modal aberto por clique
  const [restored] = useState(() => loadReviewDraft<SeriesReviewDraft>(draftKey));
  const [showRestored, setShowRestored] = useState(restored !== null);

  const [seasonNumber, setSeasonNumber] = useState<number | null>(restored ? restored.seasonNumber : startSeason);
  const [episodeNumber, setEpisodeNumber] = useState<number | null>(restored ? restored.episodeNumber : startEpisode);
  // os episódios da temporada escolhida, para registrar um só
  const season = useFetch(seasonNumber === null ? null : `${series.id}|${seasonNumber}`, getSeason);

  // os outros registros da mesma série, temporada ou episódio: o novo é sempre reassistido (o backend garante)
  const sameTarget = (r: SeriesReview) => r.seasonNumber === seasonNumber && r.episodeNumber === episodeNumber;
  const others = myReviews.filter((r) => r.id !== existing?.id);
  const rewatchLocked = !existing && others.some(sameTarget);
  // como nos filmes: um registro novo já vem com a nota e a curtida do último do mesmo (quem reassiste costuma manter)
  const [previous] = useState(() =>
    existing ? null : others.find((r) => r.seasonNumber === startSeason && r.episodeNumber === startEpisode) ?? null,
  );
  const base = existing ?? previous;
  // o que o formulário mostraria sem rascunho
  const initial: SeriesReviewDraft = {
    seasonNumber: startSeason,
    episodeNumber: startEpisode,
    rating: base?.rating ?? null,
    liked: base?.liked ?? false,
    watchedOn: existing?.watchedOn ?? invite?.review.watchedOn ?? todayIso(),
    text: existing?.text ?? "",
    spoiler: existing?.spoiler ?? false,
    rewatch: existing?.rewatch ?? false,
  };
  const start = restored ?? initial;

  const [rating, setRating] = useState<number | null>(start.rating);
  const [liked, setLiked] = useState(start.liked);
  const [watchedOn, setWatchedOn] = useState(start.watchedOn);
  const [text, setText] = useState(start.text);
  const [spoiler, setSpoiler] = useState(start.spoiler);
  const [rewatch, setRewatch] = useState(start.rewatch);
  const [busy, setBusy] = useState<"save" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const current: SeriesReviewDraft = { seasonNumber, episodeNumber, rating, liked, watchedOn, text, spoiler, rewatch };
  const changed = (Object.keys(current) as (keyof SeriesReviewDraft)[]).some((k) => current[k] !== initial[k]);
  const currentJson = JSON.stringify(current);

  // guarda a cada mudança; voltar ao estado original apaga o rascunho
  useEffect(() => {
    if (busy !== null) return; // salvando/apagando: quem limpa é o fim da operação
    if (changed) saveReviewDraft(draftKey, JSON.parse(currentJson));
    else clearReviewDraft(draftKey);
  }, [draftKey, currentJson, changed, busy]);

  const discardDraft = () => {
    clearReviewDraft(draftKey);
    setSeasonNumber(initial.seasonNumber);
    setEpisodeNumber(initial.episodeNumber);
    setRating(initial.rating);
    setLiked(initial.liked);
    setWatchedOn(initial.watchedOn);
    setText(initial.text);
    setSpoiler(initial.spoiler);
    setRewatch(initial.rewatch);
    setShowRestored(false);
  };

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
  // depois que alguém aceitou, todo mundo assistiu a mesma coisa: a temporada e o episódio não mudam
  const targetLocked = joinedByInvite || acceptedUsernames.length > 0;

  // pôster no perfil: vale para todos os registros da série (temporadas e episódios também), então
  // vem de qualquer um deles. `poster` nulo = o da série; `shownPoster` é o que aparece no formulário
  const withPoster = existing ?? myReviews[0] ?? null;
  const initialPoster = withPoster?.customPoster ? withPoster.series.posterPath : null;
  const [poster, setPoster] = useState<string | null>(initialPoster);
  const [shownPoster, setShownPoster] = useState(initialPoster ?? series.posterPath);
  const [pickingPoster, setPickingPoster] = useState(false);
  const posterChanged = poster !== initialPoster;

  const hasText = text.trim().length > 0;
  const today = todayIso();
  const isEpisode = seasonNumber !== null && episodeNumber !== null;

  // como nos filmes: antes da estreia (da série, da temporada ou do episódio) dá para registrar e curtir,
  // mas a nota só depois. Sem a data, fica no benefício da dúvida (o backend tem a palavra final)
  const episode = episodeNumber === null ? undefined : season.data?.episodes.find((ep) => ep.episodeNumber === episodeNumber);
  const premiere = seasonNumber === null
    ? firstAirDate
    : episodeNumber === null
      ? seasons.find((s) => s.seasonNumber === seasonNumber)?.airDate ?? null
      : episode?.airDate ?? null;
  const rateable = series.released !== false && (premiere === null || premiere <= today);
  const notYet = seasonNumber === null ? "a série estrear" : episodeNumber === null ? "a temporada estrear" : "o episódio ir ao ar";
  // a duração do episódio escolhido (ou a típica da série, aproximada)
  const runtime = episode?.runtime ? runtimeLabel(episode.runtime) : isEpisode && episodeRunTime ? `~${runtimeLabel(episodeRunTime)}` : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy("save");
    setError(null);
    const data = {
      seasonNumber,
      episodeNumber: seasonNumber === null ? null : episodeNumber,
      // trocar para algo que ainda não estreou descarta a nota que já estava marcada
      rating: rateable ? rating : null,
      liked,
      watchedOn,
      text: text.trim() || null,
      spoiler: hasText && spoiler,
      rewatch: rewatch || rewatchLocked,
      // só manda quando muda: "" desfaz o convite pendente
      ...(!joinedByInvite && companionsChanged && { watchedWith: companions.map((u) => u.username) }),
      // só manda quando muda: "" volta ao pôster da série
      ...(posterChanged && { posterPath: poster ?? "" }),
    };
    try {
      const saved = invite
        ? await acceptSeriesReviewInvite(invite.id, data)
        : existing
          ? await updateSeriesReview(existing.id, data)
          : await createSeriesReview({ ...data, seriesId: series.id });
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
      await deleteSeriesReview(existing.id);
      clearReviewDraft(draftKey);
      onDeleted();
    } catch {
      setError("Não foi possível apagar. Tente novamente.");
      setBusy(null);
    }
  };

  // escolhendo o pôster: o seletor ocupa o modal e o resto do formulário continua como estava
  if (pickingPoster) {
    return (
      <PosterPicker
        id={series.id}
        load={getSeriesPosters}
        kind="series"
        title={series.name}
        selected={shownPoster}
        onPick={(path, isDefault) => {
          setPoster(isDefault ? null : path);
          setShownPoster(path);
          setPickingPoster(false);
        }}
        onBack={() => setPickingPoster(false)}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* pôster à esquerda (desktop) e o formulário ao lado, como na review de filme */}
      <div className="grid sm:grid-cols-[150px_minmax(0,1fr)] md:grid-cols-[180px_minmax(0,1fr)] gap-x-8 gap-y-6">
        <ChangeablePoster title={series.name} posterPath={shownPoster} custom={poster !== null} onChange={() => setPickingPoster(true)} />

        <div className="min-w-0 flex flex-col gap-5">
          {/* cabeçalho: qual série está sendo registrada */}
          <div className="flex items-center gap-4 pr-10">
            <ChangeablePosterSmall title={series.name} posterPath={shownPoster} onChange={() => setPickingPoster(true)} />
            <div className="min-w-0">
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-brand-orange">
                {invite ? "Sua review em conjunto" : existing ? "Editar registro" : rewatchLocked ? "Assisti de novo…" : "Eu assisti…"}
              </span>
              <h2 className="text-xl sm:text-2xl font-medium tracking-tight leading-tight mt-1 truncate">
                {series.name}{" "}
                {series.firstAirYear && <span className="text-foreground/40 font-normal">{series.firstAirYear}</span>}
              </h2>
              {isEpisode && (
                <p className="mt-1 text-sm text-brand-slate truncate tabular-nums">
                  {[episodeCode(seasonNumber, episodeNumber), episode?.name, runtime].filter(Boolean).join(" · ")}
                </p>
              )}
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

          {/* o que foi assistido: a série inteira, uma temporada ou um episódio */}
          {seasons.length > 0 && (
            <div
              className="grid sm:grid-cols-2 gap-3"
              title={targetLocked ? "Num registro em conjunto, todo mundo assistiu a mesma coisa" : undefined}
            >
              <label className="flex flex-col gap-2">
                <span className="text-xs uppercase tracking-[0.15em] text-brand-slate/60">O que você assistiu</span>
                <select
                  value={seasonNumber === null ? "" : String(seasonNumber)}
                  onChange={(e) => {
                    setSeasonNumber(e.target.value === "" ? null : Number(e.target.value));
                    setEpisodeNumber(null);
                  }}
                  disabled={targetLocked}
                  className={selectClass}
                >
                  <option value="">{seasonLabel(null)}</option>
                  {seasons.map((s) => (
                    <option key={s.seasonNumber} value={s.seasonNumber}>
                      {s.name || seasonLabel(s.seasonNumber)}
                    </option>
                  ))}
                </select>
              </label>

              {seasonNumber !== null && (
                <label className="flex flex-col gap-2">
                  <span className="text-xs uppercase tracking-[0.15em] text-brand-slate/60">Episódio</span>
                  <select
                    value={episodeNumber === null ? "" : String(episodeNumber)}
                    onChange={(e) => setEpisodeNumber(e.target.value === "" ? null : Number(e.target.value))}
                    disabled={targetLocked || (!season.data && !season.error)}
                    className={selectClass}
                  >
                    <option value="">Temporada completa</option>
                    {/* enquanto carrega (ou se falhar), o episódio já escolhido continua na lista */}
                    {!season.data && episodeNumber !== null && <option value={episodeNumber}>Episódio {episodeNumber}</option>}
                    {season.data?.episodes.map((ep) => {
                      // episódio que ainda não foi ao ar não dá para ter assistido (a não ser o que já estava registrado)
                      const upcoming = ep.airDate !== null && ep.airDate > today && ep.episodeNumber !== existing?.episodeNumber;
                      return (
                        <option key={ep.episodeNumber} value={ep.episodeNumber} disabled={upcoming}>
                          {ep.episodeNumber}. {ep.name || `Episódio ${ep.episodeNumber}`}
                          {ep.runtime ? ` · ${runtimeLabel(ep.runtime)}` : ""}
                          {upcoming && ep.airDate ? ` (estreia em ${shortDate(ep.airDate)})` : ""}
                        </option>
                      );
                    })}
                  </select>
                </label>
              )}
            </div>
          )}

          {/* data e reassistido na mesma linha */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <label className="flex items-center gap-2.5 text-sm text-brand-slate/80">
              {isEpisode ? "Assistido em" : "Terminei em"}
              <input
                type="date"
                value={watchedOn}
                max={today}
                onChange={(e) => setWatchedOn(e.target.value)}
                className="px-3 py-1.5 bg-transparent border border-brand-slate/20 rounded-lg text-sm text-foreground focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
              />
            </label>
            <label
              className={`flex items-center gap-2.5 w-fit text-sm select-none ${rewatchLocked ? "text-brand-slate/50" : "cursor-pointer text-brand-slate/80"}`}
              title={rewatchLocked ? `Você já registrou ${isEpisode ? "este episódio" : seasonNumber !== null ? "esta temporada" : "esta série"}` : undefined}
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
            <RichTextEditor
              label={`Sua review de ${series.name}${isEpisode ? `, ${episodeCode(seasonNumber, episodeNumber)}` : ""}`}
              value={text}
              onChange={setText}
              maxLength={TEXT_MAX}
              placeholder="Escreva sua review… (opcional)"
              rows={5}
            />
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
                <StarInput value={rating} onChange={setRating} size={30} />
              ) : (
                <span className="flex items-center gap-2 min-h-[38px] text-sm text-brand-slate/80">
                  <CalendarBlankIcon size={18} className="shrink-0" />
                  {premiere ? `Liberada na estreia, em ${shortDate(premiere)}` : `Liberada quando ${notYet}`}
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
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm">{error}</div>
      )}

      {confirmingDelete ? (
        <DeleteConfirmBar
          title="Apagar este registro da série?"
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
