import type { Metadata } from "next";
import { OPEN_GRAPH_BASE, SITE_NAME } from "@/lib/brand";
import { apiAssetUrl } from "@/lib/config";
import { describe, fetchForMetadata } from "@/lib/seo";
import type { UserProfile } from "@/lib/types/user";

type Props = { params: Promise<{ username: string }> };

// vale para o perfil e para as páginas abaixo dele (listas, reviews, retrospectiva), que
// sobrescrevem o título quando têm um mais específico
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const user = await fetchForMetadata<UserProfile>(`/users/${encodeURIComponent(username)}`);
  // o template é repetido aqui: um título sem template neste layout tiraria o "· Nitrate" das páginas filhas
  if (!user) {
    return { title: { absolute: `Perfil não encontrado · ${SITE_NAME}`, template: `%s · ${SITE_NAME}` }, robots: { index: false } };
  }

  const title = `${user.name} (@${user.username})`;
  const counts = `${user.filmsCount} ${user.filmsCount === 1 ? "filme" : "filmes"}, ${user.reviewsCount} ${user.reviewsCount === 1 ? "review" : "reviews"}`;
  const description = describe(user.bio) ?? `O diário de cinema de ${user.name} no Nitrate: ${counts}.`;
  const path = `/u/${user.username}`;
  // a foto vem da API (caminho relativo); sem foto (ou com um caminho que não é da API), a imagem padrão do site
  const image = apiAssetUrl(user.avatar) ?? "/opengraph-image";

  return {
    title: { absolute: `${title} · ${SITE_NAME}`, template: `%s · ${SITE_NAME}` },
    description,
    alternates: { canonical: path },
    openGraph: { ...OPEN_GRAPH_BASE, type: "profile", title, description, url: path, username: user.username, images: [image] },
    twitter: { card: "summary", title, description, images: [image] },
  };
}

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return children;
}
