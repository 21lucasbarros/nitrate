import { useCallback, useEffect, useState } from "react";
import { getToken } from "../auth-storage";

interface StoryImage {
  url: string;
  file: File | null;
  previewUrl: string | null;
  failed: boolean;
}

async function fetchStoryImage(url: string, fileName: string): Promise<StoryImage> {
  try {
    const token = getToken();
    const response = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!response.ok) throw new Error(String(response.status));
    const blob = await response.blob();
    const file = new File([blob], fileName, { type: "image/png" });
    return { url, file, previewUrl: URL.createObjectURL(blob), failed: false };
  } catch {
    return { url, file: null, previewUrl: null, failed: true };
  }
}

/**
 * Pré-carrega a imagem de um story (rota que devolve PNG) assim que `url` é definida.
 * O iOS só deixa abrir o compartilhamento logo após o toque, então o arquivo precisa estar pronto antes.
 * Passe `null` para não carregar ainda.
 */
export function useStoryImage(url: string | null, fileName: string) {
  const [state, setState] = useState<StoryImage | null>(null);

  useEffect(() => {
    if (url === null) return;
    let cancelled = false;
    fetchStoryImage(url, fileName).then((image) => {
      if (!cancelled) setState(image);
    });
    return () => {
      cancelled = true;
    };
  }, [url, fileName]);

  // libera a URL da prévia quando ela é trocada ou a página sai
  useEffect(() => {
    const preview = state?.previewUrl;
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [state?.previewUrl]);

  // se tocarem em compartilhar antes do pré-carregamento terminar
  const load = useCallback(async () => {
    if (url === null) return null;
    const image = await fetchStoryImage(url, fileName);
    setState(image);
    return image.file;
  }, [url, fileName]);

  const current = state !== null && state.url === url ? state : null;
  return {
    file: current?.file ?? null,
    previewUrl: current?.previewUrl ?? null,
    failed: current?.failed ?? false,
    load,
  };
}

/**
 * Celular: abre a folha de compartilhar com a imagem anexada (Instagram → Stories).
 * Computador: baixa a imagem. Devolve "saved" quando baixou.
 */
export async function shareStoryFile(file: File): Promise<"shared" | "saved"> {
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
    } catch {
      // usuário cancelou: nada a fazer
    }
    return "shared";
  }
  const link = document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = file.name;
  link.click();
  URL.revokeObjectURL(link.href);
  return "saved";
}
