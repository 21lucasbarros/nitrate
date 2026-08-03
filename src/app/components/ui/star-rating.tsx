import { Rating } from "@/types/review";
import { StarHalfIcon, StarIcon } from "@phosphor-icons/react";

interface StarRatingProps {
  rating: Rating;
  size?: number;
}

export function StarRating({ rating, size = 20 }: StarRatingProps) {
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => {
        const isFull = i < Math.floor(rating);
        const isHalf = rating % 1 !== 0 && i === Math.floor(rating);
        return (
          <span key={i} className="text-brand-orange">
            {isFull ? (
              <StarIcon size={size} weight="fill" />
            ) : isHalf ? (
              <StarHalfIcon size={size} weight="fill" />
            ) : (
              <StarIcon size={size} weight="fill" className="text-brand-slate/20" />
            )}
          </span>
        );
      })}
    </div>
  );
}
