// Espelha PersonSummaryDTO, PersonDetailDTO e PersonCreditDTO do backend (dados do TMDB)
export interface PersonSummary {
  tmdbId: number;
  name: string;
  slug: string | null; // endereço da pessoa ("ben-stiller"); nulo, o link usa o id
  profilePath: string | null;
  department: string | null; // "Acting" | "Directing" | ...
  knownFor: string[];
}

export interface PersonCredit {
  id: number | null; // filme ou série já importado para o Nitrate?
  slug: string | null;
  tmdbId: number;
  title: string;
  releaseYear: number | null;
  releaseDate: string | null; // yyyy-mm-dd
  posterPath: string | null;
  role: string | null; // personagem ou função
  tmdbRating: number | null; // 0 a 10; null com poucos votos
  tmdbVotes: number;
  nitrateRating: number | null; // média de 0,5 a 5; null se ninguém deu nota no Nitrate
  nitrateRatings: number;
  episodes?: number | null; // só nas séries: em quantos episódios aparece
}

export interface PersonDetail {
  tmdbId: number;
  name: string;
  slug: string | null; // nulo se o nome não tem versão em letras latinas
  profilePath: string | null;
  department: string | null;
  biography: string | null;
  birthday: string | null; // yyyy-mm-dd
  deathday: string | null;
  directed: PersonCredit[];
  acted: PersonCredit[];
  series?: PersonCredit[]; // séries em que atuou (o backend antigo não manda)
}

// Espelha FavoritePersonDTO: ator/atriz ou diretor(a) favorito no perfil
export interface FavoritePerson {
  tmdbId: number;
  name: string;
  profilePath: string | null;
  slug: string | null;
}

// Espelha PersonProgressDTO: quanto da filmografia (já lançada) de uma pessoa você viu
export interface PersonProgress {
  watched: number;
  total: number;
  achievement: Achievement | null; // filmografia completa
}

// Espelha AchievementDTO: conquista do perfil
export interface Achievement {
  id: number;
  type: "FILMOGRAFIA_COMPLETA";
  person: { tmdbId: number; name: string; profilePath: string | null; slug: string | null };
  films: number; // quantos filmes eram quando foi conquistada
  hidden: boolean; // só a dona recebe as ocultas
  achievedAt: string;
}

// Espelha FavoritePeopleDTO: as duas listas, cada uma em ordem
export interface FavoritePeople {
  actors: FavoritePerson[];
  directors: FavoritePerson[];
}

export type FavoritePeopleKind = keyof FavoritePeople;

const DEPARTMENTS: Record<string, string> = {
  Acting: "Atuação",
  Directing: "Direção",
  Writing: "Roteiro",
  Production: "Produção",
  Editing: "Montagem",
  Camera: "Fotografia",
  Sound: "Som",
  Art: "Direção de arte",
};

export function departmentLabel(department: string | null): string | null {
  if (!department) return null;
  return DEPARTMENTS[department] ?? department;
}
