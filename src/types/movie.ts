export interface Movie {
  id: number;
  title: string;
  releaseYear: number | null;
  rating: number | null;
  director: string | null;
  franchise: string | null;
  genres: string[];
}
