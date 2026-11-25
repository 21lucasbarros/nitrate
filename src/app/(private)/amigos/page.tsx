"use client";

import { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CircleNotchIcon, MagnifyingGlassIcon, UsersThreeIcon } from "@phosphor-icons/react";

import Header from "@/app/components/header";
import { openHeaderSearch } from "@/app/components/header-search";
import { ActivityFeed } from "@/app/components/activity-feed";
import { SimilarUsers } from "@/app/components/similar-users";
import { UserList } from "@/app/components/user-list";
import { SectionHeading } from "@/app/components/ui/section-heading";
import { useAuth } from "@/lib/auth-context";
import { useFetch } from "@/lib/hooks/use-fetch";
import { getFollowing, getSimilarUsers } from "@/lib/services/user-service";
import type { SimilarUser } from "@/lib/types/user";

const TABS = [
  { id: "atividade", label: "Atividade" },
  { id: "pessoas", label: "Pessoas" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const fetchSimilar = () => getSimilarUsers();

export default function FriendsPage() {
  // useSearchParams precisa de Suspense para o build estático do Next
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Header />
      <main className="pt-28 sm:pt-32 pb-24 px-6 max-w-[1100px] mx-auto">
        <Suspense fallback={<Loading />}>
          <Friends />
        </Suspense>
      </main>
    </div>
  );
}

function Friends() {
  const { status, user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const rawTab = searchParams.get("tab") ?? "";
  const tab: TabId = TABS.some((t) => t.id === rawTab) ? (rawTab as TabId) : "atividade";

  const followsSomeone = status === "authenticated" && user.followingCount > 0;
  const following = useFetch(status === "authenticated" && tab === "pessoas" ? user.username : null, getFollowing);
  const similar = useFetch(status === "authenticated" && (tab === "pessoas" || !followsSomeone) ? "parecidos" : null, fetchSimilar);

  if (status !== "authenticated") return <Loading />;

  const selectTab = (id: TabId) => {
    router.replace(id === "atividade" ? pathname : `${pathname}?tab=${id}`, { scroll: false });
  };

  return (
    <>
      <span className="text-xs font-bold tracking-[0.2em] uppercase text-brand-orange">Sua rede</span>
      <h1 className="mt-2 text-4xl sm:text-5xl font-medium tracking-tight">Amigos.</h1>
      <p className="mt-2 text-brand-slate">
        {followsSomeone
          ? `O que você e ${user.followingCount === 1 ? "a pessoa que você segue andam" : `as ${user.followingCount} pessoas que você segue andam`} assistindo, listando, curtindo e comentando.`
          : "Siga pessoas para acompanhar aqui o que elas assistem, listam e querem ver."}
      </p>

      {!followsSomeone ? (
        <EmptyNetwork similar={similar.data} />
      ) : (
        <>
          <div
            role="tablist"
            aria-label="Atividade dos amigos"
            className="mt-10 flex gap-6 overflow-x-auto [scrollbar-width:none] shadow-[inset_0_-1px_0_rgb(236_237_238/0.1)]"
          >
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => selectTab(t.id)}
                className={`shrink-0 pb-3 text-sm border-b-2 transition-colors ${tab === t.id ? "border-brand-orange text-foreground" : "border-transparent text-brand-slate hover:text-foreground"}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <section role="tabpanel" className="pt-8">
            {tab === "atividade" && <ActivityFeed />}

            {tab === "pessoas" && (
              <div className="flex flex-col gap-12">
                {similar.data && similar.data.length > 0 && (
                  <div>
                    <SectionHeading title="Gostos parecidos com o seu" />
                    <SimilarUsers users={similar.data} />
                  </div>
                )}
                <div>
                  <SectionHeading title="Você segue" count={user.followingCount} href={`/u/${user.username}?tab=rede`} linkLabel="Seguidores" />
                  {following.data ? <UserList users={following.data} /> : <Loading />}
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}

/** ainda não segue ninguém: sugestões por gosto parecido e a busca */
function EmptyNetwork({ similar }: { similar: SimilarUser[] | undefined }) {
  return (
    <div className="mt-10 flex flex-col gap-12">
      <div className="flex flex-col items-center text-center py-12 rounded-md border border-dashed border-foreground/10">
        <UsersThreeIcon size={40} weight="light" className="text-brand-slate/50" />
        <p className="mt-4 max-w-sm text-brand-slate">Encontre cinéfilos pelo nome ou comece pelas pessoas que dão notas parecidas com as suas.</p>
        <button
          type="button"
          onClick={() => openHeaderSearch()}
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-brand-btn text-brand-btn-text text-sm font-semibold hover:bg-brand-btn/90 transition-colors"
        >
          <MagnifyingGlassIcon size={16} weight="bold" /> Buscar pessoas
        </button>
      </div>
      {similar && similar.length > 0 && (
        <div>
          <SectionHeading title="Gostos parecidos com o seu" />
          <SimilarUsers users={similar} />
        </div>
      )}
    </div>
  );
}

function Loading() {
  return (
    <div className="py-24 flex justify-center text-brand-slate/40">
      <CircleNotchIcon size={28} className="animate-spin" />
    </div>
  );
}
