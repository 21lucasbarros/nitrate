import { API_BASE_URL } from "./config";
import { clearToken, getToken } from "./auth-storage";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
  });

  // token recusado pelo backend: a sessão não vale mais
  if (response.status === 401 && token) {
    clearToken();
  }

  if (!response.ok) {
    let message = `Erro ${response.status}`;
    try {
      const data = await response.json();
      message = data.message ?? message;
    } catch {
      // resposta sem corpo JSON (401 sem StandardError)
    }
    throw new ApiError(message, response.status);
  }

  // DELETE e afins respondem 204, sem corpo
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
