import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { buildPageMetadata } from '@/lib/site';

export const metadata = buildPageMetadata({
  title: 'Política de Privacidade',
  description:
    'Política de Privacidade da H Soares Seguros sobre coleta de leads, formulários, cookies e tratamento de dados pessoais.',
  path: '/politica-de-privacidade'
});

export default function PrivacyPolicyPage() {
  return (
    <>
      <SiteHeader />
      <main className="content-page legal-page">
        <section className="section page-hero">
          <div className="container page-hero-shell">
            <p className="eyebrow">Privacidade</p>
            <h1>Política de Privacidade</h1>
            <p className="subhead">
              Esta política resume como a H Soares Seguros trata informações enviadas por visitantes, clientes,
              parceiros e leads captados pelo site.
            </p>
          </div>
        </section>

        <section className="section">
          <div className="container legal-shell">
            <h2>1. Dados coletados</h2>
            <p>
              O site pode coletar dados informados voluntariamente em formulários, como nome, telefone, e-mail,
              informações do produto desejado, dados necessários para análise comercial e arquivos anexados.
            </p>

            <h2>2. Finalidade do uso</h2>
            <p>
              Os dados são utilizados para atendimento comercial, simulações, análise preliminar, retorno de contato,
              encaminhamento ao fluxo da seguradora parceira e melhoria da operação de atendimento da corretora.
            </p>

            <h2>3. Compartilhamento</h2>
            <p>
              Quando necessário para a contratação, os dados podem ser compartilhados com seguradoras, plataformas
              parceiras e prestadores diretamente envolvidos no processo do produto solicitado.
            </p>

            <h2>4. Cookies e analytics</h2>
            <p>
              O site pode utilizar cookies e ferramentas analíticas para medir navegação, páginas acessadas e eventos
              de conversão, sempre com objetivo de melhoria operacional e comercial.
            </p>

            <h2>5. Direitos do titular</h2>
            <p>
              O titular pode solicitar atualização, correção ou informações sobre o tratamento de seus dados pelo canal
              institucional da corretora, observadas as obrigações legais e regulatórias aplicáveis.
            </p>

            <h2>6. Contato</h2>
            <p>Para assuntos relacionados à privacidade, utilize contato@hsoaresseguros.com.br.</p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
