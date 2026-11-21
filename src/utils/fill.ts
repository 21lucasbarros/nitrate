/** repete os itens até ter pelo menos `min` (faixas de pôsteres que precisam cobrir telas largas) */
export function fillTo<T>(items: T[], min: number): T[] {
  if (items.length === 0) return [];
  const out = [...items];
  while (out.length < min) out.push(...items);
  return out;
}
