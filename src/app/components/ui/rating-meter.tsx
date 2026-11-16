"use client";

import { useState } from "react";

const STEPS = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

export const formatScore = (value: number) => value.toLocaleString("pt-BR", { minimumFractionDigits: 1 });

/** Nota em 10 segmentos (cada um vale meia estrela), a escala visual própria do Nitrate. */
export function RatingMeter({ value, className = "h-2" }: { value: number; className?: string }) {
  return (
    <div className={`flex gap-[3px] ${className}`} aria-label={`Nota ${formatScore(value)} de 5`}>
      {STEPS.map((step) => (
        <span
          key={step}
          className={`flex-1 rounded-[2px] ${value >= step ? "bg-brand-orange" : value >= step - 0.25 ? "bg-brand-orange/50" : "bg-foreground/10"}`}
        />
      ))}
    </div>
  );
}

/** Versão clicável do medidor. Clicar na nota atual limpa a nota. */
export function RatingMeterInput({ value, onChange, disabled = false }: {
  value: number | null;
  onChange: (value: number | null) => void;
  disabled?: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value ?? 0;

  return (
    <div className={disabled ? "opacity-50 pointer-events-none" : ""}>
      <div className="flex items-baseline justify-between">
        <span className="text-4xl font-bold tracking-tighter leading-none tabular-nums">
          {shown > 0 ? formatScore(shown) : "–"}
          <span className="ml-1 text-sm font-normal tracking-normal text-brand-slate">/5</span>
        </span>
        {value !== null && hover === null && (
          <button type="button" onClick={() => onChange(null)} className="text-xs text-brand-slate hover:text-foreground">
            Limpar
          </button>
        )}
      </div>
      <div
        role="radiogroup"
        aria-label="Sua nota"
        className="mt-3 flex gap-[3px] h-7"
        onMouseLeave={() => setHover(null)}
      >
        {STEPS.map((step) => (
          <button
            key={step}
            type="button"
            role="radio"
            aria-checked={value === step}
            aria-label={`${formatScore(step)} de 5`}
            onMouseEnter={() => setHover(step)}
            onFocus={() => setHover(step)}
            onBlur={() => setHover(null)}
            onClick={() => onChange(value === step ? null : step)}
            className={`flex-1 rounded-[3px] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue ${
              shown >= step ? (hover !== null ? "bg-brand-orange/80" : "bg-brand-orange") : "bg-foreground/10 hover:bg-foreground/20"
            }`}
            // degraus: segmentos mais altos para notas maiores
            style={{ height: `${40 + step * 12}%`, alignSelf: "flex-end" }}
          />
        ))}
      </div>
    </div>
  );
}
