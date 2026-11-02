/**
 * Guarda em memória o resultado de um fetcher por um tempo. Voltar para uma página não refaz
 * a busca enquanto o resultado estiver válido. Erros não ficam em cache.
 */
export function cachedFetcher<A, T>(fetcher: (arg: A) => Promise<T>, ttlMs: number): (arg: A) => Promise<T> {
  const entries = new Map<string, { promise: Promise<T>; at: number }>();
  return (arg: A) => {
    const key = JSON.stringify(arg);
    const entry = entries.get(key);
    if (entry && Date.now() - entry.at < ttlMs) return entry.promise;
    const promise = fetcher(arg);
    entries.set(key, { promise, at: Date.now() });
    promise.catch(() => entries.delete(key));
    return promise;
  };
}
