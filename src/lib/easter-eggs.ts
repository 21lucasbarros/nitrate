/**
 * Easter eggs por filme, inspirados nos do Letterboxd: pequenas surpresas que só aparecem
 * na página (ou na review) de certos filmes. A chave é o slug do filme no Nitrate.
 * Só dados: roda também no servidor (a rota que gera a imagem da review). Os hooks ficam em
 * lib/hooks/use-easter-eggs.ts.
 */

export type LogoEgg = "dream-big";

export interface EasterEgg {
  /** troca a logo do cabeçalho enquanto a página do filme estiver aberta */
  logo?: LogoEgg;
  /** avisos mostrados ao começar a escrever a review, um de cada vez */
  reviewWarnings?: string[];
  /** animação ao abrir a página do filme */
  pageIntro?: "matrix-rain";
  /** o botão da watchlist: as pílulas de Matrix ou uma fala ao adicionar */
  watchlist?: "pills" | { quote: string };
  /** fala que aparece ao escolher uma nota específica (chave: a nota, ex.: 4) */
  ratingQuotes?: Record<number, string>;
  /** a imagem de compartilhar a review em outro formato */
  story?: "business-card";
  /** cliques seguidos no pôster da página do filme */
  posterClicks?: "truman-crack";
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
  // Matrix (1999): a chuva de código ao abrir a página e as pílulas no lugar da watchlist
  "matrix-1999": { pageIntro: "matrix-rain", watchlist: "pills" },
  // Whiplash (2014): 4 estrelas não é o tempo do Fletcher
  "whiplash-em-busca-da-perfeicao-2014": { ratingQuotes: { 4: "Were you rushing or were you dragging?" } },
  // O Show de Truman (1998): clicar várias vezes no pôster racha o "cenário" do site
  "o-show-de-truman-o-show-da-vida-1998": { posterClicks: "truman-crack" },
  // O Poderoso Chefão (1972)
  "o-poderoso-chefao-1972": { watchlist: { quote: "I'm gonna make him an offer he can't refuse." } },
  // Psicopata Americano (2000): a review vira um cartão de visita
  "psicopata-americano-2000": { story: "business-card" },
};

export function easterEggFor(movie: { slug?: string | null } | null | undefined): EasterEgg | null {
  return (movie?.slug && EGGS[movie.slug]) || null;
}
