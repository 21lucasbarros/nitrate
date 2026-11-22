import { apiFetch } from "../api-client";
import type { MovieReview, ReviewComment, ReviewEngagement, ReviewInvite, ReviewRequest } from "../types/review";

export function getRecentReviews(limit = 20): Promise<MovieReview[]> {
  return apiFetch<MovieReview[]>(`/reviews/recent?limit=${limit}`);
}

export function getReview(id: number): Promise<MovieReview> {
  return apiFetch<MovieReview>(`/reviews/${id}`);
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

export function getReviewEngagement(id: number): Promise<ReviewEngagement> {
  return apiFetch<ReviewEngagement>(`/reviews/${id}/engagement`);
}

export function likeReview(id: number): Promise<ReviewEngagement> {
  return apiFetch<ReviewEngagement>(`/reviews/${id}/like`, { method: "POST" });
}

export function unlikeReview(id: number): Promise<ReviewEngagement> {
  return apiFetch<ReviewEngagement>(`/reviews/${id}/like`, { method: "DELETE" });
}

export function getReviewComments(id: number): Promise<ReviewComment[]> {
  return apiFetch<ReviewComment[]>(`/reviews/${id}/comments`);
}

export function addReviewComment(id: number, text: string): Promise<ReviewComment> {
  return apiFetch<ReviewComment>(`/reviews/${id}/comments`, { method: "POST", body: JSON.stringify({ text }) });
}

export function deleteReviewComment(id: number, commentId: number): Promise<void> {
  return apiFetch<void>(`/reviews/${id}/comments/${commentId}`, { method: "DELETE" });
}

/** review em conjunto: o convite que chegou pelo sino */
export function getReviewInvite(id: number): Promise<ReviewInvite> {
  return apiFetch<ReviewInvite>(`/reviews/invites/${id}`);
}

/** sem `review`, fica com a review de quem convidou; com, escreve a própria */
export function acceptReviewInvite(id: number, review?: ReviewRequest): Promise<MovieReview> {
  return apiFetch<MovieReview>(`/reviews/invites/${id}/accept`, {
    method: "POST",
    body: JSON.stringify({ review: review ?? null }),
  });
}

export function declineReviewInvite(id: number): Promise<void> {
  return apiFetch<void>(`/reviews/invites/${id}/decline`, { method: "POST" });
}

export function deleteReview(id: number): Promise<void> {
  return apiFetch<void>(`/reviews/${id}`, { method: "DELETE" });
}
