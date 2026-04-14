import 'server-only';

import { getDb } from '@/lib/db';
import { getAutomationOperationsSnapshot } from '@/lib/admin/automation-operation-store';
import { readLatestApprovalExecutionMap } from '@/lib/admin/approval-execution';
import { getAdminIntegrationSnapshot } from '@/lib/admin/integration-status';
import { readAdminJobRuns } from '@/lib/admin/job-run-store';
import { readApprovalDecisions } from '@/lib/admin/approval-store';
import { readRecentLeadActivities } from '@/lib/admin/lead-activity-store';
import { readTaskStateEntries } from '@/lib/admin/task-store';
import { TASK_STATUS, getTaskStatusLabel, normalizeTaskStatus } from '@/lib/admin/task-status';

function formatDateTime(value) {
  if (!value) return 'Sem registro';

  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function latestById(entries = []) {
  const latest = new Map();

  for (const entry of entries) {
    if (!entry?.id) continue;
    latest.set(entry.id, entry);
  }

  return [...latest.values()].sort(
    (left, right) => Date.parse(right.createdAt || 0) - Date.parse(left.createdAt || 0)
  );
}

function normalizeAutomationRun(row) {
  return {
    id: row.id,
    title: row.payload?.title || row.title || row.rule_name || 'Registro do sistema',
    status: row.status || 'success',
    detail:
      row.result?.detail ||
      row.result?.error ||
      row.payload?.detail ||
      row.payload?.recommendation ||
      'Registro salvo no histórico.',
    createdAt: row.executed_at || new Date().toISOString()
  };
}

function buildLatestTaskMap(entries = []) {
  const latest = new Map();

  for (const entry of entries) {
    if (!entry?.id) continue;
    latest.set(entry.id, entry);
  }

  return latest;
}

function describeTaskEntry(entry) {
  if (entry?.actionType === 'rejected') {
    return `Ideia rejeitada · ${entry.note || 'Você decidiu não seguir com essa recomendação.'}`;
  }

  if (entry?.actionType === 'feedback') {
    return `${entry.outcome === 'yes' ? 'Deu certo' : 'Nao deu certo'} · ${entry.note || 'Resultado registrado pelo admin.'}`;
  }

  if (entry?.actionType === 'result_review') {
    return `Leitura automática · ${entry.note || 'O sistema comparou before/after e registrou o efeito.'}`;
  }

  const status = normalizeTaskStatus(entry?.status);

  if (status === TASK_STATUS.DONE) {
    return `Marcada como feita · ${entry.note || 'Acao concluida na operacao.'}`;
  }

  if (status === TASK_STATUS.ARCHIVED) {
    return `Arquivada · ${entry.note || 'Acao encerrada e guardada no histórico.'}`;
  }

  if (status === TASK_STATUS.IN_PROGRESS) {
    return `Em andamento · ${entry.note || 'Acao em execucao.'}`;
  }

  if (status === TASK_STATUS.BLOCKED) {
    return `Bloqueada · ${entry?.note || 'A operacao parou aguardando destrave.'}`;
  }

  if (status === TASK_STATUS.WAITING_RESULT) {
    return `Aguardando resultado · ${entry?.note || 'A execucao terminou e o sistema vai reler o efeito.'}`;
  }

  if (status === TASK_STATUS.REOPENED) {
    return `Reaberta · ${entry?.note || 'A tarefa voltou para a fila ativa.'}`;
  }

  return `${getTaskStatusLabel(status)} · ${entry?.note || 'Estado operacional atualizado.'}`;
}

function formatJobLabel(jobKey) {
  return (
    {
      'daily-mission-refresh': 'Job',
      'ready-operations-sweep': 'Job',
      'impact-review-monitor': 'Job',
      'daily-page-review': 'Job',
      'operational-automation-engine': 'Job',
      'task-result-recheck': 'Job',
      'daily-google-ads-sync': 'Job',
      'admin-ops-cycle': 'Job'
    }[jobKey] || 'Job'
  );
}

function buildExecutionChains(operations = [], latestTaskMap = new Map()) {
  const now = Date.now();
  const overdueWindowMs = 24 * 60 * 60 * 1000;

  return (operations || [])
    .map((item) => {
      const reviewTaskId = item.reviewTaskId || item.result?.nextTaskId || null;
      const reviewEntry = reviewTaskId ? latestTaskMap.get(reviewTaskId) : null;
      const reviewCreatedAt = reviewEntry?.createdAt || item.completedAt || item.updatedAt || item.createdAt;
      const reviewOverdue = normalizeTaskStatus(reviewEntry?.status) !== TASK_STATUS.DONE && reviewCreatedAt
        ? now - Date.parse(reviewCreatedAt) > overdueWindowMs
        : false;

      return {
        id: item.id,
        title: item.title,
        operationStatus: item.statusLabel,
        operationTone: item.tone,
        detail:
          item.result?.executionArtifact?.nextStep ||
          item.result?.detail ||
          item.dispatchPacket?.handoffText ||
          item.description,
        reviewTaskId,
        reviewStatus: normalizeTaskStatus(reviewEntry?.status || TASK_STATUS.PENDING),
        reviewLabel: !reviewTaskId
          ? 'Sem revisão'
          : normalizeTaskStatus(reviewEntry?.status) === TASK_STATUS.DONE
            ? 'Revisão concluída'
            : reviewOverdue
              ? 'Revisão vencida'
              : 'Revisão pendente',
        reviewNote: reviewEntry?.note || '',
        reviewOverdue,
        href: item.contextHref || item.operationHref || '/admin/automacoes',
        createdAt: item.updatedAt || item.createdAt
      };
    })
    .slice(0, 12);
}

export async function getAdminHistorySnapshot() {
  const sql = getDb();

  const [leadActivities, taskEntries, approvalEntries, approvalExecutionMap, integrationSnapshot, automationRows, aiUsageRows, missions, operations, jobRuns] =
    await Promise.all([
      readRecentLeadActivities({ limit: 24 }),
      readTaskStateEntries(),
      readApprovalDecisions(),
      readLatestApprovalExecutionMap(),
      getAdminIntegrationSnapshot(),
      sql`
        SELECT
          e.id,
          e.status,
          e.payload,
          e.result,
          e.executed_at,
          r.name AS rule_name
        FROM automation_executions e
        LEFT JOIN automation_rules r ON r.id = e.rule_id
        ORDER BY e.executed_at DESC
        LIMIT 12
      `.catch(() => []),
      sql`
        SELECT id, model, mode, workflow, estimated_cost, created_at
        FROM ai_usage_logs
        ORDER BY created_at DESC
        LIMIT 12
      `.catch(() => []),
      sql`
        SELECT id, date, summary, top_priority, created_at
        FROM daily_missions
        ORDER BY date DESC
        LIMIT 7
      `.catch(() => []),
      getAutomationOperationsSnapshot({ limit: 20 }),
      readAdminJobRuns({ limit: 12 })
    ]);

  const latestTasks = latestById(taskEntries).slice(0, 16);
  const latestTaskMap = buildLatestTaskMap(taskEntries);
  const latestApprovals = latestById(approvalEntries)
    .map((item) => {
      const execution = approvalExecutionMap.get(item.id);

      return {
        ...item,
        executionStatus: execution?.status || null,
        executionDetail:
          execution?.result?.detail ||
          execution?.result?.error ||
          ''
      };
    })
    .slice(0, 12);
  const automationRuns = automationRows.map(normalizeAutomationRun);
  const executionChains = buildExecutionChains(operations.items || [], latestTaskMap);
  const pendingIntegrations = (integrationSnapshot.items || []).filter(
    (item) => item.status === 'partial' || item.status === 'pending'
  );

  const timeline = [
    ...leadActivities.map((item) => ({
      id: `lead-${item.id}`,
      tone: 'premium',
      eyebrow: 'Lead',
      title: item.title,
      detail: item.detail || 'Movimento operacional registrado.',
      createdAt: item.createdAt,
      href: item.leadId ? `/admin/leads?lead=${encodeURIComponent(item.leadId)}` : '/admin/leads'
    })),
    ...latestTasks.map((item) => ({
      id: `task-${item.id}-${item.createdAt}`,
      tone: normalizeTaskStatus(item.status) === TASK_STATUS.DONE
        ? 'success'
        : normalizeTaskStatus(item.status) === TASK_STATUS.IN_PROGRESS
          ? 'warning'
          : 'blue',
      eyebrow: 'Task',
      title: item.title || 'Tarefa atualizada',
      detail: describeTaskEntry(item),
      createdAt: item.createdAt,
      href: item.href || '/admin/tasks'
    })),
    ...latestApprovals.map((item) => ({
      id: `approval-${item.id}-${item.createdAt}`,
      tone: item.status === 'approved' ? 'success' : 'danger',
      eyebrow: 'Aprovação',
      title: item.title || 'Decisão registrada',
      detail: `${item.status === 'approved' ? 'Aprovada' : 'Rejeitada'} · ${item.executionDetail || item.rationale || 'Sem justificativa adicional.'}`,
      createdAt: item.createdAt,
      href: '/admin/aprovacoes'
    })),
    ...automationRuns.map((item) => ({
      id: `automation-${item.id}`,
      tone: item.status === 'success' ? 'success' : item.status === 'warning' ? 'warning' : 'danger',
      eyebrow: 'Automação',
      title: item.title,
      detail: item.detail,
      createdAt: item.createdAt,
      href: '/admin/automacoes'
    })),
    ...(operations.items || []).map((item) => ({
      id: `operation-${item.id}`,
      tone: item.tone,
      eyebrow: 'Operação',
      title: item.title,
      detail: `${item.statusLabel} · ${item.description}`,
      createdAt: item.updatedAt || item.createdAt,
      href: item.contextHref || item.operationHref || '/admin/automacoes'
    })),
    ...jobRuns.map((item) => ({
      id: `job-${item.id}`,
      tone: item.status === 'failed' ? 'danger' : item.status === 'degraded' ? 'warning' : 'success',
      eyebrow: formatJobLabel(item.jobKey),
      title: item.summary || item.jobKey,
      detail: `${item.jobKey} · ${item.triggerType}`,
      createdAt: item.finishedAt || item.startedAt,
      href: '/admin/automacoes'
    }))
  ]
    .sort((left, right) => Date.parse(right.createdAt || 0) - Date.parse(left.createdAt || 0))
    .slice(0, 30);

  return {
    checkedAt: new Date().toISOString(),
    summary: {
      leadMovements: leadActivities.length,
      taskMovements: latestTasks.length,
      approvals: latestApprovals.length,
      automationRuns: automationRuns.length,
      automationOperations: operations.summary.total,
      jobs: jobRuns.length,
      reviewBacklog: executionChains.filter((item) => item.reviewStatus !== 'done' && item.reviewTaskId).length,
      pendingIntegrations: pendingIntegrations.length,
      aiCalls: aiUsageRows.length,
      successfulFeedbacks: latestTasks.filter((item) => item.actionType === 'feedback' && item.outcome === 'yes').length,
      failedFeedbacks: latestTasks.filter((item) => item.actionType === 'feedback' && item.outcome === 'no').length,
      rejectedIdeas: latestTasks.filter((item) => item.actionType === 'rejected').length
    },
    timeline,
    leadActivities,
    latestTasks,
    latestApprovals,
    automationRuns,
    jobRuns,
    executionChains,
    aiUsage: aiUsageRows.map((item) => ({
      id: item.id,
      model: item.model,
      mode: item.mode,
      workflow: item.workflow || 'Geral',
      estimatedCost: Number(item.estimated_cost || 0),
      createdAt: item.created_at
    })),
    missions: missions.map((item) => ({
      id: item.id,
      date: item.date,
      summary: item.summary,
      topPriority: item.top_priority,
      createdAt: item.created_at
    })),
    operations,
    integrations: {
      checkedAt: integrationSnapshot.checkedAt,
      stageLabel: integrationSnapshot.summary.stageLabel,
      stageDescription: integrationSnapshot.summary.stageDescription,
      pending: pendingIntegrations
    }
  };
}

export async function getAdminLogsSnapshot() {
  const history = await getAdminHistorySnapshot();

  return {
    checkedAt: history.checkedAt,
    integrationHealth: history.integrations,
    aiUsage: history.aiUsage,
    automationRuns: history.automationRuns,
    jobRuns: history.jobRuns,
    executionChains: history.executionChains,
    leadActivities: history.leadActivities.slice(0, 10),
    taskState: history.latestTasks.slice(0, 10)
  };
}

export { formatDateTime };
