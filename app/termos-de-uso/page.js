import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { buildPageMetadata } from '@/lib/site';

export const metadata = buildPageMetadata({
  title: 'Termos de Uso',
  description:
    'Termos de Uso do site da H Soares Seguros, incluindo funcionamento das páginas de produto, formulários e redirecionamentos.',
  path: '/termos-de-uso'
});

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main className="content-page legal-page">
        <section className="section page-hero">
          <div className="container page-hero-shell">
            <p className="eyebrow">Termos</p>
            <h1>Termos de Uso</h1>
            <p className="subhead">
              Estes termos descrevem as condições gerais de uso do site institucional e de atendimento da H Soares Seguros.
            </p>
          </div>
        </section>

        <section className="section">
          <div className="container legal-shell">
            <h2>1. Natureza do site</h2>
            <p>
              O site tem caráter institucional e informativo. Ele apresenta produtos, conteúdos explicativos, formulários
              de contato e, em determinados casos, direciona o visitante para ambientes oficiais de seguradoras ou
              plataformas parceiras para continuidade da contratação.
            </p>

            <h2>2. Informações e elegibilidade</h2>
            <p>
              A elegibilidade, regras, coberturas, valores e condições finais de cada produto dependem da seguradora,
              do perfil do cliente e da análise aplicável a cada operação.
            </p>

            <h2>3. Responsabilidade sobre dados enviados</h2>
            <p>
              O usuário é responsável pela veracidade dos dados enviados nos formulários, inclusive documentos e
              informações de terceiros quando houver autorização para esse envio.
            </p>

            <h2>4. Redirecionamentos e links externos</h2>
            <p>
              Algumas páginas levam a links oficiais de seguradoras, instituições financeiras e plataformas parceiras.
              As etapas seguintes podem estar sujeitas às regras e políticas dessas plataformas externas.
            </p>

            <h2>5. Atualizações</h2>
            <p>
              A H Soares pode atualizar conteúdos, produtos, formulários e fluxos do site sempre que necessário para
              refletir mudanças de atendimento, regulatórias ou tecnológicas.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
