"use client";

import { useEffect, useRef } from "react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  label: string;
  /** cabeçalho centralizado (ex.: título e ano do filme) */
  header?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Gaveta que sobe de baixo (celular), com um botão "Pronto" separado embaixo.
 * Usa o <dialog> nativo, como o Modal: foco preso, Esc e toque fora fecham.
 */
export function BottomSheet({ open, onClose, label, header, children }: BottomSheetProps) {
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
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="sheet m-0 mt-auto mx-auto w-full max-w-lg max-h-[90dvh] bg-transparent p-0 text-foreground overflow-visible"
    >
      {open && (
        // o padding de baixo respeita a barra do iPhone
        <div className="flex flex-col gap-2.5 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {header && <div className="pt-6 pb-2 text-center">{header}</div>}
          <div className="max-h-[70dvh] overflow-y-auto rounded-2xl bg-surface ring-1 ring-white/10 shadow-2xl shadow-black/60">
            {children}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-4 rounded-2xl bg-surface ring-1 ring-white/10 text-base font-semibold hover:bg-surface-strong transition-colors"
          >
            Pronto
          </button>
        </div>
      )}
    </dialog>
  );
}
