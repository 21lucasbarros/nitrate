import Link from "next/link";

interface SectionHeadingProps {
  title: string;
  /** link à direita ("Ver tudo", "Mais"...) */
  href?: string;
  linkLabel?: string;
  /** número discreto ao lado do título (ex.: total de itens) */
  count?: number;
  /** ação à direita no lugar do link (ex.: botão "Editar") */
  action?: React.ReactNode;
  className?: string;
}

/** Título de seção: texto pequeno com uma linha fina embaixo e um link opcional à direita. */
export function SectionHeading({ title, href, linkLabel = "Ver tudo", count, action, className = "" }: SectionHeadingProps) {
  return (
    <div className={`flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 pb-2.5 mb-5 border-b border-foreground/10 ${className}`}>
      <h2 className="min-w-0 text-[15px] font-medium text-foreground/90">
        {title}
        {count !== undefined && <span className="ml-2 text-sm font-normal text-brand-slate/70">{count}</span>}
      </h2>
      {action ??
        (href && (
          <Link href={href} className="whitespace-nowrap text-sm text-brand-slate hover:text-foreground transition-colors">
            {linkLabel}
          </Link>
        ))}
    </div>
  );
}
