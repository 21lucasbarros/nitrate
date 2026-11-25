"use client";

import { CircleNotchIcon, MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";

const SIZES = {
  sm: { box: "h-9", input: "pl-9 pr-8 text-sm", icon: 16, iconPos: "left-3", clearPos: "right-2.5" },
  md: { box: "h-10", input: "pl-10 pr-9 text-sm", icon: 16, iconPos: "left-3.5", clearPos: "right-3" },
} as const;

// "page" no fundo da página; "panel" dentro de modais e painéis, que já são bg-surface
const TONES = {
  page: "bg-surface",
  panel: "bg-background/60",
} as const;

/**
 * O campo de busca do site (o mesmo visual da busca do header): a lupa (que vira o carregando), o X para limpar e Esc limpando.
 * Quem precisa de outro Esc (ex.: fechar um popover) trata no onKeyDown e chama preventDefault.
 */
export function SearchInput({
  value,
  onChange,
  label,
  placeholder = label,
  pending = false,
  size = "md",
  tone = "page",
  autoFocus,
  onKeyDown,
  onClear,
  clearLabel = "Limpar busca",
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  label: string; // aria-label (e placeholder, se não vier outro)
  placeholder?: string;
  pending?: boolean;
  size?: keyof typeof SIZES;
  tone?: keyof typeof TONES;
  autoFocus?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onClear?: () => void; // o padrão é esvaziar o campo
  clearLabel?: string;
  className?: string;
}) {
  const s = SIZES[size];
  const clear = onClear ?? (() => onChange(""));
  const iconClass = `absolute ${s.iconPos} top-1/2 -translate-y-1/2 pointer-events-none`;

  return (
    <div className={`group relative ${className}`}>
      {pending ? (
        <CircleNotchIcon size={s.icon} className={`${iconClass} text-brand-slate animate-spin`} />
      ) : (
        <MagnifyingGlassIcon size={s.icon} className={`${iconClass} text-brand-slate`} />
      )}
      <input
        type="search"
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          onKeyDown?.(e);
          if (e.key === "Escape" && !e.defaultPrevented && value) {
            // sem fechar o modal junto (o <dialog> fecha no Esc se o keydown não for cancelado)
            e.preventDefault();
            e.stopPropagation();
            clear();
          }
        }}
        placeholder={placeholder}
        aria-label={label}
        className={`w-full ${s.box} ${s.input} rounded-md ${TONES[tone]} ring-1 ring-foreground/10 text-foreground placeholder:text-brand-slate/60 focus:outline-none focus:ring-foreground/25 transition-shadow [&::-webkit-search-cancel-button]:hidden`}
      />
      {value && (
        <button
          type="button"
          onClick={clear}
          aria-label={clearLabel}
          className={`absolute ${s.clearPos} top-1/2 -translate-y-1/2 p-0.5 rounded-full text-brand-slate hover:text-foreground transition-colors`}
        >
          <XIcon size={14} />
        </button>
      )}
    </div>
  );
}
