import { useEffect, useState } from "react";
import { usernameSchema } from "../schemas/auth-schemas";
import { checkUsernameAvailability } from "../services/auth-service";

export type UsernameStatus =
  | "idle" // vazio ou formato inválido (o zod já mostra o erro)
  | "checking"
  | "available"
  | "taken"
  | "error";

const DEBOUNCE_MS = 500;

export function useUsernameAvailability(username: string): UsernameStatus {
  // guarda o resultado junto com o username consultado, assim um resultado
  // antigo nunca é exibido para um valor que já mudou
  const [result, setResult] = useState<{
    username: string;
    status: UsernameStatus;
  } | null>(null);

  const isValid = usernameSchema.safeParse(username).success;

  useEffect(() => {
    if (!isValid) return;

    let cancelled = false;
    const timeout = setTimeout(async () => {
      try {
        const { available } = await checkUsernameAvailability(username);
        if (!cancelled) {
          setResult({ username, status: available ? "available" : "taken" });
        }
      } catch {
        if (!cancelled) setResult({ username, status: "error" });
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [username, isValid]);

  if (!isValid) return "idle";
  if (result?.username === username) return result.status;
  return "checking";
}
