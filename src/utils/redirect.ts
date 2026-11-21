/**
 * Caminho interno seguro para redirecionar (?redirect=, ?depois=); qualquer outra coisa vira "/".
 * Checar o prefixo não basta: o navegador lê "/\evil.com" e "/<TAB>/evil.com" como "//evil.com".
 * Por isso a URL é resolvida de verdade e só passa se continuar neste site.
 */
export function safeInternalPath(value: string | null | undefined): string {
  if (!value?.startsWith("/")) return "/";
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin === window.location.origin) return url.pathname + url.search + url.hash;
  } catch {
    // URL inválida: cai no padrão
  }
  return "/";
}
