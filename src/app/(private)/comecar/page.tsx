"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  CircleNotchIcon,
  DownloadSimpleIcon,
  HeartIcon,
  SparkleIcon,
  WarningIcon,
} from "@phosphor-icons/react";

import { Poster } from "@/app/components/ui/poster";
import { SectionHeading } from "@/app/components/ui/section-heading";
import { ApiError } from "@/lib/api-client";
import { useFetch } from "@/lib/hooks/use-fetch";
import { getMyTaste, getTasteCandidates, getTasteQuiz, saveMyTaste } from "@/lib/services/taste-service";
import type { TasteAnswers, TasteQuestion, TasteQuiz } from "@/lib/types/taste";
import type { Movie } from "@/types/movie";
import { safeInternalPath } from "@/utils/redirect";

// com muitos gêneros escolhidos, o questionário ficaria longo: as perguntas de "como" vão até aqui
const MAX_QUESTIONS = 4;

type Step =
  | { kind: "intro" }
  | { kind: "genres" }
  | { kind: "question"; question: TasteQuestion }
  | { kind: "eras" }
  | { kind: "films" };

const fetchQuiz = () => getTasteQuiz();
const fetchMyTaste = () => getMyTaste();
// o useFetch compara o argumento por igualdade: as respostas vão como texto
const fetchCandidates = (key: string) => getTasteCandidates(JSON.parse(key) as TasteAnswers);

export default function OnboardingPage() {
  const quiz = useFetch("1", fetchQuiz);
  const taste = useFetch("1", fetchMyTaste);

  // as respostas anteriores (ao refazer) entram como ponto de partida
  const ready = quiz.data && (taste.data || taste.error);
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {ready ? (
        <Onboarding
          quiz={quiz.data!}
          initial={taste.data?.updatedAt ? taste.data : null}
        />
      ) : quiz.error ? (
        <div className="py-32 text-center text-brand-slate">
          <p>Não foi possível carregar as perguntas.</p>
          <Link href="/" className="mt-3 inline-block text-foreground underline underline-offset-4">Ir para o início</Link>
        </div>
      ) : (
        <div className="py-32 flex justify-center text-brand-slate/40">
          <CircleNotchIcon size={28} className="animate-spin" />
        </div>
      )}
    </div>
  );
}

function Onboarding({
  quiz,
  initial,
}: {
  quiz: TasteQuiz;
  initial: { genres: string[]; answers: string[]; eras: string[]; movies: Movie[] } | null;
}) {
  const router = useRouter();
  const [next] = useState(() => safeInternalPath(new URLSearchParams(window.location.search).get("depois")));
  const redoing = initial !== null;

  // gêneros na ordem em que foram escolhidos: as perguntas seguem essa ordem
  const [genres, setGenres] = useState<string[]>(initial?.genres ?? []);
  const [answers, setAnswers] = useState<string[]>(initial?.answers ?? []);
  const [eras, setEras] = useState<string[]>(initial?.eras ?? []);
  const [movieIds, setMovieIds] = useState<number[]>(initial?.movies.map((m) => m.id) ?? []);
  const [index, setIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const questions = genres
    .map((genre) => quiz.questions.find((q) => q.genre === genre))
    .filter((q): q is TasteQuestion => !!q)
    .slice(0, MAX_QUESTIONS);

  const steps: Step[] = [
    { kind: "intro" },
    { kind: "genres" },
    ...questions.map((question) => ({ kind: "question" as const, question })),
    { kind: "eras" },
    { kind: "films" },
  ];
  const step = steps[Math.min(index, steps.length - 1)];

  // respostas de perguntas que saíram (o gênero foi desmarcado) não contam
  const activeAnswers = answers.filter((id) => questions.some((q) => q.options.some((o) => o.id === id)));

  const go = (delta: number) => {
    setIndex((i) => Math.max(0, Math.min(steps.length - 1, i + delta)));
    window.scrollTo({ top: 0 });
  };

  const finish = async () => {
    setSaving(true);
    setError(null);
    try {
      await saveMyTaste({ genres, answers: activeAnswers, eras, movieIds });
      router.replace(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível salvar. Tente novamente.");
      setSaving(false);
    }
  };

  const toggle = (list: string[], set: (v: string[]) => void, id: string) =>
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const progress = index === 0 ? 0 : index / (steps.length - 1);
  // depois de responder algo, sair do questionário salva o que já foi respondido
  const answeredSomething = genres.length > 0 || eras.length > 0 || movieIds.length > 0;

  return (
    <>
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-md">
        <div className="max-w-[1000px] mx-auto px-6 h-16 flex items-center justify-between gap-6">
          <span className="text-xl font-bold tracking-tighter uppercase flex items-center gap-1">
            Nitrate<span className="w-1.5 h-1.5 rounded-full bg-brand-orange mt-1" />
          </span>
          {answeredSomething && index > 1 ? (
            <button
              type="button"
              onClick={finish}
              disabled={saving}
              className="text-sm text-brand-slate hover:text-foreground disabled:opacity-60 transition-colors"
            >
              {saving ? "Salvando…" : "Salvar e sair"}
            </button>
          ) : (
            <Link href={next} replace className="text-sm text-brand-slate hover:text-foreground transition-colors">
              {redoing ? "Cancelar" : "Pular por enquanto"}
            </Link>
          )}
        </div>
        <div className="h-0.5 bg-foreground/5" aria-hidden="true">
          <div className="h-full bg-brand-orange transition-[width] duration-500" style={{ width: `${progress * 100}%` }} />
        </div>
      </header>

      <main className="max-w-[1000px] mx-auto px-6 pt-12 sm:pt-16 pb-32">
        {step.kind === "intro" && (
          <Intro redoing={redoing} onStart={() => go(1)} next={next} />
        )}

        {step.kind === "genres" && (
          <StepLayout
            eyebrow="Seus gostos"
            title="Que tipo de filme você curte?"
            subtitle="Escolha quantos quiser. Depois a gente pergunta mais sobre cada um."
          >
            <div className="flex flex-wrap gap-2.5">
              {quiz.genres.map((genre) => (
                <Chip key={genre.id} selected={genres.includes(genre.id)} onClick={() => toggle(genres, setGenres, genre.id)}>
                  {genre.label}
                </Chip>
              ))}
            </div>
            {genres.length > MAX_QUESTIONS && questions.length === MAX_QUESTIONS && (
              <p className="mt-5 text-sm text-brand-slate/70">
                A gente pergunta mais sobre os {MAX_QUESTIONS} primeiros que você escolheu. Os outros também contam.
              </p>
            )}
          </StepLayout>
        )}

        {step.kind === "question" && (
          <StepLayout
            eyebrow={quiz.genres.find((g) => g.id === step.question.genre)?.label ?? ""}
            title={step.question.title}
            subtitle="Pode marcar mais de um."
          >
            <div className="grid sm:grid-cols-2 gap-3">
              {step.question.options.map((option) => {
                const selected = answers.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggle(answers, setAnswers, option.id)}
                    aria-pressed={selected}
                    className={`flex items-start gap-3 rounded-lg p-4 text-left ring-1 transition-colors ${selected ? "bg-brand-orange/10 ring-brand-orange" : "bg-surface ring-foreground/5 hover:ring-foreground/20"}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`mt-0.5 w-5 h-5 shrink-0 rounded-full flex items-center justify-center ring-1 transition-colors ${selected ? "bg-brand-orange ring-brand-orange text-background" : "ring-foreground/25"}`}
                    >
                      {selected && <CheckIcon size={12} weight="bold" />}
                    </span>
                    <span>
                      <span className="block font-medium">{option.label}</span>
                      <span className="block mt-0.5 text-sm text-brand-slate">{option.hint}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </StepLayout>
        )}

        {step.kind === "eras" && (
          <StepLayout
            eyebrow="Época"
            title="E de que época?"
            subtitle="Tanto faz? É só continuar."
          >
            <div className="flex flex-wrap gap-2.5">
              {quiz.eras.map((era) => (
                <Chip key={era.id} selected={eras.includes(era.id)} onClick={() => toggle(eras, setEras, era.id)}>
                  {era.label}
                </Chip>
              ))}
            </div>
          </StepLayout>
        )}

        {step.kind === "films" && (
          <FilmsStep
            answers={{ genres, answers: activeAnswers, eras }}
            previous={initial?.movies ?? []}
            selected={movieIds}
            onToggle={(id) => setMovieIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))}
          />
        )}

        {error && (
          <p role="alert" className="mt-8 flex items-center gap-2 text-sm text-brand-crimson">
            <WarningIcon size={16} /> {error}
          </p>
        )}
      </main>

      {step.kind !== "intro" && (
        // fundo sólido: translúcido, os pôsteres da grade apareciam borrados atrás dos botões
        <footer className="fixed bottom-0 inset-x-0 z-20 bg-background border-t border-foreground/10">
          <div className="max-w-[1000px] mx-auto px-6 h-20 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => go(-1)}
              className="inline-flex items-center gap-1.5 text-sm text-brand-slate hover:text-foreground transition-colors"
            >
              <ArrowLeftIcon size={14} /> Voltar
            </button>
            {step.kind === "films" && (
              <span aria-live="polite" className="hidden sm:inline text-sm text-brand-slate">
                {movieIds.length === 0
                  ? "Nenhum marcado ainda"
                  : `${movieIds.length} ${movieIds.length === 1 ? "filme marcado" : "filmes marcados"}`}
              </span>
            )}
            {step.kind === "films" ? (
              <button
                type="button"
                onClick={finish}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-brand-btn text-brand-btn-text text-sm font-semibold hover:bg-brand-btn/90 disabled:opacity-60 transition-colors"
              >
                {saving ? "Salvando…" : movieIds.length > 0 ? `Concluir (${movieIds.length})` : "Concluir"}
                {!saving && <CheckIcon size={14} weight="bold" />}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => go(1)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-brand-btn text-brand-btn-text text-sm font-semibold hover:bg-brand-btn/90 transition-colors"
              >
                {hasSelection(step, { genres, answers, eras }) ? "Continuar" : "Pular"}
                <ArrowRightIcon size={14} weight="bold" />
              </button>
            )}
          </div>
        </footer>
      )}
    </>
  );
}

function hasSelection(step: Step, state: { genres: string[]; answers: string[]; eras: string[] }): boolean {
  if (step.kind === "genres") return state.genres.length > 0;
  if (step.kind === "eras") return state.eras.length > 0;
  if (step.kind === "question") return step.question.options.some((o) => state.answers.includes(o.id));
  return true;
}

function Intro({ redoing, onStart, next }: { redoing: boolean; onStart: () => void; next: string }) {
  return (
    <div className="max-w-xl">
      <SparkleIcon size={32} weight="fill" className="text-brand-orange" />
      <h1 className="mt-5 text-3xl sm:text-4xl font-semibold tracking-tight">
        {redoing ? "Atualize seus gostos." : "Vamos acertar suas recomendações."}
      </h1>
      <p className="mt-4 text-brand-slate leading-relaxed">
        Algumas perguntas rápidas sobre o que você curte. Leva menos de um minuto, e dá para pular qualquer uma.
        Com isso, o Nitrate já sabe o que te recomendar antes mesmo do seu primeiro registro.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={onStart}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-brand-btn text-brand-btn-text text-sm font-semibold hover:bg-brand-btn/90 transition-colors"
        >
          Começar <ArrowRightIcon size={14} weight="bold" />
        </button>
        <Link href={next} replace className="text-sm text-brand-slate hover:text-foreground transition-colors">
          Agora não
        </Link>
      </div>
      {!redoing && (
        <Link
          href="/importar"
          className="group mt-12 flex items-center gap-4 rounded-lg bg-surface px-5 py-4 ring-1 ring-foreground/5 hover:ring-foreground/20 transition-shadow"
        >
          <DownloadSimpleIcon size={22} className="shrink-0 text-brand-orange" />
          <span className="min-w-0">
            <span className="block font-medium">Já usa o Letterboxd?</span>
            <span className="block text-sm text-brand-slate">Traga seu histórico inteiro. Funciona ainda melhor do que as perguntas.</span>
          </span>
          <ArrowRightIcon size={16} className="ml-auto shrink-0 text-brand-slate group-hover:translate-x-1 group-hover:text-foreground transition-all" />
        </Link>
      )}
    </div>
  );
}

function StepLayout({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-brand-orange">{eyebrow}</p>
      <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-brand-slate">{subtitle}</p>
      <div className="mt-8">{children}</div>
    </section>
  );
}

function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium ring-1 transition-colors ${selected ? "bg-brand-orange text-background ring-brand-orange" : "bg-surface text-foreground/85 ring-foreground/10 hover:ring-foreground/30"}`}
    >
      {selected && <CheckIcon size={13} weight="bold" />}
      {children}
    </button>
  );
}

function FilmsStep({
  answers,
  previous,
  selected,
  onToggle,
}: {
  answers: TasteAnswers;
  previous: Movie[];
  selected: number[];
  onToggle: (id: number) => void;
}) {
  // a chave fixa enquanto a pessoa está nesta etapa: marcar filmes não refaz a busca
  const [key] = useState(() => JSON.stringify(answers));
  const candidates = useFetch(key, fetchCandidates);

  // ao refazer, os filmes marcados antes que não voltaram na grade ganham uma seção própria, na frente
  const groups = useMemo(() => {
    if (!candidates.data) return null;
    const ids = new Set(candidates.data.flatMap((g) => g.movies.map((m) => m.id)));
    const kept = previous.filter((m) => !ids.has(m.id));
    return kept.length > 0
      ? [{ id: "previous", label: "Marcados da última vez", movies: kept }, ...candidates.data]
      : candidates.data;
  }, [candidates.data, previous]);

  return (
    <StepLayout
      eyebrow="Quase lá"
      title="Quais destes você já viu e gostou?"
      subtitle="Marque quantos quiser. Eles ensinam o seu gosto ao Nitrate, mas não entram no seu diário."
    >
      {candidates.error ? (
        <p className="text-sm text-brand-slate">
          Não foi possível carregar os filmes.{" "}
          <button onClick={candidates.reload} className="text-foreground underline underline-offset-4">Tentar de novo</button>
        </p>
      ) : !groups ? (
        <div className={GRID}>
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className="aspect-2/3 rounded-md bg-surface animate-pulse" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <p className="text-sm text-brand-slate">Nenhum filme encontrado com essas respostas. Pode concluir assim mesmo.</p>
      ) : (
        <div className="flex flex-col gap-12">
          {groups.map((group) => {
            const marked = group.movies.filter((m) => selected.includes(m.id)).length;
            return (
              <section key={group.id}>
                {/* o título diz por que esses filmes estão aqui */}
                <SectionHeading
                  title={group.label}
                  count={group.movies.length}
                  action={
                    marked > 0 ? (
                      <span className="text-xs font-medium text-brand-orange tabular-nums">
                        {marked} {marked === 1 ? "marcado" : "marcados"}
                      </span>
                    ) : undefined
                  }
                />
                <ul className={GRID}>
                  {group.movies.map((movie) => (
                    <FilmOption key={movie.id} movie={movie} selected={selected.includes(movie.id)} onToggle={onToggle} />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </StepLayout>
  );
}

const GRID = "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-x-3 gap-y-5 sm:gap-x-4";

function FilmOption({ movie, selected, onToggle }: { movie: Movie; selected: boolean; onToggle: (id: number) => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onToggle(movie.id)}
        aria-pressed={selected}
        aria-label={`${movie.title}${movie.releaseYear ? ` (${movie.releaseYear})` : ""}`}
        className="group relative block w-full text-left"
      >
        <div className={`relative rounded-md transition-all ${selected ? "ring-2 ring-brand-orange ring-offset-2 ring-offset-background" : "group-hover:ring-2 group-hover:ring-foreground/30"}`}>
          <Poster
            title={movie.title}
            posterPath={movie.posterPath}
            sizes="(min-width: 768px) 150px, (min-width: 640px) 25vw, 30vw"
          />
          {/* marcado: o pôster escurece um pouco e o coração aparece no centro */}
          <span
            aria-hidden="true"
            className={`absolute inset-0 rounded-md flex items-center justify-center transition-all ${selected ? "bg-black/45" : "bg-black/0 group-hover:bg-black/25"}`}
          >
            <span
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${selected ? "bg-brand-orange text-background scale-100 opacity-100" : "bg-black/60 text-white scale-75 opacity-0 group-hover:opacity-100 group-hover:scale-90"}`}
            >
              <HeartIcon size={20} weight="fill" />
            </span>
          </span>
        </div>
        <span className={`mt-2 block text-xs leading-tight line-clamp-2 transition-colors ${selected ? "text-foreground" : "text-brand-slate"}`}>
          {movie.title}
          {movie.releaseYear && <span className="text-brand-slate/50"> {movie.releaseYear}</span>}
        </span>
      </button>
    </li>
  );
}
