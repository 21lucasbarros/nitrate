"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { CircleNotchIcon } from "@phosphor-icons/react";

import Header from "@/app/components/header";
import { listHref } from "@/app/components/list-card";
import { useAuth } from "@/lib/auth-context";
import { useFetch } from "@/lib/hooks/use-fetch";
import { getList } from "@/lib/services/list-service";

const fetchList = (id: string) => getList(Number(id));

/** endereço antigo (/lista/1): a lista agora mora no perfil de quem criou, /u/{dona}/lista/{slug} */
export default function OldListAddress() {
  const { id } = useParams<{ id: string }>();
  const { status } = useAuth();
  const router = useRouter();
  // espera a sessão: listas privadas só carregam com o token da dona
  const list = useFetch(status === "loading" ? null : id, fetchList);

  useEffect(() => {
    if (list.data) router.replace(listHref(list.data));
  }, [list.data, router]);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Header />
      <main className="pt-28 sm:pt-32 pb-24 px-6 max-w-[1100px] mx-auto">
        {list.error ? (
          <div className="py-32 text-center">
            <h1 className="text-2xl font-semibold">Lista não encontrada.</h1>
            <p className="mt-3 text-brand-slate">Ela pode ter sido excluída ou ser privada.</p>
          </div>
        ) : (
          <div className="py-24 flex justify-center text-brand-slate/40">
            <CircleNotchIcon size={28} className="animate-spin" />
          </div>
        )}
      </main>
    </div>
  );
}
