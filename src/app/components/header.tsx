"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ListIcon, MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth-context";
import { useLogoEgg } from "@/lib/hooks/use-easter-eggs";
import { DreamBigLogo } from "./easter-eggs/dream-big-logo";
import { HeaderSearch } from "./header-search";
import { NotificationBell } from "./notification-bell";
import { UserMenu } from "./user-menu";

const navLink = "px-3 py-2 text-sm font-medium text-brand-slate hover:text-foreground transition-colors";

export default function Header() {
  const { status } = useAuth();
  const pathname = usePathname();
  // easter egg: a página de certos filmes troca a logo
  const logoEgg = useLogoEgg();

  return (
    <header className="fixed top-0 w-full z-50 bg-background/85 backdrop-blur-md border-b border-foreground/5">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 h-16 flex items-center gap-4 sm:gap-6">
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

        <nav aria-label="Navegação Principal" className="hidden md:flex items-center gap-1">
          <NavLink href="/movies" active={isActive(pathname, ["/movies", "/film", "/person"])}>Filmes</NavLink>
          <NavLink href="/series" active={isActive(pathname, ["/series"])}>Séries</NavLink>
          {status === "authenticated" ? (
            <NavLink href="/amigos" active={isActive(pathname, ["/amigos"])}>Amigos</NavLink>
          ) : (
            <NavLink href="/importar" active={isActive(pathname, ["/importar"])}>Importar</NavLink>
          )}
        </nav>

        <div className="flex gap-2 items-center ml-auto min-h-9">
          <div className="hidden lg:block">
            <HeaderSearch />
          </div>
          {status === "authenticated" && (
            <>
              <MobileSearchLink />
              <NotificationBell />
              <UserMenu />
            </>
          )}
          {status === "loading" && (
            // a sessão ainda está carregando (a API pode demorar a acordar): marca o lugar dos botões
            <span aria-hidden="true" className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-surface animate-pulse" />
              <span className="w-9 h-9 rounded-full bg-surface animate-pulse" />
            </span>
          )}
          {status === "anonymous" && (
            <>
              <MobileSearchLink />
              <MobileNav />
              <Link href="/sign-in" className={`hidden sm:block whitespace-nowrap ${navLink}`}>
                Entrar
              </Link>
              <Link
                href="/sign-in"
                className="whitespace-nowrap bg-brand-btn text-brand-btn-text px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-brand-btn/90 transition-colors"
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

function isActive(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** link da navegação: o da seção atual fica claro, com o ponto laranja da logo embaixo */
function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`relative px-3 py-2 text-sm font-medium transition-colors ${active ? "text-foreground" : "text-brand-slate hover:text-foreground"}`}
    >
      {children}
      {active && <span aria-hidden="true" className="absolute left-1/2 -translate-x-1/2 -bottom-0.5 w-1 h-1 rounded-full bg-brand-orange" />}
    </Link>
  );
}

/** menu do celular para quem não entrou: as seções do header, que somem abaixo do md */
function MobileNav() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // clicar fora ou Esc fecha
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const link = (href: string, label: string, prefixes: string[]) => (
    <Link
      href={href}
      onClick={() => setOpen(false)}
      className={`block mx-1.5 px-2.5 py-2 rounded text-sm hover:bg-surface-strong transition-colors ${isActive(pathname, prefixes) ? "text-foreground" : "text-foreground/80"}`}
    >
      {label}
    </Link>
  );

  return (
    <div ref={ref} className="relative md:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        aria-expanded={open}
        className="p-2 -mx-1 text-brand-slate hover:text-foreground transition-colors"
      >
        {open ? <XIcon size={20} /> : <ListIcon size={20} />}
      </button>
      {open && (
        <nav
          aria-label="Navegação Principal"
          className="absolute right-0 top-full mt-2 w-48 rounded-md bg-surface ring-1 ring-foreground/10 shadow-2xl shadow-black/60 py-1.5 animate-[modal-in_150ms_ease-out]"
        >
          {link("/movies", "Filmes", ["/movies", "/film", "/person"])}
          {link("/series", "Séries", ["/series"])}
          {link("/importar", "Importar do Letterboxd", ["/importar"])}
          <div className="sm:hidden">
            <div className="my-1.5 border-t border-foreground/5" />
            {link("/sign-in", "Entrar", ["/sign-in"])}
          </div>
        </nav>
      )}
    </div>
  );
}

/** lupa do celular (a busca do desktop fica no header, que esconde o campo no celular) */
function MobileSearchLink() {
  return (
    <Link href="/movies?buscar=1" aria-label="Buscar filmes, séries, pessoas e perfis" className="lg:hidden p-2 -mx-1 text-brand-slate hover:text-foreground transition-colors">
      <MagnifyingGlassIcon size={20} />
    </Link>
  );
}
