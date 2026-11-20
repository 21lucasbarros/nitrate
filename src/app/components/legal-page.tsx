import Link from "next/link";
import { ArrowUpRightIcon, CalendarBlankIcon, EnvelopeSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import Header from "./header";
import Footer from "./footer";
import { LegalToc } from "./legal-toc";
import { CONTACT_EMAIL, LEGAL_UPDATED_AT } from "@/lib/legal";

export interface LegalSectionInfo {
  id: string;
  title: string;
  number: number;
}

/**
 * Numera as seções na ordem da lista e devolve um mapa por id: a mesma lista monta o índice
 * lateral, e cada <LegalSection {...s.id}> pega o título e o número dali.
 */
export function legalSections<const T extends readonly { id: string; title: string }[]>(list: T) {
  const map = {} as Record<T[number]["id"], LegalSectionInfo>;
  list.forEach((s, i) => (map[s.id as T[number]["id"]] = { ...s, number: i + 1 }));
  return { list: list.map((s, i) => ({ ...s, number: i + 1 })), map };
}

export interface LegalHighlight {
  icon: React.ReactNode;
  title: string;
  text: string;
}

const TABS = [
  { href: "/termos", label: "Termos de Uso" },
  { href: "/privacidade", label: "Privacidade" },
] as const;

/** moldura das páginas de texto jurídico (/privacidade e /termos) */
export function LegalPage({
  current,
  eyebrow,
  title,
  intro,
  highlights,
  sections,
  children,
}: {
  current: (typeof TABS)[number]["href"];
  eyebrow: string;
  title: string;
  intro: React.ReactNode;
  /** o resumo em cartões, antes do texto completo */
  highlights: LegalHighlight[];
  sections: LegalSectionInfo[];
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-brand-blue selection:text-background">
      <Header />

      {/* topo com um brilho suave atrás do título */}
      <section className="relative overflow-hidden border-b border-foreground/5">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 -translate-x-[70%] w-[640px] h-[420px] rounded-full bg-brand-orange/10 blur-[120px]" />
          <div className="absolute -top-24 left-1/2 translate-x-[10%] w-[520px] h-[360px] rounded-full bg-brand-blue/10 blur-[120px]" />
        </div>
        <div className="relative max-w-[1100px] mx-auto px-6 pt-32 sm:pt-40 pb-14 sm:pb-16">
          <nav aria-label="Documentos" className="inline-flex p-1 rounded-full bg-surface/80 ring-1 ring-foreground/10 mb-10">
            {TABS.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={tab.href === current ? "page" : undefined}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  tab.href === current ? "bg-foreground text-background" : "text-brand-slate hover:text-foreground"
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
          <span className="block text-xs font-bold tracking-[0.2em] uppercase text-brand-orange">{eyebrow}</span>
          <h1 className="mt-3 text-4xl sm:text-6xl font-medium tracking-tight">{title}</h1>
          <div className="mt-6 max-w-2xl text-lg text-brand-slate/80 font-light leading-relaxed">{intro}</div>
          <p className="mt-8 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface/80 ring-1 ring-foreground/10 text-xs font-mono uppercase tracking-widest text-brand-slate/70">
            <CalendarBlankIcon size={14} />
            Atualizado em {LEGAL_UPDATED_AT}
          </p>
        </div>
      </section>

      <main className="max-w-[1100px] mx-auto px-6 pb-24">
        {/* resumo */}
        <section aria-labelledby="resumo" className="py-14 sm:py-16">
          <h2 id="resumo" className="text-xs font-bold tracking-[0.2em] uppercase text-brand-slate/60 mb-6">
            Em resumo
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {highlights.map((h) => (
              <div key={h.title} className="rounded-2xl bg-surface ring-1 ring-foreground/5 p-5 flex flex-col gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-strong flex items-center justify-center">{h.icon}</div>
                <h3 className="font-medium text-foreground">{h.title}</h3>
                <p className="text-sm text-brand-slate/80 font-light leading-relaxed">{h.text}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16">
          <LegalToc sections={sections} />
          <div className="max-w-[720px]">
            <div className="flex flex-col">{children}</div>
            <ContactCard />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function ContactCard() {
  return (
    <aside className="mt-16 relative overflow-hidden rounded-3xl bg-surface ring-1 ring-foreground/10 p-8 sm:p-10">
      <div aria-hidden className="pointer-events-none absolute -right-20 -bottom-24 w-72 h-72 rounded-full bg-brand-orange/15 blur-[90px]" />
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-medium tracking-tight">Ficou alguma dúvida?</h2>
          <p className="mt-2 text-brand-slate/80 font-light">
            Privacidade, denúncias ou pedidos sobre seus dados: responderemos por e-mail.
          </p>
        </div>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="shrink-0 inline-flex items-center justify-center gap-2 bg-brand-btn text-brand-btn-text px-6 py-3.5 rounded-full font-semibold hover:bg-brand-btn/90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-brand-btn/20"
        >
          <EnvelopeSimpleIcon size={18} weight="bold" />
          Fale com a gente
        </a>
      </div>
    </aside>
  );
}

export function LegalSection({ id, number, title, children }: LegalSectionInfo & { children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 py-10 first:pt-0 border-b border-foreground/5 last:border-b-0">
      <div className="flex items-baseline gap-4 mb-5">
        <span className="font-mono text-sm text-brand-orange tabular-nums">{String(number).padStart(2, "0")}</span>
        <h2 className="text-2xl font-medium tracking-tight text-foreground">{title}</h2>
      </div>
      <div className="flex flex-col gap-4 text-brand-slate/85 font-light leading-relaxed sm:pl-9">{children}</div>
    </section>
  );
}

export function LegalList({ children }: { children: React.ReactNode }) {
  return (
    <ul className="flex flex-col gap-3 [&>li]:relative [&>li]:pl-5 [&>li]:before:absolute [&>li]:before:left-0 [&>li]:before:top-[0.7em] [&>li]:before:w-1.5 [&>li]:before:h-1.5 [&>li]:before:rounded-full [&>li]:before:bg-brand-orange/70">
      {children}
    </ul>
  );
}

/** destaque em caixa, para o que a pessoa não pode deixar de ler */
export function LegalCallout({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-brand-blue/5 ring-1 ring-brand-blue/15 px-5 py-4 text-foreground/85">{children}</div>
  );
}

export function Strong({ children }: { children: React.ReactNode }) {
  return <strong className="font-medium text-foreground">{children}</strong>;
}

export function EmailLink({ email }: { email: string }) {
  return (
    <a href={`mailto:${email}`} className="text-brand-blue hover:text-brand-blue/80 underline underline-offset-4 decoration-brand-blue/30">
      {email}
    </a>
  );
}

export function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-0.5 text-brand-blue hover:text-brand-blue/80 underline underline-offset-4 decoration-brand-blue/30"
    >
      {children}
      <ArrowUpRightIcon size={12} weight="bold" />
    </a>
  );
}

export function InternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-brand-blue hover:text-brand-blue/80 underline underline-offset-4 decoration-brand-blue/30">
      {children}
    </Link>
  );
}
