import type { Metadata } from "next";
import Image from "next/image";
import { ChatsCircleIcon, FlagIcon, HeartIcon, UserCircleIcon } from "@phosphor-icons/react/dist/ssr";
import {
  EmailLink,
  ExternalLink,
  InternalLink,
  LegalCallout,
  LegalList,
  LegalPage,
  LegalSection,
  legalSections,
  Strong,
} from "@/app/components/legal-page";
import { CONTACT_EMAIL, MIN_AGE, TMDB_NOTICE } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Termos de Uso",
  alternates: { canonical: "/termos" },
  description: "As regras para usar o Nitrate, publicar reviews e listas e o que fazemos com conteúdo que as viola.",
};

const { list, map: s } = legalSections([
  { id: "quem-pode-usar", title: "Quem pode usar" },
  { id: "conta", title: "Sua conta" },
  { id: "conteudo", title: "O que você publica" },
  { id: "denuncias", title: "Denúncias e moderação" },
  { id: "filmes", title: "Filmes, imagens e marcas" },
  { id: "servico", title: "O serviço" },
  { id: "mudancas", title: "Mudanças nestes termos" },
  { id: "lei", title: "Lei aplicável" },
  { id: "creditos", title: "Créditos" },
] as const);

const HIGHLIGHTS = [
  {
    icon: <UserCircleIcon size={22} weight="duotone" className="text-brand-blue" />,
    title: `${MIN_AGE} anos ou mais`,
    text: "Uma conta por pessoa. Menores de 18 com o conhecimento dos responsáveis.",
  },
  {
    icon: <HeartIcon size={22} weight="duotone" className="text-brand-orange" />,
    title: "O conteúdo é seu",
    text: "Suas reviews e listas continuam suas. Nós só as exibimos enquanto estiverem publicadas.",
  },
  {
    icon: <ChatsCircleIcon size={22} weight="duotone" className="text-brand-violet" />,
    title: "Respeito sempre",
    text: "Sem ódio, assédio ou conteúdo ilegal. Spoiler pode, desde que marcado.",
  },
  {
    icon: <FlagIcon size={22} weight="duotone" className="text-brand-crimson" />,
    title: "Viu algo errado?",
    text: "Denuncie por e-mail. Conteúdo que viola as regras é removido.",
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      current="/termos"
      eyebrow="Termos"
      title="Termos de Uso"
      intro={
        <p>
          As regras para usar o Nitrate. Ao criar uma conta ou usar o serviço, você concorda com elas e com a{" "}
          <InternalLink href="/privacidade">Política de Privacidade</InternalLink>. Se não concordar, não use o
          serviço.
        </p>
      }
      highlights={HIGHLIGHTS}
      sections={list}
    >
      <LegalSection {...s["quem-pode-usar"]}>
        <p>
          É preciso ter pelo menos <Strong>{MIN_AGE} anos</Strong> para criar uma conta. Quem tem entre {MIN_AGE} e 18
          anos deve usar o Nitrate com o conhecimento dos pais ou responsáveis.
        </p>
      </LegalSection>

      <LegalSection {...s.conta}>
        <LegalList>
          <li>Cada conta é de uma pessoa. Não se passe por outra pessoa, marca ou empresa.</li>
          <li>Você é responsável por manter sua senha em segredo e pelo que for feito com a sua conta.</li>
          <li>
            Você pode excluir a conta quando quiser, em <Strong>Configurações</Strong>. A exclusão é definitiva.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection {...s.conteudo}>
        <p>
          Reviews, comentários, listas, bio e foto continuam sendo <Strong>seus</Strong>. Ao publicar, você autoriza o
          Nitrate, de graça e sem exclusividade, a armazenar e exibir esse conteúdo no site e no app, inclusive nas
          imagens de compartilhamento que você mesmo gerar, enquanto ele estiver publicado. A autorização termina
          quando você apaga o conteúdo ou a conta.
        </p>
        <p>Você é responsável pelo que publica. Não é permitido publicar ou fazer:</p>
        <LegalList>
          <li>ofensas, ameaças, assédio ou perseguição contra qualquer pessoa;</li>
          <li>
            discurso de ódio ou discriminação por raça, cor, etnia, religião, origem, gênero, orientação sexual,
            deficiência ou qualquer outra condição;
          </li>
          <li>
            conteúdo sexual explícito, e qualquer conteúdo que sexualize crianças ou adolescentes (será denunciado às
            autoridades);
          </li>
          <li>dados pessoais de outras pessoas sem autorização, como endereço, telefone ou documentos;</li>
          <li>conteúdo que viole direitos autorais ou outros direitos de terceiros;</li>
          <li>spam, propaganda, golpes ou links maliciosos;</li>
          <li>
            acesso automatizado (robôs, scraping), tentativas de invadir contas ou o sistema, ou qualquer uso que
            prejudique o funcionamento do Nitrate;
          </li>
          <li>qualquer outra coisa ilegal.</li>
        </LegalList>
        <LegalCallout>
          <Strong>Spoilers são permitidos</Strong>, mas marque a review como contendo spoiler. Reviews sem a marcação
          podem ser removidas.
        </LegalCallout>
      </LegalSection>

      <LegalSection {...s.denuncias}>
        <p>
          Viu algo que viola estes termos ou seus direitos? Envie o link e o motivo para{" "}
          <EmailLink email={CONTACT_EMAIL} />.
        </p>
        <p>
          Analisamos as denúncias e podemos remover conteúdo, limitar ou suspender contas que descumpram estes termos,
          de forma proporcional à gravidade. Também removemos conteúdo quando houver ordem judicial, nos termos do Marco
          Civil da Internet (Lei 12.965/2014).
        </p>
      </LegalSection>

      <LegalSection {...s.filmes}>
        <p>
          As informações e imagens de filmes e pessoas (sinopses, elenco, pôsteres, fotos) vêm do{" "}
          <ExternalLink href="https://www.themoviedb.org">The Movie Database (TMDB)</ExternalLink>, e os dados de onde
          assistir vêm da JustWatch. Os filmes, pôsteres e marcas pertencem aos seus respectivos titulares e aparecem
          aqui apenas para identificar as obras.
        </p>
        <p>
          O Nitrate não tem nenhuma relação com o Letterboxd. A importação apenas lê o arquivo que você mesmo exporta de
          lá.
        </p>
      </LegalSection>

      <LegalSection {...s.servico}>
        <p>
          O Nitrate é gratuito e feito por uma pessoa independente. Ele é oferecido como está: pode ficar fora do ar, ter
          erros, mudar ou deixar de existir. Recomendamos baixar uma cópia dos seus dados de vez em quando, em{" "}
          <Strong>Configurações</Strong>.
        </p>
        <p>
          Na medida permitida pela lei, não respondemos por danos indiretos causados por indisponibilidade ou perda de
          dados, nem pelo conteúdo publicado por outros usuários.
        </p>
      </LegalSection>

      <LegalSection {...s.mudancas}>
        <p>
          Podemos atualizar estes termos. A data no topo da página mostra a última versão, e mudanças importantes serão
          avisadas no site. Continuar usando o Nitrate depois da mudança significa aceitar a nova versão.
        </p>
      </LegalSection>

      <LegalSection {...s.lei}>
        <p>
          Estes termos seguem as leis brasileiras. Eventuais disputas serão resolvidas no foro do seu domicílio, como
          prevê o Código de Defesa do Consumidor.
        </p>
      </LegalSection>

      <LegalSection {...s.creditos}>
        <div className="rounded-2xl bg-surface ring-1 ring-foreground/5 p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer" className="shrink-0 w-fit">
            <Image src="/tmdb-logo.svg" alt="The Movie Database (TMDB)" width={160} height={21} />
          </a>
          <p className="text-sm">{TMDB_NOTICE}</p>
        </div>
      </LegalSection>
    </LegalPage>
  );
}
