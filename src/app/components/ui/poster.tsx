import Image from "next/image";
import { FilmStripIcon } from "@phosphor-icons/react";
import { posterUrl, type PosterSize } from "@/utils/poster";

interface PosterProps {
  title: string;
  posterPath: string | null | undefined;
  size?: PosterSize;
  /** larguras para o `sizes` do next/image */
  sizes?: string;
  className?: string;
}

export function Poster({ title, posterPath, size = "w342", sizes = "160px", className = "" }: PosterProps) {
  const src = posterUrl(posterPath, size);

  return (
    <div
      className={`relative aspect-2/3 overflow-hidden rounded-sm ring-1 ring-foreground/10 bg-foreground/5 ${className}`}
    >
      {src ? (
        <Image
          src={src}
          alt={`Pôster de ${title}`}
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-2 text-foreground/25">
          <FilmStripIcon size={24} weight="light" />
          <span className="text-[10px] text-center leading-tight line-clamp-3">{title}</span>
        </div>
      )}
    </div>
  );
}
