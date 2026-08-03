import { BookmarkSimpleIcon, BookOpenIcon, ChartBarIcon, CompassIcon, FingerprintIcon, ListNumbersIcon, PenNibIcon, StarIcon, TargetIcon, UsersIcon } from "@phosphor-icons/react";
import { FilmSlateIcon } from "@phosphor-icons/react/dist/ssr";

export default function Features() {
  return (
    <section className="py-24 sm:py-32 px-6 md:px-12 xl:px-24 max-w-[1600px] mx-auto border-t border-brand-slate/10">
      <div className="mb-24">
        <span className="text-xs font-bold tracking-[0.2em] uppercase text-brand-blue">
          Plataforma Completa
        </span>
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight mt-4 max-w-3xl text-foreground">
          Tudo o que você espera.
          <br /> E o que nem sabia que precisava.
        </h2>
        <p className="mt-6 text-lg sm:text-xl text-brand-slate/70 font-light max-w-2xl">
          Uma experiência construída do zero para corrigir as falhas das redes
          convencionais. O equilíbrio perfeito entre um arquivo pessoal elegante
          e ferramentas inteligentes de descoberta.
        </p>
      </div>

      {/* coisas do nitrate */}
      <div className="flex flex-col gap-24">
        <div>
          <div className="flex items-center gap-4 mb-12 border-b border-brand-slate/10 pb-6">
            <h3 className="text-2xl sm:text-3xl font-medium text-foreground">
              A Inteligência Nitrate
            </h3>
            <span className="px-3 py-1 bg-brand-blue/10 text-brand-blue text-[10px] sm:text-xs font-bold tracking-widest uppercase rounded-full">
              Exclusivos
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
            <div className="group pl-6 border-l-2 border-transparent hover:border-brand-blue transition-colors duration-300">
              <div className="flex items-center gap-4 mb-3">
                <FilmSlateIcon
                  size={32}
                  weight="duotone"
                  className="text-brand-blue group-hover:scale-110 transition-transform origin-left shrink-0"
                />
                <h4 className="text-2xl font-medium text-foreground">
                  What Should I Watch?
                </h4>
              </div>
              <p className="text-brand-slate/70 leading-relaxed font-light text-lg">
                Fim da paralisia na hora de escolher. O Nitrate sorteia
                aleatoriamente um título da sua própria watchlist. Como todos os
                filmes dali já são obras do seu interesse, é o empurrão perfeito
                para finalmente dar o play.
              </p>
            </div>

            <div className="group pl-6 border-l-2 border-transparent hover:border-brand-violet transition-colors duration-300">
              <div className="flex items-center gap-4 mb-3">
                <FingerprintIcon
                  size={32}
                  weight="duotone"
                  className="text-brand-violet group-hover:scale-110 transition-transform origin-left shrink-0"
                />
                <h4 className="text-2xl font-medium text-foreground">
                  Algoritmo Personalizado
                </h4>
              </div>
              <p className="text-brand-slate/70 leading-relaxed font-light text-lg">
                Recomendações inteligentes, calculadas exclusivamente pelos
                filmes que você assistiu recentemente. Um sistema de sugestões
                que evolui junto com o seu momento e as suas obsessões
                cinematográficas atuais.
              </p>
            </div>

            <div className="group pl-6 border-l-2 border-transparent hover:border-brand-orange transition-colors duration-300">
              <div className="flex items-center gap-4 mb-3">
                <div className="relative shrink-0 text-brand-orange group-hover:scale-110 transition-transform origin-left">
                  <TargetIcon size={32} weight="duotone" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-brand-orange rounded-full border-2 border-background"></span>
                </div>
                <h4 className="text-2xl font-medium text-foreground">
                  Radar de Estreias
                </h4>
              </div>
              <p className="text-brand-slate/70 leading-relaxed font-light text-lg">
                Nunca mais perca um lançamento. Adicione filmes em produção à
                sua watchlist e o Nitrate avisará você automaticamente assim que
                eles chegarem aos cinemas ou às plataformas de streaming.
              </p>
            </div>

            <div className="group pl-6 border-l-2 border-transparent hover:border-brand-teal transition-colors duration-300">
              <div className="flex items-center gap-4 mb-3">
                <ChartBarIcon
                  size={32}
                  weight="duotone"
                  className="text-brand-teal group-hover:scale-110 transition-transform origin-left shrink-0"
                />
                <h4 className="text-2xl font-medium text-foreground">
                  Retrospectiva Mensal
                </h4>
              </div>
              <p className="text-brand-slate/70 leading-relaxed font-light text-lg">
                Celebre sua jornada. Ao fim de cada mês, gere e compartilhe um
                dossiê imersivo com seus dados:{" "}
                <strong className="font-medium text-foreground">
                  número de filmes assistidos, diretores em destaque, gêneros
                  mais frequentes, atores recorrentes e as suas obras favoritas
                </strong>{" "}
                baseadas nas suas notas.
              </p>
            </div>
          </div>
        </div>

        {/* coisas padrao mesmo */}
        <div>
          <div className="mb-10 border-b border-brand-slate/10 pb-6">
            <h3 className="text-xl sm:text-2xl font-medium text-foreground">
              O Essencial do Cinéfilo
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-12">
            <div className="group">
              <div className="flex items-center gap-3 mb-4">
                <StarIcon
                  size={24}
                  weight="fill"
                  className="text-brand-orange group-hover:scale-110 transition-transform shrink-0"
                />
                <h4 className="text-lg font-medium text-foreground">
                  Avalie filmes
                </h4>
              </div>
              <p className="text-brand-slate/70 font-light leading-relaxed text-sm">
                Notas de meio ponto, com uma escala precisa pensada para quem
                realmente presta atenção nos detalhes.
              </p>
            </div>

            <div className="group">
              <div className="flex items-center gap-3 mb-4">
                <PenNibIcon
                  size={24}
                  weight="regular"
                  className="text-brand-charcoal group-hover:scale-110 transition-transform shrink-0"
                />
                <h4 className="text-lg font-medium text-foreground">
                  Escreva reviews
                </h4>
              </div>
              <p className="text-brand-slate/70 font-light leading-relaxed text-sm">
                Um espaço limpo e livre de limites para registrar as suas
                interpretações mais profundas sobre as obras.
              </p>
            </div>

            <div className="group">
              <div className="flex items-center gap-3 mb-4">
                <BookOpenIcon
                  size={24}
                  weight="regular"
                  className="text-brand-emerald group-hover:scale-110 transition-transform shrink-0"
                />
                <h4 className="text-lg font-medium text-foreground">
                  Registre o diário
                </h4>
              </div>
              <p className="text-brand-slate/70 font-light leading-relaxed text-sm">
                Transforme cada sessão em uma entrada histórica com data e
                contexto, documentando sua jornada.
              </p>
            </div>

            <div className="group">
              <div className="flex items-center gap-3 mb-4">
                <BookmarkSimpleIcon
                  size={24}
                  weight="regular"
                  className="text-brand-crimson group-hover:scale-110 transition-transform shrink-0"
                />
                <h4 className="text-lg font-medium text-foreground">
                  Sua watchlist
                </h4>
              </div>
              <p className="text-brand-slate/70 font-light leading-relaxed text-sm">
                Salve títulos futuros e tenha um ecossistema organizado para
                acompanhar seus próximos filmes.
              </p>
            </div>

            <div className="group">
              <div className="flex items-center gap-3 mb-4">
                <ListNumbersIcon
                  size={24}
                  weight="regular"
                  className="text-brand-slate group-hover:scale-110 transition-transform shrink-0"
                />
                <h4 className="text-lg font-medium text-foreground">
                  Crie listas
                </h4>
              </div>
              <p className="text-brand-slate/70 font-light leading-relaxed text-sm">
                Organize maratonas, retrospectivas de diretores e coleções que
                podem ser públicas ou privadas.
              </p>
            </div>

            <div className="group">
              <div className="flex items-center gap-3 mb-4">
                <CompassIcon
                  size={24}
                  weight="regular"
                  className="text-brand-teal group-hover:scale-110 transition-transform shrink-0"
                />
                <h4 className="text-lg font-medium text-foreground">
                  Descubra obras
                </h4>
              </div>
              <p className="text-brand-slate/70 font-light leading-relaxed text-sm">
                Navegue por filmes baseados no histórico e na apurada curadoria
                da própria comunidade.
              </p>
            </div>

            <div className="group sm:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <UsersIcon
                  size={24}
                  weight="regular"
                  className="text-brand-blue group-hover:scale-110 transition-transform shrink-0"
                />
                <h4 className="text-lg font-medium text-foreground">
                  Explore perfis
                </h4>
              </div>
              <p className="text-brand-slate/70 font-light leading-relaxed text-sm">
                Veja o que outros cinéfilos estão assistindo e escrevendo.
                Encontre pessoas com gostos semelhantes e crie conexões genuínas
                em torno da arte.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
