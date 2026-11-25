"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

/** "Criar conta" do footer: só para quem não entrou (e não pisca para quem entrou enquanto a sessão carrega) */
export function FooterSignUpLink() {
  const { status } = useAuth();
  if (status !== "anonymous") return null;
  return <Link href="/sign-in" className="hover:text-foreground transition-colors">Criar conta</Link>;
}
