"use client";

import { showQuote } from "@/lib/hooks/use-easter-eggs";

/**
 * Easter egg de Matrix: no lugar de "Quero assistir", a escolha do Morpheus.
 * Vermelha: entra na toca do coelho (vai para a watchlist). Azul: a história acaba aqui (sai dela).
 */
export function MatrixPills({ inWatchlist, busy, onToggle }: { inWatchlist: boolean; busy: boolean; onToggle: () => void }) {
  const red = () => {
    if (!inWatchlist) onToggle();
    showQuote(
      inWatchlist
        ? "Você já tomou a pílula vermelha. Não tem volta."
        : "Bem-vindo ao mundo real. Matrix está na sua watchlist.",
      "matrix",
    );
  };

  const blue = () => {
    if (inWatchlist) onToggle();
    showQuote("A história acaba aqui. Você acorda na sua cama e acredita no que quiser.", "matrix");
  };

  return (
    <div className="px-4 py-3">
      <span className="block text-xs text-brand-slate">
        {inWatchlist ? "Você escolheu a verdade. Está na watchlist." : "Quer assistir? Escolha."}
      </span>
      <div className="mt-2.5 flex gap-3">
        <Pill color="red" label="Pílula vermelha" taken={inWatchlist} disabled={busy} onClick={red} />
        <Pill color="blue" label="Pílula azul" taken={false} disabled={busy} onClick={blue} />
      </div>
    </div>
  );
}

const COLORS = {
  // um brilho no topo e sombra embaixo, como uma cápsula de verdade
  red: "radial-gradient(ellipse 70% 45% at 50% 25%, rgba(255,255,255,0.65), transparent 60%), linear-gradient(180deg, #FF5A5A, #B0001C)",
  blue: "radial-gradient(ellipse 70% 45% at 50% 25%, rgba(255,255,255,0.65), transparent 60%), linear-gradient(180deg, #5FAEFF, #0A3A8C)",
};

function Pill({ color, label, taken, disabled, onClick }: {
  color: "red" | "blue";
  label: string;
  taken: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={taken}
      className="group flex-1 flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-surface-strong disabled:opacity-50 transition-colors"
    >
      <span
        aria-hidden="true"
        className={`w-9 h-4 shrink-0 rounded-full -rotate-[24deg] shadow-[0_3px_6px_rgba(0,0,0,0.5)] transition-transform group-hover:-rotate-12 group-hover:scale-110 ${taken ? "ring-2 ring-offset-2 ring-offset-surface ring-[#FF5A5A]/70" : ""}`}
        style={{ background: COLORS[color] }}
      />
      <span className={`text-sm ${color === "red" ? "group-hover:text-[#FF7A7A]" : "group-hover:text-[#7CBDFF]"} text-brand-slate transition-colors`}>
        {color === "red" ? "Vermelha" : "Azul"}
      </span>
      <span className="sr-only">{label}</span>
    </button>
  );
}
