import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProductConversion, ProductCtaButton } from '@/components/product-conversion';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { StructuredData } from '@/components/structured-data';
import { TrackedExternalLink } from '@/components/tracked-external-link';
import { getProductBySlug } from '@/lib/products';
import { absoluteUrl, buildOrganizationSchema, siteConfig } from '@/lib/site';

const PAGE_PATH = '/produtos/seguro-viagem';
const PAGE_URL = absoluteUrl(PAGE_PATH);
const OG_IMAGE = absoluteUrl('/images/seguro-viagem/og-seguro-viagem.jpg');
const WHATSAPP_LINK = 'https://wa.me/5511972064288?text=Ol%C3%A1%21%20Quero%20cotar%20Seguro%20Viagem.';

export const metadata = {
  title: {
    absolute: 'Seguro Viagem Nacional e Internacional | Cotação Online | H Soares Seguros'
  },
  description:
    'Faça sua cotação de Seguro Viagem para viagens nacionais ou internacionais. Proteção para despesas médicas, bagagem, cancelamento e outros imprevistos.',
  keywords: ['seguro viagem', 'seguro viagem internacional', 'seguro viagem nacional', 'cotacao seguro viagem', 'seguro viagem europa'],
  alternates: {
    canonical: PAGE_URL
  },
  openGraph: {
    title: 'Seguro Viagem Nacional e Internacional | H Soares Seguros',
    description:
      'Viaje com mais tranquilidade com proteção para despesas médicas, bagagem, cancelamento e outros imprevistos.',
    url: PAGE_URL,
    siteName: siteConfig.name,
    type: 'website',
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'Seguro Viagem H Soares Seguros'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Seguro Viagem Nacional e Internacional | H Soares Seguros',
    description: 'Cotação online de Seguro Viagem com suporte para viagens nacionais e internacionais.',
    images: [OG_IMAGE]
  }
};

const faqs = [
  {
    question: 'O Seguro Viagem vale a pena mesmo em viagens curtas?',
    answer:
      'Sim. Mesmo em viagens curtas podem acontecer imprevistos como atendimento médico de urgência, problemas com bagagem, atrasos e necessidade de suporte durante o trajeto. O seguro ajuda a reduzir impacto financeiro e operacional.'
  },
  {
    question: 'Posso contratar Seguro Viagem para viagens nacionais?',
    answer:
      'Sim. Existem opções para viagens dentro do Brasil e também para viagens internacionais. O ideal é avaliar destino, duração, perfil dos viajantes e o tipo de cobertura desejada.'
  },
  {
    question: 'O Seguro Viagem pode ajudar com despesas médicas?',
    answer:
      'Sim. Em geral, os planos podem incluir proteção para despesas médicas, hospitalares e odontológicas em situações emergenciais, conforme o plano contratado e suas condições.'
  },
  {
    question: 'O que acontece em caso de extravio ou atraso de bagagem?',
    answer:
      'Dependendo do plano, o seguro pode oferecer assistência e cobertura para situações envolvendo atraso, extravio, perda ou danos à bagagem, conforme limites e regras do produto contratado.'
  },
  {
    question: 'Existem opções para Europa e outros destinos internacionais?',
    answer:
      'Sim. Há opções adequadas para diferentes regiões e perfis de viagem, incluindo Europa, Américas e outros destinos internacionais.'
  },
  {
    question: 'O seguro pode ajudar em cancelamento ou interrupção da viagem?',
    answer:
      'Dependendo do plano contratado, pode haver proteção para situações de cancelamento e interrupção da viagem por eventos previstos nas condições do produto.'
  },
  {
    question: 'Como saber qual plano é melhor para minha viagem?',
    answer:
      'O plano ideal depende do destino, duração da viagem, idade dos viajantes, tipo de roteiro e necessidades de cobertura. O melhor caminho é fazer uma cotação orientada e comparar a opção mais adequada ao seu perfil.'
  },
  {
    question: 'Seguro Viagem serve para intercâmbio, trabalho e cruzeiro?',
    answer:
      'Sim. O Seguro Viagem pode ser útil para diferentes perfis de deslocamento, como férias, trabalho, intercâmbio e cruzeiros. O ideal é adequar a proteção ao roteiro e às necessidades da viagem.'
  }
];

const heroMetrics = [
  {
    label: 'Cobertura',
    value: 'Viagens nacionais e internacionais'
  },
  {
    label: 'Assistência',
    value: 'Saúde, bagagem e imprevistos'
  },
  {
    label: 'Contratação',
    value: 'Cotação online com suporte humano'
  }
];

const immediateBenefits = [
  {
    title: 'Mais previsibilidade financeira',
    text: 'Evite que um imprevisto médico ou operacional transforme sua viagem em um grande prejuízo.'
  },
  {
    title: 'Apoio em situações inesperadas',
    text: 'Conte com suporte em cenários ligados a atendimento emergencial, bagagem e interrupções da viagem.'
  },
  {
    title: 'Cotação simples e orientação real',
    text: 'Receba ajuda para escolher uma opção coerente com seu destino e estilo de viagem.'
  }
];

const coverageCards = [
  {
    title: 'Despesas médicas, hospitalares e odontológicas',
    text: 'Proteção para situações emergenciais durante a viagem, conforme condições, limites e abrangência do plano contratado.'
  },
  {
    title: 'Despesas farmacêuticas',
    text: 'Apoio para gastos com medicamentos relacionados a ocorrências cobertas, de acordo com o plano escolhido.'
  },
  {
    title: 'Bagagem',
    text: 'Assistência e cobertura para atraso, extravio, perda ou danos à bagagem, conforme regras e limites do produto.'
  },
  {
    title: 'Cancelamento e interrupção de viagem',
    text: 'Dependendo do plano, pode haver proteção para eventos previstos que impeçam a realização ou continuidade da viagem.'
  },
  {
    title: 'Acompanhantes e familiares',
    text: 'Algumas opções incluem suporte em situações imprevistas envolvendo acompanhantes, familiares ou menores.'
  },
  {
    title: 'Planos por destino e perfil',
    text: 'Há alternativas para viagens nacionais, internacionais e por região, com ajuste ao seu roteiro e ao perfil dos viajantes.'
  }
];

const destinationCards = [
  {
    title: 'Nacional',
    text: 'Para quem vai viajar pelo Brasil e quer apoio em imprevistos médicos e operacionais durante o percurso.',
    image: '/images/seguro-viagem/nacional.webp',
    position: 'center 68%'
  },
  {
    title: 'Europa',
    text: 'Ideal para destinos que pedem atenção maior com cobertura médica e suporte durante a viagem.',
    image: '/images/seguro-viagem/europa.webp',
    position: 'center 22%'
  },
  {
    title: 'Américas',
    text: 'Boa opção para quem vai circular por destinos do continente com mais tranquilidade durante o roteiro.',
    image: '/images/seguro-viagem/americas.webp',
    position: 'center 34%'
  },
  {
    title: 'Internacional',
    text: 'Para viagens internacionais em geral, com proteção pensada para diferentes contextos fora do país.',
    image: '/images/seguro-viagem/internacional.webp',
    position: 'center 66%'
  }
];

const relatedLinks = [
  {
    href: '/institucional',
    title: 'Conheça a H Soares Seguros',
    text: 'Entenda quem é a corretora, como funciona o atendimento consultivo e por que isso ajuda na escolha do seguro.'
  },
  {
    href: '/seguradoras',
    title: 'Veja seguradoras e canais de atendimento',
    text: 'Acesse a página institucional das seguradoras parceiras e confira mais contexto sobre a estrutura de suporte.'
  },
  {
    href: '/contato',
    title: 'Fale com a equipe antes de contratar',
    text: 'Se ainda houver dúvida sobre destino, cobertura ou perfil da viagem, a equipe pode orientar o melhor próximo passo.'
  }
];

const travelerProfiles = [
  'Famílias em viagem de férias',
  'Casais em lua de mel',
  'Viajantes internacionais',
  'Intercambistas',
  'Profissionais em viagem de trabalho',
  'Quem vai fazer cruzeiro',
  'Quem deseja mais previsibilidade financeira',
  'Quem leva equipamentos, documentos e roteiro apertado',
  'Quem quer contratar com orientação antes de embarcar'
];

const guidedChoicePoints = [
  'Atendimento consultivo',
  'Cotação online',
  'Ajuda para escolher o plano',
  'Processo simples e claro'
];

const differenceScenarios = [
  {
    icon: 'medical',
    title: 'Destino internacional com custo médico alto',
    text: 'Uma urgência fora do país pode sair muito mais cara do que o planejado e gerar uma decisão apressada no pior momento.',
    highlight: 'Mais proteção financeira quando saúde vira prioridade'
  },
  {
    icon: 'family',
    title: 'Viagem com crianças, idosos ou em grupo',
    text: 'Quando mais pessoas dependem do roteiro dar certo, qualquer imprevisto pesa mais no bolso e na logística da viagem.',
    highlight: 'Mais tranquilidade em viagens que não admitem improviso'
  },
  {
    icon: 'route',
    title: 'Roteiro com conexão, agenda apertada ou compromisso importante',
    text: 'Atraso, interrupção ou bagagem fora do tempo podem desorganizar todo o restante da experiência, do check-in ao retorno.',
    highlight: 'Mais controle quando o cronograma importa'
  },
  {
    icon: 'bag',
    title: 'Lua de mel, intercâmbio, trabalho ou cruzeiro',
    text: 'Quanto maior o valor emocional ou financeiro da viagem, maior tende a ser o impacto de um problema mal resolvido.',
    highlight: 'Cobertura mais coerente com o peso real da viagem'
  }
];

function SectionHeader({ eyebrow, title, description, align = 'center' }) {
  return (
    <div className={`travel-page__section-head${align === 'left' ? ' travel-page__section-head--left' : ''}`}>
      <p className="travel-page__eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
    </div>
  );
}

function TravelIcon({ name }) {
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
    medical: (
      <svg {...common}>
        <path d="M8 4v6" />
        <path d="M5 7h6" />
        <path d="M16 5v14" />
        <path d="M12 9h8" />
        <path d="M12 15h8" />
      </svg>
    ),
    bag: (
      <svg {...common}>
        <path d="M7 8V7a5 5 0 0 1 10 0v1" />
        <rect x="4" y="8" width="16" height="12" rx="2" />
        <path d="M10 12h4" />
      </svg>
    ),
    route: (
      <svg {...common}>
        <path d="M18 18a3 3 0 1 0 0-6H9a3 3 0 1 1 0-6h2" />
        <path d="M14 4l-3 2.5L14 9" />
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
    )
  };

  return <span className="travel-page__icon">{icons[name] || icons.shield}</span>;
}

export default function SeguroViagemPage() {
  const product = getProductBySlug('seguro-viagem');

  if (!product) {
    notFound();
  }

  const conversionProduct = {
    ...product,
    conversionTitle: 'Receba apoio antes de seguir para a cotação oficial',
    conversionDescription:
      'Se quiser, deixe nome e WhatsApp para receber uma orientação rápida antes de continuar. Se preferir, você também pode seguir direto para a contratação oficial.',
    conversionPrimaryLabel: 'Ir para cotação online',
    conversionSecondaryLabel: 'Continuar sem preencher'
  };

  const structuredData = [
    buildOrganizationSchema(),
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Seguro Viagem Nacional e Internacional',
      serviceType: 'Seguro Viagem',
      description:
        'Seguro Viagem para viagens nacionais e internacionais com apoio para despesas médicas, bagagem, cancelamento e outros imprevistos previstos no plano.',
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
      offers: {
        '@type': 'Offer',
        url: PAGE_URL,
        availability: 'https://schema.org/InStock'
      }
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
          name: 'Seguro Viagem',
          item: PAGE_URL
        }
      ]
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer
        }
      }))
    }
  ];

  return (
    <>
      <StructuredData data={structuredData} />
      <SiteHeader />

      <main className="travel-page">
        <aside className="travel-page__sticky-cta" aria-label="Atalho para cotação de Seguro Viagem">
          <ProductCtaButton
            product={product}
            label="Contratação rápida"
            busyLabel="Abrindo..."
            className="travel-page__btn travel-page__btn--accent travel-page__btn--floating"
            payload={{ cta_placement: 'sticky-cta', cta_mode: 'direct' }}
          />
        </aside>

        <section className="travel-page__hero">
          <div className="container">
            <nav className="travel-page__breadcrumb" aria-label="Breadcrumb">
              <Link href="/">Início</Link>
              <span>/</span>
              <Link href="/#produtos">Produtos</Link>
              <span>/</span>
              <span>Seguro Viagem</span>
            </nav>

            <div className="travel-page__hero-grid">
              <div className="travel-page__hero-copy">
                <span className="travel-page__badge">Seguro Viagem nacional e internacional</span>

                <h1>Viaje com mais tranquilidade e tenha suporte para imprevistos do embarque ao destino</h1>

                <p className="travel-page__lead">
                  Proteção para diferentes cenários da viagem, incluindo despesas médicas, bagagem, cancelamento e
                  outros imprevistos previstos no plano. Uma solução pensada para quem quer viajar com mais segurança,
                  clareza e previsibilidade.
                </p>

                <div className="travel-page__actions">
                  <ProductCtaButton
                    product={product}
                    label="Fazer cotação agora"
                    busyLabel="Abrindo cotação..."
                    className="travel-page__btn travel-page__btn--accent"
                    payload={{ cta_placement: 'hero', cta_mode: 'direct' }}
                  />

                  <TrackedExternalLink
                    href={WHATSAPP_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="travel-page__btn travel-page__btn--ghost"
                    eventType="whatsapp_click"
                    productSlug={product.slug}
                    objective="travel_whatsapp_quote"
                    payload={{ placement: 'hero' }}
                  >
                    Falar com especialista
                  </TrackedExternalLink>
                </div>

                <div className="travel-page__metric-grid">
                  {heroMetrics.map((item) => (
                    <div key={item.label} className="travel-page__metric-pill">
                      <p>{item.label}</p>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="travel-page__hero-visual">
                <div className="travel-page__visual-frame">
                  <div className="travel-page__visual-copy">
                    <p>Planejamento inteligente</p>
                    <h2>Mais segurança para férias, trabalho, intercâmbio e cruzeiros</h2>
                    <span>O Seguro Viagem ajuda você a reduzir o impacto de imprevistos e seguir com mais apoio durante o roteiro.</span>
                  </div>
                </div>

                <div className="travel-page__tip-card">
                  <p>Dica</p>
                  <strong>Escolha o plano conforme destino, duração e perfil dos viajantes</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="travel-page__benefit-band">
          <div className="container">
            <div className="travel-page__benefit-grid">
              {immediateBenefits.map((item) => (
                <article key={item.title} className="travel-page__benefit-card">
                  <h2>{item.title}</h2>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="travel-page__section">
          <div className="container">
            <SectionHeader
              eyebrow="Por que contratar"
              title="Seguro Viagem não é só para emergências: é para viajar com mais controle"
              description="Uma viagem bem planejada pode ser impactada por eventos fora do seu controle. O seguro entra como uma camada de proteção para reduzir estresse, custo extra e improviso quando algo foge do previsto."
              align="left"
            />

            <div className="travel-page__story-grid">
              <article className="travel-page__copy-card">
                <h3>O que pode acontecer durante uma viagem?</h3>
                <p>
                  Atendimento médico fora da sua rotina habitual, necessidade de suporte com medicamentos, extravio de
                  bagagem, atraso em conexões e mudanças inesperadas no roteiro são exemplos de situações que podem
                  transformar uma viagem tranquila em uma experiência cara e desgastante.
                </p>
                <p>
                  E quanto mais importante for a viagem, como férias em família, lua de mel, trabalho, intercâmbio ou
                  cruzeiro, maior costuma ser o impacto de um imprevisto mal resolvido.
                </p>
              </article>

              <article className="travel-page__photo-card travel-page__photo-card--family">
                <div className="travel-page__photo-copy">
                  <p>Viaje com mais tranquilidade</p>
                  <span>
                    Em vez de decidir no susto, você embarca sabendo que existe uma estrutura de apoio prevista para
                    cenários relevantes da viagem.
                  </span>

                  <ProductCtaButton
                    product={product}
                    label="Cotar agora"
                    busyLabel="Abrindo cotação..."
                    className="travel-page__btn travel-page__btn--light"
                    payload={{ cta_placement: 'story-panel', cta_mode: 'direct' }}
                  />
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="travel-page__section travel-page__section--soft" id="coberturas">
          <div className="container">
            <SectionHeader
              eyebrow="Coberturas principais"
              title="O que avaliar em um Seguro Viagem bem estruturado"
              description="As coberturas variam conforme o plano contratado, mas estes pontos estão entre os mais relevantes para quem busca proteção mais completa e útil durante a viagem."
            />

            <div className="travel-page__coverage-grid">
              {coverageCards.map((item, index) => (
                <article key={item.title} className="travel-page__coverage-card">
                  <div className="travel-page__coverage-number">{String(index + 1).padStart(2, '0')}</div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>

            <div className="travel-page__notice">
              <strong>Atenção:</strong> coberturas, limites, critérios de elegibilidade, carências, eventos
              indenizáveis e condições de utilização dependem do plano contratado e das condições gerais do produto.
            </div>

            <div className="travel-page__center-actions">
              <ProductCtaButton
                product={product}
                label="Quero ver uma cotação"
                busyLabel="Abrindo cotação..."
                className="travel-page__btn travel-page__btn--primary"
                payload={{ cta_placement: 'coverage-section', cta_mode: 'direct' }}
              />
            </div>
          </div>
        </section>

        <section className="travel-page__section">
          <div className="container">
            <div className="travel-page__difference-layout">
              <div className="travel-page__difference-copy">
                <SectionHeader
                  eyebrow="Quando faz mais diferença"
                  title="É aqui que o Seguro Viagem costuma mostrar mais valor"
                  description="Principalmente quando a viagem tem custo alto, agenda importante ou pessoas que não podem depender da sorte para resolver um imprevisto."
                  align="left"
                />

                <div className="travel-page__difference-note">
                  <strong>Em geral, quanto mais importante for o roteiro, mais sentido faz contratar com critério.</strong>
                  <p>
                    Viagens internacionais, férias em família, compromissos profissionais, intercâmbios e roteiros com
                    conexão tendem a concentrar mais risco financeiro e operacional quando algo foge do previsto.
                  </p>
                </div>

                <div className="travel-page__actions">
                  <a href="#cotar" className="travel-page__btn travel-page__btn--primary">
                    Ver opções de cotação
                  </a>

                  <TrackedExternalLink
                    href={WHATSAPP_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="travel-page__btn travel-page__btn--outline"
                    eventType="whatsapp_click"
                    productSlug={product.slug}
                    objective="travel_whatsapp_quote"
                    payload={{ placement: 'difference-section' }}
                  >
                    Receber ajuda rápida
                  </TrackedExternalLink>
                </div>
              </div>

              <div className="travel-page__difference-grid">
                {differenceScenarios.map((item) => (
                  <article key={item.title} className="travel-page__difference-card">
                    <div className="travel-page__difference-icon">
                      <TravelIcon name={item.icon} />
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                    <strong>{item.highlight}</strong>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="travel-page__section">
          <div className="container">
            <SectionHeader
              eyebrow="Planos por perfil"
              title="Encontre o plano mais adequado para o seu destino"
              description="O mesmo produto pode atender diferentes perfis de viagem, desde deslocamentos nacionais até viagens internacionais mais longas e complexas."
            />

            <div className="travel-page__destination-grid">
              {destinationCards.map((item) => (
                <article key={item.title} className="travel-page__destination-card">
                  <div
                    className="travel-page__destination-media"
                    style={{
                      backgroundImage: `linear-gradient(180deg, rgba(2, 6, 23, 0.08) 0%, rgba(2, 6, 23, 0.2) 100%), url('${item.image}')`,
                      backgroundPosition: item.position
                    }}
                  />
                  <div className="travel-page__destination-body">
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                    <ProductCtaButton
                      product={product}
                      label="Quero cotar este perfil"
                      busyLabel="Abrindo cotação..."
                      className="travel-page__btn travel-page__btn--primary"
                      payload={{ cta_placement: `destination-${item.title.toLowerCase()}`, cta_mode: 'direct' }}
                    />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="travel-page__section travel-page__section--dark">
          <div className="container">
            <SectionHeader
              eyebrow="Perfis de viajante"
              title="Quem mais se beneficia do Seguro Viagem"
              description="A proteção é especialmente útil para quem não quer depender da sorte quando estiver longe de casa."
            />

            <div className="travel-page__profile-chips">
              {travelerProfiles.map((item) => (
                <div key={item} className="travel-page__profile-chip">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="travel-page__section">
          <div className="container">
            <div className="travel-page__guided-grid">
              <div>
                <SectionHeader
                  eyebrow="Escolha melhor"
                  title="O melhor Seguro Viagem é o que faz sentido para o seu roteiro"
                  description="Antes de contratar, o ideal é analisar destino, duração da viagem, idade dos viajantes, tipo de deslocamento, perfil do roteiro e limites de cobertura."
                  align="left"
                />

                <div className="travel-page__guided-copy">
                  <p>
                    Uma viagem curta dentro do Brasil pede uma leitura diferente de uma viagem longa para o exterior.
                    Um intercâmbio exige atenção diferente de uma lua de mel. Um cruzeiro pode pedir um olhar
                    diferente de uma viagem corporativa.
                  </p>
                  <p>
                    Por isso, a decisão não deve se resumir a ter ou não ter seguro, mas sim a contratar uma opção
                    coerente com o que você realmente precisa.
                  </p>
                  <p>
                    Na H Soares Seguros, você pode cotar online e, ao mesmo tempo, contar com apoio para entender
                    melhor o plano e contratar com mais segurança.
                  </p>
                </div>

                <div className="travel-page__actions">
                  <a href="#cotar" className="travel-page__btn travel-page__btn--primary">
                    Solicitar cotação
                  </a>

                  <TrackedExternalLink
                    href={WHATSAPP_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="travel-page__btn travel-page__btn--outline"
                    eventType="whatsapp_click"
                    productSlug={product.slug}
                    objective="travel_whatsapp_quote"
                    payload={{ placement: 'guided-choice' }}
                  >
                    Receber ajuda para escolher
                  </TrackedExternalLink>
                </div>
              </div>

              <article className="travel-page__support-card">
                <div className="travel-page__support-image" />
                <div className="travel-page__support-copy">
                  <p>Suporte de corretora</p>
                  <h3>Você não precisa decidir tudo sozinho</h3>
                  <span>
                    Além da cotação online, você pode contar com orientação para entender melhor a opção mais adequada
                    ao seu destino, ao seu perfil e ao tipo de viagem que está planejando.
                  </span>

                  <div className="travel-page__support-points">
                    {guidedChoicePoints.map((item) => (
                      <div key={item}>{item}</div>
                    ))}
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="travel-page__section travel-page__section--faq" id="faq">
          <div className="container travel-page__faq-shell">
            <SectionHeader
              eyebrow="Dúvidas frequentes"
              title="Perguntas comuns antes de contratar o Seguro Viagem"
              description="Respostas claras para ajudar você a decidir com mais segurança."
            />

            <div className="travel-page__faq-list">
              {faqs.map((item) => (
                <details key={item.question} className="travel-page__faq-item">
                  <summary>{item.question}</summary>
                  <div>
                    <p>{item.answer}</p>
                  </div>
                </details>
              ))}
            </div>

            <div className="travel-page__center-actions">
              <ProductCtaButton
                product={product}
                label="Quero cotar meu Seguro Viagem"
                busyLabel="Abrindo cotação..."
                className="travel-page__btn travel-page__btn--primary"
                payload={{ cta_placement: 'faq-section', cta_mode: 'direct' }}
              />
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="section-head section-head-readable">
              <p className="eyebrow">Links úteis</p>
              <h2>Mais páginas para validar a contratação com confiança</h2>
              <p>
                Esses links ajudam a reforçar a decisão com mais contexto institucional, canais de atendimento e apoio
                direto da corretora.
              </p>
            </div>
            <div className="premium-product-feature-grid">
              {relatedLinks.map((item) => (
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

        <section className="travel-page__section travel-page__section--cta" id="cotar">
          <div className="container">
            <div className="travel-page__final-band">
              <div className="travel-page__final-copy">
                <p className="travel-page__eyebrow">Pronto para viajar com mais tranquilidade?</p>
                <h2>Faça sua cotação e encontre a opção de Seguro Viagem mais adequada para o seu destino</h2>
                <p>
                  Solicite sua cotação online e receba orientação para contratar com mais segurança, clareza e
                  confiança.
                </p>

                <div className="travel-page__actions">
                  <ProductCtaButton
                    product={product}
                    label="Fazer cotação agora"
                    busyLabel="Abrindo cotação..."
                    className="travel-page__btn travel-page__btn--accent"
                    payload={{ cta_placement: 'final-band', cta_mode: 'direct' }}
                  />

                  <TrackedExternalLink
                    href={WHATSAPP_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="travel-page__btn travel-page__btn--ghost"
                    eventType="whatsapp_click"
                    productSlug={product.slug}
                    objective="travel_whatsapp_quote"
                    payload={{ placement: 'final-band' }}
                  >
                    Falar no WhatsApp
                  </TrackedExternalLink>
                </div>

                <p className="travel-page__subnote">
                  Atendimento rápido e orientação para contratar com mais segurança.
                </p>
              </div>

              <div className="travel-page__final-visual" />
            </div>

            <div className="travel-page__conversion-grid">
              <article className="travel-page__conversion-panel">
                <p className="travel-page__eyebrow">Escolha o próximo passo</p>
                <h3>Você pode ir direto para a cotação ou pedir um apoio rápido antes de continuar</h3>
                <p>
                  Se a viagem já está definida, o caminho mais rápido é seguir para a cotação oficial. Se ainda houver
                  dúvida sobre destino, perfil de cobertura ou tipo de plano, vale deixar seus dados para receber uma
                  orientação objetiva.
                </p>

                <div className="travel-page__conversion-points">
                  <div>
                    <TravelIcon name="medical" />
                    <div>
                      <strong>Leitura orientada da viagem</strong>
                      <span>Destino, duração e perfil dos viajantes contam na escolha do plano.</span>
                    </div>
                  </div>

                  <div>
                    <TravelIcon name="bag" />
                    <div>
                      <strong>Coberturas alinhadas ao roteiro</strong>
                      <span>Bagagem, cancelamento e assistência precisam fazer sentido para o cenário real.</span>
                    </div>
                  </div>

                  <div>
                    <TravelIcon name="family" />
                    <div>
                      <strong>Apoio para viagens em grupo ou família</strong>
                      <span>Uma leitura mais clara ajuda a evitar contratar menos do que o roteiro pede.</span>
                    </div>
                  </div>

                  <div>
                    <TravelIcon name="chat" />
                    <div>
                      <strong>Suporte humano quando necessário</strong>
                      <span>Você pode falar com a corretora antes de seguir, sem depender só da leitura da página.</span>
                    </div>
                  </div>
                </div>

                <div className="travel-page__actions">
                  <ProductCtaButton
                    product={product}
                    label="Ir para cotação oficial"
                    busyLabel="Abrindo cotação..."
                    className="travel-page__btn travel-page__btn--primary"
                    payload={{ cta_placement: 'conversion-panel', cta_mode: 'direct' }}
                  />

                  <TrackedExternalLink
                    href={WHATSAPP_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="travel-page__btn travel-page__btn--outline"
                    eventType="whatsapp_click"
                    productSlug={product.slug}
                    objective="travel_whatsapp_quote"
                    payload={{ placement: 'conversion-panel' }}
                  >
                    Tirar dúvida no WhatsApp
                  </TrackedExternalLink>
                </div>
              </article>

              <div className="travel-page__conversion-form">
                <ProductConversion product={conversionProduct} />
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
