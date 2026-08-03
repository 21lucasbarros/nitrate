export type Rating = 0 | 0.5 | 1 | 1.5 | 2 | 2.5 | 3 | 3.5 | 4 | 4.5 | 5;

export interface Review {
  id: number;
  user: string;
  movie: string;
  year: string;
  rating: Rating;
  favorited: boolean;
  date: string;
  text: string;
  /** URL do poster do filme. se n tiver, renderiza um placeholder com o motivo do filme-strip. */
  posterUrl?: string;
  engagementScore?: number;
}
