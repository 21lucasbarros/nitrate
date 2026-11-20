import { apiFetch } from "./api-client";

/**
 * Busca para o metadata das páginas (título, descrição, Open Graph), feita no servidor.
 * Guarda a resposta por uma hora e devolve null em qualquer erro: sem os dados, a página
 * sai com o título genérico em vez de quebrar.
 */
export async function fetchForMetadata<T>(path: string): Promise<T | null> {
  try {
    return await apiFetch<T>(path, { next: { revalidate: 3600 } });
  } catch {
    return null;
  }
}

/** Descrição para a busca e para a prévia do link: uma linha, cortada no limite que o Google mostra. */
export function describe(text: string | null | undefined, max = 160): string | undefined {
  const clean = text?.replace(/\s+/g, " ").trim();
  if (!clean) return undefined;
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ") > max * 0.6 ? cut.lastIndexOf(" ") : cut.length)}…`;
}
