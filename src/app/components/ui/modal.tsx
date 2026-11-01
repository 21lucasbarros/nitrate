"use client";

import { useEffect, useRef } from "react";
import { XIcon } from "@phosphor-icons/react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** título acessível do modal (lido por leitores de tela) */
  label: string;
  children: React.ReactNode;
}

/**
 * Modal centralizado usando o <dialog> nativo: o navegador cuida do foco preso dentro dele,
 * do Esc para fechar e do fundo (::backdrop). Clicar fora também fecha.
 */
export function Modal({ open, onClose, label, children }: ModalProps) {
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
      className="modal m-auto w-[min(640px,calc(100%-2rem))] max-h-[calc(100dvh-2rem)] rounded-2xl bg-background text-foreground p-0 shadow-2xl shadow-brand-charcoal/30"
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
