import Link from 'next/link';
import { PremiumLeadCapture } from '@/components/premium-intake-modal';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { StructuredData } from '@/components/structured-data';
import { getProductBySlug } from '@/lib/products';
import { absoluteUrl, buildOrganizationSchema, buildPageMetadata, siteConfig } from '@/lib/site';

const faqs = [
  {
    q: 'Quais dados preciso para cotação de seguro auto?',
    a: 'Os dados principais incluem informações do segurado, do condutor, do veículo, placa, tipo de uso, CEP de pernoite, histórico do seguro atual e, em caso de renovação, a apólice vigente.'
  },
  {
    q: 'A H Soares já recebe a apólice na renovação?',
    a: 'Sim. No formulário do Seguro Auto, quando a cotação é de renovação, o envio da apólice em PDF ou imagem pode ser exigido para organizar melhor a análise.'
  },
  {
    q: 'Vocês atendem tipos de uso diferentes?',
    a: 'Sim. O formulário já contempla uso particular, frete, táxi, locadoras, auto escola, aplicativos, transporte de passageiros, escolar e outras categorias específicas.'
  }
];

export const metadata = buildPageMetadata({
  title: 'Cotação de Seguro Auto: segurado, veículo e renovação',
  description:
    'Cotação de Seguro Auto com envio organizado de dados do segurado, condutor e veículo, incluindo renovação, placa, tipo de uso e histórico do seguro.',
  path: '/cotacao-seguro-auto'
});

const schema = [
  buildOrganizationSchema(),
  {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Cotação de Seguro Auto',
    serviceType: 'Seguro Auto',
    description:
      'Página de cotação de Seguro Auto com envio estruturado de dados do segurado, do condutor e do veículo.',
    url: absoluteUrl('/cotacao-seguro-auto'),
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

const autoProduct = getProductBySlug('seguro-auto');

export default function CotacaoSeguroAutoPage() {
  return (
    <>
      <StructuredData data={schema} />
      <SiteHeader />
      <main className="content-page">
        <section className="section page-hero">
          <div className="container page-hero-shell">
            <p className="eyebrow">Auto</p>
            <h1>Cotação de Seguro Auto com envio guiado e leitura mais organizada.</h1>
            <p className="subhead">
              Envie os dados principais do veículo, do condutor e da renovação em um fluxo orientado pela H Soares.
              Isso reduz retrabalho, organiza melhor a análise e acelera a resposta com mais contexto.
            </p>
            <div className="cta-row">
              <PremiumLeadCapture product={autoProduct} mode="inline" />
              <a className="btn btn-whatsapp" href={siteConfig.whatsapp} target="_blank" rel="noopener noreferrer">
                Falar no WhatsApp
              </a>
            </div>
            <div className="contact-chip-row">
              <span className="contact-chip">Dados guiados para cotação</span>
              <span className="contact-chip">Upload da apólice na renovação</span>
              <span className="contact-chip">Retorno mais claro</span>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container detail-grid">
            <article className="detail-card">
              <h2>O que entra na cotação</h2>
              <ul>
                <li>Dados do segurado e do condutor.</li>
                <li>Data de nascimento, sexo e nome social quando aplicável.</li>
                <li>Modelo do veículo, placa e características técnicas.</li>
                <li>Tipo de uso, dispositivos antifurto e histórico do seguro.</li>
              </ul>
            </article>
            <article className="detail-card">
              <h2>Quando é renovação</h2>
              <ul>
                <li>A apólice atual pode ser solicitada em PDF ou imagem.</li>
                <li>Esse material ajuda a comparar a estrutura atual com a nova cotação.</li>
                <li>O objetivo é organizar a leitura da apólice e ganhar precisão no retorno.</li>
              </ul>
            </article>
          </div>
        </section>

        <section className="section section-soft-blue">
          <div className="container institutional-grid">
            <article>
              <h2>Particular e usos especiais</h2>
              <p>
                A ficha contempla uso particular e categorias como frete, táxi, escolar, auto escola, aplicativos,
                transporte de funcionários e outras situações diferenciadas.
              </p>
            </article>
            <article>
              <h2>Condutor principal</h2>
              <p>
                A análise fica melhor quando os dados do condutor principal são capturados de forma estruturada e sem
                suposições genéricas na hora da cotação.
              </p>
            </article>
            <article>
              <h2>Mais clareza na proposta</h2>
              <p>
                A captura correta do perfil evita proposta desalinhada, melhora a resposta da corretora e ajuda você a
                decidir com mais segurança.
              </p>
            </article>
          </div>
        </section>

        <section className="section">
          <div className="container faq-shell">
            <h2>Perguntas frequentes sobre a cotação</h2>
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
              <p className="eyebrow">Página completa</p>
              <h2>Prefere revisar a página completa do Seguro Auto antes de seguir?</h2>
              <p>
                Se quiser mais contexto sobre o produto, a página completa reúne visão clara de cobertura e o mesmo
                fluxo de cotação orientada.
              </p>
            </div>
            <div className="cta-row">
              <Link className="btn btn-primary" href="/produtos/seguro-auto">
                Ver página completa
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
