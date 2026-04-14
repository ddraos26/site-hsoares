import { ContactLeadForm } from '@/components/contact-lead-form';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { StructuredData } from '@/components/structured-data';
import { buildOrganizationSchema, buildPageMetadata, siteConfig } from '@/lib/site';

export const metadata = buildPageMetadata({
  title: 'Contato H Soares Seguros: WhatsApp, e-mail e atendimento',
  description:
    'Fale com a H Soares Seguros por WhatsApp ou e-mail para Seguro Fiança, Seguro Auto, Plano de Saúde e demais soluções.',
  path: '/contato'
});

const contactFaqs = [
  {
    q: 'Qual é o canal mais rápido para retorno?',
    a: 'O canal mais rápido costuma ser o WhatsApp, porque ele facilita triagem, esclarecimento de dúvidas e avanço da conversa no mesmo fluxo.'
  },
  {
    q: 'Posso pedir orientação mesmo sem saber qual produto contratar?',
    a: 'Sim. Você pode explicar o cenário no formulário ou no WhatsApp, e a H Soares ajuda a identificar o produto mais aderente.'
  },
  {
    q: 'Preciso enviar documentos já no primeiro contato?',
    a: 'Não. O primeiro passo é entender o contexto. Documentos só entram quando realmente ajudam a organizar a análise.'
  }
];

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
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: contactFaqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a
      }
    }))
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
              O principal canal de atendimento é o WhatsApp. Por lá, a corretora orienta a escolha do produto,
              esclarece dúvidas e ajuda você a seguir com mais segurança.
            </p>
            <div className="contact-chip-row">
              <span className="contact-chip">WhatsApp direto</span>
              <span className="contact-chip">Orientação consultiva</span>
              <span className="contact-chip">Seguro Fiança, Auto, Saúde e mais</span>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container contact-page-grid">
            <ContactLeadForm />

            <div className="contact-aside-stack">
              <article className="contact-card">
                <p className="footer-title">WhatsApp</p>
                <h2>(11) 9 7206-4288</h2>
                <p>Canal principal para atendimento e suporte na jornada de contratação.</p>
                <a className="btn btn-primary" href={siteConfig.whatsapp} target="_blank" rel="noopener noreferrer">
                  Iniciar conversa
                </a>
              </article>

              <article className="contact-card">
                <p className="footer-title">E-mail</p>
                <h2>contato@hsoaresseguros.com.br</h2>
                <p>Canal institucional para assuntos relacionados ao atendimento e à corretora.</p>
                <a className="btn btn-ghost" href={`mailto:${siteConfig.email}`}>
                  Enviar e-mail
                </a>
              </article>

              <article className="contact-card">
                <p className="footer-title">Como funciona o atendimento</p>
                <ul className="contact-helper-list">
                  <li>Você informa o produto ou o cenário principal.</li>
                  <li>A H Soares entende o contexto e pede apenas o que for necessário.</li>
                  <li>Quando fizer sentido, o próximo passo segue para o canal oficial de contratação.</li>
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section className="section section-soft-blue">
          <div className="container contact-proof-grid">
            <article>
              <h2>Retorno mais bem direcionado</h2>
              <p>Nome, produto e contexto inicial ajudam a corretora a responder com mais precisão desde a primeira conversa.</p>
            </article>
            <article>
              <h2>Atendimento para pessoas, famílias e empresas</h2>
              <p>A jornada atende clientes finais, imobiliárias, empresas e cenários que exigem leitura consultiva.</p>
            </article>
            <article>
              <h2>Menos atrito para avançar</h2>
              <p>O objetivo é reduzir ida e volta, esclarecer a solução certa e acelerar o passo seguinte da contratação.</p>
            </article>
          </div>
        </section>

        <section className="section">
          <div className="container faq-shell">
            <h2>Dúvidas frequentes sobre o contato</h2>
            <div className="faq-list">
              {contactFaqs.map((faq) => (
                <details key={faq.q}>
                  <summary>{faq.q}</summary>
                  <p>{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
