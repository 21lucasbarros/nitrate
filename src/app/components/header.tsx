"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MagnifyingGlassIcon, PlusIcon, SignOutIcon } from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth-context";
import { Avatar } from "./ui/avatar";

const navLink = "text-[13px] font-semibold tracking-[0.1em] uppercase text-brand-slate hover:text-foreground transition-colors";

export default function Header() {
  const { status, user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = () => {
    signOut();
    router.push("/");
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-brand-charcoal/90 backdrop-blur border-b border-foreground/5">
      <div className="max-w-[1180px] mx-auto px-6 h-[72px] flex items-center gap-8">
        <Link href="/" className="text-xl font-bold tracking-tighter uppercase flex items-center gap-1 text-foreground shrink-0">
          Nitrate<div className="w-1.5 h-1.5 rounded-full bg-brand-orange mt-1"></div>
        </Link>

        <nav aria-label="Navegação Principal" className="hidden md:flex items-center gap-7 ml-auto">
          {status === "authenticated" && (
            <Link href={`/u/${user.username}`} className="flex items-center gap-2.5 group">
              <Avatar name={user.name} username={user.username} size="sm" />
              <span className={`${navLink} group-hover:text-foreground`}>{user.username}</span>
            </Link>
          )}
          <Link href="/movies" className={navLink}>Filmes</Link>
          {status === "authenticated" ? (
            <Link href={`/u/${user.username}?tab=reviews`} className={navLink}>Reviews</Link>
          ) : (
            <Link href="/importar" className={navLink}>Importar</Link>
          )}
          <Link href="/movies" aria-label="Buscar filmes e pessoas" className="text-brand-slate hover:text-foreground transition-colors">
            <MagnifyingGlassIcon size={20} weight="bold" />
          </Link>
        </nav>

        <div className="flex gap-3 items-center ml-auto md:ml-0 min-h-9">
          {status === "authenticated" && (
            <>
              {/* registrar começa pela busca: escolher o filme */}
              <Link
                href="/movies"
                className="flex items-center gap-1.5 bg-brand-btn text-brand-btn-text px-3.5 py-2 rounded-md text-[13px] font-bold tracking-[0.08em] uppercase hover:bg-brand-btn/90 transition-colors"
              >
                <PlusIcon size={14} weight="bold" />
                Registrar
              </Link>
              <Link href={`/u/${user.username}`} className="md:hidden" aria-label="Meu perfil">
                <Avatar name={user.name} username={user.username} size="sm" />
              </Link>
              <button
                onClick={handleSignOut}
                aria-label="Sair"
                title="Sair"
                className="p-2 text-brand-slate/70 hover:text-brand-crimson transition-colors"
              >
                <SignOutIcon size={18} />
              </button>
            </>
          )}
          {status === "anonymous" && (
            <>
              <Link href="/sign-in" className={`hidden sm:block ${navLink}`}>
                Entrar
              </Link>
              <Link
                href="/sign-in"
                className="bg-brand-btn text-brand-btn-text px-3.5 py-2 rounded-md text-[13px] font-bold tracking-[0.08em] uppercase hover:bg-brand-btn/90 transition-colors"
              >
                Criar conta
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
