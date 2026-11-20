/** Dados estruturados (schema.org) para o Google entender a página: filme, pessoa, site. */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // "<" escapado: um texto vindo do usuário (bio, review) não consegue fechar a tag <script>
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
