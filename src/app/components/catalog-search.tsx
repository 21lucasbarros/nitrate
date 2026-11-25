"use client";

import Link from "next/link";
import { CircleNotchIcon, MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";

/** busca da barra do catálogo de /movies e /series: só procura ali dentro; o resto fica com /buscar */
export function CatalogSearch({ value, onChange, pending, label, others, autoFocus }: {
  value: string;
  onChange: (value: string) => void;
  pending: boolean;
  label: string; // "Buscar no catálogo de filmes"
  others: string; // "séries, pessoas ou perfis"
  autoFocus?: boolean;
}) {
  return (
    <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="group relative w-full sm:w-80">
        {pending ? (
          <CircleNotchIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-slate animate-spin pointer-events-none" />
        ) : (
          <MagnifyingGlassIcon
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-slate/60 group-focus-within:text-brand-orange pointer-events-none"
          />
        )}
        <input
          autoFocus={autoFocus}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && onChange("")}
          placeholder={label}
          aria-label={label}
          className="w-full h-10 pl-10 pr-9 rounded-full bg-surface ring-1 ring-inset ring-foreground/10 text-sm placeholder:text-brand-slate/60 focus:outline-none focus:ring-foreground/25 [&::-webkit-search-cancel-button]:hidden"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Limpar busca"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-slate hover:text-foreground"
          >
            <XIcon size={14} />
          </button>
        )}
      </div>
      <p className="text-xs text-brand-slate/60">
        Procurando {others}?{" "}
        <Link href={searchAllHref(value)} className="text-brand-slate hover:text-foreground underline underline-offset-4">
          Buscar em tudo
        </Link>
      </p>
    </div>
  );
}

/** a busca completa (/buscar), já com o que foi digitado */
export function searchAllHref(query: string) {
  const q = query.trim();
  return q ? `/buscar?q=${encodeURIComponent(q)}` : "/buscar";
}
