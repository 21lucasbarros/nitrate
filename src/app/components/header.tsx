"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { GearSixIcon, PlusIcon, SignOutIcon } from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth-context";
import { useLogoEgg } from "@/lib/hooks/use-easter-eggs";
import { DreamBigLogo } from "./easter-eggs/dream-big-logo";
import { HeaderSearch } from "./header-search";
import { NotificationBell } from "./notification-bell";
import { Avatar } from "./ui/avatar";

const navLink = "px-3 py-2 text-sm font-medium text-brand-slate hover:text-foreground transition-colors";

export default function Header() {
  const { status, user, signOut } = useAuth();
  const router = useRouter();
  // easter egg: a página de certos filmes troca a logo
  const logoEgg = useLogoEgg();

  const handleSignOut = () => {
    signOut();
    router.push("/");
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-background/85 backdrop-blur-md border-b border-foreground/5">
      <div className="max-w-[1100px] mx-auto px-6 h-16 flex items-center gap-6">
        <Link
          href="/"
          aria-label="Nitrate"
          className="text-xl font-bold tracking-tighter uppercase flex items-center gap-1 text-foreground shrink-0"
        >
          {logoEgg === "dream-big" ? (
            <DreamBigLogo />
          ) : (
            <>
              Nitrate<div className="w-1.5 h-1.5 rounded-full bg-brand-orange mt-1"></div>
            </>
          )}
        </Link>

        <nav aria-label="Navegação Principal" className="hidden md:flex items-center gap-1 ml-auto">
          <Link href="/movies" className={navLink}>Filmes</Link>
          {status === "authenticated" ? (
            <>
              <Link href={`/u/${user.username}?tab=diario`} className={navLink}>Diário</Link>
              <Link href={`/u/${user.username}?tab=rede`} className={navLink}>Amigos</Link>
            </>
          ) : (
            <Link href="/importar" className={navLink}>Importar</Link>
          )}
          <HeaderSearch />
        </nav>

        <div className="flex gap-3 items-center ml-auto md:ml-0 min-h-9">
          {status === "authenticated" && (
            <>
              {/* registrar começa pela busca: escolher o filme */}
              <Link
                href="/movies"
                className="flex items-center gap-1.5 bg-brand-btn text-brand-btn-text px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-brand-btn/90 transition-colors"
              >
                <PlusIcon size={14} weight="bold" />
                Registrar
              </Link>
              <NotificationBell />
              <Link href={`/u/${user.username}`} aria-label="Meu perfil" title={`@${user.username}`} className="rounded-full ring-2 ring-transparent hover:ring-brand-orange/60 transition-shadow">
                <Avatar name={user.name} username={user.username} size="sm" />
              </Link>
              <Link
                href="/configuracoes"
                aria-label="Configurações"
                title="Configurações"
                className="hidden sm:block p-2 -mr-2 text-brand-slate/70 hover:text-foreground transition-colors"
              >
                <GearSixIcon size={18} />
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
                className="bg-brand-btn text-brand-btn-text px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-brand-btn/90 transition-colors"
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
