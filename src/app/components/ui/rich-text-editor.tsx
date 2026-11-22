"use client";

import { useLayoutEffect, useRef, useState } from "react";
import {
  ArrowUUpLeftIcon,
  ArrowUUpRightIcon,
  CheckIcon,
  LinkSimpleIcon,
  TextBIcon,
  TextIndentIcon,
  TextItalicIcon,
  XIcon,
} from "@phosphor-icons/react";
import { shortcutLabel, useIsApple } from "@/lib/hooks/use-is-apple";
import {
  insertLink,
  normalizeUrl,
  toggleBold,
  toggleItalic,
  toggleQuote,
  type TextState,
} from "@/utils/review-markup";

// digitação seguida vira um passo só no desfazer
const TYPING_GROUP_MS = 1000;
const HISTORY_MAX = 200;

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  placeholder?: string;
  label: string;
  rows?: number;
}

/** textarea com barra de formatação (negrito, itálico, citação, link) e desfazer/refazer */
export function RichTextEditor({ value, onChange, maxLength, placeholder, label, rows = 7 }: RichTextEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [history, setHistory] = useState<{ past: TextState[]; future: TextState[] }>({ past: [], future: [] });
  const lastTyping = useRef(0);
  // seleção a aplicar depois que o React atualizar o texto
  const pendingSelection = useRef<{ start: number; end: number } | null>(null);
  // a seleção de quando o campo de link abriu (o foco sai do textarea)
  const linkSelection = useRef<TextState | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkError, setLinkError] = useState(false);

  useLayoutEffect(() => {
    const selection = pendingSelection.current;
    const textarea = ref.current;
    if (!selection || !textarea) return;
    pendingSelection.current = null;
    textarea.focus();
    textarea.setSelectionRange(selection.start, selection.end);
  }, [value]);

  const current = (): TextState => ({
    text: value,
    start: ref.current?.selectionStart ?? value.length,
    end: ref.current?.selectionEnd ?? value.length,
  });

  /** aplica uma mudança guardando o estado anterior para o desfazer */
  const commit = (next: TextState, before: TextState = current()) => {
    if (maxLength !== undefined && next.text.length > maxLength) return;
    setHistory((h) => ({ past: [...h.past, before].slice(-HISTORY_MAX), future: [] }));
    pendingSelection.current = { start: next.start, end: next.end };
    onChange(next.text);
  };

  const format = (transform: (s: TextState) => TextState) => {
    lastTyping.current = 0;
    const before = current();
    commit(transform(before), before);
  };

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const now = Date.now();
    // o primeiro caractere de uma sequência guarda o ponto de volta; os seguintes, não
    if (now - lastTyping.current > TYPING_GROUP_MS) {
      // onde o cursor estava antes: o cursor de agora menos o que foi inserido (ou mais o que foi apagado)
      const cursor = Math.min(value.length, Math.max(0, e.target.selectionStart - (e.target.value.length - value.length)));
      const before = { text: value, start: cursor, end: cursor };
      setHistory((h) => ({ past: [...h.past, before].slice(-HISTORY_MAX), future: [] }));
    }
    lastTyping.current = now;
    onChange(e.target.value);
  };

  const undo = () => {
    const previous = history.past[history.past.length - 1];
    if (!previous) return;
    lastTyping.current = 0;
    setHistory((h) => ({ past: h.past.slice(0, -1), future: [current(), ...h.future] }));
    pendingSelection.current = { start: Math.max(0, previous.start), end: Math.max(0, previous.end) };
    onChange(previous.text);
  };

  const redo = () => {
    const next = history.future[0];
    if (!next) return;
    lastTyping.current = 0;
    setHistory((h) => ({ past: [...h.past, current()], future: h.future.slice(1) }));
    pendingSelection.current = { start: next.start, end: next.end };
    onChange(next.text);
  };

  const openLink = () => {
    linkSelection.current = current();
    setLinkUrl("");
    setLinkError(false);
    setLinkOpen(true);
  };

  const applyLink = () => {
    const url = normalizeUrl(linkUrl);
    const selection = linkSelection.current;
    if (!url || !selection) {
      setLinkError(true);
      return;
    }
    setLinkOpen(false);
    lastTyping.current = 0;
    commit(insertLink(selection, url), selection);
  };

  // os atalhos no rótulo dos botões, com ⌘ ou Ctrl conforme o sistema (sem atalho até saber qual é)
  const isApple = useIsApple();
  const withShortcut = (label: string, key: string, shift = false) =>
    isApple === null ? label : `${label} (${shortcutLabel(isApple, key, shift)})`;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!(e.metaKey || e.ctrlKey)) return;
    const key = e.key.toLowerCase();
    const action =
      key === "z" ? (e.shiftKey ? redo : undo)
      : key === "y" ? redo
      : key === "b" ? () => format(toggleBold)
      : key === "i" ? () => format(toggleItalic)
      : key === "k" ? openLink
      : null;
    if (action) {
      e.preventDefault();
      action();
    }
  };

  return (
    <div className="rounded-xl border border-brand-slate/20 overflow-hidden focus-within:border-brand-blue focus-within:ring-1 focus-within:ring-brand-blue transition-colors">
      <textarea
        ref={ref}
        aria-label={label}
        value={value}
        onChange={handleTyping}
        onKeyDown={handleKeyDown}
        maxLength={maxLength}
        rows={rows}
        placeholder={placeholder}
        className="block w-full px-4 py-3.5 bg-transparent text-foreground text-base leading-relaxed placeholder:text-brand-slate/40 focus:outline-none resize-y"
      />

      {linkOpen && (
        <div className="flex items-center gap-2 px-3 py-2 border-t border-foreground/10 bg-background/40">
          <LinkSimpleIcon size={16} className="shrink-0 text-brand-slate" />
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => {
              setLinkUrl(e.target.value);
              setLinkError(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyLink();
              }
              if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation(); // não fecha o modal, só o campo
                setLinkOpen(false);
              }
            }}
            placeholder="Cole o endereço (https://…)"
            aria-label="Endereço do link"
            autoFocus
            className={`flex-1 min-w-0 bg-transparent text-sm placeholder:text-brand-slate/50 focus:outline-none ${linkError ? "text-brand-crimson" : ""}`}
          />
          <ToolButton label="Inserir link" onClick={applyLink}><CheckIcon size={16} weight="bold" /></ToolButton>
          <ToolButton label="Cancelar" onClick={() => setLinkOpen(false)}><XIcon size={16} /></ToolButton>
        </div>
      )}

      <div className="flex items-center gap-2 px-3 py-2.5 border-t border-foreground/10 bg-background/60">
        <ToolButton label={withShortcut("Negrito", "B")} onClick={() => format(toggleBold)}><TextBIcon size={17} weight="bold" /></ToolButton>
        <ToolButton label={withShortcut("Itálico", "I")} onClick={() => format(toggleItalic)}><TextItalicIcon size={17} /></ToolButton>
        <ToolButton label="Citação" onClick={() => format(toggleQuote)}><TextIndentIcon size={17} /></ToolButton>
        <ToolButton label={withShortcut("Link", "K")} onClick={openLink} active={linkOpen}><LinkSimpleIcon size={17} /></ToolButton>
        <span className="ml-auto flex gap-2">
          <ToolButton round label={withShortcut("Desfazer", "Z")} onClick={undo} disabled={history.past.length === 0}>
            <ArrowUUpLeftIcon size={17} />
          </ToolButton>
          <ToolButton round label={isApple === false ? "Refazer (Ctrl+Y)" : withShortcut("Refazer", "Z", true)} onClick={redo} disabled={history.future.length === 0}>
            <ArrowUUpRightIcon size={17} />
          </ToolButton>
        </span>
      </div>
    </div>
  );
}

function ToolButton({ label, onClick, disabled, active, round, children }: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  round?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      // mousedown sem preventDefault tiraria o foco do textarea e perderia a seleção
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`w-8 h-8 flex items-center justify-center border transition-colors disabled:opacity-30 disabled:pointer-events-none ${round ? "rounded-full" : "rounded-md"} ${active ? "border-brand-orange/60 text-brand-orange" : "border-brand-slate/25 text-brand-slate hover:text-foreground hover:border-brand-slate/60"}`}
    >
      {children}
    </button>
  );
}
