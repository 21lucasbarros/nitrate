import { ArrowRightIcon } from "@phosphor-icons/react";

export default function Hero() {
  return (
    <section className="pt-28 sm:pt-32 pb-20 px-6 md:px-12 xl:px-24 max-w-[1600px] mx-auto min-h-screen flex flex-col justify-center">
      <div className="max-w-4xl">
        <h1 className="text-6xl sm:text-7xl md:text-8xl xl:text-[10rem] leading-none sm:leading-[0.9] font-semibold tracking-tighter text-foreground">
          A sétima <br />
          <span className="italic font-light text-brand-slate/60">
            arte,
          </span>{" "}
          catalogada.
        </h1>
        <p className="mt-6 sm:mt-8 text-lg sm:text-xl md:text-2xl text-brand-slate/80 max-w-2xl font-light leading-relaxed">
          Nitrate é o espaço definitivo para quem estuda e vive o cinema.
          Esqueça algoritmos genéricos e redes sociais tóxicas. Documente seus
          filmes, descubra obras-primas e organize sua vida cinematográfica.
        </p>

        <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row gap-4">
          <button className="group flex items-center justify-center gap-3 bg-foreground text-background px-8 py-4 rounded-full text-base sm:text-lg font-medium hover:bg-brand-blue transition-colors w-full sm:w-auto">
            Começar gratuitamente
            <ArrowRightIcon
              size={20}
              weight="bold"
              className="group-hover:translate-x-1 transition-transform"
            />
          </button>
          <button className="flex items-center justify-center gap-3 bg-transparent border border-brand-slate/20 text-brand-slate px-8 py-4 rounded-full text-base sm:text-lg font-medium hover:border-brand-slate hover:text-foreground transition-all w-full sm:w-auto">
            Migrar seu histórico
          </button>
        </div>
      </div>
    </section>
  );
}
