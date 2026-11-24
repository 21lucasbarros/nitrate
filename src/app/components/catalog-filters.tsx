"use client";

import { useEffect, useRef, useState } from "react";
import { CaretDownIcon, CheckIcon, SortAscendingIcon, StarIcon, XIcon } from "@phosphor-icons/react";
import {
  CATALOG_SORTS,
  DECADES,
  NITRATE_MINIMUMS,
  NO_FILTERS,
  TMDB_MINIMUMS,
  hasFilters,
  type CatalogFilters as Filters,
  type CatalogSort,
} from "@/lib/catalog-filters";

type Menu = "genero" | "decada" | "nota" | "ordem";

/** "3.5" → "3,5" */
const decimal = (n: number) => String(n).replace(".", ",");

/** barra de filtros dos catálogos de filmes e de séries: gênero, década e nota em menus, a ordem à direita */
export function CatalogFilters({ genres, filters, onChange, series = false }: {
  /** os gêneros que existem no catálogo; enquanto carregam, o menu fica vazio */
  genres: string[] | undefined;
  filters: Filters;
  onChange: (filters: Filters) => void;
  /** séries: "Mais bem avaliadas" no feminino */
  series?: boolean;
}) {
  const [open, setOpen] = useState<Menu | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  // fecha ao clicar fora ou apertar Esc
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!barRef.current?.contains(e.target as Node)) setOpen(null);
    };
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const toggle = (menu: Menu) => setOpen((current) => (current === menu ? null : menu));
  const sortLabel = (id: CatalogSort) => {
    const label = CATALOG_SORTS.find((s) => s.id === id)!.label;
    return series && id === "comunidade" ? "Mais bem avaliadas pela comunidade" : label;
  };

  const toggleGenre = (genre: string) =>
    onChange({
      ...filters,
      genres: filters.genres.includes(genre) ? filters.genres.filter((g) => g !== genre) : [...filters.genres, genre],
    });
  // um gênero escolhido que não está na lista (link antigo) continua aparecendo para dar para tirar
  const shownGenres = [...new Set([...(genres ?? []), ...filters.genres])];
  const ratingCount = (filters.minTmdb !== null ? 1 : 0) + (filters.minNitrate !== null ? 1 : 0);

  // o que está ligado, em chips removíveis embaixo da barra
  const chips = [
    ...filters.genres.map((genre) => ({ key: `g-${genre}`, label: genre, remove: () => toggleGenre(genre) })),
    ...(filters.decade !== null ? [{ key: "decada", label: `Anos ${filters.decade}`, remove: () => onChange({ ...filters, decade: null }) }] : []),
    ...(filters.minTmdb !== null ? [{ key: "tmdb", label: `TMDB ${filters.minTmdb}+`, remove: () => onChange({ ...filters, minTmdb: null }) }] : []),
    ...(filters.minNitrate !== null
      ? [{ key: "nitrate", label: `Nitrate ${decimal(filters.minNitrate)}+ ★`, remove: () => onChange({ ...filters, minNitrate: null }) }]
      : []),
  ];

  return (
    <div className="mb-8">
      {/* os menus abrem presos à barra (e não ao botão), para não vazarem da tela no celular */}
      <div ref={barRef} className="relative flex flex-wrap items-center gap-2">
        <MenuButton label="Gênero" count={filters.genres.length} open={open === "genero"} onClick={() => toggle("genero")} />
        <MenuButton
          label="Década"
          active={filters.decade !== null}
          open={open === "decada"}
          onClick={() => toggle("decada")}
        />
        <MenuButton label="Nota" count={ratingCount} open={open === "nota"} onClick={() => toggle("nota")} />
        <div className="w-full sm:w-auto sm:ml-auto">
          <button
            type="button"
            aria-expanded={open === "ordem"}
            onClick={() => toggle("ordem")}
            className="group inline-flex max-w-full items-center gap-2 h-9 px-3 rounded-full text-sm text-brand-slate hover:text-foreground transition-colors"
          >
            <SortAscendingIcon size={16} className="shrink-0" />
            <span className="truncate">
              <span className="sr-only">Ordenar por </span>
              <span className="text-foreground">{sortLabel(filters.sort)}</span>
            </span>
            <CaretDownIcon size={12} className={`shrink-0 transition-transform ${open === "ordem" ? "rotate-180" : ""}`} />
          </button>
        </div>

        {open === "genero" && (
          <Panel className="left-0 w-[min(34rem,100%)]">
            {shownGenres.length === 0 ? (
              <p className="px-3 py-2 text-sm text-brand-slate/60">Carregando gêneros…</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-0.5">
                {shownGenres.map((genre) => (
                  <Option key={genre} checkbox selected={filters.genres.includes(genre)} onClick={() => toggleGenre(genre)}>
                    {genre}
                  </Option>
                ))}
              </div>
            )}
            {filters.genres.length > 1 && (
              <p className="mt-2 px-3 pt-2 border-t border-foreground/[0.06] text-xs text-brand-slate/70">
                Mostrando os títulos que têm todos os gêneros marcados.
              </p>
            )}
          </Panel>
        )}

        {open === "decada" && (
          <Panel className="left-0 w-[min(24rem,100%)]">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-0.5">
              <Option selected={filters.decade === null} onClick={() => { onChange({ ...filters, decade: null }); setOpen(null); }}>
                Qualquer
              </Option>
              {DECADES.map((decade) => (
                <Option key={decade} selected={filters.decade === decade} onClick={() => { onChange({ ...filters, decade }); setOpen(null); }}>
                  Anos {decade}
                </Option>
              ))}
            </div>
          </Panel>
        )}

        {open === "nota" && (
          <Panel className="left-0 w-[min(26rem,100%)] p-4 space-y-4">
            <RatingRow
              title="Nota no TMDB"
              value={filters.minTmdb}
              options={TMDB_MINIMUMS.map((n) => ({ value: n, label: `${n}+` }))}
              onChange={(minTmdb) => onChange({ ...filters, minTmdb })}
            />
            <RatingRow
              title="Média no Nitrate"
              value={filters.minNitrate}
              options={NITRATE_MINIMUMS.map((n) => ({ value: n, label: `${decimal(n)}+` }))}
              onChange={(minNitrate) => onChange({ ...filters, minNitrate })}
              star
            />
          </Panel>
        )}

        {open === "ordem" && (
          <Panel className="right-0 w-[min(19rem,100%)]">
            {CATALOG_SORTS.map((sort) => (
              <Option key={sort.id} selected={filters.sort === sort.id} onClick={() => { onChange({ ...filters, sort: sort.id }); setOpen(null); }}>
                {sortLabel(sort.id)}
              </Option>
            ))}
          </Panel>
        )}
      </div>

      {chips.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={chip.remove}
              aria-label={`Remover ${chip.label}`}
              className="group inline-flex items-center gap-1 h-7 pl-2.5 pr-2 rounded-full bg-brand-orange/10 text-xs text-foreground ring-1 ring-inset ring-brand-orange/25 hover:ring-brand-orange/50 transition-colors"
            >
              {chip.label}
              <XIcon size={11} weight="bold" className="text-brand-slate group-hover:text-foreground transition-colors" />
            </button>
          ))}
          {hasFilters(filters) && (
            <button
              type="button"
              onClick={() => onChange({ ...NO_FILTERS, sort: filters.sort })}
              className="ml-1 h-7 px-1.5 text-xs text-brand-slate hover:text-foreground underline-offset-4 hover:underline transition-colors"
            >
              Limpar filtros
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function MenuButton({ label, count = 0, active = count > 0, open, onClick }: {
  label: string;
  /** quantos itens do menu estão marcados: aparece num selo ao lado do nome */
  count?: number;
  active?: boolean;
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-expanded={open}
      onClick={onClick}
      className={`inline-flex items-center gap-2 h-9 pl-3.5 pr-3 rounded-full text-sm ring-1 ring-inset transition-colors ${
        active || open
          ? "bg-surface text-foreground ring-brand-orange/40"
          : "bg-surface/60 text-brand-slate ring-foreground/[0.08] hover:text-foreground hover:ring-foreground/20"
      }`}
    >
      {label}
      {count > 0 && (
        <span className="min-w-5 h-5 px-1.5 inline-flex items-center justify-center rounded-full bg-brand-orange text-[11px] font-semibold tabular-nums text-brand-btn-text">
          {count}
        </span>
      )}
      <CaretDownIcon size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
    </button>
  );
}

function Panel({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <div className={`absolute top-full z-30 mt-2 p-1.5 rounded-lg bg-surface ring-1 ring-foreground/10 shadow-2xl shadow-black/60 animate-[modal-in_150ms_ease-out] ${className}`}>
      {children}
    </div>
  );
}

function Option({ selected, checkbox = false, onClick, children }: {
  selected: boolean;
  /** vários podem ficar marcados (gêneros): quadradinho em vez do check */
  checkbox?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role={checkbox ? "checkbox" : "radio"}
      aria-checked={selected}
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-left text-sm transition-colors hover:bg-foreground/[0.05] ${selected ? "text-foreground" : "text-brand-slate hover:text-foreground"}`}
    >
      {checkbox ? (
        <span
          className={`shrink-0 flex size-4 items-center justify-center rounded-[4px] ring-1 ring-inset transition-colors ${selected ? "bg-brand-orange ring-brand-orange text-brand-btn-text" : "ring-foreground/25"}`}
        >
          {selected && <CheckIcon size={11} weight="bold" />}
        </span>
      ) : null}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {!checkbox && selected && <CheckIcon size={14} weight="bold" className="shrink-0 text-brand-orange" />}
    </button>
  );
}

/** "Qualquer" e os mínimos em pílulas, uma marcada por vez */
function RatingRow({ title, value, options, onChange, star = false }: {
  title: string;
  value: number | null;
  options: { value: number; label: string }[];
  onChange: (value: number | null) => void;
  star?: boolean;
}) {
  const all = [{ value: null, label: "Qualquer" }, ...options];
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-brand-slate/70">{title}</p>
      <div role="radiogroup" aria-label={title} className="flex flex-wrap gap-1.5">
        {all.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.label}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.value)}
              className={`inline-flex items-center gap-1 h-8 px-3 rounded-full text-sm tabular-nums transition-colors ${
                selected ? "bg-foreground text-background" : "bg-foreground/[0.05] text-brand-slate hover:text-foreground"
              }`}
            >
              {option.label}
              {star && option.value !== null && <StarIcon size={11} weight="fill" className={selected ? "" : "text-brand-orange"} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
