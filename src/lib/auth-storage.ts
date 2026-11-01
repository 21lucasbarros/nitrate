const TOKEN_KEY = "nitrate_token";
const AUTH_CHANGE_EVENT = "nitrate:auth-change";

export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null; // evita erro em SSR
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token || isTokenExpired(token)) return null;
  return token;
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

/**
 * Avisa quando o token muda, nesta aba (save/clear) ou em outra (evento storage).
 * Formato compatível com useSyncExternalStore.
 */
export function subscribeToToken(callback: () => void): () => void {
  window.addEventListener(AUTH_CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(AUTH_CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

// o backend emite JWT com validade de 24h; lemos o `exp` para não usar um token vencido
function isTokenExpired(token: string): boolean {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const { exp } = JSON.parse(json) as { exp?: number };
    return typeof exp === "number" && exp * 1000 <= Date.now();
  } catch {
    return true; // token malformado
  }
}
