import Link from 'next/link';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { StructuredData } from '@/components/structured-data';
import { absoluteUrl, buildOrganizationSchema, buildPageMetadata, siteConfig } from '@/lib/site';

const faqs = [
  {
    q: 'Qual é a pergunta mais importante para cotar plano de saúde?',
    a: 'Na prática comercial da H Soares, a pergunta mais importante costuma ser qual hospital ou rede o cliente deseja utilizar, porque isso altera bastante as operadoras e os planos elegíveis.'
  },
  {
    q: 'É possível comparar plano de saúde por hospital?',
    a: 'Sim. A análise pode ser conduzida a partir do hospital ou da rede desejada, cruzando essa preferência com acomodação, abrangência, perfil de contratação e custo total.'
  },
  {
    q: 'A H Soares atende pessoa física, familiar e empresarial?',
    a: 'Sim. O atendimento pode ser estruturado para pessoa física, família e empresa, sempre com leitura da rede pretendida e da composição de vidas.'
  },
  {
    q: 'Já tenho plano ativo. Isso muda a cotação?',
    a: 'Sim. Saber qual operadora o cliente tem hoje, quanto paga e por que deseja trocar ajuda a filtrar propostas melhores e evitar trocas ruins.'
  }
];

export const metadata = buildPageMetadata({
  title: 'Plano de Saúde por Hospital e Rede',
  description:
    'Plano de Saúde por Hospital e Rede com comparação consultiva entre operadoras, foco em hospital desejado, custo total e perfil de contratação.',
  path: '/plano-de-saude-por-hospital-e-rede'
});

const schema = [
  buildOrganizationSchema(),
  {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Plano de Saúde por Hospital e Rede',
    serviceType: 'Plano de Saúde',
    description:
      'Análise de plano de saúde com foco em hospital desejado, rede de atendimento, operadora, acomodação e custo total.',
    url: absoluteUrl('/plano-de-saude-por-hospital-e-rede'),
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

export default function PlanoSaudePorHospitalPage() {
  return (
    <>
      <StructuredData data={schema} />
      <SiteHeader />
      <main className="content-page">
        <section className="section page-hero">
          <div className="container page-hero-shell">
            <p className="eyebrow">Saúde</p>
            <h1>Plano de Saúde por Hospital e Rede com leitura comercial mais precisa.</h1>
            <p className="subhead">
              A H Soares trabalha a busca de plano de saúde a partir da rede desejada pelo cliente. Isso evita
              comparação genérica, melhora o enquadramento das operadoras e ajuda a encontrar propostas mais coerentes
              com hospital, abrangência, acomodação e custo total.
            </p>
            <div className="cta-row">
              <Link className="btn btn-primary" href="/produtos/plano-saude">
                Abrir página do Plano de Saúde
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
              <h2>Hospital desejado</h2>
              <p>
                A pergunta sobre qual hospital ou rede o cliente quer utilizar é uma das mais decisivas da jornada,
                porque ela elimina opções que parecem baratas, mas não entregam a estrutura desejada.
              </p>
            </article>
            <article>
              <h2>Operadora certa</h2>
              <p>
                Depois da rede, entram fatores como tipo de contratação, acomodação, abrangência e composição de
                vidas. A combinação correta depende da leitura consultiva, não só do menor preço.
              </p>
            </article>
            <article>
              <h2>Troca mais inteligente</h2>
              <p>
                Quando o cliente já possui plano ativo, entender operadora atual, valor pago e motivo da troca ajuda a
                buscar alternativas melhores e evita movimentação sem ganho real.
              </p>
            </article>
          </div>
        </section>

        <section className="section section-soft-blue">
          <div className="container detail-grid">
            <article className="detail-card">
              <h2>O que a H Soares costuma perguntar</h2>
              <ul>
                <li>Qual hospital ou rede de atendimento deseja usar.</li>
                <li>Se já possui plano ativo e qual operadora é a atual.</li>
                <li>Quanto paga hoje e qual o motivo da troca.</li>
                <li>Quantidade de vidas e idades completas.</li>
                <li>Perfil familiar, individual ou empresarial.</li>
              </ul>
            </article>
            <article className="detail-card">
              <h2>Por que essa lógica funciona melhor</h2>
              <ul>
                <li>Reduz ruído comercial e propostas que não atendem a rede desejada.</li>
                <li>Ajuda a comparar operadoras com mais critério e menos perda de tempo.</li>
                <li>Melhora a qualidade da proposta e a chance de conversão.</li>
              </ul>
            </article>
          </div>
        </section>

        <section className="section">
          <div className="container faq-shell">
            <h2>Perguntas frequentes sobre Plano de Saúde por Hospital e Rede</h2>
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
              <h2>Quer começar sua análise de Plano de Saúde?</h2>
              <p>A página principal já tem o modal com as perguntas mais importantes para sua proposta sair melhor.</p>
            </div>
            <div className="cta-row">
              <Link className="btn btn-primary" href="/produtos/plano-saude">
                Abrir formulário do plano
              </Link>
              <Link className="btn btn-ghost" href="/plano-de-saude-empresarial-e-familiar">
                Ver página empresarial e familiar
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
