import type { Metadata } from "next";
import { OPEN_GRAPH_BASE } from "@/lib/brand";

const description = "Explore o acervo do Nitrate: os filmes em alta, os mais bem avaliados pela comunidade e todo o catálogo.";

export const metadata: Metadata = {
  title: "Filmes",
  description,
  alternates: { canonical: "/movies" },
  openGraph: { ...OPEN_GRAPH_BASE, title: "Filmes no Nitrate", description, url: "/movies", images: ["/opengraph-image"] },
};

export default function MoviesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
