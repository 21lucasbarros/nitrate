import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buscar",
  description: "Busque filmes, séries, pessoas e perfis no Nitrate.",
  // resultado de busca não é página para o Google indexar
  robots: { index: false },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
