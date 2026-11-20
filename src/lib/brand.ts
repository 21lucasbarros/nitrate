// endereço público do site: base das URLs absolutas (canonical, Open Graph, sitemap)
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://nitrate.com.br").replace(/\/+$/, "");

export const SITE_NAME = "Nitrate";
export const SITE_DESCRIPTION =
  "O seu diário de cinema: registre os filmes que assistiu, dê notas, escreva reviews, monte listas e descubra o que assistir com quem tem o mesmo gosto.";

/**
 * O ícone do Nitrate (o mesmo de src/app/icon.svg) para as imagens geradas com next/og.
 * `rounded` = false no apple-icon, que o iOS já arredonda sozinho.
 */
export function brandIconSvg(rounded = true): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="${rounded ? 14 : 0}" fill="#141517"/>
  <path fill="#ECEDEE" d="M13 15h11l17 22V15h10v34H40L23 27v22H13z"/>
  <g fill="#141517">
    <rect x="16.5" y="35" width="4" height="4" rx="1"/>
    <rect x="16.5" y="42" width="4" height="4" rx="1"/>
    <rect x="44" y="18" width="4" height="4" rx="1"/>
    <rect x="44" y="25" width="4" height="4" rx="1"/>
  </g>
  <circle cx="53" cy="11" r="6" fill="#FF6A1C" stroke="#141517" stroke-width="2.5"/>
</svg>`;
}

export function brandIconDataUri(rounded = true): string {
  return `data:image/svg+xml;base64,${Buffer.from(brandIconSvg(rounded)).toString("base64")}`;
}

// o openGraph de uma página substitui o do layout raiz inteiro (não mescla), então cada uma repete isto
export const OPEN_GRAPH_BASE = { siteName: SITE_NAME, locale: "pt_BR" } as const;
