export const integrationCatalog = [
  {
    key: 'lead-database',
    title: 'Banco de leads',
    eyebrow: 'Base operacional',
    subtitle: 'Fila comercial, follow-up e dono do lead',
    description:
      'Essa camada sustenta o coração comercial do admin: leads, responsáveis, follow-ups, perdas e oportunidades em aberto.',
    unlocks: ['Leads do dia', 'Fila atrasada', 'Dono por lead', 'Perda por motivo'],
    requiredEnv: ['DATABASE_URL']
  },
  {
    key: 'google-analytics',
    title: 'Google Analytics Data API',
    eyebrow: 'Leitura do site',
    subtitle: 'Tráfego, páginas quentes e comportamento',
    description:
      'É a base para o admin saber quais páginas puxam atenção, quais rotas estão mais fortes e onde existe comportamento relevante.',
    unlocks: ['Páginas mais acessadas', 'Usuários ativos', 'Sessões mais fortes', 'Leitura de tráfego por rota'],
    requiredEnv: ['GOOGLE_SERVICE_ACCOUNT_KEY', 'GA4_PROPERTY_ID']
  },
  {
    key: 'search-console',
    title: 'Google Search Console',
    eyebrow: 'Saúde de indexação',
    subtitle: 'Sitemaps, propriedade e leitura do Google',
    description:
      'Essa integração mostra se o Google consegue processar a base técnica do site e acelera o acompanhamento de indexação.',
    unlocks: ['Status dos sitemaps', 'Propriedade validada', 'Leitura técnica do Google', 'Prioridade de indexação'],
    requiredEnv: ['GOOGLE_SERVICE_ACCOUNT_KEY']
  },
  {
    key: 'meta-ads',
    title: 'Meta Ads',
    eyebrow: 'Custo de mídia',
    subtitle: 'Campanhas pagas para leitura de CPL e escala',
    description:
      'Quando entra Meta Ads, o copiloto deixa de só enxergar clique e lead e passa a estimar custo, desperdício e oportunidade real.',
    unlocks: ['CPL por campanha', 'Custo por produto', 'Escala ou pausa por custo', 'Comparação entre criativos'],
    requiredEnv: ['META_ADS_ACCESS_TOKEN', 'META_ADS_ACCOUNT_ID'],
    optionalEnv: ['META_PIXEL_ID']
  },
  {
    key: 'google-ads',
    title: 'Google Ads',
    eyebrow: 'Intenção de busca',
    subtitle: 'Busca paga, custo e retorno comercial',
    description:
      'Essa camada cruza intenção de busca com custo para mostrar onde o tráfego pago está vindo com mais chance de virar negócio.',
    unlocks: ['CPC por campanha', 'Lead por busca', 'Busca com retorno', 'Prioridade de verba em intenção alta'],
    requiredEnv: [
      'GOOGLE_ADS_DEVELOPER_TOKEN',
      'GOOGLE_ADS_CLIENT_ID',
      'GOOGLE_ADS_CLIENT_SECRET',
      'GOOGLE_ADS_REFRESH_TOKEN',
      'GOOGLE_ADS_CUSTOMER_ID'
    ],
    optionalEnv: ['GOOGLE_ADS_LOGIN_CUSTOMER_ID']
  },
  {
    key: 'whatsapp-crm',
    title: 'WhatsApp/CRM profundo',
    eyebrow: 'Fechamento real',
    subtitle: 'Tempo de resposta, conversa útil e venda',
    description:
      'É a camada que mostra se o lead virou atendimento útil, proposta e venda fechada. Sem ela, o copiloto ainda trabalha sem enxergar o ganho final.',
    unlocks: ['Tempo até primeiro contato', 'Lead que virou conversa', 'Lead que virou venda', 'Fila comercial com valor'],
    requiredEnv: [
      'WHATSAPP_ACCESS_TOKEN',
      'WHATSAPP_PHONE_NUMBER_ID',
      'WHATSAPP_BUSINESS_ACCOUNT_ID',
      'CRM_API_BASE_URL',
      'CRM_API_KEY'
    ]
  }
];

export const copilotoDeliverables = [
  'O que fazer primeiro para aumentar conversão no mesmo dia.',
  'Qual página ou campanha corrigir antes de comprar mais tráfego.',
  'Onde existe tração suficiente para escalar com mais segurança.',
  'Quando a operação deve vender melhor a base antes de investir mais.',
  'Quando a leitura já ficou madura para orientar verba em reais.'
];

export const implementationRoadmap = [
  {
    step: '1',
    title: 'Validar a base operacional e o Google',
    description:
      'Banco de leads, GA4 e Search Console precisam estar firmes, porque são a primeira leitura do que gera atenção, lead e indexação.'
  },
  {
    step: '2',
    title: 'Ligar custo de mídia',
    description:
      'Meta Ads e Google Ads entram para o admin deixar de só apontar direção e começar a orientar escala, pausa e desperdício.'
  },
  {
    step: '3',
    title: 'Fechar o ciclo comercial',
    description:
      'WhatsApp e CRM profundo entram por último para o copiloto sair de lead gerado e passar a orientar receita de verdade.'
  }
];

export const revenueStageCopy = {
  directional: {
    label: 'Direcional',
    description:
      'O admin já enxerga tráfego, leads e SEO, mas ainda não tem custo e fechamento suficientes para recomendar verba em reais.'
  },
  preparing: {
    label: 'Em preparação',
    description:
      'Parte das integrações de custo ou fechamento já está preparada, mas o copiloto ainda não pode assumir orçamento como decisão automática.'
  },
  financial: {
    label: 'Financeiro',
    description:
      'A base já enxerga custo, captação e fechamento em conjunto. Nessa fase, o admin pode orientar orçamento com muito mais segurança.'
  }
};

export function getIntegrationStatusLabel(status) {
  return (
    {
      connected: 'Conectado',
      ready: 'Pronto para ativar',
      partial: 'Parcial',
      pending: 'Pendente'
    }[status] || 'Pendente'
  );
}

export function getIntegrationTone(status) {
  return (
    {
      connected: 'success',
      ready: 'neutral',
      partial: 'warning',
      pending: 'warning'
    }[status] || 'warning'
  );
}

export function isIntegrationPrepared(status) {
  return status === 'connected' || status === 'ready';
}

export function isIntegrationOperational(status) {
  return status === 'connected';
}

export function getIntegrationBlueprint(key) {
  return integrationCatalog.find((item) => item.key === key) || null;
}

export function sortIntegrations(items = []) {
  const order = integrationCatalog.reduce((acc, item, index) => {
    acc[item.key] = index;
    return acc;
  }, {});

  return [...items].sort((a, b) => {
    const aIndex = order[a.key] ?? Number.MAX_SAFE_INTEGER;
    const bIndex = order[b.key] ?? Number.MAX_SAFE_INTEGER;
    return aIndex - bIndex;
  });
}
