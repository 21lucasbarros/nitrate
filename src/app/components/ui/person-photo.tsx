import Image from "next/image";
import { UserIcon } from "@phosphor-icons/react";
import { profileUrl, type ProfileSize } from "@/utils/poster";

interface PersonPhotoProps {
  name: string;
  profilePath: string | null;
  size?: ProfileSize;
  sizes?: string;
  className?: string;
}

/** foto redonda de ator/diretor; sem foto no TMDB, mostra um ícone */
export function PersonPhoto({ name, profilePath, size = "w185", sizes = "96px", className = "" }: PersonPhotoProps) {
  const src = profileUrl(profilePath, size);
  return (
    <div className={`relative aspect-square overflow-hidden rounded-full bg-foreground/5 ring-1 ring-foreground/10 ${className}`}>
      {src ? (
        <Image src={src} alt={`Foto de ${name}`} fill sizes={sizes} className="object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-foreground/25">
          <UserIcon size={28} weight="light" />
        </div>
      )}
    </div>
  );
}
