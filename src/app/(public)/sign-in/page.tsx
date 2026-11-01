"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  EnvelopeSimpleIcon,
  LockKeyIcon,
  CircleNotchIcon,
  ArrowURightDownIcon,
  UserIcon,
  AtIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@phosphor-icons/react";

import {
  loginSchema,
  registerSchema,
  type LoginFormData,
  type RegisterFormData,
} from "@/lib/schemas/auth-schemas";
import { login, register as registerUser } from "@/lib/services/auth-service";
import { saveToken } from "@/lib/auth-storage";
import { ApiError } from "@/lib/api-client";
import { useUsernameAvailability } from "@/lib/hooks/use-username-availability";

// destino após o login, vindo do guard das rotas privadas (?redirect=/algum/caminho).
// só aceita caminhos internos para não virar um open redirect.
function getRedirectPath(): string {
  const redirect = new URLSearchParams(window.location.search).get("redirect");
  if (redirect?.startsWith("/") && !redirect.startsWith("//")) return redirect;
  return "/";
}

export default function SignInPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const usernameValue =
    useWatch({ control: registerForm.control, name: "username" }) ?? "";
  const usernameStatus = useUsernameAvailability(usernameValue);

  const isLoading = isLogin
    ? loginForm.formState.isSubmitting
    : registerForm.formState.isSubmitting;

  const toggleMode = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isLoading) return;

    setServerError(null);
    setIsAnimating(true);
    setTimeout(() => {
      setIsLogin(!isLogin);
      setIsAnimating(false);
    }, 300);
  };

  const onLoginSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      const response = await login(data);
      saveToken(response.token);
      router.push(getRedirectPath());
    } catch (error) {
      // o backend responde 403 (e não 401) para credenciais inválidas
      if (
        error instanceof ApiError &&
        (error.status === 401 || error.status === 403)
      ) {
        setServerError("Usuário, e-mail ou senha inválidos.");
      } else {
        setServerError("Não foi possível entrar. Tente novamente.");
      }
    }
  };

  const onRegisterSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    if (usernameStatus === "taken") {
      registerForm.setError("username", {
        message: "Esse nome de usuário já está em uso",
      });
      return;
    }
    try {
      const response = await registerUser({
        name: data.name,
        username: data.username,
        email: data.email,
        password: data.password,
      });
      saveToken(response.token);
      router.push(getRedirectPath());
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setServerError("Já existe uma conta com esse e-mail ou nome de usuário.");
      } else {
        setServerError("Não foi possível criar sua conta. Tente novamente.");
      }
    }
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground font-sans selection:bg-brand-blue selection:text-background">

      <div className="hidden lg:flex lg:w-1/2 relative bg-brand-charcoal overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-t from-brand-charcoal via-brand-charcoal/40 to-transparent"></div>

        <div className="absolute inset-0 p-12 xl:p-24 flex flex-col justify-between z-10">
          <div className="text-2xl font-bold tracking-tighter text-background uppercase flex items-center gap-1">
            Nitrate<div className="w-1.5 h-1.5 rounded-full bg-brand-orange mt-1"></div>
          </div>

          <div className="max-w-lg">
            <h2 className="text-4xl xl:text-5xl font-medium tracking-tight text-background leading-tight mb-6">
              O seu arquivo <br />
              <span className="italic font-light text-background/70">definitivo</span> do cinema.
            </h2>
            <p className="text-lg text-background/80 font-light leading-relaxed">
              Junte-se a uma comunidade focada em análises profundas, organização impecável e uma paixão inabalável pela sétima arte.
            </p>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 relative">

        <div className="lg:hidden absolute top-8 left-6 sm:left-12 text-xl font-bold tracking-tighter uppercase flex items-center gap-1">
          Nitrate<div className="w-1.5 h-1.5 rounded-full bg-brand-orange mt-1"></div>
        </div>

        <div className="w-full max-w-100">
          <div className="mb-10 text-center lg:text-left">
            <h1 className="text-3xl sm:text-4xl font-medium tracking-tight text-foreground mb-3">
              {isLogin ? "Bem-vindo de volta." : "Comece sua jornada."}
            </h1>
            <p className="text-brand-slate/70 font-light text-sm sm:text-base">
              {isLogin
                ? "Acesse seu diário e continue catalogando."
                : "Crie sua conta para registrar seus filmes favoritos."}
            </p>
          </div>

          <div className={`transition-opacity duration-300 ease-in-out ${isAnimating ? "opacity-0" : "opacity-100"}`}>
            {serverError && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
                {serverError}
              </div>
            )}

            {isLogin ? (
              <form
                key="login"
                onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                className="flex flex-col gap-5"
              >
                <div>
                  <div className="group relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-brand-slate/40 group-focus-within:text-brand-blue transition-colors">
                      <EnvelopeSimpleIcon size={20} />
                    </div>
                    <input
                      type="text"
                      autoComplete="username"
                      placeholder="E-mail ou nome de usuário"
                      className="w-full pl-12 pr-4 py-3.5 bg-transparent border border-brand-slate/20 rounded-xl text-foreground placeholder:text-brand-slate/40 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all"
                      {...loginForm.register("login")}
                    />
                  </div>
                  {loginForm.formState.errors.login && (
                    <p className="mt-1.5 text-xs text-red-500">
                      {loginForm.formState.errors.login.message}
                    </p>
                  )}
                </div>

                <div>
                  <div className="group relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-brand-slate/40 group-focus-within:text-brand-blue transition-colors">
                      <LockKeyIcon size={20} />
                    </div>
                    <input
                      type="password"
                      placeholder="Sua senha secreta"
                      className="w-full pl-12 pr-4 py-3.5 bg-transparent border border-brand-slate/20 rounded-xl text-foreground placeholder:text-brand-slate/40 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all"
                      {...loginForm.register("password")}
                    />
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="mt-1.5 text-xs text-red-500">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between mt-1 mb-2">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-brand-slate/30 text-brand-blue focus:ring-brand-blue focus:ring-offset-background transition-all bg-transparent checked:bg-brand-blue"
                    />
                    <span className="text-sm font-light text-brand-slate/80 group-hover:text-foreground transition-colors">
                      Lembrar de mim
                    </span>
                  </label>

                  <a href="#" className="text-sm font-medium text-brand-blue hover:text-brand-blue/80 transition-colors">
                    Esqueci minha senha
                  </a>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-brand-btn text-brand-btn-text py-4 rounded-full font-semibold hover:bg-brand-btn/90 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed mt-2 shadow-lg shadow-brand-btn/20"
                >
                  {isLoading ? (
                    <CircleNotchIcon size={20} className="animate-spin" />
                  ) : (
                    <>
                      Entrar no diário
                      <ArrowURightDownIcon size={18} weight="bold" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form
                key="register"
                onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                className="flex flex-col gap-5"
              >
                <div>
                  <div className="group relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-brand-slate/40 group-focus-within:text-brand-blue transition-colors">
                      <UserIcon size={20} />
                    </div>
                    <input
                      type="text"
                      placeholder="Seu nome"
                      className="w-full pl-12 pr-4 py-3.5 bg-transparent border border-brand-slate/20 rounded-xl text-foreground placeholder:text-brand-slate/40 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all"
                      {...registerForm.register("name")}
                    />
                  </div>
                  {registerForm.formState.errors.name && (
                    <p className="mt-1.5 text-xs text-red-500">
                      {registerForm.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <div className="group relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-brand-slate/40 group-focus-within:text-brand-blue transition-colors">
                      <AtIcon size={20} />
                    </div>
                    <input
                      type="text"
                      autoComplete="username"
                      autoCapitalize="none"
                      spellCheck={false}
                      placeholder="Seu nome de usuário"
                      className="w-full pl-12 pr-12 py-3.5 bg-transparent border border-brand-slate/20 rounded-xl text-foreground placeholder:text-brand-slate/40 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all"
                      {...registerForm.register("username")}
                    />
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      {usernameStatus === "checking" && (
                        <CircleNotchIcon size={18} className="animate-spin text-brand-slate/40" />
                      )}
                      {usernameStatus === "available" && (
                        <CheckCircleIcon size={18} weight="fill" className="text-green-500" />
                      )}
                      {usernameStatus === "taken" && (
                        <XCircleIcon size={18} weight="fill" className="text-red-500" />
                      )}
                    </div>
                  </div>
                  {registerForm.formState.errors.username ? (
                    <p className="mt-1.5 text-xs text-red-500">
                      {registerForm.formState.errors.username.message}
                    </p>
                  ) : usernameStatus === "taken" ? (
                    <p className="mt-1.5 text-xs text-red-500">
                      Esse nome de usuário já está em uso
                    </p>
                  ) : usernameStatus === "available" ? (
                    <p className="mt-1.5 text-xs text-green-500">
                      Nome de usuário disponível
                    </p>
                  ) : null}
                </div>

                <div>
                  <div className="group relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-brand-slate/40 group-focus-within:text-brand-blue transition-colors">
                      <EnvelopeSimpleIcon size={20} />
                    </div>
                    <input
                      type="email"
                      placeholder="Seu melhor e-mail"
                      className="w-full pl-12 pr-4 py-3.5 bg-transparent border border-brand-slate/20 rounded-xl text-foreground placeholder:text-brand-slate/40 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all"
                      {...registerForm.register("email")}
                    />
                  </div>
                  {registerForm.formState.errors.email && (
                    <p className="mt-1.5 text-xs text-red-500">
                      {registerForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <div className="group relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-brand-slate/40 group-focus-within:text-brand-blue transition-colors">
                      <LockKeyIcon size={20} />
                    </div>
                    <input
                      type="password"
                      placeholder="Sua senha secreta"
                      className="w-full pl-12 pr-4 py-3.5 bg-transparent border border-brand-slate/20 rounded-xl text-foreground placeholder:text-brand-slate/40 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all"
                      {...registerForm.register("password")}
                    />
                  </div>
                  {registerForm.formState.errors.password && (
                    <p className="mt-1.5 text-xs text-red-500">
                      {registerForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div>
                  <div className="group relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-brand-slate/40 group-focus-within:text-brand-blue transition-colors">
                      <LockKeyIcon size={20} />
                    </div>
                    <input
                      type="password"
                      placeholder="Confirme sua senha"
                      className="w-full pl-12 pr-4 py-3.5 bg-transparent border border-brand-slate/20 rounded-xl text-foreground placeholder:text-brand-slate/40 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all"
                      {...registerForm.register("confirmPassword")}
                    />
                  </div>
                  {registerForm.formState.errors.confirmPassword && (
                    <p className="mt-1.5 text-xs text-red-500">
                      {registerForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-brand-btn text-brand-btn-text py-4 rounded-full font-semibold hover:bg-brand-btn/90 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed mt-2 shadow-lg shadow-brand-btn/20"
                >
                  {isLoading ? (
                    <CircleNotchIcon size={20} className="animate-spin" />
                  ) : (
                    <>
                      Criar minha conta
                      <ArrowURightDownIcon size={18} weight="bold" />
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="mt-8 text-center">
              <p className="text-sm text-brand-slate/70 font-light">
                {isLogin ? "Não tem uma conta?" : "Já possui uma conta?"}
                <button
                  onClick={toggleMode}
                  className="ml-2 font-medium text-brand-orange hover:text-brand-orange/80 transition-colors focus:outline-none underline underline-offset-4 decoration-brand-orange/30 hover:decoration-brand-orange"
                >
                  {isLogin ? "Cadastre-se" : "Entrar"}
                </button>
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
