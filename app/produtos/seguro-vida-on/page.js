import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProductConversion, ProductCtaButton } from '@/components/product-conversion';
import { SafeImage } from '@/components/safe-image';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { StructuredData } from '@/components/structured-data';
import { TrackedExternalLink } from '@/components/tracked-external-link';
import { getProductBySlug } from '@/lib/products';
import { absoluteUrl, buildOrganizationSchema, buildPageMetadata, siteConfig } from '@/lib/site';

const PAGE_PATH = '/produtos/seguro-vida-on';
const PAGE_URL = absoluteUrl(PAGE_PATH);
const OG_IMAGE = absoluteUrl('/assets/logo-hsoares-transparent.png');
const WHATSAPP_LINK =
  'https://wa.me/5511972064288?text=Ol%C3%A1%2C%20quero%20entender%20melhor%20o%20Seguro%20de%20Vida.';

export const metadata = {
  ...buildPageMetadata({
    title: 'Seguro de Vida Individual e Familiar | Cotação Online | H Soares',
    description:
      'Seguro de Vida com foco em proteção financeira, renda familiar e planejamento para diferentes perfis. Cotação online com apoio consultivo da H Soares.',
    path: PAGE_PATH,
    image: OG_IMAGE
  }),
  keywords: ['seguro de vida', 'seguro de vida individual', 'seguro de vida familiar', 'cotacao seguro de vida', 'seguro de vida online']
};

const trustItems = [
  {
    icon: 'shield',
    title: 'Proteção financeira planejada',
    text: 'A página organiza a contratação para quem quer proteger renda, família e compromissos financeiros com mais critério.'
  },
  {
    icon: 'family',
    title: 'Leitura clara do papel do seguro',
    text: 'A H Soares ajuda a traduzir o valor prático do Seguro de Vida antes da contratação digital no fluxo oficial.'
  },
  {
    icon: 'chat',
    title: 'Apoio consultivo de verdade',
    text: 'Se ainda houver dúvida sobre coberturas, momento ideal ou perfil, existe canal direto para orientação antes do clique final.'
  }
];

const valueCards = [
  {
    icon: 'shield',
    title: 'Mais tranquilidade para quem depende da sua renda',
    text: 'O Seguro de Vida tende a fazer mais sentido quando outras pessoas dependem da sua capacidade de gerar receita e manter a rotina financeira da família.'
  },
  {
    icon: 'document',
    title: 'Planejamento melhor para custos fixos e compromissos',
    text: 'Financiamento, aluguel, escola, despesas domésticas e reserva de emergência ficam menos expostos quando existe uma estrutura de proteção financeira adequada.'
  },
  {
    icon: 'clock',
    title: 'Decisão mais inteligente antes do imprevisto',
    text: 'Seguro de Vida costuma ser uma decisão melhor quando nasce de planejamento e comparação orientada, não de urgência.'
  }
];

const coverageCards = [
  {
    icon: 'shield',
    tone: 'safety',
    title: 'Proteção financeira em eventos previstos',
    text: 'As coberturas dependem do produto contratado e das condições da seguradora, mas a lógica central é proteger financeiramente o segurado e seus beneficiários em eventos previstos na apólice.'
  },
  {
    icon: 'family',
    tone: 'trust',
    title: 'Apoio para renda e estabilidade familiar',
    text: 'O Seguro de Vida costuma ser analisado por quem quer reduzir o impacto financeiro que um evento grave poderia causar na rotina da família.'
  },
  {
    icon: 'document',
    tone: 'energy',
    title: 'Coberturas e regras variam conforme perfil',
    text: 'Capital segurado, elegibilidade, análise e composição final dependem do produto escolhido, da seguradora e das informações apresentadas na contratação.'
  }
];

const profileCards = [
  {
    icon: 'family',
    title: 'Pais e mães que sustentam a rotina da casa',
    text: 'Quando a renda da família depende de uma ou duas pessoas, o seguro tende a ganhar valor como ferramenta de continuidade financeira.'
  },
  {
    icon: 'chat',
    title: 'Profissionais autônomos ou empresários',
    text: 'Quem não conta com uma estrutura corporativa forte costuma olhar o Seguro de Vida como uma camada importante de previsibilidade.'
  },
  {
    icon: 'shield',
    title: 'Quem quer organizar proteção patrimonial e pessoal',
    text: 'Mesmo quem ainda não tem dependentes pode usar o produto como parte de um planejamento financeiro mais maduro.'
  }
];

const planningCards = [
  {
    title: 'Quando costuma fazer mais sentido',
    items: [
      'Quando outras pessoas dependem diretamente da sua renda.',
      'Quando existem custos fixos que não poderiam parar de ser pagos.',
      'Quando o objetivo é organizar proteção antes de um imprevisto.'
    ]
  },
  {
    title: 'O que vale comparar antes da contratação',
    items: [
      'Valor de proteção compatível com o momento de vida e responsabilidade financeira.',
      'Regras do produto, elegibilidade e eventuais limitações da seguradora.',
      'Qualidade da jornada digital e clareza para entender a apólice antes do envio final.'
    ]
  }
];

const journeySteps = [
  {
    number: '01',
    title: 'Entenda o objetivo da proteção',
    text: 'O primeiro passo é definir para quem e para o que o seguro precisa servir: família, renda, compromissos fixos ou planejamento pessoal.'
  },
  {
    number: '02',
    title: 'Compare com apoio consultivo, se precisar',
    text: 'A H Soares pode ajudar você a enxergar o valor prático do produto antes de seguir para a contratação oficial.'
  },
  {
    number: '03',
    title: 'Siga para a jornada digital',
    text: 'A contratação acontece no ambiente oficial da seguradora, com análise e critérios próprios conforme o produto vigente.'
  },
  {
    number: '04',
    title: 'Guarde a apólice e revise sempre que o momento mudar',
    text: 'Mudança de renda, filhos, casamento ou novos compromissos financeiros podem pedir revisão do seguro ao longo do tempo.'
  }
];

const faqs = [
  {
    q: 'Seguro de Vida é só para quem tem filhos?',
    a: 'Não. Ele costuma ganhar mais urgência quando existem dependentes financeiros, mas também pode fazer sentido para quem quer organizar proteção patrimonial e previsibilidade pessoal.'
  },
  {
    q: 'Seguro de Vida é igual a plano de saúde?',
    a: 'Não. Plano de saúde é voltado para assistência médica. Seguro de Vida trabalha a proteção financeira em eventos previstos na apólice.'
  },
  {
    q: 'Posso contratar Seguro de Vida online?',
    a: 'Sim. A jornada pode ser digital, com análise e aceitação conforme o produto disponível e os critérios da seguradora no momento da contratação.'
  },
  {
    q: 'Como saber quanto de proteção faz sentido para mim?',
    a: 'O ideal é relacionar o seguro à renda, aos compromissos fixos, à existência de dependentes e ao impacto financeiro que um imprevisto causaria na sua rotina.'
  },
  {
    q: 'A H Soares aprova o seguro?',
    a: 'Não. A H Soares entra como apoio consultivo. A análise final, a aceitação e a emissão da apólice são feitas pela seguradora no fluxo oficial.'
  }
];

const supportLinks = [
  {
    href: '/institucional',
    title: 'Conheça a corretora antes de contratar',
    text: 'Veja quem é a H Soares, como funciona o atendimento e por que a orientação consultiva pode ajudar nesta decisão.'
  },
  {
    href: '/contato',
    title: 'Fale com a equipe para tirar dúvidas',
    text: 'Use o canal de contato para alinhar momento de vida, objetivo da proteção e próximos passos antes da contratação.'
  },
  {
    href: '/seguradoras',
    title: 'Veja a estrutura institucional das seguradoras',
    text: 'Acesse a página de seguradoras e navegue por canais oficiais e contexto adicional para contratar com mais confiança.'
  }
];

function LifeIcon({ name }) {
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
    family: (
      <svg {...common}>
        <path d="M7.5 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
        <path d="M16.5 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
        <path d="M3.5 19c0-2.5 2.3-4.5 5-4.5s5 2 5 4.5" />
        <path d="M13.8 19c0-1.9 1.6-3.5 3.7-3.5 1.4 0 2.6 0.6 3.2 1.7" />
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
    ),
    clock: (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    )
  };

  return <span className="premium-icon">{icons[name] || icons.shield}</span>;
}

export default function SeguroVidaPage() {
  const product = getProductBySlug('seguro-vida-on');

  if (!product) {
    notFound();
  }

  const conversionProduct = {
    ...product,
    conversionTitle: 'Receba ajuda para entender o Seguro de Vida antes de contratar',
    conversionDescription:
      'Se quiser, deixe seus dados e receba uma orientação rápida da H Soares antes de seguir. Se já estiver decidido, continue para a contratação oficial.',
    conversionPrimaryLabel: 'Quero orientação rápida',
    conversionSecondaryLabel: 'Ir direto para a contratação'
  };

  const structuredData = [
    buildOrganizationSchema(),
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Seguro de Vida Individual e Familiar',
      serviceType: 'Seguro de Vida',
      description:
        'Seguro de Vida com foco em proteção financeira, renda familiar e planejamento para diferentes perfis, com apoio consultivo da H Soares.',
      provider: {
        '@type': ['InsuranceAgency', 'Organization'],
        name: siteConfig.name,
        url: siteConfig.url,
        telephone: siteConfig.phone,
        email: siteConfig.email
      },
      areaServed: {
        '@type': 'Country',
        name: 'Brasil'
      },
      url: PAGE_URL,
      image: OG_IMAGE
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Início',
          item: absoluteUrl('/')
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Produtos',
          item: absoluteUrl('/#produtos')
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Seguro de Vida',
          item: PAGE_URL
        }
      ]
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.a
        }
      }))
    }
  ];

  return (
    <>
      <StructuredData data={structuredData} />
      <SiteHeader />
      <main className="product-page product-page--seguro-vida-on">
        <section className="section premium-product-hero">
          <div className="container">
            <nav className="product-breadcrumb" aria-label="Breadcrumb">
              <Link href="/">Início</Link>
              <span>/</span>
              <Link href="/#produtos">Produtos</Link>
              <span>/</span>
              <span>Seguro de Vida</span>
            </nav>

            <div className="premium-product-grid">
              <div className="premium-product-copy">
                <p className="eyebrow">Vida</p>
                <h1>Seguro de Vida para proteger renda, dependentes e planejamento familiar com mais clareza</h1>
                <p className="subhead">
                  Seguro de Vida não é só sobre um produto financeiro. É sobre reduzir o impacto que um imprevisto
                  relevante poderia causar na estabilidade de quem depende de você, dos seus compromissos e da sua
                  renda.
                </p>
                <div className="product-highlights">
                  <span>Proteção financeira pessoal e familiar</span>
                  <span>Contratação digital com apoio consultivo</span>
                  <span>Leitura clara antes do fluxo oficial</span>
                  <span>Jornada pensada para diferentes perfis</span>
                </div>
                <div className="cta-row premium-product-actions">
                  <ProductCtaButton
                    product={product}
                    label="Quero cotar Seguro de Vida"
                    payload={{ cta_position: 'hero_primary', page_section: 'hero', template_type: 'product_page' }}
                  />
                  <TrackedExternalLink
                    href={WHATSAPP_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost"
                    eventType="whatsapp_click"
                    productSlug={product.slug}
                    objective="life_insurance_support"
                    payload={{ placement: 'hero' }}
                  >
                    Tirar dúvida no WhatsApp
                  </TrackedExternalLink>
                </div>
              </div>

              <div className="premium-product-visual">
                <figure className="premium-product-media">
                  <SafeImage src={product.heroImage} alt="Família representando planejamento e proteção financeira" loading="eager" />
                  <figcaption>Seguro de Vida com leitura mais clara para quem quer planejar proteção antes do imprevisto.</figcaption>
                </figure>
                <aside className="premium-product-panel">
                  <p className="eyebrow">Atendimento H Soares</p>
                  <h2>Decisão melhor antes da contratação</h2>
                  <p>
                    A H Soares ajuda você a entender o papel do Seguro de Vida, comparar o contexto da sua decisão e
                    seguir com mais confiança para a jornada oficial.
                  </p>
                  <ul className="premium-product-panel-list">
                    <li>
                      <LifeIcon name="document" />
                      <span>Leitura clara do valor prático do seguro</span>
                    </li>
                    <li>
                      <LifeIcon name="family" />
                      <span>Foco em renda familiar, dependentes e compromissos financeiros</span>
                    </li>
                    <li>
                      <LifeIcon name="chat" />
                      <span>Canal direto para orientação antes do clique final</span>
                    </li>
                  </ul>
                </aside>
              </div>
            </div>

            <div className="premium-product-trust-row">
              {trustItems.map((item) => (
                <article key={item.title} className="premium-product-trust-card">
                  <LifeIcon name={item.icon} />
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
              <p className="eyebrow">Por que contratar</p>
              <h2>Seguro de Vida tende a fazer mais sentido quando a sua ausência teria impacto financeiro real</h2>
              <p>
                A pergunta mais útil não é se o produto existe. É se um evento grave desorganizaria a vida financeira
                da sua família, dos seus dependentes ou da sua própria estabilidade.
              </p>
            </div>
            <div className="premium-product-feature-grid">
              {valueCards.map((card) => (
                <article key={card.title} className="premium-product-feature-card">
                  <LifeIcon name={card.icon} />
                  <h3>{card.title}</h3>
                  <p>{card.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="section-head">
              <p className="eyebrow">Coberturas e regras</p>
              <h2>O que vale entender antes de contratar Seguro de Vida</h2>
            </div>
            <div className="coverage-grid">
              {coverageCards.map((card) => (
                <article key={card.title} className="coverage-card">
                  <div className="coverage-card-head">
                    <span className={`coverage-icon tone-${card.tone}`}>
                      <LifeIcon name={card.icon} />
                    </span>
                    <h3>{card.title}</h3>
                  </div>
                  <p>{card.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section premium-product-profile-section">
          <div className="container">
            <div className="section-head section-head-readable">
              <p className="eyebrow">Para quem faz mais sentido</p>
              <h2>Perfis que costumam enxergar valor mais rápido no Seguro de Vida</h2>
              <p>
                A decisão tende a ficar mais clara quando existe renda centralizada, dependência financeira ou
                necessidade de organizar proteção com antecedência.
              </p>
            </div>
            <div className="premium-product-profile-grid">
              {profileCards.map((card) => (
                <article key={card.title} className="premium-product-profile-card">
                  <LifeIcon name={card.icon} />
                  <h3>{card.title}</h3>
                  <p>{card.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section section-soft-blue">
          <div className="container detail-grid">
            {planningCards.map((card) => (
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
              <p className="eyebrow">Como funciona</p>
              <h2>Uma jornada mais clara para sair da dúvida e seguir para a contratação</h2>
              <p>
                A ideia é organizar o raciocínio antes da etapa oficial, para que a contratação seja consequência de
                uma decisão melhor e não apenas de impulso.
              </p>
            </div>
            <div className="surety-steps-grid">
              {journeySteps.map((step) => (
                <article key={step.number} className="surety-step-card">
                  <span className="surety-step-index">{step.number}</span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container faq-shell">
            <h2>Dúvidas frequentes sobre Seguro de Vida</h2>
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
          <div className="container">
            <div className="section-head section-head-readable">
              <p className="eyebrow">Conteúdo relacionado</p>
              <h2>Mais páginas para apoiar a decisão antes da contratação</h2>
            </div>
            <div className="premium-product-feature-grid">
              {supportLinks.map((item) => (
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

        <section className="section">
          <div className="container">
            <ProductConversion product={conversionProduct} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
