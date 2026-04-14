import 'server-only';

import { getAdminAiCockpitSnapshot } from '@/lib/admin/ai-control-center';
import {
  generateDailyActions,
  generateDailyClosure,
  generateDailyFocus,
  generateNextDayPreview,
  generateRecentOutcomeSummary
} from '@/lib/admin/daily-routine';
import { getAdminHistorySnapshot } from '@/lib/admin/history-overview';
import { readOperationalEngineEvents, readOperationalEngineState } from '@/lib/admin/operational-engine-store';
import { getAdminTasksSnapshot } from '@/lib/admin/tasks-overview';
import {
  TASK_STATUS,
  getTaskStatusLabel,
  normalizeTaskStatus
} from '@/lib/admin/task-status';
import { normalizePerformanceSnapshot } from '@/lib/admin/task-performance';

const PRIORITY_LABEL_MAP = {
  Urgente: 'urgente',
  Alta: 'alta',
  Média: 'media',
  Baixa: 'baixa'
};

const PRIORITY_VIEW_LABEL = {
  urgente: 'URGENTE',
  alta: 'ALTA',
  media: 'MÉDIA',
  baixa: 'BAIXA'
};

const AUTOMATION_RULES = [
  {
    id: 'auto-task-conversion-bottleneck',
    name: 'Criar tarefa quando houver gargalo de conversão',
    enabled: true,
    trigger: 'Página com tráfego relevante e zero lead no período',
    conditionDescription: 'Quando uma página já está recebendo atenção, mas não transforma isso em oportunidade real.',
    actionDescription: 'Gerar tarefa guiada de otimização em VSCode com headline, CTA e prova de valor acima da dobra.',
    mode: 'automatic'
  },
  {
    id: 'auto-scale-suggestion',
    name: 'Sugerir escala quando a página já converte',
    enabled: true,
    trigger: 'Página com boa taxa de lead e pouco volume',
    conditionDescription: 'Quando a página já provou sinal comercial, mas ainda recebe pouca distribuição.',
    actionDescription: 'Criar task guiada de escala em Google Ads para o humano executar com aumento controlado.',
    mode: 'automatic'
  },
  {
    id: 'auto-floating-cta',
    name: 'Ativar CTA flutuante automaticamente',
    enabled: true,
    trigger: 'Leitura relevante com conversão zerada em página ou blog',
    conditionDescription: 'Quando o conteúdo prende atenção, mas não puxa ação suficiente.',
    actionDescription: 'Ativar CTA flutuante de WhatsApp e registrar a execução no histórico automático.',
    mode: 'automatic'
  },
  {
    id: 'auto-move-weak-items',
    name: 'Mover itens fracos para o Radar',
    enabled: true,
    trigger: 'Item pendente antigo, com baixa prioridade e sinal fraco',
    conditionDescription: 'Quando não vale ocupar a fila principal com algo que pode esperar.',
    actionDescription: 'Tirar da visão Fazer Agora e estacionar em Radar com contexto preservado.',
    mode: 'automatic'
  },
  {
    id: 'auto-close-cycle',
    name: 'Encerrar ciclo após janela de medição',
    enabled: true,
    trigger: 'Ação concluída e já passou a janela de releitura',
    conditionDescription: 'Quando o sistema já pode olhar o before/after sem depender de leitura manual.',
    actionDescription: 'Registrar leitura curta de resultado: melhorou, piorou ou ficou neutro.',
    mode: 'automatic'
  },
  {
    id: 'auto-generate-result-feedback',
    name: 'Gerar feedback obrigatório de resultado',
    enabled: true,
    trigger: 'Toda ação operacional importante concluída',
    conditionDescription: 'Quando a execução já saiu da fila e precisa virar aprendizado operacional.',
    actionDescription: 'Criar comparação before/after com resumo curto e próxima recomendação.',
    mode: 'automatic'
  }
];

function normalizeText(value) {
  return String(value || '').trim();
}

function toSentenceCase(value) {
  const text = normalizeText(value);
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function buildPriorityLabel(priority) {
  const value = PRIORITY_LABEL_MAP[normalizeText(priority)] || 'media';
  return {
    value,
    label: PRIORITY_VIEW_LABEL[value]
  };
}

function priorityWeight(priority) {
  return (
    {
      urgente: 94,
      alta: 76,
      media: 54,
      baixa: 34
    }[buildPriorityLabel(priority).value] || 54
  );
}

function mapWhereToDo(destination, href = '', sourceType = '') {
  const value = normalizeText(destination).toLowerCase();
  const link = normalizeText(href).toLowerCase();
  const source = normalizeText(sourceType).toLowerCase();

  if (value.includes('google ads')) return 'Google Ads';
  if (value.includes('search console')) return 'Search Console';
  if (value.includes('analytics')) return 'Analytics';
  if (value.includes('vscode')) return 'VSCode';
  if (source === 'lead' || link.includes('/leads')) return 'CRM';

  return 'Painel';
}

function buildGuideSteps(whereToDo, item) {
  const target = normalizeText(item.targetLabel || item.productLabel || item.title);

  if (whereToDo === 'VSCode') {
    return [
      'Abrir a rota indicada.',
      'Localizar headline e CTA principal.',
      'Aplicar a sugestão sem alterar a estrutura geral.',
      'Salvar e revisar visualmente.',
      'Voltar ao admin e marcar como feito.'
    ];
  }

  if (whereToDo === 'Google Ads') {
    return [
      'Abrir a campanha ligada à página ou produto.',
      'Entrar no grupo ou anúncio correspondente.',
      'Ajustar orçamento ou distribuição.',
      'Salvar a alteração.',
      'Voltar ao admin e marcar como feito.'
    ];
  }

  if (whereToDo === 'Search Console') {
    return [
      'Abrir Search Console.',
      'Entrar na query ou URL indicada.',
      'Revisar impressões, CTR e posição.',
      'Aplicar o ajuste sugerido.',
      'Voltar ao admin e marcar como feito.'
    ];
  }

  if (whereToDo === 'Analytics') {
    return [
      'Abrir o Analytics da propriedade.',
      'Localizar a página, origem ou evento citado.',
      'Comparar o comportamento antes e depois da ação.',
      'Confirmar se o sinal melhorou ou travou.',
      'Voltar ao admin e registrar a leitura.'
    ];
  }

  if (whereToDo === 'CRM') {
    return [
      'Abrir o lead ou oportunidade indicada.',
      'Validar o último contato e o próximo retorno.',
      'Executar o contato ou distribuir o responsável.',
      'Registrar o próximo passo.',
      'Voltar ao admin e marcar como feito.'
    ];
  }

  return [
    `Abrir o contexto de ${target || 'execução'}.`,
    'Ler o motivo e a recomendação curta.',
    'Executar a ação ou aprovação pedida.',
    'Confirmar o que foi feito.',
    'Voltar ao admin e registrar o resultado.'
  ];
}

function inferCategory(item, whereToDo) {
  const source = normalizeText(item.sourceType).toLowerCase();
  const href = normalizeText(item.href).toLowerCase();

  if (source === 'lead' || whereToDo === 'CRM') return 'lead';
  if (whereToDo === 'Search Console' || source === 'seo') return 'seo';
  if (whereToDo === 'Google Ads' || source === 'campaign') return 'campanha';
  if (source.includes('page') || href.includes('/pages/')) return 'pagina';
  if (source.includes('product') || href.includes('/products/')) return 'produto';
  return 'operacao';
}

function inferActionType(item, whereToDo) {
  const text = [
    item.title,
    item.description,
    item.recommendation,
    item.note
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (item.requiresApproval) return 'aprovar';
  if (text.includes('escala') || text.includes('escalar') || text.includes('verba') || text.includes('distribui')) return 'escalar';
  if (text.includes('medir') || text.includes('resultado') || whereToDo === 'Analytics') return 'medir';
  if (text.includes('validar')) return 'validar';
  return 'corrigir';
}

function buildHeroActionLabel(task) {
  return (
    {
      aprovar: 'APROVAR',
      escalar: 'ESCALAR',
      medir: 'REVISAR',
      validar: 'REVISAR',
      corrigir: task.category === 'pagina' || task.category === 'produto' ? 'CORRIGIR' : 'OTIMIZAR'
    }[task.actionType] || 'REVISAR'
  );
}

function buildDailyHeroActionLabel(actionType = '') {
  return (
    {
      aprovar: 'APROVAR',
      escalar: 'ESCALAR',
      medir: 'REVISAR',
      validar: 'REVISAR',
      corrigir: 'CORRIGIR'
    }[normalizeText(actionType).toLowerCase()] || 'OTIMIZAR'
  );
}

function buildTargetLabel(item, category) {
  const explicit = normalizeText(item.targetLabel || item.productLabel);
  const title = normalizeText(item.title);

  if (explicit && !['Missão', 'Checklist automático', 'Mudança sensível'].includes(explicit)) {
    return explicit;
  }

  if (category === 'lead') {
    return title.replace(/^Responder\s+/i, '').replace(/^Definir responsável para\s+/i, '').trim() || 'Lead';
  }

  return explicit || title || 'Operação';
}

function buildExpectedImpact(item, category, actionType) {
  const recommendation = normalizeText(item.recommendation);

  if (category === 'lead') return 'Evitar que uma oportunidade já captada esfrie sem dono ou sem resposta.';
  if (actionType === 'aprovar') return 'Liberar a próxima execução sem perder o contexto nem travar a fila.';
  if (actionType === 'escalar') return 'Ganhar mais leads em cima de algo que já mostrou sinal suficiente.';
  if (category === 'seo') return 'Aumentar clique qualificado sem depender só de mídia paga.';
  if (category === 'pagina' || category === 'produto') return 'Parar de desperdiçar tráfego e melhorar a chance de conversão.';
  return recommendation || 'Fazer a operação andar com menos interpretação manual.';
}

function buildSuccessCriteria(category, actionType) {
  if (category === 'lead') return 'Lead respondido, responsável definido e próximo retorno agendado.';
  if (actionType === 'aprovar') return 'Decisão tomada e execução liberada sem dúvida pendente.';
  if (actionType === 'escalar') return 'Mais volume sem perda relevante de eficiência.';
  if (category === 'seo') return 'Mais CTR, melhor posição ou mais clique orgânico qualificado.';
  if (category === 'pagina' || category === 'produto') return 'Mais clique no CTA, mais leads ou menos desperdício de tráfego.';
  return 'Execução concluída, registrada e pronta para releitura.';
}

function buildRecheckHours(category, actionType) {
  if (category === 'lead') return 4;
  if (actionType === 'aprovar') return 12;
  if (category === 'campanha') return 24;
  if (category === 'seo') return 48;
  if (category === 'pagina' || category === 'produto') return 24;
  return 24;
}

function normalizeBadges(badges = [], item = {}) {
  const incoming = Array.isArray(badges) ? badges : [];
  const normalized = incoming
    .map((badge) => {
      if (typeof badge === 'string') {
        return {
          key: badge,
          label: badge,
          tone: 'premium'
        };
      }

      return {
        key: normalizeText(badge?.key),
        label: normalizeText(badge?.label),
        tone: normalizeText(badge?.tone) || 'premium'
      };
    })
    .filter((badge) => badge.key && badge.label);

  if (item.isAutomatic && !normalized.some((badge) => badge.key === 'automatic')) {
    normalized.unshift({
      key: 'automatic',
      label: 'Criada automaticamente',
      tone: 'success'
    });
  }

  return normalized;
}

function inferTargetType(item, category) {
  const explicit = normalizeText(item.targetType).toLowerCase();
  if (explicit) return explicit;

  if (category === 'pagina') return 'page';
  if (category === 'produto') return 'product';
  if (category === 'campanha') return 'campaign';
  if (category === 'seo') return 'seo';
  if (category === 'lead') return 'lead';
  return 'operation';
}

function inferTargetId(item, category) {
  const explicit = normalizeText(item.targetId);
  if (explicit) return explicit;

  const id = normalizeText(item.id);

  if (category === 'pagina' && id.startsWith('page-decision:')) {
    return id.slice('page-decision:'.length);
  }

  if (category === 'produto' && id.startsWith('product-decision:')) {
    return id.slice('product-decision:'.length);
  }

  if (category === 'lead' && id.startsWith('lead:')) {
    return id.slice('lead:'.length);
  }

  if (category === 'campanha' && id.startsWith('campaign-decision:')) {
    return id.slice('campaign-decision:'.length);
  }

  return '';
}

function computePriorityScore(item, whereToDo) {
  const impact = Math.min(
    100,
    priorityWeight(item.priority) +
      (item.requiresApproval ? 5 : 0) +
      (normalizeText(item.sourceType) === 'lead' ? 8 : 0)
  );

  const urgency = Math.min(
    100,
    priorityWeight(item.priority) +
      (normalizeText(item.dueLabel).toLowerCase().includes('hoje') ? 6 : 0) +
      (Array.isArray(item.metadata) && item.metadata.some((entry) => normalizeText(entry).toLowerCase().includes('vencido')) ? 12 : 0)
  );

  const confidence = Math.min(
    100,
    58 +
      (item.actionGuide?.steps?.length ? 18 : 0) +
      (item.href ? 10 : 0) +
      (item.requiresApproval ? 6 : 0)
  );

  const ease = Math.min(
    100,
    {
      Painel: 84,
      CRM: 78,
      'Google Ads': 72,
      'Search Console': 70,
      Analytics: 64,
      VSCode: 56
    }[whereToDo] || 60
  );

  const finalScore = Number(((impact * 0.4) + (urgency * 0.3) + (confidence * 0.2) + (ease * 0.1)).toFixed(1));

  return { impact, urgency, confidence, ease, finalScore };
}

function formatWhen(value) {
  if (!value) return 'Agora';

  try {
    return new Date(value).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Agora';
  }
}

function hoursSince(value) {
  if (!value) return 0;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return 0;
  return Math.max(0, Math.round((Date.now() - parsed) / (60 * 60 * 1000)));
}

function toneFromResult(result) {
  return (
    {
      waiting: 'blue',
      positive: 'success',
      neutral: 'premium',
      negative: 'danger'
    }[result] || 'premium'
  );
}

function toneFromImpact(impact, kind = 'info') {
  if (kind === 'error') return 'danger';
  if (impact === 'high') return 'danger';
  if (impact === 'medium') return 'warning';
  return 'premium';
}

function groupEngineEvent(item = {}) {
  if (item.kind === 'error') return 'errors';
  if (item.type === 'cta_activated' || item.type === 'automation_executed') return 'automations';
  if (item.type === 'task_created' || item.type === 'task_moved') return 'tasks';
  if (item.type === 'result_closed' || item.type === 'recheck_done') return 'results';
  return 'everything';
}

function mapEngineEvent(item = {}) {
  return {
    id: item.id,
    type: item.type,
    source: item.source,
    targetType: item.targetType,
    targetId: item.targetId,
    message: item.message,
    impact: item.impact,
    kind: item.kind,
    group: groupEngineEvent(item),
    createdAt: item.createdAt,
    tone: toneFromImpact(item.impact, item.kind)
  };
}

function buildEngineAlert(engine = {}) {
  if (engine.status === 'failed') {
    return {
      tone: 'danger',
      title: 'O motor operacional falhou na última execução',
      description: engine.lastErrorSummary || engine.lastSummary || 'O último ciclo encontrou um erro crítico.',
      actionLabel: 'Ver detalhes',
      retryLabel: 'Rodar novamente'
    };
  }

  if (engine.status === 'delayed') {
    return {
      tone: 'warning',
      title: 'O motor está atrasado, mas ainda ativo',
      description: 'O ciclo esperado não roda há mais tempo do que o normal. Vale acompanhar ou disparar manualmente.',
      actionLabel: 'Ver detalhes',
      retryLabel: 'Rodar novamente'
    };
  }

  return null;
}

function mapAutomationRun(item) {
  return {
    id: item.id,
    title: item.title,
    detail: item.detail,
    status: item.status,
    createdAt: item.createdAt,
    tone: item.status === 'success' ? 'success' : item.status === 'warning' ? 'warning' : 'danger'
  };
}

function mapGrowthMove(item, index) {
  return {
    id: `radar-opportunity-${index + 1}`,
    title: item.title,
    targetLabel: item.value || 'Oportunidade',
    reason: item.description,
    expectedImpact: item.value || 'Pode virar prioridade quando o sinal ficar mais forte.',
    whereToDo: 'Painel',
    href: item.href || '/dashboard/radar',
    sourceLabel: 'Radar',
    signalLabel: 'Pode esperar'
  };
}

function sortByOperationalScore(items = []) {
  return [...items].sort((left, right) => {
    const scoreDiff = (right.priorityScore?.finalScore || 0) - (left.priorityScore?.finalScore || 0);
    if (scoreDiff !== 0) return scoreDiff;
    return Date.parse(right.createdAt || 0) - Date.parse(left.createdAt || 0);
  });
}

function sortByRecentCompletion(items = []) {
  return [...items].sort(
    (left, right) =>
      Date.parse(right.completedAt || right.waitingResultAt || right.actedAt || right.createdAt || 0) -
      Date.parse(left.completedAt || left.waitingResultAt || left.actedAt || left.createdAt || 0)
  );
}

function buildOperationalTask(item) {
  const status = normalizeTaskStatus(item.status);
  const whereToDo = item.whereToDo || mapWhereToDo(item.actionGuide?.destination, item.href, item.sourceType);
  const category = inferCategory(item, whereToDo);
  const actionType = inferActionType(item, whereToDo);
  const targetLabel = buildTargetLabel(item, category);
  const guideSteps = item.guideSteps?.length ? item.guideSteps : buildGuideSteps(whereToDo, { ...item, targetLabel });
  const priority = buildPriorityLabel(item.priority);
  const priorityScore = computePriorityScore(item, whereToDo);
  const startedAt = item.startedAt || item.actedAt || null;
  const stalledHours = status === TASK_STATUS.IN_PROGRESS || status === TASK_STATUS.BLOCKED ? hoursSince(startedAt) : 0;
  const performanceSnapshot = normalizePerformanceSnapshot(item.performanceSnapshot || {});
  const targetType = inferTargetType(item, category);
  const targetId = inferTargetId(item, category);

  return {
    id: item.id,
    title: item.title,
    category,
    priority: priority.value,
    priorityLabel: priority.label,
    actionType,
    actionHeadline: buildHeroActionLabel({ actionType, category }),
    targetLabel,
    reason: item.description || item.reason || item.note || 'Sem motivo resumido disponível.',
    expectedImpact: buildExpectedImpact(item, category, actionType),
    whereToDo,
    guideSteps,
    successCriteria: buildSuccessCriteria(category, actionType),
    recheckAfterHours: performanceSnapshot.recheckAfterHours || buildRecheckHours(category, actionType),
    status,
    statusLabel: getTaskStatusLabel(status),
    createdAt: item.createdAt || item.actedAt || new Date().toISOString(),
    startedAt,
    completedAt: item.completedAt || item.waitingResultAt || null,
    archivedAt: item.archivedAt || null,
    reopenedAt: item.reopenedAt || null,
    actedAt: item.actedAt || null,
    actedBy: item.actedBy || item.ownerLabel || 'Equipe',
    stalledHours,
    isStalled: stalledHours >= 18,
    sourceLabel: item.sourceLabel || 'Operação',
    href: item.href || '',
    contextHref: item.href || '',
    guideHref: item.actionGuide?.destinationHref || item.href || '',
    guideKind: item.actionGuide?.destinationKind || (item.href ? 'internal' : 'manual'),
    guideButtonLabel: item.actionGuide?.buttonLabel || 'Abrir contexto',
    requiresApproval: Boolean(item.requiresApproval),
    recommendation: item.recommendation || '',
    nextStep: guideSteps[0] || 'Abrir contexto e executar.',
    outcome: normalizeText(item.outcome).toLowerCase(),
    note: item.note || '',
    priorityScore,
    targetType,
    targetId,
    performanceSnapshot,
    badges: normalizeBadges(item.badges || [], item),
    sourceTaskId: item.sourceTaskId || null,
    reopenReason: item.reopenReason || '',
    reopenedFromResult: item.reopenedFromResult || '',
    isAutomatic: Boolean(item.isAutomatic),
    automationMode: item.automationMode || '',
    resultDueAt: item.resultDueAt || performanceSnapshot.dueRecheckAt || null,
    raw: item
  };
}

function buildOutcomes(tasks = []) {
  return tasks.map((task) => {
    const snapshot = normalizePerformanceSnapshot(task.performanceSnapshot || {});
    const status = normalizeTaskStatus(task.status);
    const result = status === TASK_STATUS.WAITING_RESULT ? 'waiting' : snapshot.result || 'neutral';

    return {
      taskId: task.id,
      before: snapshot.before,
      after: snapshot.after,
      summary:
        snapshot.summary ||
        (result === 'waiting'
          ? `O sistema está aguardando a janela certa para medir ${task.targetLabel || task.title}.`
          : `O sistema releu ${task.targetLabel || task.title} e registrou o efeito inicial.`),
      result,
      tone: toneFromResult(result),
      nextRecommendation:
        snapshot.nextRecommendation ||
        (result === 'waiting'
          ? `Esperar mais ${snapshot.recheckAfterHours || task.recheckAfterHours}h antes da nova leitura.`
          : 'Mover para radar se o sinal continuar estável.'),
      title: task.title,
      targetLabel: task.targetLabel,
      completedAt: task.completedAt || task.waitingResultAt || task.actedAt || task.createdAt,
      whereToDo: task.whereToDo,
      href: task.href || '',
      contextHref: task.contextHref || task.href || '',
      badges: task.badges || [],
      status: task.status,
      sourceTaskId: task.sourceTaskId || null,
      reopenedFromResult: task.reopenedFromResult || ''
    };
  });
}

function filterHumanQueue(items = []) {
  return items.filter((item) => !item.requiresApproval || item.actionType === 'aprovar');
}

function sameDay(dateA, dateB = new Date()) {
  if (!dateA) return false;
  const a = new Date(dateA);
  const b = new Date(dateB);
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function withinDays(value, days) {
  if (!value) return false;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return false;
  return Date.now() - parsed <= days * 24 * 60 * 60 * 1000;
}

function buildCompletedGroups(items = [], outcomes = [], reopenedSourceIds = new Set()) {
  const negativeIds = new Set(outcomes.filter((item) => item.result === 'negative').map((item) => item.taskId));

  return {
    today: items.filter((item) => sameDay(item.completedAt || item.actedAt || item.createdAt)),
    week: items.filter((item) => withinDays(item.completedAt || item.actedAt || item.createdAt, 7)),
    month: items.filter((item) => withinDays(item.completedAt || item.actedAt || item.createdAt, 30)),
    reopened: items.filter((item) => reopenedSourceIds.has(item.id)),
    failed: items.filter((item) => negativeIds.has(item.id))
  };
}

function buildSystemDidForYou({ history, queueItems, radarItems, engineEvents }) {
  const automaticItems = (engineEvents || [])
    .filter((item) => item.kind !== 'error')
    .slice(0, 4)
    .map((item) => ({
      id: item.id,
      title: item.message,
      description: item.targetId ? `${item.targetType || 'Alvo'} · ${item.targetId}` : 'Ação registrada no motor operacional.',
      statusLabel: formatWhen(item.createdAt),
      tone: item.tone || 'premium'
    }));

  const helperItems = [];

  if (queueItems.length) {
    helperItems.push({
      id: 'queue-reordered',
      title: 'Fila reorganizada',
      description: `O sistema deixou só ${queueItems.length} foco(s) vivos na fila principal.`,
      statusLabel: 'Prioridade operacional recalculada',
      tone: 'premium'
    });
  }

  if (radarItems.length) {
    helperItems.push({
      id: 'radar-moved',
      title: 'Itens fracos saíram da frente',
      description: `${radarItems.length} item(ns) foram estacionados no Radar para não poluir a operação principal.`,
      statusLabel: 'Radar atualizado',
      tone: 'warning'
    });
  }

  return [...automaticItems, ...helperItems].slice(0, 5);
}

function buildSecondaryCards({ queueItems, cockpit, radarItems }) {
  return [
    {
      id: 'secondary-next',
      label: 'Próxima melhor ação',
      title: queueItems[1]?.title || queueItems[0]?.title || 'Nada urgente além do foco principal',
      description: queueItems[1]?.reason || 'A fila principal já está curta e organizada.',
      href: queueItems[1]?.href || queueItems[0]?.href || '/dashboard/queue'
    },
    {
      id: 'secondary-bottleneck',
      label: 'Maior gargalo atual',
      title: cockpit.moneyLeaks?.[0]?.title || 'Sem gargalo dominante',
      description: cockpit.moneyLeaks?.[0]?.description || 'Nada está gritando mais alto que o restante agora.',
      href: cockpit.moneyLeaks?.[0]?.href || '/dashboard/results'
    },
    {
      id: 'secondary-opportunity',
      label: 'Melhor oportunidade escondida',
      title: radarItems[0]?.title || cockpit.growthMoves?.[0]?.title || 'Sem oportunidade fria relevante agora',
      description: radarItems[0]?.reason || cockpit.growthMoves?.[0]?.description || 'O radar segue monitorando o que pode virar prioridade depois.',
      href: radarItems[0]?.href || cockpit.growthMoves?.[0]?.href || '/dashboard/radar'
    }
  ];
}

export async function getAdminOperationalSnapshot() {
  const [cockpit, tasksSnapshot, history, engineState, engineEventRows] = await Promise.all([
    getAdminAiCockpitSnapshot(),
    getAdminTasksSnapshot(),
    getAdminHistorySnapshot(),
    readOperationalEngineState(),
    readOperationalEngineEvents({ limit: 24 })
  ]);
  const engineEvents = engineEventRows.map(mapEngineEvent);

  const pendingItems = sortByOperationalScore(
    filterHumanQueue((tasksSnapshot.queue?.pending || []).map(buildOperationalTask))
  );
  const queueItems = pendingItems.slice(0, 5);
  const overflowItems = pendingItems.slice(5);

  const inProgressItems = sortByOperationalScore([
    ...((tasksSnapshot.queue?.inProgress || []).map(buildOperationalTask)),
    ...((tasksSnapshot.queue?.blocked || []).map(buildOperationalTask))
  ]);

  const waitingResultItems = sortByRecentCompletion((tasksSnapshot.queue?.waitingResult || []).map(buildOperationalTask));

  const completedItems = sortByRecentCompletion([
    ...((tasksSnapshot.queue?.done || []).map(buildOperationalTask)),
    ...((tasksSnapshot.queue?.archived || []).map(buildOperationalTask)),
    ...((tasksSnapshot.queue?.waitingResult || []).map(buildOperationalTask))
  ]);

  const radarItems = [
    ...overflowItems.map((item) => ({
      id: `radar-${item.id}`,
      title: item.title,
      targetLabel: item.targetLabel,
      reason: item.reason,
      expectedImpact: item.expectedImpact,
      whereToDo: item.whereToDo,
      href: item.href || '/dashboard/radar',
      sourceLabel: item.sourceLabel,
      signalLabel: 'Pode esperar'
    })),
    ...(cockpit.growthMoves || []).slice(0, 4).map(mapGrowthMove)
  ].slice(0, 8);

  const outcomes = buildOutcomes(completedItems.slice(0, 16));
  const resultGroups = {
    waiting: outcomes.filter((item) => item.result === 'waiting'),
    improved: outcomes.filter((item) => item.result === 'positive'),
    neutral: outcomes.filter((item) => item.result === 'neutral'),
    worsened: outcomes.filter((item) => item.result === 'negative')
  };
  const reopenedSourceIds = new Set(
    [...queueItems, ...inProgressItems, ...completedItems].map((item) => item.sourceTaskId).filter(Boolean)
  );
  const completedGroups = buildCompletedGroups(completedItems, outcomes, reopenedSourceIds);
  const heroTask = queueItems[0] || inProgressItems[0] || null;
  const recentResults = [...resultGroups.improved, ...resultGroups.neutral, ...resultGroups.worsened].slice(0, 3);
  const systemDid = buildSystemDidForYou({ history, queueItems, radarItems, engineEvents });
  const engineAlert = buildEngineAlert(engineState);
  const engineLogs = {
    all: engineEvents,
    automations: engineEvents.filter((item) => item.group === 'automations'),
    tasks: engineEvents.filter((item) => item.group === 'tasks'),
    results: engineEvents.filter((item) => item.group === 'results'),
    errors: engineEvents.filter((item) => item.group === 'errors')
  };
  const dailyFocus = generateDailyFocus({
    queueItems,
    inProgressItems,
    waitingResultItems,
    pendingTrafficConstraint: cockpit.growthMoves?.length || 0
  });
  const dailyActions = generateDailyActions(
    {
      pendingItems: queueItems,
      inProgressItems,
      waitingResultItems
    },
    {
      items: outcomes,
      improved: resultGroups.improved,
      neutral: resultGroups.neutral,
      worsened: resultGroups.worsened,
      waiting: resultGroups.waiting
    },
    engineEvents.filter((item) => item.kind !== 'error')
  );
  const primaryDailyAction = dailyActions[0] || null;
  const recentOutcomeSummary = generateRecentOutcomeSummary(resultGroups);
  const dailyClosure = generateDailyClosure(
    {
      completedToday: completedGroups.today,
      pendingItems: queueItems,
      inProgressItems,
      waitingResultItems
    },
    {
      systemEvents: engineEvents
    }
  );
  const nextDayPreview = generateNextDayPreview({
    queueItems,
    inProgressItems,
    waitingResultItems,
    results: resultGroups,
    engineStatus: engineState.status
  });

  return {
    checkedAt: new Date().toISOString(),
    summary: {
      focusCount: queueItems.length,
      queueCount: queueItems.length,
      hiddenFromQueue: overflowItems.length,
      inProgressCount: inProgressItems.length,
      completedCount: completedItems.length,
      completedToday: completedGroups.today.length,
      blockedCount: inProgressItems.filter((item) => item.status === TASK_STATUS.BLOCKED).length,
      waitingResultCount: waitingResultItems.length,
      radarCount: radarItems.length,
      automationRuns: history.automationRuns?.length || 0
    },
    today: {
      hero: dailyFocus
        ? {
            title: dailyFocus.title,
            actionLabel: buildDailyHeroActionLabel(primaryDailyAction?.actionType || heroTask?.actionType),
            targetLabel: dailyFocus.targetLabel || primaryDailyAction?.target || heroTask?.targetLabel || 'Operação do dia',
            reason: dailyFocus.reason,
            expectedImpact: dailyFocus.expectedImpact,
            href: primaryDailyAction?.href || heroTask?.href || '/dashboard/queue',
            contextHref: primaryDailyAction?.contextHref || heroTask?.href || '/dashboard/queue',
            guideHref: primaryDailyAction?.href || heroTask?.guideHref || heroTask?.href || '/dashboard/queue',
            guideKind: primaryDailyAction?.guideKind || heroTask?.guideKind || 'internal'
          }
        : {
            title: cockpit.commandCenter?.title || 'Nada urgente na fila principal',
            actionLabel: 'REVISAR',
            targetLabel: 'Operação do dia',
            reason: cockpit.commandCenter?.diagnosis || 'A operação está limpa e o radar segue ligado.',
            expectedImpact: 'Manter foco só no que realmente merece energia.',
            href: '/dashboard/radar',
            contextHref: '/dashboard/results',
            guideHref: '/dashboard/radar',
            guideKind: 'internal'
          },
      dailyActions,
      secondaryCards: buildSecondaryCards({ queueItems, cockpit, radarItems }),
      systemDid,
      recentResults,
      recentOutcomeSummary,
      dailyClosure,
      nextDayPreview,
      topTaskId: heroTask?.id || null
    },
    engine: {
      ...engineState,
      alert: engineAlert,
      events: engineEvents,
      logs: engineLogs,
      systemActed: engineEvents.filter((item) => item.kind !== 'error').slice(0, 5)
    },
    queue: {
      items: queueItems,
      overflowCount: overflowItems.length,
      totalPending: pendingItems.length,
      helperText:
        overflowItems.length > 0
          ? `${overflowItems.length} item(ns) menos urgentes foram para o Radar para manter a fila útil.`
          : 'Só o que exige ação humana real agora ficou aqui.'
    },
    inProgress: {
      items: inProgressItems,
      stalledCount: inProgressItems.filter((item) => item.isStalled).length
    },
    completed: {
      items: completedItems,
      groups: completedGroups
    },
    radar: {
      items: radarItems
    },
    automations: {
      rules: AUTOMATION_RULES,
      logs: engineEvents.filter((item) => item.source !== 'manual').slice(0, 10)
    },
    results: {
      items: outcomes,
      waiting: waitingResultItems,
      groups: resultGroups
    }
  };
}
