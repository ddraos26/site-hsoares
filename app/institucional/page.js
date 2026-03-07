import Link from 'next/link';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { StructuredData } from '@/components/structured-data';
import { buildOrganizationSchema, buildPageMetadata, siteConfig } from '@/lib/site';

export const metadata = buildPageMetadata({
  title: 'Institucional',
  description:
    'Conheça a H Soares Corretora de Seguros LTDA: 30 anos de mercado, atuação consultiva, foco em Seguro Fiança, Auto, Saúde e proteção patrimonial.',
  path: '/institucional'
});

const institutionSchema = [
  buildOrganizationSchema(),
  {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'Institucional H Soares Seguros',
    url: `${siteConfig.url}/institucional`,
    description:
      'Página institucional da H Soares Corretora de Seguros LTDA com informações sobre atuação, diferenciais, produtos e canais de atendimento.'
  }
];

export default function InstitutionalPage() {
  return (
    <>
      <StructuredData data={institutionSchema} />
      <SiteHeader />
      <main className="content-page">
        <section className="section page-hero">
          <div className="container page-hero-shell">
            <p className="eyebrow">Institucional</p>
            <h1>30 anos de mercado com operação comercial forte e postura consultiva.</h1>
            <p className="subhead">
              A H Soares Corretora de Seguros LTDA atua com visão institucional, atendimento humano e foco em fechar
              com mais segurança. A corretora atende pessoas, famílias, imóveis, imobiliárias e empresas com leitura
              clara de cobertura, risco e enquadramento.
            </p>
          </div>
        </section>

        <section className="section">
          <div className="container institutional-grid">
            <article>
              <h2>Quem somos</h2>
              <p>
                A H Soares construiu sua atuação com base em relacionamento, seriedade comercial e acompanhamento
                próximo da jornada de contratação. O foco é orientar bem para o cliente decidir com confiança.
              </p>
            </article>
            <article>
              <h2>Especialidades</h2>
              <p>
                Entre os produtos mais estratégicos estão Seguro Fiança, Seguro Imobiliário, Seguro Auto, Plano de
                Saúde, Seguro Residencial, Vida, Viagem e soluções patrimoniais para pessoas e empresas.
              </p>
            </article>
            <article>
              <h2>Como atendemos</h2>
              <p>
                A operação prioriza WhatsApp, páginas de produto completas, formulários de lead e, quando aplicável,
                direcionamento ao ambiente oficial da seguradora parceira para concluir a contratação.
              </p>
            </article>
          </div>
        </section>

        <section className="section section-soft-blue">
          <div className="container detail-grid">
            <article className="detail-card">
              <h2>Diferenciais da corretora</h2>
              <ul>
                <li>30 anos de mercado do seguro.</li>
                <li>Atendimento comercial com leitura consultiva.</li>
                <li>Operação forte em locação com Seguro Fiança e Seguro Imobiliário.</li>
                <li>Relacionamento com grandes seguradoras do mercado.</li>
              </ul>
            </article>
            <article className="detail-card">
              <h2>Dados da empresa</h2>
              <ul>
                <li>Razão social: H Soares Corretora de Seguros LTDA.</li>
                <li>CNPJ: 11.194.245.0001-13.</li>
                <li>Canal principal: WhatsApp comercial.</li>
                <li>E-mail institucional: contato@hsoaresseguros.com.br.</li>
              </ul>
            </article>
          </div>
        </section>

        <section className="section">
          <div className="container cta-panel cta-panel-static">
            <div>
              <p className="eyebrow">Falar com a H Soares</p>
              <h2>Quer entender qual produto faz mais sentido para o seu caso?</h2>
              <p>Use o WhatsApp para atendimento comercial rápido ou navegue direto pelas páginas de produto.</p>
            </div>
            <div className="cta-row">
              <a className="btn btn-primary" href={siteConfig.whatsapp} target="_blank" rel="noopener noreferrer">
                Falar no WhatsApp
              </a>
              <Link className="btn btn-ghost" href="/#produtos">
                Ver produtos
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
