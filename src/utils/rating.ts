import type { Rating } from "../types/review";

export function toRating(value: number): Rating {
  const clamped = Math.min(5, Math.max(0, value));
  const rounded = Math.round(clamped * 2) / 2;
  return rounded as Rating;
}
