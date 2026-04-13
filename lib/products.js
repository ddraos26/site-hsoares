import { getPrimaryPortoDestinationByProductSlug } from './porto-destinations';

export const products = [
  {
    slug: 'seguro-fianca',
    name: 'Seguro Fiança',
    category: 'Locação',
    shortDescription: 'Garantia locatícia com análise rápida, operação 24h para imobiliárias e mais agilidade na locação.',
    longDescription:
      'O Seguro Fiança é uma das grandes especialidades da H Soares. Hoje a operação está cada vez mais automatizada, com plataforma própria para imobiliárias parceiras, retorno imediato nas seguradoras operadas e possibilidade de avançar a locação no mesmo dia, com Seguro Imobiliário calculado no mesmo fluxo.',
    heroImage:
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1800&q=80',
    highlights: ['Sem fiador', 'Resultado na hora', 'Plataforma 24h para imobiliárias', 'Seguro Imobiliário integrado'],
    overview: [
      'Substitui o fiador tradicional com uma jornada muito mais rápida e escalável.',
      'A plataforma da H Soares devolve resultado na hora para operações elegíveis nas seguradoras parceiras.',
      'Seguro Fiança e Seguro Imobiliário podem seguir juntos na mesma jornada para acelerar a locação.'
    ],
    coverages: [
      'Cobertura para aluguel e encargos previstos na apólice contratada.',
      'Possibilidade de incluir condomínio, IPTU e outras verbas locatícias conforme o plano.',
      'Regras, limites e itens adicionais variam conforme a seguradora e o perfil da operação.'
    ],
    whoItsFor: [
      'Locatários que querem alugar sem depender de fiador.',
      'Proprietários que buscam garantia contratual profissional.',
      'Imobiliárias que querem mais padronização e agilidade no fluxo de locação.'
    ],
    hiringSteps: [
      'A imobiliária parceira acessa a plataforma a qualquer dia e horário.',
      'Os dados da locação são informados diretamente no fluxo digital.',
      'O resultado do Seguro Fiança aparece na hora nas seguradoras operadas.',
      'O Seguro Imobiliário já é calculado no mesmo processo, com opção de contratação imediata.'
    ],
    fiancaAudienceCards: [
      {
        title: 'Para o locatário',
        icon: 'home',
        points: [
          'Substitui o fiador tradicional no processo de locação.',
          'Acelera a assinatura do contrato com uma jornada mais objetiva.',
          'Ajuda a viabilizar a locação com resposta mais rápida e menos atrito.'
        ]
      },
      {
        title: 'Para o proprietário',
        icon: 'shield',
        points: [
          'Mais previsibilidade contratual conforme coberturas escolhidas.',
          'Garantia profissional com regras claras e seguradora responsável pela apólice.',
          'Mais velocidade para aprovar a locação e reduzir demora operacional.'
        ]
      },
      {
        title: 'Para a imobiliária',
        icon: 'building',
        points: [
          'Plataforma própria com análise automática e retorno imediato.',
          'Comparação operacional das seguradoras no mesmo ambiente.',
          'Mais produtividade para aprovar locações com mais escala e menos atrito operacional.'
        ]
      }
    ],
    fiancaSteps: [
      {
        title: 'Acesso à plataforma',
        description: 'A imobiliária parceira entra no sistema da H Soares e inicia a análise do Seguro Fiança no mesmo instante.'
      },
      {
        title: 'Resultado na hora',
        description: 'As seguradoras operadas retornam a análise de forma imediata para operações elegíveis dentro da plataforma.'
      },
      {
        title: 'Cálculo integrado',
        description: 'O Seguro Imobiliário já aparece no mesmo fluxo, com valores prontos para seguir junto da locação.'
      },
      {
        title: 'Locação acelerada',
        description: 'Com a análise concluída, a contratação pode avançar no mesmo dia e em qualquer horário disponível.'
      }
    ],
    fiancaCoverageBlocks: [
      {
        title: 'Aluguel e encargos',
        tone: 'safety',
        icon: 'shield',
        items: [
          'Cobertura para valores de aluguel previstos na apólice.',
          'Possibilidade de incluir encargos locatícios conforme contratação.',
          'Limites definidos de acordo com a seguradora e o perfil aprovado.'
        ]
      },
      {
        title: 'Condomínio e IPTU',
        tone: 'energy',
        icon: 'document',
        items: [
          'Itens adicionais podem compor a garantia conforme o plano.',
          'A composição final varia por seguradora e pela operação de locação.',
          'Nossa equipe orienta exatamente o que está ou não incluso.'
        ]
      },
      {
        title: 'Danos ao imóvel',
        tone: 'trust',
        icon: 'tools',
        items: [
          'Coberturas específicas podem prever danos ao imóvel locado.',
          'Condições e critérios dependem da apólice contratada.',
          'Leitura técnica da corretora para evitar contratação desalinhada.'
        ]
      },
      {
        title: 'Multas e verbas adicionais',
        tone: 'fire',
        icon: 'key',
        items: [
          'A multa por rescisão e outras verbas podem ser avaliadas conforme seguradora.',
          'Nem toda composição é automática; depende do desenho do contrato.',
          'A H Soares valida a melhor estrutura antes da contratação.'
        ]
      }
    ],
    fiancaOperationCards: [
      {
        title: 'Seguro Imobiliário calculado junto',
        type: 'list',
        items: [
          'No mesmo fluxo do Seguro Fiança, a plataforma já calcula o Seguro Imobiliário.',
          'Os valores aparecem automaticamente para a imobiliária parceira visualizar e decidir.',
          'A contratação dos dois produtos pode ser conduzida sem sair da mesma jornada.'
        ]
      },
      {
        title: 'Operação disponível a qualquer dia e horário',
        type: 'list',
        items: [
          'A análise pode ser iniciada dentro da plataforma sempre que a imobiliária precisar.',
          'O retorno imediato reduz fila operacional e ajuda a fechar a locação no mesmo dia.',
          'Mais velocidade para a imobiliária e mais previsibilidade para proprietário e locatário.'
        ]
      }
    ],
    fiancaDocuments: [
      'Resultado na hora para operações elegíveis dentro da plataforma.',
      'Fluxo digital pensado para uso recorrente por imobiliárias parceiras.',
      'Seguro Fiança e Seguro Imobiliário no mesmo processo.',
      'Contratação mais rápida para acelerar a locação.'
    ],
    fiancaPartners: [
      { name: 'Porto', logo: '/assets/PORTO.png' },
      { name: 'Tokio Marine', logo: '/assets/insurers/tokio-marine.png' },
      { name: 'Too Seguros', logo: '/assets/insurers/too-seguros.png' }
    ],
    fiancaPlatform: {
      title: 'Plataforma exclusiva para imobiliárias parceiras',
      description:
        'A H Soares conta com uma plataforma própria para imobiliárias cadastradas, com análise automática, resultado na hora e possibilidade de seguir a locação com muito mais velocidade.',
      bullets: [
        'Resultado na hora nas três seguradoras operadas pela H Soares.',
        'Seguro Fiança e Seguro Imobiliário calculados no mesmo fluxo da locação.',
        'Fluxo disponível a qualquer dia e horário para acelerar aprovação e contratação.',
        'Acesso restrito para imobiliárias parceiras com cadastro ativo.'
      ],
      ctaLabel: 'Acessar plataforma da imobiliária',
      url: 'https://plataforma.hsoaresseguros.com.br/login'
    },
    faqs: [
      {
        q: 'O Seguro Fiança substitui o fiador?',
        a: 'Sim. Ele é uma modalidade de garantia locatícia usada para substituir o fiador tradicional na locação.'
      },
      {
        q: 'A análise sai na hora?',
        a: 'Para operações elegíveis na plataforma das imobiliárias parceiras, o retorno sai na hora nas seguradoras operadas pela H Soares.'
      },
      {
        q: 'Serve para locatário, proprietário e imobiliária?',
        a: 'Sim. A estrutura do produto atende interesses diferentes dentro da operação de locação.'
      },
      {
        q: 'Vocês trabalham com mais de uma seguradora?',
        a: 'Sim. A H Soares opera Seguro Fiança com Porto Seguro, Tokio Marine e Too Seguros.'
      },
      {
        q: 'O Seguro Imobiliário aparece junto na plataforma?',
        a: 'Sim. No fluxo da plataforma parceira, o Seguro Imobiliário já é calculado junto do Seguro Fiança, com visualização de valores e possibilidade de contratação.'
      }
    ],
    portoUrl: 'https://wa.me/5511972064288?text=Ol%C3%A1%2C%20quero%20cotar%20o%20Seguro%20Fian%C3%A7a.',
    status: 'ativo'
  },
  {
    slug: 'seguro-imobiliario',
    name: 'Seguro Imobiliário',
    category: 'Locação',
    shortDescription: 'Proteção do imóvel alugado com cálculo integrado ao Seguro Fiança e contratação no mesmo fluxo.',
    longDescription:
      'O Seguro Imobiliário, com foco em incêndio e coberturas complementares, é uma proteção importante dentro da locação. Na operação da H Soares, ele entra integrado à plataforma das imobiliárias parceiras: o valor é calculado junto do Seguro Fiança e a contratação pode seguir na mesma jornada.',
    heroImage:
      'https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1800&q=80',
    highlights: ['Incêndio e adicionais', 'Cálculo junto do Seguro Fiança', 'Valores na hora', 'Fluxo de locação acelerado'],
    overview: [
      'Protege o imóvel alugado com cobertura básica e possibilidade de adicionais conforme a seguradora.',
      'Na plataforma da H Soares, aparece automaticamente junto da análise do Seguro Fiança.',
      'Reduz etapas separadas e ajuda a imobiliária a concluir a locação com mais velocidade.'
    ],
    coverages: [
      'Cobertura básica para incêndio, explosão, fumaça e eventos correlatos previstos na apólice.',
      'Possibilidade de incluir proteções adicionais conforme seguradora, imóvel e plano escolhido.',
      'Condições, limites e composição final dependem das regras da seguradora parceira.'
    ],
    whoItsFor: [
      'Imobiliárias que precisam fechar locações com mais rapidez e padronização.',
      'Proprietários que querem proteger o imóvel alugado com estrutura profissional.',
      'Operações de locação que já seguem o fluxo automatizado da plataforma H Soares.'
    ],
    hiringSteps: [
      'A análise do Seguro Fiança é iniciada na plataforma da H Soares.',
      'O Seguro Imobiliário é calculado automaticamente no mesmo fluxo.',
      'A imobiliária visualiza os valores e escolhe a composição ideal da locação.',
      'A contratação pode ser concluída sem sair da mesma jornada operacional.'
    ],
    imobiliarioAudienceCards: [
      {
        title: 'Para a imobiliária',
        icon: 'building',
        points: [
          'Seguro Imobiliário calculado automaticamente junto da análise do Fiança.',
          'Menos etapas separadas e mais velocidade para formalizar a locação.',
          'Fluxo único para visualizar valores e seguir com a contratação.'
        ]
      },
      {
        title: 'Para o proprietário',
        icon: 'shield',
        points: [
          'Proteção importante para o imóvel alugado dentro da operação de locação.',
          'Mais previsibilidade na composição do seguro exigido para o imóvel.',
          'Estrutura profissional vinculada a seguradoras parceiras da corretora.'
        ]
      },
      {
        title: 'Para a locação',
        icon: 'home',
        points: [
          'Seguro calculado junto da garantia locatícia para não quebrar a jornada.',
          'Mais organização operacional para avançar o contrato no mesmo dia.',
          'Contratação mais fluida para quem precisa fechar a operação com rapidez.'
        ]
      }
    ],
    imobiliarioSteps: [
      {
        title: 'Análise unificada',
        description: 'Ao iniciar o Seguro Fiança na plataforma, o Seguro Imobiliário já entra no mesmo processo de cálculo.'
      },
      {
        title: 'Valores prontos',
        description: 'A imobiliária visualiza o valor do seguro do imóvel sem precisar abrir uma segunda jornada separada.'
      },
      {
        title: 'Composição da proteção',
        description: 'A cobertura básica e os adicionais aplicáveis podem ser avaliados de forma mais clara dentro do fluxo.'
      },
      {
        title: 'Contratação no mesmo fluxo',
        description: 'Com a definição pronta, a operação segue de forma contínua para acelerar a formalização da locação.'
      }
    ],
    imobiliarioCoverageBlocks: [
      {
        title: 'Incêndio e eventos básicos',
        tone: 'fire',
        icon: 'fire',
        items: [
          'Proteção básica para incêndio e eventos correlatos previstos na apólice.',
          'Composição essencial para a proteção do imóvel alugado na locação.',
          'Limites e regras definidos conforme a seguradora e o plano.'
        ]
      },
      {
        title: 'Coberturas complementares',
        tone: 'energy',
        icon: 'bolt',
        items: [
          'Adicionais podem ser incluídos conforme o tipo de imóvel e a seguradora.',
          'A estrutura final da proteção varia de acordo com o enquadramento da operação.',
          'A plataforma ajuda a visualizar a composição dentro do mesmo fluxo.'
        ]
      },
      {
        title: 'Proteção da operação de locação',
        tone: 'safety',
        icon: 'shield',
        items: [
          'O seguro entra como peça importante da locação, junto da garantia locatícia.',
          'Mais previsibilidade para imobiliária e proprietário na formalização do contrato.',
          'Jornada integrada para evitar retrabalho e etapas separadas.'
        ]
      },
      {
        title: 'Contratação mais rápida',
        tone: 'trust',
        icon: 'clock',
        items: [
          'O valor já aparece dentro da plataforma quando a análise do Fiança é realizada.',
          'A contratação pode seguir sem sair da mesma operação.',
          'Mais velocidade para concluir a locação e reduzir demora na análise.'
        ]
      }
    ],
    imobiliarioOperationCards: [
      {
        title: 'Integrado ao Seguro Fiança',
        type: 'list',
        items: [
          'A plataforma da H Soares já calcula o Seguro Imobiliário junto com a análise do Fiança.',
          'A imobiliária não precisa abrir uma segunda esteira para descobrir valor e contratação.',
          'Tudo fica mais rápido, mais padronizado e mais próximo da rotina real da locação.'
        ]
      },
      {
        title: 'Fluxo pensado para locação',
        type: 'list',
        items: [
          'A jornada foi desenhada para apoiar operações imobiliárias que precisam de velocidade.',
          'O cálculo automático ajuda a decidir na hora e a seguir com a formalização do contrato.',
          'Mais organização para a imobiliária e mais agilidade para concluir a operação.'
        ]
      }
    ],
    imobiliarioPlatform: {
      title: 'Seguro Imobiliário dentro da plataforma da imobiliária',
      description:
        'Na operação da H Soares, o Seguro Imobiliário já entra no mesmo fluxo do Seguro Fiança. A plataforma mostra os valores na hora e permite avançar com a contratação dentro da mesma jornada.',
      bullets: [
        'Cálculo automático junto da análise do Seguro Fiança.',
        'Visualização imediata dos valores dentro da plataforma parceira.',
        'Opção de contratação sem sair do mesmo fluxo de locação.',
        'Disponível para imobiliárias parceiras cadastradas.'
      ],
      ctaLabel: 'Entrar na plataforma da imobiliária',
      url: 'https://plataforma.hsoaresseguros.com.br/login'
    },
    faqs: [
      {
        q: 'O Seguro Imobiliário é calculado junto do Seguro Fiança?',
        a: 'Sim. Na plataforma da H Soares, o cálculo do Seguro Imobiliário aparece junto da análise do Seguro Fiança para as imobiliárias parceiras.'
      },
      {
        q: 'Ele pode ser contratado no mesmo fluxo?',
        a: 'Sim. A ideia da operação é justamente evitar jornadas separadas e permitir que a contratação avance na mesma esteira da locação.'
      },
      {
        q: 'Esse seguro está ligado à proteção contra incêndio?',
        a: 'Sim. A cobertura básica envolve incêndio e eventos correlatos previstos na apólice, com possibilidade de adicionais conforme a seguradora.'
      },
      {
        q: 'Quem mais se beneficia dessa integração?',
        a: 'Imobiliárias parceiras, proprietários e operações de locação que precisam ganhar velocidade sem perder organização.'
      }
    ],
    portoUrl: 'https://wa.me/5511972064288?text=Ol%C3%A1%2C%20quero%20entender%20o%20Seguro%20Imobili%C3%A1rio%20da%20loca%C3%A7%C3%A3o.',
    status: 'ativo'
  },
  {
    slug: 'plano-saude',
    name: 'Plano de Saúde',
    category: 'Saúde',
    shortDescription: 'Comparativo entre operadoras, rede médica e custo total para contratar com mais segurança.',
    longDescription:
      'A H Soares atua com diversas operadoras de Plano de Saúde para montar propostas mais aderentes ao perfil de cada cliente. A ideia não é vender qualquer plano, e sim posicionar a melhor combinação entre rede, cobertura, acomodação e custo total.',
    heroImage:
      'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1800&q=80',
    highlights: ['Individual, familiar e empresarial', 'Comparativo de operadoras', 'Rede e custo total', 'Atendimento consultivo'],
    overview: [
      'Comparativo entre operadoras para evitar escolha baseada só em preço.',
      'Leitura prática de rede credenciada, acomodação, coparticipação e abrangência.',
      'Apoio da H Soares para acelerar decisão com mais clareza e menos ruído técnico.'
    ],
    coverages: [
      'Condições de cobertura variam conforme operadora, linha do plano e elegibilidade.',
      'Rede médica, laboratórios, hospitais e acomodação devem ser avaliados com critério.',
      'Carências, coparticipação e regras de adesão precisam entrar na decisão final.'
    ],
    whoItsFor: [
      'Clientes pessoa física e famílias que querem contratar com mais segurança.',
      'Empresas que precisam estruturar plano para sócios, equipe ou dependentes.',
      'Quem quer migrar de operadora ou revisar o plano atual com visão mais estratégica.'
    ],
    hiringSteps: [
      'Entendemos perfil, faixa etária, região de atendimento e prioridade de rede médica.',
      'Montamos um comparativo entre operadoras e linhas mais aderentes ao cenário.',
      'Ajudamos na leitura de custo, carência, acomodação e cobertura.',
      'Seguimos com a proposta escolhida e acompanhamos o processo até a adesão.'
    ],
    faqs: [
      {
        q: 'Vocês trabalham com várias operadoras?',
        a: 'Sim. A H Soares atua com diversas operadoras do mercado para comparar opções e posicionar a proposta mais aderente.'
      },
      {
        q: 'Vocês vendem plano individual e empresarial?',
        a: 'Sim. Atendemos planos individuais, familiares e empresariais, conforme perfil e regras de elegibilidade.'
      },
      {
        q: 'Preço baixo é suficiente para decidir?',
        a: 'Não. Rede credenciada, abrangência, acomodação, carência e custo total precisam entrar na comparação.'
      },
      {
        q: 'Posso falar com alguém antes de avançar na proposta?',
        a: 'Sim. O atendimento da H Soares ajuda a comparar operadoras e escolher a melhor rota de contratação.'
      }
    ],
    portoUrl: 'https://wa.me/5511972064288?text=Ol%C3%A1%2C%20quero%20cotar%20Plano%20de%20Sa%C3%BAde.',
    status: 'ativo'
  },
  {
    slug: 'azul-por-assinatura',
    name: 'Azul por Assinatura',
    category: 'Auto',
    shortDescription: 'Seguro auto em formato de assinatura mensal, com jornada digital e flexível.',
    longDescription:
      'O Azul por Assinatura foi pensado para quem quer previsibilidade no custo mensal do seguro e uma contratação mais simples. A H Soares atua na etapa consultiva para validar perfil, coberturas e custo-benefício antes da finalização no ambiente oficial da Porto.',
    heroImage:
      'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1800&q=80',
    overview: [
      'Modelo de seguro com pagamento recorrente mensal, ideal para quem busca controle de caixa.',
      'Processo digital para acelerar a jornada de contratação.',
      'Acompanhamento da H Soares para apoiar decisão e contratação.'
    ],
    coverages: [
      'Cobertura para eventos previstos nas condições do produto (conforme regras da seguradora).',
      'Opções de proteção para danos ao veículo e terceiros conforme plano selecionado.',
      'Assistências e serviços vinculados ao pacote contratado.'
    ],
    whoItsFor: [
      'Motoristas que querem previsibilidade de custo mensal.',
      'Clientes que preferem jornada digital com menos burocracia.',
      'Quem busca proteção auto com orientação especializada.'
    ],
    hiringSteps: [
      'Entendimento de perfil e uso do veículo com a H Soares.',
      'Validação de cobertura e custo total.',
      'Redirecionamento para o link oficial e finalização digital.',
      'Acompanhamento pós-clique para aumentar taxa de conclusão.'
    ],
    faqs: [
      { q: 'Esse produto substitui o seguro auto tradicional?', a: 'Ele atende uma proposta de assinatura. A escolha ideal depende do seu perfil, uso do carro e objetivo financeiro.' },
      { q: 'Posso tirar dúvidas antes de contratar?', a: 'Sim. Nossa equipe faz uma orientação prévia para você decidir com segurança.' },
      { q: 'A contratação final é no site da H Soares?', a: 'Não. A finalização ocorre no ambiente oficial da Porto, com seu link identificado.' },
      { q: 'O valor mensal é fixo para todos?', a: 'Não. O preço varia conforme perfil, veículo e regras de aceitação da seguradora.' }
    ],
    portoUrl: getPrimaryPortoDestinationByProductSlug('azul-por-assinatura'),
    status: 'ativo'
  },
  {
    slug: 'cartao-credito-porto-bank',
    name: 'Cartão de Crédito Porto Bank',
    category: 'Financeiro',
    seoTitle: 'Cartão Porto Bank: Sem Anuidade, Gold, Platinum e Black | H Soares Seguros',
    seoDescription:
      'Compare anuidade, renda mínima, pontos PortoPlus e benefícios do Cartão Porto Bank antes de fazer o pedido oficial com apoio da H Soares.',
    seoImage: '/assets/blog/porto-hero-option-2-crop.webp',
    keywords: [
      'cartao porto bank',
      'cartao de credito porto bank',
      'cartao porto sem anuidade',
      'cartao porto vale a pena',
      'anuidade cartao porto'
    ],
    shortDescription:
      'Compare versões, anuidade, PortoPlus e benefícios do Cartão Porto Bank antes de seguir para o pedido oficial da Porto.',
    longDescription:
      'O Cartão Porto Bank faz mais sentido quando você compara a versão certa para a sua renda, o seu gasto mensal e o tipo de benefício que realmente vai usar. A H Soares organiza essa leitura e o clique principal continua sendo o pedido oficial da Porto.',
    heroImage: '/assets/blog/porto-hero-option-2-crop.png',
    highlights: ['Sem anuidade ou 12 meses grátis', 'PortoPlus e benefícios Porto', 'App + carteiras digitais', 'Pedido oficial Porto Bank'],
    overview: [
      'Ajuda a comparar sem anuidade, Internacional, Gold, Platinum e cartões premium antes do pedido.',
      'Organiza anuidade, pontuação, app, Tag Porto, Shell Box e benefícios em uma leitura mais clara.',
      'A H Soares atua como apoio consultivo, mas o pedido segue no link oficial da Porto.'
    ],
    coverages: [
      'Aprovação sujeita à análise cadastral e de crédito do Porto Bank.',
      'Benefícios, anuidade, pontuação e acessos variam conforme a versão escolhida e a política vigente.',
      'O pedido é digital e acontece no ambiente oficial da Porto, com apoio opcional da H Soares antes do clique.'
    ],
    whoItsFor: [
      'Quem quer um cartão com pontos, benefícios e integração com o ecossistema Porto.',
      'Perfis que concentram gastos no cartão para reduzir anuidade ou extrair mais retorno.',
      'Quem quer comparar versões com mais critério antes de pedir.'
    ],
    hiringSteps: [
      'Compare a versão do cartão que faz sentido para sua renda, gasto e benefícios desejados.',
      'Clique no link oficial da Porto para iniciar o pedido no ambiente correto.',
      'Preencha os dados solicitados e siga a análise de crédito do Porto Bank.',
      'Se preferir, fale com a H Soares antes do clique para tirar dúvidas sobre faixa, anuidade e benefícios.'
    ],
    faqs: [
      {
        q: 'O Cartão Porto tem anuidade?',
        a: 'Depende da versão. A Porto destaca cartão sem anuidade e versões com 12 meses de isenção inicial, além de mensalidade que pode cair ou zerar conforme o gasto mensal.'
      },
      {
        q: 'Preciso me cadastrar para começar a pontuar no PortoPlus?',
        a: 'Não. Segundo a FAQ oficial da Porto, os pontos já começam a ser gerados ao usar o cartão e podem ser consultados no WhatsApp da Porto, no app ou na área do cliente.'
      },
      {
        q: 'Qual é a validade dos pontos do Cartão Porto Bank?',
        a: 'A Porto informa validade de 24 meses para os pontos do programa de relacionamento, contados a partir da data de aquisição do cartão.'
      },
      {
        q: 'O que o app da Porto resolve no dia a dia do cartão?',
        a: 'A Porto informa que pelo aplicativo é possível acompanhar gastos, acessar fatura, consultar limite, bloquear e desbloquear o cartão, fazer aviso viagem e usar meios de pagamento como cartão virtual e carteiras digitais.'
      },
      {
        q: 'A aprovação é garantida?',
        a: 'Não. A aprovação depende da análise de crédito e dos critérios internos do Porto Bank.'
      },
      {
        q: 'A H Soares faz a análise de crédito?',
        a: 'Não. A análise é do Porto Bank. A H Soares entra como apoio consultivo para ajudar você a entender versão, benefícios e melhor próximo passo.'
      }
    ],
    conversionTitle: 'Quer pedir o Cartão Porto com mais clareza?',
    conversionDescription:
      'Se quiser uma orientação rápida antes de seguir, fale com a H Soares. Se já decidiu, o caminho principal desta página é o pedido oficial da Porto.',
    conversionPrimaryLabel: 'Ir para o pedido oficial da Porto',
    conversionSecondaryLabel: 'Seguir sem preencher',
    portoUrl: getPrimaryPortoDestinationByProductSlug('cartao-credito-porto-bank'),
    status: 'ativo'
  },
  {
    slug: 'conta-digital-porto-bank',
    name: 'Conta Digital Porto Bank',
    category: 'Financeiro',
    shortDescription: 'Conta digital para gestão financeira prática no dia a dia.',
    longDescription:
      'A Conta Digital Porto Bank atende quem busca conveniência e operação digital no dia a dia. A H Soares ajuda a entender o valor prático da solução e a seguir com mais segurança para o link oficial.',
    heroImage:
      'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1800&q=80',
    overview: [
      'Fluxo de abertura e uso no ambiente digital.',
      'Operação alinhada à rotina financeira moderna.',
      'Suporte consultivo para reduzir dúvidas antes da adesão.'
    ],
    coverages: [
      'Serviços e funcionalidades definidos pelo Porto Bank.',
      'Condições de abertura conforme critérios internos da instituição.',
      'Recursos disponíveis de acordo com perfil e políticas ativas.'
    ],
    whoItsFor: [
      'Pessoas que preferem banco digital.',
      'Clientes que desejam praticidade na gestão diária.',
      'Perfis que buscam integração com ecossistema Porto.'
    ],
    hiringSteps: [
      'Alinhamento inicial com a H Soares.',
      'Clique no botão de contratação para o link oficial.',
      'Abertura no fluxo da instituição financeira.',
      'Suporte em dúvidas de jornada e documentação.'
    ],
    faqs: [
      { q: 'Posso abrir sem sair de casa?', a: 'Sim. A abertura segue fluxo digital oficial.' },
      { q: 'A H Soares administra minha conta?', a: 'Não. A gestão é do Porto Bank. Nós atuamos na orientação da jornada.' },
      { q: 'Há análise cadastral?', a: 'Sim, conforme regras da instituição financeira.' },
      { q: 'O link já está identificado com a corretora?', a: 'Sim. Seus links são próprios e vinculados à H Soares.' }
    ],
    portoUrl: getPrimaryPortoDestinationByProductSlug('conta-digital-porto-bank'),
    status: 'ativo'
  },
  {
    slug: 'equipamentos-portateis',
    name: 'Seguro Equipamentos Portáteis',
    category: 'Equipamentos',
    shortDescription: 'Proteção para equipamentos usados em trabalho, estudo e rotina diária.',
    longDescription:
      'O seguro para equipamentos portáteis reduz o impacto de imprevistos com itens de alto uso. A página foi construída para explicar com clareza o valor da proteção e conduzir para contratação oficial com suporte consultivo da H Soares.',
    heroImage:
      'https://images.unsplash.com/photo-1496171367470-9ed9a91ea931?auto=format&fit=crop&w=1800&q=80',
    overview: [
      'Proteção para dispositivos elegíveis dentro das regras de aceitação.',
      'Jornada digital de contratação no ambiente Porto.',
      'Acompanhamento da corretora para aumentar confiança na contratação.'
    ],
    coverages: [
      'Coberturas e franquias conforme plano contratado.',
      'Critérios de elegibilidade por tipo, estado e uso do equipamento.',
      'Condições de acionamento conforme regulamento da seguradora.'
    ],
    whoItsFor: [
      'Profissionais que dependem de dispositivos para produzir.',
      'Estudantes e usuários com equipamentos de maior valor.',
      'Clientes que buscam segurança financeira contra imprevistos.'
    ],
    hiringSteps: [
      'Entendimento rápido do equipamento e perfil de uso.',
      'Validação da melhor rota de contratação.',
      'Redirecionamento para finalização oficial no link Porto.',
      'Suporte pós-clique se houver dúvida no formulário.'
    ],
    faqs: [
      { q: 'Quais itens são aceitos?', a: 'A aceitação depende da política vigente da seguradora no momento da contratação.' },
      { q: 'Posso contratar para equipamento usado?', a: 'Depende das regras de elegibilidade, que aparecem no fluxo oficial.' },
      { q: 'A cobertura é imediata?', a: 'A vigência segue as regras e confirmação de proposta da seguradora.' },
      { q: 'A H Soares ajuda em sinistro?', a: 'Sim, prestamos apoio consultivo no relacionamento com a seguradora.' }
    ],
    portoUrl: getPrimaryPortoDestinationByProductSlug('equipamentos-portateis'),
    status: 'ativo'
  },
  {
    slug: 'residencial-essencial',
    name: 'Residencial Essencial',
    category: 'Residencial',
    shortDescription: 'Proteção residencial essencial com contratação digital e suporte consultivo.',
    longDescription:
      'O Residencial Essencial é voltado para proteção do lar contra eventos relevantes previstos na apólice. A H Soares posiciona coberturas com foco prático, explicando o que realmente importa para segurança patrimonial.',
    heroImage:
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1800&q=80',
    highlights: ['Casa e apartamento', 'Assistência residencial', 'Coberturas personalizáveis', 'Contratação digital'],
    overview: [
      'Proteção para o patrimônio residencial com cobertura essencial.',
      'Possibilidade de assistências conforme pacote contratado.',
      'Jornada com linguagem clara para facilitar a decisão.'
    ],
    coverageBlocks: [
      {
        title: 'Incêndio, raio e explosão',
        icon: '🔥',
        tone: 'fire',
        items: [
          'Cobertura para danos decorrentes dos eventos previstos em contrato.',
          'Proteção do imóvel segurado e da estrutura afetada.',
          'Limites e condições conforme plano contratado.'
        ]
      },
      {
        title: 'Danos elétricos',
        icon: '⚡',
        tone: 'energy',
        items: [
          'Amparo para danos em equipamentos por variações elétricas cobertas.',
          'Aplicação conforme critérios de elegibilidade da apólice.',
          'Possibilidade de complementar proteção com outras coberturas.'
        ]
      },
      {
        title: 'Roubo e furto qualificado',
        icon: '🔒',
        tone: 'safety',
        items: [
          'Proteção para bens conforme itens e limites da cobertura escolhida.',
          'Regras de comprovação e documentação no processo de sinistro.',
          'Condições específicas descritas no produto oficial.'
        ]
      },
      {
        title: 'Responsabilidade civil familiar',
        icon: '🤝',
        tone: 'trust',
        items: [
          'Cobertura para danos involuntários a terceiros nos termos da apólice.',
          'Apoio para mitigar impacto financeiro em situações cobertas.',
          'Limites de indenização definidos na contratação.'
        ]
      }
    ],
    coverages: [
      'Coberturas para riscos previstos nas condições do produto.',
      'Assistências residenciais e serviços adicionais conforme plano.',
      'Condições e limites definidos pela seguradora.'
    ],
    whoItsFor: [
      'Proprietários e moradores que querem proteção do imóvel.',
      'Clientes que buscam solução residencial de entrada com boa relação custo-benefício.',
      'Pessoas que preferem contratação digital com apoio humano.'
    ],
    hiringSteps: [
      'Levantamento inicial do tipo de imóvel.',
      'Orientação sobre cobertura e limite.',
      'Encaminhamento ao link oficial de contratação.',
      'Acompanhamento para conclusão da proposta.'
    ],
    assistanceServices: [
      'Chaveiro emergencial conforme condições do plano.',
      'Eletricista e encanador para eventos cobertos no pacote de assistência.',
      'Serviços emergenciais domiciliares segundo disponibilidade regional.',
      'Suporte 24h conforme regras da assistência residencial contratada.'
    ],
    residentialValueCards: [
      {
        icon: 'shield',
        title: 'Proteção e amparo',
        description:
          'Coberturas para incêndio, danos elétricos, roubo, responsabilidade civil e outros imprevistos previstos na apólice.'
      },
      {
        icon: 'tools',
        title: 'Serviços para sua comodidade',
        description:
          'Assistências para o dia a dia, como encanador, eletricista, chaveiro e reparos em eletrodomésticos, conforme o plano contratado.'
      },
      {
        icon: 'star',
        title: 'Benefícios pensando em você',
        description:
          'Atendimento consultivo da H Soares, contratação digital com a seguradora e orientação para escolher a composição certa para o imóvel.'
      }
    ],
    residentialProfiles: [
      {
        icon: 'home',
        title: 'Casa habitual',
        description:
          'Coberturas essenciais e serviços emergenciais para quem quer proteger o lar principal com apoio consultivo.'
      },
      {
        icon: 'building',
        title: 'Apartamento',
        description:
          'Amparos ajustados para rotina em condomínio, com proteção da unidade e suporte para ocorrências do dia a dia.'
      },
      {
        icon: 'key',
        title: 'Imóvel alugado',
        description:
          'Solução para proprietários e inquilinos que precisam de proteção patrimonial com contratação simples e rápida.'
      },
      {
        icon: 'sun',
        title: 'Casa de temporada',
        description:
          'Opção para imóveis de uso eventual, ajudando a reduzir o impacto financeiro de imprevistos fora da rotina.'
      }
    ],
    servicesCarouselTitle: 'Por que contratar o Seguro Residencial da Porto Seguro',
    servicesCarouselSubtitle:
      'Além das coberturas residenciais, oferecemos serviços gratuitos de encanador, eletricista, chaveiro, entre outros.',
    servicesCarousel: [
      {
        title: 'Encanador',
        description: 'Reparo em torneiras, registros ou descargas vazando.',
        image: '/assets/residencial/encanador.webp'
      },
      {
        title: 'Eletricista',
        description: 'Conserto de chuveiro, troca de lâmpada, resistência queimada e outros.',
        image: '/assets/residencial/eletricista.webp'
      },
      {
        title: 'Chaveiro',
        description: 'Você não precisa ficar pra fora de casa se perder ou quebrar as chaves.',
        image: '/assets/residencial/chaveiro.webp'
      },
      {
        title: 'Reparo em eletrodomésticos',
        description: 'Mão de obra para conserto de eletrodomésticos, como geladeira, fogão, lava e seca.',
        image: '/assets/residencial/eletrodomesticos.webp'
      }
    ],
    assistanceGallery: [
      {
        url: 'https://www.portoseguro.com.br/NovoInstitucional/static_files/images/capas/Desktop/porto-seguro-residencia-habitual-bg-header-1920x505.jpg',
        alt: 'Seguro Residencial Porto - imagem institucional'
      },
      {
        url: 'https://www.portoseguro.com.br/NovoInstitucional/static_files/images/produto-relacionado/pdc-banner-whats.jpg',
        alt: 'Atendimento e suporte via canais digitais'
      },
      {
        url: 'https://www.portoseguro.com.br/NovoInstitucional/static_files/images/Residencia/Rectangle.png',
        alt: 'Proteção e tranquilidade residencial'
      }
    ],
    faqs: [
      { q: 'Atende apartamento e casa?', a: 'Sim, conforme elegibilidade e regras do produto no momento da contratação.' },
      { q: 'Precisa vistoria prévia?', a: 'Depende da política vigente para o perfil do imóvel.' },
      { q: 'Posso incluir assistências?', a: 'Há opções conforme o pacote contratado no fluxo oficial.' },
      { q: 'A contratação é rápida?', a: 'Sim, a jornada é digital e orientada para simplificar o processo.' }
    ],
    portoUrl: getPrimaryPortoDestinationByProductSlug('residencial-essencial'),
    status: 'ativo'
  },
  {
    slug: 'seguro-auto',
    name: 'Seguro Auto',
    category: 'Auto',
    shortDescription: 'Seguro auto com orientação consultiva, leitura clara de cobertura e cotação mais organizada.',
    longDescription:
      'Com o Seguro Auto, você protege seu veículo com cobertura adequada ao seu perfil de uso. A H Soares atua no equilíbrio entre proteção e preço para aumentar clareza na escolha e reduzir indecisão na contratação.',
    heroImage:
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1800&q=80',
    overview: [
      'Análise de cobertura para definir o que realmente faz sentido para o seu perfil.',
      'Direcionamento para contratação oficial com rastreio de origem.',
      'Apoio da corretora desde a cotação até a contratação.'
    ],
    coverages: [
      'Cobertura para eventos contratados conforme condições de apólice.',
      'Possibilidade de incluir proteção para terceiros e assistências.',
      'Limites, franquias e regras conforme produto selecionado.'
    ],
    whoItsFor: [
      'Motoristas particulares e profissionais conforme aceitação da seguradora.',
      'Clientes em renovação ou primeira contratação de seguro auto.',
      'Quem busca atendimento humano com resposta rápida.'
    ],
    hiringSteps: [
      'Entendimento de perfil do condutor e veículo.',
      'Definição da melhor estratégia de contratação.',
      'Redirecionamento para o link oficial Porto.',
      'Acompanhamento para conclusão e suporte.'
    ],
    faqs: [
      { q: 'Seguro mais barato é sempre melhor?', a: 'Nem sempre. O ideal é avaliar cobertura, franquia e assistência junto do preço.' },
      { q: 'Posso incluir condutores adicionais?', a: 'Sim, conforme regras do produto e perfil informado.' },
      { q: 'A contratação final é no portal da Porto?', a: 'Sim. A finalização é no ambiente oficial com seu link exclusivo.' },
      { q: 'A H Soares acompanha depois da contratação?', a: 'Sim, continuamos no suporte consultivo.' }
    ],
    portoUrl: getPrimaryPortoDestinationByProductSlug('seguro-auto'),
    status: 'ativo'
  },
  {
    slug: 'seguro-celular',
    name: 'Seguro Celular',
    category: 'Equipamentos',
    seoTitle: 'Seguro Celular Porto para iPhone e Smartphones | Cotação Online',
    seoDescription:
      'Entenda cobertura para roubo, quebra acidental e furto simples no Seguro Celular Porto. Cotação online com apoio da H Soares para escolher o plano certo.',
    seoImage: '/assets/blog/seguro-celular-hero-177.webp',
    keywords: [
      'seguro celular porto',
      'seguro para iphone',
      'seguro celular',
      'seguro celular porto seguro',
      'seguro para smartphone'
    ],
    shortDescription:
      'Seguro Celular Porto para iPhone e smartphones premium, com contratação digital, até 12x sem juros e apoio da H Soares para escolher a cobertura certa.',
    longDescription:
      'Se um imprevisto com o seu celular pesaria no bolso e bagunçaria sua rotina, o Seguro Celular da Porto pode fazer muito sentido. A H Soares ajuda você a entender cobertura, elegibilidade e o melhor próximo passo antes da contratação oficial.',
    heroImage:
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1800&q=80',
    highlights: [
      'Foco atual no Seguro Celular da Porto',
      'Cobertura conforme o risco que mais preocupa',
      'Contratação digital com verificação do aparelho',
      'Apoio consultivo para contratar com mais segurança'
    ],
    overview: [
      'Coberturas organizadas para diferentes perfis de risco, do roubo à proteção mais completa.',
      'Fluxo digital com pagamento, verificação do aparelho e emissão da apólice no ambiente oficial.',
      'Apoio consultivo da H Soares para entender melhor o que faz sentido antes de contratar.'
    ],
    coverages: [
      'A leitura da cobertura depende do plano escolhido, com opções que podem incluir roubo, quebra acidental e furto simples.',
      'Elegibilidade do aparelho conforme marca, modelo, tempo de uso e verificação no processo oficial.',
      'Regras de acionamento, franquia, análise e indenização conforme apólice da seguradora.'
    ],
    whoItsFor: [
      'Usuários com smartphone de alto valor ou custo alto de reposição.',
      'Profissionais que dependem do celular para banco, autenticação, atendimento e faturamento.',
      'Clientes que querem evitar um prejuízo grande em caso de roubo, quebra ou furto simples.'
    ],
    hiringSteps: [
      'Escolha do aparelho, plano e leitura das coberturas com apoio da H Soares se desejar.',
      'Pagamento e verificação do celular no app da Porto durante a contratação oficial.',
      'Análise da proposta pela seguradora e emissão da apólice quando aprovada.',
      'Acompanhamento da H Soares em dúvidas antes, durante e depois da jornada.'
    ],
    faqs: [
      {
        q: 'Quais coberturas o Seguro Celular Porto pode oferecer?',
        a: 'A Porto organiza o produto em leituras que podem envolver roubo, quebra acidental e furto simples, conforme o plano e o aparelho elegível no fluxo oficial.'
      },
      {
        q: 'Posso contratar para aparelho usado?',
        a: 'Sim, desde que o aparelho atenda à regra de elegibilidade vigente da Porto no momento da contratação.'
      },
      {
        q: 'Quando o seguro passa a valer?',
        a: 'Após a análise e emissão da apólice, a Porto informa vigência de 365 dias sem carência.'
      },
      {
        q: 'É obrigatório preencher no site da H Soares?',
        a: 'Não. Você pode falar com a H Soares para orientação ou seguir direto para a contratação oficial da Porto.'
      }
    ],
    conversionTitle: 'Quer cotar o Seguro Celular Porto e sair com a cobertura certa?',
    conversionDescription:
      'Deixe seu nome e WhatsApp se quiser uma orientação rápida da H Soares antes de contratar. Se já decidiu, siga direto para a cotação oficial da Porto.',
    conversionPrimaryLabel: 'Quero ajuda para cotar',
    conversionSecondaryLabel: 'Ir direto para a cotação',
    portoUrl: getPrimaryPortoDestinationByProductSlug('seguro-celular'),
    status: 'ativo'
  },
  {
    slug: 'seguro-vida-on',
    name: 'Seguro de Vida ON',
    category: 'Vida',
    seoTitle: 'Seguro de Vida Individual e Familiar | Cotação Online | H Soares',
    seoDescription:
      'Faça uma cotação de Seguro de Vida com foco em proteção financeira, renda familiar e apoio consultivo para escolher coberturas mais adequadas ao seu perfil.',
    seoImage: '/assets/logo-hsoares-transparent.png',
    keywords: [
      'seguro de vida',
      'seguro de vida individual',
      'seguro de vida familiar',
      'cotacao seguro de vida',
      'seguro de vida online'
    ],
    shortDescription: 'Seguro de Vida com proteção financeira pessoal e familiar, contratação digital e apoio consultivo.',
    longDescription:
      'O Seguro de Vida ajuda a proteger renda, dependentes e planejamento familiar em cenários previstos na apólice. A H Soares organiza a decisão com linguagem clara, comparação orientada e suporte consultivo antes da contratação.',
    heroImage:
      'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1800&q=80',
    overview: [
      'Solução de proteção de renda e suporte financeiro familiar.',
      'Jornada de contratação digital com foco em agilidade.',
      'Apoio consultivo para explicar o valor real da proteção.'
    ],
    coverages: [
      'Coberturas de vida conforme condições do produto escolhido.',
      'Limites e critérios de aceitação definidos pela seguradora.',
      'Condições de contratação e vigência no fluxo oficial.'
    ],
    whoItsFor: [
      'Pessoas que desejam proteger dependentes financeiramente.',
      'Profissionais autônomos e assalariados que querem previsibilidade de proteção.',
      'Clientes com foco em planejamento de longo prazo.'
    ],
    hiringSteps: [
      'Entendimento do perfil e objetivo de proteção.',
      'Direcionamento para o formato mais aderente.',
      'Encaminhamento para finalização no link oficial.',
      'Acompanhamento da jornada.'
    ],
    faqs: [
      { q: 'É diferente de plano de saúde?', a: 'Sim. Seguro de vida protege financeiramente em eventos previstos na apólice.' },
      { q: 'Posso contratar 100% online?', a: 'Sim, dentro do fluxo digital da seguradora.' },
      { q: 'Existe análise de aceitação?', a: 'Sim, conforme critérios da seguradora para perfil e regras vigentes.' },
      { q: 'A contratação final é no ambiente oficial?', a: 'Sim. Você será direcionado para o link oficial da Porto para concluir.' }
    ],
    portoUrl: getPrimaryPortoDestinationByProductSlug('seguro-vida-on'),
    status: 'ativo'
  },
  {
    slug: 'seguro-foto-video',
    name: 'Seguro Foto e Vídeo',
    category: 'Equipamentos',
    shortDescription: 'Proteção para equipamentos de captura de imagem e produção audiovisual.',
    longDescription:
      'Seguro para quem trabalha com imagem e depende da disponibilidade dos equipamentos. A H Soares apresenta o produto com clareza para profissionais e criadores que não podem parar.',
    heroImage:
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1800&q=80',
    overview: [
      'Foco na continuidade operacional de profissionais de imagem.',
      'Proteção para equipamentos elegíveis dentro das regras da seguradora.',
      'Jornada digital e suporte consultivo para contratação.'
    ],
    coverages: [
      'Coberturas conforme condições do plano selecionado.',
      'Elegibilidade e documentação de equipamentos conforme regras vigentes.',
      'Franquias e limites estabelecidos no produto oficial.'
    ],
    whoItsFor: [
      'Fotógrafos e videomakers profissionais.',
      'Criadores de conteúdo com ativos de alto valor.',
      'Empresas que dependem de operação audiovisual.'
    ],
    hiringSteps: [
      'Levantamento básico dos equipamentos e objetivo.',
      'Ajuste de cobertura e posicionamento do produto.',
      'Direcionamento para contratação no link oficial.',
      'Acompanhamento até conclusão.'
    ],
    faqs: [
      { q: 'É indicado para uso profissional?', a: 'Sim, conforme regras de aceitação da seguradora no fluxo oficial.' },
      { q: 'Posso incluir mais de um item?', a: 'A possibilidade depende das opções disponíveis no momento da contratação.' },
      { q: 'A contratação é no site da Porto?', a: 'Sim. A finalização acontece no ambiente oficial.' },
      { q: 'A H Soares acompanha a contratação?', a: 'Sim. Nossa equipe acompanha a jornada para reduzir dúvidas antes da conclusão.' }
    ],
    portoUrl: getPrimaryPortoDestinationByProductSlug('seguro-foto-video'),
    status: 'ativo'
  },
  {
    slug: 'seguro-notebook-tablet',
    name: 'Seguro Notebook e Tablet',
    category: 'Equipamentos',
    shortDescription: 'Proteção para dispositivos de trabalho e estudo com contratação digital.',
    longDescription:
      'Seguro voltado para clientes que utilizam notebook e tablet como ativos essenciais. A proposta é proteger continuidade de rotina e produtividade com jornada de contratação objetiva.',
    heroImage:
      'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1800&q=80',
    overview: [
      'Proteção para equipamentos elegíveis e de alto uso.',
      'Jornada de contratação digital com suporte da corretora.',
      'Foco em evitar prejuízos por interrupção de trabalho/estudo.'
    ],
    coverages: [
      'Coberturas conforme regras do plano contratado.',
      'Condições de elegibilidade e aceitação por item.',
      'Limites e franquias estabelecidos em apólice.'
    ],
    whoItsFor: [
      'Profissionais remotos e estudantes.',
      'Empreendedores que dependem de mobilidade digital.',
      'Usuários com equipamentos de valor relevante.'
    ],
    hiringSteps: [
      'Levantamento de perfil e tipo de uso.',
      'Orientação para escolher o caminho mais assertivo.',
      'Redirecionamento para o link oficial da Porto.',
      'Suporte da H Soares na etapa final.'
    ],
    faqs: [
      { q: 'Posso contratar para notebook usado?', a: 'Depende da elegibilidade e regras em vigor no fluxo oficial.' },
      { q: 'Posso contratar para empresa?', a: 'Pode haver opções conforme perfil e critérios de aceitação.' },
      { q: 'A cobertura começa imediatamente?', a: 'A vigência depende da confirmação da proposta pela seguradora.' },
      { q: 'Posso falar com a H Soares antes de concluir?', a: 'Sim. Nossa equipe pode orientar você antes da finalização.' }
    ],
    portoUrl: getPrimaryPortoDestinationByProductSlug('seguro-notebook-tablet'),
    status: 'ativo'
  },
  {
    slug: 'seguro-smart-games',
    name: 'Seguro Smart e Games',
    category: 'Equipamentos',
    shortDescription: 'Proteção para itens de tecnologia e universo gamer.',
    longDescription:
      'Produto voltado para clientes que investem em equipamentos smart e games. A página reforça valor de proteção do ativo e facilidade de contratação com suporte consultivo.',
    heroImage:
      'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1800&q=80',
    overview: [
      'Proteção para dispositivos elegíveis do universo smart e games.',
      'Fluxo de contratação digital e orientado à simplicidade.',
      'Apoio consultivo para acelerar a decisão.'
    ],
    coverages: [
      'Coberturas disponíveis conforme condições do produto.',
      'Elegibilidade por tipo de dispositivo e estado do item.',
      'Limites, franquias e regras definidos pela seguradora.'
    ],
    whoItsFor: [
      'Gamers com equipamentos de alto valor.',
      'Usuários de dispositivos smart no dia a dia.',
      'Clientes que querem reduzir risco financeiro com tecnologia.'
    ],
    hiringSteps: [
      'Apoio inicial para entendimento do produto.',
      'Direcionamento para contratação no link oficial.',
      'Preenchimento no ambiente da seguradora.',
      'Acompanhamento para conclusão.'
    ],
    faqs: [
      { q: 'Quais itens entram?', a: 'A lista exata depende das regras vigentes apresentadas no fluxo oficial.' },
      { q: 'Serve para uso pessoal e profissional?', a: 'Depende da modalidade e critérios de aceitação da seguradora.' },
      { q: 'É possível contratar rápido?', a: 'Sim, a jornada foi desenhada para ser objetiva.' },
      { q: 'A contratação final é na Porto?', a: 'Sim, a finalização ocorre no ambiente oficial da seguradora.' }
    ],
    portoUrl: getPrimaryPortoDestinationByProductSlug('seguro-smart-games'),
    status: 'ativo'
  },
  {
    slug: 'seguro-viagem',
    name: 'Seguro Viagem',
    category: 'Viagem',
    seoTitle: 'Seguro Viagem Nacional e Internacional | Cotação Online | H Soares',
    seoDescription:
      'Cotação de Seguro Viagem nacional e internacional com cobertura para despesas médicas, bagagem, cancelamento e outros imprevistos conforme o plano contratado.',
    seoImage: '/images/seguro-viagem/og-seguro-viagem.jpg',
    keywords: [
      'seguro viagem',
      'seguro viagem internacional',
      'seguro viagem nacional',
      'cotacao seguro viagem',
      'seguro viagem europa'
    ],
    shortDescription: 'Proteção para imprevistos em viagens nacionais e internacionais.',
    longDescription:
      'O Seguro Viagem oferece suporte em situações críticas durante o deslocamento. A H Soares ajuda você a entender a cobertura e seguir com mais segurança para a contratação no link oficial.',
    heroImage:
      'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1800&q=80',
    overview: [
      'Proteção para viajantes em cenários previstos no plano.',
      'Contratação digital com foco em agilidade pré-embarque.',
      'Orientação da corretora para escolha assertiva de cobertura.'
    ],
    coverages: [
      'Coberturas e assistências conforme condições do produto contratado.',
      'Regras específicas por destino, período e perfil da viagem.',
      'Limites e critérios definidos pela seguradora no fluxo oficial.'
    ],
    whoItsFor: [
      'Viajantes de lazer ou negócios.',
      'Quem precisa cumprir exigências de proteção em alguns destinos.',
      'Clientes que buscam tranquilidade durante a viagem.'
    ],
    hiringSteps: [
      'Análise rápida da viagem e necessidades do passageiro.',
      'Orientação sobre a melhor rota de contratação.',
      'Redirecionamento para link oficial da Porto.',
      'Suporte no processo até conclusão.'
    ],
    faqs: [
      { q: 'Posso contratar perto da data da viagem?', a: 'Em muitos casos sim, mas recomendamos antecedência para evitar indisponibilidade.' },
      { q: 'Vale para viagem internacional?', a: 'Sim, conforme plano escolhido e regras do produto disponível.' },
      { q: 'A contratação é finalizada no site da Porto?', a: 'Sim. O fluxo final ocorre no ambiente oficial.' },
      { q: 'Posso contratar para várias viagens?', a: 'Depende do tipo de produto e das regras disponíveis no fluxo oficial.' }
    ],
    portoUrl: getPrimaryPortoDestinationByProductSlug('seguro-viagem'),
    status: 'ativo'
  }
];

export function getProductBySlug(slug) {
  return products.find((product) => product.slug === slug);
}
