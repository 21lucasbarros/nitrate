// NEXT_PUBLIC_API_URL (.env.local / Vercel); sem ela, aponta para o backend local
// tira a barra final para não gerar "//auth/login"
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
).replace(/\/+$/, "");
