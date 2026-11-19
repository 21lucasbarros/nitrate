/** compara sem acento nem caixa: "ingrid guimaraes" casa com "Ingrid Guimarães" */
export function normalizeText(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

/** `text` começa com o que foi buscado, ignorando acento e caixa */
export function matchesQuery(text: string, query: string): boolean {
  return normalizeText(text).startsWith(normalizeText(query));
}
