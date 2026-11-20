"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowURightDownIcon, CircleNotchIcon, EnvelopeSimpleIcon } from "@phosphor-icons/react";

import { AuthShell, authButtonClass, authIconClass, authInputClass } from "@/app/components/auth-shell";
import { ApiError } from "@/lib/api-client";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/schemas/auth-schemas";
import { requestPasswordReset } from "@/lib/services/auth-service";

export default function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<ForgotPasswordFormData>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async ({ email }: ForgotPasswordFormData) => {
    setServerError(null);
    try {
      await requestPasswordReset(email.trim());
      setSentTo(email.trim());
    } catch (error) {
      setServerError(
        error instanceof ApiError && error.status === 429
          ? "Muitos pedidos em pouco tempo. Espere um pouco e tente de novo."
          : "Não foi possível enviar agora. Tente novamente.",
      );
    }
  };

  if (sentTo) {
    return (
      <AuthShell title="Confira seu e-mail." subtitle="Se houver uma conta com esse endereço, o link já está a caminho.">
        <p className="text-sm text-brand-slate/80 font-light leading-relaxed">
          Enviamos para <strong className="font-medium text-foreground">{sentTo}</strong> um link para criar uma nova
          senha. Ele vale por 30 minutos. Não chegou? Olhe a caixa de spam ou{" "}
          <button
            type="button"
            onClick={() => setSentTo(null)}
            className="font-medium text-brand-blue hover:text-brand-blue/80 transition-colors"
          >
            peça de novo
          </button>
          .
        </p>
        <BackToSignIn />
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Esqueceu a senha?" subtitle="Informe o e-mail da sua conta e enviaremos um link para criar uma nova.">
      {serverError && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm">{serverError}</div>
      )}
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <div>
          <div className="group relative">
            <div className={authIconClass}>
              <EnvelopeSimpleIcon size={20} />
            </div>
            <input type="email" autoComplete="email" placeholder="Seu e-mail" className={`${authInputClass} pr-4`} {...form.register("email")} />
          </div>
          {form.formState.errors.email && (
            <p className="mt-1.5 text-xs text-red-500">{form.formState.errors.email.message}</p>
          )}
        </div>
        <button type="submit" disabled={form.formState.isSubmitting} className={authButtonClass}>
          {form.formState.isSubmitting ? (
            <CircleNotchIcon size={20} className="animate-spin" />
          ) : (
            <>
              Enviar link
              <ArrowURightDownIcon size={18} weight="bold" />
            </>
          )}
        </button>
      </form>
      <BackToSignIn />
    </AuthShell>
  );
}

function BackToSignIn() {
  return (
    <p className="mt-8 text-center text-sm text-brand-slate/70 font-light">
      Lembrou?
      <Link
        href="/sign-in"
        className="ml-2 font-medium text-brand-orange hover:text-brand-orange/80 transition-colors underline underline-offset-4 decoration-brand-orange/30 hover:decoration-brand-orange"
      >
        Entrar
      </Link>
    </p>
  );
}
