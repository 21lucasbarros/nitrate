// NEXT_PUBLIC_API_URL (.env.local / Vercel); sem ela, aponta para o backend local
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
