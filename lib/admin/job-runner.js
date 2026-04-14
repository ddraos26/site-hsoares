import 'server-only';

import { getAdminDecisionEngineSnapshot } from '@/lib/admin/decision-engine';
import { upsertDailyMission } from '@/lib/admin/daily-mission-store';
import { readAdminJobRuns, recordAdminJobRun, getAdminJobsSnapshot } from '@/lib/admin/job-run-store';
import {
  readAutomationOperations,
  updateAutomationOperation
} from '@/lib/admin/automation-operation-store';
import {
  onCycleEnd,
  onCycleStart,
  recordOperationalEngineEvent
} from '@/lib/admin/operational-engine-store';
import { dispatchAutomationOperation } from '@/lib/admin/operation-dispatch';
import { runOperationalAutomationEngine } from '@/lib/admin/operational-automation-engine';
import { capturePerformanceForTask, compareTaskPerformance, normalizePerformanceSnapshot, resolveTaskRecheckHours } from '@/lib/admin/task-performance';
import { readTasksDueForResultCheck, upsertAdminTask } from '@/lib/admin/task-definition-store';
import { readTaskStateEntries, recordTaskStateEntry } from '@/lib/admin/task-store';
import { runDailyGoogleAdsSyncJob } from '@/lib/admin/jobs/daily/sync-google-ads-job';
import { runDailyPageReviewJob } from '@/lib/admin/jobs/daily/page-review-job';
import { runDailyPagePreviewDispatchJob } from '@/lib/admin/jobs/daily/page-preview-dispatch-job';
import { adminOperatingMode, isAdminAdvisoryOnlyMode } from '@/lib/admin/operating-mode';
import { TASK_STATUS, normalizeTaskStatus } from '@/lib/admin/task-status';

function labelForJobKey(jobKey) {
  return (
    {
      'daily-google-ads-sync': 'Google Ads sync',
      'daily-page-review': 'Revisão de páginas',
      'daily-mission-refresh': 'Missão do dia',
      'operational-automation-engine': 'Motor de automações',
      'ready-operations-sweep': 'Fila pronta',
      'impact-review-monitor': 'Monitor de impacto',
      'task-result-recheck': 'Leitura de resultados',
      'admin-ops-cycle': 'Ciclo operacional'
    }[jobKey] || jobKey
  );
}

function buildRunDuration(startedAt, finishedAt) {
  return Math.max(0, Date.parse(finishedAt || startedAt || new Date().toISOString()) - Date.parse(startedAt || finishedAt || new Date().toISOString()));
}

function summarizeCycleCounts(runs = []) {
  const automationRun = runs.find((item) => item.jobKey === 'operational-automation-engine');
  const recheckRun = runs.find((item) => item.jobKey === 'task-result-recheck');
  const sweepRun = runs.find((item) => item.jobKey === 'ready-operations-sweep');

  const tasksCreatedLastRun = Number(automationRun?.payload?.createdTasks || 0);
  const automationsExecutedLastRun =
    Number(automationRun?.payload?.executedDirectly || 0) + Number(sweepRun?.payload?.processed || 0);
  const rechecksCompletedLastRun = Number(recheckRun?.payload?.finalized || 0);
  const errorsLastRun =
    runs.filter((item) => item.status === 'failed').length +
    Number(automationRun?.payload?.errors || 0);
  const warningsLastRun =
    runs.filter((item) => item.status === 'degraded' || item.status === 'skipped').length +
    Number(automationRun?.payload?.skippedDuplicates || 0) +
    Number(recheckRun?.payload?.waitingAgain || 0);

  return {
    tasksCreatedLastRun,
    automationsExecutedLastRun,
    rechecksCompletedLastRun,
    errorsLastRun,
    warningsLastRun
  };
}

function latestTaskEntryMap(entries = []) {
  const latest = new Map();

  for (const entry of entries) {
    if (!entry?.id) continue;
    latest.set(entry.id, entry);
  }

  return latest;
}

function isAutoDispatchEligible(operation) {
  if (isAdminAdvisoryOnlyMode()) return false;
  if (!operation || operation.status !== 'ready') return false;
  if (operation.requiresApproval) return false;
  if (operation.executionMode === 'automatic_safe') return true;
  if (operation.sourceType === 'integration') return true;
  return false;
}

async function runManagedJob({ jobKey, triggerType = 'manual', actor = 'system', handler }) {
  const startedAt = new Date().toISOString();

  try {
    const result = await handler();
    const normalized = {
      jobKey,
      triggerType,
      actor,
      status: result?.status || 'completed',
      summary: result?.summary || 'Job concluído.',
      payload: result?.payload || {},
      startedAt,
      finishedAt: new Date().toISOString()
    };

    const run = await recordAdminJobRun(normalized);
    return { ...run, payload: normalized.payload };
  } catch (error) {
    await recordOperationalEngineEvent({
      type: 'engine_error',
      source: 'system',
      message: `O motor falhou na etapa ${labelForJobKey(jobKey)}.`,
      impact: 'high',
      kind: 'error',
      payload: {
        jobKey,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    });

    const run = await recordAdminJobRun({
      jobKey,
      triggerType,
      actor,
      status: 'failed',
      summary: error instanceof Error ? error.message : 'Falha desconhecida ao executar job.',
      payload: {
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      startedAt,
      finishedAt: new Date().toISOString()
    });

    return run;
  }
}

export async function runDailyMissionRefreshJob({ triggerType = 'manual', actor = 'system' } = {}) {
  return runManagedJob({
    jobKey: 'daily-mission-refresh',
    triggerType,
    actor,
    handler: async () => {
      const snapshot = await getAdminDecisionEngineSnapshot();
      const mission = await upsertDailyMission(snapshot.mission);

      return {
        status: 'completed',
        summary: `Missão do dia atualizada com prioridade ${mission.topPriority || 'em definição'}.`,
        payload: {
          missionId: mission.id,
          date: mission.date,
          topPriority: mission.topPriority,
          approvalsWaiting: snapshot.mission.approvalsWaiting,
          actions: snapshot.mission.actions.slice(0, 3)
        }
      };
    }
  });
}

export async function runReadyOperationsSweepJob({ triggerType = 'manual', actor = 'system', limit = 12 } = {}) {
  return runManagedJob({
    jobKey: 'ready-operations-sweep',
    triggerType,
    actor,
    handler: async () => {
      if (isAdminAdvisoryOnlyMode()) {
        const operations = await readAutomationOperations({ limit: 60 });
        const suggestions = operations.filter((item) => item.status === 'ready').length;

        return {
          status: 'skipped',
          summary: `${adminOperatingMode.label}: o sistema nao executa a fila sozinho e deixa ${suggestions} sugestao(oes) prontas para revisao humana.`,
          payload: {
            scanned: operations.length,
            processed: 0,
            suggestions
          }
        };
      }

      const operations = await readAutomationOperations({ limit: 60 });
      const candidates = operations.filter(isAutoDispatchEligible).slice(0, limit);
      const outcomes = [];

      for (const item of candidates) {
        const outcome = await dispatchAutomationOperation({ id: item.id, actor });
        outcomes.push({
          id: item.id,
          title: item.title,
          status: outcome?.status || outcome?.operation?.status || 'completed',
          detail: outcome?.detail || outcome?.operation?.result?.detail || 'Operação processada no sweep.'
        });

        await recordOperationalEngineEvent({
          type: 'automation_executed',
          source: 'system',
          targetType: item.sourceType,
          targetId: item.sourceId,
          message: outcome?.detail || `O sistema executou automaticamente ${item.title}.`,
          impact: item.priority === 'Urgente' || item.priority === 'Alta' ? 'high' : 'medium',
          payload: {
            operationId: item.id,
            status: outcome?.status || outcome?.operation?.status || 'completed'
          }
        });
      }

      return {
        status: outcomes.some((item) => item.status === 'failed')
          ? 'degraded'
          : outcomes.some((item) => item.status === 'blocked')
            ? 'degraded'
            : 'completed',
        summary: outcomes.length
          ? `${outcomes.length} operação(ões) seguras foram processadas automaticamente.`
          : 'Nenhuma operação segura estava pronta para rodar agora.',
        payload: {
          scanned: operations.length,
          processed: outcomes.length,
          outcomes
        }
      };
    }
  });
}

export async function runImpactReviewMonitorJob({ triggerType = 'manual', actor = 'system' } = {}) {
  return runManagedJob({
    jobKey: 'impact-review-monitor',
    triggerType,
    actor,
    handler: async () => {
      if (isAdminAdvisoryOnlyMode()) {
        const [taskEntries, operations] = await Promise.all([
          readTaskStateEntries(),
          readAutomationOperations({ limit: 80 })
        ]);

        const latestTasks = latestTaskEntryMap(taskEntries);
        let dismissed = 0;

        for (const operation of operations) {
          const reviewTaskId =
            operation.payload?.reviewTaskId ||
            operation.payload?.nextTaskId ||
            operation.result?.nextTaskId ||
            null;

          if (!reviewTaskId) continue;

          const reviewEntry = latestTasks.get(reviewTaskId);
          if (reviewEntry?.status === 'done') continue;

          await recordTaskStateEntry({
            id: reviewTaskId,
            status: 'done',
            actor,
            note: 'Revisao encerrada automaticamente: o painel esta em modo consultivo e nao depende mais de execucao automatica.',
            title: reviewEntry?.title || operation.title,
            sourceLabel: reviewEntry?.sourceLabel || 'Revisao de impacto',
            href: reviewEntry?.href || operation.contextHref || operation.operationHref || '/admin/automacoes',
            priority: reviewEntry?.priority || operation.priority || 'Media'
          });

          await updateAutomationOperation({
            id: operation.id,
            result: {
              ...(operation.result || {}),
              reviewMonitor: {
                reviewTaskId,
                reviewStatus: 'dismissed_advisory_mode',
                reviewCreatedAt: reviewEntry?.createdAt || operation.completedAt || operation.updatedAt || operation.createdAt,
                isOverdue: false,
                monitoredAt: new Date().toISOString(),
                note: 'Backlog encerrado porque o painel agora funciona apenas como leitura e sugestao.'
              }
            }
          });

          dismissed += 1;
        }

        return {
          status: 'completed',
          summary: dismissed
            ? `${dismissed} revisao(oes) antigas foram encerradas para manter o painel em modo consultivo.`
            : `${adminOperatingMode.label}: nao havia backlog de revisao para limpar.`,
          payload: {
            dismissed
          }
        };
      }

      const [taskEntries, operations] = await Promise.all([
        readTaskStateEntries(),
        readAutomationOperations({ limit: 80 })
      ]);

      const latestTasks = latestTaskEntryMap(taskEntries);
      const now = Date.now();
      const reviewWindowMs = 24 * 60 * 60 * 1000;
      let tracked = 0;
      let pending = 0;
      let overdue = 0;
      let done = 0;

      for (const operation of operations) {
        const reviewTaskId =
          operation.payload?.reviewTaskId ||
          operation.payload?.nextTaskId ||
          operation.result?.nextTaskId ||
          null;

        if (!reviewTaskId) continue;
        tracked += 1;

        const reviewEntry = latestTasks.get(reviewTaskId);
        const reviewStatus = reviewEntry?.status || 'pending';
        const reviewCreatedAt = reviewEntry?.createdAt || operation.completedAt || operation.updatedAt || operation.createdAt;
        const isOverdue = reviewStatus !== 'done' && now - Date.parse(reviewCreatedAt || 0) > reviewWindowMs;

        if (reviewStatus === 'done') {
          done += 1;
        } else if (isOverdue) {
          overdue += 1;
        } else {
          pending += 1;
        }

        await updateAutomationOperation({
          id: operation.id,
          result: {
            ...(operation.result || {}),
            reviewMonitor: {
              reviewTaskId,
              reviewStatus,
              reviewCreatedAt,
              isOverdue,
              monitoredAt: new Date().toISOString()
            }
          }
        });
      }

      return {
        status: overdue > 0 ? 'degraded' : 'completed',
        summary:
          tracked > 0
            ? `${tracked} revisões foram monitoradas; ${overdue} estão vencidas e ${pending} seguem aguardando resposta.`
            : 'Nenhuma revisão pós-execução precisou de monitoramento neste ciclo.',
        payload: {
          tracked,
          pending,
          overdue,
          done
        }
      };
    }
  });
}

export async function runOperationalAutomationEngineJob({ triggerType = 'manual', actor = 'system' } = {}) {
  return runManagedJob({
    jobKey: 'operational-automation-engine',
    triggerType,
    actor,
    handler: async () => runOperationalAutomationEngine({ actor })
  });
}

export async function runTaskResultRecheckJob({ triggerType = 'manual', actor = 'system' } = {}) {
  return runManagedJob({
    jobKey: 'task-result-recheck',
    triggerType,
    actor,
    handler: async () => {
      const [taskEntries, dueTasks] = await Promise.all([
        readTaskStateEntries(),
        readTasksDueForResultCheck({ limit: 40 })
      ]);

      const latestTasks = latestTaskEntryMap(taskEntries);
      let waitingAgain = 0;
      let finalized = 0;

      for (const task of dueTasks) {
        const latestStatus = normalizeTaskStatus(latestTasks.get(task.id)?.status);
        if (latestStatus !== TASK_STATUS.WAITING_RESULT) continue;

        const currentSnapshot = normalizePerformanceSnapshot(task.performanceSnapshot || {});
        const attempts = Number(currentSnapshot.retryCount || 0);
        const after = await capturePerformanceForTask(task);
        const comparison = compareTaskPerformance({
          task,
          before: currentSnapshot.before,
          after,
          attempts
        });

        if (comparison.result === 'waiting') {
          const recheckAfterHours = resolveTaskRecheckHours(task);
          const dueRecheckAt = new Date(Date.now() + recheckAfterHours * 60 * 60 * 1000).toISOString();

          await upsertAdminTask({
            ...task,
            performanceSnapshot: normalizePerformanceSnapshot({
              ...currentSnapshot,
              after,
              result: 'waiting',
              summary: comparison.summary,
              nextRecommendation: comparison.nextRecommendation,
              retryCount: attempts + 1,
              dueRecheckAt,
              lastComparedAt: new Date().toISOString()
            }),
            resultDueAt: dueRecheckAt
          });

          await recordTaskStateEntry({
            id: task.id,
            status: TASK_STATUS.WAITING_RESULT,
            actor,
            note: comparison.summary,
            actionType: 'result_review',
            outcome: 'waiting',
            title: task.title,
            sourceLabel: task.sourceLabel,
            href: task.href,
            priority: task.priority
          });

          await recordOperationalEngineEvent({
            type: 'recheck_done',
            source: 'system',
            targetType: task.targetType,
            targetId: task.targetId,
            message: `Releitura concluída: ${task.targetLabel || task.title} ainda não tem massa crítica suficiente.`,
            impact: 'low',
            payload: {
              taskId: task.id,
              result: 'waiting'
            }
          });

          waitingAgain += 1;
          continue;
        }

        await upsertAdminTask({
          ...task,
          performanceSnapshot: normalizePerformanceSnapshot({
            ...currentSnapshot,
            after,
            result: comparison.result,
            summary: comparison.summary,
            nextRecommendation: comparison.nextRecommendation,
            retryCount: attempts + 1,
            dueRecheckAt: null,
            lastComparedAt: new Date().toISOString()
          }),
          resultDueAt: null
        });

        await recordTaskStateEntry({
          id: task.id,
          status: TASK_STATUS.DONE,
          actor,
          note: comparison.summary,
          actionType: 'result_review',
          outcome: comparison.result,
          title: task.title,
          sourceLabel: task.sourceLabel,
          href: task.href,
          priority: task.priority
        });

        await recordOperationalEngineEvent({
          type: 'result_closed',
          source: 'system',
          targetType: task.targetType,
          targetId: task.targetId,
          message:
            comparison.result === 'negative'
              ? `Releitura concluída: ${task.targetLabel || task.title} ainda sem conversão relevante.`
              : comparison.result === 'positive'
                ? `Releitura concluída: ${task.targetLabel || task.title} mostrou ganho inicial.`
                : `Releitura concluída: ${task.targetLabel || task.title} ficou neutra neste recorte.`,
          impact: comparison.result === 'positive' ? 'high' : comparison.result === 'negative' ? 'medium' : 'low',
          payload: {
            taskId: task.id,
            result: comparison.result
          }
        });

        finalized += 1;
      }

      return {
        status: 'completed',
        summary:
          finalized || waitingAgain
            ? `${finalized} resultado(s) foram fechados e ${waitingAgain} continuaram aguardando mais janela.`
            : 'Nenhuma task estava pronta para releitura automática agora.',
        payload: {
          scanned: dueTasks.length,
          finalized,
          waitingAgain
        }
      };
    }
  });
}

export async function runDailyPagePreviewDispatchCycle({ triggerType = 'manual', actor = 'system' } = {}) {
  return runManagedJob({
    jobKey: 'daily-page-preview-dispatch',
    triggerType,
    actor,
    handler: runDailyPagePreviewDispatchJob
  });
}

export async function runGoogleAdsSyncManagedJob({ triggerType = 'manual', actor = 'system' } = {}) {
  return runManagedJob({
    jobKey: 'daily-google-ads-sync',
    triggerType,
    actor,
    handler: async () => {
      const result = await runDailyGoogleAdsSyncJob();

      return {
        status: result.status || 'completed',
        summary: result.summary,
        payload: {
          recordsWritten: result.recordsWritten || 0,
          startedAt: result.startedAt,
          finishedAt: result.finishedAt
        }
      };
    }
  });
}

export async function runAdminOpsJobCycle({ triggerType = 'manual', actor = 'system' } = {}) {
  const startedAt = new Date().toISOString();
  const runs = [];
  await onCycleStart({ actor, triggerType });

  try {
    runs.push(await runGoogleAdsSyncManagedJob({ triggerType, actor }));
    runs.push(await runDailyPageReviewJob({ triggerType, actor }));
    runs.push(await runDailyMissionRefreshJob({ triggerType, actor }));
    runs.push(await runOperationalAutomationEngineJob({ triggerType, actor }));
    runs.push(await runReadyOperationsSweepJob({ triggerType, actor }));
    runs.push(await runImpactReviewMonitorJob({ triggerType, actor }));
    runs.push(await runTaskResultRecheckJob({ triggerType, actor }));

    const status = runs.some((item) => item.status === 'failed')
      ? 'failed'
      : runs.some((item) => item.status === 'degraded')
        ? 'degraded'
        : 'completed';

    const summary =
      status === 'completed'
        ? 'Ciclo automático concluído com sucesso.'
        : status === 'degraded'
          ? 'Ciclo automático concluído com ressalvas.'
          : 'Ciclo automático encontrou falhas.';
    const finishedAt = new Date().toISOString();
    const counts = summarizeCycleCounts(runs);

    const cycleRun = await recordAdminJobRun({
      jobKey: 'admin-ops-cycle',
      triggerType,
      actor,
      status,
      summary,
      payload: {
        runs: runs.map((item) => ({
          jobKey: item.jobKey,
          status: item.status,
          summary: item.summary
        }))
      },
      startedAt,
      finishedAt
    });

    await onCycleEnd({
      actor,
      status: status === 'failed' ? 'failed' : 'healthy',
      startedAt,
      finishedAt,
      summary,
      counts,
      lastErrorSummary: status === 'failed' ? summary : '',
      debug: {
        steps: runs.map((item) => ({
          jobKey: item.jobKey,
          label: labelForJobKey(item.jobKey),
          status: item.status,
          durationMs: buildRunDuration(item.startedAt, item.finishedAt),
          summary: item.summary,
          payload: item.payload || {}
        })),
        rules: runs.find((item) => item.jobKey === 'operational-automation-engine')?.payload?.ruleStats || [],
        ignored: runs.find((item) => item.jobKey === 'operational-automation-engine')?.payload?.ignored || [],
        deduplications: runs.find((item) => item.jobKey === 'operational-automation-engine')?.payload?.deduplications || []
      }
    });

    return {
      cycle: cycleRun,
      runs,
      snapshot: await getAdminJobsSnapshot()
    };
  } catch (error) {
    const finishedAt = new Date().toISOString();
    const counts = summarizeCycleCounts(runs);
    const cycleRun = await recordAdminJobRun({
      jobKey: 'admin-ops-cycle',
      triggerType,
      actor,
      status: 'failed',
      summary: error instanceof Error ? error.message : 'Falha desconhecida no ciclo automático.',
      payload: {
        runs: runs.map((item) => ({
          jobKey: item.jobKey,
          status: item.status,
          summary: item.summary
        }))
      },
      startedAt,
      finishedAt
    });

    await onCycleEnd({
      actor,
      status: 'failed',
      startedAt,
      finishedAt,
      summary: error instanceof Error ? error.message : 'Falha desconhecida no ciclo automático.',
      counts: {
        ...counts,
        errorsLastRun: (counts.errorsLastRun || 0) + 1
      },
      lastErrorSummary: error instanceof Error ? error.message : 'Falha desconhecida no ciclo automático.',
      debug: {
        steps: runs.map((item) => ({
          jobKey: item.jobKey,
          label: labelForJobKey(item.jobKey),
          status: item.status,
          durationMs: buildRunDuration(item.startedAt, item.finishedAt),
          summary: item.summary,
          payload: item.payload || {}
        })),
        rules: runs.find((item) => item.jobKey === 'operational-automation-engine')?.payload?.ruleStats || [],
        ignored: runs.find((item) => item.jobKey === 'operational-automation-engine')?.payload?.ignored || [],
        deduplications: runs.find((item) => item.jobKey === 'operational-automation-engine')?.payload?.deduplications || []
      }
    });

    return {
      cycle: cycleRun,
      runs,
      snapshot: await getAdminJobsSnapshot()
    };
  }
}

export async function getLastAdminOpsCycle() {
  const items = await readAdminJobRuns({ limit: 20 });
  return items.find((item) => item.jobKey === 'admin-ops-cycle') || null;
}
