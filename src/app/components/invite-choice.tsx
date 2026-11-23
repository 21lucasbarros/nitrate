/** uma das duas formas de aceitar o convite de review em conjunto (usar a de quem convidou ou escrever a própria) */
export function ChoiceButton({ icon, title, text, onClick, disabled }: {
  icon: React.ReactNode;
  title: string;
  text: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group flex flex-col items-start gap-2 p-5 rounded-xl border border-foreground/10 text-left hover:border-brand-orange/50 hover:bg-surface transition-colors disabled:opacity-60"
    >
      <span className="text-brand-slate group-hover:text-brand-orange transition-colors">{icon}</span>
      <span className="font-semibold">{title}</span>
      <span className="text-sm text-brand-slate leading-relaxed">{text}</span>
    </button>
  );
}
