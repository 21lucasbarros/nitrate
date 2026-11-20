import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Entre ou crie sua conta no Nitrate e comece o seu diário de cinema.",
  alternates: { canonical: "/sign-in" },
};

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return children;
}
