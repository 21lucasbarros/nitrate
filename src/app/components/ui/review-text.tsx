import { Fragment } from "react";
import { parseInline, parseReview, type Inline } from "@/utils/review-markup";

/**
 * Texto de uma review com a formatação do editor (negrito, itálico, citação, link).
 * Monta elementos React a partir do texto: nada de HTML vindo do usuário entra na página.
 * `inline` junta tudo num bloco só (para prévias com line-clamp): citações viram itálico.
 */
export function ReviewText({ text, inline = false, className = "" }: { text: string; inline?: boolean; className?: string }) {
  if (inline) {
    return (
      <p className={`whitespace-pre-line ${className}`}>
        {text.replace(/\r\n?/g, "\n").split("\n").map((line, i) => {
          const quote = line.startsWith(">");
          const nodes = renderInline(parseInline(line.replace(/^> ?/, "")));
          return (
            <Fragment key={i}>
              {i > 0 && "\n"}
              {quote ? <em className="text-foreground/65">{nodes}</em> : nodes}
            </Fragment>
          );
        })}
      </p>
    );
  }

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {parseReview(text).map((block, i) => {
        const lines = block.lines.map((line, j) => (
          <Fragment key={j}>
            {j > 0 && <br />}
            {renderInline(line)}
          </Fragment>
        ));
        return block.type === "quote" ? (
          <blockquote key={i} className="pl-4 border-l-2 border-brand-orange/60 italic text-foreground/70">
            {lines}
          </blockquote>
        ) : (
          <p key={i}>{lines}</p>
        );
      })}
    </div>
  );
}

function renderInline(nodes: Inline[]): React.ReactNode {
  return nodes.map((node, i) => {
    switch (node.type) {
      case "text":
        return <Fragment key={i}>{node.text}</Fragment>;
      case "bold":
        return <strong key={i} className="font-semibold text-foreground">{renderInline(node.children)}</strong>;
      case "italic":
        return <em key={i}>{renderInline(node.children)}</em>;
      case "link":
        return (
          <a
            key={i}
            href={node.href}
            target="_blank"
            // ugc/nofollow: link escrito por usuário
            rel="noopener noreferrer nofollow ugc"
            className="text-brand-blue underline underline-offset-4 decoration-brand-blue/40 hover:decoration-brand-blue"
          >
            {renderInline(node.children)}
          </a>
        );
    }
  });
}
