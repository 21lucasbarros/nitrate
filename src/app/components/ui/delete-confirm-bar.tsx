"use client";

import { CircleNotchIcon, TrashIcon } from "@phosphor-icons/react";

/** confirmação de apagar no lugar do rodapé do formulário (em vez do window.confirm) */
export function DeleteConfirmBar({ title, busy, onKeep, onConfirm }: {
  title: string;
  busy: boolean;
  onKeep: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      role="alertdialog"
      aria-label={title}
      onKeyDown={(e) => {
        if (e.key === "Escape" && !busy) {
          // fecha só a confirmação: sem o padrão do Esc, o <dialog> do modal não dispara o cancel
          e.preventDefault();
          onKeep();
        }
      }}
      className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 rounded-xl bg-brand-crimson/10 ring-1 ring-brand-crimson/30 animate-[modal-in_180ms_ease-out]"
    >
      <TrashIcon size={20} className="shrink-0 text-brand-crimson" />
      <p className="flex-1 min-w-48 text-sm">
        <strong className="block font-semibold">{title}</strong>
        <span className="text-brand-slate">Isso não dá para desfazer.</span>
      </p>
      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={onKeep}
          disabled={busy}
          autoFocus
          className="px-4 py-2 rounded-full text-sm font-medium text-brand-slate hover:text-foreground hover:bg-surface-strong transition-colors"
        >
          Manter
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className="flex items-center justify-center gap-2 min-w-24 px-4 py-2 rounded-full bg-brand-crimson text-background text-sm font-semibold hover:bg-brand-crimson/90 transition-colors disabled:opacity-70"
        >
          {busy ? <CircleNotchIcon size={16} className="animate-spin" /> : "Apagar"}
        </button>
      </div>
    </div>
  );
}
