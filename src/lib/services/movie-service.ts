import { apiFetch } from "../api-client";
import type { Movie } from "@/types/movie";

export function getMovies(): Promise<Movie[]> {
  return apiFetch<Movie[]>("/movies");
}

export function getMovie(id: number): Promise<Movie> {
  return apiFetch<Movie>(`/movies/${id}`);
}
