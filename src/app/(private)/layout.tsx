"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthToken } from "@/lib/hooks/use-auth-token";

export default function PrivateLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const pathname = usePathname();
  const token = useAuthToken();

  useEffect(() => {
    if (token === null) {
      router.replace(`/sign-in?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [token, pathname, router]);

  // não renderiza nada até confirmar que há sessão, evitando "piscar" conteúdo privado
  if (!token) return null;

  return <>{children}</>;
}
