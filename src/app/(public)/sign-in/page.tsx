"use client";

import { useState } from 'react';
import { EnvelopeSimpleIcon, LockKeyIcon, CircleNotchIcon, ArrowURightDownIcon, UserIcon } from '@phosphor-icons/react';

export default function SignInPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const toggleMode = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isLoading) return;

    setIsAnimating(true);
    setTimeout(() => {
      setIsLogin(!isLogin);
      setIsAnimating(false);
    }, 300);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
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
              O seu arquivo <br/>
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
              {isLogin ? 'Bem-vindo de volta.' : 'Comece sua jornada.'}
            </h1>
            <p className="text-brand-slate/70 font-light text-sm sm:text-base">
              {isLogin
                ? 'Acesse seu diário e continue catalogando.'
                : 'Crie sua conta para registrar seus filmes favoritos.'}
            </p>
          </div>

          <div className={`transition-opacity duration-300 ease-in-out ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">

              {!isLogin && (
                <div className="group relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-brand-slate/40 group-focus-within:text-brand-blue transition-colors">
                    <UserIcon size={20} />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Nome de usuário (@username)"
                    className="w-full pl-12 pr-4 py-3.5 bg-transparent border border-brand-slate/20 rounded-xl text-foreground placeholder:text-brand-slate/40 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all"
                  />
                </div>
              )}

              <div className="group relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-brand-slate/40 group-focus-within:text-brand-blue transition-colors">
                  <EnvelopeSimpleIcon size={20} />
                </div>
                <input
                  type="email"
                  required
                  placeholder="Seu melhor e-mail"
                  className="w-full pl-12 pr-4 py-3.5 bg-transparent border border-brand-slate/20 rounded-xl text-foreground placeholder:text-brand-slate/40 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all"
                />
              </div>

              <div className="group relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-brand-slate/40 group-focus-within:text-brand-blue transition-colors">
                  <LockKeyIcon size={20} />
                </div>
                <input
                  type="password"
                  required
                  placeholder="Sua senha secreta"
                  className="w-full pl-12 pr-4 py-3.5 bg-transparent border border-brand-slate/20 rounded-xl text-foreground placeholder:text-brand-slate/40 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all"
                />
              </div>

              {!isLogin && (
                <div className="group relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-brand-slate/40 group-focus-within:text-brand-blue transition-colors">
                    <LockKeyIcon size={20} />
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="Confirme sua senha"
                    className="w-full pl-12 pr-4 py-3.5 bg-transparent border border-brand-slate/20 rounded-xl text-foreground placeholder:text-brand-slate/40 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all"
                  />
                </div>
              )}

              {isLogin && (
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
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-brand-btn text-brand-btn-text py-4 rounded-full font-semibold hover:bg-brand-btn/90 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed mt-2 shadow-lg shadow-brand-btn/20"
              >
                {isLoading ? (
                  <CircleNotchIcon size={20} className="animate-spin" />
                ) : (
                  <>
                    {isLogin ? 'Entrar no diário' : 'Criar minha conta'}
                    <ArrowURightDownIcon size={18} weight="bold" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-brand-slate/70 font-light">
                {isLogin ? 'Não tem uma conta?' : 'Já possui uma conta?'}
                <button
                  onClick={toggleMode}
                  className="ml-2 font-medium text-brand-orange hover:text-brand-orange/80 transition-colors focus:outline-none underline underline-offset-4 decoration-brand-orange/30 hover:decoration-brand-orange"
                >
                  {isLogin ? 'Cadastre-se' : 'Entrar'}
                </button>
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
