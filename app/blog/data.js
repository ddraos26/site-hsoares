import { getPrimaryPortoDestinationByProductSlug } from '@/lib/porto-destinations';

const portoContractUrl =
  getPrimaryPortoDestinationByProductSlug('cartao-credito-porto-bank');

const portoCreditCardSource = {
  label: 'Porto Seguro - Cartão de crédito',
  url: 'https://www.portoseguro.com.br/sites/institucional/cartao-de-credito'
};

const portoMainCardSource = {
  label: 'Porto Seguro - Cartão Porto Bank',
  url: 'https://www.portoseguro.com.br/cartao-de-credito'
};

const portoCardAnnuitySource = {
  label: 'Porto - Como funciona a anuidade do cartão de crédito',
  url: 'https://www.portoseguro.com.br/faqs/como-funciona-a-anuidade-do-cartao-de-credito'
};

const portoCardPointsSource = {
  label: 'Porto - Benefícios do Programa de Relacionamento Porto Bank',
  url: 'https://www.portoseguro.com.br/faqs/quais-os-beneficios-do-programa-de-relacionamento-porto-bank'
};

const portoCardPointsRegistrationSource = {
  label: 'Porto - Cadastro no programa de pontos do Cartão Porto Bank',
  url: 'https://www.portoseguro.com.br/faqs/como-me-cadastrar-no-programa-de-pontos-do-cartao-porto-bank'
};

const portoCardPointsValiditySource = {
  label: 'Porto - Validade dos pontos do Cartão Porto Bank',
  url: 'https://www.portoseguro.com.br/faqs/qual-e-a-validade-dos-pontos-do-cartao-porto-bank'
};

const portoCardTariffSource = {
  label: 'Porto - Tabela de tarifas do cartão',
  url: 'https://www.portoseguro.com.br/content/dam/documentos/porto_bank/Tabela-Tarifas-Fev-25-CartaoPF.pdf'
};

const portoBlogLogo = '/assets/blog/porto-logo.png';

const nubankUltravioletaSource = {
  label: 'Nubank - Cartão Ultravioleta',
  url: 'https://nubank.com.br/ultravioleta/cartao-black'
};

const nubankIofSource = {
  label: 'Nubank - IOF zero Ultravioleta',
  url: 'https://nubank.com.br/ultravioleta/cartao-black/iof-zero'
};

const portoImages = {
  gold: {
    url: 'https://www.portoseguro.com.br/NovoInstitucional/static_files/images/cartao-de-credito/plasticos/Porto_Bank_Gold.png',
    alt: 'Cartão Porto Bank Gold oficial'
  },
  platinum: {
    url: 'https://www.portoseguro.com.br/NovoInstitucional/static_files/images/cartao-de-credito/plasticos/Porto_Bank_Platinum.png',
    alt: 'Cartão Porto Bank Platinum oficial'
  },
  black: {
    url: 'https://www.portoseguro.com.br/NovoInstitucional/static_files/images/cartao-de-credito/plasticos/Porto_Bank_MC_Black.png',
    alt: 'Cartão Porto Bank Mastercard Black oficial'
  },
  infinite: {
    url: 'https://www.portoseguro.com.br/NovoInstitucional/static_files/images/cartao-de-credito/plasticos/Porto_Bank_Visa_Infinite.png',
    alt: 'Cartão Porto Bank Visa Infinite oficial'
  },
  basic: {
    url: 'https://www.portoseguro.com.br/NovoInstitucional/static_files/images/cartao-de-credito/plasticos/Porto_Bank_Basic.png',
    alt: 'Cartão Porto Bank sem anuidade oficial'
  },
  international: {
    url: 'https://www.portoseguro.com.br/NovoInstitucional/static_files/images/cartao-de-credito/plasticos/Imagem-1-Porto-Seguro-International.png',
    alt: 'Cartão Porto Seguro Internacional oficial'
  }
};

const portoPreviewImages = {
  black: {
    url: '/assets/blog/porto-card-infinite-user-trimmed.png',
    alt: 'Cartão Porto Bank preto oficial em destaque',
    size: '46%',
    position: 'center 78%'
  },
  infinite: {
    url: '/assets/blog/porto-card-infinite-user-trimmed.png',
    alt: 'Cartão Porto Bank Visa Infinite oficial em destaque',
    size: '46%',
    position: 'center 78%'
  },
  platinum: {
    url: '/assets/blog/porto-card-platinum-user-trimmed.png',
    alt: 'Cartão Porto Bank Platinum oficial em destaque',
    size: '50%',
    position: 'center 80%'
  },
  duoBlue: {
    url: '/assets/blog/porto-card-international-user-trimmed.png',
    alt: 'Cartão Porto Bank azul internacional oficial em destaque',
    size: '52%',
    position: 'center 82%'
  }
};

export const topics = [
  {
    title: 'Comparativos que ajudam a decidir',
    subtopics: [
      'Porto x Nubank com foco em utilidade real',
      'Quando o ecossistema Porto pesa mais que cashback puro',
      'Como ler benefícios sem exagero nem promessa vaga'
    ],
    summary: 'Compare opções olhando benefícios, custo e utilidade no dia a dia, sem decidir só pela aparência do cartão.'
  },
  {
    title: 'Guias práticos de uso',
    subtopics: ['IOF zero e viagem internacional', 'Como zerar a anuidade', 'Qual versão do cartão faz sentido para cada perfil'],
    summary: 'Entenda pedido, anuidade, viagem e variante ideal antes de avançar para a solicitação.'
  },
  {
    title: 'Benefícios que saem do papel',
    subtopics: ['Tag Porto e Shell Box', 'Salas VIP e seguro viagem', 'PortoPlus para milhas e descontos em seguros'],
    summary: 'Veja onde os benefícios realmente aparecem na rotina, da Tag Porto ao uso de pontos e vantagens em viagem.'
  }
];

export const blogCategories = [
  {
    slug: 'cartoes',
    title: 'Cartões',
    description:
      'Benefícios, anuidade, comparativos e versões do Cartão Porto para descobrir qual cartão faz mais sentido no uso real.',
    href: '/blog/cartoes',
    status: 'Comece por aqui',
    statusTone: 'live',
    accent: 'Benefícios e anuidade',
    countLabel: '12 leituras publicadas',
    tone: 'blue',
    image: '/assets/blog/porto-hero-option-2-crop.jpeg',
    imageAlt: 'Cartões Porto em destaque para a categoria de cartões',
    imageEyebrow: 'Cartão Porto',
    imageSize: '122%',
    imagePosition: '70% 48%'
  },
  {
    slug: 'seguro-celular',
    title: 'Seguro Celular',
    description:
      'Cobertura, roubo, furto, preço, iPhone, AppleCare, celular novo, aparelho usado e vigência explicados de forma simples para você escolher a proteção com mais clareza.',
    href: '/blog/seguro-celular',
    status: 'Cobertura essencial',
    statusTone: 'live',
    accent: 'Roubo, dano e vigência',
    countLabel: '8 leituras publicadas',
    tone: 'indigo',
    image: '/assets/blog/ip.png',
    imageAlt: 'Linha de iPhones premium para a categoria de Seguro Celular',
    imageEyebrow: 'Seguro Celular',
    imageSize: '68%',
    imagePosition: 'right -8px bottom 8px'
  },
  {
    slug: 'seguro-auto',
    title: 'Seguro Auto',
    description:
      'Cobertura, franquia, assistência e serviços para cotar melhor, sem pular etapa importante.',
    href: '/blog/seguro-auto',
    status: 'Guia prático',
    statusTone: 'muted',
    accent: 'Franquia e assistência',
    countLabel: '2 leituras publicadas',
    tone: 'teal',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Carro em estrada para a categoria de Seguro Auto',
    imageEyebrow: 'Seguro Auto'
  },
  {
    slug: 'plano-saude',
    title: 'Plano de Saúde',
    description:
      'Rede, reembolso, coparticipação e telemedicina para comparar o plano com mais critério.',
    href: '/blog/plano-saude',
    status: 'Comparação útil',
    statusTone: 'muted',
    accent: 'Rede e coparticipação',
    countLabel: '2 leituras publicadas',
    tone: 'emerald',
    image: 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Atendimento em saúde para a categoria de Plano de Saúde',
    imageEyebrow: 'Plano de Saúde'
  },
  {
    slug: 'fianca-e-imobiliario',
    title: 'Fiança e Imobiliário',
    description:
      'Locação sem fiador, coberturas e pontos do contrato para inquilino, proprietário e imobiliária.',
    href: '/blog/fianca-e-imobiliario',
    status: 'Locação sem fiador',
    statusTone: 'muted',
    accent: 'Garantia e contrato',
    countLabel: '2 leituras publicadas',
    tone: 'gold',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Imóvel residencial para a categoria de Fiança e Imobiliário',
    imageEyebrow: 'Fiança e Imobiliário'
  }
];

export const updates = [
  {
    slug: 'cartao-portoseguro-beneficios',
    title: 'Cartão Porto Seguro: benefícios, anuidade e como solicitar',
    pageTitle: 'Cartão Porto Seguro vale a pena? Benefícios, anuidade e como solicitar em 2026',
    date: '19 de março de 2026',
    readTime: '7 min de leitura',
    tags: ['Cartão Porto', 'Anuidade', 'Benefícios'],
    excerpt:
      'O Cartão Porto costuma fazer mais sentido para quem quer pontos no PortoPlus, descontos em serviços da Porto, Tag Porto sem mensalidade e uma regra de anuidade que pode melhorar com o uso.',
    overview:
      'Se você está pensando em pedir o Cartão Porto Seguro, a pergunta certa não é só se ele parece premium. O que realmente importa é entender onde ele entrega valor: pontos no PortoPlus, descontos em produtos e serviços da Porto, Tag Porto sem mensalidade em várias versões e uma regra de anuidade que pode melhorar conforme o gasto. Neste guia, reunimos as informações mais importantes, consultadas em 19 de março de 2026, para ajudar você a decidir com mais clareza.',
    contractUrl: portoContractUrl,
    visual: {
      eyebrow: 'Cartão Porto',
      title: 'Benefícios que aparecem no uso real',
      subtitle: 'PortoPlus, descontos, app e Tag Porto reunidos em uma leitura mais objetiva.',
      chips: ['PortoPlus', 'Tag Porto', 'Anuidade'],
      tone: 'blue',
      logo: portoBlogLogo
    },
    heroImage: portoImages.black,
    cardCoverImage: portoPreviewImages.duoBlue,
    sources: [
      portoCreditCardSource,
      portoMainCardSource,
      portoCardAnnuitySource,
      portoCardPointsSource,
      portoCardPointsRegistrationSource,
      portoCardPointsValiditySource
    ],
    utilityItems: [
      'Vale mais para quem quer usar o cartão no dia a dia e aproveitar benefícios fora da fatura, como descontos e serviços da Porto.',
      'Faz sentido para quem aceita escolher a versão certa e usar o cartão com frequência para melhorar o custo da anuidade.',
      'Tende a ser mais interessante para quem valoriza pontos, parceiros e ecossistema Porto, e não apenas um cartão básico.'
    ],
    faq: [
      {
        question: 'O Cartão Porto Seguro tem anuidade?',
        answer:
          'Tem versões e regras diferentes. Pelas páginas consultadas em 19 de março de 2026, existe opção sem anuidade e também há cartões com 1 ano ou 6 meses de isenção inicial, com desconto calculado conforme o gasto mensal depois desse período.'
      },
      {
        question: 'O Cartão Porto acumula pontos?',
        answer:
          'Sim. A Porto informa que as compras acumulam pontos no PortoPlus, sem cadastro separado, e esses pontos podem ser usados em milhas aéreas, viagens, produtos, serviços e descontos.'
      },
      {
        question: 'Preciso ter seguro Porto para pedir o cartão?',
        answer:
          'Não. O pedido pode ser feito sem ter outro produto, mas o cartão costuma fazer mais sentido quando a pessoa também aproveita descontos e condições em serviços da Porto.'
      },
      {
        question: 'Como solicitar o Cartão Porto com segurança?',
        answer:
          'A solicitação é feita online, em ambiente oficial da Porto, e segue análise de crédito. O atalho desta página leva direto para o canal oficial de contratação.'
      }
    ],
    blocks: [
      {
        title: 'O que é o Cartão Porto Seguro',
        text:
          'O Cartão Porto Bank é a linha de cartões de crédito da Porto. Nas páginas consultadas em 19 de março de 2026, a marca destaca versões sem anuidade, cartões com programa de pontos e opções premium para quem busca mais benefícios no uso diário e em viagem.'
      },
      {
        title: 'Principais benefícios do cartão',
        text:
          'Entre os diferenciais oficiais aparecem PortoPlus para acúmulo de pontos, gerenciamento pelo App Porto, carteiras digitais, Tag Porto sem mensalidade em várias versões, desconto com Shell Box e condições especiais em produtos e serviços da própria Porto.'
      },
      {
        title: 'Como funciona a anuidade',
        text:
          'A anuidade não é igual para todos os cartões. Há opção sem anuidade e, em cartões como International, Gold e Platinum, a Porto informa período inicial de isenção e desconto calculado de acordo com o gasto mensal. Em versões premium, a tabela também muda conforme a faixa de gasto e os critérios do produto.'
      },
      {
        title: 'Programa de pontos e resgates',
        text:
          'O PortoPlus é um dos pontos centrais do cartão. Segundo a Porto, você já passa a gerar pontos ao usar o cartão, sem cadastro separado, e pode consultar saldo pelo app, pela área logada ou pelo WhatsApp. Os resgates incluem milhas, viagens, produtos, serviços e descontos, e a validade informada para os pontos é de 24 meses.'
      },
      {
        title: 'Cartão Porto vale a pena para quem?',
        text:
          'Ele tende a valer mais a pena para quem quer um cartão com benefícios práticos, já usa ou pretende usar serviços da Porto e enxerga valor em pontos, parceiros e descontos. Para quem quer apenas um cartão totalmente básico, sem regra de gasto e sem interesse em ecossistema, talvez não seja a opção mais simples.'
      },
      {
        title: 'Como solicitar',
        text:
          'A contratação pode ser iniciada online. O passo mais seguro é seguir para o ambiente oficial da Porto, comparar a versão que faz sentido para o seu perfil e concluir o pedido, sujeito à análise de crédito.'
      }
    ]
  },
  {
    slug: 'cartao-porto-x-nubank',
    title: 'Cartão Porto x Nubank Ultravioleta: onde a Porto leva vantagem para quem quer benefícios fora do app',
    date: '12 de março de 2026',
    readTime: '7 min de leitura',
    tags: ['Comparativo', 'Porto x Nubank', 'Crédito premium'],
    excerpt:
      'Nubank se destaca em cashback, salas VIP e IOF zero. O Cartão Porto passa a fazer mais sentido quando você valoriza descontos em seguros, Tag Porto, Shell Box e benefícios que aparecem no uso diário.',
    overview:
      'No comparativo direto, o Nubank Ultravioleta chama atenção em viagens, com IOF zero, spread reduzido e acessos a salas VIP. Já o Cartão Porto pode fazer mais sentido para quem quer descontos em seguros, Tag Porto, Shell Box e vantagens aplicáveis também no Brasil.',
    contractUrl: portoContractUrl,
    visual: {
      eyebrow: 'Comparativo de mercado',
      title: 'Porto x Nubank',
      subtitle: 'Veja quando a Porto faz mais sentido no uso diário e quando o Nubank se destaca em viagem.',
      chips: ['Seguros Porto', 'Tag Porto', 'Uso diário'],
      tone: 'indigo',
      logo: portoBlogLogo
    },
    heroImage: portoImages.infinite,
    cardCoverImage: portoPreviewImages.infinite,
    sources: [portoCreditCardSource, nubankUltravioletaSource, nubankIofSource],
    utilityItems: [
      'Porto tende a fazer mais sentido para quem já usa seguros e serviços da marca no dia a dia.',
      'Nubank se destaca mais para viagens e compras internacionais frequentes.',
      'A comparação correta depende do perfil de gasto, não só do marketing de um benefício isolado.'
    ],
    faq: [
      {
        question: 'Qual é melhor para viagem internacional?',
        answer: 'Pelas informações oficiais consultadas em 12/03/2026, o Nubank Ultravioleta está mais forte nesse ponto por causa do IOF zero na fatura, spread de 3,5% e 4 visitas anuais ao Priority Pass.'
      },
      {
        question: 'Quando a Porto supera o Nubank?',
        answer: 'Quando você valoriza descontos em seguros, Tag Porto, Shell Box e benefícios que se integram a outros serviços da marca.'
      }
    ],
    blocks: [
      {
        title: 'Quando a Porto faz mais sentido',
        text: 'Se você quer aproveitar descontos em seguros, Tag Porto, Shell Box e facilidades ligadas aos serviços da Porto, a escolha pode fazer mais sentido do que um cartão centrado apenas em cashback.'
      },
      {
        title: 'Onde o Nubank continua forte',
        text: 'O Ultravioleta destaca IOF zero, spread de 3,5% em compras internacionais, 2,2 pontos por dólar ou 1,25% de cashback e 4 visitas por ano a salas VIP Priority Pass, além do lounge próprio em Guarulhos.'
      },
      {
        title: 'Como comparar sem forçar a conclusão',
        text: 'A leitura mais honesta e simples: a Porto tende a entregar mais para quem já usa serviços da marca e valoriza benefícios no uso local; o Nubank continua forte para quem prioriza cashback e viagem.'
      }
    ]
  },
  {
    slug: 'porto-viagem-iof-zero',
    title: 'Viagem com Porto: como usar IOF zero na Conta Porto e manter os benefícios do cartão no radar',
    date: '12 de março de 2026',
    readTime: '5 min de leitura',
    tags: ['Viagem', 'IOF zero', 'Conta Porto'],
    excerpt:
      'A própria Porto destaca a Conta Porto para viagem internacional com IOF zero. Combinada ao cartão, ela pode ajudar quem quer organizar melhor compras, proteção e benefícios na viagem.',
    overview:
      'Se a sua dúvida é como viajar pagando menos no exterior sem abrir mão dos benefícios do cartão, este guia mostra como a Conta Porto e o Cartão Porto podem atuar juntos na mesma estratégia. A base oficial destaca IOF zero na conta internacional e benefícios de viagem em variantes premium do cartão.',
    contractUrl: portoContractUrl,
    visual: {
      eyebrow: 'Viagem internacional',
      title: 'Conta Porto + cartão',
      subtitle: 'IOF zero na conta e benefícios premium no cartão para montar uma estratégia mais clara de viagem.',
      chips: ['IOF zero', 'Sala VIP', 'Seguro viagem'],
      tone: 'teal',
      logo: portoBlogLogo
    },
    heroImage: portoImages.black,
    cardCoverImage: portoPreviewImages.black,
    sources: [portoMainCardSource, portoCreditCardSource],
    utilityItems: [
      'Ajuda você a separar o que entra pela conta e o que faz sentido concentrar no cartão.',
      'Evita a confusão de achar que um único produto resolve toda a estratégia de viagem.',
      'Serve para quem quer conforto de embarque e controle melhor do custo internacional.'
    ],
    faq: [
      {
        question: 'O IOF zero está no cartão Porto?',
        answer: 'Pelas informações oficiais consultadas, a Conta Porto aparece com IOF zero para viagem internacional. Já os benefícios premium de viagem ficam associados a determinadas variantes do cartão.'
      },
      {
        question: 'Vale usar conta e cartão juntos?',
        answer: 'Para muitos perfis, sim. A conta pode ser a peça de economia internacional e o cartão entra com praticidade, proteções e benefícios premium.'
      }
    ],
    blocks: [
      {
        title: 'O que é oficial hoje',
        text: 'Nas páginas oficiais consultadas, a Porto destaca a Conta Porto para viagem internacional com IOF zero e, nas versões premium do cartão, benefícios de viagem como seguros e acessos a salas VIP.'
      },
      {
        title: 'Como combinar conta e cartão sem confusão',
        text: 'Em vez de esperar que um único produto resolva tudo, o caminho mais claro é separar funções: conta para compras internacionais com IOF zero e cartão para conveniência, coberturas e benefícios premium.'
      },
      {
        title: 'O que verificar antes de decidir',
        text: 'Vale sempre conferir a variante do cartão, a regra vigente e se os benefícios realmente combinam com o seu perfil de viagem. Isso ajuda a decidir com mais segurança.'
      }
    ]
  },
  {
    slug: 'porto-salas-vip-e-seguros',
    title: 'Salas VIP, seguro viagem e Tag Porto: como esses benefícios mudam o valor do Cartão Porto',
    date: '12 de março de 2026',
    readTime: '5 min de leitura',
    tags: ['Sala VIP', 'Seguro viagem', 'Tag Porto'],
    excerpt:
      'Os cartões Porto premium reúnem seguro viagem, acessos a salas VIP e vantagens no deslocamento do dia a dia. O diferencial aparece quando esse pacote combina com a sua rotina.',
    overview:
      'Na camada premium, a Porto reúne benefícios de viagem e utilidade diária no mesmo cartão. O resultado pode fazer mais sentido para quem quer conforto no embarque, proteção na viagem e vantagens que continuam valendo depois do retorno.',
    contractUrl: portoContractUrl,
    visual: {
      eyebrow: 'Benefícios premium',
      title: 'Sala VIP + proteção',
      subtitle: 'Conforto de embarque somado a vantagens que também aparecem no uso diário.',
      chips: ['Sala VIP', 'Tag Porto', 'Seguro viagem'],
      tone: 'gold',
      logo: portoBlogLogo
    },
    heroImage: portoImages.black,
    cardCoverImage: portoPreviewImages.black,
    sources: [portoCreditCardSource],
    utilityItems: [
      'Bom para quem quer um cartão que entregue valor antes, durante e depois da viagem.',
      'Ajuda a entender que benefício premium só faz sentido quando combina com o seu uso real.',
      'Mostra que o cartão não vive apenas de lounge: há valor também em Tag Porto e descontos locais.'
    ],
    faq: [
      {
        question: 'Toda versão do cartão Porto dá acesso a sala VIP?',
        answer: 'Não. Segundo a página oficial consultada em 12/03/2026, os benefícios de sala VIP aparecem nas variantes superiores e com regras próprias.'
      },
      {
        question: 'Seguro viagem vem em qual cartão?',
        answer: 'A Porto destaca seguros e benefícios gratuitos para viagens nas versões premium, como Mastercard Black e Visa Infinite.'
      }
    ],
    blocks: [
      {
        title: 'Valor percebido rápido',
        text: 'Sala VIP, seguro viagem e benefícios de mobilidade são fáceis de perceber na prática. O ponto principal é entender se esse pacote combina com a sua frequência de viagem e com o seu jeito de usar o cartão.'
      },
      {
        title: 'O diferencial Porto',
        text: 'A Porto soma esses benefícios premium a descontos nos seus próprios serviços, o que ajuda a diferenciar a oferta de cartões que concentram tudo apenas em cashback ou milhas.'
      },
      {
        title: 'Quando esse pacote faz mais sentido',
        text: 'Esse conjunto costuma pesar mais para quem viaja com frequência, valoriza conforto no embarque e também usa benefícios como Tag Porto e descontos em serviços da marca.'
      }
    ]
  },
  {
    slug: 'qual-cartao-porto-escolher',
    title: 'Qual cartão Porto escolher: sem anuidade, Gold, Platinum, Black ou Visa Infinite?',
    date: '12 de março de 2026',
    readTime: '7 min de leitura',
    tags: ['Guia prático', 'Anuidade', 'Variantes'],
    excerpt:
      'O melhor cartão Porto não é o mais caro. É o que encaixa na sua renda, no seu gasto mensal e no tipo de benefício que você realmente usa.',
    overview:
      'A página oficial da Porto apresenta variantes com perfis diferentes: sem anuidade, International, Gold, Platinum, Mastercard Black e Visa Infinite. Este guia resume o que observar em cada faixa antes de pedir o cartão, sem complicar a comparação.',
    contractUrl: portoContractUrl,
    visual: {
      eyebrow: 'Guia de escolha',
      title: 'Escolha por perfil',
      subtitle: 'Renda, gasto mensal e benefício usado importam mais que status.',
      chips: ['Sem anuidade', 'Gold', 'Platinum'],
      tone: 'blue',
      logo: portoBlogLogo
    },
    heroImage: portoImages.platinum,
    cardCoverImage: portoPreviewImages.platinum,
    sources: [portoCreditCardSource],
    utilityItems: [
      'Sem anuidade e International entram melhor para quem quer praticidade com custo menor.',
      'Gold e Platinum fazem mais sentido para quem já concentra gasto e quer subir o retorno.',
      'Black e Visa Infinite ficam mais alinhados a quem busca benefícios premium de viagem e convite.'
    ],
    faq: [
      {
        question: 'Existe um melhor cartão Porto para todo mundo?',
        answer: 'Não. A melhor escolha depende do seu gasto, da sua renda e do benefício que você usa de verdade.'
      },
      {
        question: 'Vale pular direto para a versão premium?',
        answer: 'Só se você realmente aproveitar os benefícios premium ou tiver volume de gasto compatível. Caso contrário, uma variante intermediária pode entregar mais custo-benefício.'
      }
    ],
    blocks: [
      {
        title: 'Comece pelo uso, não pelo nome do cartão',
        text: 'Quem quer fugir de anuidade alta e usar Tag Porto, Shell Box e app sem complexidade tende a olhar melhor para sem anuidade, International e Gold.'
      },
      {
        title: 'Platinum para quem já concentra gasto',
        text: 'No Platinum, a Porto oficializa pontuação maior que Gold e mantém o pacote de benefícios do ecossistema. Para quem usa mais o cartão, ele costuma ser um meio-termo forte.'
      },
      {
        title: 'Black e Infinite para viagem e experiência premium',
        text: 'As variantes superiores concentram salas VIP, seguros de viagem e pontuação elevada. São mais indicadas para quem de fato usa esse tipo de benefício.'
      }
    ]
  },
  {
    slug: 'anuidade-cartao-porto-como-zerar',
    title: 'Como funciona a anuidade do cartão Porto e quando dá para zerar o custo',
    date: '12 de março de 2026',
    readTime: '6 min de leitura',
    tags: ['Anuidade', 'Custo-benefício', 'Guia'],
    excerpt:
      'A Porto trabalha com faixas de gasto mensal e, em algumas versões, com isenção inicial. Entender isso antes de pedir o cartão evita contratar uma categoria acima do que você usa.',
    overview:
      'Anuidade é um dos pontos mais sensíveis da compra. Este artigo resume a lógica da Porto: algumas versões com primeiro ano grátis, outras com redução ou gratuidade conforme o gasto mensal e regras específicas para cada categoria.',
    contractUrl: portoContractUrl,
    visual: {
      eyebrow: 'Custo-benefício',
      title: 'Quando zera a anuidade',
      subtitle: 'Olhar a tabela antes de contratar evita erro de categoria.',
      chips: ['Gasto mensal', 'Primeiro ano', 'Regra por variante'],
      tone: 'teal',
      logo: portoBlogLogo
    },
    heroImage: portoImages.gold,
    cardCoverImage: portoPreviewImages.duoBlue,
    sources: [portoCreditCardSource],
    utilityItems: [
      'Ajuda você a não pagar por uma categoria acima do próprio uso.',
      'Mostra quando a anuidade pode cair ou zerar conforme o gasto mensal.',
      'É um dos temas mais importantes para decidir com segurança, porque responde uma dúvida real sobre custo-benefício.'
    ],
    faq: [
      {
        question: 'Todo cartão Porto tem primeiro ano grátis?',
        answer: 'Não. A página oficial destaca essa condição para algumas variantes e com regras próprias. É preciso checar a categoria exata.'
      },
      {
        question: 'Vale escolher só pelo critério da anuidade?',
        answer: 'Não. Se a variante superior devolver valor em pontos, viagem ou descontos que você realmente usa, o custo pode se justificar.'
      }
    ],
    blocks: [
      {
        title: 'A regra prática para não errar',
        text: 'Olhe primeiro seu gasto médio mensal. Se ele não sustenta a faixa de isenção da anuidade, provavelmente a categoria escolhida está acima do que faz sentido hoje.'
      },
      {
        title: 'O primeiro ano ajuda, mas não resolve sozinho',
        text: 'A isenção inicial pode ser boa para testar o produto, mas a decisão correta é olhar como o cartão vai ficar depois do período promocional.'
      },
      {
        title: 'Quando subir de categoria faz sentido',
        text: 'Se o volume de gastos, viagens e uso de benefícios premium justificar, uma categoria acima pode gerar mais valor. Sem esse uso, o custo-benefício pode piorar.'
      }
    ]
  },
  {
    slug: 'portoplus-milhas-descontos',
    title: 'PortoPlus: quando vale trocar pontos por milhas e quando o desconto em seguros pesa mais',
    date: '12 de março de 2026',
    readTime: '6 min de leitura',
    tags: ['PortoPlus', 'Milhas', 'Descontos'],
    excerpt:
      'A Porto destaca o PortoPlus como programa de relacionamento para trocar pontos por milhas, viagens, produtos e descontos em seguros e serviços. O melhor resgate depende do seu perfil de uso.',
    overview:
      'Muita gente acumula ponto sem estratégia. Neste guia, você entende quando faz mais sentido usar PortoPlus para milhas, quando vale mais usar em descontos do ecossistema Porto e como isso muda conforme o seu perfil.',
    contractUrl: portoContractUrl,
    visual: {
      eyebrow: 'PortoPlus',
      title: 'Pontos com estratégia',
      subtitle: 'Milhas, produtos e desconto em seguros exigem leitura de perfil.',
      chips: ['Milhas', 'Seguros', 'Resgate inteligente'],
      tone: 'indigo',
      logo: portoBlogLogo
    },
    heroImage: portoImages.international,
    cardCoverImage: portoPreviewImages.duoBlue,
    sources: [portoCreditCardSource],
    utilityItems: [
      'Bom para quem quer parar de acumular ponto sem saber como usar.',
      'Ajuda a escolher entre milhas e desconto no próprio ecossistema Porto.',
      'Conecta o cartão a uma utilidade financeira concreta.'
    ],
    faq: [
      {
        question: 'Sempre vale mandar ponto para milhas?',
        answer: 'Não. Para quem usa serviços Porto e consegue desconto real em seguros ou produtos, o resgate dentro do ecossistema pode render mais valor.'
      },
      {
        question: 'Ponto parado perde valor?',
        answer: 'Em geral, o risco de qualquer programa é acumular sem estratégia. O melhor caminho é definir o objetivo de uso desde o início.'
      }
    ],
    blocks: [
      {
        title: 'Milhas fazem mais sentido para quem voa',
        text: 'Se você viaja com frequência, transferir pontos para programas de milhagem pode ser o melhor aproveitamento do PortoPlus.'
      },
      {
        title: 'Desconto em seguros pesa para quem vive o ecossistema Porto',
        text: 'Quem tem seguro auto, residência ou usa serviços da Porto pode perceber mais valor usando os pontos para reduzir custo dentro da própria casa.'
      },
      {
        title: 'Não existe resgate ideal universal',
        text: 'O melhor uso depende do perfil. O ponto central é decidir antes de acumular no automático, para transformar os pontos em algo realmente útil.'
      }
    ]
  },
  {
    slug: 'cartao-porto-vale-a-pena-2026',
    title: 'Cartão Porto Seguro vale a pena em 2026? Vantagens e desvantagens',
    pageTitle: 'Cartão Porto Seguro vale a pena em 2026? Análise completa, vantagens e desvantagens',
    date: '19 de março de 2026',
    readTime: '7 min de leitura',
    tags: ['Vale a pena', 'Vantagens', 'Desvantagens'],
    excerpt:
      'O Cartão Porto tende a valer mais a pena para quem quer pontos, descontos e integração com o ecossistema Porto; para perfis muito básicos, ele pode ser mais do que o necessário.',
    overview:
      'Se você está pensando em solicitar o Cartão Porto Seguro, a pergunta principal é simples: ele realmente vale a pena ou é só mais um cartão comum? A resposta depende do perfil de uso. Para quem valoriza programa de pontos, descontos, benefícios em serviços da Porto e uma experiência mais completa no dia a dia, ele pode ser uma opção forte. Para quem quer apenas um cartão básico, sem interesse em vantagens extras, talvez existam alternativas mais simples. Neste guia, organizamos os principais pontos para ajudar na decisão.',
    contractUrl: portoContractUrl,
    visual: {
      eyebrow: 'Análise completa',
      title: 'Quando o Cartão Porto compensa de verdade',
      subtitle: 'Pontos, descontos, ecossistema Porto e custo-benefício vistos com mais clareza.',
      chips: ['Pontos', 'Benefícios', 'Anuidade'],
      tone: 'blue',
      logo: portoBlogLogo
    },
    heroImage: portoImages.infinite,
    cardCoverImage: portoPreviewImages.infinite,
    sources: [
      portoCreditCardSource,
      portoMainCardSource,
      portoCardAnnuitySource,
      portoCardPointsSource,
      portoCardPointsRegistrationSource,
      portoCardPointsValiditySource
    ],
    utilityItems: [
      'Faz mais sentido para quem usa bem o cartão e quer transformar gasto em pontos, descontos e benefícios concretos.',
      'Tende a ficar mais interessante para quem já conversa com o ecossistema da Porto e aproveita serviços e vantagens da marca.',
      'Pode não ser a melhor escolha para quem quer apenas um cartão muito simples, sem depender de regras de uso para enxergar valor.'
    ],
    faq: [
      {
        question: 'O Cartão Porto Seguro vale a pena?',
        answer:
          'Sim, principalmente para quem quer mais do que um cartão básico. Quando você valoriza pontos, descontos e benefícios adicionais, o Cartão Porto tende a fazer mais sentido.'
      },
      {
        question: 'Ele é melhor que cartões mais simples?',
        answer:
          'Depende do objetivo. Cartões mais simples costumam ganhar em facilidade e custo direto. O Cartão Porto se destaca quando você quer uma oferta mais completa, com vantagens extras e relação com o ecossistema da marca.'
      },
      {
        question: 'O Cartão Porto tem anuidade?',
        answer:
          'A regra muda conforme a versão. Pelas informações oficiais consultadas em 19 de março de 2026, existem variantes sem anuidade e outras com isenção inicial ou desconto conforme o gasto mensal.'
      }
    ],
    blocks: [
      {
        title: 'O que é o Cartão Porto Seguro',
        text:
          'O Cartão Porto é a linha de crédito da Porto para quem busca mais do que pagamento e limite. A proposta da marca combina programa de pontos, benefícios em serviços, app, Tag Porto e vantagens que podem fazer diferença no uso diário.'
      },
      {
        title: 'Programa de pontos e retorno sobre o gasto',
        text:
          'Um dos maiores atrativos do cartão está no acúmulo de pontos no PortoPlus. Segundo a Porto, esses pontos podem ser usados em milhas, viagens, produtos, serviços e descontos. Isso ajuda a perceber retorno mais concreto sobre os gastos do mês.'
      },
      {
        title: 'Benefícios que vão além do cartão comum',
        text:
          'O Cartão Porto se diferencia quando a conversa sai do básico. Descontos em serviços, condições especiais em produtos da Porto e integração com benefícios da marca deixam a proposta mais completa para quem quer usar o cartão como ferramenta do dia a dia.'
      },
      {
        title: 'A integração com o ecossistema Porto pesa bastante',
        text:
          'Para quem já usa ou pretende usar produtos e serviços da Porto, o cartão tende a ganhar força. É justamente nessa combinação entre crédito, serviços, descontos e conveniência que ele costuma entregar valor mais evidente.'
      },
      {
        title: 'A anuidade precisa entrar na conta com honestidade',
        text:
          'Em algumas variantes existe anuidade, mas a regra muda conforme a categoria e o nível de gasto. Pelas páginas oficiais consultadas em 19 de março de 2026, há cartões sem anuidade e outros com possibilidade de redução, isenção inicial ou desconto conforme o uso. O jeito certo de decidir é olhar a categoria escolhida e o volume real de compras.'
      },
      {
        title: 'Quando vale a pena e quando pode não valer',
        text:
          'No geral, o Cartão Porto vale mais a pena para quem usa bem o crédito, quer acumular pontos e enxerga utilidade nos benefícios extras. Por outro lado, para quem quer apenas um cartão enxuto, sem ligação com serviços adicionais e sem uso frequente, ele pode parecer robusto demais.'
      }
    ]
  },
  {
    slug: 'cartao-porto-anuidade-como-zerar',
    title: 'Cartão Porto Seguro tem anuidade? Veja como funciona e como zerar',
    pageTitle: 'Cartão Porto Seguro tem anuidade? Veja como funciona e como zerar',
    date: '19 de março de 2026',
    readTime: '6 min de leitura',
    tags: ['Anuidade', 'Como zerar', 'Custo-benefício'],
    excerpt:
      'O Cartão Porto pode ter anuidade em algumas versões, mas a regra muda conforme o cartão e o volume de gastos. Em certos casos, o custo cai bastante ou até deixa de existir.',
    overview:
      'Uma das primeiras dúvidas de quem pensa em pedir o Cartão Porto Seguro é se ele tem anuidade. A resposta curta é: depende da versão e da forma de uso. Existem cartões da Porto sem anuidade e outros em que o valor pode ser reduzido conforme o gasto mensal, além de períodos iniciais de isenção em algumas categorias. Neste guia, você entende como essa lógica funciona e quando o custo pode fazer sentido na troca pelos benefícios.',
    contractUrl: portoContractUrl,
    visual: {
      eyebrow: 'Anuidade do cartão',
      title: 'Como ler o custo sem errar na escolha',
      subtitle: 'Entenda quando a anuidade pesa menos, quando pode zerar e quando o benefício compensa.',
      chips: ['Anuidade', 'Gasto mensal', 'Isenção'],
      tone: 'teal',
      logo: portoBlogLogo
    },
    heroImage: portoImages.gold,
    cardCoverImage: portoPreviewImages.duoBlue,
    sources: [portoCreditCardSource, portoCardAnnuitySource, portoCardTariffSource],
    utilityItems: [
      'Ajuda a evitar o erro de descartar o Cartão Porto só porque existe anuidade em algumas versões.',
      'Organiza a leitura entre versão sem anuidade, isenção inicial e desconto conforme o gasto mensal.',
      'Mostra quando faz sentido pagar pela categoria escolhida e quando é melhor ficar em uma opção mais enxuta.'
    ],
    faq: [
      {
        question: 'O Cartão Porto Seguro tem anuidade?',
        answer:
          'Sim, algumas versões possuem anuidade. Pelas páginas oficiais consultadas em 19 de março de 2026, também existem opções sem anuidade e categorias com isenção inicial ou desconto conforme o gasto mensal.'
      },
      {
        question: 'Dá para zerar a anuidade?',
        answer:
          'Em alguns casos, sim. A Porto informa que o valor pode ser calculado de acordo com os gastos mensais em determinadas categorias, o que reduz bastante o custo e pode levar a isenção conforme a regra da versão.'
      },
      {
        question: 'Vale a pena pagar anuidade?',
        answer:
          'Depende do uso. Se você aproveita pontos, benefícios premium, descontos e utilidade no ecossistema Porto, o custo pode se justificar. Para quem quer só um cartão simples, talvez uma categoria sem anuidade faça mais sentido.'
      }
    ],
    blocks: [
      {
        title: 'O Cartão Porto cobra anuidade, mas a regra não é única',
        text:
          'O primeiro ponto importante é evitar uma leitura simplista. Nem todo Cartão Porto funciona da mesma forma. A página institucional da marca mostra versões sem anuidade e também cartões com regras diferentes de cobrança, isenção inicial e desconto por faixa de gasto.'
      },
      {
        title: 'Como a Porto calcula esse custo nas categorias com anuidade',
        text:
          'Na FAQ oficial sobre anuidade, a Porto informa que, depois do período inicial promocional em algumas versões, o valor passa a ser calculado conforme os gastos mensais. Em resumo: quanto maior o uso do cartão no dia a dia, maior tende a ser o desconto na mensalidade.'
      },
      {
        title: 'Quando dá para falar em anuidade zero',
        text:
          'Em algumas situações, a conversa de anuidade zero faz sentido. Isso acontece porque há cartões da Porto com proposta sem anuidade e também categorias em que o uso mensal pode derrubar bastante o custo. O jeito certo de comunicar isso é sempre olhar a variante escolhida e a regra vigente da tabela.'
      },
      {
        title: 'Cartão com anuidade pode compensar mais do que cartão gratuito',
        text:
          'Muita gente elimina qualquer cartão com anuidade sem comparar o pacote completo. Mas, quando entram pontos, descontos, Tag Porto, serviços da marca e benefícios adicionais, um cartão com custo controlado pode entregar mais valor do que uma opção gratuita muito básica.'
      },
      {
        title: 'Porto x cartões sem anuidade: o que realmente muda',
        text:
          'A comparação com modelos mais simples, focados em anuidade zero, precisa ser honesta. O cartão gratuito costuma ganhar na simplicidade. O Cartão Porto aparece melhor quando você quer mais benefícios e consegue usar esse pacote no dia a dia.'
      },
      {
        title: 'Como decidir sem errar',
        text:
          'A melhor estratégia é simples: olhar o gasto mensal médio, entender a categoria do cartão e avaliar se os benefícios realmente serão usados. Quando existe alinhamento entre uso e vantagem, a anuidade deixa de ser um problema isolado e passa a entrar na conta do custo-benefício real.'
      }
    ]
  },
  {
    slug: 'cartao-porto-ou-nubank-2026',
    title: 'Cartão Porto Seguro ou Nubank: qual escolher em 2026?',
    pageTitle: 'Cartão Porto Seguro ou Nubank: qual escolher em 2026?',
    date: '19 de março de 2026',
    readTime: '5 min de leitura',
    tags: ['Porto x Nubank', 'Comparativo', 'Escolha'],
    excerpt:
      'Nubank tende a ganhar em simplicidade e custo mais previsível; o Cartão Porto passa a fazer mais sentido quando você quer benefícios, pontos e uma proposta mais completa.',
    overview:
      'A dúvida entre Cartão Porto Seguro e Nubank aparece cada vez mais porque os dois atendem propostas bem diferentes. O Nubank costuma chamar atenção pela simplicidade e pela experiência mais enxuta. O Cartão Porto, por outro lado, ganha espaço quando você quer benefícios, pontos, descontos e mais retorno no uso do dia a dia. Neste comparativo, a ideia é mostrar de forma direta em qual cenário cada opção tende a fazer mais sentido.',
    contractUrl: portoContractUrl,
    visual: {
      eyebrow: 'Comparativo direto',
      title: 'Básico ou mais completo?',
      subtitle: 'Veja quando o Nubank faz mais sentido e quando o Cartão Porto entrega mais valor.',
      chips: ['Nubank', 'Porto', 'Escolha certa'],
      tone: 'indigo',
      logo: portoBlogLogo
    },
    heroImage: portoImages.black,
    cardCoverImage: portoPreviewImages.black,
    sources: [portoCreditCardSource, portoMainCardSource, nubankUltravioletaSource],
    utilityItems: [
      'Ajuda quem está comparando duas propostas muito diferentes a não decidir só pelo nome mais conhecido.',
      'Mostra quando vale priorizar simplicidade e quando faz mais sentido buscar benefícios e retorno sobre o uso.',
      'Evita a comparação rasa entre um cartão mais enxuto e outro com proposta mais completa.'
    ],
    faq: [
      {
        question: 'Qual é mais simples: Porto ou Nubank?',
        answer:
          'No geral, o Nubank tende a ser mais simples na proposta. O Cartão Porto entra mais forte quando você procura pontos, descontos e benefícios adicionais.'
      },
      {
        question: 'Qual vale mais a pena em 2026?',
        answer:
          'Depende do perfil. Para quem quer praticidade e menos camadas de benefício, o Nubank costuma parecer mais direto. Para quem quer uma oferta mais completa, com pontos e vantagens no ecossistema Porto, o Cartão Porto pode fazer mais sentido.'
      },
      {
        question: 'O Cartão Porto perde por ter anuidade em algumas versões?',
        answer:
          'Não necessariamente. A comparação correta precisa considerar o pacote inteiro. Quando você aproveita bem os benefícios da Porto, ele pode compensar mais do que um cartão gratuito e básico.'
      }
    ],
    blocks: [
      {
        title: 'A diferença principal entre os dois',
        text:
          'Se a comparação for reduzida a uma frase, ela fica assim: Nubank cresce na simplicidade; Porto cresce nos benefícios. O primeiro tende a atrair quem quer uma experiência mais enxuta. O segundo aparece melhor quando a pessoa quer mais retorno sobre o uso e valor em serviços extras.'
      },
      {
        title: 'Onde o Nubank costuma ganhar',
        text:
          'O Nubank normalmente se destaca pela leitura simples, pela sensação de produto direto e, no caso do Ultravioleta, por um posicionamento muito forte em cashback, pontos e viagem. Para quem quer menos complexidade na proposta, ele tende a parecer mais fácil de entender.'
      },
      {
        title: 'Onde o Cartão Porto leva vantagem',
        text:
          'O Cartão Porto entra melhor quando você quer pontos no PortoPlus, descontos em serviços da marca, Tag Porto, benefícios adicionais e uma proposta mais completa. Em vez de competir apenas em simplicidade, ele tenta entregar mais retorno para quem usa esse pacote no dia a dia.'
      },
      {
        title: 'Qual escolher na prática',
        text:
          'Se o seu foco é um cartão mais básico, com uso mais simples e pouca preocupação com benefícios extras, o Nubank costuma fazer mais sentido. Se o objetivo é ter uma oferta mais robusta, com mais vantagens e potencial de retorno no dia a dia, o Cartão Porto fica mais forte.'
      },
      {
        title: 'O jeito certo de comparar em 2026',
        text:
          'A melhor decisão não sai de uma disputa de marca. Ela sai do seu perfil. Olhe para gasto mensal, interesse em pontos, uso de benefícios, relacionamento com a Porto e necessidade real de uma proposta mais completa. Esse é o filtro que evita erro.'
      }
    ]
  },
  {
    slug: 'como-pedir-cartao-porto-seguro',
    title: 'Como pedir o Cartão Porto Seguro: passo a passo completo',
    pageTitle: 'Como pedir o Cartão Porto Seguro: passo a passo completo',
    date: '19 de março de 2026',
    readTime: '4 min de leitura',
    tags: ['Como pedir', 'Solicitação', 'Passo a passo'],
    excerpt:
      'O pedido do Cartão Porto pode ser iniciado online, com preenchimento de dados e análise de crédito. Neste guia, você entende o passo a passo de forma direta.',
    overview:
      'Quer pedir o Cartão Porto Seguro, mas não sabe por onde começar? O processo é mais simples do que muita gente imagina. Em geral, a jornada passa pelo acesso ao ambiente oficial da Porto, preenchimento dos dados, análise de crédito e retorno sobre a solicitação. Neste conteúdo, organizamos esse caminho em etapas claras para você entender como funciona antes de seguir para o pedido.',
    contractUrl: portoContractUrl,
    visual: {
      eyebrow: 'Passo a passo',
      title: 'Como sair da dúvida e iniciar o pedido',
      subtitle: 'Uma leitura curta para entender o fluxo de solicitação do Cartão Porto.',
      chips: ['Pedido online', 'Análise', 'Próximo passo'],
      tone: 'blue',
      logo: portoBlogLogo
    },
    heroImage: portoImages.platinum,
    cardCoverImage: portoPreviewImages.platinum,
    sources: [portoMainCardSource, portoCreditCardSource],
    utilityItems: [
      'Ajuda quem quer pedir o cartão sem ficar perdido na primeira etapa.',
      'Explica a jornada de solicitação de forma objetiva, sem enrolação.',
      'Deixa claro que o pedido depende de análise de crédito antes da aprovação final.'
    ],
    faq: [
      {
        question: 'Como pedir o Cartão Porto Seguro?',
        answer:
          'O caminho mais seguro é acessar o ambiente oficial da Porto pelo link desta página, preencher os dados solicitados e seguir as etapas de análise.'
      },
      {
        question: 'O pedido é rápido?',
        answer:
          'A jornada de solicitação é simples, mas a aprovação depende da análise de crédito. Por isso, o retorno pode variar conforme o perfil e a conferência das informações.'
      },
      {
        question: 'O cartão é aprovado na hora?',
        answer:
          'Não existe garantia de aprovação imediata. Pelas informações oficiais consultadas, a solicitação fica sujeita à análise de crédito.'
      }
    ],
    blocks: [
      {
        title: 'Passo 1: acesse o ambiente de solicitação',
        text:
          'O primeiro passo é entrar na página de contratação do Cartão Porto. O ideal é sempre iniciar o pedido por um canal confiável e oficial, para garantir que o preenchimento seja feito no fluxo correto.'
      },
      {
        title: 'Passo 2: preencha os dados com atenção',
        text:
          'Depois de acessar o formulário, você informa os dados solicitados pela Porto para iniciar a análise. Nesta etapa, vale revisar tudo com cuidado para evitar divergência e retrabalho.'
      },
      {
        title: 'Passo 3: aguarde a análise de crédito',
        text:
          'Após o envio do pedido, a Porto faz a análise de crédito. Esse é o ponto que define se a solicitação segue adiante e em quais condições o cartão pode ser aprovado.'
      },
      {
        title: 'Passo 4: acompanhe o retorno e a entrega',
        text:
          'Se a proposta for aprovada, o próximo passo é acompanhar a emissão e o recebimento do cartão. O tempo pode variar, então a melhor postura é entender que a jornada é simples, mas depende da avaliação final da instituição.'
      },
      {
        title: 'O que realmente importa antes de pedir',
        text:
          'Antes de solicitar, faz sentido confirmar se a versão do cartão combina com o seu perfil, seu volume de gastos e os benefícios que você pretende usar. Isso evita pedir um produto desalinhado com a sua rotina.'
      }
    ]
  },
  {
    slug: 'cartao-porto-renda-ate-5000',
    title: 'Cartão Porto Seguro é bom para quem ganha até R$ 5.000?',
    pageTitle: 'Cartão Porto Seguro é bom para quem ganha até R$ 5.000? Veja a análise real',
    date: '19 de março de 2026',
    readTime: '6 min de leitura',
    tags: ['Renda', 'Aprovação', 'Perfil ideal'],
    excerpt:
      'Para quem ganha até R$ 5.000, o Cartão Porto pode fazer sentido, mas a decisão depende mais de uso, organização financeira e análise de crédito do que da renda isolada.',
    overview:
      'Se a sua renda mensal gira em torno de R$ 5.000, é normal perguntar se o Cartão Porto Seguro combina com esse momento financeiro ou se existem opções melhores. A resposta mais honesta é: pode combinar, mas depende muito de como você usa crédito. Mais do que a renda sozinha, entram na conta o histórico financeiro, o pagamento em dia, o aproveitamento dos benefícios e a sua relação com custos como anuidade. Neste guia, organizamos essa análise de forma direta.',
    contractUrl: portoContractUrl,
    visual: {
      eyebrow: 'Análise por perfil',
      title: 'Quando essa renda combina com o Cartão Porto',
      subtitle: 'A renda importa, mas o uso do cartão e o controle financeiro pesam ainda mais.',
      chips: ['Renda até 5 mil', 'Perfil', 'Custo-benefício'],
      tone: 'blue',
      logo: portoBlogLogo
    },
    heroImage: portoImages.gold,
    cardCoverImage: portoPreviewImages.duoBlue,
    sources: [portoCreditCardSource, portoMainCardSource, portoCardAnnuitySource],
    utilityItems: [
      'Ajuda quem está nessa faixa de renda a olhar o cartão de forma realista, sem promessas exageradas.',
      'Mostra que aprovação e custo-benefício dependem de uso, organização financeira e análise de crédito.',
      'Evita pedir uma categoria que pareça bonita, mas fique pesada demais para a rotina real.'
    ],
    faq: [
      {
        question: 'Quem ganha até R$ 5.000 pode pedir o Cartão Porto?',
        answer:
          'Pode solicitar, mas isso não significa aprovação automática. O pedido continua sujeito a análise de crédito e ao perfil financeiro de cada pessoa.'
      },
      {
        question: 'Vale a pena nessa faixa de renda?',
        answer:
          'Pode valer, sim, desde que você use o cartão com frequência, pague em dia e realmente aproveite benefícios como pontos, descontos e vantagens adicionais.'
      },
      {
        question: 'Qual o maior erro nessa decisão?',
        answer:
          'O maior erro é escolher o cartão apenas pela aparência ou pela promessa de benefícios, sem avaliar gasto mensal, anuidade, organização financeira e uso real no dia a dia.'
      }
    ],
    blocks: [
      {
        title: 'A renda não decide tudo sozinha',
        text:
          'Ganhar até R$ 5.000 por mês não impede que o Cartão Porto faça sentido. O ponto central é outro: a aprovação depende da análise de crédito, e o custo-benefício depende de como você usa o cartão no mundo real.'
      },
      {
        title: 'O que avaliar antes de pedir',
        text:
          'Antes de solicitar, vale responder três perguntas simples: você usa cartão com frequência? Costuma pagar sempre em dia? Aproveitaria pontos, descontos e benefícios adicionais? Quando a resposta é sim, o produto tende a ficar mais coerente.'
      },
      {
        title: 'Onde o Cartão Porto pode entregar valor nessa faixa',
        text:
          'Mesmo com gastos moderados, o cartão pode fazer sentido para quem quer acumular pontos, aproveitar vantagens da Porto e ter uma proposta mais completa do que a de cartões muito básicos. O ganho não vem apenas do limite, mas do pacote de benefícios.'
      },
      {
        title: 'Anuidade precisa entrar na conta com cuidado',
        text:
          'Para quem ganha até R$ 5.000, esse ponto pesa ainda mais. Se a versão escolhida tiver anuidade, o ideal é avaliar se o uso mensal e os benefícios realmente compensam. Em alguns casos, uma categoria mais enxuta ou com regra melhor de isenção faz muito mais sentido.'
      },
      {
        title: 'Quando pode não valer a pena',
        text:
          'Se o cartão será pouco usado, se a prioridade for custo zero absoluto ou se os benefícios não entram na rotina, talvez o Cartão Porto não seja a melhor escolha. Nessa situação, uma opção mais simples pode combinar mais com o momento.'
      },
      {
        title: 'A conclusão mais honesta',
        text:
          'Para quem ganha até R$ 5.000, o Cartão Porto pode ser uma boa escolha quando existe organização financeira, uso frequente e interesse real nos benefícios. Sem isso, a proposta corre o risco de parecer mais atraente no papel do que na prática.'
      }
    ]
  }
];

export const getUpdateBySlug = (slug) => updates.find((item) => item.slug === slug);
export const cardUpdates = updates;
