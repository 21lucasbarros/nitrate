"use client";

import { useEffect, useRef, useState } from "react";
import { CaretDownIcon, CheckIcon, SortAscendingIcon } from "@phosphor-icons/react";

// os controles de filtro e ordem do site (catálogos de /movies e /series, abas Filmes e Séries do perfil)

/** visual dos botões da barra: com borda; laranja quando o filtro está ligado */
export function filterButtonClass({ active = false, open = false }: { active?: boolean; open?: boolean }) {
  const state = active
    ? "border-brand-orange/60 bg-brand-orange/10 text-foreground"
    : open
      ? "border-foreground/30 bg-surface/60 text-foreground"
      : "border-foreground/15 text-brand-slate hover:text-foreground hover:border-foreground/30";
  return `inline-flex items-center gap-2 h-9 px-3 rounded-md border text-sm transition-colors ${state}`;
}

/** fecha ao clicar fora de `ref` ou apertar Esc */
export function useDismiss(ref: React.RefObject<HTMLElement | null>, open: boolean, close: () => void) {
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) close();
    };
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [ref, open, close]);
}

/**
 * o painel que abre embaixo do botão; `title` vira um rótulo pequeno no topo.
 * Com opções (DropdownOption) é um menu e as setas andam por elas; `menu={false}` para outro conteúdo (ex.: as notas).
 */
export function DropdownPanel({ title, menu = true, className = "", children }: {
  title: string;
  menu?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role={menu ? "menu" : "dialog"}
      aria-label={title}
      onKeyDown={menu ? moveFocus : undefined}
      className={`absolute top-full z-30 mt-2 p-1.5 rounded-lg bg-surface ring-1 ring-foreground/10 shadow-2xl shadow-black/60 origin-top animate-[modal-in_150ms_ease-out] ${className}`}
    >
      {title && <p className="px-2.5 pt-1.5 pb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-brand-slate/60">{title}</p>}
      {children}
    </div>
  );
}

/** uma opção do painel: check (uma por vez) ou quadradinho (várias, como os gêneros) */
export function DropdownOption({ selected, checkbox = false, onClick, children }: {
  selected: boolean;
  checkbox?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role={checkbox ? "menuitemcheckbox" : "menuitemradio"}
      aria-checked={selected}
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left text-sm transition-colors outline-none focus-visible:bg-foreground/[0.07] ${
        // a marcada fica clara e com o check; o fundo é do hover e do foco pelo teclado
        selected ? "text-foreground hover:bg-foreground/[0.05]" : "text-brand-slate hover:bg-foreground/[0.05] hover:text-foreground"
      }`}
    >
      {checkbox ? (
        <span
          className={`shrink-0 flex size-4 items-center justify-center rounded-[4px] ring-1 ring-inset transition-colors ${selected ? "bg-brand-orange ring-brand-orange text-brand-btn-text" : "ring-foreground/25"}`}
        >
          {selected && <CheckIcon size={11} weight="bold" />}
        </span>
      ) : (
        <span className="shrink-0 flex size-4 items-center justify-center text-brand-orange">
          {selected && <CheckIcon size={14} weight="bold" />}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </button>
  );
}

/** setas para cima e para baixo andam pelas opções do painel */
export function moveFocus(e: React.KeyboardEvent<HTMLElement>) {
  if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
  const items = [...e.currentTarget.querySelectorAll<HTMLElement>("[role^=menuitem]")];
  if (items.length === 0) return;
  e.preventDefault();
  const current = items.indexOf(document.activeElement as HTMLElement);
  const next = e.key === "ArrowDown" ? (current + 1) % items.length : (current - 1 + items.length) % items.length;
  items[next].focus();
}

/** o seletor de ordem: botão com o ícone e a ordem atual, e o painel com as opções */
export function SortMenu<T extends string>({ value, options, onChange, className = "" }: {
  value: T;
  options: readonly { id: T; label: string }[];
  onChange: (value: T) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, open, () => setOpen(false));

  // abriu: o foco vai para a ordem atual, e as setas andam a partir dela
  useEffect(() => {
    if (open) ref.current?.querySelector<HTMLElement>("[role=menu] [aria-checked=true]")?.focus();
  }, [open]);

  const current = options.find((o) => o.id === value) ?? options[0];
  return (
    <div ref={ref} className={`relative min-w-0 ${className}`}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`${filterButtonClass({ open })} w-full max-w-full`}
      >
        <SortAscendingIcon size={16} className="shrink-0 text-brand-slate" />
        <span className="min-w-0 flex-1 truncate text-left text-foreground">
          <span className="sr-only">Ordenar por </span>
          {current.label}
        </span>
        <CaretDownIcon size={12} className={`shrink-0 text-brand-slate transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <DropdownPanel title="Ordenar por" className="right-0 w-[min(19rem,calc(100vw-3rem))]">
          {options.map((option) => (
            <DropdownOption
              key={option.id}
              selected={option.id === value}
              onClick={() => {
                onChange(option.id);
                setOpen(false);
              }}
            >
              {option.label}
            </DropdownOption>
          ))}
        </DropdownPanel>
      )}
    </div>
  );
}
