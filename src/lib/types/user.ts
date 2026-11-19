import type { Movie } from "@/types/movie";

// Espelha UserSummaryDTO e UserProfileDTO do backend
export interface UserSummary {
  username: string;
  name: string;
  avatar: string | null; // caminho da foto na API (/users/x/avatar?v=...); null = sem foto
}

export interface UserProfile extends UserSummary {
  createdAt: string; // ISO
  bio: string | null;
  twitter: string | null; // só o @, sem a URL
  instagram: string | null;
  filmsCount: number;
  reviewsCount: number; // só as que têm texto
  likesCount: number;
  watchlistCount: number;
  followersCount: number;
  followingCount: number;
  favorites: Movie[]; // até 5, em ordem
  followedByMe: boolean | null; // null para visitantes e no próprio perfil
  followsMe: boolean | null; // este perfil segue quem está vendo ("Segue você"); null como acima
}

// Espelha SimilarUserDTO
export interface SimilarUser extends UserSummary {
  sharedFilms: number; // filmes que os dois avaliaram
  compatibility: number; // 0 a 100: o quanto as notas batem
}

// Espelha ProfileUpdateDTO
export interface ProfileUpdate {
  name: string;
  bio: string;
  twitter: string;
  instagram: string;
}

// Espelha NotificationDTO: estreias do Radar (com `movie`) ou alguém que começou a seguir (com `actor`)
interface NotificationBase {
  id: number;
  detail: string | null; // data de estreia ou serviços de streaming
  createdAt: string; // ISO
  read: boolean;
}

export type AppNotification =
  | (NotificationBase & { type: "CINEMA" | "STREAMING"; movie: Movie; actor: null })
  | (NotificationBase & { type: "FOLLOW"; movie: null; actor: UserSummary });
