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

export function checkUsernameAvailability(
  username: string
): Promise<UsernameAvailability> {
  return apiFetch<UsernameAvailability>(
    `/auth/check-username?username=${encodeURIComponent(username)}`
  );
}
