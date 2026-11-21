"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CircleNotchIcon } from "@phosphor-icons/react";
import Header from "@/app/components/header";
import { ApiError } from "@/lib/api-client";
import { useFetch } from "@/lib/hooks/use-fetch";
import { getSeriesByTmdbId } from "@/lib/services/series-service";
import { seriesHref } from "@/utils/series-link";

/**
 * Ponte para séries que vieram do TMDB: o backend importa a série (na primeira vez) e daqui
 * seguimos para a página normal dela, /series/{slug}.
 */
export default function TmdbSeriesRedirect() {
  const params = useParams<{ tmdbId: string }>();
  const router = useRouter();
  const tmdbId = Number(params.tmdbId);
  const validId = Number.isInteger(tmdbId) && tmdbId > 0 ? tmdbId : null;

  const series = useFetch(validId, getSeriesByTmdbId);

  useEffect(() => {
    // replace: o "voltar" do navegador não deve cair de novo nesta página intermediária
    if (series.data?.slug) router.replace(seriesHref(series.data));
  }, [series.data, router]);

  const notFound =
    validId === null || (series.error instanceof ApiError && series.error.status === 404);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Header />
      <main className="pt-28 sm:pt-32 pb-24 px-6 md:px-12 xl:px-24 max-w-[1400px] mx-auto">
        <div className="py-32 flex flex-col items-center gap-4 text-center text-brand-slate/60">
          {notFound ? (
            <>
              <h1 className="text-3xl font-medium tracking-tight text-foreground">Série não encontrada.</h1>
              <Link href="/series" className="text-brand-blue hover:underline">Voltar para as séries</Link>
            </>
          ) : series.error ? (
            <>
              <p>Não foi possível trazer esta série agora.</p>
              <button onClick={series.reload} className="font-medium text-brand-blue hover:underline">
                Tentar de novo
              </button>
            </>
          ) : (
            <>
              <CircleNotchIcon size={32} className="animate-spin text-brand-slate/40" />
              <p>Trazendo a série para o Nitrate…</p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
