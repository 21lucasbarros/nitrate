"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { CircleNotchIcon } from "@phosphor-icons/react";
import Header from "@/app/components/header";
import { useFetch } from "@/lib/hooks/use-fetch";
import { getRetrospectiveMonths } from "@/lib/services/retrospective-service";
import { currentMonth } from "@/utils/format";

/** /u/{username}/retrospectiva -> mês mais recente com filmes (ou o mês atual, se não houver) */
export default function LatestRetrospective() {
  const { username } = useParams<{ username: string }>();
  const router = useRouter();
  const months = useFetch(username, getRetrospectiveMonths);

  useEffect(() => {
    if (months.data) {
      router.replace(`/u/${username}/retrospectiva/${months.data[0] ?? currentMonth()}`);
    }
  }, [months.data, router, username]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-48 flex justify-center text-brand-slate/40">
        {months.error ? (
          <p className="text-brand-slate/60">Não foi possível carregar a retrospectiva.</p>
        ) : (
          <CircleNotchIcon size={32} className="animate-spin" />
        )}
      </main>
    </div>
  );
}
