"use client";

import { useEffect, useState } from "react";
import { CaretDownIcon } from "@phosphor-icons/react";
import type { LegalSectionInfo } from "./legal-page";

/**
 * Índice das seções: fixo na lateral no desktop, marcando a seção que está na tela;
 * no celular vira uma lista que abre e fecha antes do texto.
 */
export function LegalToc({ sections }: { sections: LegalSectionInfo[] }) {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    const elements = sections.map((s) => document.getElementById(s.id)).filter((el): el is HTMLElement => !!el);
    if (!elements.length) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      // as últimas seções, curtas, nunca chegam ao topo: no fim da página, marca a última
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      // senão, a ativa é a última cujo título já passou do primeiro terço da tela
      const line = window.innerHeight / 3;
      const current = atBottom ? elements[elements.length - 1] : elements.findLast((el) => el.getBoundingClientRect().top <= line);
      setActive((current ?? elements[0]).id);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [sections]);

  const links = (
    <ol className="flex flex-col border-l border-foreground/10">
      {sections.map((s) => {
        const isActive = s.id === active;
        return (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              aria-current={isActive ? "location" : undefined}
              className={`flex gap-3 py-1.5 pl-3 -ml-px border-l text-sm transition-colors ${
                isActive
                  ? "border-brand-orange text-foreground"
                  : "border-foreground/10 text-brand-slate/70 hover:text-foreground hover:border-foreground/30"
              }`}
            >
              <span className={`font-mono text-xs pt-0.5 tabular-nums ${isActive ? "text-brand-orange" : "text-brand-slate/40"}`}>
                {String(s.number).padStart(2, "0")}
              </span>
              {s.title}
            </a>
          </li>
        );
      })}
    </ol>
  );

  return (
    <>
      <details className="lg:hidden mb-10 rounded-2xl bg-surface ring-1 ring-foreground/5 group">
        <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none text-sm font-medium [&::-webkit-details-marker]:hidden">
          Nesta página
          <CaretDownIcon size={16} className="text-brand-slate transition-transform group-open:rotate-180" />
        </summary>
        <div className="px-5 pb-4">{links}</div>
      </details>

      <nav aria-label="Nesta página" className="hidden lg:block">
        <div className="sticky top-24">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-brand-slate/60 mb-4">Nesta página</p>
          {links}
        </div>
      </nav>
    </>
  );
}
