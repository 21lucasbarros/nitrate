"use client";

import { useState } from "react";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import Header from "@/app/components/header";
import { MovieGrid } from "@/app/components/movie-grid";
import { useFetch } from "@/lib/hooks/use-fetch";
import { getMovies } from "@/lib/services/movie-service";

const fetchMovies = () => getMovies();

// compara sem acento e sem diferenciar maiúsculas
const normalize = (value: string) =>
  value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export default function MoviesPage() {
  const movies = useFetch("all", fetchMovies);
  const [query, setQuery] = useState("");

  const q = normalize(query.trim());
  const filtered = (movies.data ?? []).filter(
    (movie) =>
      !q ||
      normalize(movie.title).includes(q) ||
      (movie.director && normalize(movie.director).includes(q)),
  );

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Header />
      <main className="pt-28 sm:pt-32 pb-24 px-6 md:px-12 xl:px-24 max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-brand-orange">Catálogo</span>
            <h1 className="text-4xl sm:text-5xl font-medium tracking-tight mt-2">Filmes.</h1>
          </div>
          <div className="group relative w-full md:w-80">
            <MagnifyingGlassIcon
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-slate/40 group-focus-within:text-brand-blue pointer-events-none"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por título ou diretor"
              aria-label="Buscar filmes"
              className="w-full pl-11 pr-4 py-3 bg-transparent border border-brand-slate/20 rounded-full text-sm placeholder:text-brand-slate/40 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
            />
          </div>
        </div>

        {movies.loading ? (
          <p className="text-brand-slate/50">Carregando filmes…</p>
        ) : movies.error ? (
          <p className="text-red-500">Não foi possível carregar os filmes.</p>
        ) : filtered.length === 0 ? (
          <p className="text-brand-slate/60">Nenhum filme encontrado para “{query}”.</p>
        ) : (
          <MovieGrid items={filtered.map((movie) => ({ movie }))} />
        )}
      </main>
    </div>
  );
}
