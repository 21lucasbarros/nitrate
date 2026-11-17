/** botão redondo só com ícone (subir, descer, remover...) */
export function IconButton({ label, disabled, onClick, children }: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="p-1.5 rounded-full text-brand-slate hover:text-foreground hover:bg-surface-strong disabled:opacity-25 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}
