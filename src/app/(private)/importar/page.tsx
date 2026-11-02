"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  CircleNotchIcon,
  FileZipIcon,
  PauseIcon,
  PlayIcon,
  WarningIcon,
} from "@phosphor-icons/react";

import Header from "@/app/components/header";
import { useAuth } from "@/lib/auth-context";
import { LetterboxdFormatError, readLetterboxdExport, type LetterboxdExport, type LetterboxdItem } from "@/lib/letterboxd";
import { importLetterboxdBatch, type ImportResult, type ImportStatus } from "@/lib/services/import-service";

// cada lote vira uma requisição de ~15s (cada filme novo é buscado e importado do TMDB)
const BATCH_SIZE = 8;

type Phase =
  | { step: "select"; error: string | null }
  | { step: "preview"; data: LetterboxdExport; fileName: string }
  | { step: "importing" | "paused" | "done"; data: LetterboxdExport; items: LetterboxdItem[]; next: number; error: string | null };

export default function ImportPage() {
  const { user, refreshUser } = useAuth();
  const [phase, setPhase] = useState<Phase>({ step: "select", error: null });
  const [includeWatchlist, setIncludeWatchlist] = useState(true);
  const [results, setResults] = useState<ImportResult[]>([]);
  // pausar só vale ao fim do lote atual; ref para o laço enxergar o valor atualizado
  const pauseRequested = useRef(false);

  const handleFile = async (file: File) => {
    try {
      const data = await readLetterboxdExport(file);
      setPhase({ step: "preview", data, fileName: file.name });
    } catch (err) {
      setPhase({
        step: "select",
        error: err instanceof LetterboxdFormatError ? err.message : "Não foi possível ler esse arquivo.",
      });
    }
  };

  const run = async (data: LetterboxdExport, items: LetterboxdItem[], start: number) => {
    pauseRequested.current = false;
    let next = start;
    setPhase({ step: "importing", data, items, next, error: null });

    while (next < items.length) {
      if (pauseRequested.current) {
        setPhase({ step: "paused", data, items, next, error: null });
        return;
      }
      const batch = items.slice(next, next + BATCH_SIZE);
      try {
        const batchResults = await importLetterboxdBatch(batch);
        setResults((prev) => [...prev, ...batchResults]);
        next += batch.length;
        setPhase({ step: "importing", data, items, next, error: null });
      } catch {
        // rede/servidor: para aqui; "Continuar" retoma deste lote (o backend ignora o que já entrou)
        setPhase({ step: "paused", data, items, next, error: "A conexão falhou no meio do caminho. Você pode continuar de onde parou." });
        return;
      }
    }
    setPhase({ step: "done", data, items, next, error: null });
    refreshUser();
  };

  const startImport = (data: LetterboxdExport) => {
    setResults([]);
    const items = includeWatchlist ? [...data.films, ...data.watchlist] : data.films;
    run(data, items, 0);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Header />
      <main className="pt-28 sm:pt-32 pb-24 px-6 md:px-12 xl:px-24 max-w-[1000px] mx-auto">
        <span className="text-xs font-bold tracking-[0.2em] uppercase text-brand-orange">Importar dados</span>
        <h1 className="text-4xl sm:text-5xl font-medium tracking-tight mt-2">Traga seu diário do Letterboxd.</h1>
        <p className="mt-4 text-lg text-brand-slate/70 font-light max-w-2xl">
          Notas, reviews, curtidas, datas e watchlist vêm junto. O que já está no seu diário do
          Nitrate não é alterado.
        </p>

        <div className="mt-12">
          {phase.step === "select" && <SelectFile error={phase.error} onFile={handleFile} />}

          {phase.step === "preview" && (
            <Preview
              data={phase.data}
              fileName={phase.fileName}
              includeWatchlist={includeWatchlist}
              onToggleWatchlist={setIncludeWatchlist}
              onStart={() => startImport(phase.data)}
              onCancel={() => setPhase({ step: "select", error: null })}
            />
          )}

          {(phase.step === "importing" || phase.step === "paused" || phase.step === "done") && (
            <Progress
              phase={phase}
              results={results}
              username={user?.username ?? null}
              onPause={() => (pauseRequested.current = true)}
              onResume={() => run(phase.data, phase.items, phase.next)}
            />
          )}
        </div>
      </main>
    </div>
  );
}

function SelectFile({ error, onFile }: { error: string | null; onFile: (file: File) => void }) {
  const [dragging, setDragging] = useState(false);

  return (
    <div className="grid md:grid-cols-[1fr_1.2fr] gap-10">
      <ol className="flex flex-col gap-5 text-brand-slate/80">
        {[
          <>No Letterboxd, abra <strong className="font-medium text-foreground">Settings → Import & Export</strong>.</>,
          <>Clique em <strong className="font-medium text-foreground">Export your data</strong> e baixe o .zip.</>,
          <>Envie o arquivo aqui, sem descompactar.</>,
        ].map((text, i) => (
          <li key={i} className="flex gap-4">
            <span className="flex items-center justify-center w-8 h-8 shrink-0 rounded-full bg-brand-orange/10 text-brand-orange font-semibold text-sm">
              {i + 1}
            </span>
            <span className="pt-1">{text}</span>
          </li>
        ))}
      </ol>

      <div>
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) onFile(file);
          }}
          className={`flex flex-col items-center justify-center gap-3 h-56 rounded-2xl border-2 border-dashed cursor-pointer transition-colors ${dragging ? "border-brand-orange bg-brand-orange/5" : "border-foreground/15 hover:border-brand-orange/60"}`}
        >
          <FileZipIcon size={40} weight="light" className="text-brand-orange" />
          <span className="font-medium">Arraste o .zip ou clique para escolher</span>
          <span className="text-sm text-brand-slate/50">letterboxd-seuusuario-….zip</span>
          <input
            type="file"
            accept=".zip,application/zip"
            aria-label="Arquivo .zip exportado do Letterboxd"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFile(file);
              e.target.value = "";
            }}
          />
        </label>
        {error && (
          <p className="mt-4 flex items-center gap-2 text-sm text-red-500">
            <WarningIcon size={16} /> {error}
          </p>
        )}
        <p className="mt-4 text-xs text-brand-slate/50">
          O arquivo é lido no seu navegador; enviamos só os filmes, notas e reviews.
        </p>
      </div>
    </div>
  );
}

function Preview({ data, fileName, includeWatchlist, onToggleWatchlist, onStart, onCancel }: {
  data: LetterboxdExport;
  fileName: string;
  includeWatchlist: boolean;
  onToggleWatchlist: (value: boolean) => void;
  onStart: () => void;
  onCancel: () => void;
}) {
  const total = data.stats.films + (includeWatchlist ? data.stats.watchlist : 0);
  const stats: [string, number][] = [
    ["Filmes", data.stats.films],
    ["Notas", data.stats.ratings],
    ["Reviews", data.stats.reviews],
    ["Curtidos", data.stats.likes],
    ["Watchlist", data.stats.watchlist],
  ];

  return (
    <div>
      <p className="flex items-center gap-2 text-sm text-brand-slate/60">
        <FileZipIcon size={16} /> {fileName}
        {data.username && <> · <span className="font-mono">@{data.username}</span> no Letterboxd</>}
      </p>

      <dl className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-px rounded-2xl overflow-hidden border border-foreground/10 bg-foreground/10">
        {stats.map(([label, value]) => (
          <div key={label} className="flex flex-col-reverse bg-background p-6">
            <dt className="text-xs uppercase tracking-[0.15em] text-brand-slate/60 mt-1">{label}</dt>
            <dd className="text-3xl font-semibold tracking-tight">{value}</dd>
          </div>
        ))}
      </dl>

      <label className="mt-6 flex items-center gap-3 cursor-pointer select-none w-fit">
        <input
          type="checkbox"
          checked={includeWatchlist}
          onChange={(e) => onToggleWatchlist(e.target.checked)}
          className="w-4 h-4 accent-brand-orange"
        />
        <span className="text-brand-slate/80">Importar também a watchlist ({data.stats.watchlist} filmes)</span>
      </label>

      <p className="mt-6 text-sm text-brand-slate/60 max-w-2xl">
        Cada filme é encontrado no TMDB pelo título e ano. A importação leva cerca de{" "}
        {Math.max(1, Math.round((total * 2) / 60))} min; mantenha esta aba aberta. Se algo
        interromper, é só continuar: o que já entrou não é duplicado.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          onClick={onStart}
          className="flex items-center gap-2 bg-brand-btn text-brand-btn-text px-7 py-3.5 rounded-full font-semibold hover:bg-brand-btn/90 transition-colors"
        >
          Importar {total} {total === 1 ? "item" : "itens"}
          <ArrowRightIcon size={18} weight="bold" />
        </button>
        <button onClick={onCancel} className="px-6 py-3.5 rounded-full font-medium text-brand-slate/70 hover:text-foreground transition-colors">
          Escolher outro arquivo
        </button>
      </div>
    </div>
  );
}

const STATUS_GROUPS: { label: string; statuses: ImportStatus[] }[] = [
  { label: "Reviews criadas", statuses: ["CREATED"] },
  { label: "Na watchlist", statuses: ["WATCHLISTED"] },
  { label: "Já estavam no Nitrate", statuses: ["ALREADY_EXISTS", "ALREADY_IN_WATCHLIST", "ALREADY_WATCHED"] },
  { label: "Não encontrados", statuses: ["NOT_FOUND", "ERROR"] },
];

function Progress({ phase, results, username, onPause, onResume }: {
  phase: Extract<Phase, { step: "importing" | "paused" | "done" }>;
  results: ImportResult[];
  username: string | null;
  onPause: () => void;
  onResume: () => void;
}) {
  const total = phase.items.length;
  const percent = total === 0 ? 100 : Math.round((phase.next / total) * 100);
  const missing = results.filter((r) => r.status === "NOT_FOUND" || r.status === "ERROR");
  const current = phase.items.slice(phase.next, phase.next + BATCH_SIZE);

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-medium tracking-tight flex items-center gap-3">
            {phase.step === "importing" && <CircleNotchIcon size={22} className="animate-spin text-brand-orange" />}
            {phase.step === "done" && <CheckCircleIcon size={24} weight="fill" className="text-brand-emerald" />}
            {phase.step === "importing" ? "Importando…" : phase.step === "paused" ? "Pausado" : "Importação concluída"}
          </h2>
          {phase.step === "importing" && current.length > 0 && (
            <p className="mt-1 text-sm text-brand-slate/60 truncate max-w-xl">
              {current.map((i) => i.name).join(" · ")}
            </p>
          )}
        </div>
        <span className="font-mono text-sm text-brand-slate/60 shrink-0">
          {phase.next}/{total}
        </span>
      </div>

      <div className="mt-4 h-2.5 rounded-full bg-foreground/5 overflow-hidden" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-brand-orange transition-[width] duration-500" style={{ width: `${percent}%` }} />
      </div>

      <dl className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-6">
        {STATUS_GROUPS.map(({ label, statuses }) => (
          <div key={label} className="flex flex-col-reverse">
            <dt className="text-xs uppercase tracking-[0.15em] text-brand-slate/60 mt-1">{label}</dt>
            <dd className="text-3xl font-semibold tracking-tight">
              {results.filter((r) => statuses.includes(r.status)).length}
            </dd>
          </div>
        ))}
      </dl>

      {phase.error && (
        <p className="mt-8 flex items-center gap-2 text-sm text-red-500">
          <WarningIcon size={16} /> {phase.error}
        </p>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        {phase.step === "importing" && (
          <button onClick={onPause} className="flex items-center gap-2 px-6 py-3 rounded-full font-medium border border-foreground/15 hover:border-foreground/40 transition-colors">
            <PauseIcon size={16} weight="fill" /> Pausar
          </button>
        )}
        {phase.step === "paused" && (
          <button onClick={onResume} className="flex items-center gap-2 bg-brand-btn text-brand-btn-text px-6 py-3 rounded-full font-semibold hover:bg-brand-btn/90 transition-colors">
            <PlayIcon size={16} weight="fill" /> Continuar
          </button>
        )}
        {phase.step === "done" && username && (
          <Link href={`/u/${username}`} className="flex items-center gap-2 bg-brand-btn text-brand-btn-text px-7 py-3.5 rounded-full font-semibold hover:bg-brand-btn/90 transition-colors">
            Ver meu diário <ArrowRightIcon size={18} weight="bold" />
          </Link>
        )}
      </div>

      {phase.step === "importing" && (
        <p className="mt-6 text-sm text-brand-slate/50">Mantenha esta aba aberta até terminar.</p>
      )}

      {missing.length > 0 && (
        <section className="mt-12">
          <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-brand-orange mb-4">
            Não encontrados no TMDB ({missing.length})
          </h3>
          <ul className="divide-y divide-foreground/10 border-y border-foreground/10">
            {missing.map((r) => (
              <li key={`${r.name}-${r.year}`} className="py-3 flex justify-between gap-4 text-sm">
                <span>
                  {r.name} <span className="text-brand-slate/50">{r.year}</span>
                </span>
                <span className="text-brand-slate/50 truncate">{r.status === "ERROR" ? r.detail ?? "erro" : "sem correspondência"}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-brand-slate/50">
            Você pode registrar esses filmes pela busca em <Link href="/movies" className="text-brand-blue hover:underline">Filmes</Link>.
          </p>
        </section>
      )}
    </div>
  );
}
