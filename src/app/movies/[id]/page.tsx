"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CircleNotchIcon } from "@phosphor-icons/react";
import Header from "@/app/components/header";
import { ApiError } from "@/lib/api-client";
import { useFetch } from "@/lib/hooks/use-fetch";
import { getMovie } from "@/lib/services/movie-service";
import { filmHref } from "@/utils/movie-link";

/** Endereço antigo (/movies/22): redireciona para o novo, com o nome do filme (/film/superman-2025). */
export default function LegacyMovieRedirect() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const movieId = Number(params.id);
  const validId = Number.isInteger(movieId) && movieId > 0 ? movieId : null;
  const movie = useFetch(validId, getMovie);

  useEffect(() => {
    if (movie.data?.slug) router.replace(filmHref(movie.data));
  }, [movie.data, router]);

  const notFound = validId === null || (movie.error instanceof ApiError && movie.error.status === 404);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Header />
      <main className="pt-48 pb-24 flex flex-col items-center text-center">
        {notFound ? (
          <>
            <h1 className="text-3xl font-medium tracking-tight">Filme não encontrado.</h1>
            <Link href="/movies" className="mt-6 text-brand-blue hover:underline">Ver todos os filmes</Link>
          </>
        ) : movie.error ? (
          <p className="text-brand-slate/60">Não foi possível carregar o filme.</p>
        ) : (
          <CircleNotchIcon size={32} className="animate-spin text-brand-slate/40" />
        )}
      </main>
    </div>
  );
}
