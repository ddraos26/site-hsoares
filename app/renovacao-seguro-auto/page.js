import Link from 'next/link';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { StructuredData } from '@/components/structured-data';
import { absoluteUrl, buildOrganizationSchema, buildPageMetadata, siteConfig } from '@/lib/site';

const faqs = [
  {
    q: 'O que a H Soares precisa para renovação de seguro auto?',
    a: 'Para renovação, a corretora organiza dados do segurado, do condutor, do veículo e pode exigir a apólice atual em PDF ou imagem para comparar coberturas e histórico com mais precisão.'
  },
  {
    q: 'A apólice atual é obrigatória na renovação?',
    a: 'No fluxo da H Soares, a renovação pode exigir o envio da apólice atual para estruturar melhor a análise comercial e reduzir ruídos na comparação da proposta nova.'
  },
  {
    q: 'Placa e tipo de uso influenciam na renovação?',
    a: 'Sim. A placa, o modelo do veículo, o CEP de pernoite, o tipo de uso e o histórico do seguro atual influenciam bastante na cotação de renovação.'
  }
];

export const metadata = buildPageMetadata({
  title: 'Renovação de Seguro Auto',
  description:
    'Renovação de Seguro Auto com captura organizada da apólice atual, dados do condutor, veículo, tipo de uso e histórico do seguro.',
  path: '/renovacao-seguro-auto'
});

const schema = [
  buildOrganizationSchema(),
  {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Renovação de Seguro Auto',
    serviceType: 'Renovação de Seguro Auto',
    description:
      'Página voltada à renovação do Seguro Auto com exigência da apólice atual e captura estruturada dos principais dados da cotação.',
    url: absoluteUrl('/renovacao-seguro-auto'),
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

export default function RenovacaoSeguroAutoPage() {
  return (
    <>
      <StructuredData data={schema} />
      <SiteHeader />
      <main className="content-page">
        <section className="section page-hero">
          <div className="container page-hero-shell">
            <p className="eyebrow">Auto</p>
            <h1>Renovação de Seguro Auto com leitura melhor da apólice atual.</h1>
            <p className="subhead">
              Na renovação, a qualidade da captura pesa muito. A H Soares organiza os dados do segurado, do condutor,
              do veículo e da apólice vigente para comparar melhor o cenário atual com a nova proposta comercial.
            </p>
            <div className="cta-row">
              <Link className="btn btn-primary" href="/produtos/seguro-auto">
                Abrir página do Seguro Auto
              </Link>
              <a className="btn btn-whatsapp" href={siteConfig.whatsapp} target="_blank" rel="noopener noreferrer">
                Falar no WhatsApp
              </a>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container detail-grid">
            <article className="detail-card">
              <h2>O que costuma entrar na renovação</h2>
              <ul>
                <li>Apólice atual em PDF ou imagem.</li>
                <li>Dados do segurado e do condutor principal.</li>
                <li>Placa, modelo, uso do veículo e CEP de pernoite.</li>
                <li>Histórico do seguro e informações operacionais relevantes.</li>
              </ul>
            </article>
            <article className="detail-card">
              <h2>Por que a apólice atual importa</h2>
              <ul>
                <li>Ajuda a comparar coberturas e estrutura real da proteção vigente.</li>
                <li>Evita proposta desalinhada com bônus, histórico ou forma de uso.</li>
                <li>Dá mais clareza para montar um retorno comercial melhor.</li>
              </ul>
            </article>
          </div>
        </section>

        <section className="section section-soft-blue">
          <div className="container institutional-grid">
            <article>
              <h2>Menos retrabalho</h2>
              <p>
                Quando a renovação nasce com os dados certos, a corretora ganha velocidade e reduz o vai e volta com o
                cliente para completar informações importantes da análise.
              </p>
            </article>
            <article>
              <h2>Comparação melhor</h2>
              <p>
                O foco não é só mudar por preço. A comparação correta considera perfil do condutor, veículo, uso,
                histórico e estrutura da apólice vigente.
              </p>
            </article>
            <article>
              <h2>Mais conversão</h2>
              <p>
                Uma renovação bem montada aumenta a confiança do cliente e melhora a chance de fechar sem ruído
                operacional no meio da jornada.
              </p>
            </article>
          </div>
        </section>

        <section className="section">
          <div className="container faq-shell">
            <h2>Perguntas frequentes sobre Renovação de Seguro Auto</h2>
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
              <h2>Quer enviar sua renovação agora?</h2>
              <p>A página do Seguro Auto já está preparada para receber a apólice e iniciar a análise com mais precisão.</p>
            </div>
            <div className="cta-row">
              <Link className="btn btn-primary" href="/produtos/seguro-auto">
                Abrir formulário do auto
              </Link>
              <Link className="btn btn-ghost" href="/cotacao-seguro-auto">
                Ver página de cotação
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
