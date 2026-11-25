"use client";

import Link from "next/link";
import { SearchInput } from "./ui/search-input";

/** busca da barra do catálogo de /movies e /series: só procura ali dentro; o resto fica com /buscar */
export function CatalogSearch({ value, onChange, pending, label, others }: {
  value: string;
  onChange: (value: string) => void;
  pending: boolean;
  label: string; // "Buscar no catálogo de filmes"
  others: string; // "séries, pessoas ou perfis"
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
      <SearchInput value={value} onChange={onChange} pending={pending} label={label} className="w-full sm:w-80" />
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
