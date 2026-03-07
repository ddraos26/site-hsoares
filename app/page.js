import Link from 'next/link';
import { ProductCard } from '@/components/product-card';
import { LgpdBanner } from '@/components/lgpd-banner';
import { SafeImage } from '@/components/safe-image';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { StructuredData } from '@/components/structured-data';
import { products } from '@/lib/products';
import { absoluteUrl, buildOrganizationSchema, buildPageMetadata, siteConfig } from '@/lib/site';

const homeFaqs = [
  {
    q: 'Quais seguros a H Soares vende hoje?',
    a: 'A H Soares trabalha com Seguro Fiança, Seguro Auto, Plano de Saúde, Seguro Residencial, Seguro Imobiliário, Seguro Celular, Seguro Viagem, Vida e outras soluções para pessoas, imóveis e empresas.'
  },
  {
    q: 'A contratação acontece no site da H Soares?',
    a: 'A H Soares orienta comercialmente a escolha do produto e, em muitos casos, o fechamento final acontece no ambiente oficial da seguradora parceira ou no link de contratação correspondente.'
  },
  {
    q: 'Como funciona o Seguro Fiança da H Soares?',
    a: 'A corretora opera Seguro Fiança com seguradoras parceiras e disponibiliza plataforma própria para imobiliárias cadastradas, com análise automática, retorno na hora e cálculo integrado do Seguro Imobiliário.'
  },
  {
    q: 'A H Soares atende por WhatsApp?',
    a: 'Sim. O principal canal comercial da corretora é o WhatsApp, com atendimento orientado para tirar dúvidas, estruturar a escolha e acelerar o fechamento.'
  }
];

export const metadata = buildPageMetadata({
  title: 'Seguro Fiança, Auto, Saúde e Seguros Patrimoniais',
  description:
    'H Soares Seguros: corretora com 30 anos, forte em Seguro Fiança, Seguro Auto, Plano de Saúde e proteção patrimonial para pessoas, imóveis e empresas.',
  path: '/'
});

const insurerLogos = [
  { name: 'Azul Seguros', slug: 'azul', src: '/assets/AZUL.png' },
  { name: 'Allianz', slug: 'allianz', src: '/assets/insurers/allianz.png' },
  { name: 'Alfa', slug: 'alfa', src: '/assets/insurers/alfa.png' },
  { name: 'Bradesco', slug: 'bradesco', src: '/assets/insurers/bradesco.png' },
  { name: 'HDI', slug: 'hdi', src: '/assets/insurers/hdi.png' },
  { name: 'Yelum', slug: 'yelum', src: '/assets/insurers/yelum.png' },
  { name: 'Mapfre', slug: 'mapfre', src: '/assets/insurers/mapfre.png' },
  { name: 'Porto', slug: 'porto', src: '/assets/PORTO.png' },
  { name: 'SulAmérica', slug: 'sulamerica', src: '/assets/insurers/sulamerica.svg' },
  { name: 'Tokio Marine', slug: 'tokio-marine', src: '/assets/insurers/tokio-marine.png' },
  { name: 'Too Seguros', slug: 'too-seguros', src: '/assets/insurers/too-seguros.png' },
  { name: 'Akad', slug: 'akad', src: '/assets/insurers/akad.png' },
  { name: 'Suhai', slug: 'suhai', src: '/assets/insurers/suhai.png' }
];

const homeStructuredData = [
  buildOrganizationSchema(),
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url,
    inLanguage: 'pt-BR'
  },
  {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Principais produtos da H Soares Seguros',
    itemListElement: products.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: product.name,
      url: absoluteUrl(`/produtos/${product.slug}`)
    }))
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: homeFaqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a
      }
    }))
  }
];

export default function HomePage() {
  return (
    <>
      <StructuredData data={homeStructuredData} />
      <SiteHeader />
      <main>
        <section className="hero">
          <div className="container hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">Corretora de Seguros | 30 anos</p>
              <h1>Seguros com confiança institucional, atendimento forte e fechamento com mais segurança.</h1>
              <p className="subhead">
                A H Soares combina postura institucional, atendimento consultivo e uma operação comercial de alta
                performance. O cliente entende, confia e avança para contratação com segurança no primeiro contato.
              </p>
              <div className="cta-row">
                <a className="btn btn-primary" href="#produtos">
                  Simular e contratar
                </a>
                <a
                  className="btn btn-whatsapp"
                  href="https://wa.me/5511972064288?text=Ol%C3%A1%2C%20quero%20uma%20orienta%C3%A7%C3%A3o%20comercial%20sobre%20seguros."
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Falar no WhatsApp
                </a>
              </div>
              <div className="metrics premium-metrics">
                <div>
                  <strong>30+</strong>
                  <span>Anos de mercado</span>
                </div>
                <div>
                  <strong>12</strong>
                  <span>Seguradoras parceiras</span>
                </div>
                <div>
                  <strong>100%</strong>
                  <span>Foco em fechamento</span>
                </div>
              </div>
            </div>

            <aside className="hero-media-shell">
              <figure className="hero-media">
                <SafeImage
                  src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1900&q=80"
                  alt="Reunião institucional e consultiva para contratação de seguros"
                />
              </figure>
              <article className="hero-floating-card">
                <p className="mini-label">Atendimento comercial premium</p>
                <h2>Decisão mais rápida, cobertura melhor e fechamento assistido.</h2>
                <ul>
                  <li>Estratégia por perfil do cliente</li>
                  <li>Comparativo objetivo de opções</li>
                  <li>Acompanhamento até concluir no link oficial</li>
                </ul>
              </article>
            </aside>
          </div>
        </section>

        <section className="confidence-band">
          <div className="container confidence-grid">
            <article>
              <p>H Soares Corretora de Seguros LTDA</p>
              <strong>Estrutura institucional sólida</strong>
            </article>
            <article>
              <p>CNPJ ativo</p>
              <strong>11.194.245.0001-13</strong>
            </article>
            <article>
              <p>Canal principal de atendimento</p>
              <strong>WhatsApp com resposta comercial rápida</strong>
            </article>
          </div>
        </section>

        <section className="section" id="institucional">
          <div className="container institutional-grid">
            <article>
              <h3>Quem somos</h3>
              <p>
                A H Soares Corretora de Seguros LTDA atua há 30 anos com perfil consultivo, ética comercial e foco em
                solução real para pessoas, famílias e empresas.
              </p>
            </article>
            <article>
              <h3>Estrutura comercial</h3>
              <p>
                Jornada pensada para reduzir fricção: página de produto clara, microcaptura opcional e redirecionamento
                rápido para contratação.
              </p>
            </article>
            <article>
              <h3>Confiabilidade</h3>
              <p>
                CNPJ ativo 11.194.245.0001-13, atendimento contínuo por WhatsApp e relacionamento com grandes
                seguradoras do mercado.
              </p>
            </article>
          </div>
        </section>

        <section className="section sales-process">
          <div className="container">
            <div className="section-head">
              <p className="eyebrow">Jornada Comercial</p>
              <h2>Uma experiência premium para converter com confiança</h2>
            </div>
            <div className="process-grid">
              <article>
                <span>01</span>
                <h3>Diagnóstico rápido</h3>
                <p>Entendemos perfil e necessidade para indicar o produto certo com abordagem objetiva.</p>
              </article>
              <article>
                <span>02</span>
                <h3>Posicionamento estratégico</h3>
                <p>Explicamos coberturas, condições e diferenciais de forma clara, sem linguagem confusa.</p>
              </article>
              <article>
                <span>03</span>
                <h3>Fechamento assistido</h3>
                <p>Você finaliza no ambiente oficial da seguradora parceira e nós acompanhamos para aumentar conclusão.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="section logos-band">
          <div className="container">
            <div className="section-head section-head-readable insurers-band-head">
              <div>
                <p className="eyebrow">Seguradoras parceiras</p>
                <h2>Grandes marcas atendidas pela operação comercial da H Soares</h2>
              </div>
              <a className="link-btn" href="/seguradoras">
                Ver canais e assistência
              </a>
            </div>
            <div className="logo-grid">
              {insurerLogos.map((logo) => (
                <Link className="logo-tile logo-tile--compact" href={`/seguradoras#${logo.slug}`} key={logo.name}>
                  <img src={logo.src} alt={logo.name} />
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="produtos">
          <div className="container">
            <div className="section-head">
              <p className="eyebrow">Produtos e Serviços</p>
              <h2>Uma página de venda para cada produto</h2>
            </div>
            <div className="product-grid">
              {products.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container faq-shell">
            <div className="section-head section-head-readable">
              <p className="eyebrow">Perguntas frequentes</p>
              <h2>O que clientes e parceiros mais procuram antes de contratar</h2>
            </div>
            <div className="faq-list">
              {homeFaqs.map((faq) => (
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
      <LgpdBanner />
    </>
  );
}
