"use client";

import { useEffect, useState } from "react";
import { FilmReelIcon } from "@phosphor-icons/react";

const DELAY_MS = 3500;

/**
 * Aparece só se o carregamento passar de alguns segundos: o servidor dorme quando ninguém usa
 * e a primeira requisição do dia demora para acordá-lo. Explica a espera em vez de deixar a tela muda.
 */
export function SlowHint({ className = "" }: { className?: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <p role="status" className={`flex items-center justify-center gap-2.5 text-sm text-brand-slate animate-[egg-quote-in_400ms_ease-out] ${className}`}>
      <FilmReelIcon size={18} className="shrink-0 text-brand-orange animate-spin [animation-duration:3s]" />
      Acordando o projetor… na primeira visita do dia isso leva alguns segundos.
    </p>
  );
}
