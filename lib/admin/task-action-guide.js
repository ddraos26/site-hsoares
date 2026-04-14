const GOOGLE_ADS_URL = 'https://ads.google.com/';
const SEARCH_CONSOLE_URL = 'https://search.google.com/search-console';
const GA4_URL = 'https://analytics.google.com/';

function normalizeText(value) {
  return String(value || '').trim();
}

function buildTextBlob(task) {
  return [
    task?.title,
    task?.description,
    task?.recommendation,
    task?.sourceLabel,
    task?.productLabel,
    ...(Array.isArray(task?.metadata) ? task.metadata : [])
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function buildGuide({
  destination,
  destinationHref = '',
  destinationKind = destinationHref ? 'external' : 'manual',
  buttonLabel,
  helper,
  steps = [],
  primaryLabel
}) {
  return {
    destination,
    destinationHref,
    destinationKind,
    buttonLabel,
    helper,
    steps,
    primaryLabel: primaryLabel || 'Feito'
  };
}

export function buildTaskActionGuide(task) {
  const text = buildTextBlob(task);
  const href = normalizeText(task?.href);

  if (task?.sourceType === 'lead') {
    return buildGuide({
      destination: 'Leads',
      destinationHref: href,
      destinationKind: 'internal',
      buttonLabel: 'Abrir lead',
      helper: 'Abra o lead, responda e já deixe o próximo retorno marcado.',
      steps: ['Abrir o lead.', 'Falar com a pessoa.', 'Marcar o próximo passo.']
    });
  }

  if (task?.sourceType === 'approval') {
    return buildGuide({
      destination: 'Decisões',
      destinationHref: href || '/admin/aprovacoes',
      destinationKind: 'internal',
      buttonLabel: 'Abrir decisão',
      helper: 'Aqui você só decide se quer seguir ou não com a ideia.',
      steps: ['Abrir a decisão.', 'Ler a sugestão em linguagem simples.', 'Aprovar ou rejeitar.']
    });
  }

  if (
    text.includes('google ads') ||
    text.includes('campanha') ||
    text.includes('mídia') ||
    text.includes('midia') ||
    text.includes('remarketing') ||
    text.includes('tráfego') ||
    text.includes('trafego') ||
    text.includes('distribuição') ||
    text.includes('distribuicao') ||
    text.includes('verba')
  ) {
    return buildGuide({
      destination: 'Google Ads',
      destinationHref: GOOGLE_ADS_URL,
      buttonLabel: 'Abrir Google Ads',
      helper: 'Essa frente acontece direto no Google Ads.',
      steps: ['Abrir o Google Ads.', 'Entrar na campanha, grupo ou página de destino ligada a essa frente.', 'Ajustar a verba, prioridade ou distribuição indicada pelo admin.']
    });
  }

  if (text.includes('search console') || text.includes('seo') || text.includes('query') || text.includes('impress') || text.includes('ctr org')) {
    return buildGuide({
      destination: 'Search Console',
      destinationHref: SEARCH_CONSOLE_URL,
      buttonLabel: 'Abrir Search Console',
      helper: 'Essa frente acontece direto no Search Console.',
      steps: ['Abrir o Search Console.', 'Entrar na página ou query indicada.', 'Aplicar o ajuste sugerido pelo admin.']
    });
  }

  if (text.includes('ga4') || text.includes('analytics') || text.includes('utm') || text.includes('evento') || text.includes('sess')) {
    return buildGuide({
      destination: 'Google Analytics',
      destinationHref: GA4_URL,
      buttonLabel: 'Abrir Analytics',
      helper: 'Aqui o objetivo é validar tráfego, origem e comportamento.',
      steps: ['Abrir o Analytics.', 'Conferir a origem e a página indicada.', 'Validar se a leitura bate com o admin.']
    });
  }

  if (
    text.includes('copy') ||
    text.includes('cta') ||
    text.includes('headline') ||
    text.includes('hero') ||
    text.includes('site') ||
    text.includes('página') ||
    task?.sourceType === 'page-decision'
  ) {
    return buildGuide({
      destination: 'VSCode',
      destinationKind: 'manual',
      buttonLabel: 'Fazer no VSCode',
      helper: 'Essa mudança é manual para não bagunçar o visual do site.',
      steps: ['Abrir a página no contexto.', 'Fazer a alteração no VSCode.', 'Voltar ao admin e dizer se deu certo.']
    });
  }

  return buildGuide({
    destination: 'Contexto da tarefa',
    destinationHref: href,
    destinationKind: href ? 'internal' : 'manual',
    buttonLabel: href ? 'Abrir contexto' : 'Ver contexto',
    helper: 'Abra o contexto e siga o passo a passo curto da tarefa.',
    steps: ['Abrir a tarefa.', 'Executar o próximo passo.', 'Voltar e marcar o resultado.']
  });
}
