import Link from 'next/link';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { StructuredData } from '@/components/structured-data';
import { absoluteUrl, buildOrganizationSchema, buildPageMetadata, siteConfig } from '@/lib/site';

const faqs = [
  {
    q: 'A H Soares tem solução específica para imobiliárias?',
    a: 'Sim. A H Soares possui plataforma para imobiliárias parceiras cadastradas, com análise automática de Seguro Fiança e cálculo integrado do Seguro Imobiliário no mesmo fluxo.'
  },
  {
    q: 'A plataforma funciona fora do horário comercial?',
    a: 'Sim. A proposta da operação é permitir jornada mais flexível para imobiliárias parceiras, com uso a qualquer dia e horário para operações elegíveis.'
  },
  {
    q: 'Quais seguradoras entram na análise?',
    a: 'A operação de Seguro Fiança para imobiliárias parceiras trabalha com Porto, Tokio Marine e Too Seguros, conforme enquadramento e elegibilidade.'
  },
  {
    q: 'O Seguro Imobiliário sai junto?',
    a: 'Sim. O Seguro Imobiliário pode ser calculado dentro do mesmo processo, ajudando a imobiliária a visualizar os valores da locação de forma mais completa.'
  }
];

export const metadata = buildPageMetadata({
  title: 'Seguro Fiança para Imobiliárias',
  description:
    'Seguro Fiança para Imobiliárias com plataforma própria, análise automática, retorno na hora e Seguro Imobiliário no mesmo fluxo da locação.',
  path: '/seguro-fianca-para-imobiliarias'
});

const schema = [
  buildOrganizationSchema(),
  {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Seguro Fiança para Imobiliárias',
    serviceType: 'Seguro Fiança para Imobiliárias',
    description:
      'Operação de Seguro Fiança com plataforma para imobiliárias parceiras, análise automática e cálculo conjunto do Seguro Imobiliário.',
    url: absoluteUrl('/seguro-fianca-para-imobiliarias'),
    provider: {
      '@type': 'InsuranceAgency',
      name: siteConfig.legalName,
      url: siteConfig.url,
      telephone: siteConfig.phone,
      email: siteConfig.email
    }
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: { '@type': 'Answer', text: faq.a }
    }))
  }
];

export default function SeguroFiancaImobiliariasPage() {
  return (
    <>
      <StructuredData data={schema} />
      <SiteHeader />
      <main className="content-page">
        <section className="section page-hero">
          <div className="container page-hero-shell">
            <p className="eyebrow">Imobiliárias</p>
            <h1>Seguro Fiança para Imobiliárias com operação mais rápida e previsível.</h1>
            <p className="subhead">
              A H Soares estruturou uma jornada própria para imobiliárias parceiras que precisam ganhar velocidade de
              aprovação, visualizar Seguro Fiança e Seguro Imobiliário no mesmo fluxo e reduzir gargalos no fechamento
              da locação.
            </p>
            <div className="cta-row">
              <Link className="btn btn-primary" href="/produtos/seguro-fianca">
                Ver página do Seguro Fiança
              </Link>
              <a className="btn btn-whatsapp" href={siteConfig.whatsapp} target="_blank" rel="noopener noreferrer">
                Falar no WhatsApp
              </a>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container institutional-grid">
            <article>
              <h2>Resultado na hora</h2>
              <p>
                Para operações elegíveis, a plataforma devolve análise na hora, reduzindo a dependência de uma esteira
                manual e dando mais ritmo à locação.
              </p>
            </article>
            <article>
              <h2>Seguro Imobiliário junto</h2>
              <p>
                O valor do seguro do imóvel já aparece dentro do mesmo fluxo, permitindo a composição completa da
                locação sem abrir uma segunda jornada separada.
              </p>
            </article>
            <article>
              <h2>Operação forte para locação</h2>
              <p>
                A proposta é dar mais escala, previsibilidade e organização para quem opera várias locações e precisa
                de uma resposta comercial mais rápida.
              </p>
            </article>
          </div>
        </section>

        <section className="section section-soft-blue">
          <div className="container">
            <div className="section-head section-head-readable">
              <p className="eyebrow">Fluxo da imobiliária</p>
              <h2>Por que essa operação faz diferença no dia a dia</h2>
            </div>
            <div className="surety-steps-grid">
              <article className="surety-step-card">
                <span className="surety-step-index">01</span>
                <h3>Acesso parceiro</h3>
                <p>Imobiliárias cadastradas acessam a plataforma da H Soares para iniciar a análise.</p>
              </article>
              <article className="surety-step-card">
                <span className="surety-step-index">02</span>
                <h3>Análise automática</h3>
                <p>O fluxo busca retorno rápido das seguradoras operadas para operações elegíveis.</p>
              </article>
              <article className="surety-step-card">
                <span className="surety-step-index">03</span>
                <h3>Seguro do imóvel integrado</h3>
                <p>O Seguro Imobiliário já entra junto da operação de locação com visualização de valores.</p>
              </article>
              <article className="surety-step-card">
                <span className="surety-step-index">04</span>
                <h3>Locação mais fluida</h3>
                <p>Com a jornada organizada, a imobiliária avança a operação com menos atrito e mais velocidade.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container faq-shell">
            <h2>Perguntas frequentes sobre Seguro Fiança para Imobiliárias</h2>
            <div className="faq-list">
              {faqs.map((faq) => (
                <details key={faq.q}>
                  <summary>{faq.q}</summary>
                  <p>{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container cta-panel cta-panel-static">
            <div>
              <p className="eyebrow">Próximo passo</p>
              <h2>Quer cadastrar a sua imobiliária ou entender o fluxo?</h2>
              <p>A H Soares pode orientar a entrada na plataforma e a melhor rotina para operar Seguro Fiança com mais velocidade.</p>
            </div>
            <div className="cta-row">
              <a className="btn btn-primary" href="https://plataforma.hsoaresseguros.com.br/login" target="_blank" rel="noopener noreferrer">
                Acessar plataforma
              </a>
              <Link className="btn btn-ghost" href="/seguro-fianca-locaticia">
                Ver conteúdo locatício
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
