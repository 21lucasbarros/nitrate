"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { clearToken } from "./auth-storage";
import { useAuthToken } from "./hooks/use-auth-token";
import { getMe } from "./services/user-service";
import type { UserProfile } from "./types/user";

type AuthState =
  | { status: "loading"; user: null }
  | { status: "anonymous"; user: null }
  | { status: "authenticated"; user: UserProfile };

// união discriminada: checar `status === "authenticated"` já garante `user` não nulo
type AuthContextValue = AuthState & {
  /** recarrega o /users/me (ex.: contadores depois de criar uma review) */
  refreshUser: () => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const token = useAuthToken();
  const [version, setVersion] = useState(0);
  // o usuário carregado fica associado ao token que o buscou
  const [loaded, setLoaded] = useState<{ token: string; user: UserProfile | null } | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    getMe()
      .then((user) => {
        if (!cancelled) setLoaded({ token, user });
      })
      .catch(() => {
        // token recusado: o apiFetch já limpa em caso de 401
        if (!cancelled) setLoaded({ token, user: null });
      });
    return () => {
      cancelled = true;
    };
  }, [token, version]);

  let state: AuthState;
  if (token === undefined) {
    state = { status: "loading", user: null };
  } else if (token === null) {
    state = { status: "anonymous", user: null };
  } else if (loaded?.token === token) {
    state = loaded.user
      ? { status: "authenticated", user: loaded.user }
      : { status: "anonymous", user: null };
  } else {
    state = { status: "loading", user: null };
  }

  const value: AuthContextValue = {
    ...state,
    refreshUser: () => setVersion((v) => v + 1),
    signOut: clearToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return ctx;
}
