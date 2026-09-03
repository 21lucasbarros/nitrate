"use client";

import { Movie } from "@/types/movie";
import { useEffect, useState } from "react";

export default function TesteBackend() {
  const [filmes, setFilmes] = useState<Movie[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8080/movies")
      .then((res) => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json() as Promise<Movie[]>;
      })
      .then(setFilmes)
      .catch((e: Error) => setErro(e.message))
      .finally(() => setCarregando(false));
  }, []);

  if (erro) {
    return (
      <div style={{ padding: 20, color: "red" }}>
        Erro ao conectar no backend: {erro}
      </div>
    );
  }

  if (carregando) {
    return <div style={{ padding: 20, color: "#fff" }}>Carregando...</div>;
  }

  return (
    <div style={{ padding: 20, background: "#111", color: "#fff" }}>
      <h2>Teste de conexão — {filmes.length} filmes carregados</h2>
      <ul>
        {filmes.map((filme) => (
          <li key={filme.id}>
            {filme.title} ({filme.releaseYear ?? "ano desconhecido"}) — dir:{" "}
            {filme.director ?? "sem diretor cadastrado"}
          </li>
        ))}
      </ul>
    </div>
  );
}
