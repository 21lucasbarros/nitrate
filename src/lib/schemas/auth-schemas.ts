import { z } from "zod";

export const usernameSchema = z
  .string()
  .min(3, "Mínimo de 3 caracteres")
  .max(20, "Máximo de 20 caracteres")
  .regex(/^[a-z0-9_]+$/, "Apenas letras minúsculas, números e _");

export const loginSchema = z.object({
  login: z.string().min(1, "Informe seu e-mail ou usuário"),
  password: z.string().min(1, "Informe sua senha"),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "Nome muito curto"),
    username: usernameSchema,
    email: z.string().min(1, "Informe seu e-mail").email("E-mail inválido"),
    password: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres"),
    confirmPassword: z.string().min(1, "Confirme sua senha"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
