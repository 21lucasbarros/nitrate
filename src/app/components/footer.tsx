import Link from "next/link";
import { TrumanLogo } from "./easter-eggs/truman-logo";
import { HeartIcon } from "@phosphor-icons/react/dist/ssr";

export default function Footer() {
  return (
    <footer className="bg-brand-charcoal text-foreground/50 py-10 sm:py-12 px-6 md:px-12 xl:px-24 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-8 md:gap-6 text-center md:text-left">
      {/* clique várias vezes seguidas: easter egg de O Show de Truman */}
      <TrumanLogo />
      <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm font-medium">
        <Link href="/movies" className="hover:text-foreground transition-colors">Filmes</Link>
        <Link href="/importar" className="hover:text-foreground transition-colors">Migração</Link>
        <Link href="/sign-in" className="hover:text-foreground transition-colors">Criar conta</Link>
      </div>
      <div className="flex items-center gap-1.5 whitespace-nowrap text-xs font-mono uppercase tracking-widest">
        Feito com <HeartIcon size={13} weight="fill" className="text-brand-orange" aria-label="amor" /> ao cinema · {new Date().getFullYear()}
      </div>
    </footer>
  );
}
