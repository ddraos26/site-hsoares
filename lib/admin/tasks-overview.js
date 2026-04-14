import 'server-only';

import { getDb } from '@/lib/db';
import { getAdminDecisionEngineSnapshot } from '@/lib/admin/decision-engine';
import { getAdminIntegrationSnapshot } from '@/lib/admin/integration-status';
import { LEAD_FIRST_RESPONSE_SLA_HOURS, isLeadSlaLate } from '@/lib/admin/lead-automation';
import { getAdminProductsSnapshot } from '@/lib/admin/products-overview';
import { getAdminPagesSnapshot } from '@/lib/admin/pages-overview';
import {
  buildPageDecisionTasks,
  buildProductDecisionTasks
} from '@/lib/admin/modules/command-center/application/action-queue';
import { buildTaskActionGuide } from '@/lib/admin/task-action-guide';
import { buildPersistedTaskItem, readAdminTasks } from '@/lib/admin/task-definition-store';
import { mergeTaskState, readTaskStateEntries } from '@/lib/admin/task-store';

const OPEN_LEAD_STATUSES = new Set(['novo', 'em_contato']);
const PRIORITY_VALUE = {
  Urgente: 4,
  Alta: 3,
  Média: 2,
  Baixa: 1
};

function normalizeText(value) {
  return String(value || '').trim();
}

function priorityValue(priority) {
  return PRIORITY_VALUE[priority] || PRIORITY_VALUE.Média;
}

function toneFromPriority(priority) {
  if (priority === 'Urgente') return 'danger';
  if (priority === 'Alta') return 'warning';
  if (priority === 'Média') return 'premium';
  return 'blue';
}

function formatDateTime(value) {
  if (!value) return 'Sem data';

  try {
    return new Date(value).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Sem data';
  }
}

function formatRelativeLeadAge(value) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  const diff = Date.now() - date.getTime();
  const hours = Math.max(1, Math.floor(diff / (60 * 60 * 1000)));

  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;

  return `${Math.floor(days / 30)}m`;
}

function buildTaskId(prefix, value) {
  return `${prefix}:${String(value || '').trim()}`;
}

function dedupeTasks(items = []) {
  const seen = new Set();
  return items.filter((item) => {
    if (!item?.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function mergeTaskDefinitions(baseItem, persistedItem) {
  if (!persistedItem) return baseItem;

  return {
    ...baseItem,
    title: persistedItem.title || baseItem.title,
    description: persistedItem.description || baseItem.description,
    recommendation: persistedItem.recommendation || baseItem.recommendation,
    priority: persistedItem.priority || baseItem.priority,
    sourceType: persistedItem.sourceType || baseItem.sourceType,
    sourceLabel: persistedItem.sourceLabel || baseItem.sourceLabel,
    href: persistedItem.href || baseItem.href,
    requiresApproval: persistedItem.requiresApproval == null ? baseItem.requiresApproval : persistedItem.requiresApproval,
    ownerLabel: persistedItem.ownerLabel || baseItem.ownerLabel,
    productLabel: persistedItem.targetLabel || baseItem.productLabel,
    dueLabel: persistedItem.dueLabel || baseItem.dueLabel,
    metadata: persistedItem.metadata?.length ? persistedItem.metadata : baseItem.metadata,
    createdAt: persistedItem.createdAt || baseItem.createdAt,
    guideSteps: persistedItem.guideSteps?.length ? persistedItem.guideSteps : baseItem.guideSteps,
    whereToDo: persistedItem.whereToDo || baseItem.whereToDo,
    performanceSnapshot: persistedItem.performanceSnapshot || baseItem.performanceSnapshot,
    badges: persistedItem.badges || baseItem.badges || [],
    sourceTaskId: persistedItem.sourceTaskId || null,
    reopenReason: persistedItem.reopenReason || '',
    reopenedFromResult: persistedItem.reopenedFromResult || '',
    targetType: persistedItem.targetType || baseItem.targetType || '',
    targetId: persistedItem.targetId || baseItem.targetId || '',
    targetLabel: persistedItem.targetLabel || baseItem.targetLabel || baseItem.productLabel || '',
    isAutomatic: persistedItem.isAutomatic == null ? Boolean(baseItem.isAutomatic) : persistedItem.isAutomatic,
    automationMode: persistedItem.automationMode || baseItem.automationMode || '',
    resultDueAt: persistedItem.resultDueAt || baseItem.resultDueAt || null
  };
}

function sortPendingTasks(items = []) {
  return [...items].sort((left, right) => {
    const priorityDiff = priorityValue(right.priority) - priorityValue(left.priority);
    if (priorityDiff !== 0) return priorityDiff;

    const leftNeedsApproval = left.requiresApproval ? 1 : 0;
    const rightNeedsApproval = right.requiresApproval ? 1 : 0;
    if (leftNeedsApproval !== rightNeedsApproval) return rightNeedsApproval - leftNeedsApproval;

    return Date.parse(right.createdAt || 0) - Date.parse(left.createdAt || 0);
  });
}

async function getLeadTasks(sql) {
  const rows = await sql`
    SELECT
      id,
      nome,
      whatsapp,
      email,
      product_slug,
      page_path,
      lead_status,
      owner_name,
      next_contact_at,
      created_at,
      updated_at
    FROM leads
    WHERE lead_status IN ('novo', 'em_contato')
      AND created_at >= now() - interval '90 days'
    ORDER BY updated_at DESC NULLS LAST, created_at DESC
    LIMIT 80
  `;

  return rows
    .map((row) => {
      const status = normalizeText(row.lead_status).toLowerCase();
      if (!OPEN_LEAD_STATUSES.has(status)) return null;

      const overdue = row.next_contact_at && Date.parse(row.next_contact_at) < Date.now();
      const slaLate = isLeadSlaLate({ leadStatus: status, createdAt: row.created_at });
      const unassigned = !normalizeText(row.owner_name);
      const leadLabel = normalizeText(row.nome) || normalizeText(row.whatsapp) || normalizeText(row.email) || 'Lead sem nome';
      const productLabel = normalizeText(row.product_slug) || 'Sem produto';
      const nextMove = overdue
        ? 'Retomar contato imediatamente'
        : slaLate
          ? 'Responder agora para recuperar o SLA'
        : unassigned
          ? 'Definir responsável e primeiro retorno'
          : status === 'novo'
            ? 'Responder com velocidade'
            : 'Manter follow-up aquecido';

      let title = `Responder ${leadLabel}`;
      let description = `${productLabel} entrou na fila e precisa de andamento operacional.`;
      let priority = 'Média';

      if (overdue && unassigned) {
        title = `Assumir e reaquecer ${leadLabel}`;
        description = `Esse lead está sem dono e com retorno vencido. É dinheiro parado na base comercial.`;
        priority = 'Urgente';
      } else if (slaLate && unassigned) {
        title = `Assumir ${leadLabel} e recuperar o SLA`;
        description = `O lead novo já passou do SLA interno de ${LEAD_FIRST_RESPONSE_SLA_HOURS}h e ainda está sem responsável definido.`;
        priority = 'Urgente';
      } else if (slaLate) {
        title = `Responder ${leadLabel} agora`;
        description = `O lead novo já passou do SLA interno de ${LEAD_FIRST_RESPONSE_SLA_HOURS}h para o primeiro contato.`;
        priority = 'Urgente';
      } else if (overdue) {
        title = `Fazer follow-up com ${leadLabel}`;
        description = `O retorno prometido já venceu e a oportunidade pode esfriar se ficar mais tempo sem ação.`;
        priority = 'Alta';
      } else if (unassigned) {
        title = `Definir responsável para ${leadLabel}`;
        description = `O lead entrou, mas ainda não tem dono. Vale distribuir agora para não perder o timing.`;
        priority = 'Alta';
      } else if (status === 'novo') {
        priority = 'Alta';
      }

      return {
        id: buildTaskId('lead', row.id),
        title,
        description,
        recommendation: nextMove,
        priority,
        tone: toneFromPriority(priority),
        sourceType: 'lead',
        sourceLabel: 'Leads',
        href: `/admin/leads?lead=${encodeURIComponent(row.id)}`,
        requiresApproval: false,
        ownerLabel: normalizeText(row.owner_name) || 'Sem responsável',
        productLabel,
        dueLabel: row.next_contact_at ? formatDateTime(row.next_contact_at) : 'Sem retorno marcado',
        metadata: [
          overdue
            ? 'Follow-up vencido'
            : slaLate
              ? `SLA de ${LEAD_FIRST_RESPONSE_SLA_HOURS}h estourado`
              : `Idade ${formatRelativeLeadAge(row.created_at)}`,
          normalizeText(row.whatsapp) || normalizeText(row.email) || 'Sem contato principal'
        ],
        createdAt: row.updated_at || row.created_at || new Date().toISOString()
      };
    })
    .filter(Boolean);
}

function buildApprovalTasks(approvals = []) {
  return approvals.map((item) => {
    const priority = item.risk === 'Alta' ? 'Urgente' : item.risk === 'Média' ? 'Alta' : 'Média';

    return {
      id: buildTaskId('approval', item.id),
      title: item.title,
      description: item.reason,
      recommendation: item.recommendation,
      priority,
      tone: toneFromPriority(priority),
      sourceType: 'approval',
      sourceLabel: 'Aprovações',
      href: item.href || '/admin/aprovacoes',
      requiresApproval: true,
      ownerLabel: 'Seu aval',
      productLabel: item.sourceType || 'Mudança sensível',
      dueLabel: 'Aguardando decisão',
      metadata: [item.impact || 'Impacto não informado', item.risk || 'Risco moderado'],
      createdAt: item.decidedAt || new Date().toISOString()
    };
  });
}

function buildAutomationTasks(tasks = []) {
  return tasks.map((item) => ({
    id: buildTaskId('automation', item.id),
    title: item.title,
    description: item.recommendation,
    recommendation: item.recommendation,
    priority: item.priority || 'Média',
    tone: toneFromPriority(item.priority || 'Média'),
    sourceType: 'automation',
    sourceLabel: 'Automações',
    href: '/admin/automacoes',
    requiresApproval: Boolean(item.requiresApproval),
    ownerLabel: item.requiresApproval ? 'Aguardando decisão' : 'Sistema sugeriu',
    productLabel: 'Checklist automático',
    dueLabel: 'Hoje',
    metadata: [item.requiresApproval ? 'Precisa aprovação' : 'Pode executar', 'Fila automática'],
    createdAt: new Date().toISOString()
  }));
}

function buildMissionTasks(actions = []) {
  return actions.map((item, index) => ({
    id: buildTaskId('mission', `${index}-${item.title}`),
    title: item.title,
    description: item.recommendation,
    recommendation: item.recommendation,
    priority: item.priority || 'Média',
    tone: toneFromPriority(item.priority || 'Média'),
    sourceType: 'mission',
    sourceLabel: 'Missão do dia',
    href: '/admin/missao-hoje',
    requiresApproval: Boolean(item.requiresApproval),
    ownerLabel: 'Operação do dia',
    productLabel: 'Missão',
    dueLabel: 'Hoje',
    metadata: [item.priority || 'Média', item.requiresApproval ? 'Precisa aprovação' : 'Execução direta'],
    createdAt: new Date().toISOString()
  }));
}

function buildIntegrationTasks(items = []) {
  return items
    .filter((item) => item.status === 'partial' || item.status === 'pending')
    .slice(0, 4)
    .map((item) => ({
      id: buildTaskId('integration', item.key),
      title: `Destravar ${item.title}`,
      description: item.reason,
      recommendation: item.nextAction,
      priority: item.status === 'partial' ? 'Média' : 'Baixa',
      tone: item.status === 'partial' ? 'warning' : 'blue',
      sourceType: 'integration',
      sourceLabel: 'Integrações',
      href: '/admin/configuracoes',
      requiresApproval: false,
      ownerLabel: 'Configuração',
      productLabel: item.title,
      dueLabel: 'Quando possível',
      metadata: [item.statusLabel || 'Pendente', `${(item.missing || []).length} variáveis pendentes`],
      createdAt: new Date().toISOString()
    }));
}

function buildSourceBreakdown(queue, summary, integrations) {
  const groups = [
    {
      key: 'lead',
      label: 'Leads operacionais',
      count: summary.leadTasks,
      tone: 'danger',
      href: '/admin/leads'
    },
    {
      key: 'approval',
      label: 'Aprovações',
      count: summary.approvalTasks,
      tone: 'warning',
      href: '/admin/aprovacoes'
    },
    {
      key: 'decision',
      label: 'Produtos e páginas',
      count: summary.decisionTasks,
      tone: queue.pending.some((item) => ['product-decision', 'page-decision'].includes(item.sourceType) && item.priority === 'Urgente')
        ? 'warning'
        : 'premium',
      href: '/admin/tasks'
    },
    {
      key: 'automation',
      label: 'Automações',
      count: summary.automationTasks,
      tone: 'premium',
      href: '/admin/automacoes'
    },
    {
      key: 'mission',
      label: 'Missão do dia',
      count: summary.missionTasks,
      tone: 'blue',
      href: '/admin/missao-hoje'
    },
    {
      key: 'integration',
      label: 'Integrações',
      count: summary.integrationTasks,
      tone: integrations.some((item) => item.status === 'partial') ? 'warning' : 'blue',
      href: '/admin/configuracoes'
    }
  ];

  return groups.filter((item) => item.count > 0);
}

function latestTaskEntriesById(entries = []) {
  const latest = new Map();

  for (const entry of entries) {
    if (!entry?.id) continue;
    latest.set(entry.id, entry);
  }

  return latest;
}

function addActionGuide(item) {
  return {
    ...item,
    actionGuide: buildTaskActionGuide(item)
  };
}

export async function getAdminTasksSnapshot() {
  const sql = getDb();

  const [decision, integrationSnapshot, taskEntries, leadTasks, productsSnapshot, pagesSnapshot, persistedTasks] = await Promise.all([
    getAdminDecisionEngineSnapshot(),
    getAdminIntegrationSnapshot(),
    readTaskStateEntries(),
    getLeadTasks(sql),
    getAdminProductsSnapshot(),
    getAdminPagesSnapshot(),
    readAdminTasks()
  ]);

  const productDecisionTasks = buildProductDecisionTasks(productsSnapshot);
  const pageDecisionTasks = buildPageDecisionTasks(pagesSnapshot);
  const decisionTasks = [...productDecisionTasks, ...pageDecisionTasks];
  const approvalTasks = buildApprovalTasks(decision.approvals.pending || []);
  const automationTasks = buildAutomationTasks(decision.automations.tasks || []);
  const missionTasks = buildMissionTasks(decision.mission.actions || []);
  const integrationTasks = buildIntegrationTasks(integrationSnapshot.items || []);

  const persistedTaskMap = new Map(
    persistedTasks.map((item) => [item.id, { ...buildPersistedTaskItem(item), ...item }])
  );

  const dynamicItems = [
    ...leadTasks,
    ...decisionTasks,
    ...approvalTasks,
    ...automationTasks,
    ...missionTasks,
    ...integrationTasks
  ].map((item) => mergeTaskDefinitions(item, persistedTaskMap.get(item.id)));

  const persistedOnlyItems = persistedTasks
    .filter((item) => !dynamicItems.some((candidate) => candidate.id === item.id))
    .map(buildPersistedTaskItem);

  const items = sortPendingTasks(dedupeTasks([...dynamicItems, ...persistedOnlyItems]));

  const queue = mergeTaskState(items, taskEntries);
  const pending = sortPendingTasks(queue.pending).map(addActionGuide);
  const inProgress = sortPendingTasks(queue.inProgress).map(addActionGuide);
  const doing = inProgress;
  const done = queue.done.map(addActionGuide);
  const archived = queue.archived.map(addActionGuide);
  const blocked = sortPendingTasks(queue.blocked).map(addActionGuide);
  const waitingResult = queue.waitingResult.map(addActionGuide);
  const topTask = pending[0] || inProgress[0] || blocked[0] || null;
  const latestEntryMap = latestTaskEntriesById(taskEntries);
  const feedbackEntries = [...latestEntryMap.values()];

  const summary = {
    total: items.length,
    pending: pending.length,
    doing: doing.length,
    inProgress: inProgress.length,
    done: done.length,
    archived: archived.length,
    blocked: blocked.length,
    waitingResult: waitingResult.length,
    urgent: pending.filter((item) => item.priority === 'Urgente').length,
    approvalTasks: approvalTasks.length,
    leadTasks: leadTasks.length,
    decisionTasks: decisionTasks.length,
    automationTasks: automationTasks.length,
    missionTasks: missionTasks.length,
    integrationTasks: integrationTasks.length,
    successfulFeedbacks: feedbackEntries.filter((item) => item.actionType === 'feedback' && item.outcome === 'yes').length,
    failedFeedbacks: feedbackEntries.filter((item) => item.actionType === 'feedback' && item.outcome === 'no').length,
    rejectedIdeas: feedbackEntries.filter((item) => item.actionType === 'rejected').length
  };

  return {
    checkedAt: new Date().toISOString(),
    topTask,
    summary,
    queue: {
      pending,
      inProgress,
      doing,
      done,
      archived,
      blocked,
      waitingResult
    },
    breakdown: buildSourceBreakdown(queue, summary, integrationSnapshot.items || []),
    supportingSignals: {
      approvalsPending: decision.approvals.pending.length,
      leadOverdue: leadTasks.filter((item) => item.priority === 'Urgente' || item.metadata.includes('Follow-up vencido')).length,
      leadUnassigned: leadTasks.filter((item) => item.ownerLabel === 'Sem responsável').length,
      economicMode: decision.cost.policy.useEconomicMode,
      currentModeLabel: decision.cost.currentModeLabel
    }
  };
}
