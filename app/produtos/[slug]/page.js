import Link from 'next/link';
import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import { ProductConversion, ProductCtaButton } from '@/components/product-conversion';
import { PortoCardHeroCarousel } from '@/components/porto-card-hero-carousel';
import { PortoCardVersionSection } from '@/components/porto-card-version-section';
import { SafeImage } from '@/components/safe-image';
import { ServicesCarousel } from '@/components/services-carousel';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { StructuredData } from '@/components/structured-data';
import { TrackedExternalLink } from '@/components/tracked-external-link';
import { TrackedPortoLink } from '@/components/tracked-porto-link';
import { getProductBySlug, products } from '@/lib/products';
import { absoluteUrl, buildOrganizationSchema, buildPageMetadata, siteConfig } from '@/lib/site';
import SeguroViagemPage from '../seguro-viagem/page';

const PremiumLeadCapture = dynamic(
  () => import('@/components/premium-intake-modal').then((mod) => mod.PremiumLeadCapture),
  {
    loading: () => null
  }
);

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
    phone: (
      <svg {...common}>
        <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
        <path d="M10.5 6h3" />
        <path d="M11.8 18.2h.4" />
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
    highlights: ['Atendimento consultivo', 'Contratação digital', 'Apoio humano', 'Link oficial da seguradora'],
    heroCaption: 'Proteção com orientação clara, apoio humano e contratação digital no momento certo.',
    panelTitle: 'Simule com mais clareza',
    panelText: 'Entenda cobertura, assistência e custo-benefício antes de seguir para a contratação oficial.'
  },
  Financeiro: {
    highlights: ['Solicitação orientada', 'Jornada digital', 'Análise no ambiente oficial', 'Apoio consultivo'],
    heroCaption: 'Soluções financeiras com explicação clara, posicionamento consultivo e fluxo digital.',
    panelTitle: 'Solicite com apoio consultivo',
    panelText: 'A H Soares orienta o enquadramento do produto e reduz dúvidas antes do envio para o fluxo oficial.'
  },
  Equipamentos: {
    highlights: ['Proteção do ativo', 'Contratação digital', 'Apoio consultivo', 'Jornada objetiva'],
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
    highlights: ['Pré-embarque digital', 'Cobertura orientada', 'Apoio consultivo', 'Contratação rápida'],
    heroCaption: 'Proteção para imprevistos em viagens com contratação ágil e apoio consultivo.',
    panelTitle: 'Feche antes do embarque',
    panelText: 'Entenda cobertura, período e perfil da viagem antes de seguir para o ambiente oficial.'
  }
};

const GENERIC_VALUE_META = [
  { icon: 'shield', title: 'Visão estratégica' },
  { icon: 'clock', title: 'Jornada simplificada' },
  { icon: 'chat', title: 'Apoio consultivo' }
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
      text: 'Guia para entender garantia locatícia e locação residencial ou comercial com mais clareza.'
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
      text: 'Guia para comparar rede hospitalar, operadoras e custo total antes de pedir proposta.'
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
      text: 'Página de apoio para cotação com foco em segurado, condutor, veículo e renovação.'
    },
    {
      href: '/renovacao-seguro-auto',
      title: 'Renovação de Seguro Auto',
      text: 'Guia de renovação com apólice atual, histórico do seguro e comparação mais clara.'
    }
  ],
  'seguro-celular': [
    {
      href: '/blog/noticia/seguro-celular-cobre-roubo-e-furto-2026',
      title: 'Roubo, furto e cobertura',
      text: 'Entenda a diferença entre roubo, furto com vestígio e furto simples antes de contratar.'
    },
    {
      href: '/blog/noticia/quanto-custa-seguro-de-celular-2026',
      title: 'Preço e custo-benefício',
      text: 'Veja como ler a mensalidade do seguro sem comparar só pelo valor da parcela.'
    },
    {
      href: '/blog/noticia/acabei-de-comprar-um-celular-devo-fazer-seguro-agora',
      title: 'Celular novo e momento certo',
      text: 'Conteúdo para quem acabou de comprar o aparelho e quer proteger logo no início da vida útil.'
    },
    {
      href: '/blog/noticia/seguro-celular-ou-applecare-qual-e-melhor-2026',
      title: 'Seguro ou AppleCare?',
      text: 'Comparativo útil para quem usa iPhone e quer decidir com mais critério.'
    }
  ],
  'cartao-credito-porto-bank': [
    {
      href: '/blog/noticia/qual-cartao-porto-escolher',
      title: 'Qual versão escolher',
      text: 'Compare sem anuidade, International, Gold, Platinum e premium com uma leitura mais objetiva.'
    },
    {
      href: '/blog/noticia/cartao-porto-anuidade-como-zerar',
      title: 'Como funciona a anuidade',
      text: 'Veja quando a mensalidade pesa, quando cai e em quais cenários pode deixar de existir.'
    },
    {
      href: '/blog/noticia/cartao-porto-vale-a-pena-2026',
      title: 'Vale a pena para o seu perfil?',
      text: 'Entenda quando o cartão entrega valor real e quando ele pode ser mais do que você precisa.'
    },
    {
      href: '/blog/noticia/como-pedir-cartao-porto-seguro',
      title: 'Passo a passo do pedido',
      text: 'Uma leitura direta para entender a jornada oficial antes de fazer a solicitação.'
    }
  ]
};

const CELL_PHONE_PAGE = {
  benefits: [
    {
      icon: 'phone',
      title: 'Celular caro, prejuízo alto',
      text:
        'Um iPhone, Samsung Galaxy ou Xiaomi premium pode custar milhares de reais. Um imprevisto pode pesar no bolso.'
    },
    {
      icon: 'shield',
      title: 'Roubo e furto acontecem rápido',
      text:
        'Basta um momento de distração para perder o aparelho, seus acessos e parte da sua rotina digital.'
    },
    {
      icon: 'chat',
      title: 'Você depende dele todos os dias',
      text: 'WhatsApp, bancos, clientes, fotos, redes sociais e autenticação ficam concentrados no celular.'
    },
    {
      icon: 'clock',
      title: 'Contratação digital',
      text: 'Você segue para o ambiente oficial da Porto Seguro e pode contar com apoio da H Soares se tiver dúvidas.'
    }
  ],
  coverages: [
    {
      icon: 'shield',
      title: 'Roubo',
      text: 'Proteção em caso de roubo, conforme as regras da seguradora e o plano contratado.'
    },
    {
      icon: 'lock',
      title: 'Furto mediante arrombamento',
      text: 'Cobertura para furto com vestígio, conforme o plano contratado.'
    },
    {
      icon: 'document',
      title: 'Quebra acidental',
      text: 'Pode incluir danos como queda, curto-circuito, oxidação por líquido e outros eventos previstos no plano.'
    },
    {
      icon: 'phone',
      title: 'Furto simples',
      text: 'Disponível em planos específicos, quando contratado.'
    }
  ],
  profilePoints: [
    'usa iPhone, Samsung Galaxy, Xiaomi ou outro smartphone de alto valor',
    'trabalha pelo celular',
    'usa banco, WhatsApp, Instagram e aplicativos importantes no aparelho',
    'circula bastante com o celular na rua',
    'quer evitar o prejuízo de comprar outro aparelho do zero'
  ],
  steps: [
    {
      number: '01',
      title: 'Clique no botão de contratação',
      text: 'Você será direcionado para o ambiente oficial da Porto Seguro.'
    },
    {
      number: '02',
      title: 'Siga para o ambiente oficial',
      text: 'Veja as opções disponíveis com calma e confira as regras do produto.'
    },
    {
      number: '03',
      title: 'Confira coberturas e elegibilidade',
      text: 'Analise o plano, a leitura de cobertura e as condições vigentes.'
    },
    {
      number: '04',
      title: 'Finalize a contratação digital',
      text: 'Preencha os dados solicitados e siga as etapas da Porto.'
    },
    {
      number: '05',
      title: 'Conte com apoio da H Soares',
      text: 'Se tiver dúvidas, nossa equipe pode orientar antes ou durante o processo.'
    }
  ],
  authorityCards: [
    {
      icon: 'shield',
      title: '30 anos de mercado',
      text: 'Experiência para orientar clientes com clareza e responsabilidade.'
    },
    {
      icon: 'chat',
      title: 'Atendimento consultivo',
      text: 'A H Soares ajuda a esclarecer coberturas, elegibilidade e próximos passos.'
    },
    {
      icon: 'document',
      title: 'Redirecionamento oficial',
      text: 'A contratação segue pelo ambiente oficial disponibilizado pela Porto Seguro.'
    },
    {
      icon: 'family',
      title: 'Apoio antes e depois',
      text: 'Você não fica sozinho tentando entender tudo.'
    }
  ],
  faqs: [
    {
      q: 'O Seguro Celular da Porto cobre roubo?',
      a: 'Sim, a Porto possui plano com cobertura para roubo, conforme as condições do produto contratado.'
    },
    {
      q: 'Cobre quebra de tela?',
      a: 'A cobertura de quebra acidental pode estar disponível conforme o plano escolhido e as regras da seguradora.'
    },
    {
      q: 'Cobre furto simples?',
      a: 'A Porto possui plano que pode incluir furto simples, quando essa cobertura for contratada.'
    },
    {
      q: 'Posso contratar para iPhone usado?',
      a: 'Depende das regras de elegibilidade da Porto Seguro no momento da contratação, como modelo, tempo de uso e condições do aparelho.'
    },
    {
      q: 'A contratação é feita no site da H Soares?',
      a: 'A H Soares direciona você para o ambiente oficial da Porto Seguro, onde a contratação é realizada.'
    }
  ],
  finalCopy:
    'Seu celular faz parte da sua rotina, do seu trabalho e da sua vida digital. Veja as opções disponíveis para proteger seu aparelho com a Porto Seguro.'
};

const PORTO_CARD_PAGE = {
  highlights: ['Escolha por perfil', 'PortoPlus e mobilidade', 'App com controle real', 'Pedido oficial preservado'],
  carouselSlides: [
    {
      eyebrow: 'Versão ideal',
      title: 'Cartão Porto Bank: escolha a versão ideal para o seu perfil',
      subtitle:
        'Compare benefícios, entenda as diferenças entre as opções e siga para a solicitação oficial com mais clareza e segurança.',
      ctaLabel: 'Solicitar Cartão Porto',
      image: '/assets/blog/porto-version-cards/cartao_black.webp',
      alt: 'Cartão Porto Bank Mastercard Black em destaque',
      tone: 'blue',
      artLayout: 'black',
      artwork: [
        {
          src: '/assets/blog/porto-version-cards/cartao_black.webp',
          variant: 'primary',
          className: 'is-mastercard-black'
        }
      ],
      note: 'Use a leitura guiada para alinhar expectativa, faixa do cartão e próximo passo oficial.'
    },
    {
      eyebrow: 'Benefícios',
      title: 'Mais benefícios, praticidade e vantagens no dia a dia',
      subtitle:
        'Conheça versões com benefícios exclusivos, gestão digital e condições que fazem sentido para diferentes perfis.',
      ctaLabel: 'Ver benefícios do cartão',
      image: '/assets/blog/porto-card-platinum-user-trimmed.png',
      alt: 'Cartão Porto Bank Platinum em destaque',
      tone: 'silver',
      artLayout: 'offset',
      artwork: [
        {
          src: '/assets/blog/porto-card-platinum-user-trimmed.png',
          variant: 'primary',
          className: 'is-platinum'
        },
        {
          src: '/assets/blog/porto-card-blue-user-trimmed.png',
          variant: 'secondary',
          className: 'is-blue-accent'
        }
      ],
      note: 'A proposta fica mais forte quando o uso real do cartão conversa com o que você espera dele.'
    },
    {
      eyebrow: 'Apoio consultivo',
      title: 'Pedido com mais segurança e orientação antes de continuar',
      subtitle:
        'A H Soares Seguros ajuda você a entender melhor as opções antes de seguir para o ambiente oficial da Porto.',
      ctaLabel: 'Continuar para solicitação',
      image: '/assets/blog/porto-card-blue-user-trimmed.png',
      alt: 'Cartão Porto Bank azul em destaque',
      tone: 'ink',
      artLayout: 'single',
      artwork: [
        {
          src: '/assets/blog/porto-card-blue-user-trimmed.png',
          variant: 'primary'
        }
      ],
      note: 'Se a dúvida ainda estiver entre duas faixas, vale parar um instante e comparar com calma.'
    }
  ],
  versionCards: [
    {
      title: 'Porto Bank Mastercard Black',
      versionKey: 'mastercard-black',
      image: '/assets/blog/porto-version-cards/cartao_black.webp',
      alt: 'Cartão Porto Bank Mastercard Black',
      badge: 'IOF ZERO',
      benefits: [
        [
          { text: 'Acumule até ' },
          { text: '3,5 pontos', emphasis: true },
          { text: ' para cada dólar gasto.' }
        ],
        [
          { text: 'Salas VIP ao redor do mundo: A partir de 08/04/2026 conte com ' },
          { text: '6 acessos gratuitos por ano', emphasis: true }
        ],
        [
          {
            text: 'Resgate a partir de R$ 150 OFF em seguros, financiamento ou serviços Porto com seus pontos.',
            emphasis: true
          }
        ]
      ],
      detail: {
        drawerTitle: 'Detalhes do Porto Bank Mastercard Black',
        drawerSubtitle: 'Detalhes do Cartão Porto Bank Mastercard Black',
        intro: ['Aprovação sujeita à análise de crédito', 'Cobertura internacional'],
        sections: [
          {
            title: 'Sobre a anuidade',
            blocks: [
              { type: 'paragraph', text: 'Grátis nos 12 primeiros meses, para novos clientes*', emphasis: true },
              { type: 'paragraph', text: 'Depois disso, você tem a parcela mensal da anuidade grátis ao atingir:' },
              {
                type: 'list',
                items: [
                  'Gastos por fatura superior ou igual a R$ 10.000,00',
                  'Ou a partir de R$ 100 mil em fundos no produto Investimentos Porto Bank.'
                ]
              },
              {
                type: 'paragraph',
                text: 'Caso não cumpra pelo menos um desses requisitos, a mensalidade é de apenas R$ 89,00 por mês*.'
              },
              { type: 'paragraph', text: 'Até 4 cartões adicionais sem anuidade.', emphasis: true },
              {
                type: 'note',
                text:
                  '*Esta condição se aplica somente à primeira bandeira, para novos clientes. Na aquisição de um novo cartão de 2ª bandeira, o cliente será isento e poderá somar os gastos dos dois cartões para isenção total ou parcial da anuidade do 1º cartão.'
              }
            ]
          },
          {
            title: 'Benefícios Porto',
            blocks: [
              {
                type: 'list',
                items: [
                  'PortoPlus: Acumule até 3,5 pontos a cada dólar gasto no Cartão de Crédito Porto Bank Mastercard Black. Consulte as regras e condições;',
                  'Salas VIP: A partir de 08/04/2026 conte com 6 acessos gratuitos por ano em centenas de lounges ao redor do mundo;',
                  'Salas Vip Mastercard Black: Acesso ilimitado para titulares e adicionais às salas Mastercard Black Terminal 3 do aeroporto de Guarulhos, condicionado ao gasto mínimo de R$ 15 mil acumulado nas três últimas faturas fechadas do cartão, em conformidade com as regras estabelecidas pela bandeira.',
                  'Tag Porto Bank grátis e sem mensalidade;',
                  'Desconto em combustíveis com Shell Box;',
                  'Descontos no Porto Seguro Auto ou Azul Seguro Auto. Consulte as condições;',
                  '5% de desconto nos demais seguros: Residencial, Bike, Celular, Viagem, Vida e Equipamentos Portáteis;',
                  'Pré-vendas e descontos exclusivos em shows/eventos;',
                  'Porto Serviço: 20% de desconto na contratação de serviços para Casa e Auto.',
                  'Gastronomia Porto Bank: Até 15% de desconto e amenidades em restaurantes selecionados. Saiba mais'
                ]
              }
            ]
          },
          {
            title: 'Benefícios Mastercard Black',
            blocks: [
              {
                type: 'list',
                items: ['Proteção de compras;', 'Garantia estendida original;', 'Vantagens para suas viagens;']
              }
            ]
          }
        ]
      }
    },
    {
      title: 'Porto Bank Visa Infinite',
      versionKey: 'visa-infinite',
      image: '/assets/blog/porto-card-infinite-user-trimmed.png',
      alt: 'Cartão Porto Bank Visa Infinite',
      badge: 'IOF ZERO',
      benefits: [
        [
          { text: 'Acumule até ' },
          { text: '3,5 pontos', emphasis: true },
          { text: ' para cada dólar gasto.' }
        ],
        [
          { text: 'Salas VIP ao redor do mundo: A partir de 08/04/2026 conte com ' },
          { text: '6 acessos gratuitos por ano', emphasis: true }
        ],
        [
          {
            text: 'Resgate a partir de R$ 150 OFF em seguros, financiamento ou serviços Porto com seus pontos.',
            emphasis: true
          }
        ]
      ],
      detail: {
        drawerTitle: 'Detalhes do Porto Bank Visa Infinite',
        drawerSubtitle: 'Detalhes do Cartão Porto Bank Visa Infinite',
        intro: ['Aprovação sujeita à análise de crédito', 'Cobertura internacional'],
        sections: [
          {
            title: 'Sobre a anuidade',
            blocks: [
              { type: 'paragraph', text: 'Grátis nos 12 primeiros meses, para novos clientes*', emphasis: true },
              {
                type: 'paragraph',
                text: 'Depois disso, você tem a parcela mensal da anuidade grátis ao atingir:'
              },
              {
                type: 'list',
                items: [
                  'Gastos por fatura superior ou igual a R$ 10.000,00',
                  'Ou a partir de R$ 100 mil em fundos no produto Investimentos Porto Bank.'
                ]
              },
              {
                type: 'paragraph',
                text: 'Caso não cumpra pelo menos um desses requisitos, a mensalidade é de apenas R$ 89,00 por mês*.'
              },
              { type: 'paragraph', text: 'Até 4 cartões adicionais sem anuidade.', emphasis: true },
              {
                type: 'note',
                text:
                  '*Esta condição se aplica somente à primeira bandeira, para novos clientes. Na aquisição de um novo cartão de 2ª bandeira, o cliente será isento e poderá somar os gastos dos dois cartões para isenção total ou parcial da anuidade do 1º cartão.'
              }
            ]
          },
          {
            title: 'Benefícios Porto',
            blocks: [
              {
                type: 'list',
                items: [
                  'PortoPlus: Acumule até 3,5 pontos a cada dólar gasto no Cartão de Crédito Porto Bank Visa Infinite. Consulte as regras e condições;',
                  'Salas VIP: A partir de 08/04/2026 conte com 6 acessos gratuitos por ano em centenas de lounges ao redor do mundo.',
                  'Tag Porto Bank grátis e sem mensalidade;',
                  'Desconto em combustíveis com Shell Box;',
                  'Descontos no Porto Seguro Auto ou Azul Seguro Auto. Consulte as condições;',
                  '5% de desconto nos demais seguros: Residencial, Bike, Celular, Viagem, Vida e Equipamentos Portáteis;',
                  'Pré-vendas e descontos exclusivos em shows/eventos;',
                  'Porto Serviço: 20% de desconto na contratação de serviços para Casa e Auto.',
                  'Gastronomia Porto Bank: Até 15% de desconto e amenidades em restaurantes selecionados. Saiba mais'
                ]
              }
            ]
          },
          {
            title: 'Benefícios Visa Infinite',
            blocks: [
              {
                type: 'list',
                items: ['Proteção de compras;', 'Garantia estendida original;', 'Vantagens para suas viagens;']
              }
            ]
          }
        ]
      }
    },
    {
      title: 'Porto Bank Platinum',
      versionKey: 'platinum',
      image: '/assets/blog/porto-card-platinum-user-trimmed.png',
      alt: 'Cartão Porto Bank Platinum',
      badge: 'IOF ZERO',
      benefits: [
        [
          { text: 'Acumule até ' },
          { text: '1,5 pontos', emphasis: true },
          { text: ' para cada dólar gasto.' }
        ],
        [
          {
            text: 'Resgate a partir de R$ 150 OFF em seguros, financiamento ou serviços Porto com seus pontos.',
            emphasis: true
          }
        ]
      ],
      detail: {
        drawerTitle: 'Detalhes do Porto Bank Platinum',
        drawerSubtitle: 'Detalhes do Cartão Porto Bank Platinum',
        intro: ['Aprovação sujeita à análise de crédito', 'Cobertura internacional'],
        sections: [
          {
            title: 'Sobre a anuidade',
            blocks: [
              { type: 'paragraph', text: 'Grátis nos 12 primeiros meses, para novos clientes*', emphasis: true },
              {
                type: 'paragraph',
                text: 'Depois disso, você tem a parcela mensal da anuidade grátis ao atingir:'
              },
              {
                type: 'list',
                items: [
                  'Gastos por fatura superior ou igual a R$ 3.500,00',
                  'Ou a partir de R$ 50 mil em fundos no produto Investimentos Porto Bank.'
                ]
              },
              {
                type: 'paragraph',
                text: 'Caso não cumpra pelo menos um desses requisitos, a mensalidade é de apenas R$ 59,00 por mês*.'
              },
              { type: 'paragraph', text: 'Até 4 cartões adicionais sem anuidade.', emphasis: true },
              {
                type: 'note',
                text:
                  '*Esta condição se aplica somente à primeira bandeira, para novos clientes. Na aquisição de um novo cartão de 2ª bandeira, o cliente será isento e poderá somar os gastos dos dois cartões para isenção total ou parcial da anuidade do 1º cartão.'
              }
            ]
          },
          {
            title: 'Benefícios Porto',
            blocks: [
              {
                type: 'list',
                items: [
                  'PortoPlus: Acumule até 1,5 pontos a cada dólar gasto no Cartão de Crédito Porto Bank Platinum. Consulte as regras e condições;',
                  'Tag Porto Bank grátis e sem mensalidade;',
                  'Desconto em combustíveis com Shell Box;',
                  'Descontos no Porto Seguro Auto ou Azul Seguro Auto. Consulte as condições;',
                  '5% de desconto nos demais seguros: Residencial, Bike, Celular, Viagem, Vida e Equipamentos Portáteis;',
                  'Pré-vendas e descontos exclusivos em shows/eventos;',
                  'Porto Serviço: 20% de desconto na contratação de serviços para Casa e Auto.',
                  'Gastronomia Porto Bank: Até 15% de desconto e amenidades em restaurantes selecionados. Saiba mais'
                ]
              }
            ]
          },
          {
            title: 'Benefício das bandeiras',
            blocks: [
              {
                type: 'list',
                items: ['Vantagens para suas viagens;']
              }
            ]
          }
        ]
      }
    },
    {
      title: 'Porto Bank Gold',
      versionKey: 'gold',
      image: 'https://www.portoseguro.com.br/NovoInstitucional/static_files/images/cartao-de-credito/plasticos/Porto_Bank_Gold.png',
      alt: 'Cartão Porto Bank Gold',
      badge: 'IOF ZERO',
      benefits: [
        [
          { text: 'Acumule até ' },
          { text: '1,0 pontos', emphasis: true },
          { text: ' para cada dólar gasto.' }
        ],
        [
          {
            text: 'Resgate a partir de R$ 150 OFF em seguros, financiamento ou serviços Porto com seus pontos.',
            emphasis: true
          }
        ],
        [
          { text: 'Tag de pedágio grátis', emphasis: true },
          { text: ' e sem mensalidade.' }
        ]
      ],
      detail: {
        drawerTitle: 'Detalhes do Porto Bank Gold',
        drawerSubtitle: 'Detalhes do Cartão Porto Bank Gold',
        intro: ['Aprovação sujeita à análise de crédito', 'Cobertura internacional'],
        sections: [
          {
            title: 'Sobre a anuidade',
            blocks: [
              { type: 'paragraph', text: 'Grátis nos 12 primeiros meses, para novos clientes*', emphasis: true },
              {
                type: 'paragraph',
                text: 'Depois disso, você tem a parcela mensal da anuidade grátis ao atingir:'
              },
              {
                type: 'list',
                items: [
                  'Gastos por fatura superior ou igual a R$ 3.500,00',
                  'Ou a partir de R$ 50 mil em fundos no produto Investimentos Porto Bank.'
                ]
              },
              {
                type: 'paragraph',
                text: 'Caso não cumpra pelo menos um desses requisitos, a mensalidade é de apenas R$ 39,00 por mês*.'
              },
              { type: 'paragraph', text: 'Até 3 cartões adicionais sem anuidade.', emphasis: true },
              {
                type: 'note',
                text:
                  '*Esta condição se aplica somente à primeira bandeira, para novos clientes. Na aquisição de um novo cartão de 2ª bandeira, o cliente será isento e poderá somar os gastos dos dois cartões para isenção total ou parcial da anuidade do 1º cartão.'
              }
            ]
          },
          {
            title: 'Benefícios Porto',
            blocks: [
              {
                type: 'list',
                items: [
                  'PortoPlus: Acumule até 1,0 pontos a cada dólar gasto no Cartão de Crédito Porto Bank Gold. Consulte as regras e condições;',
                  'Tag Porto Bank grátis e sem mensalidade;',
                  'Desconto em combustíveis com Shell Box;',
                  'Descontos no Porto Seguro Auto ou Azul Seguro Auto. Consulte as condições;',
                  '5% de desconto nos demais seguros: Residencial, Bike, Celular, Viagem, Vida e Equipamentos Portáteis;',
                  'Pré-vendas e descontos exclusivos em shows/eventos;',
                  'Porto Serviço: 20% de desconto na contratação de serviços para Casa e Auto.',
                  'Gastronomia Porto Bank: Até 15% de desconto e amenidades em restaurantes selecionados. Saiba mais'
                ]
              }
            ]
          },
          {
            title: 'Benefícios das bandeiras',
            blocks: [
              {
                type: 'list',
                items: ['Proteção de compras;', 'Proteção de preço;', 'Garantia estendida original;', 'Vantagens para suas viagens;']
              }
            ]
          }
        ]
      }
    }
  ],
  appHighlights: [
    'Cartão virtual, fatura, limite e gastos no mesmo ambiente',
    'Aviso viagem, bloqueio e desbloqueio em poucos toques',
    'Tag Porto Bank, Shell Box e mais serviços conectados ao app',
    'Mais praticidade para resolver a rotina sem fricção'
  ],
  ecosystemFeature: {
    eyebrow: 'Ecossistema Porto',
    title: 'O cartão ganha outra presença quando o benefício aparece na rotina de verdade',
    text:
      'PortoPlus, Tag Porto Bank, Shell Box e serviços Porto ajudam o cartão a sair da ficha técnica e entrar no seu dia a dia com mais valor percebido.',
    image: '/assets/blog/porto-humanized/cc-portoplus.webp',
    alt: 'Identidade visual do PortoPlus com mala e símbolo colorido',
    highlights: ['PortoPlus para viagens e descontos', 'Benefícios conectados ao uso real', 'Ecossistema útil no dia a dia']
  },
  ecosystemCards: [
    {
      eyebrow: 'Tag Porto Bank',
      title: 'Mobilidade que elimina etapas no pedágio e no estacionamento',
      text:
        'A Tag Porto Bank reforça o lado prático do cartão e ajuda a transformar o uso em uma experiência mais fluida na rua.',
      image: '/assets/blog/porto-humanized/card-tag-porto.webp',
      alt: 'Tag Porto Bank azul em perspectiva',
      accent: 'tag'
    },
    {
      eyebrow: 'Shell Box',
      title: 'Desconto em combustível para o benefício aparecer no uso real',
      text:
        'O cartão deixa de ser abstrato quando também conversa com abastecimento e momentos recorrentes da rotina.',
      image: '/assets/blog/porto-humanized/cc-shell-box.webp',
      alt: 'Imagem de posto de combustível representando o Shell Box',
      accent: 'shell'
    },
    {
      eyebrow: 'Serviços Porto',
      title: 'Benefícios que encostam em assistência e conveniência da marca',
      text:
        'Quem já vive a Porto em seguros e serviços percebe mais valor quando o cartão entra nesse mesmo ecossistema.',
      image: '/assets/blog/porto-humanized/moco-servico.webp',
      alt: 'Profissional da Porto realizando um serviço residencial',
      accent: 'service'
    }
  ],
  lifestyleHero: {
    eyebrow: 'Mais humano',
    title: 'O Cartão Porto faz mais sentido quando entra na sua rotina com leveza',
    text:
      'Pagar com o celular, acompanhar tudo no app e sentir os benefícios em momentos reais deixa a página menos fria e o produto muito mais desejável.',
    image: '/assets/blog/porto-humanized/moca-celular-2.webp',
    alt: 'Mulher sorrindo segurando o Cartão Porto Bank',
    highlights: ['Pagamento por aproximação', 'Carteiras digitais', 'Controle no app']
  },
  lifestyleCards: [
    {
      eyebrow: 'Carteira digital',
      title: 'Cartão e celular andando juntos no dia a dia',
      text:
        'Cartão virtual, aproximação e gestão rápida ajudam o produto a parecer útil antes mesmo de entrar no pedido oficial.',
      image: '/assets/blog/porto-humanized/cartao-e-celular.webp',
      alt: 'Celular azul com cartão Porto Bank preto em destaque',
      accent: 'ink'
    },
    {
      eyebrow: 'Produto em foco',
      title: 'Uma vitrine mais premium para sentir valor além da comparação técnica',
      text:
        'Quando a apresentação do cartão aparece com mais intenção visual, a decisão fica mais aspiracional e menos burocrática.',
      image: '/assets/blog/porto-humanized/cartoes-mesa.webp',
      alt: 'Cartões Porto Bank em composição editorial sobre base geométrica',
      accent: 'editorial'
    }
  ]
};

function getCategoryUi(product) {
  return (
    CATEGORY_UI[product.category] || {
      highlights: ['Atendimento consultivo', 'Contratação digital', 'Apoio humano', 'Link oficial da seguradora'],
      heroCaption: 'Produto com orientação clara, apoio humano e contratação digital.',
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

function SectionHeader({ eyebrow, title, description, align = 'center' }) {
  return (
    <div className={`travel-page__section-head${align === 'left' ? ' travel-page__section-head--left' : ''}`}>
      <p className="travel-page__eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
    </div>
  );
}

function getWhatsAppHref(message) {
  return `https://wa.me/5511972064288?text=${encodeURIComponent(message)}`;
}

function CellPhoneProductPage({ product }) {
  const whatsappHref = getWhatsAppHref('Olá, quero cotar o Seguro Celular da Porto com a H Soares.');

  return (
    <>
      <section className="travel-page__hero">
        <div className="container">
          <nav className="travel-page__breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Início</Link>
            <span>/</span>
            <Link href="/#produtos">Produtos</Link>
            <span>/</span>
            <span>{product.name}</span>
          </nav>

          <div className="travel-page__hero-grid">
            <div className="travel-page__hero-copy">
              <span className="travel-page__badge">{product.category}</span>
              <h1>Seguro Celular Porto para proteger seu iPhone, Samsung ou Xiaomi</h1>
              <p className="travel-page__lead">
                Roubo, furto e quebra acidental podem gerar um prejuízo alto em poucos segundos. Contrate seu Seguro
                Celular de forma digital, com redirecionamento para o ambiente oficial da Porto Seguro e apoio
                consultivo da H Soares.
              </p>

              <div className="travel-page__actions">
                <TrackedPortoLink
                  className="travel-page__btn travel-page__btn--accent"
                  href={product.portoUrl}
                  productSlug={product.slug}
                  ctaLabel="Contratar Seguro Celular pela Porto"
                  ctaPosition="hero_primary"
                  pageSection="hero"
                  templateType="product_page"
                >
                  Contratar Seguro Celular pela Porto
                </TrackedPortoLink>
                <TrackedExternalLink
                  className="travel-page__btn travel-page__btn--ghost"
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  eventType="whatsapp_click"
                  productSlug={product.slug}
                  objective="cell_phone_support"
                  payload={{ cta_position: 'hero_secondary', page_section: 'hero', template_type: 'product_page' }}
                >
                  Falar no WhatsApp
                </TrackedExternalLink>
              </div>
            </div>

            <div className="travel-page__hero-visual">
              <div className="travel-page__visual-frame travel-page__visual-frame--cellphone">
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="travel-page__section">
        <div className="container">
          <SectionHeader
            eyebrow="Benefícios"
            title="Por que proteger seu celular?"
            description="Seu aparelho concentra trabalho, comunicação, autenticação, fotos e acesso a bancos. Quando algo acontece, o impacto costuma ser rápido e caro."
            align="left"
          />

          <div className="travel-page__benefit-grid travel-page__benefit-grid--cellphone">
            {CELL_PHONE_PAGE.benefits.map((card) => (
              <article key={card.title} className="travel-page__benefit-card travel-page__benefit-card--cellphone">
                <div className="travel-page__icon">
                  <PremiumIcon name={card.icon} />
                </div>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="travel-page__section travel-page__section--soft" id="coberturas">
        <div className="container">
          <SectionHeader
            eyebrow="Coberturas"
            title="Principais coberturas do Seguro Celular"
            description="As coberturas, franquias, elegibilidade e limites dependem do plano escolhido e das regras vigentes da Porto Seguro no momento da contratação."
          />

          <div className="travel-page__coverage-grid travel-page__coverage-grid--cellphone">
            {CELL_PHONE_PAGE.coverages.map((card) => (
              <article key={card.title} className="travel-page__coverage-card travel-page__coverage-card--cellphone">
                <div className="travel-page__icon">
                  <PremiumIcon name={card.icon} />
                </div>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </article>
            ))}
          </div>
          <div className="travel-page__notice">
            <strong>Importante:</strong> as coberturas, franquias, elegibilidade e limites dependem do plano
            escolhido e das regras vigentes da Porto Seguro no momento da contratação.
          </div>
          <div className="travel-page__center-actions">
            <TrackedPortoLink
              className="travel-page__btn travel-page__btn--primary"
              href={product.portoUrl}
              productSlug={product.slug}
              ctaLabel="Contratar Seguro Celular pela Porto"
              ctaPosition="coverage_cta"
              pageSection="coberturas"
              templateType="product_page"
            >
              Contratar Seguro Celular pela Porto
            </TrackedPortoLink>
          </div>
        </div>
      </section>

      <section className="travel-page__section">
        <div className="container">
          <SectionHeader
            eyebrow="Indicação"
            title="Esse seguro faz sentido para você se:"
            description="A leitura abaixo ajuda a entender se o Seguro Celular conversa com o seu perfil de uso e com o valor real do aparelho."
            align="left"
          />

          <div className="travel-page__guided-grid">
            <article className="travel-page__copy-card">
              <h3>Perfil indicado</h3>
              <div className="travel-page__checklist">
                {CELL_PHONE_PAGE.profilePoints.map((item) => (
                  <div key={item} className="travel-page__checklist-item">
                    <PremiumIcon name="shield" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="travel-page__support-card travel-page__support-card--cellphone">
              <div className="travel-page__support-image travel-page__support-image--cellphone" />
              <div className="travel-page__support-copy">
                <p>Contratação digital</p>
                <h3>Você segue para o ambiente oficial da Porto com apoio da H Soares</h3>
                <span>
                  Se surgir qualquer dúvida sobre cobertura, elegibilidade ou preenchimento, a corretora ajuda antes
                  e depois da contratação.
                </span>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="travel-page__section travel-page__section--soft">
        <div className="container">
          <SectionHeader
            eyebrow="Como contratar"
            title="Como contratar seu Seguro Celular"
            description="O caminho é digital e leva você para o ambiente oficial da Porto Seguro, com apoio da H Soares se precisar de orientação."
          />

          <div className="travel-page__step-grid">
            {CELL_PHONE_PAGE.steps.map((step) => (
              <article key={step.number} className="travel-page__step-card">
                <span>{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="travel-page__section">
        <div className="container">
          <SectionHeader
            eyebrow="Autoridade H Soares"
            title="Contrate com apoio de uma corretora com 30 anos de mercado"
            description="A H Soares Corretora de Seguros orienta clientes na escolha de seguros com atendimento humano, clareza nas coberturas e direcionamento para os canais oficiais de contratação."
          />

          <div className="travel-page__authority-grid">
            {CELL_PHONE_PAGE.authorityCards.map((card) => (
              <article key={card.title} className="travel-page__authority-card">
                <div className="travel-page__icon">
                  <PremiumIcon name={card.icon} />
                </div>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="travel-page__section travel-page__section--faq" id="faq">
        <div className="container travel-page__faq-shell">
          <SectionHeader
            eyebrow="FAQ"
            title="Perguntas frequentes sobre o Seguro Celular"
            description="Respostas diretas para ajudar você a avançar com mais segurança e menos dúvida."
          />

          <div className="travel-page__faq-list">
            {CELL_PHONE_PAGE.faqs.map((faq) => (
              <details key={faq.q} className="travel-page__faq-item">
                <summary>{faq.q}</summary>
                <div>
                  <p>{faq.a}</p>
                </div>
              </details>
            ))}
          </div>

          <div className="travel-page__center-actions">
            <TrackedPortoLink
              className="travel-page__btn travel-page__btn--primary"
              href={product.portoUrl}
              productSlug={product.slug}
              ctaLabel="Contratar Seguro Celular pela Porto"
              ctaPosition="faq_cta"
              pageSection="faq"
              templateType="product_page"
            >
              Contratar Seguro Celular pela Porto
            </TrackedPortoLink>
          </div>
        </div>
      </section>

      <section className="travel-page__section travel-page__section--cta" id="cotar">
        <div className="container">
          <div className="travel-page__final-band">
            <div className="travel-page__final-copy">
              <p className="travel-page__eyebrow">CTA final</p>
              <h2>Proteja seu celular antes que o prejuízo aconteça</h2>
              <p>{CELL_PHONE_PAGE.finalCopy}</p>

              <div className="travel-page__actions">
                <TrackedPortoLink
                  className="travel-page__btn travel-page__btn--accent"
                  href={product.portoUrl}
                  productSlug={product.slug}
                  ctaLabel="Contratar Seguro Celular pela Porto"
                  ctaPosition="final_band"
                  pageSection="final_cta"
                  templateType="product_page"
                >
                  Contratar Seguro Celular pela Porto
                </TrackedPortoLink>
                <TrackedExternalLink
                  className="travel-page__btn travel-page__btn--ghost"
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  eventType="whatsapp_click"
                  productSlug={product.slug}
                  objective="cell_phone_support"
                  payload={{ cta_position: 'final_secondary', page_section: 'final_cta', template_type: 'product_page' }}
                >
                  Falar no WhatsApp
                </TrackedExternalLink>
              </div>

              <p className="travel-page__subnote">Contratação digital com apoio consultivo da H Soares.</p>
            </div>

            <div className="travel-page__final-visual travel-page__final-visual--cellphone" />
          </div>
        </div>
      </section>
    </>
  );
}

function PortoCardIntroSections({ product }) {
  const ctaProduct = {
    slug: product.slug,
    portoUrl: product.portoUrl
  };

  return (
    <>
      <section className="porto-card-intro-section">
        <PortoCardHeroCarousel product={ctaProduct} slides={PORTO_CARD_PAGE.carouselSlides} />
      </section>

      <section className="section porto-card-version-section" id="comparar-cartoes">
        <div className="container">
          <div className="porto-card-version-shell">
            <div className="section-head section-head-readable porto-card-section-head porto-card-version-head">
              <p className="eyebrow">Compare as versões</p>
              <h2>Escolha o cartão Porto que combina com seu momento</h2>
              <p>
                Compare os principais planos, veja os benefícios de cada perfil e avance para a contratação pelos
                canais oficiais da Porto.
              </p>
            </div>

            <PortoCardVersionSection
              product={ctaProduct}
              cards={PORTO_CARD_PAGE.versionCards}
              note="A contratação é realizada pelos canais oficiais da Porto, com orientação da H Soares Seguros."
            />
          </div>
        </div>
      </section>

      <section className="section porto-card-ecosystem-section section-soft-blue">
        <div className="container">
          <div className="section-head section-head-readable porto-card-section-head porto-card-visual-head">
            <p className="eyebrow">Benefícios percebidos</p>
            <h2>O ecossistema Porto ajuda o cartão a parecer mais útil, mais vivo e menos técnico</h2>
            <p>
              Quando o benefício aparece em viagem, abastecimento, mobilidade, app e serviços, o produto ganha contexto
              de uso e deixa de parecer apenas uma comparação fria de faixas.
            </p>
          </div>

          <div className="porto-card-ecosystem-layout">
            <article className="porto-card-ecosystem-feature">
              <div className="porto-card-ecosystem-feature-copy">
                <p className="eyebrow">{PORTO_CARD_PAGE.ecosystemFeature.eyebrow}</p>
                <h3>{PORTO_CARD_PAGE.ecosystemFeature.title}</h3>
                <p>{PORTO_CARD_PAGE.ecosystemFeature.text}</p>

                <div className="porto-card-ecosystem-highlights">
                  {PORTO_CARD_PAGE.ecosystemFeature.highlights.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </div>

              <div className="porto-card-ecosystem-feature-media">
                <SafeImage src={PORTO_CARD_PAGE.ecosystemFeature.image} alt={PORTO_CARD_PAGE.ecosystemFeature.alt} />
              </div>
            </article>

            <div className="porto-card-ecosystem-grid">
              {PORTO_CARD_PAGE.ecosystemCards.map((card) => (
                <article key={card.title} className={`porto-card-ecosystem-card porto-card-ecosystem-card--${card.accent}`}>
                  <div className="porto-card-ecosystem-card-media">
                    <SafeImage src={card.image} alt={card.alt} />
                  </div>
                  <div className="porto-card-ecosystem-card-copy">
                    <p className="eyebrow">{card.eyebrow}</p>
                    <h3>{card.title}</h3>
                    <p>{card.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section porto-card-human-section">
        <div className="container">
          <div className="section-head section-head-readable porto-card-section-head porto-card-visual-head">
            <p className="eyebrow">Mais contexto de uso</p>
            <h2>Menos página fria, mais sensação de produto real na rotina</h2>
            <p>
              O Cartão Porto fica mais persuasivo quando a apresentação mostra gente, celular, app e percepção de
              produto, e não apenas regras, faixa e renda.
            </p>
          </div>

          <div className="porto-card-human-grid">
            <article className="porto-card-human-hero-card">
              <div className="porto-card-human-hero-copy">
                <p className="eyebrow">{PORTO_CARD_PAGE.lifestyleHero.eyebrow}</p>
                <h3>{PORTO_CARD_PAGE.lifestyleHero.title}</h3>
                <p>{PORTO_CARD_PAGE.lifestyleHero.text}</p>

                <div className="porto-card-human-highlights">
                  {PORTO_CARD_PAGE.lifestyleHero.highlights.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </div>

              <div className="porto-card-human-hero-media">
                <SafeImage src={PORTO_CARD_PAGE.lifestyleHero.image} alt={PORTO_CARD_PAGE.lifestyleHero.alt} />
              </div>
            </article>

            <div className="porto-card-human-stack">
              {PORTO_CARD_PAGE.lifestyleCards.map((card) => (
                <article key={card.title} className={`porto-card-human-side-card porto-card-human-side-card--${card.accent}`}>
                  <div className="porto-card-human-side-copy">
                    <p className="eyebrow">{card.eyebrow}</p>
                    <h3>{card.title}</h3>
                    <p>{card.text}</p>
                  </div>

                  <div className="porto-card-human-side-media">
                    <SafeImage src={card.image} alt={card.alt} />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

    </>
  );
}

function PortoCardProductPage({ product, supportLinks }) {
  const whatsappHref = getWhatsAppHref('Olá, quero entender qual Cartão Porto combina com o meu perfil.');

  return (
    <>
      <PortoCardIntroSections product={product} />

      <section className="section">
        <div className="container faq-shell">
          <h2>Perguntas que mais travam a solicitação</h2>
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
        title="Leituras da H Soares para escolher a versão certa antes de pedir"
      />

      <section className="section">
        <div className="container">
          <div className="porto-card-cta-band">
            <div>
              <p className="eyebrow">Pedido oficial Porto</p>
              <h2>Se a faixa já ficou clara, siga agora para o link oficial da Porto</h2>
              <p>
                O pedido é digital e a análise é feita pelo Porto Bank. Se quiser, a H Soares fica como apoio rápido
                antes do clique, mas a ação principal desta página continua sendo a solicitação oficial.
              </p>
            </div>
            <div className="cta-row porto-card-band-actions">
              <ProductCtaButton
                product={product}
                label="Ir para o pedido oficial"
                payload={{ cta_placement: 'closing-band', page_template: 'porto-card-dedicated' }}
              />
              <TrackedExternalLink
                className="btn btn-ghost"
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                eventType="whatsapp_click"
                productSlug={product.slug}
                objective="porto_support"
                payload={{ cta_placement: 'closing-support', page_template: 'porto-card-dedicated', channel: 'whatsapp' }}
              >
                Preciso de ajuda rápida
              </TrackedExternalLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function buildProductSchemas(product) {
  const productUrl = absoluteUrl(`/produtos/${product.slug}`);
  const productDescription = product.seoDescription || product.shortDescription || product.longDescription;
  const productImage = product.seoImage
    ? absoluteUrl(product.seoImage)
    : product.heroImage?.startsWith('http')
      ? product.heroImage
      : absoluteUrl(product.heroImage);
  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: product.seoTitle || product.name,
    serviceType: product.name,
    category: product.category,
    description: productDescription,
    url: productUrl,
    image: productImage,
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

  const paymentCardSchema =
    product.slug === 'cartao-credito-porto-bank'
      ? {
          '@context': 'https://schema.org',
          '@type': 'PaymentCard',
          name: product.name,
          description: productDescription,
          url: productUrl,
          image: productImage,
          provider: {
            '@type': 'Organization',
            name: siteConfig.legalName,
            url: siteConfig.url
          },
          areaServed: 'BR'
        }
      : null;

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

  return [buildOrganizationSchema(), serviceSchema, paymentCardSchema, breadcrumbSchema, faqSchema].filter(Boolean);
}

export const dynamicParams = false;

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const product = getProductBySlug(resolvedParams?.slug);
  if (!product) {
    return {};
  }

  return {
    ...buildPageMetadata({
      title: product.seoTitle || `${product.name} | H Soares Seguros`,
      description: product.seoDescription || product.shortDescription,
      path: `/produtos/${product.slug}`,
      image: product.seoImage || product.heroImage
    }),
    keywords: product.keywords
  };
}

export default async function ProductPage({ params }) {
  const resolvedParams = await params;
  const product = getProductBySlug(resolvedParams?.slug);

  if (!product) {
    notFound();
  }

  if (product.slug === 'seguro-viagem') {
    return <SeguroViagemPage />;
  }

  const isResidential = product.slug === 'residencial-essencial';
  const isSurety = product.slug === 'seguro-fianca';
  const isPropertyInsurance = product.slug === 'seguro-imobiliario';
  const isCellPhone = product.slug === 'seguro-celular';
  const isPortoCard = product.slug === 'cartao-credito-porto-bank';
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
      text: 'Orientação consultiva para ajudar na decisão com mais clareza e menos dúvida.'
    },
    {
      icon: 'clock',
      title: 'Fluxo digital objetivo',
      text: 'A H Soares direciona para a contratação oficial no momento certo, com menos atrito.'
    },
    {
      icon: 'chat',
      title: 'WhatsApp direto',
      text: 'Canal rápido para tirar dúvidas e entender o melhor caminho antes da contratação.'
    }
  ];
  const residentialTrustItems = [
    { icon: 'shield', title: '30 anos de atuação', text: 'Orientação consultiva para proteger o patrimônio com mais critério.' },
    { icon: 'clock', title: 'Contratação digital', text: 'Fluxo ágil com envio para o ambiente oficial da Porto no momento certo.' },
    { icon: 'chat', title: 'Apoio humano real', text: 'WhatsApp direto para orientar cobertura, valores e próximos passos.' }
  ];
  const suretyTrustItems = [
    {
      icon: 'shield',
      title: 'Especialidade da H Soares',
      text: 'Seguro Fiança com jornada estruturada para locatário, proprietário e imobiliária.'
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
      <main className={isCellPhone ? 'travel-page travel-page--cellphone' : `product-page product-page--${product.slug}`}>
        {isCellPhone ? (
          <CellPhoneProductPage product={product} />
        ) : isPortoCard ? (
          <PortoCardProductPage product={product} supportLinks={supportLinks} />
        ) : isResidential ? (
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
                      <TrackedPortoLink
                        className="btn btn-primary"
                        href={product.portoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        productSlug={product.slug}
                        ctaPosition="hero_primary"
                        pageSection="hero"
                        templateType="product_page"
                      >
                        Cotar agora
                      </TrackedPortoLink>
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
                          <span>WhatsApp direto para tirar dúvidas e seguir com mais rapidez</span>
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
                    flexibilidade de análise e melhor enquadramento por perfil.
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
                      <TrackedPortoLink
                        className="btn btn-primary"
                        href={product.portoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        productSlug={product.slug}
                        ctaPosition="hero_primary"
                        pageSection="hero"
                        templateType="product_page"
                      >
                        Entender o seguro
                      </TrackedPortoLink>
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
                        <TrackedPortoLink
                          className="btn btn-primary"
                          href={product.portoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          productSlug={product.slug}
                          ctaPosition="hero_primary"
                          pageSection="hero"
                          templateType="product_page"
                        >
                          Cotar agora
                        </TrackedPortoLink>
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
                          <span>WhatsApp direto para tirar dúvidas e seguir com mais rapidez</span>
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
                    Organizamos os pontos mais importantes do produto para facilitar a comparação, o entendimento e o
                    avanço para a contratação oficial.
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
                    Essa leitura ajuda você a entender se o produto combina com o seu perfil antes de seguir para a
                    contratação oficial.
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
                  <h2>Atendimento consultivo</h2>
                  <ul>
                    <li>Orientação consultiva antes do redirecionamento para a contratação oficial.</li>
                    <li>Canal direto no WhatsApp para reduzir dúvidas e esclarecer a jornada.</li>
                    <li>Suporte da H Soares para ajudar você a escolher o produto com mais clareza.</li>
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
