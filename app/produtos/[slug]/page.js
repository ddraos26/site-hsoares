import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PremiumLeadCapture } from '@/components/premium-intake-modal';
import { ProductConversion } from '@/components/product-conversion';
import { SafeImage } from '@/components/safe-image';
import { ServicesCarousel } from '@/components/services-carousel';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { StructuredData } from '@/components/structured-data';
import { getProductBySlug, products } from '@/lib/products';
import { absoluteUrl, buildOrganizationSchema, buildPageMetadata, siteConfig } from '@/lib/site';

function PremiumIcon({ name }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.8',
    strokeLinecap: 'round',
    strokeLinejoin: 'round'
  };

  const icons = {
    shield: (
      <svg {...common}>
        <path d="M12 3l7 3v5c0 4.7-2.8 8.9-7 10-4.2-1.1-7-5.3-7-10V6l7-3z" />
        <path d="M9.5 12.2l1.8 1.8 3.6-4" />
      </svg>
    ),
    tools: (
      <svg {...common}>
        <path d="M14 6a4 4 0 0 0 4.8 4.8l-6.5 6.5a2 2 0 0 1-2.8-2.8l6.5-6.5A4 4 0 0 0 14 6z" />
        <path d="M4 20l3-3" />
      </svg>
    ),
    star: (
      <svg {...common}>
        <path d="M12 3l2.7 5.5 6 0.9-4.3 4.2 1 5.9L12 16.9 6.6 19.5l1-5.9-4.3-4.2 6-.9L12 3z" />
      </svg>
    ),
    fire: (
      <svg {...common}>
        <path d="M12.2 3.5c1.8 3-0.7 4.5 1.5 6.6 1.4 1.4 3.3 2.4 3.3 5 0 3.1-2.4 5.4-5 5.4S7 18.2 7 15.2c0-2.5 1.4-4.1 3-5.8 1.5-1.5 2.2-2.8 2.2-5.9z" />
      </svg>
    ),
    bolt: (
      <svg {...common}>
        <path d="M13 2L6 13h5l-1 9 7-11h-5l1-9z" />
      </svg>
    ),
    lock: (
      <svg {...common}>
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V8a4 4 0 1 1 8 0v3" />
      </svg>
    ),
    family: (
      <svg {...common}>
        <path d="M7.5 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
        <path d="M16.5 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
        <path d="M3.5 19c0-2.5 2.3-4.5 5-4.5s5 2 5 4.5" />
        <path d="M13.8 19c0-1.9 1.6-3.5 3.7-3.5 1.4 0 2.6 0.6 3.2 1.7" />
      </svg>
    ),
    home: (
      <svg {...common}>
        <path d="M3 10.5L12 3l9 7.5" />
        <path d="M5.5 9.5V20h13V9.5" />
      </svg>
    ),
    building: (
      <svg {...common}>
        <path d="M4 21V5l8-2v18" />
        <path d="M12 9h8v12" />
        <path d="M7 8h2M7 12h2M7 16h2M15 12h2M15 16h2" />
      </svg>
    ),
    key: (
      <svg {...common}>
        <circle cx="8" cy="14" r="3.5" />
        <path d="M11.5 14H20l-1.5 1.5L20 17l-1.5 1.5" />
      </svg>
    ),
    sun: (
      <svg {...common}>
        <path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1L7 17M17 7l2.1-2.1" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    ),
    clock: (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    ),
    chat: (
      <svg {...common}>
        <path d="M20 11.5c0 4.1-3.8 7.5-8.5 7.5-1.1 0-2.1-0.2-3-0.5L4 20l1.3-3.5C4.5 15.2 4 13.9 4 12.5 4 8.4 7.8 5 12.5 5S20 7.4 20 11.5z" />
      </svg>
    ),
    document: (
      <svg {...common}>
        <path d="M8 3h6l4 4v14H8z" />
        <path d="M14 3v5h5" />
        <path d="M10 13h6M10 17h6" />
      </svg>
    )
  };

  return <span className="premium-icon">{icons[name] || icons.shield}</span>;
}

const CATEGORY_UI = {
  Auto: {
    highlights: ['Atendimento consultivo', 'Contratação digital', 'Acompanhamento comercial', 'Link oficial da seguradora'],
    heroCaption: 'Proteção com leitura comercial, apoio humano e contratação digital no momento certo.',
    panelTitle: 'Simule com leitura comercial',
    panelText: 'Entenda cobertura, assistência e custo-benefício antes de seguir para a contratação oficial.'
  },
  Financeiro: {
    highlights: ['Solicitação orientada', 'Jornada digital', 'Análise no ambiente oficial', 'Apoio comercial'],
    heroCaption: 'Soluções financeiras com explicação clara, posicionamento consultivo e fluxo digital.',
    panelTitle: 'Solicite com apoio consultivo',
    panelText: 'A H Soares orienta o enquadramento do produto e reduz dúvidas antes do envio para o fluxo oficial.'
  },
  Equipamentos: {
    highlights: ['Proteção do ativo', 'Contratação digital', 'Apoio comercial', 'Jornada objetiva'],
    heroCaption: 'Proteção para equipamentos importantes da sua rotina profissional e pessoal.',
    panelTitle: 'Proteja seu equipamento com clareza',
    panelText: 'Entenda elegibilidade, regras e pontos de atenção antes de concluir no ambiente oficial.'
  },
  Vida: {
    highlights: ['Planejamento familiar', 'Proteção financeira', 'Contratação digital', 'Suporte consultivo'],
    heroCaption: 'Proteção financeira com orientação consultiva e jornada digital mais clara.',
    panelTitle: 'Entenda antes de contratar',
    panelText: 'A H Soares ajuda você a avaliar o valor prático da proteção antes da contratação oficial.'
  },
  Saúde: {
    highlights: ['Comparativo entre operadoras', 'Rede e custo total', 'Pessoa física e empresarial', 'Leitura consultiva'],
    heroCaption: 'Plano de Saúde com leitura estratégica de operadora, rede e custo total para decidir melhor.',
    panelTitle: 'Compare com mais critério',
    panelText: 'A H Soares ajuda você a avaliar cobertura, rede médica, acomodação, abrangência e custo total antes da adesão.'
  },
  Viagem: {
    highlights: ['Pré-embarque digital', 'Cobertura orientada', 'Apoio comercial', 'Contratação rápida'],
    heroCaption: 'Proteção para imprevistos em viagens com contratação ágil e apoio comercial.',
    panelTitle: 'Feche antes do embarque',
    panelText: 'Entenda cobertura, período e perfil da viagem antes de seguir para o ambiente oficial.'
  }
};

const GENERIC_VALUE_META = [
  { icon: 'shield', title: 'Visão estratégica' },
  { icon: 'clock', title: 'Jornada simplificada' },
  { icon: 'chat', title: 'Acompanhamento comercial' }
];

const GENERIC_COVERAGE_META = [
  { icon: 'shield', title: 'Cobertura e amparo', tone: 'safety' },
  { icon: 'document', title: 'Regras e critérios', tone: 'energy' },
  { icon: 'tools', title: 'Serviços e adicionais', tone: 'trust' }
];

const GENERIC_PROFILE_META = [
  { icon: 'star', title: 'Perfil indicado' },
  { icon: 'building', title: 'Uso recomendado' },
  { icon: 'chat', title: 'Momento ideal' }
];

const SEO_SUPPORT_LINKS = {
  'seguro-fianca': [
    {
      href: '/seguro-fianca-locaticia',
      title: 'Seguro Fiança Locatícia',
      text: 'Página estratégica para buscas sobre garantia locatícia e locação residencial ou comercial.'
    },
    {
      href: '/seguro-fianca-para-imobiliarias',
      title: 'Seguro Fiança para Imobiliárias',
      text: 'Conteúdo focado em plataforma, análise rápida e operação de locação para imobiliárias parceiras.'
    },
    {
      href: '/seguro-incendio-locacao',
      title: 'Seguro Incêndio para Locação',
      text: 'Conteúdo complementar sobre o seguro do imóvel dentro da jornada de locação.'
    }
  ],
  'seguro-imobiliario': [
    {
      href: '/seguro-incendio-locacao',
      title: 'Seguro Incêndio para Locação',
      text: 'Página focada no seguro do imóvel alugado e na integração com a locação.'
    },
    {
      href: '/seguro-fianca-locaticia',
      title: 'Seguro Fiança Locatícia',
      text: 'Entenda como a garantia locatícia conversa com o seguro do imóvel.'
    }
  ],
  'plano-saude': [
    {
      href: '/plano-de-saude-empresarial-e-familiar',
      title: 'Plano de Saúde Empresarial e Familiar',
      text: 'Página criada para buscas relacionadas a rede hospitalar, operadoras e custo total.'
    },
    {
      href: '/plano-de-saude-por-hospital-e-rede',
      title: 'Plano de Saúde por Hospital e Rede',
      text: 'Conteúdo focado na busca por hospital desejado, rede credenciada e aderência de operadora.'
    }
  ],
  'seguro-auto': [
    {
      href: '/cotacao-seguro-auto',
      title: 'Cotação de Seguro Auto',
      text: 'Página de apoio comercial para busca de cotação com foco em segurado, condutor, veículo e renovação.'
    },
    {
      href: '/renovacao-seguro-auto',
      title: 'Renovação de Seguro Auto',
      text: 'Página focada em renovação com apólice atual, histórico do seguro e melhor comparação comercial.'
    }
  ]
};

function getCategoryUi(product) {
  return (
    CATEGORY_UI[product.category] || {
      highlights: ['Atendimento consultivo', 'Contratação digital', 'Apoio comercial', 'Link oficial da seguradora'],
      heroCaption: 'Produto com orientação comercial, apoio humano e contratação digital.',
      panelTitle: 'Simule com apoio consultivo',
      panelText: 'Entenda regras, benefícios e jornada de contratação antes de seguir para o fluxo oficial.'
    }
  );
}

function mapCards(items = [], meta = []) {
  return items.map((description, index) => {
    const base = meta[index] || meta[meta.length - 1] || {};
    return { ...base, description };
  });
}

function ProductBreadcrumb({ category, name }) {
  return (
    <nav className="product-breadcrumb" aria-label="Breadcrumb">
      <Link href="/">Início</Link>
      <span>/</span>
      <Link href="/#produtos">Produtos</Link>
      <span>/</span>
      <span>{name || category}</span>
    </nav>
  );
}

function SupportLinksSection({ items, title }) {
  if (!items?.length) {
    return null;
  }

  return (
    <section className="section">
      <div className="container">
        <div className="section-head section-head-readable">
          <p className="eyebrow">Conteúdo relacionado</p>
          <h2>{title}</h2>
        </div>
        <div className="premium-product-feature-grid">
          {items.map((item) => (
            <article key={item.href} className="premium-product-feature-card">
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <Link href={item.href} className="link-btn">
                Acessar página
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function buildProductSchemas(product) {
  const productUrl = absoluteUrl(`/produtos/${product.slug}`);
  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: product.name,
    serviceType: product.name,
    category: product.category,
    description: product.shortDescription,
    url: productUrl,
    image: product.heroImage,
    areaServed: 'BR',
    provider: {
      '@type': 'InsuranceAgency',
      name: siteConfig.legalName,
      url: siteConfig.url,
      telephone: siteConfig.phone,
      email: siteConfig.email
    }
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Início',
        item: siteConfig.url
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: product.name,
        item: productUrl
      }
    ]
  };

  const faqSchema =
    product.faqs?.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: product.faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.q,
            acceptedAnswer: {
              '@type': 'Answer',
              text: faq.a
            }
          }))
        }
      : null;

  return [buildOrganizationSchema(), serviceSchema, breadcrumbSchema, faqSchema].filter(Boolean);
}

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export function generateMetadata({ params }) {
  const product = getProductBySlug(params.slug);
  if (!product) {
    return {};
  }

  return buildPageMetadata({
    title: product.name,
    description: product.shortDescription,
    path: `/produtos/${product.slug}`,
    image: product.heroImage
  });
}

export default function ProductPage({ params }) {
  const product = getProductBySlug(params.slug);

  if (!product) {
    notFound();
  }

  const isResidential = product.slug === 'residencial-essencial';
  const isSurety = product.slug === 'seguro-fianca';
  const isPropertyInsurance = product.slug === 'seguro-imobiliario';
  const supportsPremiumIntake = product.slug === 'plano-saude' || product.slug === 'seguro-auto';
  const categoryUi = getCategoryUi(product);
  const genericHighlights = product.highlights?.length ? product.highlights : categoryUi.highlights;
  const genericValueCards = mapCards(product.overview, GENERIC_VALUE_META);
  const genericCoverageCards = mapCards(product.coverages, GENERIC_COVERAGE_META);
  const genericProfileCards = mapCards(product.whoItsFor, GENERIC_PROFILE_META);
  const genericTrustItems = [
    {
      icon: 'shield',
      title: '30 anos de atuação',
      text: 'Consultoria comercial para orientar decisão, reduzir dúvida e acelerar fechamento.'
    },
    {
      icon: 'clock',
      title: 'Fluxo digital objetivo',
      text: 'A H Soares direciona para a contratação oficial no momento certo, com menos atrito.'
    },
    {
      icon: 'chat',
      title: 'WhatsApp direto',
      text: 'Canal rápido para tirar dúvidas, ajustar leitura comercial e apoiar a conversão.'
    }
  ];
  const residentialTrustItems = [
    { icon: 'shield', title: '30 anos de atuação', text: 'Consultoria comercial para proteger o patrimônio com leitura mais estratégica.' },
    { icon: 'clock', title: 'Contratação digital', text: 'Fluxo ágil com envio para o ambiente oficial da Porto no momento certo.' },
    { icon: 'chat', title: 'Apoio humano real', text: 'WhatsApp direto para orientar cobertura, valores e dúvidas de fechamento.' }
  ];
  const suretyTrustItems = [
    {
      icon: 'shield',
      title: 'Especialidade da H Soares',
      text: 'Seguro Fiança com operação comercial estruturada para locatário, proprietário e imobiliária.'
    },
    {
      icon: 'clock',
      title: 'Agilidade na análise',
      text: 'Fluxo automatizado para dar resposta imediata e acelerar a jornada de locação com mais previsibilidade.'
    },
    {
      icon: 'building',
      title: 'Ferramenta para imobiliárias',
      text: 'Plataforma parceira com análise automática e retorno imediato para operações elegíveis.'
    }
  ];
  const propertyInsuranceTrustItems = [
    {
      icon: 'shield',
      title: 'Seguro da locação',
      text: 'Proteção do imóvel dentro da jornada locatícia com composição mais organizada e profissional.'
    },
    {
      icon: 'clock',
      title: 'Cálculo no mesmo fluxo',
      text: 'O valor do Seguro Imobiliário aparece junto com o Seguro Fiança para acelerar a operação.'
    },
    {
      icon: 'building',
      title: 'Plataforma para parceiros',
      text: 'Imobiliárias parceiras visualizam os valores na hora e podem seguir a contratação no mesmo processo.'
    }
  ];
  const productSchemas = buildProductSchemas(product);
  const supportLinks = SEO_SUPPORT_LINKS[product.slug] || [];

  return (
    <>
      <StructuredData data={productSchemas} />
      <SiteHeader />
      <main className={`product-page product-page--${product.slug}`}>
        {isResidential ? (
          <>
            <section className="section residential-hero">
              <div className="container">
                <ProductBreadcrumb category="Residencial" name={product.name} />
                <div className="residential-hero-grid">
                  <div className="residential-hero-copy">
                    <p className="eyebrow">{product.category}</p>
                    <h1>{product.name}</h1>
                    <p className="subhead">{product.longDescription}</p>
                    <div className="product-highlights">
                      {(product.highlights || []).map((item) => (
                        <span key={item}>{item}</span>
                      ))}
                    </div>
                    <div className="cta-row residential-inline-actions">
                      <a className="btn btn-primary" href={product.portoUrl} target="_blank" rel="noopener noreferrer">
                        Cotar agora
                      </a>
                      <a
                        className="btn btn-ghost"
                        href="https://wa.me/5511972064288?text=Ol%C3%A1%2C%20quero%20simular%20o%20Seguro%20Residencial."
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Falar com especialista
                      </a>
                    </div>
                  </div>
                  <div className="residential-visual-stack">
                    <figure className="residential-hero-media">
                      <SafeImage src={product.heroImage} alt={`${product.name} - H Soares Seguros`} />
                      <figcaption>Proteção residencial com apoio consultivo e contratação digital.</figcaption>
                    </figure>
                    <aside className="residential-cta-panel">
                      <p className="eyebrow">Atendimento H Soares</p>
                      <h2>Simule em poucos minutos</h2>
                      <p>Entenda coberturas, assistências e enquadramento do imóvel antes do envio para contratação.</p>
                      <ul className="residential-cta-list">
                        <li>
                          <PremiumIcon name="document" />
                          <span>Análise consultiva antes do redirecionamento</span>
                        </li>
                        <li>
                          <PremiumIcon name="chat" />
                          <span>WhatsApp direto para acelerar fechamento</span>
                        </li>
                        <li>
                          <PremiumIcon name="shield" />
                          <span>Mais clareza para escolher coberturas e limites</span>
                        </li>
                      </ul>
                    </aside>
                  </div>
                </div>
                <div className="residential-trust-row">
                  {residentialTrustItems.map((item) => (
                    <article key={item.title} className="residential-trust-card">
                      <PremiumIcon name={item.icon} />
                      <div>
                        <h3>{item.title}</h3>
                        <p>{item.text}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="section">
              <div className="container">
                <div className="section-head section-head-readable">
                  <p className="eyebrow">Seguro residencial</p>
                  <h2>O cuidado ideal para o seu cantinho</h2>
                  <p>
                    Uma estrutura mais clara para entender coberturas, assistências e os principais cenários de uso do
                    seguro residencial antes da contratação.
                  </p>
                </div>
                <div className="residential-value-grid">
                  {(product.residentialValueCards || []).map((card) => (
                    <article key={card.title} className="residential-value-card">
                      <PremiumIcon name={card.icon} />
                      <h3>{card.title}</h3>
                      <p>{card.description}</p>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="section">
              <div className="container">
                <div className="section-head">
                  <p className="eyebrow">Coberturas</p>
                  <h2>Conheça as principais proteções do Residencial Essencial</h2>
                </div>
                <div className="coverage-grid">
                  {(product.coverageBlocks || []).map((block, index) => (
                    <article key={block.title} className="coverage-card">
                      <div className="coverage-card-head">
                        <span className={`coverage-icon tone-${block.tone || index + 1}`}>
                          <PremiumIcon
                            name={
                              {
                                fire: 'fire',
                                energy: 'bolt',
                                safety: 'lock',
                                trust: 'family'
                              }[block.tone] || 'shield'
                            }
                          />
                        </span>
                        <h3>{block.title}</h3>
                      </div>
                      <ul>
                        {block.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="section section-soft-blue">
              <div className="container detail-grid">
                <article className="detail-card">
                  <h2>Assistências e serviços</h2>
                  <ul>
                    {(product.assistanceServices || []).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>
                <article className="detail-card">
                  <h2>Como funciona a contratação</h2>
                  <ol>
                    {product.hiringSteps.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ol>
                </article>
              </div>
            </section>

            <section className="section services-carousel-section">
              <div className="container">
                <ServicesCarousel
                  title={product.servicesCarouselTitle || 'Por que contratar o Seguro Residencial'}
                  subtitle={
                    product.servicesCarouselSubtitle ||
                    'Além das coberturas residenciais, conte com assistências para o dia a dia.'
                  }
                  items={product.servicesCarousel || []}
                />
              </div>
            </section>

            <section className="section residential-profile-section">
              <div className="container">
                <div className="section-head section-head-readable">
                  <p className="eyebrow">Perfis de imóvel</p>
                  <h2>Um seguro residencial pensado para diferentes necessidades</h2>
                  <p>
                    Casa, apartamento, imóvel alugado ou residência de temporada exigem leituras diferentes. A H
                    Soares orienta o enquadramento antes do envio para a contratação oficial.
                  </p>
                </div>
                <div className="residential-profile-grid">
                  {(product.residentialProfiles || []).map((item) => (
                    <article key={item.title} className="residential-profile-card">
                      <PremiumIcon name={item.icon} />
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                      <a
                        className="link-btn"
                        href="https://wa.me/5511972064288?text=Ol%C3%A1%2C%20quero%20entender%20melhor%20o%20Seguro%20Residencial."
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Falar com especialista
                      </a>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="section section-soft-blue">
              <div className="container detail-grid">
                <article className="detail-card">
                  <h2>Como funciona a contratação</h2>
                  <ol>
                    {product.hiringSteps.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ol>
                </article>
                <article className="detail-card">
                  <h2>Por que contratar com a H Soares</h2>
                  <ul>
                    {product.overview.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>
              </div>
            </section>

            <section className="section">
              <div className="container faq-shell">
                <h2>Dúvidas frequentes</h2>
                <div className="faq-list">
                  {product.faqs.map((faq) => (
                    <details key={faq.q}>
                      <summary>{faq.q}</summary>
                      <p>{faq.a}</p>
                    </details>
                  ))}
                </div>
              </div>
            </section>

            <section className="section">
              <div className="container">
                <ProductConversion product={product} />
              </div>
            </section>
          </>
        ) : isSurety ? (
          <>
            <section className="section premium-product-hero surety-hero">
              <div className="container">
                <ProductBreadcrumb category="Locação" name={product.name} />
                <div className="premium-product-grid surety-hero-grid">
                  <div className="premium-product-copy surety-copy">
                    <p className="eyebrow">{product.category}</p>
                    <h1>{product.name}</h1>
                    <p className="subhead">{product.longDescription}</p>
                    <div className="product-highlights">
                      {(product.highlights || []).map((item) => (
                        <span key={item}>{item}</span>
                      ))}
                    </div>
                    <div className="cta-row premium-product-actions">
                      <PremiumLeadCapture product={product} mode="inline" />
                      <a
                        className="btn btn-ghost"
                        href={product.fiancaPlatform?.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Área da imobiliária
                      </a>
                    </div>
                    <p className="surety-helper-text">
                      Solução para locatário, proprietário e imobiliária com operação mais digital, resposta imediata e
                      mais velocidade para fechar a locação.
                    </p>
                  </div>
                  <div className="premium-product-visual surety-visual">
                    <figure className="premium-product-media surety-media">
                      <SafeImage src={product.heroImage} alt={`${product.name} - H Soares Seguros`} />
                      <figcaption>
                        Garantia locatícia com plataforma, resultado na hora e jornada pensada para acelerar a locação.
                      </figcaption>
                    </figure>
                    <aside className="premium-product-panel surety-panel">
                      <p className="eyebrow">Operação H Soares</p>
                      <h2>Automação que acelera a locação</h2>
                      <p>
                        A plataforma da H Soares foi desenhada para imobiliárias parceiras terem retorno imediato,
                        operarem a qualquer horário e avançarem a locação com muito mais velocidade.
                      </p>
                      <ul className="premium-product-panel-list">
                        <li>
                          <PremiumIcon name="clock" />
                          <span>Análise na hora para operações elegíveis dentro da plataforma</span>
                        </li>
                        <li>
                          <PremiumIcon name="building" />
                          <span>Uso a qualquer dia e horário pelas imobiliárias parceiras</span>
                        </li>
                        <li>
                          <PremiumIcon name="shield" />
                          <span>Seguro Fiança e Seguro Imobiliário no mesmo fluxo da locação</span>
                        </li>
                      </ul>
                    </aside>
                  </div>
                </div>
                <div className="premium-product-trust-row surety-trust-row">
                  {suretyTrustItems.map((item) => (
                    <article key={item.title} className="premium-product-trust-card">
                      <PremiumIcon name={item.icon} />
                      <div>
                        <h3>{item.title}</h3>
                        <p>{item.text}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="section">
              <div className="container">
                <div className="section-head section-head-readable">
                  <p className="eyebrow">Para quem é</p>
                  <h2>Uma estrutura de Seguro Fiança pensada para toda a operação de locação</h2>
                  <p>
                    O produto atende interesses diferentes dentro da locação. Por isso a H Soares apresenta a jornada
                    com foco em quem precisa alugar, em quem precisa proteger o contrato e em quem opera várias
                    locações ao mesmo tempo.
                  </p>
                </div>
                <div className="surety-audience-grid">
                  {(product.fiancaAudienceCards || []).map((card) => (
                    <article key={card.title} className="surety-audience-card">
                      <PremiumIcon name={card.icon} />
                      <h3>{card.title}</h3>
                      <ul>
                        {card.points.map((point) => (
                          <li key={point}>{point}</li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="section section-soft-blue surety-platform-section">
              <div className="container">
                <div className="section-head section-head-readable">
                  <p className="eyebrow">Imobiliárias parceiras</p>
                  <h2>Análise automática como diferencial real de atendimento</h2>
                  <p>
                    Para imobiliárias cadastradas, a H Soares disponibiliza uma plataforma própria que devolve o
                    resultado na hora, calcula o Seguro Imobiliário junto e permite seguir a locação com muito mais
                    velocidade.
                  </p>
                </div>
                <div className="surety-platform-grid">
                  <article className="surety-platform-card surety-platform-card-primary">
                    <p className="eyebrow">Plataforma H Soares</p>
                    <h3>{product.fiancaPlatform?.title}</h3>
                    <p>{product.fiancaPlatform?.description}</p>
                    <ul>
                      {(product.fiancaPlatform?.bullets || []).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <div className="cta-row surety-platform-actions">
                      <a
                        className="btn btn-primary"
                        href={product.fiancaPlatform?.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {product.fiancaPlatform?.ctaLabel}
                      </a>
                      <a
                        className="btn btn-ghost"
                        href="https://wa.me/5511972064288?text=Ol%C3%A1%2C%20quero%20cadastrar%20minha%20imobili%C3%A1ria%20para%20usar%20a%20plataforma%20de%20Seguro%20Fian%C3%A7a."
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Quero cadastrar minha imobiliária
                      </a>
                    </div>
                  </article>

                  <div className="surety-platform-side">
                    <article className="surety-platform-stat">
                      <strong>3 seguradoras integradas</strong>
                      <p>Comparação operacional com Porto Seguro, Tokio Marine e Too Seguros na mesma jornada.</p>
                    </article>
                    <article className="surety-platform-stat">
                      <strong>Seguro Imobiliário junto</strong>
                      <p>O cálculo do seguro incêndio já aparece no mesmo fluxo, com visualização de valores na hora.</p>
                    </article>
                    <article className="surety-platform-stat">
                      <strong>Operação 24 horas</strong>
                      <p>Fluxo disponível para a imobiliária parceira avançar a locação no mesmo dia, sem depender de horário comercial.</p>
                    </article>
                  </div>
                </div>
              </div>
            </section>

            <section className="section">
              <div className="container">
                <div className="section-head section-head-readable">
                  <p className="eyebrow">Como funciona</p>
                  <h2>Veja como a solicitação do Seguro Fiança acontece hoje na plataforma</h2>
                  <p>
                    O foco da operação está cada vez mais na automação: resposta na hora, cálculo integrado e mais
                    velocidade para a imobiliária seguir com a locação.
                  </p>
                </div>
                <div className="surety-steps-grid">
                  {(product.fiancaSteps || []).map((step, index) => (
                    <article key={step.title} className="surety-step-card">
                      <span className="surety-step-index">{String(index + 1).padStart(2, '0')}</span>
                      <h3>{step.title}</h3>
                      <p>{step.description}</p>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="section">
              <div className="container">
                <div className="section-head">
                  <p className="eyebrow">Coberturas</p>
                  <h2>Entenda as composições mais relevantes dentro da garantia locatícia</h2>
                </div>
                <div className="coverage-grid">
                  {(product.fiancaCoverageBlocks || []).map((block) => (
                    <article key={block.title} className="coverage-card">
                      <div className="coverage-card-head">
                        <span className={`coverage-icon tone-${block.tone || 'safety'}`}>
                          <PremiumIcon name={block.icon || 'shield'} />
                        </span>
                        <h3>{block.title}</h3>
                      </div>
                      <ul>
                        {block.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="section section-soft-blue">
              <div className="container detail-grid">
                {(product.fiancaOperationCards || []).map((card) => (
                  <article key={card.title} className="detail-card">
                    <h2>{card.title}</h2>
                    <ul>
                      {card.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </section>

            <section className="section">
              <div className="container">
                <div className="section-head section-head-readable">
                  <p className="eyebrow">Seguradoras operadas</p>
                  <h2>Atuação com múltiplas seguradoras para buscar a melhor rota de aprovação</h2>
                  <p>
                    A H Soares opera o Seguro Fiança com seguradoras parceiras para estruturar a jornada com mais
                    flexibilidade comercial e melhor enquadramento por perfil.
                  </p>
                </div>
                <div className="surety-partners-grid">
                  {(product.fiancaPartners || []).map((partner) => (
                    <article key={partner.name} className="surety-partner-card">
                      <img src={partner.logo} alt={partner.name} />
                      <p>{partner.name}</p>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="section">
              <div className="container faq-shell">
                <h2>Dúvidas frequentes</h2>
                <div className="faq-list">
                  {product.faqs.map((faq) => (
                    <details key={faq.q}>
                      <summary>{faq.q}</summary>
                      <p>{faq.a}</p>
                    </details>
                  ))}
                </div>
              </div>
            </section>

            <SupportLinksSection
              items={supportLinks}
              title="Mais contexto para quem está decidindo a locação"
            />

            <section className="section">
              <div className="container">
                <PremiumLeadCapture product={product} mode="section" />
              </div>
            </section>
          </>
        ) : isPropertyInsurance ? (
          <>
            <section className="section premium-product-hero surety-hero">
              <div className="container">
                <ProductBreadcrumb category="Locação" name={product.name} />
                <div className="premium-product-grid surety-hero-grid">
                  <div className="premium-product-copy surety-copy">
                    <p className="eyebrow">{product.category}</p>
                    <h1>{product.name}</h1>
                    <p className="subhead">{product.longDescription}</p>
                    <div className="product-highlights">
                      {(product.highlights || []).map((item) => (
                        <span key={item}>{item}</span>
                      ))}
                    </div>
                    <div className="cta-row premium-product-actions">
                      <a className="btn btn-primary" href={product.portoUrl} target="_blank" rel="noopener noreferrer">
                        Entender o seguro
                      </a>
                      <a
                        className="btn btn-ghost"
                        href={product.imobiliarioPlatform?.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Área da imobiliária
                      </a>
                    </div>
                    <p className="surety-helper-text">
                      Seguro importante para a locação, com foco em incêndio e cálculo automático dentro do mesmo fluxo
                      do Seguro Fiança.
                    </p>
                  </div>
                  <div className="premium-product-visual surety-visual">
                    <figure className="premium-product-media surety-media">
                      <SafeImage src={product.heroImage} alt={`${product.name} - H Soares Seguros`} />
                      <figcaption>
                        Proteção do imóvel com visualização de valor imediata dentro da operação de locação.
                      </figcaption>
                    </figure>
                    <aside className="premium-product-panel surety-panel">
                      <p className="eyebrow">Operação H Soares</p>
                      <h2>Seguro do imóvel sem quebrar a jornada da locação</h2>
                      <p>
                        Na plataforma da H Soares, o Seguro Imobiliário já entra no mesmo fluxo do Seguro Fiança para a
                        imobiliária parceira visualizar valores e seguir a contratação no mesmo processo.
                      </p>
                      <ul className="premium-product-panel-list">
                        <li>
                          <PremiumIcon name="fire" />
                          <span>Cobertura básica voltada à proteção do imóvel na locação</span>
                        </li>
                        <li>
                          <PremiumIcon name="clock" />
                          <span>Valor calculado automaticamente junto da análise do Fiança</span>
                        </li>
                        <li>
                          <PremiumIcon name="building" />
                          <span>Fluxo único para a imobiliária seguir com mais rapidez</span>
                        </li>
                      </ul>
                    </aside>
                  </div>
                </div>
                <div className="premium-product-trust-row surety-trust-row">
                  {propertyInsuranceTrustItems.map((item) => (
                    <article key={item.title} className="premium-product-trust-card">
                      <PremiumIcon name={item.icon} />
                      <div>
                        <h3>{item.title}</h3>
                        <p>{item.text}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="section">
              <div className="container">
                <div className="section-head section-head-readable">
                  <p className="eyebrow">Para quem faz sentido</p>
                  <h2>Uma proteção pensada para acompanhar a locação com mais velocidade</h2>
                  <p>
                    O Seguro Imobiliário faz mais sentido quando ele não vira uma segunda esteira operacional. Na H
                    Soares, a proposta é integrar esse seguro ao fluxo que a imobiliária já usa para fechar a locação.
                  </p>
                </div>
                <div className="surety-audience-grid">
                  {(product.imobiliarioAudienceCards || []).map((card) => (
                    <article key={card.title} className="surety-audience-card">
                      <PremiumIcon name={card.icon} />
                      <h3>{card.title}</h3>
                      <ul>
                        {card.points.map((point) => (
                          <li key={point}>{point}</li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="section section-soft-blue surety-platform-section">
              <div className="container">
                <div className="section-head section-head-readable">
                  <p className="eyebrow">Plataforma da imobiliária</p>
                  <h2>Seguro Imobiliário integrado ao mesmo processo do Seguro Fiança</h2>
                  <p>
                    Em vez de uma cotação separada, a plataforma parceira da H Soares já apresenta o Seguro Imobiliário
                    na mesma jornada em que a imobiliária analisa o Seguro Fiança.
                  </p>
                </div>
                <div className="surety-platform-grid">
                  <article className="surety-platform-card surety-platform-card-primary">
                    <p className="eyebrow">Integração operacional</p>
                    <h3>{product.imobiliarioPlatform?.title}</h3>
                    <p>{product.imobiliarioPlatform?.description}</p>
                    <ul>
                      {(product.imobiliarioPlatform?.bullets || []).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <div className="cta-row surety-platform-actions">
                      <a
                        className="btn btn-primary"
                        href={product.imobiliarioPlatform?.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {product.imobiliarioPlatform?.ctaLabel}
                      </a>
                      <a
                        className="btn btn-ghost"
                        href="https://wa.me/5511972064288?text=Ol%C3%A1%2C%20quero%20cadastrar%20minha%20imobili%C3%A1ria%20para%20usar%20a%20plataforma%20com%20Seguro%20Fian%C3%A7a%20e%20Seguro%20Imobili%C3%A1rio."
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Quero cadastrar minha imobiliária
                      </a>
                    </div>
                  </article>

                  <div className="surety-platform-side">
                    <article className="surety-platform-stat">
                      <strong>Junto do Seguro Fiança</strong>
                      <p>O Seguro Imobiliário entra na mesma operação para a locação não perder ritmo.</p>
                    </article>
                    <article className="surety-platform-stat">
                      <strong>Valor na hora</strong>
                      <p>A plataforma mostra os valores no mesmo instante para apoiar a decisão da imobiliária parceira.</p>
                    </article>
                    <article className="surety-platform-stat">
                      <strong>Contratação no mesmo fluxo</strong>
                      <p>A jornada segue de forma contínua para reduzir etapas separadas e ganhar velocidade operacional.</p>
                    </article>
                  </div>
                </div>
              </div>
            </section>

            <section className="section">
              <div className="container">
                <div className="section-head section-head-readable">
                  <p className="eyebrow">Como funciona</p>
                  <h2>Veja como o seguro do imóvel entra na jornada da locação</h2>
                  <p>
                    A integração com a plataforma H Soares faz o Seguro Imobiliário deixar de ser uma etapa isolada e
                    passar a acompanhar a locação de forma muito mais fluida.
                  </p>
                </div>
                <div className="surety-steps-grid">
                  {(product.imobiliarioSteps || []).map((step, index) => (
                    <article key={step.title} className="surety-step-card">
                      <span className="surety-step-index">{String(index + 1).padStart(2, '0')}</span>
                      <h3>{step.title}</h3>
                      <p>{step.description}</p>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="section">
              <div className="container">
                <div className="section-head">
                  <p className="eyebrow">Coberturas</p>
                  <h2>Os pontos principais do Seguro Imobiliário para locação</h2>
                </div>
                <div className="coverage-grid">
                  {(product.imobiliarioCoverageBlocks || []).map((block) => (
                    <article key={block.title} className="coverage-card">
                      <div className="coverage-card-head">
                        <span className={`coverage-icon tone-${block.tone || 'safety'}`}>
                          <PremiumIcon name={block.icon || 'shield'} />
                        </span>
                        <h3>{block.title}</h3>
                      </div>
                      <ul>
                        {block.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="section section-soft-blue">
              <div className="container detail-grid">
                {(product.imobiliarioOperationCards || []).map((card) => (
                  <article key={card.title} className="detail-card">
                    <h2>{card.title}</h2>
                    <ul>
                      {card.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </section>

            <section className="section">
              <div className="container faq-shell">
                <h2>Dúvidas frequentes</h2>
                <div className="faq-list">
                  {product.faqs.map((faq) => (
                    <details key={faq.q}>
                      <summary>{faq.q}</summary>
                      <p>{faq.a}</p>
                    </details>
                  ))}
                </div>
              </div>
            </section>

            <SupportLinksSection
              items={supportLinks}
              title="Leituras complementares sobre proteção do imóvel na locação"
            />

            <section className="section">
              <div className="container">
                <ProductConversion product={product} />
              </div>
            </section>
          </>
        ) : (
          <>
            <section className="section premium-product-hero">
              <div className="container">
                <ProductBreadcrumb category={product.category} name={product.name} />
                <div className="premium-product-grid">
                  <div className="premium-product-copy">
                    <p className="eyebrow">{product.category}</p>
                    <h1>{product.name}</h1>
                    <p className="subhead">{product.longDescription}</p>
                    <div className="product-highlights">
                      {genericHighlights.map((item) => (
                        <span key={item}>{item}</span>
                      ))}
                    </div>
                    <div className="cta-row premium-product-actions">
                      {supportsPremiumIntake ? (
                        <PremiumLeadCapture product={product} mode="inline" />
                      ) : (
                        <a className="btn btn-primary" href={product.portoUrl} target="_blank" rel="noopener noreferrer">
                          Cotar agora
                        </a>
                      )}
                      <a
                        className="btn btn-ghost"
                        href={`https://wa.me/5511972064288?text=${encodeURIComponent(`Olá, quero falar sobre ${product.name}.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Falar com especialista
                      </a>
                    </div>
                  </div>
                  <div className="premium-product-visual">
                    <figure className="premium-product-media">
                      <SafeImage src={product.heroImage} alt={`${product.name} - H Soares Seguros`} />
                      <figcaption>{categoryUi.heroCaption}</figcaption>
                    </figure>
                    <aside className="premium-product-panel">
                      <p className="eyebrow">Atendimento H Soares</p>
                      <h2>{categoryUi.panelTitle}</h2>
                      <p>{categoryUi.panelText}</p>
                      <ul className="premium-product-panel-list">
                        <li>
                          <PremiumIcon name="document" />
                          <span>Análise consultiva antes do redirecionamento</span>
                        </li>
                        <li>
                          <PremiumIcon name="chat" />
                          <span>WhatsApp direto para acelerar o fechamento</span>
                        </li>
                        <li>
                          <PremiumIcon name="shield" />
                          <span>Mais clareza para avaliar cobertura, regras e aderência</span>
                        </li>
                      </ul>
                    </aside>
                  </div>
                </div>
                <div className="premium-product-trust-row">
                  {genericTrustItems.map((item) => (
                    <article key={item.title} className="premium-product-trust-card">
                      <PremiumIcon name={item.icon} />
                      <div>
                        <h3>{item.title}</h3>
                        <p>{item.text}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="section">
              <div className="container">
                <div className="section-head section-head-readable">
                  <p className="eyebrow">Diferenciais</p>
                  <h2>Uma leitura mais clara para decidir com segurança</h2>
                  <p>
                    Estruturamos os principais argumentos do produto para facilitar comparação, entendimento e avanço
                    para a contratação oficial.
                  </p>
                </div>
                <div className="premium-product-feature-grid">
                  {genericValueCards.map((card) => (
                    <article key={`${card.title}-${card.description}`} className="premium-product-feature-card">
                      <PremiumIcon name={card.icon} />
                      <h3>{card.title}</h3>
                      <p>{card.description}</p>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="section">
              <div className="container">
                <div className="section-head">
                  <p className="eyebrow">Coberturas e condições</p>
                  <h2>Os pontos mais importantes antes da contratação</h2>
                </div>
                <div className="coverage-grid">
                  {genericCoverageCards.map((card) => (
                    <article key={`${card.title}-${card.description}`} className="coverage-card">
                      <div className="coverage-card-head">
                        <span className={`coverage-icon tone-${card.tone || 'safety'}`}>
                          <PremiumIcon name={card.icon} />
                        </span>
                        <h3>{card.title}</h3>
                      </div>
                      <p>{card.description}</p>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="section premium-product-profile-section">
              <div className="container">
                <div className="section-head section-head-readable">
                  <p className="eyebrow">Para quem é indicado</p>
                  <h2>Perfis que costumam se beneficiar mais desse produto</h2>
                  <p>
                    Essa leitura ajuda a posicionar o produto com mais aderência, antes de enviar o cliente para o
                    link oficial.
                  </p>
                </div>
                <div className="premium-product-profile-grid">
                  {genericProfileCards.map((card) => (
                    <article key={`${card.title}-${card.description}`} className="premium-product-profile-card">
                      <PremiumIcon name={card.icon} />
                      <h3>{card.title}</h3>
                      <p>{card.description}</p>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="section section-soft-blue">
              <div className="container detail-grid">
                <article className="detail-card">
                  <h2>Etapas de contratação com a H Soares</h2>
                  <ol>
                    {product.hiringSteps.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ol>
                </article>
                <article className="detail-card">
                  <h2>Atendimento comercial</h2>
                  <ul>
                    <li>Orientação consultiva antes do redirecionamento para a contratação oficial.</li>
                    <li>Canal direto no WhatsApp para reduzir abandono e esclarecer dúvidas de jornada.</li>
                    <li>Suporte da H Soares para posicionar o produto com mais assertividade comercial.</li>
                  </ul>
                </article>
              </div>
            </section>

            <section className="section">
              <div className="container faq-shell">
                <h2>Dúvidas frequentes</h2>
                <div className="faq-list">
                  {product.faqs.map((faq) => (
                    <details key={faq.q}>
                      <summary>{faq.q}</summary>
                      <p>{faq.a}</p>
                    </details>
                  ))}
                </div>
              </div>
            </section>

            <SupportLinksSection
              items={supportLinks}
              title="Leituras adicionais para aprofundar a decisão"
            />

            <section className="section">
              <div className="container">
                {supportsPremiumIntake ? <PremiumLeadCapture product={product} mode="section" /> : <ProductConversion product={product} />}
              </div>
            </section>
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
