"use client";

import { useEffect, useRef, useState } from "react";
import { CaretDownIcon, StarIcon, XIcon } from "@phosphor-icons/react";
import {
  CATALOG_SORTS,
  NITRATE_MINIMUMS,
  NO_FILTERS,
  TMDB_MINIMUMS,
  hasFilters,
  type CatalogFilters as Filters,
} from "@/lib/catalog-filters";
import { DropdownOption, DropdownPanel, SortMenu, filterButtonClass, useDismiss } from "./ui/dropdown";

type Menu = "genero" | "nota";

/** "3.5" → "3,5" */
const decimal = (n: number) => String(n).replace(".", ",");

/** barra de filtros dos catálogos de filmes e de séries: gênero e nota em menus, a ordem à direita */
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
  useDismiss(barRef, open !== null, () => setOpen(null));

  // abriu um menu: o foco vai para a opção marcada (ou a primeira), e as setas andam a partir dela
  useEffect(() => {
    if (!open) return;
    const menu = barRef.current?.querySelector("[role=menu]");
    (menu?.querySelector<HTMLElement>("[aria-checked=true]") ?? menu?.querySelector<HTMLElement>("[role^=menuitem]"))?.focus();
  }, [open]);

  const toggle = (menu: Menu) => setOpen((current) => (current === menu ? null : menu));
  const sorts = CATALOG_SORTS.map((s) =>
    series && s.id === "comunidade" ? { ...s, label: "Mais bem avaliadas pela comunidade" } : s,
  );

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
    ...(filters.minTmdb !== null ? [{ key: "tmdb", label: `TMDB ${filters.minTmdb}+`, remove: () => onChange({ ...filters, minTmdb: null }) }] : []),
    ...(filters.minNitrate !== null
      ? [{ key: "nitrate", label: `Nitrate ${decimal(filters.minNitrate)}+ ★`, remove: () => onChange({ ...filters, minNitrate: null }) }]
      : []),
  ];

  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-center gap-2">
        {/* os menus abrem presos ao grupo (e não ao botão), para não vazarem da tela no celular */}
        <div ref={barRef} className="relative flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <MenuButton
            label="Gênero"
            value={filters.genres.length === 1 ? filters.genres[0] : undefined}
            count={filters.genres.length > 1 ? filters.genres.length : 0}
            active={filters.genres.length > 0}
            open={open === "genero"}
            onClick={() => toggle("genero")}
          />
          <MenuButton label="Nota" count={ratingCount} active={ratingCount > 0} open={open === "nota"} onClick={() => toggle("nota")} />

          {open === "genero" && (
            <DropdownPanel title={series ? "Gêneros da série" : "Gêneros do filme"} className="left-0 w-[min(34rem,100%)] sm:w-[34rem]">
              {shownGenres.length === 0 ? (
                <p className="px-2.5 py-2 text-sm text-brand-slate/60">Carregando gêneros…</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-0.5">
                  {shownGenres.map((genre) => (
                    <DropdownOption key={genre} checkbox selected={filters.genres.includes(genre)} onClick={() => toggleGenre(genre)}>
                      {genre}
                    </DropdownOption>
                  ))}
                </div>
              )}
              {filters.genres.length > 0 && (
                <div className="mt-1.5 pt-1.5 px-1 flex items-center justify-between gap-3 border-t border-foreground/[0.06]">
                  <p className="px-1.5 text-xs text-brand-slate/70">
                    {filters.genres.length > 1 ? "Mostrando os títulos com todos os gêneros marcados." : "1 gênero marcado."}
                  </p>
                  <button
                    type="button"
                    onClick={() => onChange({ ...filters, genres: [] })}
                    className="shrink-0 h-7 px-2 rounded text-xs text-brand-slate hover:text-foreground hover:bg-foreground/[0.05] transition-colors"
                  >
                    Limpar
                  </button>
                </div>
              )}
            </DropdownPanel>
          )}

          {open === "nota" && (
            <DropdownPanel title="Nota mínima" menu={false} className="left-0 w-[min(26rem,100%)] sm:w-[26rem]">
              <div className="px-2.5 pb-2.5 space-y-4">
                <RatingRow
                  title="No TMDB"
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
              </div>
            </DropdownPanel>
          )}
        </div>

        <SortMenu
          value={filters.sort}
          options={sorts}
          onChange={(sort) => onChange({ ...filters, sort })}
          className="w-full sm:w-auto sm:ml-auto"
        />
      </div>

      {chips.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={chip.remove}
              aria-label={`Remover ${chip.label}`}
              className="group inline-flex items-center gap-1.5 h-7 pl-2.5 pr-2 rounded-md border border-brand-orange/40 bg-brand-orange/10 text-xs text-foreground hover:border-brand-orange/70 transition-colors"
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

/** botão de um menu: o nome, ou o valor escolhido no lugar dele ("Anos 1980"), e o selo com quantos estão marcados */
function MenuButton({ label, value, count = 0, active, open, onClick }: {
  label: string;
  value?: string;
  count?: number;
  active: boolean;
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" aria-haspopup="menu" aria-expanded={open} onClick={onClick} className={filterButtonClass({ active, open })}>
      {value ? (
        <span>
          <span className="sr-only">{label}: </span>
          {value}
        </span>
      ) : (
        label
      )}
      {count > 0 && (
        <span className="min-w-5 h-5 px-1.5 inline-flex items-center justify-center rounded bg-brand-orange text-[11px] font-semibold tabular-nums text-brand-btn-text">
          {count}
        </span>
      )}
      <CaretDownIcon size={12} className={`text-brand-slate transition-transform ${open ? "rotate-180" : ""}`} />
    </button>
  );
}

/** "Qualquer" e os mínimos lado a lado, um marcado por vez */
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
      <p className="mb-2 text-sm text-foreground/90">{title}</p>
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
              // "Qualquer" marcado não é um filtro ligado: fica neutro, sem o laranja
              className={`inline-flex items-center gap-1 h-8 px-3 rounded-md border text-sm tabular-nums transition-colors ${
                selected && option.value !== null
                  ? "border-brand-orange/60 bg-brand-orange/10 text-foreground"
                  : selected
                    ? "border-foreground/30 bg-foreground/[0.06] text-foreground"
                    : "border-foreground/15 text-brand-slate hover:text-foreground hover:border-foreground/30"
              }`}
            >
              {option.label}
              {star && option.value !== null && <StarIcon size={11} weight="fill" className="text-brand-orange" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
