import { useEffect, useSyncExternalStore } from "react";

/**
 * Easter eggs por filme, inspirados nos do Letterboxd: pequenas surpresas que só aparecem
 * na página (ou na review) de certos filmes. A chave é o slug do filme no Nitrate.
 */

export type LogoEgg = "dream-big";

export interface EasterEgg {
  /** troca a logo do cabeçalho enquanto a página do filme estiver aberta */
  logo?: LogoEgg;
  /** avisos mostrados ao começar a escrever a review, um de cada vez */
  reviewWarnings?: string[];
}

const EGGS: Record<string, EasterEgg> = {
  // Marty Supreme (2025): o "dream big" escrito à mão e a bolinha de tênis de mesa
  "marty-supreme-2025": { logo: "dream-big" },
  // Clube da Luta (1999): as duas primeiras regras
  "clube-da-luta-1999": {
    reviewWarnings: [
      "A primeira regra do Clube da Luta é: você não fala sobre o Clube da Luta.",
      "A segunda regra do Clube da Luta é: você NÃO fala sobre o Clube da Luta.",
    ],
  },
};

export function easterEggFor(movie: { slug?: string | null } | null | undefined): EasterEgg | null {
  return (movie?.slug && EGGS[movie.slug]) || null;
}

// ---------- a logo do cabeçalho ----------

let currentLogo: LogoEgg | null = null;
const listeners = new Set<() => void>();

function setLogoEgg(logo: LogoEgg | null) {
  currentLogo = logo;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** a logo especial da página aberta agora (ou null) */
export function useLogoEgg(): LogoEgg | null {
  return useSyncExternalStore(subscribe, () => currentLogo, () => null);
}

/** liga os easter eggs de um filme enquanto o componente estiver na tela */
export function useMovieEasterEgg(movie: { slug?: string | null } | null | undefined) {
  const logo = easterEggFor(movie)?.logo ?? null;
  useEffect(() => {
    if (!logo) return;
    setLogoEgg(logo);
    return () => setLogoEgg(null);
  }, [logo]);
}
