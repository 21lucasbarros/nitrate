import { Fragment } from "react";
import { ArrowRightIcon } from "@phosphor-icons/react";

const STATS = [
  { value: 52400, label: "Cinéfilos ativos" },
  { value: 894000, label: "Críticas publicadas" },
  { value: 1320000, label: "Filmes catalogados" },
];

const POSTER_STRIP = [
  "https://media.themoviedb.org/t/p/w600_and_h900_face/Ae0pbv4E6YfqfN3UjKWIfQSzP9v.jpg",
  "https://media.themoviedb.org/t/p/w600_and_h900_face/lzyh1lsD4Qaid6bG5zk57Y3bEM.jpg",
  "https://media.themoviedb.org/t/p/w600_and_h900_face/y5ibL0vFnzsRiIHosw0WOfHtIj1.jpg",
  "https://media.themoviedb.org/t/p/w600_and_h900_face/rFHzJrkO1kNIezb6rFog5oCJUEn.jpg",
  "https://media.themoviedb.org/t/p/w600_and_h900_face/is1U9n0e9ofg50U1T7p2WZuIwiO.jpg",
  "https://media.themoviedb.org/t/p/w600_and_h900_face/zNAw7jK8bwCK56rIW676pdgkwhd.jpg",
  "https://media.themoviedb.org/t/p/w600_and_h900_face/AvMietG6xuobpSSdmVnKuTjv4bL.jpg"
];

export default function CTA() {
  return (
    <section className="relative overflow-hidden bg-brand-slate text-background py-28 sm:py-36 px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(201,106,58,0.16),transparent_70%)]" />

      <div className="hidden lg:flex absolute left-8 top-16 bottom-16 flex-col justify-between items-center">
        {[...Array(10)].map((_, i) => (
          <span key={i} className="w-1.25 h-1.25 rounded-full bg-background/10" />
        ))}
      </div>
      <div className="hidden lg:flex absolute right-8 top-16 bottom-16 flex-col justify-between items-center">
        {[...Array(10)].map((_, i) => (
          <span key={i} className="w-1.25 h-1.25 rounded-full bg-background/10" />
        ))}
      </div>

      <div className="relative max-w-3xl mx-auto text-center">
        <span className="inline-block text-xs font-mono uppercase tracking-[0.25em] text-brand-orange mb-6">
          Fim de sessão
        </span>

        <h2 className="text-4xl sm:text-6xl md:text-7xl font-medium tracking-tighter leading-[1.05] mb-6 sm:mb-8">
          O filme acabou.
          <br />
          Sua crítica, não.
        </h2>

        <p className="text-lg sm:text-xl text-background/65 font-light max-w-xl mx-auto mb-10 sm:mb-12 leading-relaxed">
          Catalogue cada sessão com precisão — meias estrelas incluídas —,
          monte seu diário e discuta direção, roteiro e fotografia com gente
          que também assistiu até os créditos finais. Sem curtidas, sem
          seguidores, só cinema.
        </p>

        <div className="flex flex-col items-center gap-4 mb-14 sm:mb-16">
          <button className="group relative inline-flex items-center gap-3 bg-brand-btn text-brand-btn-text px-9 sm:px-12 py-5 sm:py-6 rounded-full text-base sm:text-lg font-semibold shadow-none hover:shadow-[0_0_40px_10px_rgba(201,106,58,0.35)] hover:scale-[1.03] active:scale-[0.98] transition-all duration-300">
            Criar minha conta gratuitamente
            <ArrowRightIcon size={20} weight="bold" className="group-hover:translate-x-1 transition-transform" />
          </button>
          <span className="text-xs text-background/40 font-mono uppercase tracking-wider">
            Grátis · sem cartão · migração em 3 minutos
          </span>
        </div>

        <div className="flex items-center justify-center gap-6 sm:gap-10 flex-wrap">
          {STATS.map((stat, i) => (
            <Fragment key={stat.label}>
              {i > 0 && (
                <span className="hidden sm:block w-px h-8 bg-background/10" aria-hidden="true" />
              )}
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-mono font-medium text-background/90">
                  {stat.value.toLocaleString("pt-BR")}
                </div>
                <div className="text-[11px] uppercase tracking-wider text-background/40 mt-1">
                  {stat.label}
                </div>
              </div>
            </Fragment>
          ))}
        </div>
      </div>

      <div className="relative mt-20 sm:mt-24 -mx-6 overflow-hidden mask-[linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <div className="flex gap-4 w-max animate-[marquee_45s_linear_infinite] motion-reduce:animate-none">
          {[...POSTER_STRIP, ...POSTER_STRIP].map((url, i) => (
            <div
              key={i}
              className="w-16 sm:w-20 aspect-2/3 rounded-sm overflow-hidden shrink-0 opacity-30 grayscale"
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
