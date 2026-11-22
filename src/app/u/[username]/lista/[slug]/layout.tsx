import type { Metadata } from "next";
import { OPEN_GRAPH_BASE } from "@/lib/brand";
import { describe, fetchForMetadata } from "@/lib/seo";
import { listCountLabel, listItemInfo, listItems, type MovieList } from "@/lib/types/list";
import { posterUrl } from "@/utils/poster";

type Props = { params: Promise<{ username: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, slug } = await params;
  // lista privada: a API só devolve para a dona, então aqui (sem token) cai no genérico, fora da busca
  const list = await fetchForMetadata<MovieList>(
    `/users/${encodeURIComponent(username)}/lists/${encodeURIComponent(slug)}`,
  );
  if (!list) return { title: "Lista", robots: { index: false } };

  const title = list.official ? `${list.name}, lista do Nitrate` : `${list.name}, lista de ${list.owner.name}`;
  const items = listItems(list).map(listItemInfo);
  const description =
    describe(list.description) ??
    `${listCountLabel(list)}${items.length > 0 ? `: ${items.slice(0, 4).map((item) => item.title).join(", ")}` : ""}.`;
  const cover = posterUrl(items.find((item) => item.posterPath)?.posterPath, "w500");
  const path = `/u/${list.owner.username}/lista/${list.slug}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      ...OPEN_GRAPH_BASE,
      type: "website",
      title,
      description,
      url: path,
      images: cover ? [{ url: cover, width: 500, height: 750, alt: list.name }] : undefined,
    },
    twitter: { card: "summary", title, description, images: cover ? [cover] : undefined },
  };
}

export default function ListLayout({ children }: { children: React.ReactNode }) {
  return children;
}
