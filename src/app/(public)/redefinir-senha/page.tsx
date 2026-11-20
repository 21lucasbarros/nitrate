"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowURightDownIcon, CircleNotchIcon, EyeIcon, EyeSlashIcon, LockKeyIcon } from "@phosphor-icons/react";

import { AuthShell, authButtonClass, authIconClass, authInputClass } from "@/app/components/auth-shell";
import { ApiError } from "@/lib/api-client";
import { clearToken } from "@/lib/auth-storage";
import { resetPasswordSchema, type ResetPasswordFormData } from "@/lib/schemas/auth-schemas";
import { resetPassword } from "@/lib/services/auth-service";

const linkClass = "font-medium text-brand-blue hover:text-brand-blue/80 transition-colors";

export default function ResetPasswordPage() {
  // useSearchParams precisa de Suspense para o build estático do Next
  return (
    <Suspense>
      <ResetPasswordFromUrl />
    </Suspense>
  );
}

/** /redefinir-senha?token=... (o link do e-mail) */
function ResetPasswordFromUrl() {
  const params = useSearchParams();
  // guardado no estado: a URL perde o token logo abaixo
  const [token] = useState(() => params.get("token"));

  // tira o token da barra de endereço e do histórico: ele é uma senha temporária
  useEffect(() => {
    if (token) window.history.replaceState(null, "", window.location.pathname);
  }, [token]);

  if (!token) {
    return (
      <AuthShell title="Link incompleto." subtitle="Abra o link exatamente como chegou no e-mail.">
        <p className="text-sm text-brand-slate/80 font-light">
          Se ele não funcionar, <Link href="/esqueci-senha" className={linkClass}>peça um novo link</Link>.
        </p>
      </AuthShell>
    );
  }
  return <ResetPasswordForm token={token} />;
}

function ResetPasswordForm({ token }: { token: string }) {
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<ResetPasswordFormData>({ resolver: zodResolver(resetPasswordSchema) });

  const onSubmit = async ({ password }: ResetPasswordFormData) => {
    setServerError(null);
    try {
      await resetPassword(token, password);
      // as sessões abertas caíram no backend; a deste navegador também
      clearToken();
      setDone(true);
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        setServerError(error.message);
        setExpired(error.message.includes("expirou"));
      } else if (error instanceof ApiError && error.status === 429) {
        setServerError("Muitas tentativas em pouco tempo. Espere um pouco e tente de novo.");
      } else {
        setServerError("Não foi possível trocar a senha agora. Tente novamente.");
      }
    }
  };

  if (done) {
    return (
      <AuthShell title="Senha alterada." subtitle="Use a nova senha para entrar. As sessões abertas em outros aparelhos foram encerradas.">
        <Link href="/sign-in" className={authButtonClass}>
          Entrar no diário
          <ArrowURightDownIcon size={18} weight="bold" />
        </Link>
      </AuthShell>
    );
  }

  const toggle = (
    <button
      type="button"
      onClick={() => setShowPassword((v) => !v)}
      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
      aria-pressed={showPassword}
      className="absolute inset-y-0 right-0 pr-4 flex items-center text-brand-slate/40 hover:text-foreground focus:outline-none focus-visible:text-brand-blue transition-colors"
    >
      {showPassword ? <EyeSlashIcon size={20} /> : <EyeIcon size={20} />}
    </button>
  );

  return (
    <AuthShell title="Crie uma nova senha." subtitle="Use pelo menos 8 caracteres.">
      {serverError && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
          {serverError}
          {expired && (
            <>
              {" "}
              <Link href="/esqueci-senha" className="underline underline-offset-4">Pedir novo link</Link>
            </>
          )}
        </div>
      )}
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
        {(["password", "confirmPassword"] as const).map((name) => (
          <div key={name}>
            <div className="group relative">
              <div className={authIconClass}>
                <LockKeyIcon size={20} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder={name === "password" ? "Nova senha" : "Confirme a nova senha"}
                className={`${authInputClass} pr-12`}
                {...form.register(name)}
              />
              {toggle}
            </div>
            {form.formState.errors[name] && (
              <p className="mt-1.5 text-xs text-red-500">{form.formState.errors[name].message}</p>
            )}
          </div>
        ))}
        <button type="submit" disabled={form.formState.isSubmitting} className={authButtonClass}>
          {form.formState.isSubmitting ? (
            <CircleNotchIcon size={20} className="animate-spin" />
          ) : (
            <>
              Salvar nova senha
              <ArrowURightDownIcon size={18} weight="bold" />
            </>
          )}
        </button>
      </form>
    </AuthShell>
  );
}
