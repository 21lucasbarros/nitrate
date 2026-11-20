import Link from "next/link";

/** moldura das telas avulsas de conta (esqueci a senha, redefinir senha): logo, título e o conteúdo */
export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 sm:p-12 bg-background text-foreground font-sans selection:bg-brand-blue selection:text-background">
      <div className="w-full max-w-100">
        <Link href="/" className="text-xl font-bold tracking-tighter uppercase flex items-center gap-1 w-fit mb-12">
          Nitrate<div className="w-1.5 h-1.5 rounded-full bg-brand-orange mt-1"></div>
        </Link>
        <h1 className="text-3xl sm:text-4xl font-medium tracking-tight mb-3">{title}</h1>
        <p className="text-brand-slate/70 font-light text-sm sm:text-base mb-10">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}

/** sem o padding da direita: pr-4, ou pr-12 quando há o botão de mostrar a senha */
export const authInputClass =
  "w-full pl-12 py-3.5 bg-transparent border border-brand-slate/20 rounded-xl text-foreground placeholder:text-brand-slate/40 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all";

export const authButtonClass =
  "w-full flex items-center justify-center gap-2 bg-brand-btn text-brand-btn-text py-4 rounded-full font-semibold hover:bg-brand-btn/90 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed mt-2 shadow-lg shadow-brand-btn/20";

export const authIconClass =
  "absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-brand-slate/40 group-focus-within:text-brand-blue transition-colors";
