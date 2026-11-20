import Link from "next/link";
import Image from "next/image";
import { HeartIcon } from "@phosphor-icons/react/dist/ssr";
import { TMDB_NOTICE } from "@/lib/legal";

export default function Footer() {
  return (
    <footer className="bg-brand-charcoal text-foreground/50 py-10 sm:py-12 px-6 md:px-12 xl:px-24 border-t border-white/10 flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-8 md:gap-6 text-center md:text-left">
        <div className="text-xl sm:text-2xl font-bold tracking-tighter text-foreground uppercase flex items-center justify-center md:justify-start gap-1">
          Nitrate<div className="w-1.5 h-1.5 rounded-full bg-brand-orange mt-1"></div>
        </div>
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm font-medium">
          <Link href="/movies" className="hover:text-foreground transition-colors">Filmes</Link>
          <Link href="/importar" className="hover:text-foreground transition-colors">Migração</Link>
          <Link href="/sign-in" className="hover:text-foreground transition-colors">Criar conta</Link>
          <Link href="/termos" className="hover:text-foreground transition-colors">Termos</Link>
          <Link href="/privacidade" className="hover:text-foreground transition-colors">Privacidade</Link>
        </div>
        <div className="flex items-center gap-1.5 whitespace-nowrap text-xs font-mono uppercase tracking-widest">
          Feito com <HeartIcon size={13} weight="fill" className="text-brand-orange" aria-label="amor" /> ao cinema · {new Date().getFullYear()}
        </div>
      </div>
      {/* atribuição exigida pelos termos da API do TMDB */}
      <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3 text-xs text-center sm:text-left">
        <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer" className="shrink-0 opacity-80 hover:opacity-100 transition-opacity">
          <Image src="/tmdb-logo.svg" alt="The Movie Database (TMDB)" width={110} height={14} />
        </a>
        <p>{TMDB_NOTICE}</p>
      </div>
    </footer>
  );
}
