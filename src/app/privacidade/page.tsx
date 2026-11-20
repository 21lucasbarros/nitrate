import type { Metadata } from "next";
import { DownloadSimpleIcon, EyeIcon, LockKeyIcon, ProhibitIcon } from "@phosphor-icons/react/dist/ssr";
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
import { CONTACT_EMAIL, CONTROLLER_NAME, MIN_AGE } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Política de Privacidade · Nitrate",
  description: "Quais dados o Nitrate guarda, para quê, com quem compartilha e como exercer seus direitos.",
};

const { list, map: s } = legalSections([
  { id: "responsavel", title: "Quem é o responsável" },
  { id: "dados", title: "Quais dados guardamos" },
  { id: "publico", title: "O que fica público" },
  { id: "finalidades", title: "Para que usamos os dados" },
  { id: "compartilhamento", title: "Com quem compartilhamos" },
  { id: "retencao", title: "Por quanto tempo guardamos" },
  { id: "direitos", title: "Seus direitos" },
  { id: "seguranca", title: "Segurança" },
  { id: "menores", title: "Crianças e adolescentes" },
  { id: "mudancas", title: "Mudanças nesta política" },
] as const);

const HIGHLIGHTS = [
  {
    icon: <ProhibitIcon size={22} weight="duotone" className="text-brand-crimson" />,
    title: "Sem anúncios",
    text: "Não vendemos seus dados, não usamos analytics nem cookies de rastreamento.",
  },
  {
    icon: <EyeIcon size={22} weight="duotone" className="text-brand-blue" />,
    title: "Perfil público",
    text: "Reviews, notas e listas públicas ficam visíveis. Seu e-mail, nunca.",
  },
  {
    icon: <LockKeyIcon size={22} weight="duotone" className="text-brand-emerald" />,
    title: "Senha protegida",
    text: "Guardamos só um resumo criptográfico da senha, impossível de reverter.",
  },
  {
    icon: <DownloadSimpleIcon size={22} weight="duotone" className="text-brand-orange" />,
    title: "Você no controle",
    text: "Baixe todos os seus dados ou exclua a conta quando quiser, em Configurações.",
  },
];

// Cada item aqui precisa bater com o que o backend guarda de verdade (entities/ e AccountService).
// Ao criar um campo novo ou contratar outro serviço, atualize esta página e LEGAL_UPDATED_AT.
export default function PrivacyPage() {
  return (
    <LegalPage
      current="/privacidade"
      eyebrow="Privacidade"
      title="Política de Privacidade"
      intro={
        <p>
          O Nitrate é um diário de cinema. Aqui explicamos, sem juridiquês, quais dados pessoais guardamos, por que
          guardamos e o que você pode fazer com eles, conforme a Lei Geral de Proteção de Dados (LGPD).
        </p>
      }
      highlights={HIGHLIGHTS}
      sections={list}
    >
      <LegalSection {...s.responsavel}>
        <p>
          O controlador dos dados é <Strong>{CONTROLLER_NAME}</Strong>, responsável pelo Nitrate. Para qualquer
          assunto sobre privacidade, inclusive para falar com o encarregado pelo tratamento de dados, escreva para{" "}
          <EmailLink email={CONTACT_EMAIL} />.
        </p>
      </LegalSection>

      <LegalSection {...s.dados}>
        <LegalList>
          <li>
            <Strong>Cadastro:</Strong> nome, nome de usuário, e-mail e senha. A senha nunca é guardada como você a
            digitou, só um resumo criptográfico (bcrypt) que não permite recuperá-la. Também registramos a data em que
            você aceitou estes termos e confirmou a idade mínima.
          </li>
          <li>
            <Strong>Perfil, se você preencher:</Strong> bio, foto de perfil e seus usuários no X/Twitter e no
            Instagram.
          </li>
          <li>
            <Strong>Sua atividade:</Strong> filmes assistidos com datas, notas, curtidas e revisões, reviews (e se têm
            spoiler), watchlist, filmes e pessoas favoritas, listas, comentários, curtidas e listas salvas, quem você
            segue e quem segue você, e as notificações geradas por isso.
          </li>
          <li>
            <Strong>Importação do Letterboxd:</Strong> o arquivo .zip é aberto no seu próprio navegador. Ele não é
            enviado para nós: só os filmes, datas, notas, reviews e a watchlist que você escolher importar.
          </li>
          <li>
            <Strong>Dados técnicos:</Strong> o endereço IP é usado por pouco tempo, só em memória, para limitar
            tentativas de login e cadastro e evitar abuso. A empresa que hospeda o site pode registrar IPs em logs de
            acesso por um período curto.
          </li>
        </LegalList>
        <LegalCallout>
          Não usamos cookies de rastreamento, analytics ou anúncios. Para manter você conectado, guardamos um token de
          acesso no armazenamento local do navegador, e o rascunho de uma review fica no armazenamento da sessão até
          você publicar ou fechar a aba.
        </LegalCallout>
      </LegalSection>

      <LegalSection {...s.publico}>
        <p>
          O Nitrate é uma rede social. Qualquer pessoa, mesmo sem conta, pode ver seu <Strong>nome</Strong>,{" "}
          <Strong>nome de usuário</Strong>, <Strong>foto</Strong>, <Strong>bio</Strong>, links das redes sociais, os
          filmes que você registrou, suas notas e reviews, watchlist, favoritos, listas públicas, comentários e quem
          você segue ou quem segue você. Listas marcadas como privadas só aparecem para você.
        </p>
        <p>
          Seu <Strong>e-mail</Strong> e sua <Strong>senha</Strong> nunca são exibidos. A retrospectiva mensal também só
          é visível para você.
        </p>
      </LegalSection>

      <LegalSection {...s.finalidades}>
        <LegalList>
          <li>
            Criar e manter sua conta, mostrar seu perfil e sua atividade e fazer funcionar as partes sociais (seguir,
            curtir, comentar, notificações). Base legal: execução do contrato, isto é, os{" "}
            <InternalLink href="/termos">Termos de Uso</InternalLink> (LGPD, art. 7º, V).
          </li>
          <li>
            Enviar e-mails sobre a sua conta, como o link para redefinir a senha quando você pedir. Não enviamos
            newsletter nem propaganda. Base legal: execução do contrato (art. 7º, V).
          </li>
          <li>
            Recomendar filmes e sugerir pessoas com gosto parecido, a partir das notas e curtidas registradas. Isso
            acontece automaticamente, dentro do próprio Nitrate, e não gera nenhuma decisão com efeito jurídico sobre
            você. Base legal: legítimo interesse (art. 7º, IX).
          </li>
          <li>Proteger o serviço contra invasões, força bruta e abuso. Base legal: legítimo interesse (art. 7º, IX).</li>
          <li>Cumprir obrigações legais ou ordens judiciais, quando houver (art. 7º, II e VI).</li>
        </LegalList>
        <p>Não vendemos nem alugamos seus dados, e não os usamos para publicidade.</p>
      </LegalSection>

      <LegalSection {...s.compartilhamento}>
        <p>Só com os serviços necessários para o Nitrate funcionar:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { name: "Neon", role: "Banco de dados", where: "AWS em São Paulo" },
            { name: "Vercel", role: "Hospedagem do site e da API", where: "Empresa nos EUA" },
            { name: "Resend", role: "E-mails da conta (nome e e-mail, só ao enviar)", where: "Empresa nos EUA" },
            { name: "TMDB", role: "Dados e imagens de filmes (não recebe seus dados de conta)", where: "Empresa nos EUA" },
          ].map((p) => (
            <div key={p.name} className="rounded-xl bg-surface ring-1 ring-foreground/5 px-4 py-3.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-medium text-foreground">{p.name}</span>
                <span className="text-[11px] font-mono uppercase tracking-wider text-brand-slate/50">{p.where}</span>
              </div>
              <p className="mt-1 text-sm">{p.role}</p>
            </div>
          ))}
        </div>
        <p>
          Quando dados são processados fora do Brasil, isso acontece com provedores que adotam medidas de segurança
          compatíveis com a LGPD (art. 33). Também podemos fornecer dados a autoridades quando a lei ou uma ordem
          judicial exigir.
        </p>
      </LegalSection>

      <LegalSection {...s.retencao}>
        <p>
          Enquanto sua conta existir. Ao excluir a conta, apagamos na hora o perfil, a foto, o diário, as reviews, a
          watchlist, os favoritos, as listas, os comentários, as curtidas, os seguidores, as notificações e os pedidos
          de redefinição de senha. Os links de redefinição expiram em 30 minutos.
        </p>
        <p>
          Cópias de segurança automáticas do provedor do banco podem manter esses dados por alguns dias, até serem
          substituídas. Se a lei exigir guardar algum registro por mais tempo, guardaremos só o necessário.
        </p>
      </LegalSection>

      <LegalSection {...s.direitos}>
        <p>Pela LGPD (art. 18), você pode:</p>
        <LegalList>
          <li>confirmar se tratamos seus dados e ter acesso a eles;</li>
          <li>corrigir dados incompletos ou desatualizados (a maior parte você edita direto no perfil);</li>
          <li>
            levar seus dados para outro serviço: em <Strong>Configurações</Strong> você baixa tudo em um arquivo;
          </li>
          <li>
            excluir sua conta e seus dados: também em <Strong>Configurações</Strong>, a qualquer momento;
          </li>
          <li>saber com quem compartilhamos seus dados;</li>
          <li>se opor a um tratamento feito com base no legítimo interesse;</li>
          <li>
            reclamar à Autoridade Nacional de Proteção de Dados, em{" "}
            <ExternalLink href="https://www.gov.br/anpd">gov.br/anpd</ExternalLink>.
          </li>
        </LegalList>
        <p>
          Para qualquer outro pedido, escreva para <EmailLink email={CONTACT_EMAIL} />. Respondemos em até 15 dias.
        </p>
      </LegalSection>

      <LegalSection {...s.seguranca}>
        <p>
          As senhas são guardadas com bcrypt, a comunicação é criptografada (HTTPS), há limite de tentativas no login e
          bloqueio temporário após senhas erradas. Nenhum sistema é totalmente seguro: se acontecer um incidente que
          possa causar risco ou dano relevante a você, avisaremos você e a ANPD, como manda a lei.
        </p>
      </LegalSection>

      <LegalSection {...s.menores}>
        <p>
          O Nitrate não é destinado a menores de {MIN_AGE} anos, e o cadastro pede a confirmação dessa idade. Se
          soubermos que uma conta pertence a alguém mais novo, ela será excluída.
        </p>
        <p>
          Adolescentes entre {MIN_AGE} e 18 anos devem usar o Nitrate com o conhecimento dos pais ou responsáveis, que
          podem pedir a exclusão da conta pelo e-mail acima.
        </p>
      </LegalSection>

      <LegalSection {...s.mudancas}>
        <p>
          Quando esta política mudar, a data no topo da página será atualizada. Se a mudança for importante, avisaremos
          no próprio site.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
