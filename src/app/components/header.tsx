"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { SignOutIcon } from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth-context";
import { Avatar } from "./ui/avatar";

export default function Header() {
  const { status, user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = () => {
    signOut();
    router.push("/");
  };

  return (
    <header className="fixed top-0 w-full px-6 py-5 flex justify-between items-center z-50 bg-white text-foreground border-b border-brand-slate/5">
      <Link href="/" className="text-xl font-bold tracking-tighter uppercase flex items-center gap-1">
        Nitrate<div className="w-1.5 h-1.5 rounded-full bg-brand-orange mt-1"></div>
      </Link>

      {status === "authenticated" ? (
        <nav aria-label="Navegação Principal" className="hidden md:flex gap-8 text-sm font-medium tracking-wide">
          <Link href="/" className="hover:text-brand-blue transition-colors">Início</Link>
          <Link href="/movies" className="hover:text-brand-blue transition-colors">Filmes</Link>
          <Link href={`/u/${user.username}`} className="hover:text-brand-blue transition-colors">Meu diário</Link>
        </nav>
      ) : (
        <nav aria-label="Navegação Principal" className="hidden lg:flex gap-8 text-sm font-medium tracking-wide">
          <a href="#" className="hover:text-brand-blue transition-colors">Recursos</a>
          <Link href="/movies" className="hover:text-brand-blue transition-colors">Filmes</Link>
          <a href="#" className="hover:text-brand-blue transition-colors">Importar Dados</a>
        </nav>
      )}

      <div className="flex gap-4 items-center min-h-9">
        {status === "authenticated" && (
          <>
            <Link
              href={`/u/${user.username}`}
              className="flex items-center gap-2.5 text-sm font-medium hover:text-brand-orange transition-colors"
            >
              <Avatar name={user.name} username={user.username} size="sm" />
              <span className="hidden sm:inline">{user.name}</span>
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-sm font-medium text-brand-slate/60 hover:text-brand-crimson transition-colors"
            >
              <SignOutIcon size={18} />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </>
        )}
        {status === "anonymous" && (
          <>
            <Link href="/sign-in" className="hidden sm:block text-sm font-medium hover:text-brand-orange transition-colors">
              Entrar
            </Link>
            <Link
              href="/sign-in"
              className="text-sm font-medium px-4 py-2 bg-brand-btn text-brand-btn-text rounded-full hover:bg-brand-btn/90 transition-colors"
            >
              Criar Conta
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
