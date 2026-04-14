function normalizeText(value) {
  return String(value || '').trim();
}

function estimateTime(whereToDo = '') {
  return (
    {
      VSCode: 20,
      'Google Ads': 10,
      'Search Console': 12,
      Analytics: 8,
      Resultados: 5,
      CRM: 10,
      Painel: 5
    }[normalizeText(whereToDo)] || 10
  );
}

function sameDay(value, reference = new Date()) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth() &&
    date.getDate() === reference.getDate()
  );
}

function withinHours(value, hours) {
  if (!value) return false;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return false;
  return Date.now() - parsed <= hours * 60 * 60 * 1000;
}

function taskLeads(task) {
  const snapshotLeads = task?.performanceSnapshot?.before?.leads;
  if (snapshotLeads != null) return Number(snapshotLeads || 0);

  const leadMeta = (task?.raw?.metadata || []).find((item) => /lead/i.test(String(item || '')));
  if (!leadMeta) return null;

  const match = String(leadMeta).match(/(\d+)/);
  return match ? Number(match[1]) : null;
}

function taskVisits(task) {
  const snapshotVisits = task?.performanceSnapshot?.before?.visits;
  if (snapshotVisits != null) return Number(snapshotVisits || 0);

  const visitMeta = (task?.raw?.metadata || []).find((item) => /visita/i.test(String(item || '')));
  if (!visitMeta) return null;

  const match = String(visitMeta).match(/(\d+)/);
  return match ? Number(match[1]) : null;
}

function hasZeroLeadSignal(task) {
  const targetType = normalizeText(task?.targetType).toLowerCase();
  const leads = taskLeads(task);
  const visits = taskVisits(task);
  const text = [task?.title, task?.reason, task?.recommendation].map(normalizeText).join(' ').toLowerCase();

  return (
    ['page', 'content'].includes(targetType) &&
    ((leads === 0 && (visits == null || visits >= 50)) ||
      text.includes('zero lead') ||
      text.includes('sem convers') ||
      text.includes('desperdiçando tráfego'))
  );
}

function isScaleSignal(task) {
  const targetType = normalizeText(task?.targetType).toLowerCase();
  const text = [task?.title, task?.reason, task?.recommendation].map(normalizeText).join(' ').toLowerCase();

  return (
    ['page', 'product'].includes(targetType) &&
    (normalizeText(task?.actionType) === 'escalar' ||
      text.includes('escala') ||
      text.includes('aumentar tráfego') ||
      text.includes('receber mais tráfego'))
  );
}

function buildTaskAction(task, extra = {}) {
  return {
    id: task.id,
    title: task.title,
    target: task.targetLabel,
    reason: task.reason,
    whereToDo: task.whereToDo,
    steps: (task.guideSteps || []).slice(0, 3),
    estimatedTimeMin: estimateTime(task.whereToDo),
    expectedImpact: task.expectedImpact,
    cta: 'Executar agora',
    href: task.guideHref || task.href || '',
    contextHref: task.contextHref || task.href || '',
    guideKind: task.guideKind || 'internal',
    score: Number(task?.priorityScore?.finalScore || 55) + Number(extra.scoreBoost || 0),
    actionType: task.actionType,
    sourceKind: extra.sourceKind || 'task'
  };
}

function buildWaitingReviewAction(task) {
  const dueNow = !task?.resultDueAt || Date.parse(task.resultDueAt) <= Date.now();
  return {
    id: `review-${task.id}`,
    title: `Revisar resultado de ${task.targetLabel}`,
    target: task.targetLabel,
    reason: dueNow
      ? 'A releitura já pode ser feita e vai definir o próximo passo.'
      : 'Essa ação já entrou em análise e merece atenção assim que a janela fechar.',
    whereToDo: 'Resultados',
    steps: [
      'Abrir a tela de Resultados.',
      'Ler o before/after da ação.',
      'Decidir se mantém, reabre ou escala.'
    ],
    estimatedTimeMin: 5,
    expectedImpact: 'Decidir rapidamente se mantém, reabre ou ajusta a próxima rodada.',
    cta: 'Executar agora',
    href: '/dashboard/results',
    contextHref: task.contextHref || task.href || '/dashboard/results',
    guideKind: 'internal',
    score: dueNow ? 92 : 64,
    actionType: 'medir',
    sourceKind: 'waiting_result'
  };
}

function buildOutcomeAction(item) {
  const score = item.result === 'negative' ? 84 : item.result === 'neutral' ? 68 : 58;

  return {
    id: `outcome-${item.taskId}`,
    title: `Decidir próxima rodada de ${item.targetLabel}`,
    target: item.targetLabel,
    reason: item.summary,
    whereToDo: 'Resultados',
    steps: [
      'Abrir a tela de Resultados.',
      'Ler a conclusão do sistema.',
      'Decidir se reabre, mantém ou move para radar.'
    ],
    estimatedTimeMin: 5,
    expectedImpact: item.nextRecommendation || 'Evitar que o próximo passo fique indefinido.',
    cta: 'Executar agora',
    href: item.contextHref || item.href || '/dashboard/results',
    contextHref: item.contextHref || item.href || '/dashboard/results',
    guideKind: 'internal',
    score,
    actionType: 'validar',
    sourceKind: 'result'
  };
}

function buildAutomationReviewAction(event) {
  return {
    id: `automation-${event.id}`,
    title: 'Conferir o que o sistema já preparou',
    target: 'Automações',
    reason: event.message || 'O sistema já executou parte da operação e vale confirmar o contexto antes da próxima ação.',
    whereToDo: 'Painel',
    steps: [
      'Abrir a tela de Automações.',
      'Confirmar o que entrou ou saiu da fila.',
      'Seguir para a próxima ação do dia.'
    ],
    estimatedTimeMin: 5,
    expectedImpact: 'Entrar no dia já com o contexto certo e sem retrabalho.',
    cta: 'Executar agora',
    href: '/dashboard/automations',
    contextHref: '/dashboard/today',
    guideKind: 'internal',
    score: 52,
    actionType: 'validar',
    sourceKind: 'automation'
  };
}

export function generateDailyFocus(snapshot = {}) {
  const activeTasks = [...(snapshot.queueItems || []), ...(snapshot.inProgressItems || [])];
  const zeroLeadTask = activeTasks.find(hasZeroLeadSignal);
  const scaleTask = activeTasks.find(isScaleSignal);
  const waitingCount = Number(snapshot.waitingResultItems?.length || 0);

  if (zeroLeadTask) {
    return {
      title: `Corrigir conversão da página ${zeroLeadTask.targetLabel} antes de aumentar tráfego`,
      targetLabel: zeroLeadTask.targetLabel,
      reason: 'Ela já recebe atenção, mas ainda não transforma isso em oportunidade real.',
      expectedImpact: 'Destravar conversão antes de mandar mais volume para a mesma página.'
    };
  }

  if (scaleTask) {
    return {
      title: `Escalar ${scaleTask.targetLabel} com controle para aumentar volume`,
      targetLabel: scaleTask.targetLabel,
      reason: 'Esse alvo já mostrou resposta suficiente para receber mais distribuição sem perder o controle.',
      expectedImpact: 'Ganhar mais leads em cima do que já mostra sinal comercial.'
    };
  }

  if (waitingCount >= 3) {
    return {
      title: 'Validar resultados antes de tomar novas decisões',
      targetLabel: 'Resultados',
      reason: 'Há várias ações em análise e o próximo passo depende do que já voltou.',
      expectedImpact: 'Evitar novas mudanças sem ler o efeito do que já foi executado.'
    };
  }

  if (Number(snapshot.pendingTrafficConstraint || 0) > 0) {
    return {
      title: 'Aumentar distribuição para gerar volume de entrada',
      targetLabel: 'Aquisição',
      reason: 'Os sinais atuais mostram mais falta de entrada do que gargalo de execução.',
      expectedImpact: 'Gerar mais volume para as páginas que já podem responder.'
    };
  }

  return {
    title: 'Otimizar conversão das principais páginas',
    targetLabel: 'Páginas principais',
    reason: 'Ainda é o caminho mais seguro para destravar resultado sem dispersar a operação.',
    expectedImpact: 'Melhorar o retorno do tráfego que já existe.'
  };
}

export function generateDailyActions(tasks = {}, results = {}, automations = []) {
  const pendingItems = Array.isArray(tasks?.pendingItems) ? tasks.pendingItems : [];
  const inProgressItems = Array.isArray(tasks?.inProgressItems) ? tasks.inProgressItems : [];
  const waitingResultItems = Array.isArray(tasks?.waitingResultItems) ? tasks.waitingResultItems : [];
  const resultItems = Array.isArray(results?.items) ? results.items : [];
  const systemEvents = Array.isArray(automations) ? automations : [];

  const candidates = [
    ...pendingItems
      .filter((task) => normalizeText(task?.priority) !== 'baixa')
      .map((task) => buildTaskAction(task)),
    ...inProgressItems.map((task) => buildTaskAction(task, { scoreBoost: task.isStalled ? 12 : 8 })),
    ...waitingResultItems.map(buildWaitingReviewAction),
    ...resultItems
      .filter((item) => ['negative', 'neutral'].includes(normalizeText(item?.result)))
      .map(buildOutcomeAction),
    ...systemEvents.slice(0, 2).map(buildAutomationReviewAction)
  ].sort((left, right) => right.score - left.score);

  const selected = [];
  const usedTargets = new Set();

  for (const candidate of candidates) {
    const targetKey = normalizeText(candidate.target).toLowerCase() || candidate.id;
    if (usedTargets.has(targetKey)) continue;
    selected.push(candidate);
    usedTargets.add(targetKey);
    if (selected.length === 3) break;
  }

  if (selected.length < 3) {
    for (const candidate of candidates) {
      if (selected.some((item) => item.id === candidate.id)) continue;
      selected.push(candidate);
      if (selected.length === 3) break;
    }
  }

  while (selected.length < 3) {
    selected.push({
      id: `fallback-${selected.length + 1}`,
      title: selected.length === 0 ? 'Abrir a fila principal' : selected.length === 1 ? 'Revisar resultados recentes' : 'Confirmar o que o sistema já fez',
      target: selected.length === 0 ? 'Fazer Agora' : selected.length === 1 ? 'Resultados' : 'Hoje',
      reason:
        selected.length === 0
          ? 'Se a fila estiver curta, o melhor uso do tempo é executar o primeiro foco disponível.'
          : selected.length === 1
            ? 'Mesmo com pouca movimentação, vale confirmar se algo já mudou desde ontem.'
            : 'Quando o dia está leve, confirmar o que o sistema organizou evita perder contexto.',
      whereToDo: selected.length === 1 ? 'Resultados' : 'Painel',
      steps:
        selected.length === 1
          ? ['Abrir Resultados.', 'Ler os retornos mais recentes.', 'Definir a próxima rodada.']
          : ['Abrir a área indicada.', 'Confirmar o contexto atual.', 'Seguir para a próxima ação.'],
      estimatedTimeMin: 5,
      expectedImpact: 'Manter a direção do dia clara mesmo com menos itens ativos.',
      cta: 'Executar agora',
      href: selected.length === 1 ? '/dashboard/results' : '/dashboard/today',
      contextHref: selected.length === 1 ? '/dashboard/results' : '/dashboard/today',
      guideKind: 'internal',
      score: 40,
      actionType: 'validar',
      sourceKind: 'fallback'
    });
  }

  return selected.slice(0, 3).map((item) => ({
    id: item.id,
    title: item.title,
    target: item.target,
    reason: item.reason,
    whereToDo: item.whereToDo,
    steps: item.steps.slice(0, 3),
    estimatedTimeMin: item.estimatedTimeMin,
    expectedImpact: item.expectedImpact,
    cta: 'Executar agora',
    href: item.href,
    contextHref: item.contextHref,
    guideKind: item.guideKind || 'internal',
    actionType: item.actionType || 'corrigir'
  }));
}

export function generateRecentOutcomeSummary(results = {}) {
  const groups = {
    positive: (results?.improved || []).filter((item) => withinHours(item.completedAt, 36)),
    neutral: (results?.neutral || []).filter((item) => withinHours(item.completedAt, 36)),
    negative: (results?.worsened || []).filter((item) => withinHours(item.completedAt, 36)),
    waiting: (results?.waiting || []).filter((item) => withinHours(item.completedAt, 36))
  };

  const lines = [];

  if (groups.positive[0]) {
    lines.push(`${groups.positive[0].targetLabel} melhorou após a última ação.`);
  }

  if (groups.neutral[0]) {
    lines.push(`${groups.neutral[0].targetLabel} ainda não mudou o suficiente para virar decisão.`);
  }

  if (groups.negative[0]) {
    lines.push(`${groups.negative[0].targetLabel} ainda pede nova rodada porque o retorno foi fraco.`);
  }

  if (groups.waiting[0]) {
    lines.push(`${groups.waiting[0].targetLabel} ainda está em análise.`);
  }

  if (!lines.length) {
    lines.push('Ainda não houve retorno suficiente desde ontem para mudar o plano do dia.');
  }

  return {
    lines: lines.slice(0, 5),
    groups
  };
}

export function generateDailyClosure(tasks = {}, results = {}) {
  const completedToday = Array.isArray(tasks?.completedToday) ? tasks.completedToday.length : 0;
  const inProgressCount = Array.isArray(tasks?.inProgressItems) ? tasks.inProgressItems.length : 0;
  const waitingToday = Array.isArray(tasks?.waitingResultItems)
    ? tasks.waitingResultItems.filter((item) => sameDay(item.completedAt || item.waitingResultAt || item.actedAt || item.createdAt)).length
    : 0;
  const automationsToday = Array.isArray(results?.systemEvents)
    ? results.systemEvents.filter((item) => item.source !== 'manual' && sameDay(item.createdAt)).length
    : 0;
  const attentionCount = inProgressCount + (Array.isArray(tasks?.pendingItems) ? tasks.pendingItems.length : 0);

  return {
    headline:
      completedToday > 0
        ? `Hoje você executou ${completedToday} ação${completedToday > 1 ? 'ões' : ''}.`
        : 'Hoje a operação ainda está começando.',
    summary: `${waitingToday} entraram em análise. ${attentionCount} ainda precisam de atenção.`,
    stats: [
      { label: 'Concluídas hoje', value: completedToday },
      { label: 'Em andamento', value: inProgressCount },
      { label: 'Em análise', value: waitingToday },
      { label: 'Automações hoje', value: automationsToday }
    ]
  };
}

export function generateNextDayPreview(snapshot = {}) {
  const negative = (snapshot?.results?.worsened || [])[0] || null;
  const waiting = (snapshot?.waitingResultItems || [])[0] || null;
  const scale = [...(snapshot?.queueItems || []), ...(snapshot?.inProgressItems || [])].find(isScaleSignal) || null;
  const fallback = (snapshot?.queueItems || [])[0] || null;

  const lines = [];

  if (negative) {
    lines.push(`Amanhã foque em revisar ${negative.targetLabel} se o sinal continuar fraco.`);
  } else if (waiting) {
    lines.push(`Amanhã comece validando ${waiting.targetLabel} se a janela de leitura já tiver fechado.`);
  } else if (scale) {
    lines.push(`Amanhã ${scale.targetLabel} pode receber nova rodada de escala se mantiver resposta.`);
  } else if (fallback) {
    lines.push(`Amanhã a prioridade provável continua em ${fallback.targetLabel}.`);
  } else {
    lines.push('Amanhã o foco provável continua em otimizar conversão das principais páginas.');
  }

  if (normalizeText(snapshot?.engineStatus) === 'failed') {
    lines.push('Confirme logo cedo se o motor operacional voltou a rodar normalmente.');
  } else if (normalizeText(snapshot?.engineStatus) === 'delayed') {
    lines.push('Se o motor continuar atrasado, rode o ciclo manualmente antes de começar.');
  }

  return {
    headline: 'Preparação de amanhã',
    lines: lines.slice(0, 3)
  };
}
