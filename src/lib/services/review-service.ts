import { apiFetch } from "../api-client";
import type { MovieReview, ReviewRequest } from "../types/review";

export function getRecentReviews(): Promise<MovieReview[]> {
  return apiFetch<MovieReview[]>("/reviews/recent");
}

/** reviews com texto e sem spoiler, para a landing */
export function getFeaturedReviews(): Promise<MovieReview[]> {
  return apiFetch<MovieReview[]>("/reviews/featured");
}

export function getMovieReviews(movieId: number): Promise<MovieReview[]> {
  return apiFetch<MovieReview[]>(`/movies/${movieId}/reviews`);
}

export function createReview(data: ReviewRequest): Promise<MovieReview> {
  return apiFetch<MovieReview>("/reviews", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateReview(id: number, data: ReviewRequest): Promise<MovieReview> {
  return apiFetch<MovieReview>(`/reviews/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteReview(id: number): Promise<void> {
  return apiFetch<void>(`/reviews/${id}`, { method: "DELETE" });
}
