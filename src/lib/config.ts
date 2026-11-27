// NEXT_PUBLIC_API_URL (.env.local / Vercel); sem ela, aponta para o backend local
// tira a barra final para não gerar "//auth/login"
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
).replace(/\/+$/, "");

/**
 * URL completa de um arquivo servido pela API (ex.: a foto de perfil, "/users/ana/avatar?v=123").
 * Só aceita caminho relativo à raiz: "//outro.site/x" ou "https://..." vindo do backend apontaria para
 * outro domínio, então devolve null e quem chama mostra o padrão.
 */
export function apiAssetUrl(path: string | null | undefined): string | null {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return null;
  return `${API_BASE_URL}${path}`;
}
