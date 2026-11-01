"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CircleNotchIcon } from "@phosphor-icons/react";
import Header from "@/app/components/header";
import { ApiError } from "@/lib/api-client";
import { useFetch } from "@/lib/hooks/use-fetch";
import { getMovieByTmdbId } from "@/lib/services/movie-service";

/**
 * Ponte para filmes que vieram da busca no TMDB: o backend importa o filme
 * (na primeira vez) e daqui seguimos para a página normal dele, /movies/{id}.
 */
export default function TmdbMovieRedirect() {
  const params = useParams<{ tmdbId: string }>();
  const router = useRouter();
  const tmdbId = Number(params.tmdbId);
  const validId = Number.isInteger(tmdbId) && tmdbId > 0 ? tmdbId : null;

  const movie = useFetch(validId, getMovieByTmdbId);

  useEffect(() => {
    // replace: o "voltar" do navegador não deve cair de novo nesta página intermediária
    if (movie.data) router.replace(`/movies/${movie.data.id}`);
  }, [movie.data, router]);

  const notFound =
    validId === null || (movie.error instanceof ApiError && movie.error.status === 404);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Header />
      <main className="pt-28 sm:pt-32 pb-24 px-6 md:px-12 xl:px-24 max-w-[1400px] mx-auto">
        <div className="py-32 flex flex-col items-center gap-4 text-center text-brand-slate/60">
          {notFound ? (
            <>
              <h1 className="text-3xl font-medium tracking-tight text-foreground">Filme não encontrado.</h1>
              <Link href="/movies" className="text-brand-blue hover:underline">Voltar para a busca</Link>
            </>
          ) : movie.error ? (
            <>
              <p>Não foi possível trazer este filme agora.</p>
              <button onClick={movie.reload} className="font-medium text-brand-blue hover:underline">
                Tentar de novo
              </button>
            </>
          ) : (
            <>
              <CircleNotchIcon size={32} className="animate-spin text-brand-slate/40" />
              <p>Trazendo o filme para o Nitrate…</p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
