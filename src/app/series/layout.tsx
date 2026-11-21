import type { Metadata } from "next";
import { OPEN_GRAPH_BASE } from "@/lib/brand";

const description = "Séries no Nitrate: as mais vistas da semana, as mais bem avaliadas e a busca por qualquer série, com temporadas, episódios e onde assistir.";

export const metadata: Metadata = {
  title: "Séries",
  description,
  alternates: { canonical: "/series" },
  openGraph: { ...OPEN_GRAPH_BASE, title: "Séries no Nitrate", description, url: "/series", images: ["/opengraph-image"] },
};

export default function SeriesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
