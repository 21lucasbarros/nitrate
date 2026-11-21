"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CaretDownIcon,
  DownloadSimpleIcon,
  FilmReelIcon,
  FilmStripIcon,
  GearSixIcon,
  ShieldStarIcon,
  SignOutIcon,
  SparkleIcon,
  TelevisionSimpleIcon,
  UserIcon,
  UsersIcon,
} from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth-context";
import { Avatar } from "./ui/avatar";

const item = "flex items-center gap-3 mx-1.5 px-2.5 py-2 rounded text-sm text-foreground/85 hover:bg-surface-strong hover:text-foreground transition-colors";

/**
 * Avatar do header (com a setinha, para mostrar que abre algo): menu com o perfil, as configurações,
 * o admin e o sair. No celular, onde a navegação do header some, o menu também leva às seções.
 */
export function UserMenu() {
  const { status, user, signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  if (status !== "authenticated") return null;

  const close = () => setOpen(false);
  const handleSignOut = () => {
    close();
    signOut();
    router.push("/");
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Menu da conta"
        aria-haspopup="menu"
        aria-expanded={open}
        className="group flex items-center gap-1 p-0.5 -m-0.5 rounded-full"
      >
        <span className={`flex rounded-full ring-2 transition-shadow ${open ? "ring-brand-orange/70" : "ring-transparent group-hover:ring-brand-orange/60"}`}>
          <Avatar name={user.name} username={user.username} avatar={user.avatar} size="sm" />
        </span>
        <CaretDownIcon
          size={12}
          weight="bold"
          className={`text-brand-slate group-hover:text-foreground transition-transform ${open ? "rotate-180 text-foreground" : ""}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-[min(15rem,calc(100vw-2rem))] max-h-[calc(100dvh-5rem)] overflow-y-auto rounded-md bg-surface ring-1 ring-foreground/10 shadow-2xl shadow-black/60 py-1.5 animate-[modal-in_150ms_ease-out]"
        >
          <Link href={`/u/${user.username}`} onClick={close} role="menuitem" className="flex items-center gap-3 mx-1.5 px-2.5 py-2 rounded hover:bg-surface-strong transition-colors">
            <Avatar name={user.name} username={user.username} avatar={user.avatar} size="sm" />
            <span className="min-w-0">
              <span className="block text-sm font-medium truncate">{user.name}</span>
              <span className="block text-xs text-brand-slate truncate">@{user.username}</span>
            </span>
          </Link>

          {/* as seções do header, que no celular não aparecem */}
          <div className="md:hidden">
            <div className="my-1.5 border-t border-foreground/5" />
            <Link href="/movies" onClick={close} role="menuitem" className={item}>
              <FilmReelIcon size={16} className="text-brand-slate" /> Filmes
            </Link>
            <Link href="/series" onClick={close} role="menuitem" className={item}>
              <TelevisionSimpleIcon size={16} className="text-brand-slate" /> Séries
            </Link>
            <Link href="/amigos" onClick={close} role="menuitem" className={item}>
              <UsersIcon size={16} className="text-brand-slate" /> Amigos
            </Link>
          </div>

          <div className="my-1.5 border-t border-foreground/5" />

          <Link href={`/u/${user.username}`} onClick={close} role="menuitem" className={item}>
            <UserIcon size={16} className="text-brand-slate" /> Meu perfil
          </Link>
          <Link href={`/u/${user.username}?tab=filmes`} onClick={close} role="menuitem" className={item}>
            <FilmStripIcon size={16} className="text-brand-slate" /> Meus filmes
          </Link>
          <Link href={`/u/${user.username}/retrospectiva`} onClick={close} role="menuitem" className={item}>
            <SparkleIcon size={16} weight="fill" className="text-brand-orange" /> Retrospectiva
          </Link>
          <Link href="/importar" onClick={close} role="menuitem" className={item}>
            <DownloadSimpleIcon size={16} className="text-brand-slate" /> Importar do Letterboxd
          </Link>

          <div className="my-1.5 border-t border-foreground/5" />

          <Link href="/configuracoes" onClick={close} role="menuitem" className={item}>
            <GearSixIcon size={16} className="text-brand-slate" /> Configurações
          </Link>
          {user.admin && (
            <Link href="/admin" onClick={close} role="menuitem" className={item}>
              <ShieldStarIcon size={16} className="text-brand-slate" /> Painel de admin
            </Link>
          )}
          <button type="button" onClick={handleSignOut} role="menuitem" className={`${item} w-[calc(100%-0.75rem)] hover:text-brand-crimson`}>
            <SignOutIcon size={16} className="text-brand-slate" /> Sair
          </button>
        </div>
      )}
    </div>
  );
}
