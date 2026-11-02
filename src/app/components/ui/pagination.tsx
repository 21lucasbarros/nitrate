import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";

interface PaginationProps {
  /** página atual, começando em 1 */
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

/** números ao redor da página atual, com reticências: 1 … 4 5 6 … 12 */
function pageWindow(page: number, total: number): (number | "…")[] {
  const pages = new Set([1, total, page - 1, page, page + 1].filter((p) => p >= 1 && p <= total));
  const sorted = [...pages].sort((a, b) => a - b);
  const result: (number | "…")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push("…");
    result.push(p);
  });
  return result;
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const arrow =
    "flex items-center justify-center w-10 h-10 rounded-full border border-foreground/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed enabled:hover:border-brand-orange enabled:hover:text-brand-orange";

  return (
    <nav aria-label="Paginação" className="mt-12 flex items-center justify-center gap-2">
      <button className={arrow} onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Página anterior">
        <CaretLeftIcon size={16} />
      </button>
      {pageWindow(page, totalPages).map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="w-8 text-center text-brand-slate/40">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            aria-current={p === page ? "page" : undefined}
            className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${p === page ? "bg-foreground text-background" : "hover:bg-foreground/5"}`}
          >
            {p}
          </button>
        ),
      )}
      <button className={arrow} onClick={() => onChange(page + 1)} disabled={page >= totalPages} aria-label="Próxima página">
        <CaretRightIcon size={16} />
      </button>
    </nav>
  );
}
