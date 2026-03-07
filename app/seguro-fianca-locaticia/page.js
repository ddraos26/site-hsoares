import Link from 'next/link';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { StructuredData } from '@/components/structured-data';
import { buildOrganizationSchema, buildPageMetadata, absoluteUrl, siteConfig } from '@/lib/site';

const faqs = [
  {
    q: 'O que é seguro fiança locatícia?',
    a: 'É uma modalidade de garantia para locação que substitui o fiador e pode cobrir aluguel e encargos previstos na apólice, conforme a seguradora e a composição escolhida.'
  },
  {
    q: 'A análise pode sair na hora?',
    a: 'Sim. Para imobiliárias parceiras cadastradas na plataforma da H Soares, a análise pode retornar na hora para operações elegíveis, com Seguro Imobiliário calculado no mesmo fluxo.'
  },
  {
    q: 'A H Soares atende locação residencial e comercial?',
    a: 'Sim. A operação atende seguro fiança residencial, comercial para pessoa física e análise comercial para pessoa jurídica com critérios específicos.'
  },
  {
    q: 'O seguro incêndio da locação pode sair junto?',
    a: 'Sim. Na jornada da H Soares, o Seguro Imobiliário pode ser calculado junto com o Seguro Fiança para acelerar o fechamento da locação.'
  }
];

export const metadata = buildPageMetadata({
  title: 'Seguro Fiança Locatícia',
  description:
    'Seguro Fiança Locatícia com atendimento consultivo, operação forte para imobiliárias, análise rápida e integração com Seguro Imobiliário.',
  path: '/seguro-fianca-locaticia'
});

const schema = [
  buildOrganizationSchema(),
  {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Seguro Fiança Locatícia',
    serviceType: 'Seguro Fiança Locatícia',
    description:
      'Garantia locatícia para aluguel residencial e comercial com operação consultiva, análise rápida e apoio comercial da H Soares.',
    url: absoluteUrl('/seguro-fianca-locaticia'),
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
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: siteConfig.url },
      { '@type': 'ListItem', position: 2, name: 'Seguro Fiança Locatícia', item: absoluteUrl('/seguro-fianca-locaticia') }
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

export default function SeguroFiancaLocaticiaPage() {
  return (
    <>
      <StructuredData data={schema} />
      <SiteHeader />
      <main className="content-page">
        <section className="section page-hero">
          <div className="container page-hero-shell">
            <p className="eyebrow">Locação</p>
            <h1>Seguro Fiança Locatícia com operação forte para fechar locação com mais velocidade.</h1>
            <p className="subhead">
              A H Soares trabalha o Seguro Fiança Locatícia como uma solução comercial e operacional. A corretora atua
              para reduzir atrito na locação, orientar o perfil da garantia e acelerar a jornada de locatário,
              proprietário e imobiliária.
            </p>
            <div className="cta-row">
              <Link className="btn btn-primary" href="/produtos/seguro-fianca">
                Ver página completa do produto
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
              <h2>Para locatário</h2>
              <p>
                O Seguro Fiança Locatícia substitui o fiador tradicional e ajuda a conduzir a locação com mais rapidez,
                desde que o perfil esteja alinhado às regras da seguradora e à composição de cobertura escolhida.
              </p>
            </article>
            <article>
              <h2>Para proprietário</h2>
              <p>
                A garantia locatícia profissional traz mais previsibilidade contratual e estrutura melhor a operação,
                principalmente quando aluguel, condomínio, IPTU e demais verbas precisam ser avaliados com clareza.
              </p>
            </article>
            <article>
              <h2>Para imobiliária</h2>
              <p>
                A H Soares opera com plataforma para imobiliárias parceiras, análise na hora para operações elegíveis e
                integração com Seguro Imobiliário no mesmo fluxo da locação.
              </p>
            </article>
          </div>
        </section>

        <section className="section section-soft-blue">
          <div className="container">
            <div className="section-head section-head-readable">
              <p className="eyebrow">Como funciona</p>
              <h2>Uma jornada mais preparada para locação residencial e comercial</h2>
            </div>
            <div className="surety-steps-grid">
              <article className="surety-step-card">
                <span className="surety-step-index">01</span>
                <h3>Leitura do perfil</h3>
                <p>A corretora posiciona o tipo de análise ideal conforme locação residencial, comercial PF ou comercial PJ.</p>
              </article>
              <article className="surety-step-card">
                <span className="surety-step-index">02</span>
                <h3>Captura organizada</h3>
                <p>Os dados podem ser enviados no formulário do site, com estrutura adequada para pretendentes, imóvel e coberturas.</p>
              </article>
              <article className="surety-step-card">
                <span className="surety-step-index">03</span>
                <h3>Plataforma para imobiliárias</h3>
                <p>Parceiros cadastrados conseguem operar a análise de forma mais rápida e organizada dentro da plataforma H Soares.</p>
              </article>
              <article className="surety-step-card">
                <span className="surety-step-index">04</span>
                <h3>Locação mais fluida</h3>
                <p>Com análise estruturada e Seguro Imobiliário calculado junto, a locação ganha velocidade e previsibilidade.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="section-head">
              <p className="eyebrow">Pontos importantes</p>
              <h2>O que mais pesa na contratação do Seguro Fiança Locatícia</h2>
            </div>
            <div className="coverage-grid">
              <article className="coverage-card">
                <div className="coverage-card-head">
                  <span className="coverage-icon tone-safety">01</span>
                  <h3>Tipo de locação</h3>
                </div>
                <p>Locação residencial, comercial PF e comercial PJ possuem leituras e fichas diferentes.</p>
              </article>
              <article className="coverage-card">
                <div className="coverage-card-head">
                  <span className="coverage-icon tone-energy">02</span>
                  <h3>Composição de encargos</h3>
                </div>
                <p>Aluguel, condomínio, IPTU, água, luz e verbas adicionais influenciam a estrutura final da garantia.</p>
              </article>
              <article className="coverage-card">
                <div className="coverage-card-head">
                  <span className="coverage-icon tone-trust">03</span>
                  <h3>Seguro Imobiliário junto</h3>
                </div>
                <p>Na operação da H Soares, o seguro do imóvel pode ser calculado junto para evitar esteiras separadas.</p>
              </article>
              <article className="coverage-card">
                <div className="coverage-card-head">
                  <span className="coverage-icon tone-fire">04</span>
                  <h3>Velocidade operacional</h3>
                </div>
                <p>Imobiliárias parceiras conseguem trabalhar com retorno mais rápido para não travar o fechamento da locação.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container faq-shell">
            <h2>Perguntas frequentes sobre Seguro Fiança Locatícia</h2>
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
              <h2>Quer avançar com Seguro Fiança Locatícia agora?</h2>
              <p>Use a página completa do produto ou fale com a H Soares para organizar a análise correta.</p>
            </div>
            <div className="cta-row">
              <Link className="btn btn-primary" href="/produtos/seguro-fianca">
                Ir para Seguro Fiança
              </Link>
              <Link className="btn btn-ghost" href="/produtos/seguro-imobiliario">
                Ver Seguro Imobiliário
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
