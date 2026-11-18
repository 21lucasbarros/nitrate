// Espelha PersonSummaryDTO, PersonDetailDTO e PersonCreditDTO do backend (dados do TMDB)
export interface PersonSummary {
  tmdbId: number;
  name: string;
  profilePath: string | null;
  department: string | null; // "Acting" | "Directing" | ...
  knownFor: string[];
}

export interface PersonCredit {
  id: number | null; // filme já importado para o Nitrate?
  slug: string | null;
  tmdbId: number;
  title: string;
  releaseYear: number | null;
  posterPath: string | null;
  role: string | null; // personagem ou função
}

export interface PersonDetail {
  tmdbId: number;
  name: string;
  profilePath: string | null;
  department: string | null;
  biography: string | null;
  birthday: string | null; // yyyy-mm-dd
  deathday: string | null;
  directed: PersonCredit[];
  acted: PersonCredit[];
}

// Espelha FavoritePersonDTO: ator/atriz ou diretor(a) favorito no perfil
export interface FavoritePerson {
  tmdbId: number;
  name: string;
  profilePath: string | null;
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
