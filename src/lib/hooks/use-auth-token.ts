import { useSyncExternalStore } from "react";
import { getToken, subscribeToToken } from "../auth-storage";

/**
 * Token atual, atualizado quando o usuário entra ou sai.
 * `undefined` = ainda não sabemos (render no servidor, onde não existe localStorage).
 */
export function useAuthToken(): string | null | undefined {
  return useSyncExternalStore(subscribeToToken, getToken, () => undefined);
}
