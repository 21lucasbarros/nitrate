"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LockSimpleIcon } from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth-context";

/**
 * Quem está vendo: o dono do diário, outra pessoa logada, ou ainda carregando.
 * Sem login, manda para o login e volta para cá depois.
 */
export function useOwnerAccess(username: string): "loading" | "owner" | "other" {
  const { status, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "anonymous") router.replace(`/sign-in?redirect=${encodeURIComponent(pathname)}`);
  }, [status, router, pathname]);

  if (status !== "authenticated") return "loading";
  return user.username === username ? "owner" : "other";
}

export function PrivateNotice({ username }: { username: string }) {
  const { user } = useAuth();
  return (
    <main className="pt-48 pb-24 px-6 flex flex-col items-center text-center">
      <LockSimpleIcon size={36} className="text-brand-orange" />
      <h1 className="mt-4 text-3xl font-medium tracking-tight">Esta retrospectiva é privada.</h1>
      <p className="mt-3 text-brand-slate/60 max-w-md">
        Só @{username} pode ver a própria retrospectiva. Se essa pessoa compartilhar, ela aparece como imagem nos Stories.
      </p>
      {user && (
        <Link href={`/u/${user.username}/retrospectiva`} className="mt-6 font-medium text-brand-blue hover:underline">
          Ver a minha retrospectiva
        </Link>
      )}
    </main>
  );
}
