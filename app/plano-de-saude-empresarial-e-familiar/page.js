import Link from 'next/link';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { StructuredData } from '@/components/structured-data';
import { buildOrganizationSchema, buildPageMetadata, absoluteUrl, siteConfig } from '@/lib/site';

const faqs = [
  {
    q: 'A H Soares trabalha com mais de uma operadora de plano de saúde?',
    a: 'Sim. A corretora atua com diferentes operadoras do mercado para montar cenários conforme perfil, rede hospitalar desejada, acomodação e custo total.'
  },
  {
    q: 'Qual informação mais importante para cotar plano de saúde?',
    a: 'A principal pergunta costuma ser qual rede ou hospital a pessoa deseja usar, porque isso muda bastante a seleção do plano e das operadoras possíveis.'
  },
  {
    q: 'Vocês atendem plano de saúde empresarial e familiar?',
    a: 'Sim. A H Soares atende demandas de pessoa física, familiar e empresarial, sempre com leitura do perfil e da rede desejada.'
  }
];

export const metadata = buildPageMetadata({
  title: 'Plano de Saúde Empresarial e Familiar',
  description:
    'Plano de Saúde Empresarial e Familiar com comparação entre operadoras, análise da rede hospitalar e atendimento consultivo da H Soares.',
  path: '/plano-de-saude-empresarial-e-familiar'
});

const schema = [
  buildOrganizationSchema(),
  {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Plano de Saúde Empresarial e Familiar',
    serviceType: 'Plano de Saúde',
    description:
      'Comparação de planos de saúde com foco em rede hospitalar, operadora, abrangência e custo total.',
    url: absoluteUrl('/plano-de-saude-empresarial-e-familiar'),
    provider: {
      '@type': 'InsuranceAgency',
      name: siteConfig.legalName,
      url: siteConfig.url
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

export default function PlanoSaudeLandingPage() {
  return (
    <>
      <StructuredData data={schema} />
      <SiteHeader />
      <main className="content-page">
        <section className="section page-hero">
          <div className="container page-hero-shell">
            <p className="eyebrow">Saúde</p>
            <h1>Plano de Saúde Empresarial e Familiar com leitura real de rede, custo e operadora.</h1>
            <p className="subhead">
              A H Soares conduz a comparação de planos de saúde de forma consultiva. O objetivo não é só listar preço,
              mas cruzar perfil, hospital desejado, abrangência, acomodação e custo total para indicar as melhores
              rotas de contratação.
            </p>
            <div className="cta-row">
              <Link className="btn btn-primary" href="/produtos/plano-saude">
                Ver página do Plano de Saúde
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
              <h2>Empresarial</h2>
              <p>
                Para empresas, o foco está em equilíbrio entre rede hospitalar, custo por vida, perfil do grupo e
                viabilidade da contratação conforme a operadora escolhida.
              </p>
            </article>
            <article>
              <h2>Familiar</h2>
              <p>
                Para famílias, a corretora ajuda a entender se a troca faz sentido, o que muda de rede, quanto custa e
                quais operadoras entregam melhor aderência ao que a pessoa realmente quer usar.
              </p>
            </article>
            <article>
              <h2>Ponto-chave da análise</h2>
              <p>
                A pergunta central costuma ser quais hospitais e rede de atendimento a pessoa deseja. Essa resposta muda
                completamente o caminho da busca e da proposta comercial.
              </p>
            </article>
          </div>
        </section>

        <section className="section section-soft-blue">
          <div className="container detail-grid">
            <article className="detail-card">
              <h2>O que a H Soares avalia</h2>
              <ul>
                <li>Plano ativo atual, quando houver.</li>
                <li>Motivo da troca ou motivação para contratar.</li>
                <li>Quantidade de vidas e idades completas.</li>
                <li>Hospital ou rede de preferência.</li>
                <li>Faixa de orçamento e desenho de acomodação.</li>
              </ul>
            </article>
            <article className="detail-card">
              <h2>Por que essa análise importa</h2>
              <ul>
                <li>Reduz comparação errada entre operadoras que não atendem a rede desejada.</li>
                <li>Evita propostas desalinhadas com perfil, hospital e custo total.</li>
                <li>Organiza melhor a captura das informações para a proposta certa sair mais rápido.</li>
              </ul>
            </article>
          </div>
        </section>

        <section className="section">
          <div className="container faq-shell">
            <h2>Perguntas frequentes sobre Plano de Saúde</h2>
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
              <p className="eyebrow">Atendimento consultivo</p>
              <h2>Quer receber uma proposta de plano de saúde com mais critério?</h2>
              <p>A página do produto já tem o modal de captura para começar a proposta com as perguntas certas.</p>
            </div>
            <div className="cta-row">
              <Link className="btn btn-primary" href="/produtos/plano-saude">
                Abrir formulário de saúde
              </Link>
              <a className="btn btn-ghost" href={siteConfig.whatsapp} target="_blank" rel="noopener noreferrer">
                Falar com especialista
              </a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
