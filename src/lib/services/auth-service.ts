import { apiFetch } from "../api-client";
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  UsernameAvailability,
} from "../types/auth";

export function login(data: LoginRequest): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function register(data: RegisterRequest): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** encerra o token atual no backend (sem isso, um token copiado continuaria valendo até vencer) */
export function logout(): Promise<void> {
  return apiFetch<void>("/auth/logout", { method: "POST" });
}

/** o backend responde 204 com ou sem conta para o e-mail */
export function requestPasswordReset(email: string): Promise<void> {
  return apiFetch<void>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(token: string, password: string): Promise<void> {
  return apiFetch<void>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}

export function checkUsernameAvailability(
  username: string
): Promise<UsernameAvailability> {
  return apiFetch<UsernameAvailability>(
    `/auth/check-username?username=${encodeURIComponent(username)}`
  );
}
