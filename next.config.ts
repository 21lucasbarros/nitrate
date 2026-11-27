import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// origem da API (lida no build, como no lib/config.ts): é para onde vão os fetches e de onde vêm
// as fotos de perfil. Valor inválido não quebra o build, só fica fora da CSP.
function apiOrigin(): string | null {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080").origin;
  } catch {
    return null;
  }
}
const api = apiOrigin() ?? "";
const tmdbImages = "https://image.tmdb.org https://media.themoviedb.org";

// CSP sem nonce (com nonce toda página viraria renderização dinâmica), então script-src precisa de
// 'unsafe-inline' para os scripts inline do Next. O ganho principal está em connect-src e img-src:
// mesmo com um XSS, o script não consegue mandar o token para outro domínio, só para o site e a API.
// Além disso: iframe de outro domínio (clickjacking), plugins, troca do <base> e formulário para fora.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`, // o dev do Next usa eval
  "style-src 'self' 'unsafe-inline'",
  // blob: é a prévia da foto no recorte do avatar e da imagem dos Stories
  `img-src 'self' data: blob: ${tmdbImages} ${api}`,
  `connect-src 'self' ${api}`,
  "font-src 'self' data:",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
]
  .map((directive) => directive.trim())
  .join("; ");

// headers de segurança em todas as páginas
const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // HTTPS obrigatório por 2 anos; no dev (http://localhost) não faz sentido
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]),
  { key: "X-Frame-Options", value: "DENY" }, // navegadores antigos, que não leem frame-ancestors
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.themoviedb.org",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
