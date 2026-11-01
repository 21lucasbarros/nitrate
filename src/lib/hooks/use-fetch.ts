import { useCallback, useEffect, useState } from "react";

interface FetchState<A, T> {
  arg: A;
  version: number;
  data?: T;
  error?: unknown;
}

/**
 * Busca `fetcher(arg)` e refaz a busca quando `arg` muda. Passe `null` para não buscar.
 * `fetcher` deve ser uma função estável (ex.: as dos services), não uma arrow criada no render.
 */
export function useFetch<A, T>(arg: A | null, fetcher: (arg: A) => Promise<T>) {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<FetchState<A, T> | null>(null);

  useEffect(() => {
    if (arg === null) return;
    let cancelled = false;
    fetcher(arg)
      .then((data) => {
        if (!cancelled) setState({ arg, version, data });
      })
      .catch((error: unknown) => {
        if (!cancelled) setState({ arg, version, error });
      });
    return () => {
      cancelled = true;
    };
  }, [arg, fetcher, version]);

  // dados de outro `arg` nunca aparecem; num reload os dados anteriores continuam visíveis
  const current = state !== null && state.arg === arg ? state : null;

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  // atualiza os dados localmente (ex.: depois de um POST que já devolve o recurso)
  const setData = useCallback(
    (data: T) => {
      if (arg !== null) setState({ arg, version, data });
    },
    [arg, version],
  );

  return {
    data: current?.data,
    error: current?.error,
    loading: arg !== null && (current === null || current.version !== version),
    reload,
    setData,
  };
}
