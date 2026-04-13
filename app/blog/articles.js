import { updates as cardUpdates } from './data';

const portoBlogLogo = '/assets/blog/porto-logo.png';
const cellPhoneArtworks = {
  signatureIphones: '/assets/blog/ip.png',
  lineupWide: '/assets/blog/seguro-celular-iphones.png',
  lineupCutout: '/assets/blog/seguro-celular-iphones-trimmed.png',
  lineupCompare: '/assets/blog/seguro-celular-comparativo.png',
  lineupNewPhone: '/assets/blog/seguro-celular-compra-recente.png',
  lineupCost: '/assets/blog/seguro-celular-custo-premium.png'
};
const cellPhoneScenes = {
  premiumCloseUp: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1400&q=80',
  streetUse: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=1400&q=80'
};

const categoryMeta = {
  cartoes: {
    category: 'cartoes',
    categoryTitle: 'Cartões',
    categoryHref: '/blog/cartoes',
    actionLabel: 'Contratar cartão Porto',
    actionExternal: true
  },
  'seguro-celular': {
    category: 'seguro-celular',
    categoryTitle: 'Seguro Celular',
    categoryHref: '/blog/seguro-celular',
    actionHref: '/produtos/seguro-celular',
    actionLabel: 'Cotar Seguro Celular',
    actionExternal: false
  },
  'seguro-auto': {
    category: 'seguro-auto',
    categoryTitle: 'Seguro Auto',
    categoryHref: '/blog/seguro-auto',
    actionHref: '/cotacao-seguro-auto',
    actionLabel: 'Cotar Seguro Auto',
    actionExternal: false
  },
  'plano-saude': {
    category: 'plano-saude',
    categoryTitle: 'Plano de Saúde',
    categoryHref: '/blog/plano-saude',
    actionHref: '/plano-de-saude-por-hospital-e-rede',
    actionLabel: 'Solicitar proposta',
    actionExternal: false
  },
  'fianca-e-imobiliario': {
    category: 'fianca-e-imobiliario',
    categoryTitle: 'Fiança e Imobiliário',
    categoryHref: '/blog/fianca-e-imobiliario',
    actionHref: '/seguro-fianca-locaticia',
    actionLabel: 'Falar sobre locação',
    actionExternal: false
  }
};

const autoSources = [
  {
    label: 'Porto - Seguro Auto',
    url: 'https://www.portoseguro.com.br/en/vehicle-insurance'
  },
  {
    label: 'Porto - Centro Automotivo Porto Serviço',
    url: 'https://www.portoseguro.com.br/centro-automotivo'
  }
];

const cellPhoneSources = [
  {
    label: 'Porto - Como contratar o Seguro Celular',
    url: 'https://www.portoseguro.com.br/faqs/como-contratar-o-seguro-celular-da-porto'
  },
  {
    label: 'Porto - Coberturas do Seguro Celular',
    url: 'https://www.portoseguro.com.br/faqs/o-que-esta-coberto-no-seguro-celular-da-porto'
  },
  {
    label: 'Porto - Guia Digital do Seguro Celular',
    url: 'https://www.portoseguro.com.br/content/dam/produtos/celular/Cartilha-Seguro-Celular-Porto-Seguro.pdf'
  },
  {
    label: 'Porto - Pagamento do Seguro Celular',
    url: 'https://www.portoseguro.com.br/faqs/quais-sao-as-formas-de-pagamentos-aceitas-no-seguro-celular-da-porto'
  },
  {
    label: 'Porto - Vigência do Seguro Celular',
    url: 'https://www.portoseguro.com.br/faqs/qual-e-a-vigencia-do-seguro-celular-da-porto'
  },
  {
    label: 'Porto - Aparelho usado no Seguro Celular',
    url: 'https://www.portoseguro.com.br/faqs/o-seguro-celular-aceita-aparelho-usado'
  }
];

const appleCareSources = [
  {
    label: 'Apple - Adicionar cobertura AppleCare ao seu dispositivo Apple',
    url: 'https://support.apple.com/pt-br/104941'
  },
  {
    label: 'Apple - Se o iPhone ou iPad tiver sido roubado',
    url: 'https://support.apple.com/pt-br/120837'
  }
];

const legalSources = [
  {
    label: 'Planalto - Codigo Penal brasileiro',
    url: 'https://www.planalto.gov.br/CCIVIL_03/Decreto-Lei/Del2848compilado.htm'
  }
];

const marketCellPhonePriceSources = [
  {
    label: 'SBT News - Vale a pena fazer seguro de celular para o Carnaval? Entenda',
    url: 'https://sbtnews.sbt.com.br/noticia/economia/vale-a-pena-fazer-seguro-de-celular-para-o-carnaval-entenda'
  },
  {
    label: 'InfoMoney - Seguro para celular: como e quanto custa proteger o aparelho',
    url: 'https://www.infomoney.com.br/minhas-financas/seguro-para-celular-como-e-quanto-custa-proteger-o-aparelho-nas-festas-e-blocos/'
  }
];

const healthSources = [
  {
    label: 'Porto - Seguro Saúde para empresas',
    url: 'https://www.portoseguro.com.br/porto%20seguro-saude/'
  },
  {
    label: 'Porto - Porto Seguro Saúde institucional',
    url: 'https://www.portoseguro.com.br/sites/institucional/porto-seguro-saude/'
  }
];

const fiancaSources = [
  {
    label: 'Porto - Seguro Fiança',
    url: 'https://www.portoseguro.com.br/sites/institucional/seguro-fianca'
  }
];

const extraArticles = [
  {
    category: 'seguro-celular',
    slug: 'seguro-celular-vale-a-pena-2026',
    title: 'Seguro de celular vale a pena em 2026? Veja quando compensa e como escolher o melhor',
    pageTitle: 'Seguro de celular vale a pena em 2026? Veja quando compensa, quanto custa e como escolher melhor',
    date: '20 de março de 2026',
    readTime: '7 min de leitura',
    tags: ['Seguro Celular', 'Custo-benefício', 'Roubo e quebra'],
    excerpt:
      'Se o aparelho custa caro e faz parte da sua rotina, o seguro pode sair muito mais barato que o prejuízo. Veja quando ele compensa e como escolher melhor.',
    overview:
      'Quando o celular custa alguns milhares de reais e concentra banco, trabalho, documentos, fotos e autenticação, ficar sem ele deixa de ser um detalhe. Este guia responde à pergunta mais importante para 2026: seguro de celular vale a pena? Na maioria dos casos, sim, principalmente quando o aparelho é caro e você depende dele no dia a dia. A partir das referências oficiais da Porto, organizamos o que realmente pesa nessa decisão: risco, cobertura, custo-benefício e critério para escolher a melhor proteção.',
    visual: {
      eyebrow: 'Guia premium',
      title: 'Quando o seguro compensa',
      subtitle: 'Valor do aparelho, rotina e tipo de risco definem se a proteção faz sentido.',
      chips: ['Roubo', 'Quebra', 'Custo-benefício'],
      tone: 'gold',
      logo: portoBlogLogo
    },
    heroImage: {
      url: cellPhoneArtworks.signatureIphones,
      alt: 'Linha de iPhones premium em destaque',
      size: '86%',
      position: 'center 78%'
    },
    cardCoverImage: {
      url: cellPhoneScenes.premiumCloseUp,
      alt: 'Smartphone premium em close',
      position: 'center 40%'
    },
    categoryCoverImage: {
      url: cellPhoneScenes.premiumCloseUp,
      alt: 'Smartphone premium em close',
      position: 'center 40%',
      size: 'cover',
      background: 'linear-gradient(135deg, #f4f7fc 0%, #dde8f7 100%)'
    },
    sources: cellPhoneSources,
    utilityItems: [
      'Faz mais sentido para quem usa celular caro, depende do aparelho para banco, trabalho e autenticação e não quer absorver sozinho um prejuízo alto.',
      'A escolha certa passa por ler o que cada plano cobre: roubo, quebra acidental, furto simples, vigência e regras para aparelho usado.',
      'O melhor seguro não é o que parece mais barato, e sim o que combina cobertura útil, processo claro de contratação e boa retaguarda quando acontece um imprevisto.'
    ],
    faq: [
      {
        question: 'Seguro de celular cobre roubo?',
        answer:
          'Sim, dependendo do plano escolhido. Pelas informações oficiais consultadas em 20 de março de 2026, a Porto trabalha com leituras de cobertura que incluem roubo e, nos planos mais amplos, quebra acidental e furto simples.'
      },
      {
        question: 'Vale a pena fazer seguro para iPhone?',
        answer:
          'Na maioria dos casos, sim. Como o custo de reposição costuma ser alto, um roubo, furto ou quebra relevante pesa muito mais no bolso do que a mensalidade do seguro.'
      },
      {
        question: 'Seguro de celular é caro?',
        answer:
          'Geralmente não quando comparado ao valor do aparelho. O jeito certo de medir é simples: comparar a mensalidade com o quanto do seu orçamento seria afetado se você precisasse comprar outro celular do zero.'
      },
      {
        question: 'Como escolher o melhor seguro de celular?',
        answer:
          'Comece pelo seu risco real. Se a sua maior preocupação é roubo, um plano focado nisso pode bastar. Se o uso é intenso e a quebra é um risco relevante, vale olhar uma cobertura mais completa.'
      }
    ],
    blocks: [
      {
        title: 'Hoje o celular é banco, trabalho e vida pessoal',
        text:
          'Perder o celular não significa apenas perder um aparelho. Em muitos casos, você também perde acesso a banco, apps de autenticação, documentos, fotos, contatos e boa parte da rotina do dia. É por isso que o seguro deixou de ser luxo para muita gente.'
      },
      {
        title: 'Quando o seguro claramente vale a pena',
        text:
          'Se o aparelho custa caro, se você depende dele todos os dias ou se a reposição pesaria no seu orçamento, o seguro costuma fazer bastante sentido. Quanto maior o impacto de ficar sem o celular, maior tende a ser o valor da proteção.'
      },
      {
        title: 'Roubo, furto e quebra fazem parte do risco real',
        text:
          'A decisão não deve ser feita pensando apenas em um cenário extremo. No uso do dia a dia, roubos, furtos em locais públicos, quedas e danos acidentais entram na conta. O seguro bom é o que protege justamente contra o risco que mais combina com a sua rotina.'
      },
      {
        title: 'O custo mensal tende a ser uma fração do prejuízo',
        text:
          'Mesmo quando a mensalidade parece mais uma conta, ela normalmente representa uma parcela pequena diante do valor de reposição de um smartphone premium. O jeito mais honesto de comparar é colocar de um lado a mensalidade e, do outro, o impacto de comprar outro aparelho sem planejamento.'
      },
      {
        title: 'Cobertura certa vale mais do que promessa genérica',
        text:
          'Nem todo seguro resolve o mesmo problema. Pelas informações oficiais da Porto, a diferença entre os planos passa por cobertura para roubo, quebra acidental e furto simples. Antes de contratar, vale confirmar exatamente o que entra no plano que você está avaliando.'
      },
      {
        title: 'Por que a Porto entra como opção forte',
        text:
          'Na leitura das regras e da jornada de contratação, a Porto se destaca por combinar marca consolidada, processo digital, opções de cobertura e uma proposta mais clara para quem quer proteger iPhone e outros smartphones premium com menos atrito.'
      }
    ]
  },
  {
    category: 'seguro-celular',
    slug: 'seguro-para-iphone-vale-a-pena-2026',
    title: 'Seguro para iPhone vale a pena? Veja por que proteger seu aparelho pode evitar prejuízos',
    pageTitle: 'Seguro para iPhone vale a pena em 2026? Veja por que proteger seu aparelho pode evitar prejuízos',
    date: '20 de março de 2026',
    readTime: '6 min de leitura',
    tags: ['iPhone', 'Seguro Celular', 'Roubo e quebra'],
    excerpt:
      'Quando o aparelho custa caro, um roubo, uma quebra de tela ou um dano acidental deixam de ser detalhe. Entenda por que o seguro para iPhone pode evitar um prejuízo alto.',
    overview:
      'Quem usa iPhone sabe que o aparelho entrega muito, mas também custa caro para repor. É por isso que a pergunta certa não é apenas se o seguro existe, e sim se ele ajuda a proteger um bem que concentra banco, trabalho, fotos, autenticação e rotina. Neste guia, organizamos o que realmente pesa para quem quer proteger o iPhone com mais critério: valor do aparelho, custo de conserto, risco do dia a dia, diferença entre tipos de cobertura e o que observar antes de contratar.',
    visual: {
      eyebrow: 'Guia premium',
      title: 'Proteção para iPhone caro',
      subtitle: 'Quando o aparelho pesa no bolso, seguro deixa de ser luxo e vira blindagem financeira.',
      chips: ['iPhone', 'Prejuízo alto', 'Roubo e quebra'],
      tone: 'indigo',
      logo: portoBlogLogo
    },
    heroImage: {
      url: cellPhoneArtworks.lineupCutout,
      alt: 'Composição de iPhones premium em destaque',
      size: '86%',
      position: 'center 76%'
    },
    cardCoverImage: {
      url: cellPhoneArtworks.lineupWide,
      alt: 'Linha de iPhones premium em composição ampla',
      position: 'center 54%'
    },
    categoryCoverImage: {
      url: cellPhoneArtworks.signatureIphones,
      alt: 'Linha de iPhones premium em destaque',
      position: 'center 72%',
      size: '72%',
      background:
        'radial-gradient(circle at 76% 18%, rgba(255, 182, 92, 0.28) 0%, transparent 30%), linear-gradient(135deg, #0d2958 0%, #1a4b98 100%)'
    },
    sources: cellPhoneSources,
    utilityItems: [
      'Faz mais sentido quando trocar o iPhone sem planejamento atrapalharia o orçamento ou a rotina de trabalho.',
      'Vale comparar o plano pelo risco que mais preocupa: roubo, quebra acidental, furto simples e demais eventos previstos na apólice.',
      'Antes de fechar, olhe não só o preço, mas também a jornada de contratação, a elegibilidade do aparelho e a clareza das regras.'
    ],
    faq: [
      {
        question: 'Seguro para iPhone vale a pena?',
        answer:
          'Na maioria dos casos, sim. Como o valor de reposição do iPhone costuma ser alto, um roubo, uma quebra ou outro dano relevante pode virar um prejuízo bem maior do que o custo mensal da proteção.'
      },
      {
        question: 'Seguro para iPhone cobre roubo?',
        answer:
          'Pode cobrir, mas isso depende do plano contratado. Pelas informações oficiais da Porto consultadas em 20 de março de 2026, existem leituras de cobertura focadas em roubo e opções mais completas com quebra acidental e furto simples.'
      },
      {
        question: 'AppleCare e seguro para iPhone são a mesma coisa?',
        answer:
          'Não. Na prática, são propostas diferentes e a cobertura pode variar conforme o plano e o mercado. O caminho mais seguro é comparar exatamente qual risco cada opção cobre antes de decidir.'
      },
      {
        question: 'Posso fazer seguro para iPhone usado?',
        answer:
          'Depende da seguradora e da regra de elegibilidade. No caso da Porto, a FAQ oficial consultada em 20 de março de 2026 informa que o aparelho usado pode entrar se tiver sido adquirido pelo primeiro dono há no máximo 24 meses e atender aos demais critérios do processo.'
      }
    ],
    blocks: [
      {
        title: 'iPhone é um aparelho premium com prejuízo premium',
        text:
          'Quando o celular custa varios milhares de reais, qualquer problema deixa de ser pequeno. Um roubo, uma tela quebrada ou um dano relevante podem gerar uma conta pesada demais para ser tratada como detalhe do uso.'
      },
      {
        title: 'O seguro faz mais sentido quando a reposição doeria no bolso',
        text:
          'A pergunta certa não é se o seguro é barato ou caro isoladamente. O que importa é medir quanto você sentiria se precisasse comprar outro iPhone sem planejamento. Se esse impacto for alto, a proteção tende a fazer muito sentido.'
      },
      {
        title: 'Conserto caro também entra na conta, não só perda total',
        text:
          'Muita gente pensa apenas em roubo, mas a decisão não deveria parar aí. No iPhone, uma quebra importante ou outro dano acidental já podem virar uma despesa de quatro dígitos. O seguro ajuda justamente a reduzir esse tipo de impacto financeiro.'
      },
      {
        title: 'Comparar seguro por risco é melhor do que comparar por nome',
        text:
          'Em vez de escolher pela marca mais conhecida, vale olhar o que realmente está protegido. O mais importante é entender se o plano responde ao risco que mais incomoda no dia a dia: rua, transporte, queda, uso intenso ou necessidade de reposição rápida.'
      },
      {
        title: 'AppleCare e seguro não devem ser lidos como se fossem a mesma coisa',
        text:
          'Ao comparar alternativas, o ponto central não é descobrir qual nome parece mais premium. O importante é verificar o que cada plano cobre no seu caso, porque suporte, reparo, roubo e danos podem seguir lógicas diferentes conforme a opção contratada.'
      },
      {
        title: 'Por que a Porto aparece como opção forte para iPhone',
        text:
          'Pelas referências oficiais consultadas, a Porto combina marca consolidada, contratação digital e opções de cobertura que ajudam quem quer proteger iPhone e outros smartphones premium com uma leitura mais objetiva do produto.'
      }
    ]
  },
  {
    category: 'seguro-celular',
    slug: 'seguro-celular-cobre-roubo-e-furto-2026',
    title: 'Seguro de celular cobre roubo e furto? Entenda exatamente o que está incluso',
    pageTitle: 'Seguro de celular cobre roubo e furto? Entenda exatamente o que está incluso em 2026',
    date: '20 de março de 2026',
    readTime: '7 min de leitura',
    tags: ['Roubo', 'Furto simples', 'Cobertura'],
    excerpt:
      'Antes de contratar, o mais importante é saber onde a proteção realmente entra. Veja a diferença entre roubo, furto mediante arrombamento e furto simples no Seguro Celular.',
    overview:
      'Se a sua maior dúvida é saber se o seguro de celular realmente paga quando o aparelho some, você está olhando para a pergunta certa. No Seguro Celular, a diferença entre roubo, furto mediante arrombamento e furto simples muda completamente a leitura da cobertura. Pelas informações oficiais da Porto consultadas em 20 de março de 2026, o produto trabalha com planos distintos: um para roubo, outro que soma quebra acidental e roubo, e um terceiro que adiciona furto simples. Neste guia, organizamos o que entra, o que costuma ficar fora e como escolher a proteção sem descobrir tarde demais que o seu risco principal não estava coberto.',
    visual: {
      eyebrow: 'Guia master',
      title: 'Roubo, furto e o que entra',
      subtitle: 'O detalhe mais importante do seguro está na leitura da cobertura. Nem todo sumiço do aparelho é tratado da mesma forma.',
      chips: ['Roubo', 'Furto simples', 'Cobertura'],
      tone: 'gold',
      logo: portoBlogLogo
    },
    heroImage: {
      url: cellPhoneScenes.streetUse,
      alt: 'Pessoa usando smartphone em ambiente urbano',
      position: 'center 26%'
    },
    cardCoverImage: {
      url: cellPhoneScenes.streetUse,
      alt: 'Pessoa usando smartphone em ambiente urbano',
      position: 'center 26%'
    },
    categoryCoverImage: {
      url: cellPhoneScenes.streetUse,
      alt: 'Pessoa usando smartphone em ambiente urbano',
      position: 'center 26%',
      size: 'cover',
      background: 'linear-gradient(135deg, #edf2f7 0%, #dae5f2 100%)'
    },
    sources: [legalSources[0], cellPhoneSources[1], cellPhoneSources[2]],
    utilityItems: [
      'Se o seu medo principal é assalto ou furto em rua, transporte e locais públicos, o plano precisa ser lido linha por linha.',
      'No seguro da Porto, furto simples não entra em todo plano. Esse é um dos pontos que mais geram expectativa errada na hora do sinistro.',
      'Perda, desaparecimento e extravio costumam ficar fora da proteção, então a decisão certa depende do tipo de risco que você realmente quer cobrir.'
    ],
    faq: [
      {
        question: 'Seguro de celular cobre roubo?',
        answer:
          'Sim, quando a cobertura contratada inclui roubo. Pelas informações oficiais da Porto consultadas em 20 de março de 2026, o plano básico de roubo já protege contra roubo e também contra furto mediante arrombamento.'
      },
      {
        question: 'Seguro de celular cobre furto simples?',
        answer:
          'Depende. Na Porto, o FAQ oficial informa que o furto simples sem vestígio de crime aparece no plano mais completo, chamado quebra acidental + roubo + furto simples.'
      },
      {
        question: 'Qual a diferença entre roubo e furto na prática?',
        answer:
          'Na linguagem jurídica brasileira, roubo envolve grave ameaça ou violência contra a pessoa. Furto é a subtração sem esse confronto. No seguro, essa diferença importa muito porque cada modalidade pode receber tratamento diferente na apólice.'
      },
      {
        question: 'O que normalmente não fica coberto?',
        answer:
          'Pelas exclusões destacadas no guia digital da Porto, desaparecimento, perda e extravio do celular segurado ficam fora. Por isso, esquecer o aparelho ou simplesmente não saber onde ele foi parar não deve ser tratado como se fosse roubo ou furto coberto.'
      }
    ],
    blocks: [
      {
        title: 'Roubo normalmente é o ponto mais fácil de entender',
        text:
          'Na prática, roubo é quando o aparelho é levado com ameaça ou violência. Esse é o evento que costuma vir primeiro à mente de quem pensa em seguro e, por isso, também é a cobertura que mais gente procura logo de cara.'
      },
      {
        title: 'Furto mediante arrombamento é diferente de furto simples',
        text:
          'No FAQ oficial da Porto, o plano de roubo cobre roubo e furto mediante arrombamento. Isso significa que existe uma leitura mais específica do furto, ligada a vestígio de crime, e não simplesmente a todo desaparecimento do aparelho.'
      },
      {
        title: 'Furto simples pede um plano mais completo',
        text:
          'Quando o celular some sem vestígio de crime, a cobertura muda. Segundo a Porto, o furto simples entra no plano quebra acidental + roubo + furto simples. É exatamente aqui que muita gente se confunde e descobre tarde demais que contratou menos do que imaginava.'
      },
      {
        title: 'Perda, esquecimento e extravio não devem ser confundidos com sinistro coberto',
        text:
          'A própria cartilha da Porto destaca que desaparecimento, perda e extravio ficam fora. Em outras palavras, esquecer o aparelho numa mesa ou não conseguir mais localizá-lo sem sinais de crime não deve ser lido como se fosse automaticamente coberto.'
      },
      {
        title: 'Escolher bem a cobertura evita a pior surpresa do seguro',
        text:
          'O erro mais caro não é pagar a mensalidade. O erro mais caro é contratar um plano que parece bom, mas não protege o evento que mais preocupa na sua rotina. Quem circula muito em cidade grande, usa transporte e expõe mais o aparelho precisa olhar esse detalhe com muito cuidado.'
      },
      {
        title: 'No fim, o melhor seguro é o que conversa com o seu risco real',
        text:
          'Se a sua dor principal é assalto, um plano focado em roubo pode bastar. Se o receio inclui furto simples e quebra no uso cotidiano, vale considerar a opção mais completa. O que não vale é decidir sem entender exatamente o que está incluso.'
      }
    ]
  },
  {
    category: 'seguro-celular',
    slug: 'quanto-custa-seguro-de-celular-2026',
    title: 'Quanto custa um seguro de celular em 2026? Veja valores reais e quando compensa',
    pageTitle: 'Quanto custa um seguro de celular em 2026? Veja faixas reais e quando compensa',
    date: '20 de março de 2026',
    readTime: '6 min de leitura',
    tags: ['Preço', 'Mensalidade', 'Custo-benefício'],
    excerpt:
      'Não existe um preço único, mas o seguro costuma custar muito menos do que o prejuízo de comprar outro aparelho do zero. Veja como ler o valor sem cair em comparação rasa.',
    overview:
      'Quem pesquisa seguro de celular quase sempre quer a mesma resposta: quanto vou pagar por mês? Pelas páginas oficiais da Porto consultadas em 20 de março de 2026, não existe tabela única pública, porque a cotação depende de marca, modelo, tempo de uso e plano escolhido. Como referência prática de mercado, e não como tabela oficial da Porto, reportagens recentes consultadas na mesma data mostram mensalidades que podem partir da casa de R$ 17 e subir bastante conforme o aparelho e a cobertura. Neste guia, organizamos as faixas de bolso que mais ajudam na decisão e mostramos quando esse custo pequeno realmente evita um prejuízo grande.',
    visual: {
      eyebrow: 'Guia premium master',
      title: 'Preço que cabe no bolso',
      subtitle: 'A pergunta certa não é só quanto custa por mês, e sim quanto doeria ficar sem o aparelho.',
      chips: ['Preço', 'Mensalidade', 'Custo-benefício'],
      tone: 'teal',
      logo: portoBlogLogo
    },
    heroImage: {
      url: cellPhoneScenes.premiumCloseUp,
      alt: 'Smartphone premium em close para representar custo de reposição',
      position: 'center 42%'
    },
    cardCoverImage: {
      url: cellPhoneArtworks.lineupCost,
      alt: 'iPhones premium em composição central',
      position: 'center 52%'
    },
    categoryCoverImage: {
      url: cellPhoneArtworks.lineupCost,
      alt: 'iPhones premium em composição central',
      position: 'center 56%',
      size: '88%',
      background:
        'radial-gradient(circle at 82% 18%, rgba(255, 183, 77, 0.24) 0%, transparent 32%), linear-gradient(135deg, #09224d 0%, #123d84 100%)'
    },
    sources: [cellPhoneSources[0], cellPhoneSources[3], marketCellPhonePriceSources[0], marketCellPhonePriceSources[1]],
    utilityItems: [
      'Na Porto, a cotação depende do aparelho e do plano. Por isso, comparar preço sem olhar cobertura quase sempre leva a uma decisão ruim.',
      'Como regra prática, o seguro faz mais sentido quando trocar o celular sem planejamento pesaria de verdade no seu orçamento.',
      'Parcelamento em até 12x sem juros e desconto com Cartão Porto ajudam a deixar o custo mais previsível para quem quer proteger o aparelho.'
    ],
    faq: [
      {
        question: 'Quanto custa um seguro de celular por mês?',
        answer:
          'Não existe um valor único. A Porto informa que a contratação depende de marca, modelo, tempo de uso e plano escolhido. Como referência prática de mercado consultada em 20 de março de 2026, reportagens recentes mostram mensalidades que podem partir da casa de R$ 17 e subir conforme o valor do aparelho e a amplitude da cobertura.'
      },
      {
        question: 'Seguro de celular é caro?',
        answer:
          'Na maioria dos casos, não quando comparado ao prejuízo de comprar outro aparelho do zero. O jeito certo de medir e comparar a mensalidade com o impacto de uma reposição inesperada.'
      },
      {
        question: 'O preço muda conforme o celular?',
        answer:
          'Sim. Quanto maior o valor do aparelho e mais ampla a cobertura, maior tende a ser a cotação. Por isso um iPhone premium dificilmente será precificado como um aparelho intermediário.'
      },
      {
        question: 'Como a Porto permite pagar o Seguro Celular?',
        answer:
          'Segundo a FAQ oficial da Porto consultada em 20 de março de 2026, o pagamento pode ser feito em até 12x sem juros no cartão de crédito. Quem usa Cartão de Crédito Porto Seguro ainda recebe 5% de desconto.'
      }
    ],
    blocks: [
      {
        title: 'O primeiro ponto é simples: não existe preço fixo para todo mundo',
        text:
          'Na Porto, a jornada oficial de contratação pede marca, modelo, tempo de uso e escolha do plano. Isso significa que o valor não pode ser lido como uma tabela única, porque a mensalidade muda conforme o aparelho e a cobertura escolhida.'
      },
      {
        title: 'Faixas de bolso ajudam a visualizar a ordem de grandeza',
        text:
          'Como referência prática de mercado, e não como tabela oficial da Porto, faixas como R$ 20 a R$ 40 para aparelhos na casa de R$ 3 mil, R$ 40 a R$ 70 para aparelhos perto de R$ 5 mil e R$ 60 a R$ 120 para smartphones premium acima de R$ 8 mil ajudam a visualizar o tamanho do gasto mensal.'
      },
      {
        title: 'O custo do seguro costuma ser pequeno perto do prejuízo',
        text:
          'Quando você coloca na ponta do lápis o valor de um celular novo, a mensalidade tende a parecer bem menos pesada. E por isso que o seguro faz mais sentido para quem não quer ser obrigado a repor um aparelho caro de uma vez só.'
      },
      {
        title: 'Compensa mais para celular caro, uso intenso e risco maior',
        text:
          'Quem usa o aparelho para banco, trabalho, autenticação e rotina pessoal costuma sentir muito mais o impacto de um sinistro. Quando o celular é caro e ainda fica exposto em rua, transporte ou trabalho externo, o custo-benefício do seguro sobe bastante.'
      },
      {
        title: 'Na Porto, o pagamento ajuda a deixar o custo previsível',
        text:
          'Pelas informações oficiais consultadas em 20 de março de 2026, o Seguro Celular da Porto pode ser pago em até 12 vezes sem juros no cartão de crédito, com 5% de desconto para quem usa Cartão Porto. Isso ajuda a transformar a proteção em uma despesa planejada, e não em susto.'
      },
      {
        title: 'No fim, o melhor número não é a mensalidade: é o tamanho do prejuízo evitado',
        text:
          'A decisão correta não nasce da pergunta "quanto custa por mês?" isoladamente. Ela fica clara quando você compara essa mensalidade com quanto doeria perder um aparelho de R$ 3 mil, R$ 5 mil ou R$ 8 mil sem nenhuma cobertura.'
      }
    ]
  },
  {
    category: 'seguro-celular',
    slug: 'acabei-de-comprar-um-celular-devo-fazer-seguro-agora',
    title: 'Acabei de comprar um celular: devo fazer seguro agora?',
    pageTitle: 'Acabei de comprar um celular: devo fazer seguro agora em 2026?',
    date: '20 de março de 2026',
    readTime: '5 min de leitura',
    tags: ['Celular novo', 'Proteção imediata', 'Contratação'],
    excerpt:
      'Se o aparelho acabou de sair da loja, esperar alguns dias só aumenta o período em que ele circula sem proteção. Entenda por que contratar cedo costuma ser a decisão mais segura.',
    overview:
      'Quem acabou de comprar um celular caro costuma pensar a mesma coisa: "depois eu vejo o seguro". Só que, na prática, esse adiamento cria justamente a janela em que o aparelho novo circula sem proteção. Pelas informações oficiais da Porto consultadas em 20 de março de 2026, a contratação é digital, passa pela verificação do aparelho no app e a vigência começa sem carência a partir da emissão da apólice. A Porto também aceita aparelho usado dentro de uma regra específica de elegibilidade, mas a leitura mais inteligente para quem acabou de comprar é simples: se o aparelho já está com você e faz sentido proteger, quanto antes melhor.',
    visual: {
      eyebrow: 'Guia premium master',
      title: 'Comprou, protege logo',
      subtitle: 'Esperar poucos dias pode parecer pouco, mas é justamente esse tempo que deixa o aparelho novo exposto sem cobertura.',
      chips: ['Celular novo', 'Sem carência', 'Contratação digital'],
      tone: 'blue',
      logo: portoBlogLogo
    },
    heroArtworkMode: 'scenic',
    heroImage: {
      url: cellPhoneArtworks.lineupNewPhone,
      alt: 'Linha de iPhones premium para representar celular novo',
      position: 'center 44%'
    },
    cardCoverImage: {
      url: cellPhoneArtworks.lineupNewPhone,
      alt: 'Linha de iPhones premium para representar celular novo',
      position: 'center 44%'
    },
    categoryCoverImage: {
      url: cellPhoneArtworks.lineupNewPhone,
      alt: 'Linha de iPhones premium para representar celular novo',
      position: 'center 56%',
      size: '78%',
      background:
        'radial-gradient(circle at 24% 18%, rgba(255, 255, 255, 0.76) 0%, transparent 34%), linear-gradient(135deg, #f6f8fd 0%, #dce6f7 100%)'
    },
    sources: [cellPhoneSources[0], cellPhoneSources[4], cellPhoneSources[5], cellPhoneSources[2]],
    utilityItems: [
      'Para quem acabou de comprar o aparelho, a principal vantagem de contratar cedo é simples: reduzir o tempo em que ele circula sem nenhuma proteção.',
      'A Porto informa contratação digital com verificação do aparelho pelo app, o que ajuda a transformar a decisão em um passo imediato, e não em uma pendência.',
      'Mesmo existindo regra para aparelho usado, esperar sem necessidade só alonga o período de exposicao de um bem caro que ainda está novo.'
    ],
    faq: [
      {
        question: 'Devo fazer o seguro logo depois da compra?',
        answer:
          'Na prática, sim. A Porto informa vigência de 365 dias sem carência a partir da emissão da apólice. Isso significa que, se você já decidiu proteger o aparelho, contratar cedo reduz o tempo em que ele fica sem cobertura.'
      },
      {
        question: 'Posso contratar depois?',
        answer:
          'Pode, desde que o aparelho ainda esteja dentro das regras de elegibilidade. A FAQ oficial da Porto consultada em 20 de março de 2026 informa que aparelho usado pode ser aceito se tiver sido adquirido pelo primeiro dono há no máximo 24 meses e cumprir os demais critérios.'
      },
      {
        question: 'A cobertura demora para começar?',
        answer:
          'Não. Segundo a FAQ oficial da Porto, o seguro tem vigência de 365 dias sem carência a partir da emissão da apólice, depois da aprovação do processo.'
      },
      {
        question: 'Por que não vale esperar um pouco?',
        answer:
          'Porque esperar não melhora a proteção. Só prolonga o período em que um aparelho novo, caro e muito usado circula sem cobertura para o risco que mais preocupa.'
      }
    ],
    blocks: [
      {
        title: 'O maior erro é tratar o seguro como detalhe para depois',
        text:
          'Quem acabou de comprar um celular novo costuma sair da loja pensando em capa, película, configuração e transferências. O seguro acaba ficando para depois. Só que esse "depois" é justamente o período em que o aparelho já está na rua, no transporte e no uso intenso, mas ainda sem proteção.'
      },
      {
        title: 'Nos primeiros dias, o celular novo circula muito e chama mais atenção',
        text:
          'A Porto não publica um ranking de risco por dia de uso. Ainda assim, na leitura prática, as primeiras semanas concentram deslocamento, exibição do aparelho novo, configurações, teste de acessórios e mais tempo de uso. Esperar só prolonga essa janela descoberta.'
      },
      {
        title: 'Na Porto, a contratação é digital e a vigência não tem carência',
        text:
          'Pelas páginas oficiais consultadas em 20 de março de 2026, a jornada passa pela escolha do aparelho, definição do plano, pagamento e verificação do celular pelo app. Depois da emissão da apólice, a vigência é de 365 dias sem carência. Isso favorece quem quer sair do zero de proteção para uma cobertura ativa sem enrolação.'
      },
      {
        title: 'Fazer agora é diferente de deixar para quando der',
        text:
          'A Porto aceita aparelho usado dentro da regra oficial, o que significa que existe margem para contratar depois. Mas isso não transforma a espera em estratégia melhor. Se o aparelho acabou de ser comprado e proteger faz sentido para o seu bolso, a decisão mais coerente é resolver isso enquanto o bem ainda está no início da vida útil.'
      },
      {
        title: 'Celular novo merece a mesma lógica que você usa para qualquer bem caro',
        text:
          'Quando um aparelho custa vários milhares de reais e concentra banco, trabalho, autenticação e rotina, o erro não é contratar cedo. O erro costuma ser passar dias ou semanas exposto e descobrir tarde demais que o prejuízo chegou antes da proteção.'
      },
      {
        title: 'No fim, a resposta é curta: comprou, vale cotar agora',
        text:
          'Se a sua intenção já é proteger o celular, deixar para depois não cria vantagem real. Só adia uma decisão que pode poupar um prejuízo alto. Para quem acabou de comprar, o melhor momento tende a ser o mais próximo possível da compra.'
      }
    ]
  },
  {
    category: 'seguro-celular',
    slug: 'seguro-celular-ou-applecare-qual-e-melhor-2026',
    title: 'Seguro de celular ou AppleCare: qual é melhor em 2026?',
    pageTitle: 'Seguro de celular ou AppleCare: qual faz mais sentido em 2026?',
    date: '20 de março de 2026',
    readTime: '7 min de leitura',
    tags: ['AppleCare', 'Seguro Celular', 'Comparativo'],
    excerpt:
      'Para quem usa iPhone, a escolha não é entre nomes parecidos, e sim entre objetivos diferentes. Veja quando AppleCare faz sentido e quando um seguro tradicional protege melhor o bolso.',
    overview:
      'Quem usa iPhone muitas vezes compara AppleCare com seguro de celular como se fosse a mesma categoria de produto. Não é. A Apple trabalha com planos de suporte e cobertura que podem incluir danos acidentais e, em algumas modalidades e mercados, cobertura em caso de perda e roubo. Já a Porto organiza o Seguro Celular por planos voltados a roubo, quebra acidental e furto simples. Em 2026, a escolha mais inteligente não passa por marca mais famosa, e sim por entender qual risco você quer proteger: reparo oficial, suporte Apple, roubo, furto ou danos do uso real.',
    visual: {
      eyebrow: 'Comparativo premium',
      title: 'AppleCare ou seguro?',
      subtitle: 'Reparo oficial e cobertura contra roubo não são a mesma coisa. O melhor depende do risco que pesa mais.',
      chips: ['AppleCare', 'Roubo', 'Comparativo'],
      tone: 'blue',
      logo: portoBlogLogo
    },
    heroArtworkMode: 'scenic',
    heroImage: {
      url: cellPhoneArtworks.lineupCompare,
      alt: 'Linha de iPhones premium para representar comparativo de proteção',
      position: 'center 48%'
    },
    cardCoverImage: {
      url: cellPhoneArtworks.lineupCompare,
      alt: 'Linha de iPhones premium para comparativo',
      position: 'center 48%'
    },
    categoryCoverImage: {
      url: cellPhoneArtworks.lineupCompare,
      alt: 'Linha de iPhones premium para comparativo',
      position: 'center 54%',
      size: '76%',
      background:
        'radial-gradient(circle at 76% 18%, rgba(255, 184, 92, 0.22) 0%, transparent 28%), linear-gradient(135deg, #eef2f8 0%, #d5ddec 100%)'
    },
    sources: [appleCareSources[0], appleCareSources[1], cellPhoneSources[1], cellPhoneSources[2]],
    utilityItems: [
      'Se o seu maior medo é roubo, furto ou quebra no dia a dia, a comparação precisa olhar cobertura real e não só o nome do plano.',
      'Se você valoriza reparo oficial, suporte e a jornada da Apple, AppleCare pode fazer mais sentido do que um seguro tradicional.',
      'O jeito mais seguro de decidir é simples: separar suporte técnico de proteção financeira contra prejuízo alto.'
    ],
    faq: [
      {
        question: 'AppleCare cobre roubo?',
        answer:
          'Hoje a Apple informa oficialmente que existe AppleCare+ com cobertura em caso de perda e roubo, mas a disponibilidade varia conforme dispositivo, plano e região. Por isso, não é correto tratar todo AppleCare como se nunca cobrisse roubo.'
      },
      {
        question: 'O Seguro Celular Porto cobre furto e danos?',
        answer:
          'Segundo a FAQ oficial da Porto consultada em 20 de março de 2026, a empresa trabalha com três leituras principais: plano de roubo, plano de quebra mais roubo e plano de quebra mais roubo mais furto simples.'
      },
      {
        question: 'Qual é melhor: AppleCare ou seguro de celular?',
        answer:
          'Depende do objetivo. Para quem quer suporte e reparo dentro do ecossistema Apple, AppleCare pode fazer mais sentido. Para quem quer proteção financeira contra roubo, furto e danos do uso cotidiano, o seguro costuma ser mais alinhado.'
      },
      {
        question: 'Posso ter AppleCare e seguro ao mesmo tempo?',
        answer:
          'Em tese, sim, porque as propostas não são idênticas. Mas antes de pagar pelos dois, vale verificar onde existe sobreposição e se o seu risco principal já não está bem coberto por uma única opção.'
      }
    ],
    blocks: [
      {
        title: 'AppleCare e seguro de celular não são a mesma categoria',
        text:
          'A comparação parece natural porque os dois prometem proteger um iPhone caro. Mas a lógica de produto é diferente. AppleCare conversa mais com suporte, reparo e jornada Apple; seguro conversa mais com prejuízo financeiro causado por roubo, furto e danos do uso.'
      },
      {
        title: 'Na Apple, a leitura depende do plano disponível para o seu caso',
        text:
          'Pelas páginas oficiais consultadas em 20 de março de 2026, a Apple oferece AppleCare+ e também AppleCare+ com cobertura em caso de perda e roubo em cenários elegíveis. Isso muda a comparação e impede afirmações absolutas do tipo AppleCare nunca cobre roubo.'
      },
      {
        title: 'Na Porto, a comparação parte de três planos mais claros',
        text:
          'A FAQ oficial da Porto ajuda a simplificar a leitura: existe plano focado em roubo, outro que soma quebra acidental e roubo, e um plano mais completo que acrescenta furto simples. Essa estrutura ajuda quem quer comparar risco de rua e dano acidental sem ficar preso a marketing.'
      },
      {
        title: 'Quem teme rua, transporte e exposição do aparelho costuma olhar para seguro',
        text:
          'Se o seu receio principal é sair com o celular, usar transporte público, trabalhar na rua ou depender do aparelho fora de casa, a decisão tende a girar mais em torno de roubo, furto e quebra. Nessa leitura, o seguro tradicional costuma ganhar relevância.'
      },
      {
        title: 'Quem quer reparo oficial e experiência Apple pode preferir AppleCare',
        text:
          'Para alguns perfis, o mais importante é suporte técnico, atendimento dentro do ecossistema Apple e cobertura voltada a reparo. Nesses casos, AppleCare pode fazer mais sentido do que uma solução pensada como seguro tradicional.'
      },
      {
        title: 'Em 2026, o melhor é o produto que protege o seu risco principal',
        text:
          'Não existe vencedor universal. Se a sua dor é reposição após roubo ou furto, compare seguro. Se a sua dor é reparo e suporte Apple, compare AppleCare. A escolha certa aparece quando você decide pelo risco mais provável e mais caro para o seu bolso.'
      }
    ]
  },
  {
    category: 'seguro-celular',
    slug: 'seguro-celular-porto-iphone-coberturas',
    title: 'Seguro Celular Porto: o que olhar na cobertura antes de contratar',
    date: '19 de março de 2026',
    readTime: '6 min de leitura',
    tags: ['Seguro Celular', 'iPhone', 'Cobertura'],
    excerpt:
      'Quem usa celular premium precisa olhar mais do que a parcela: cobertura para quebra, roubo, furto simples e o processo de verificação pesam muito na decisão.',
    overview:
      'Seguro de celular faz sentido quando o aparelho participa de trabalho, banco, autenticação e rotina pessoal. No caso de iPhone e outros smartphones premium, o custo de reposição costuma ser alto. Por isso, a leitura correta da Porto passa por entender o que cada plano cobre e em que situação o seguro vira proteção financeira de verdade.',
    visual: {
      eyebrow: 'Seguro Celular Porto',
      title: 'Cobertura para aparelho premium',
      subtitle: 'Quebra, roubo e furto simples precisam ser lidos pelo risco real de uso.',
      chips: ['iPhone', 'Quebra', 'Roubo'],
      tone: 'indigo',
      logo: portoBlogLogo
    },
    heroImage: {
      url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1400&q=80',
      alt: 'Smartphone premium em close'
    },
    cardCoverImage: {
      url: '/assets/blog/seguro-celular-cobertura-card.png',
      alt: 'Composição premium para representar a cobertura do celular',
      position: 'center 48%'
    },
    categoryCoverImage: {
      url: '/assets/blog/seguro-celular-cobertura-card.png',
      alt: 'Composição premium para representar a cobertura do celular',
      position: 'center 48%',
      size: 'cover',
      background: 'linear-gradient(135deg, #143569 0%, #214d95 100%)'
    },
    sources: [cellPhoneSources[0], cellPhoneSources[1], cellPhoneSources[2]],
    utilityItems: [
      'Ajuda quem usa iPhone ou smartphone premium a avaliar o risco de ficar sem aparelho.',
      'Organiza a comparação entre os planos de cobertura sem deixar a decisão presa só ao preço.',
      'Mostra onde o seguro faz sentido para quem depende do celular para banco, trabalho e autenticação.'
    ],
    faq: [
      {
        question: 'O Seguro Celular Porto cobre quebra acidental?',
        answer:
          'Sim, mas isso depende do plano escolhido. Pelas informações oficiais consultadas em 19 de março de 2026, a quebra acidental entra nos planos mais completos.'
      },
      {
        question: 'Existe cobertura para furto simples?',
        answer:
          'Sim. Segundo a FAQ oficial da Porto consultada em 19 de março de 2026, essa cobertura aparece no plano mais completo, junto com quebra e roubo.'
      }
    ],
    blocks: [
      {
        title: 'Cada plano muda a proteção real do aparelho',
        text:
          'A Porto trabalha com três leituras principais de cobertura: um plano focado em roubo, outro que soma quebra acidental e roubo, e um terceiro que acrescenta furto simples. A decisão correta começa por aqui.'
      },
      {
        title: 'Para iPhone, o custo de reposição pesa muito mais',
        text:
          'Quem usa iPhone ou outro aparelho premium precisa olhar o seguro como proteção financeira, não apenas como conforto. Quando a reposição do aparelho seria pesada para o bolso, o seguro passa a fazer mais sentido.'
      },
      {
        title: 'A contratação pede verificação pelo app da Porto',
        text:
          'Na jornada oficial e digital, você informa dados, escolhe modelo e plano, define o pagamento e faz a verificação do aparelho pelo app. Isso ajuda a reduzir atrito, mas também pede atenção na etapa de validação.'
      }
    ]
  },
  {
    category: 'seguro-celular',
    slug: 'seguro-celular-porto-usado-vigencia-desconto',
    title: 'Seguro Celular Porto: aparelho usado, vigência anual e desconto com Cartão Porto',
    date: '19 de março de 2026',
    readTime: '6 min de leitura',
    tags: ['Aparelho usado', 'Vigência', 'Desconto'],
    excerpt:
      'A Porto aceita aparelho usado dentro da elegibilidade, trabalha com vigência de 365 dias e oferece desconto para quem paga com Cartão Porto Bank.',
    overview:
      'Muita gente deixa de cotar seguro para celular porque acha que aparelho usado não entra, que a cobertura demora para valer ou que o pagamento é pesado. As páginas oficiais da Porto ajudam a desmontar essas dúvidas e deixam mais clara a leitura de vigência, elegibilidade e desconto.',
    visual: {
      eyebrow: 'Seguro Celular em uso real',
      title: 'Regra clara para contratar',
      subtitle: 'Aparelho usado, pagamento e vigência precisam ser entendidos antes da cotação.',
      chips: ['12x sem juros', '365 dias', 'Porto Bank'],
      tone: 'blue',
      logo: portoBlogLogo
    },
    heroImage: {
      url: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=1400&q=80',
      alt: 'Pessoa usando smartphone premium'
    },
    cardCoverImage: {
      url: '/assets/blog/seguro-celular-vigencia-card.png',
      alt: 'iPhone premium em destaque para representar vigência e uso real',
      position: 'center 46%'
    },
    categoryCoverImage: {
      url: '/assets/blog/seguro-celular-vigencia-card.png',
      alt: 'iPhone premium em destaque para representar vigência e uso real',
      position: 'center 46%',
      size: 'cover',
      background: 'linear-gradient(135deg, #15366a 0%, #2756a2 100%)'
    },
    sources: [cellPhoneSources[3], cellPhoneSources[4], cellPhoneSources[5], cellPhoneSources[2]],
    utilityItems: [
      'Ajuda a entender se o aparelho usado entra ou não na elegibilidade do seguro.',
      'Mostra quando a cobertura passa a valer e como a vigência anual funciona na prática.',
      'Explica o impacto do desconto com Cartão Porto e do parcelamento na decisão de compra.'
    ],
    faq: [
      {
        question: 'Posso contratar para aparelho usado?',
        answer:
          'Sim, desde que o aparelho atenda a regra oficial consultada em 19 de março de 2026: ter sido adquirido pelo primeiro dono há no máximo 24 meses. A Porto também informa a necessidade de documentos de comprovacao conforme o processo.'
      },
      {
        question: 'Quando o seguro passa a valer?',
        answer:
          'A FAQ oficial informa vigência de 365 dias, sem carência, a partir da emissão da apólice, depois da conclusão e aprovação do processo de contratação.'
      }
    ],
    blocks: [
      {
        title: 'Aparelho usado entra, mas com regra de elegibilidade',
        text:
          'A Porto aceita aparelho usado, desde que ele esteja dentro dos critérios oficiais de tempo de uso e documentação. Isso abre espaço para muita gente que não quer proteger apenas aparelho novo.'
      },
      {
        title: 'A vigência anual ajuda a dar previsibilidade',
        text:
          'Pelas informações oficiais consultadas em 19 de março de 2026, o seguro tem vigência de 365 dias e não trabalha com carência depois da emissão da apólice. Isso facilita a leitura para quem quer saber quando a proteção efetivamente começa.'
      },
      {
        title: 'Pagamento e desconto mexem no custo final',
        text:
          'A Porto informa parcelamento em até 12 vezes sem juros no cartão de crédito e desconto de 5% para pagamento com Cartão Porto Bank. No guia digital, a empresa também destaca descontos adicionais em cenários elegíveis, conforme as regras vigentes.'
      }
    ]
  },
  {
    category: 'seguro-auto',
    slug: 'seguro-auto-porto-cobertura-e-servicos',
    title: 'Seguro Auto Porto: como comparar cobertura, franquia e benefícios antes de cotar',
    date: '18 de março de 2026',
    readTime: '6 min de leitura',
    tags: ['Seguro Auto', 'Cobertura', 'Franquia'],
    excerpt:
      'Antes de comparar preço, o mais importante é entender cobertura, assistência e o tipo de benefício que continua fazendo sentido depois da contratação.',
    overview:
      'O Seguro Auto da Porto não deve ser lido apenas como uma apólice para quando acontece um sinistro. A própria Porto destaca check-ups gratuitos, serviços em centros automotivos e vantagens para o segurado. Este artigo mostra onde o seguro faz sentido de verdade e por que a comparação precisa ir além do preço.',
    visual: {
      eyebrow: 'Seguro Auto Porto',
      title: 'Cobertura que continua útil',
      subtitle: 'Não é só sobre sinistro: serviços e rotina do carro também entram na conta.',
      chips: ['Cobertura', 'Assistência', 'Centro Automotivo'],
      tone: 'blue',
      logo: portoBlogLogo
    },
    heroImage: {
      url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1400&q=80',
      alt: 'Carro em estrada representando o Seguro Auto'
    },
    sources: autoSources,
    utilityItems: [
      'Ajuda a não escolher o seguro apenas pela parcela mais baixa.',
      'Mostra que benefícios de uso, como check-up e serviços de oficina, também pesam na decisão.',
      'Organiza a leitura entre cobertura, franquia e experiência depois da contratação.'
    ],
    faq: [
      {
        question: 'Seguro Auto bom é só o que paga sinistro?',
        answer: 'Não. A utilidade real também aparece em assistência, benefícios durante a vigência e facilidade de uso no dia a dia.'
      },
      {
        question: 'Vale comparar só franquia e preço?',
        answer: 'Não. Cobertura, serviços disponíveis e a forma como a seguradora apoia você ao longo da vigência também influenciam muito.'
      }
    ],
    blocks: [
      {
        title: 'Cobertura precisa combinar com o uso do carro',
        text: 'Quem usa o carro para rotina pesada, trabalha dirigindo ou roda muito precisa olhar o desenho da cobertura com mais critério. O seguro ideal é o que protege sem deixar buracos relevantes.'
      },
      {
        title: 'Franquia entra na conta, mas não decide sozinha',
        text: 'Franquia baixa pode ajudar em alguns perfis, mas não adianta pagar mais e perder em cobertura ou serviço. O jeito certo de comparar e olhar o custo total e o que cada proposta realmente entrega.'
      },
      {
        title: 'Os benefícios de oficina ajudam a tangibilizar o valor',
        text: 'A Porto destaca check-up gratuito, serviços em centros automotivos e vantagens para segurados. Isso ajuda a perceber valor mesmo antes de qualquer imprevisto.'
      }
    ]
  },
  {
    category: 'seguro-auto',
    slug: 'centro-automotivo-porto-beneficios',
    title: 'Centro Automotivo Porto: check-up, desconto e serviços que aumentam o valor do Seguro Auto',
    date: '18 de março de 2026',
    readTime: '5 min de leitura',
    tags: ['Centro Automotivo', 'Benefícios', 'Seguro Auto'],
    excerpt:
      'A Porto destaca check-up gratuito em mais de 30 itens, 20% de desconto na mão de obra e serviços como reparo de pneu e troca de lâmpadas para segurados elegíveis.',
    overview:
      'Muita gente compara seguro apenas pelo momento do sinistro. O Centro Automotivo Porto ajuda a mudar essa leitura porque transforma o seguro em algo útil também na manutenção e na rotina do carro. Neste guia, você entende por que esses serviços reforçam o valor percebido da apólice no dia a dia.',
    visual: {
      eyebrow: 'Centro Automotivo',
      title: 'Benefício percebido rápido',
      subtitle: 'Check-up, desconto e serviços ajudam o seguro a entregar valor fora do discurso.',
      chips: ['Check-up', '20% off', 'Reparo de pneu'],
      tone: 'indigo',
      logo: portoBlogLogo
    },
    heroImage: {
      url: 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?auto=format&fit=crop&w=1400&q=80',
      alt: 'Oficina automotiva moderna'
    },
    sources: autoSources,
    utilityItems: [
      'Ajuda a perceber valor prático no seguro mesmo quando nenhum sinistro aconteceu.',
      'Mostra por que serviços e atendimento também contam na escolha da seguradora.',
      'Deixa mais claro como benefícios concretos podem pesar tanto quanto a cobertura no papel.'
    ],
    faq: [
      {
        question: 'O check-up gratuito faz parte da segurança do produto?',
        answer: 'Ele funciona como um benefício prático e ajuda a manter o carro em dia. Isso reforça a percepção de valor da apólice.'
      },
      {
        question: 'Todo segurado tem exatamente os mesmos benefícios?',
        answer: 'A Porto informa que os serviços gratuitos dependem do tipo de cobertura, região de contratação e modelo do veículo.'
      }
    ],
    blocks: [
      {
        title: 'O check-up ajuda a antecipar problema',
        text: 'Na página oficial do Centro Automotivo, a Porto destaca inspeção visual em mais de 30 itens. Isso reforça o papel preventivo do produto e ajuda na conversa com quem valoriza manutenção.'
      },
      {
        title: 'Desconto na mão de obra e serviços gratuitos pesam na rotina',
        text: 'A Porto também destaca 20% de desconto na mão de obra para segurados elegíveis do Porto Seguro Auto, além de reparo de pneu, alinhamento, cristalização do para-brisa e troca de lâmpadas em situações elegíveis.'
      },
      {
        title: 'O seguro ganha mais valor quando o benefício aparece no uso real',
        text: 'Esse tipo de vantagem ajuda a entender que o seguro não vive apenas do medo do sinistro. Ele passa a mostrar utilidade concreta também na rotina.'
      }
    ]
  },
  {
    category: 'plano-saude',
    slug: 'porto-saude-rede-reembolso-coparticipacao',
    title: 'Porto Saúde: como comparar rede, reembolso e coparticipação antes de pedir proposta',
    date: '18 de março de 2026',
    readTime: '6 min de leitura',
    tags: ['Plano de Saúde', 'Rede', 'Coparticipação'],
    excerpt:
      'No Porto Saúde, comparar bem significa olhar rede hospitalar, reembolso, tipo de coparticipação e abrangência antes de aceitar uma proposta.',
    overview:
      'Plano de saúde não deve ser avaliado apenas pelo valor da mensalidade. A página oficial da Porto mostra diferenças claras entre rede, reembolso e coparticipação. Este guia foi escrito para organizar essa decisão de um jeito mais simples e mais útil.',
    visual: {
      eyebrow: 'Porto Saúde',
      title: 'Rede e custo bem lidos',
      subtitle: 'O melhor plano não é o mais barato: é o que encaixa na rotina e na rede certa.',
      chips: ['Rede', 'Reembolso', 'Coparticipação'],
      tone: 'teal',
      logo: portoBlogLogo
    },
    heroImage: {
      url: 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1400&q=80',
      alt: 'Profissional de saúde em atendimento'
    },
    sources: healthSources,
    utilityItems: [
      'Ajuda a comparar plano por rede hospitalar e não apenas por preço.',
      'Explica onde a coparticipação pode ajudar ou atrapalhar conforme o perfil de uso.',
      'Evita contratar uma opção com reembolso ou abrangência desalinhada da necessidade real.'
    ],
    faq: [
      {
        question: 'Todo plano Porto Saúde tem reembolso?',
        answer: 'Não. A própria Porto informa que, com exceção da Linha Pro, os demais planos de saúde e odontológico dão direito a reembolso.'
      },
      {
        question: 'Como a coparticipação funciona?',
        answer: 'A Porto explica duas formas: valor fixo por procedimento ou percentual sobre o custo real do atendimento, conforme o plano.'
      }
    ],
    blocks: [
      {
        title: 'Rede hospitalar vem antes da mensalidade',
        text: 'O primeiro filtro precisa ser rede, hospitais, laboratórios e abrangência. Quando isso não está claro, a chance de contratar um plano inadequado sobe muito.'
      },
      {
        title: 'Reembolso muda a lógica de uso',
        text: 'Para alguns perfis, reembolso é essencial. Para outros, uma boa rede credenciada resolve melhor. O mais importante é entender esse encaixe antes da proposta.'
      },
      {
        title: 'Coparticipação precisa ser lida sem romantização',
        text: 'Coparticipação pode ajudar no equilíbrio do custo, mas pesa na rotina de quem usa o plano com frequência. Por isso ela precisa entrar como decisão de uso, não como detalhe técnico.'
      }
    ]
  },
  {
    category: 'plano-saude',
    slug: 'porto-saude-telemedicina-e-beneficios',
    title: 'Porto Saúde para empresas: onde telemedicina, psicólogo online e programas de saúde fazem diferença',
    date: '18 de março de 2026',
    readTime: '6 min de leitura',
    tags: ['Telemedicina', 'Plano Empresarial', 'Benefícios'],
    excerpt:
      'A Porto destaca telemedicina 24h, Psicólogos Online, coleta domiciliar e programas de promoção da saúde para complementar a leitura do plano.',
    overview:
      'Quando a empresa escolhe um plano, não deveria olhar só para hospital e tabela. A página da Porto coloca em destaque serviços de acesso e cuidado contínuo, como Alô Saúde, Time Médico Porto Saúde e programas de promoção da saúde. Isso muda bastante a percepção de valor.',
    visual: {
      eyebrow: 'Benefícios Porto Saúde',
      title: 'Acesso e cuidado contínuo',
      subtitle: 'Telemedicina, acolhimento e serviços de apoio pesam na experiência de uso do plano.',
      chips: ['Telemedicina 24h', 'Psicólogo Online', 'Time Médico'],
      tone: 'indigo',
      logo: portoBlogLogo
    },
    heroImage: {
      url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1400&q=80',
      alt: 'Profissional médica usando tablet em hospital'
    },
    sources: healthSources,
    utilityItems: [
      'Ajuda a empresa a avaliar experiência de uso e não apenas mensalidade e rede.',
      'Mostra que acesso rápido a orientação e saúde emocional também tem peso real.',
      'Ajuda a deixar o valor do plano mais claro para RH, gestor e para quem vai usar a cobertura.'
    ],
    faq: [
      {
        question: 'O Porto Saúde tem telemedicina?',
        answer: 'Sim. A página oficial destaca o Alô Saúde com atendimento médico 24 horas, 7 dias por semana.'
      },
      {
        question: 'Existe algum suporte além da rede credenciada?',
        answer: 'Sim. A Porto também destaca Psicólogos Online, Time Médico Porto Saúde, coleta domiciliar e programas de promoção da saúde.'
      }
    ],
    blocks: [
      {
        title: 'Telemedicina reduz atrito logo no primeiro contato',
        text: 'A Porto destaca atendimento 24h para triagem, orientação e direcionamento. Isso ajuda a resolver dúvidas rapidamente e melhora a percepção de acesso ao plano.'
      },
      {
        title: 'Saúde emocional e programas de cuidado agregam valor',
        text: 'Psicólogos Online, Time Médico e programas voltados a promoção da saúde transformam o plano em uma jornada mais completa, o que faz muita diferença para empresas que olham experiência.'
      },
      {
        title: 'Benefício bom é o que facilita o uso',
        text: 'Quando esse tipo de apoio fica claro, o plano deixa de parecer apenas uma lista de hospitais. Fica mais fácil perceber conveniência, suporte e continuidade no cuidado.'
      }
    ]
  },
  {
    category: 'fianca-e-imobiliario',
    slug: 'seguro-fianca-porto-sem-fiador',
    title: 'Seguro Fiança Porto: quando faz sentido alugar sem fiador e o que avaliar antes da proposta',
    date: '18 de março de 2026',
    readTime: '6 min de leitura',
    tags: ['Seguro Fiança', 'Locação', 'Sem fiador'],
    excerpt:
      'A Porto posiciona o Seguro Fiança como alternativa ao fiador e à caução, com coberturas para aluguel e encargos e um processo mais ágil na locação.',
    overview:
      'Para quem está alugando, a primeira pergunta costuma ser simples: preciso mesmo de fiador? A página oficial da Porto mostra um caminho mais prático, com garantia locatícia, parcelamento e análise ágil. Este guia mostra o que avaliar antes de seguir com a proposta e quando o Seguro Fiança pode deixar a locação mais fluida.',
    visual: {
      eyebrow: 'Seguro Fiança Porto',
      title: 'Locação mais fluida',
      subtitle: 'Sem fiador, com leitura clara de garantia, fluxo e encargos da locação.',
      chips: ['Sem fiador', 'Locação', 'Análise ágil'],
      tone: 'gold',
      logo: portoBlogLogo
    },
    heroImage: {
      url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1400&q=80',
      alt: 'Prédio residencial para locação'
    },
    sources: fiancaSources,
    utilityItems: [
      'Ajuda o inquilino a entender quando o seguro faz mais sentido que fiador ou caução.',
      'Mostra que cobertura e fluxo de aprovação precisam ser lidos junto com a proposta.',
      'Também esclarece vantagens para proprietário e imobiliária no mesmo movimento.'
    ],
    faq: [
      {
        question: 'O Seguro Fiança substitui fiador e caução?',
        answer: 'Sim. A página oficial da Porto apresenta o produto como substituto do fiador, com vantagens para inquilino, proprietário e imobiliária.'
      },
      {
        question: 'A aprovação demora?',
        answer: 'Segundo a página oficial consultada em 18 de março de 2026, o retorno para locações residenciais acontece na hora.'
      }
    ],
    blocks: [
      {
        title: 'O ganho de praticidade é real',
        text: 'A Porto destaca que o produto evita a busca por fiador e dispensa caução. Isso deixa a locação mais simples para quem precisa fechar o imóvel com menos atrito.'
      },
      {
        title: 'A proposta precisa ser lida pela cobertura, não só pela urgência',
        text: 'Aluguel, encargos e coberturas adicionais precisam ser avaliados junto com o contrato. O jeito certo é entender o que entra na garantia e como isso protege a locação.'
      },
      {
        title: 'Quando o seguro vira vantagem para todos',
        text: 'O produto se fortalece quando o inquilino quer velocidade, o proprietário quer garantia profissional e a imobiliária precisa de uma locação mais fluida.'
      }
    ]
  },
  {
    category: 'fianca-e-imobiliario',
    slug: 'seguro-fianca-porto-coberturas-locacao',
    title: 'Coberturas do Seguro Fiança Porto: aluguel, encargos e danos ao imóvel sem confusão',
    date: '18 de março de 2026',
    readTime: '6 min de leitura',
    tags: ['Coberturas', 'Seguro Fiança', 'Locação'],
    excerpt:
      'Aluguel, condomínio, IPTU, danos ao imóvel, pintura, água, luz e gás aparecem entre as coberturas destacadas pela Porto para o Seguro Fiança.',
    overview:
      'O maior erro na locação é falar de Seguro Fiança de forma vaga. A página da Porto detalha o que pode entrar na cobertura e mostra que a garantia não se resume ao aluguel. Este artigo organiza a leitura de aluguel, encargos e danos ao imóvel para deixar a decisão mais clara.',
    visual: {
      eyebrow: 'Coberturas da locação',
      title: 'Garantia lida do jeito certo',
      subtitle: 'Aluguel e encargos entram com pesos diferentes e precisam ser bem explicados.',
      chips: ['Aluguel', 'Encargos', 'Danos ao imóvel'],
      tone: 'teal',
      logo: portoBlogLogo
    },
    heroImage: {
      url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1400&q=80',
      alt: 'Chaves e contrato de locação'
    },
    sources: fiancaSources,
    utilityItems: [
      'Ajuda a entender a diferença entre cobertura básica e coberturas adicionais.',
      'Evita prometer proteção que não está ajustada a modalidade contratada.',
      'Diminui ruído entre inquilino, proprietário e imobiliária na fase de proposta.'
    ],
    faq: [
      {
        question: 'O Seguro Fiança cobre só o aluguel?',
        answer: 'Não. A Porto também destaca coberturas adicionais para condomínio, IPTU, danos ao imóvel, pintura, água, luz e gás, conforme a modalidade.'
      },
      {
        question: 'Todas as coberturas entram automaticamente?',
        answer: 'Não. A própria Porto informa que as coberturas variam de acordo com a modalidade do seguro aluguel contratada.'
      }
    ],
    blocks: [
      {
        title: 'A cobertura básica precisa ser o ponto de partida',
        text: 'A Porto destaca pagamento do aluguel e multa moratória como base. Esse é o primeiro item que precisa estar claro antes de qualquer complemento.'
      },
      {
        title: 'Encargos e danos ampliam a leitura da garantia',
        text: 'Condomínio, IPTU, danos ao imóvel, pintura e contas como água, luz e gás podem entrar na composição conforme a modalidade. Isso muda muito o nível de proteção da locação.'
      },
      {
        title: 'Entender a cobertura do contrato evita surpresa depois',
        text: 'Quando fica claro o que é básico, o que é adicional e como cada item afeta a locação, a decisão fica mais segura para todos os lados.'
      }
    ]
  }
];

export const blogArticles = [
  ...cardUpdates.map((item) => ({
    ...categoryMeta.cartoes,
    ...item,
    actionHref: item.contractUrl
  })),
  ...extraArticles.map((item) => ({
    ...categoryMeta[item.category],
    ...item
  }))
];

export const getArticleBySlug = (slug) => blogArticles.find((item) => item.slug === slug);
export const getArticlesByCategory = (category) => blogArticles.filter((item) => item.category === category);
