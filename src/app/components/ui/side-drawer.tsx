"use client";

import { useEffect, useRef } from "react";
import { XIcon } from "@phosphor-icons/react";

interface SideDrawerProps {
  open: boolean;
  onClose: () => void;
  label: string;
  /** título e subtítulo no topo da gaveta */
  title: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Gaveta lateral que entra pela direita, com a altura da tela.
 * Usa o <dialog> nativo, como o Modal: foco preso, Esc e clique fora fecham.
 */
export function SideDrawer({ open, onClose, label, title, children }: SideDrawerProps) {
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
      className="drawer m-0 ml-auto h-dvh max-h-none w-[min(400px,calc(100vw-3rem))] p-0 bg-surface text-foreground ring-1 ring-white/10 shadow-2xl shadow-black/70"
    >
      {open && (
        <div className="flex h-full flex-col">
          <div className="flex items-start gap-3 px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-4 border-b border-foreground/5">
            <div className="flex-1 min-w-0">{title}</div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="-mr-2 -mt-1 p-2 rounded-full text-brand-slate hover:text-foreground hover:bg-foreground/5 transition-colors"
            >
              <XIcon size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom)]">{children}</div>
        </div>
      )}
    </dialog>
  );
}
