"use client";

import { useState } from "react";
import { StarHalfIcon, StarIcon } from "@phosphor-icons/react";

interface StarInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
  size?: number;
}

const formatRating = (value: number) => value.toLocaleString("pt-BR");

/** Nota de 0,5 a 5 em meias estrelas. Clicar na nota atual limpa a nota. */
export function StarInput({ value, onChange, size = 32 }: StarInputProps) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value ?? 0;

  return (
    <div className="flex items-center gap-3">
      <div
        role="radiogroup"
        aria-label="Nota"
        className="flex items-center"
        onMouseLeave={() => setHover(null)}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isFull = shown >= star;
          const isHalf = !isFull && shown >= star - 0.5;
          return (
            <span key={star} className="relative" style={{ width: size, height: size }}>
              <span className="absolute inset-0 text-brand-orange pointer-events-none">
                {isFull ? (
                  <StarIcon size={size} weight="fill" />
                ) : isHalf ? (
                  <StarHalfIcon size={size} weight="fill" />
                ) : (
                  <StarIcon size={size} weight="fill" className="text-brand-slate/15" />
                )}
              </span>
              {[star - 0.5, star].map((rating, i) => (
                <button
                  key={rating}
                  type="button"
                  role="radio"
                  aria-checked={value === rating}
                  aria-label={`${formatRating(rating)} estrela${rating > 1 ? "s" : ""}`}
                  onMouseEnter={() => setHover(rating)}
                  onFocus={() => setHover(rating)}
                  onBlur={() => setHover(null)}
                  onClick={() => onChange(value === rating ? null : rating)}
                  className={`absolute top-0 h-full w-1/2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue rounded-sm ${i === 0 ? "left-0" : "right-0"}`}
                />
              ))}
            </span>
          );
        })}
      </div>
      <span className="text-sm font-mono text-brand-slate/60 w-8">
        {shown > 0 ? formatRating(shown) : "—"}
      </span>
    </div>
  );
}
