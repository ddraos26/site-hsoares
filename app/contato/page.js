import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { StructuredData } from '@/components/structured-data';
import { buildOrganizationSchema, buildPageMetadata, siteConfig } from '@/lib/site';

export const metadata = buildPageMetadata({
  title: 'Contato',
  description:
    'Fale com a H Soares Seguros por WhatsApp ou e-mail para Seguro Fiança, Seguro Auto, Plano de Saúde e demais soluções.',
  path: '/contato'
});

const contactSchema = [
  buildOrganizationSchema(),
  {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Contato H Soares Seguros',
    url: `${siteConfig.url}/contato`,
    mainEntity: {
      '@type': 'InsuranceAgency',
      name: siteConfig.legalName,
      email: siteConfig.email,
      telephone: siteConfig.phone
    }
  }
];

export default function ContactPage() {
  return (
    <>
      <StructuredData data={contactSchema} />
      <SiteHeader />
      <main className="content-page">
        <section className="section page-hero">
          <div className="container page-hero-shell">
            <p className="eyebrow">Contato</p>
            <h1>Fale com a H Soares Seguros.</h1>
            <p className="subhead">
              O principal canal de atendimento é o WhatsApp comercial. Por lá, a corretora orienta a escolha do
              produto, organiza a captura de informações e acompanha a jornada até o fechamento.
            </p>
          </div>
        </section>

        <section className="section">
          <div className="container contact-grid">
            <article className="contact-card">
              <p className="footer-title">WhatsApp</p>
              <h2>(11) 9 7206-4288</h2>
              <p>Canal principal para atendimento comercial e suporte na jornada de contratação.</p>
              <a className="btn btn-primary" href={siteConfig.whatsapp} target="_blank" rel="noopener noreferrer">
                Iniciar conversa
              </a>
            </article>
            <article className="contact-card">
              <p className="footer-title">E-mail</p>
              <h2>contato@hsoaresseguros.com.br</h2>
              <p>Canal institucional para comunicação comercial e assuntos relacionados ao atendimento.</p>
              <a className="btn btn-ghost" href={`mailto:${siteConfig.email}`}>
                Enviar e-mail
              </a>
            </article>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
