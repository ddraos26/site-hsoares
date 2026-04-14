import { NextResponse } from 'next/server';
import { getAdminNextFocus } from '@/lib/admin/next-focus';
import { recordOperationalEngineEvent } from '@/lib/admin/operational-engine-store';
import { getAdminTasksSnapshot } from '@/lib/admin/tasks-overview';
import {
  createDerivedTaskFromSource,
  materializeTaskFromInput,
  upsertAdminTask
} from '@/lib/admin/task-definition-store';
import { normalizePerformanceSnapshot, resolveTaskRecheckHours, resolveTaskWindowHours } from '@/lib/admin/task-performance';
import { recordTaskStateEntry } from '@/lib/admin/task-store';
import { normalizeTaskStatus, TASK_STATUS } from '@/lib/admin/task-status';

export const dynamic = 'force-dynamic';

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeStringList(value) {
  return (Array.isArray(value) ? value : [])
    .map((item) => normalizeText(item))
    .filter(Boolean)
    .slice(0, 12);
}

function normalizePriority(value) {
  const raw = normalizeText(value).toLowerCase();

  return (
    {
      urgente: 'Urgente',
      alta: 'Alta',
      média: 'Média',
      media: 'Média',
      baixa: 'Baixa'
    }[raw] || normalizeText(value)
  );
}

function normalizeBadges(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function formatScheduledRecheck(value) {
  if (!value) return 'na próxima releitura';

  try {
    return new Date(value).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'na próxima releitura';
  }
}

function buildTaskPayload(body = {}) {
  return {
    id: normalizeText(body?.id),
    title: normalizeText(body?.title),
    description: normalizeText(body?.description),
    recommendation: normalizeText(body?.recommendation),
    sourceType: normalizeText(body?.sourceType),
    sourceLabel: normalizeText(body?.sourceLabel),
    targetType: normalizeText(body?.targetType),
    targetId: normalizeText(body?.targetId),
    targetLabel: normalizeText(body?.targetLabel),
    href: normalizeText(body?.href),
    whereToDo: normalizeText(body?.whereToDo),
    guideSteps: normalizeStringList(body?.guideSteps),
    metadata: normalizeStringList(body?.metadata),
    badges: normalizeBadges(body?.badges),
    priority: normalizePriority(body?.priority),
    ownerLabel: normalizeText(body?.ownerLabel),
    dueLabel: normalizeText(body?.dueLabel),
    requiresApproval: Boolean(body?.requiresApproval),
    sourceTaskId: normalizeText(body?.sourceTaskId) || null,
    reopenReason: normalizeText(body?.reopenReason),
    reopenedFromResult: normalizeText(body?.reopenedFromResult),
    automationRuleId: normalizeText(body?.automationRuleId),
    automationMode: normalizeText(body?.automationMode),
    isAutomatic: Boolean(body?.isAutomatic),
    createdBy: normalizeText(body?.createdBy) || 'admin',
    payload: body?.payload && typeof body.payload === 'object' ? body.payload : {}
  };
}

function buildWaitingSnapshot(task, note = '', manualOutcome = '') {
  const recheckAfterHours = resolveTaskRecheckHours(task);
  const dueRecheckAt = new Date(Date.now() + recheckAfterHours * 60 * 60 * 1000).toISOString();
  const current = normalizePerformanceSnapshot(task.performanceSnapshot || {});
  const summary = note
    ? `${note} Releitura agendada para ${formatScheduledRecheck(dueRecheckAt)}.`
    : `Execução concluída. Releitura agendada para ${formatScheduledRecheck(dueRecheckAt)}.`;

  return {
    dueRecheckAt,
    performanceSnapshot: normalizePerformanceSnapshot({
      ...current,
      targetType: task.targetType,
      targetId: task.targetId,
      windowHours: current.windowHours || resolveTaskWindowHours(task),
      recheckAfterHours,
      dueRecheckAt,
      result: 'waiting',
      summary,
      nextRecommendation: `Esperar mais ${recheckAfterHours}h antes da próxima leitura.`,
      manualOutcome: normalizeText(manualOutcome) || null
    })
  };
}

async function buildNextFocus() {
  return getAdminNextFocus({ basePath: '/admin' });
}

export async function GET() {
  try {
    const snapshot = await getAdminTasksSnapshot();
    return NextResponse.json(snapshot);
  } catch (error) {
    console.error('admin tasks error', error);
    return NextResponse.json(
      {
        error: 'Falha ao carregar a fila de tarefas.',
        detail: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const id = normalizeText(body?.id);
    const status = normalizeTaskStatus(body?.status);
    const actionType = normalizeText(body?.actionType);
    const outcome = normalizeText(body?.outcome);
    const note = normalizeText(body?.note);

    if (!id || !Object.values(TASK_STATUS).includes(status)) {
      return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
    }

    const taskInput = buildTaskPayload(body);
    const sourceTask = await materializeTaskFromInput(taskInput);

    if (status === TASK_STATUS.REOPENED) {
      const derivedTask = await createDerivedTaskFromSource({
        sourceTaskId: sourceTask.id,
        reopenReason: normalizeText(body?.reopenReason) || 'Reabertura manual',
        reopenedFromResult: normalizeText(body?.reopenedFromResult) || 'manual',
        priority: normalizePriority(body?.priorityOverride) || normalizePriority(body?.priority),
        note,
        actor: 'admin'
      });

      const entry = await recordTaskStateEntry({
        id: derivedTask.id,
        status: TASK_STATUS.PENDING,
        actor: 'admin',
        note: note || 'Nova rodada criada a partir da task anterior.',
        actionType: actionType || 'reopened',
        outcome: normalizeText(body?.reopenedFromResult),
        title: derivedTask.title,
        sourceLabel: derivedTask.sourceLabel,
        href: derivedTask.href,
        priority: derivedTask.priority
      });

      await recordOperationalEngineEvent({
        type: 'task_created',
        source: 'manual',
        targetType: derivedTask.targetType,
        targetId: derivedTask.targetId,
        message:
          normalizeText(body?.reopenedFromResult) === 'negative'
            ? `Nova rodada aberta após resultado negativo em ${derivedTask.targetLabel || derivedTask.title}.`
            : `Nova rodada aberta para ${derivedTask.targetLabel || derivedTask.title}.`,
        impact: 'medium',
        payload: {
          taskId: derivedTask.id,
          sourceTaskId: sourceTask.id
        }
      });

      return NextResponse.json({
        ok: true,
        entry,
        task: derivedTask,
        nextFocus: await buildNextFocus()
      });
    }

    if (status === TASK_STATUS.DONE) {
      const { dueRecheckAt, performanceSnapshot } = buildWaitingSnapshot(sourceTask, note, outcome);

      const task = await upsertAdminTask({
        ...sourceTask,
        payload: {
          ...(sourceTask.payload || {}),
          lastCompletionNote: note || '',
          lastManualOutcome: outcome || '',
          lastCompletedAt: new Date().toISOString()
        },
        performanceSnapshot,
        resultDueAt: dueRecheckAt
      });

      const entry = await recordTaskStateEntry({
        id: task.id,
        status: TASK_STATUS.WAITING_RESULT,
        actor: 'admin',
        note: performanceSnapshot.summary,
        actionType: actionType || 'completed',
        outcome,
        title: task.title,
        sourceLabel: task.sourceLabel,
        href: task.href,
        priority: task.priority
      });

      await recordOperationalEngineEvent({
        type: 'task_moved',
        source: 'manual',
        targetType: task.targetType,
        targetId: task.targetId,
        message: `${task.targetLabel || task.title} saiu da fila e entrou em aguardando resultado.`,
        impact: 'low',
        payload: {
          taskId: task.id,
          resultDueAt: dueRecheckAt
        }
      });

      return NextResponse.json({
        ok: true,
        entry,
        task,
        nextFocus: await buildNextFocus()
      });
    }

    const entry = await recordTaskStateEntry({
      id: sourceTask.id,
      status,
      actor: 'admin',
      note,
      actionType,
      outcome,
      title: sourceTask.title,
      sourceLabel: sourceTask.sourceLabel,
      href: sourceTask.href,
      priority: sourceTask.priority
    });

    return NextResponse.json({
      ok: true,
      entry,
      task: sourceTask,
      nextFocus: await buildNextFocus()
    });
  } catch (error) {
    console.error('admin task state error', error);
    return NextResponse.json(
      {
        error: 'Falha ao atualizar a task.',
        detail: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
