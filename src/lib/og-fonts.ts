// fontes para as imagens geradas com next/og: ele só traz o Geist Regular embutido
const cache = new Map<string, Promise<ArrayBuffer | null>>();

/**
 * Baixa uma fonte do Google Fonts. `query` é o trecho do css2, ex.: "Geist:wght@600"
 * ou "Source+Serif+4:ital,wght@1,400". Devolve null se falhar: a imagem sai com a fonte padrão.
 */
export function loadGoogleFont(query: string): Promise<ArrayBuffer | null> {
  let font = cache.get(query);
  if (!font) {
    font = (async () => {
      try {
        // sem user-agent de navegador, o Google Fonts devolve TTF (o next/og não lê woff2)
        const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${query}`)).text();
        const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
        return url ? await (await fetch(url)).arrayBuffer() : null;
      } catch {
        return null;
      }
    })();
    cache.set(query, font);
  }
  return font;
}
