import Link from "next/link";

interface SectionHeadingProps {
  title: string;
  /** link à direita ("Ver tudo", "Mais"...) */
  href?: string;
  linkLabel?: string;
  /** número discreto à direita (ex.: total de itens), quando não há link */
  count?: number;
  className?: string;
}

/** Título de seção: maiúsculas pequenas com uma linha fina embaixo e um link opcional à direita. */
export function SectionHeading({ title, href, linkLabel = "Ver tudo", count, className = "" }: SectionHeadingProps) {
  return (
    <div className={`flex items-end justify-between gap-4 pb-2 mb-5 border-b border-foreground/10 ${className}`}>
      <h2 className="text-[13px] font-medium tracking-[0.12em] uppercase text-brand-slate">{title}</h2>
      {href ? (
        <Link
          href={href}
          className="text-[11px] font-medium tracking-[0.12em] uppercase text-brand-slate/70 hover:text-foreground transition-colors"
        >
          {linkLabel}
        </Link>
      ) : (
        count !== undefined && <span className="text-xs text-brand-slate/60 font-mono">{count}</span>
      )}
    </div>
  );
}
