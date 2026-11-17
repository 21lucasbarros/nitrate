"use client";

import { useEffect, useRef } from "react";
import { hideQuote, useEggQuote, type QuoteTone } from "@/lib/hooks/use-easter-eggs";

const TONES: Record<QuoteTone, string> = {
  default: "bg-surface text-foreground ring-white/10 font-serif italic text-lg",
  // verde de terminal sobre preto
  matrix: "bg-black text-[#3CFF7A] ring-[#3CFF7A]/40 font-mono text-base tracking-wide shadow-[0_0_30px_rgba(60,255,122,0.25)]",
  // o céu pintado da cúpula de Seahaven
  truman: "bg-linear-to-br from-[#BFE3FF] to-[#8EC5F2] text-[#10304D] ring-white/60 font-serif italic text-lg",
};

/**
 * A fala do easter egg, no rodapé da tela; clicar fecha.
 * É um popover: fica na camada de cima do navegador, então aparece até por cima de um modal aberto.
 */
export function EggQuote() {
  const quote = useEggQuote();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !quote) return;
    // reabrir põe o popover no topo da pilha, acima de um <dialog> aberto depois dele
    if (el.matches(":popover-open")) el.hidePopover();
    el.showPopover();
    return () => {
      if (el.matches(":popover-open")) el.hidePopover();
    };
  }, [quote]);

  return (
    <div
      ref={ref}
      popover="manual"
      className="m-0 p-0 border-0 bg-transparent overflow-visible inset-x-0 top-auto bottom-6 w-full pointer-events-none"
    >
      {quote && (
        <div className="flex justify-center px-6">
          <button
            key={quote.id}
            type="button"
            onClick={hideQuote}
            role="status"
            className={`pointer-events-auto max-w-lg px-6 py-4 rounded-xl ring-1 shadow-2xl shadow-black/50 text-center leading-snug animate-[egg-quote-in_350ms_cubic-bezier(0.2,0.9,0.3,1.2)] ${TONES[quote.tone]}`}
          >
            “{quote.text}”
          </button>
        </div>
      )}
    </div>
  );
}
