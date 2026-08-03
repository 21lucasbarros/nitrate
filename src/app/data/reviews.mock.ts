import { Review } from "@/types/review";

export const REVIEWS_MOCK: Review[] = [
  {
    id: 1,
    user: "João Del",
    movie: "The Thing",
    year: "1982",
    rating: 5,
    favorited: true,
    date: "há 2 dias",
    engagementScore: 184,
    posterUrl:
      "https://media.themoviedb.org/t/p/w600_and_h900_face/bazlgJAKWCBF7OllC3JtyJ2DV1n.jpg",
    text: "Carpenter transforma uma ideia simples num exercício constante de paranoia. A sensação de que ninguém é confiável faz cada cena ficar mais tensa que a anterior, enquanto os efeitos práticos continuam impressionantes até hoje. Um dos maiores filmes de horror já feitos.",
  },
  {
    id: 2,
    user: "Victor Santiago",
    movie: "Peçanha Contra o Animal",
    year: "2021",
    rating: 3.5,
    favorited: false,
    date: "há 5 dias",
    engagementScore: 93,
    posterUrl:
      "https://media.themoviedb.org/t/p/w600_and_h900_face/jFmlV5vUzOt1PgJ82efOhNsWcWX.jpg",
    text: "é um filme que entende perfeitamente a proposta dele. o humor depende totalmente do peçanha e, felizmente, ele segura quase tudo no carisma. tem piada que não encaixa, mas quando acerta é muito engraçado. diversão sem vergonha de ser boba.",
  },
  {
    id: 3,
    user: "Erik Medeiros",
    movie: "Yesterday",
    year: "2019",
    rating: 4.5,
    favorited: true,
    date: "há 1 semana",
    engagementScore: 141,
    posterUrl:
      "https://media.themoviedb.org/t/p/w600_and_h900_face/6hGo8YPZZTU0Dj5LrA9OhqpQBJj.jpg",
    text: "mano, achei que fosse só uma comédia com música dos beatles e acabei saindo meio triste. a ideia é muito boa e o filme fala bastante sobre reconhecimento e escolhas. podia ir mais longe, mas ainda assim deixa aquela sensação boa quando acaba.",
  },
  {
    id: 4,
    user: "Lucas Barros",
    movie: "Zodiac",
    year: "2007",
    rating: 5,
    favorited: true,
    date: "há 3 dias",
    engagementScore: 217,
    posterUrl:
      "https://media.themoviedb.org/t/p/w600_and_h900_face/jFmlV5vUzOt1PgJ82efOhNsWcWX.jpg",
    text: "o que mais gosto em Zodiac é que o Fincher nunca romantiza o assassino. o foco está na obsessão de quem tenta entender um caso impossível de resolver. são quase três horas que passam voando, com uma tensão absurda do começo ao fim.",
  },
];
