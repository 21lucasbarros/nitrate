import { useEffect, useSyncExternalStore } from "react";
import { easterEggFor, type LogoEgg } from "../easter-eggs";

/** loja mínima para estados globais dos easter eggs (o cabeçalho e os avisos ficam fora das páginas) */
function createStore<T>(initial: T) {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set(next: T) {
      value = next;
      listeners.forEach((listener) => listener());
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

// ---------- a logo do cabeçalho ----------

const logoStore = createStore<LogoEgg | null>(null);

/** a logo especial da página aberta agora (ou null) */
export function useLogoEgg(): LogoEgg | null {
  return useSyncExternalStore(logoStore.subscribe, logoStore.get, () => null);
}

/** liga os easter eggs de um filme enquanto o componente estiver na tela */
export function useMovieEasterEgg(movie: { slug?: string | null } | null | undefined) {
  const logo = easterEggFor(movie)?.logo ?? null;
  useEffect(() => {
    if (!logo) return;
    logoStore.set(logo);
    return () => logoStore.set(null);
  }, [logo]);
}

// ---------- as falas (avisos rápidos no canto da tela) ----------

export type QuoteTone = "default" | "matrix" | "truman";

export interface EggQuote {
  id: number;
  text: string;
  tone: QuoteTone;
}

const quoteStore = createStore<EggQuote | null>(null);
let quoteTimer: ReturnType<typeof setTimeout> | undefined;

/** mostra uma fala de filme por alguns segundos */
export function showQuote(text: string, tone: QuoteTone = "default", durationMs = 5000) {
  clearTimeout(quoteTimer);
  quoteStore.set({ id: Date.now(), text, tone });
  quoteTimer = setTimeout(() => quoteStore.set(null), durationMs);
}

export function hideQuote() {
  clearTimeout(quoteTimer);
  quoteStore.set(null);
}

export function useEggQuote(): EggQuote | null {
  return useSyncExternalStore(quoteStore.subscribe, quoteStore.get, () => null);
}
