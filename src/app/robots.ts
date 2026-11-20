import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/brand";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // páginas da conta e de senha: não têm conteúdo para a busca
      disallow: ["/configuracoes", "/importar", "/amigos", "/esqueci-senha", "/redefinir-senha", "/admin"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
