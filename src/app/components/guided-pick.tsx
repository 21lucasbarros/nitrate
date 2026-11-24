"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowClockwiseIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  BrainIcon,
  CheckIcon,
  CircleNotchIcon,
  CompassIcon,
  CrownIcon,
  FilmReelIcon,
  GhostIcon,
  HeartIcon,
  HourglassIcon,
  LightningIcon,
  PlanetIcon,
  ShuffleIcon,
  SmileyIcon,
  SparkleIcon,
  StarIcon,
  TelevisionIcon,
  UserIcon,
  UsersFourIcon,
  UsersThreeIcon,
  type Icon,
} from "@phosphor-icons/react";
import {
  COMPANIES,
  ERAS,
  MIN_RESULTS,
  MOODS,
  NO_ANSWERS,
  STYLES,
  findPicks,
  type PickAnswers,
  type PickKind,
  type PickOutcome,
} from "@/lib/guided-pick";
import { Modal } from "./ui/modal";
import { Poster } from "./ui/poster";

const WORDS = {
  movies: { one: "filme", many: "filmes", some: "alguns filmes", watch: "assistir", catalog: "catálogo de filmes" },
  series: { one: "série", many: "séries", some: "algumas séries", watch: "maratonar", catalog: "catálogo de séries" },
};

const ICONS: Record<string, Icon> = {
  rir: SmileyIcon,
  tensao: GhostIcon,
  emocao: HeartIcon,
  adrenalina: LightningIcon,
  viajar: PlanetIcon,
  pensar: BrainIcon,
  sozinho: UserIcon,
  par: HeartIcon,
  amigos: UsersThreeIcon,
  familia: UsersFourIcon,
  recentes: SparkleIcon,
  "2000": TelevisionIcon,
  "80": FilmReelIcon,
  classicos: HourglassIcon,
  qualquer: CompassIcon,
  aclamados: StarIcon,
  comunidade: CrownIcon,
  surpresa: ShuffleIcon,
};

type Step = "mood" | "genres" | "company" | "era" | "style";
const STEPS: Step[] = ["mood", "genres", "company", "era", "style"];

type Phase = { name: "quiz"; step: number } | { name: "loading" } | { name: "result"; outcome: PickOutcome; offset: number } | { name: "error" };

/**
 * "Não sabe o que quer assistir?" (Inteligência Nitrate): um questionário curto de clima, gêneros,
 * companhia, época e estilo que devolve algumas sugestões do catálogo.
 */
export function GuidedPickBanner({ kind, genres, className = "" }: {
  kind: PickKind;
  /** os gêneros do catálogo (os mesmos dos filtros); enquanto carregam, o passo de gêneros espera */
  genres: string[] | undefined;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  // a key recomeça o questionário a cada vez que o modal abre
  const [session, setSession] = useState(0);
  const words = WORDS[kind];

  const start = () => {
    setSession((s) => s + 1);
    setOpen(true);
  };

  return (
    <>
      <div
        className={`relative flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-8 overflow-hidden rounded-lg bg-surface px-5 py-5 sm:px-7 ring-1 ring-inset ring-white/5 ${className}`}
      >
        {/* brilho por trás do ícone, no tom da Inteligência Nitrate */}
        <div aria-hidden="true" className="pointer-events-none absolute -left-10 top-1/2 -translate-y-1/2 w-60 h-60 rounded-full bg-brand-blue/15 blur-3xl" />
        <div aria-hidden="true" className="relative hidden sm:flex shrink-0 size-16 ml-2 items-center justify-center rounded-full bg-brand-blue/10 ring-1 ring-inset ring-brand-blue/25">
          <CompassIcon size={32} weight="duotone" className="text-brand-blue" />
        </div>

        <div className="relative flex-1 min-w-0">
          <span className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] uppercase text-brand-blue">
            Inteligência Nitrate
          </span>
          <h3 className="mt-1 text-lg sm:text-xl font-semibold tracking-tight">Não sabe o que quer {words.watch}?</h3>
          <p className="mt-1 text-sm text-brand-slate">
            Responda umas perguntas rápidas sobre o seu momento e a gente separa {words.some} do catálogo para você.
          </p>
        </div>

        <button
          type="button"
          onClick={start}
          className="group relative inline-flex items-center justify-center gap-2 shrink-0 px-5 py-3 rounded-md bg-brand-btn text-brand-btn-text font-semibold hover:bg-brand-btn/90 active:scale-[0.98] transition-all"
        >
          <SparkleIcon size={18} weight="fill" className="group-hover:rotate-45 transition-transform duration-500" />
          Me ajuda a escolher
        </button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} label={`Não sabe o que quer ${words.watch}? Questionário da Inteligência Nitrate`}>
        <GuidedPick key={session} kind={kind} genres={genres} />
      </Modal>
    </>
  );
}

function GuidedPick({ kind, genres }: { kind: PickKind; genres: string[] | undefined }) {
  const [answers, setAnswers] = useState<PickAnswers>(NO_ANSWERS);
  const [phase, setPhase] = useState<Phase>({ name: "quiz", step: 0 });
  const words = WORDS[kind];

  const search = (final: PickAnswers) => {
    setPhase({ name: "loading" });
    findPicks(kind, final, genres ?? [])
      .then((outcome) => setPhase({ name: "result", outcome, offset: 0 }))
      .catch(() => setPhase({ name: "error" }));
  };

  // escolher numa pergunta de uma resposta só já passa para a próxima
  const answer = (patch: Partial<PickAnswers>, step: number) => {
    const next = { ...answers, ...patch };
    setAnswers(next);
    if (step + 1 < STEPS.length) setPhase({ name: "quiz", step: step + 1 });
    else search(next);
  };

  const restart = () => {
    setAnswers(NO_ANSWERS);
    setPhase({ name: "quiz", step: 0 });
  };

  if (phase.name === "loading") return <ResultsSkeleton words={words} />;

  if (phase.name === "error") {
    return (
      <div className="py-12 text-center" aria-live="polite">
        <p className="text-red-500">Não foi possível buscar as sugestões agora.</p>
        <button type="button" onClick={() => search(answers)} className="mt-4 text-sm text-foreground underline underline-offset-4 decoration-foreground/30 hover:decoration-brand-orange">
          Tentar de novo
        </button>
      </div>
    );
  }

  if (phase.name === "result") {
    return (
      <Results
        kind={kind}
        answers={answers}
        outcome={phase.outcome}
        offset={phase.offset}
        onMore={() => setPhase({ ...phase, offset: phase.offset + MIN_RESULTS })}
        onRestart={restart}
      />
    );
  }

  const { step } = phase;
  const current = STEPS[step];
  const back = step > 0 ? () => setPhase({ name: "quiz", step: step - 1 }) : null;

  // o rodapé é o mesmo em todos os passos: Voltar à esquerda, pular (ou continuar) à direita
  const footer: React.ReactNode =
    current === "mood" ? (
      <FooterButton onClick={() => answer({ mood: null }, step)}>Tanto faz</FooterButton>
    ) : current === "company" ? (
      <FooterButton onClick={() => answer({ company: null }, step)}>Tanto faz</FooterButton>
    ) : current === "genres" ? (
      answers.genres.length > 0 ? (
        <FooterButton primary onClick={() => answer({}, step)}>
          Continuar com {answers.genres.length} <ArrowRightIcon size={14} weight="bold" />
        </FooterButton>
      ) : (
        <FooterButton onClick={() => answer({ genres: [] }, step)}>Pular</FooterButton>
      )
    ) : null;

  return (
    <div>
      <div className="flex items-center gap-3 pr-10">
        <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-brand-blue">Inteligência Nitrate</span>
      </div>
      <div className="mt-3 mr-10 flex gap-1" aria-hidden="true">
        {STEPS.map((s, i) => (
          <span key={s} className={`h-0.5 flex-1 rounded-full transition-colors duration-300 ${i <= step ? "bg-brand-blue" : "bg-foreground/10"}`} />
        ))}
      </div>

      <div key={step} className="mt-6 animate-[modal-in_200ms_ease-out]">
        {current === "mood" && (
          <Question title="Qual é o clima de hoje?" subtitle="O que você está a fim de sentir?">
            <Choices options={MOODS} selected={answers.mood} onPick={(mood) => answer({ mood }, step)} />
          </Question>
        )}
        {current === "genres" && (
          <Question
            title="Algum gênero em mente?"
            subtitle={answers.mood ? "Eles se juntam ao clima: quero rir + Terror = comédias de terror." : "Marque quantos quiser."}
          >
            <GenrePicker genres={genres} selected={answers.genres} onChange={(g) => setAnswers({ ...answers, genres: g })} />
          </Question>
        )}
        {current === "company" && (
          <Question title="Vai assistir com quem?" subtitle="Muda o tipo de história que faz sentido.">
            <Choices options={COMPANIES} selected={answers.company} onPick={(company) => answer({ company }, step)} />
          </Question>
        )}
        {current === "era" && (
          <Question title="De que época?" subtitle="Lançamento fresquinho ou clima de locadora?">
            <Choices options={ERAS} selected={answers.era} onPick={(era) => answer({ era }, step)} />
          </Question>
        )}
        {current === "style" && (
          <Question title="Como a gente escolhe?" subtitle="Última pergunta.">
            <Choices options={STYLES} selected={answers.style} onPick={(style) => answer({ style }, step)} />
          </Question>
        )}
      </div>

      <div className="mt-6 pt-4 flex items-center justify-between gap-3 border-t border-foreground/[0.06]">
        {back ? (
          <button type="button" onClick={back} className="inline-flex items-center gap-1.5 h-9 px-2 -ml-2 rounded-md text-sm text-brand-slate hover:text-foreground transition-colors">
            <ArrowLeftIcon size={14} weight="bold" /> Voltar
          </button>
        ) : (
          <span />
        )}
        <span className="text-xs tabular-nums text-brand-slate/60">
          {step + 1} de {STEPS.length}
        </span>
        <div className="flex min-w-20 justify-end">{footer}</div>
      </div>
    </div>
  );
}

function FooterButton({ onClick, primary = false, children }: { onClick: () => void; primary?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 h-9 px-4 rounded-md text-sm transition-colors ${
        primary ? "bg-brand-btn text-brand-btn-text font-semibold hover:bg-brand-btn/90" : "-mr-2 text-brand-slate hover:text-foreground hover:bg-foreground/[0.05]"
      }`}
    >
      {children}
    </button>
  );
}

function Question({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <>
      <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-brand-slate">{subtitle}</p>
      <div className="mt-5">{children}</div>
    </>
  );
}

function Choices<T extends string>({ options, selected, onPick }: {
  options: readonly { id: T; label: string; hint: string }[];
  selected: T | null;
  onPick: (id: T) => void;
}) {
  return (
    <div role="radiogroup" className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {options.map((option) => {
        const Icon = ICONS[option.id] ?? SparkleIcon;
        const isSelected = selected === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onPick(option.id)}
            className={`group flex items-center gap-3 p-3 rounded-md text-left transition-colors ${
              isSelected ? "bg-brand-blue/10 ring-1 ring-inset ring-brand-blue/50" : "bg-foreground/[0.04] hover:bg-foreground/[0.08]"
            }`}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-brand-blue/10 text-brand-blue">
              <Icon size={20} weight="duotone" className="group-hover:scale-110 transition-transform" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium leading-tight text-foreground">{option.label}</span>
              <span className="mt-0.5 block text-xs leading-tight text-brand-slate/80 truncate">{option.hint}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function GenrePicker({ genres, selected, onChange }: { genres: string[] | undefined; selected: string[]; onChange: (genres: string[]) => void }) {
  if (!genres) return <p className="text-sm text-brand-slate/60">Carregando gêneros…</p>;
  if (genres.length === 0) return <p className="text-sm text-brand-slate/60">Nenhum gênero no catálogo ainda.</p>;
  const toggle = (genre: string) => onChange(selected.includes(genre) ? selected.filter((g) => g !== genre) : [...selected, genre]);
  return (
    <div className="flex flex-wrap gap-1.5">
      {genres.map((genre) => {
        const isSelected = selected.includes(genre);
        return (
          <button
            key={genre}
            type="button"
            role="checkbox"
            aria-checked={isSelected}
            onClick={() => toggle(genre)}
            className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-sm transition-colors ${
              isSelected ? "bg-brand-blue text-brand-btn-text font-medium" : "bg-foreground/[0.05] text-brand-slate hover:text-foreground hover:bg-foreground/[0.08]"
            }`}
          >
            {isSelected && <CheckIcon size={12} weight="bold" />}
            {genre}
          </button>
        );
      })}
    </div>
  );
}

/** as respostas, em chips, no topo do resultado: "Quero tensão · Com amigos · Anos 80 e 90" */
function answerChips(answers: PickAnswers): string[] {
  const label = (options: readonly { id: string; label: string }[], id: string | null) => options.find((o) => o.id === id)?.label;
  return [
    label(MOODS, answers.mood),
    ...answers.genres,
    answers.company !== "sozinho" ? label(COMPANIES, answers.company) : undefined,
    answers.era !== "qualquer" ? label(ERAS, answers.era) : undefined,
    label(STYLES, answers.style),
  ].filter((chip): chip is string => Boolean(chip));
}

// o resultado tem altura fixa (pôster do destaque + fileira de miniaturas): cabe sem rolar
const FEATURED_POSTER = "w-24 sm:w-36";

/** enquanto busca: o esqueleto do resultado, para nada pular quando ele chega */
function ResultsSkeleton({ words }: { words: (typeof WORDS)[PickKind] }) {
  return (
    <div aria-live="polite" aria-busy="true">
      <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-brand-blue">Inteligência Nitrate</span>
      <h2 className="mt-1 flex items-center gap-2 text-xl sm:text-2xl font-semibold tracking-tight">
        <CircleNotchIcon size={20} className="animate-spin text-brand-blue" />
        Procurando {words.many} com a sua cara…
      </h2>
      <div className="mt-6 flex gap-4 sm:gap-6 animate-pulse">
        <div className={`${FEATURED_POSTER} shrink-0 aspect-2/3 rounded-md bg-foreground/[0.06]`} />
        <div className="flex-1 space-y-3 py-1">
          <div className="h-6 w-2/3 rounded bg-foreground/[0.06]" />
          <div className="h-3 w-1/3 rounded bg-foreground/[0.06]" />
          <div className="h-3 w-full rounded bg-foreground/[0.06]" />
          <div className="h-3 w-5/6 rounded bg-foreground/[0.06]" />
        </div>
      </div>
      <div className="mt-6 pt-5 border-t border-foreground/[0.06] grid grid-cols-7 gap-1.5 sm:gap-2 animate-pulse">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="aspect-2/3 rounded-md bg-foreground/[0.06]" />
        ))}
      </div>
    </div>
  );
}

function Results({ kind, answers, outcome, offset, onMore, onRestart }: {
  kind: PickKind;
  answers: PickAnswers;
  outcome: PickOutcome;
  offset: number;
  onMore: () => void;
  onRestart: () => void;
}) {
  const words = WORDS[kind];
  const { items, exact, relaxed } = outcome;
  // o destaque é o primeiro da rodada; clicar numa miniatura troca o destaque
  const [featuredKey, setFeaturedKey] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="py-10 text-center" aria-live="polite">
        <p className="text-brand-slate">Não achamos nada no {words.catalog} por enquanto.</p>
        <button type="button" onClick={onRestart} className="mt-4 text-sm text-foreground underline underline-offset-4 decoration-foreground/30 hover:decoration-brand-orange">
          Responder de novo
        </button>
      </div>
    );
  }

  // "Ver outros" anda pela lista ordenada e volta ao começo quando acaba
  const start = offset % items.length;
  const shown = [...items.slice(start), ...items.slice(0, start)].slice(0, MIN_RESULTS);
  const featured = shown.find((item) => item.key === featuredKey) ?? shown[0];
  const chips = answerChips(answers);
  const canMore = items.length > MIN_RESULTS;

  return (
    <div aria-live="polite">
      <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-brand-blue">Inteligência Nitrate</span>
      <h2 className="mt-1 text-xl sm:text-2xl font-semibold tracking-tight pr-10">
        {kind === "series" ? "Sua próxima série" : "Seu próximo filme"}
      </h2>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {chips.map((chip) => (
          <span key={chip} className="inline-flex items-center h-6 px-2.5 rounded-full bg-foreground/[0.05] text-xs text-brand-slate">
            {chip}
          </span>
        ))}
        <button
          type="button"
          onClick={onRestart}
          className="inline-flex items-center gap-1 h-6 px-2 text-xs text-brand-slate hover:text-foreground transition-colors"
        >
          <ArrowClockwiseIcon size={12} weight="bold" /> Refazer
        </button>
      </div>
      {relaxed && (
        <p className="mt-2 text-xs text-brand-slate/70">
          {exact === 0
            ? `Nenhum ${words.one} batia com tudo isso, então deixamos ${relaxed} de lado.`
            : `Só ${exact} ${exact === 1 ? words.one : words.many} ${exact === 1 ? "bate" : "batem"} com tudo isso. Para completar, deixamos ${relaxed} de lado.`}
        </p>
      )}

      {/* o destaque: pôster, nota, por que entrou, sinopse e o botão para abrir */}
      <div key={featured.key} className="mt-5 flex gap-4 sm:gap-6 animate-[modal-in_200ms_ease-out]">
        <Link href={featured.href} className={`group ${FEATURED_POSTER} shrink-0`}>
          <Poster
            title={featured.title}
            posterPath={featured.posterPath}
            size="w342"
            sizes="144px"
            className="shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
          />
        </Link>
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="font-serif text-lg sm:text-2xl font-semibold leading-tight line-clamp-2">
            {featured.title} {featured.year && <span className="text-sm sm:text-base font-normal text-foreground/40">{featured.year}</span>}
          </p>
          <p className="mt-1.5 mb-3 flex flex-wrap items-center gap-x-2 text-xs text-brand-slate">
            {featured.rating ? (
              <span className="inline-flex items-center gap-1 text-foreground">
                <StarIcon size={12} weight="fill" className="text-brand-orange" />
                {featured.rating.toFixed(1)}
              </span>
            ) : null}
            {featured.tags.length > 0 && <span>{featured.tags.join(" · ")}</span>}
          </p>
          {featured.overview && (
            <div className="mt-2.5 mb-4 hidden sm:block">
              <p className="text-sm leading-relaxed text-brand-slate line-clamp-4">{featured.overview}</p>
            </div>
          )}
          <Link
            href={featured.href}
            className="group mt-auto self-start inline-flex items-center gap-2 h-9 px-4 rounded-md bg-brand-btn text-brand-btn-text text-sm font-semibold hover:bg-brand-btn/90 transition-colors"
          >
            {kind === "series" ? "Ver a série" : "Ver o filme"}
            <ArrowRightIcon size={14} weight="bold" className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* a rodada: as miniaturas escolhem o destaque; a última casa sorteia a próxima rodada */}
      <ul key={start} className="mt-6 pt-5 border-t border-foreground/[0.06] grid grid-cols-7 gap-1.5 sm:gap-2 animate-[modal-in_200ms_ease-out]">
        {shown.map((item) => {
          const active = item === featured;
          return (
            <li key={item.key}>
              <button
                type="button"
                onClick={() => setFeaturedKey(item.key)}
                title={item.year ? `${item.title} (${item.year})` : item.title}
                aria-label={`Destacar ${item.title}`}
                aria-pressed={active}
                className={`block w-full rounded-md transition-all ${active ? "ring-2 ring-brand-orange ring-offset-2 ring-offset-surface" : "opacity-60 hover:opacity-100"}`}
              >
                <Poster title={item.title} posterPath={item.posterPath} size="w185" sizes="80px" />
              </button>
            </li>
          );
        })}
        {canMore && (
          <li>
            <button
              type="button"
              onClick={() => {
                setFeaturedKey(null);
                onMore();
              }}
              className="group flex w-full aspect-2/3 flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-foreground/15 text-brand-slate hover:text-foreground hover:border-brand-orange/50 transition-colors"
            >
              <ShuffleIcon size={18} weight="bold" className="group-hover:rotate-180 transition-transform duration-500" />
              <span className="hidden sm:block text-[11px] leading-tight text-center">Ver outr{kind === "series" ? "as" : "os"}</span>
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}
