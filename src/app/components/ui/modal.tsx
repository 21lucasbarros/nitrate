"use client";

import { useEffect, useRef } from "react";
import { XIcon } from "@phosphor-icons/react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** título acessível do modal (lido por leitores de tela) */
  label: string;
  /** "wide": formulários com pôster ao lado, que crescem para os lados em vez de para baixo */
  size?: "default" | "wide";
  children: React.ReactNode;
}

/**
 * Modal centralizado usando o <dialog> nativo: o navegador cuida do foco preso dentro dele,
 * do Esc para fechar e do fundo (::backdrop). Clicar fora também fecha.
 */
export function Modal({ open, onClose, label, size = "default", children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      onClose={onClose}
      onCancel={(e) => {
        // Esc: deixa o pai decidir (ele muda `open`), em vez de o navegador fechar sozinho
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        // o clique no ::backdrop chega com target = o próprio <dialog>
        if (e.target === e.currentTarget) onClose();
      }}
      className={`modal m-auto ${size === "wide" ? "w-[min(960px,calc(100%-2rem))]" : "w-[min(640px,calc(100%-2rem))]"} max-h-[calc(100dvh-2rem)] rounded-lg bg-surface text-foreground p-0 ring-1 ring-white/10 shadow-2xl shadow-black/60`}
    >
      {open && (
        <div className="relative p-6 sm:p-8">
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="absolute top-4 right-4 p-2 rounded-full text-brand-slate/50 hover:text-foreground hover:bg-foreground/5 transition-colors"
          >
            <XIcon size={20} />
          </button>
          {children}
        </div>
      )}
    </dialog>
  );
}
