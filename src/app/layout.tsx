import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/brand";
import { JsonLd } from "./components/json-ld";
import { EggQuote } from "./components/easter-eggs/egg-quote";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// títulos de filme e texto das reviews
const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // cada página só passa o próprio título: "Duna (2021) · Nitrate"
  title: { default: `${SITE_NAME}: o seu diário de cinema`, template: `%s · ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ["diário de cinema", "filmes", "reviews de filmes", "notas de filmes", "listas de filmes", "o que assistir", "watchlist", "Letterboxd"],
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "pt_BR",
    url: "/",
    title: `${SITE_NAME}: o seu diário de cinema`,
    description: SITE_DESCRIPTION,
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#141517",
  colorScheme: "dark",
};

// dados estruturados do site para o Google (nome do site nos resultados)
const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  inLanguage: "pt-BR",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-br"
      className={`${geistSans.variable} ${geistMono.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <JsonLd data={websiteJsonLd} />
        <AuthProvider>{children}</AuthProvider>
        {/* falas dos easter eggs de filmes, em qualquer página */}
        <EggQuote />
      </body>
    </html>
  );
}
