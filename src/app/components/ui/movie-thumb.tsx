import Image from "next/image";
import { posterUrl } from "@/utils/poster";

/** pôster miniatura para linhas de lista (editores, resultados de busca) */
export function MovieThumb({ title, posterPath }: { title: string; posterPath: string | null }) {
  const src = posterUrl(posterPath, "w185");
  return src ? (
    <Image src={src} alt="" width={32} height={48} className="w-8 h-12 rounded object-cover shrink-0" />
  ) : (
    <span className="w-8 h-12 rounded bg-foreground/10 shrink-0" title={title} />
  );
}
