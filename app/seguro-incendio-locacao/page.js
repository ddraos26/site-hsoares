import Link from 'next/link';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { StructuredData } from '@/components/structured-data';
import { buildOrganizationSchema, buildPageMetadata, absoluteUrl, siteConfig } from '@/lib/site';

const faqs = [
  {
    q: 'Seguro incêndio para locação é o mesmo que seguro imobiliário?',
    a: 'Na prática do mercado de locação, o seguro incêndio do imóvel costuma compor o Seguro Imobiliário exigido na locação, com cobertura básica e possibilidade de adicionais conforme a seguradora.'
  },
  {
    q: 'Esse seguro pode sair junto com o Seguro Fiança?',
    a: 'Sim. Na operação da H Soares, o Seguro Imobiliário pode ser calculado junto ao Seguro Fiança para facilitar a jornada da locação.'
  },
  {
    q: 'Quem costuma contratar o seguro incêndio da locação?',
    a: 'Em operações locatícias, a exigência costuma estar ligada ao imóvel alugado e à composição contratual definida pela imobiliária, pelo proprietário e pela seguradora.'
  }
];

export const metadata = buildPageMetadata({
  title: 'Seguro Incêndio para Locação',
  description:
    'Seguro Incêndio para Locação com foco em Seguro Imobiliário, cálculo junto do Seguro Fiança e operação mais rápida para imobiliárias e proprietários.',
  path: '/seguro-incendio-locacao'
});

const schema = [
  buildOrganizationSchema(),
  {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Seguro Incêndio para Locação',
    serviceType: 'Seguro Imobiliário',
    description:
      'Proteção do imóvel alugado com cálculo integrado ao Seguro Fiança na operação da H Soares.',
    url: absoluteUrl('/seguro-incendio-locacao'),
    provider: {
      '@type': 'InsuranceAgency',
      name: siteConfig.legalName,
      url: siteConfig.url
    }
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: siteConfig.url },
      { '@type': 'ListItem', position: 2, name: 'Seguro Incêndio para Locação', item: absoluteUrl('/seguro-incendio-locacao') }
    ]
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

export default function SeguroIncendioLocacaoPage() {
  return (
    <>
      <StructuredData data={schema} />
      <SiteHeader />
      <main className="content-page">
        <section className="section page-hero">
          <div className="container page-hero-shell">
            <p className="eyebrow">Locação</p>
            <h1>Seguro Incêndio para Locação com cálculo integrado ao fluxo da imobiliária.</h1>
            <p className="subhead">
              A H Soares trabalha o Seguro Imobiliário como parte importante da locação. Em vez de uma cotação isolada,
              a proposta é integrar o seguro do imóvel à jornada do Seguro Fiança para ganhar velocidade e clareza.
            </p>
            <div className="cta-row">
              <Link className="btn btn-primary" href="/produtos/seguro-imobiliario">
                Ver Seguro Imobiliário
              </Link>
              <Link className="btn btn-ghost" href="/produtos/seguro-fianca">
                Ver Seguro Fiança
              </Link>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container detail-grid">
            <article className="detail-card">
              <h2>Por que esse seguro pesa na locação</h2>
              <ul>
                <li>Protege o imóvel alugado dentro da composição exigida para a locação.</li>
                <li>Evita retrabalho quando já entra junto do Seguro Fiança.</li>
                <li>Ajuda imobiliária, locatário e proprietário a verem o custo completo da operação.</li>
              </ul>
            </article>
            <article className="detail-card">
              <h2>Como a H Soares opera</h2>
              <ul>
                <li>Cálculo do seguro do imóvel dentro da jornada da locação.</li>
                <li>Leitura consultiva da composição antes da contratação.</li>
                <li>Fluxo pensado para imobiliária parceira ganhar velocidade operacional.</li>
              </ul>
            </article>
          </div>
        </section>

        <section className="section section-soft-blue">
          <div className="container">
            <div className="section-head section-head-readable">
              <p className="eyebrow">Quando faz diferença</p>
              <h2>Seguro incêndio para locação não deve ser uma etapa separada e lenta</h2>
            </div>
            <div className="premium-product-feature-grid">
              <article className="premium-product-feature-card">
                <h3>Imobiliárias</h3>
                <p>Precisam visualizar o valor rápido para não travar a aprovação da locação.</p>
              </article>
              <article className="premium-product-feature-card">
                <h3>Proprietários</h3>
                <p>Ganham mais previsibilidade sobre a proteção do imóvel alugado.</p>
              </article>
              <article className="premium-product-feature-card">
                <h3>Locações com fiança</h3>
                <p>Faz sentido quando o Seguro Imobiliário entra no mesmo processo da garantia locatícia.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container faq-shell">
            <h2>Perguntas frequentes sobre Seguro Incêndio para Locação</h2>
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
              <p className="eyebrow">Locação mais completa</p>
              <h2>Quer ver o seguro do imóvel dentro do fluxo correto?</h2>
              <p>A H Soares integra Seguro Imobiliário e Seguro Fiança para acelerar análise e contratação.</p>
            </div>
            <div className="cta-row">
              <Link className="btn btn-primary" href="/produtos/seguro-imobiliario">
                Abrir página do produto
              </Link>
              <a className="btn btn-whatsapp" href={siteConfig.whatsapp} target="_blank" rel="noopener noreferrer">
                Falar no WhatsApp
              </a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
