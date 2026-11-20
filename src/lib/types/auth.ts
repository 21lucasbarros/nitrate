// Espelha exatamente os DTOs do backend (RegisterRequestDTO, LoginRequestDTO, AuthResponseDTO)
export interface RegisterRequest {
  name: string;
  username: string;
  email: string;
  password: string;
  acceptedTerms: boolean; // idade mínima + Termos e Política de Privacidade
}

export interface LoginRequest {
  login: string; // e-mail ou username
  password: string;
}

export interface AuthResponse {
  token: string;
  name: string;
  username: string;
  email: string;
}

export interface UsernameAvailability {
  available: boolean;
}
