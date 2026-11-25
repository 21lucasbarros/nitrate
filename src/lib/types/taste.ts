import type { Movie } from "@/types/movie";

// Espelha TasteQuizDTO: o questionário de gostos do onboarding
export interface TasteQuiz {
  genres: TasteItem[];
  questions: TasteQuestion[]; // uma pergunta de "como" por gênero que tem variações
}

export interface TasteItem {
  id: string;
  label: string;
}

export interface TasteQuestion {
  id: string;
  genre: string; // id do gênero que abre esta pergunta
  title: string;
  options: { id: string; label: string; hint: string }[];
}

// Espelha TasteCandidateGroupDTO: filmes da grade, pela preferência que os trouxe
export interface TasteCandidateGroup {
  id: string;
  label: string; // "Comédia romântica", "Romance"...
  movies: Movie[];
}

// Espelha TasteRequestDTO
export interface TasteAnswers {
  genres: string[];
  answers: string[];
  movieIds?: number[]; // filmes marcados como "já vi e gostei" (só ao salvar)
}

// Espelha TasteProfileDTO
export interface TasteProfile {
  genres: string[];
  answers: string[];
  movies: Movie[];
  updatedAt: string | null; // null = nunca respondeu
}
