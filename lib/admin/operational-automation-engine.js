import 'server-only';

import { formatPageLabel } from '@/lib/admin/page-presentation';
import { recordOperationalEngineEvent } from '@/lib/admin/operational-engine-store';
import { recordAutomationExecution } from '@/lib/admin/approval-execution';
import { getAdminPagesSnapshot } from '@/lib/admin/pages-overview';
import { getAdminProductsSnapshot } from '@/lib/admin/products-overview';
import {
  findAdminTaskByDedupeKey,
  materializeTaskFromInput,
  upsertAdminTask
} from '@/lib/admin/task-definition-store';
import { recordTaskStateEntry, readTaskStateEntries } from '@/lib/admin/task-store';
import { TASK_STATUS, normalizeTaskStatus } from '@/lib/admin/task-status';
import { applySiteMutation, readSiteAutomationState } from '@/lib/site-automation';

const AUTOMATION_RULES = {
  TRAFFIC_ZERO_LEAD: 'auto-task-conversion-bottleneck',
  SCALE_LOW_VOLUME: 'auto-scale-suggestion',
  HIGH_READ_LOW_ACTION: 'auto-floating-cta'
};

const DUPLICATE_BLOCK_STATUSES = new Set([
  TASK_STATUS.PENDING,
  TASK_STATUS.IN_PROGRESS,
  TASK_STATUS.BLOCKED,
  TASK_STATUS.WAITING_RESULT
]);

function normalizeText(value) {
  return String(value || '').trim();
}

function latestTaskEntryMap(entries = []) {
  const latest = new Map();

  for (const entry of entries) {
    if (!entry?.id) continue;
    latest.set(entry.id, entry);
  }

  return latest;
}

function buildMetricsMetadata(item) {
  return [
    `${Number(item?.views || 0)} visitas`,
    `${Number(item?.clicks || 0)} cliques`,
    `${Number(item?.leads || 0)} leads`
  ];
}

async function logAutomation({ status = 'success', ruleId, title, detail, targetType = '', targetId = '', taskId = '', result = {} }) {
  return recordAutomationExecution({
    status,
    payload: {
      ruleId,
      title,
      detail,
      targetType,
      targetId,
      taskId
    },
    result: {
      detail,
      ...result
    }
  });
}

async function ensureGuidedTask({
  actor = 'system',
  latestEntries = new Map(),
  ruleId,
  dedupeKey,
  taskPayload,
  createdNote,
  duplicateDetail,
  eventMessage,
  eventImpact = 'medium'
}) {
  const existing = await findAdminTaskByDedupeKey(dedupeKey);
  const existingStatus = normalizeTaskStatus(existing ? latestEntries.get(existing.id)?.status : '');

  if (existing && DUPLICATE_BLOCK_STATUSES.has(existingStatus)) {
    await upsertAdminTask({
      ...existing,
      metadata: taskPayload.metadata || existing.metadata,
      lastSeenAt: new Date().toISOString()
    });

    await logAutomation({
      status: 'warning',
      ruleId,
      title: duplicateDetail || `A tarefa automática para ${taskPayload.targetLabel || taskPayload.title} já estava ativa.`,
      detail: duplicateDetail || 'Nenhuma duplicata foi criada porque o mesmo alvo já está rodando na operação.',
      targetType: taskPayload.targetType,
      targetId: taskPayload.targetId,
      taskId: existing.id,
      result: {
        action: 'dedupe_skip',
        taskId: existing.id,
        taskStatus: existingStatus
      }
    });

    return {
      created: false,
      skipped: true,
      task: existing,
      deduplication: {
        label: taskPayload.targetLabel || taskPayload.title,
        targetId: taskPayload.targetId,
        reason: duplicateDetail || 'Task já ativa para o mesmo alvo.'
      }
    };
  }

  const task = await materializeTaskFromInput({
    ...taskPayload,
    dedupeKey,
    automationRuleId: ruleId,
    automationMode: taskPayload.automationMode || 'automatic',
    isAutomatic: true,
    badges: [...(taskPayload.badges || []), 'automatic'],
    createdBy: actor
  });

  await recordTaskStateEntry({
    id: task.id,
    status: TASK_STATUS.PENDING,
    actor,
    note: createdNote || 'Task criada automaticamente pelo sistema.',
    actionType: 'auto_created',
    title: task.title,
    sourceLabel: task.sourceLabel,
    href: task.href,
    priority: task.priority
  });

  await logAutomation({
    status: 'success',
    ruleId,
    title: task.title,
    detail: createdNote || 'O sistema criou uma nova task guiada.',
    targetType: task.targetType,
    targetId: task.targetId,
    taskId: task.id,
    result: {
      action: 'task_created',
      taskId: task.id
    }
  });

  await recordOperationalEngineEvent({
    type: 'task_created',
    source: 'automation_engine',
    targetType: task.targetType,
    targetId: task.targetId,
    message: eventMessage || createdNote || 'Criamos uma tarefa automática para a operação.',
    impact: eventImpact,
    payload: {
      ruleId,
      taskId: task.id
    }
  });

  return { created: true, skipped: false, task };
}

function isEligibleTrafficZeroLead(page) {
  return (
    Number(page?.views || 0) >= 80 &&
    Number(page?.leads || 0) === 0 &&
    normalizeText(page?.pageType) !== 'Institucional' &&
    normalizeText(page?.pageType) !== 'Blog'
  );
}

function scaleScore(item, type) {
  const leadRate = Number(item?.leadRate || 0);
  const leads = Number(item?.leads || 0);
  const volume = Number(item?.views || item?.clicks || 0);
  const typeBoost = type === 'product' ? 4 : 0;
  return Number((leadRate * 6) + (leads * 14) - (volume * 0.03) + typeBoost);
}

function isEligiblePageScale(page) {
  return Number(page?.leads || 0) >= 1 && Number(page?.leadRate || 0) >= 1.2 && Number(page?.views || 0) <= 180;
}

function isEligibleProductScale(product) {
  return Number(product?.leads || 0) >= 1 && Number(product?.leadRate || 0) >= 6 && Number(product?.views || 0) <= 180;
}

function isEligibleHighReadLowAction(page) {
  return (
    normalizeText(page?.pageType) === 'Blog' &&
    Number(page?.views || 0) >= 120 &&
    Number(page?.leads || 0) === 0 &&
    (Number(page?.clicks || 0) <= 2 || Number(page?.clickRate || 0) < 1)
  );
}

function hasFloatingWhatsappForPath(state, pagePath) {
  const targetPaths = Array.isArray(state?.floatingWhatsappCta?.targetPaths) ? state.floatingWhatsappCta.targetPaths : [];
  return Boolean(state?.floatingWhatsappCta?.enabled) && (targetPaths.includes('*') || targetPaths.includes(pagePath));
}

async function runTrafficZeroLeadRule({ pages, actor, latestEntries }) {
  const candidates = pages.filter(isEligibleTrafficZeroLead).slice(0, 3);
  const outcomes = [];
  const stats = {
    id: AUTOMATION_RULES.TRAFFIC_ZERO_LEAD,
    label: 'Tráfego sem conversão',
    evaluated: pages.length,
    candidates: candidates.length,
    created: 0,
    executed: 0,
    skipped: 0,
    errors: 0
  };
  const deduplications = [];
  const ignored = candidates.length
    ? []
    : [
        {
          label: 'Tráfego sem conversão',
          reason: 'Nenhuma página com tráfego relevante e zero lead apareceu neste ciclo.',
          count: pages.length
        }
      ];

  for (const page of candidates) {
    const pageLabel = formatPageLabel(page.pagePath);
    const detail = `${pageLabel} recebe atenção, mas ainda não gera lead.`;

    try {
      const outcome = await ensureGuidedTask({
        actor,
        latestEntries,
        ruleId: AUTOMATION_RULES.TRAFFIC_ZERO_LEAD,
        dedupeKey: `auto:traffic-zero-lead:${page.pagePath}`,
        createdNote: `Task automática criada porque ${detail}`,
        duplicateDetail: `A task automática de correção para ${pageLabel} já estava ativa.`,
        eventMessage: `Criamos uma tarefa para corrigir a página ${pageLabel} (tráfego sem conversão).`,
        eventImpact: Number(page.views || 0) >= 160 ? 'high' : 'medium',
        taskPayload: {
          title: `Corrigir conversão em ${pageLabel}`,
          description: 'Essa página está desperdiçando tráfego. Corrija headline, prova de valor e CTA antes de investir mais.',
          recommendation: 'Revisar headline, CTA principal, prova de valor acima da dobra e a oferta/comparação se existir.',
          sourceType: 'page',
          sourceLabel: 'Automações',
          targetType: 'page',
          targetId: page.pagePath,
          targetLabel: pageLabel,
          href: page.links?.contextHref || '',
          whereToDo: 'VSCode',
          guideSteps: [
            'Abrir a rota indicada.',
            'Revisar headline e CTA principal.',
            'Revisar prova de valor acima da dobra.',
            'Revisar comparação ou oferta se existir.',
            'Salvar, revisar visualmente e voltar ao admin.'
          ],
          metadata: [...buildMetricsMetadata(page), page.pageType || 'Página'],
          priority: Number(page.views || 0) >= 160 ? 'Alta' : 'Média',
          ownerLabel: 'Sistema',
          dueLabel: 'Hoje',
          payload: {
            pageType: page.pageType,
            reason: 'traffic_zero_lead',
            metrics: {
              views: page.views,
              clicks: page.clicks,
              leads: page.leads,
              leadRate: page.leadRate
            }
          }
        }
      });

      outcomes.push(outcome);
      if (outcome.created) stats.created += 1;
      if (outcome.skipped) {
        stats.skipped += 1;
        if (outcome.deduplication) deduplications.push(outcome.deduplication);
      }
    } catch (error) {
      stats.errors += 1;
      await logAutomation({
        status: 'failed',
        ruleId: AUTOMATION_RULES.TRAFFIC_ZERO_LEAD,
        title: `Falha ao criar task para ${pageLabel}`,
        detail: error instanceof Error ? error.message : 'Erro desconhecido na automação.',
        targetType: 'page',
        targetId: page.pagePath
      });
      await recordOperationalEngineEvent({
        type: 'engine_error',
        source: 'automation_engine',
        targetType: 'page',
        targetId: page.pagePath,
        message: `Falha ao criar tarefa automática para ${pageLabel}.`,
        impact: 'high',
        kind: 'error',
        payload: {
          ruleId: AUTOMATION_RULES.TRAFFIC_ZERO_LEAD,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        }
      });
    }
  }

  return { outcomes, stats, deduplications, ignored };
}

async function runScaleLowVolumeRule({ pages, products, actor, latestEntries }) {
  const pageCandidate = [...pages]
    .filter(isEligiblePageScale)
    .sort((left, right) => scaleScore(right, 'page') - scaleScore(left, 'page'))[0];
  const productCandidate = [...products]
    .filter(isEligibleProductScale)
    .sort((left, right) => scaleScore(right, 'product') - scaleScore(left, 'product'))[0];

  const candidates = [
    pageCandidate
      ? {
          type: 'page',
          id: pageCandidate.pagePath,
          label: formatPageLabel(pageCandidate.pagePath),
          href: pageCandidate.links?.contextHref || '',
          views: pageCandidate.views,
          clicks: pageCandidate.clicks,
          leads: pageCandidate.leads,
          leadRate: pageCandidate.leadRate,
          metrics: buildMetricsMetadata(pageCandidate)
        }
      : null,
    productCandidate
      ? {
          type: 'product',
          id: productCandidate.slug,
          label: productCandidate.name,
          href: productCandidate.links?.contextHref || '',
          views: productCandidate.views,
          clicks: productCandidate.clicks,
          leads: productCandidate.leads,
          leadRate: productCandidate.leadRate,
          metrics: buildMetricsMetadata(productCandidate)
        }
      : null
  ].filter(Boolean);

  const outcomes = [];
  const stats = {
    id: AUTOMATION_RULES.SCALE_LOW_VOLUME,
    label: 'Boa conversão com pouco volume',
    evaluated: pages.length + products.length,
    candidates: candidates.length,
    created: 0,
    executed: 0,
    skipped: 0,
    errors: 0
  };
  const deduplications = [];
  const ignored = candidates.length
    ? []
    : [
        {
          label: 'Boa conversão com pouco volume',
          reason: 'Nenhuma página ou produto mostrou sinal suficiente para escala controlada neste ciclo.',
          count: pages.length + products.length
        }
      ];

  for (const candidate of candidates) {
    try {
      const outcome = await ensureGuidedTask({
        actor,
        latestEntries,
        ruleId: AUTOMATION_RULES.SCALE_LOW_VOLUME,
        dedupeKey: `auto:scale-low-volume:${candidate.type}:${candidate.id}`,
        createdNote: `${candidate.label} já mostrou sinal suficiente e entrou na fila de escala controlada.`,
        duplicateDetail: `A task automática de escala para ${candidate.label} já estava ativa.`,
        eventMessage: `Criamos uma tarefa para escalar ${candidate.label} com aumento controlado de tráfego.`,
        eventImpact: Number(candidate.leads || 0) >= 2 ? 'high' : 'medium',
        taskPayload: {
          title: `Escalar ${candidate.label} com controle`,
          description: 'Essa frente já mostra resposta comercial com pouco volume. Próximo passo: testar aumento controlado de tráfego.',
          recommendation: 'Abrir a campanha associada, revisar verba/distribuição e aplicar aumento controlado.',
          sourceType: candidate.type,
          sourceLabel: 'Automações',
          targetType: candidate.type,
          targetId: candidate.id,
          targetLabel: candidate.label,
          href: candidate.href,
          whereToDo: 'Google Ads',
          guideSteps: [
            'Abrir a campanha ligada à página ou produto.',
            'Revisar verba e distribuição atuais.',
            'Aplicar um aumento controlado.',
            'Salvar a alteração.',
            'Voltar ao admin e marcar como feito.'
          ],
          metadata: [...candidate.metrics, `Lead rate ${Number(candidate.leadRate || 0).toFixed(2)}%`],
          priority: Number(candidate.leads || 0) >= 2 ? 'Alta' : 'Média',
          ownerLabel: 'Sistema',
          dueLabel: 'Hoje',
          payload: {
            reason: 'scale_low_volume',
            metrics: {
              views: candidate.views,
              clicks: candidate.clicks,
              leads: candidate.leads,
              leadRate: candidate.leadRate
            }
          }
        }
      });

      outcomes.push(outcome);
      if (outcome.created) stats.created += 1;
      if (outcome.skipped) {
        stats.skipped += 1;
        if (outcome.deduplication) deduplications.push(outcome.deduplication);
      }
    } catch (error) {
      stats.errors += 1;
      await logAutomation({
        status: 'failed',
        ruleId: AUTOMATION_RULES.SCALE_LOW_VOLUME,
        title: `Falha ao criar escala para ${candidate.label}`,
        detail: error instanceof Error ? error.message : 'Erro desconhecido na automação.',
        targetType: candidate.type,
        targetId: candidate.id
      });
      await recordOperationalEngineEvent({
        type: 'engine_error',
        source: 'automation_engine',
        targetType: candidate.type,
        targetId: candidate.id,
        message: `Falha ao criar a tarefa de escala para ${candidate.label}.`,
        impact: 'high',
        kind: 'error',
        payload: {
          ruleId: AUTOMATION_RULES.SCALE_LOW_VOLUME,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        }
      });
    }
  }

  return { outcomes, stats, deduplications, ignored };
}

async function runHighReadLowActionRule({ pages, actor, latestEntries }) {
  const state = await readSiteAutomationState();
  const candidates = pages.filter(isEligibleHighReadLowAction).slice(0, 3);
  const outcomes = [];
  const stats = {
    id: AUTOMATION_RULES.HIGH_READ_LOW_ACTION,
    label: 'Leitura alta e baixa ação',
    evaluated: pages.length,
    candidates: candidates.length,
    created: 0,
    executed: 0,
    skipped: 0,
    errors: 0
  };
  const deduplications = [];
  const ignored = candidates.length
    ? []
    : [
        {
          label: 'Leitura alta e baixa ação',
          reason: 'Nenhum conteúdo com leitura forte e baixa ação apareceu neste ciclo.',
          count: pages.length
        }
      ];

  for (const page of candidates) {
    const pageLabel = formatPageLabel(page.pagePath);
    try {
      if (!hasFloatingWhatsappForPath(state, page.pagePath)) {
        const mutation = await applySiteMutation({
          mutation: {
            key: 'floating_whatsapp_cta',
            targetPaths: [page.pagePath],
            label: 'Falar no WhatsApp'
          },
          actor,
          rationale: `Conteúdo com leitura alta e baixa ação em ${pageLabel}.`
        });

        await logAutomation({
          status: 'success',
          ruleId: AUTOMATION_RULES.HIGH_READ_LOW_ACTION,
          title: `CTA flutuante ativado em ${pageLabel}`,
          detail: mutation.detail || 'O sistema ativou o CTA flutuante automaticamente.',
          targetType: 'content',
          targetId: page.pagePath,
          result: {
            action: 'cta_activated',
            targetPaths: mutation.targetPaths || [page.pagePath]
          }
        });

        await recordOperationalEngineEvent({
          type: 'cta_activated',
          source: 'automation_engine',
          targetType: 'content',
          targetId: page.pagePath,
          message: `Ativamos CTA flutuante em artigo com leitura alta (${pageLabel}).`,
          impact: 'medium',
          payload: {
            ruleId: AUTOMATION_RULES.HIGH_READ_LOW_ACTION
          }
        });

        outcomes.push({ executed: true, targetId: page.pagePath });
        stats.executed += 1;
        continue;
      }

      const taskOutcome = await ensureGuidedTask({
        actor,
        latestEntries,
        ruleId: AUTOMATION_RULES.HIGH_READ_LOW_ACTION,
        dedupeKey: `auto:high-read-low-action:${page.pagePath}`,
        createdNote: `${pageLabel} segue com leitura forte, mas agora precisa reforçar CTA/comparativo no conteúdo.`,
        duplicateDetail: `A task automática de reforço de CTA para ${pageLabel} já estava ativa.`,
        eventMessage: `Criamos uma tarefa para reforçar CTA em ${pageLabel}.`,
        eventImpact: 'medium',
        taskPayload: {
          title: `Reforçar CTA em ${pageLabel}`,
          description: 'Esse artigo segura leitura, mas ainda não empurra ação suficiente para clique ou lead.',
          recommendation: 'Adicionar CTA comparativo ou box de conversão no meio do texto e revisar a chamada final.',
          sourceType: 'content',
          sourceLabel: 'Automações',
          targetType: 'content',
          targetId: page.pagePath,
          targetLabel: pageLabel,
          href: page.links?.contextHref || '',
          whereToDo: 'VSCode',
          guideSteps: [
            'Abrir o conteúdo indicado.',
            'Adicionar CTA comparativo ou box de conversão no corpo do texto.',
            'Revisar a chamada final para ação.',
            'Salvar e revisar visualmente.',
            'Voltar ao admin e marcar como feito.'
          ],
          metadata: [...buildMetricsMetadata(page), 'CTA flutuante já ativo'],
          priority: 'Média',
          ownerLabel: 'Sistema',
          dueLabel: 'Quando possível',
          payload: {
            reason: 'high_read_low_action',
            metrics: {
              views: page.views,
              clicks: page.clicks,
              leads: page.leads,
              clickRate: page.clickRate
            }
          }
        }
      });

      outcomes.push(taskOutcome);
      if (taskOutcome.created) stats.created += 1;
      if (taskOutcome.skipped) {
        stats.skipped += 1;
        if (taskOutcome.deduplication) deduplications.push(taskOutcome.deduplication);
      }
    } catch (error) {
      stats.errors += 1;
      await logAutomation({
        status: 'failed',
        ruleId: AUTOMATION_RULES.HIGH_READ_LOW_ACTION,
        title: `Falha ao tratar ${pageLabel}`,
        detail: error instanceof Error ? error.message : 'Erro desconhecido na automação.',
        targetType: 'content',
        targetId: page.pagePath
      });
      await recordOperationalEngineEvent({
        type: 'engine_error',
        source: 'automation_engine',
        targetType: 'content',
        targetId: page.pagePath,
        message: `Falha ao tratar automaticamente ${pageLabel}.`,
        impact: 'high',
        kind: 'error',
        payload: {
          ruleId: AUTOMATION_RULES.HIGH_READ_LOW_ACTION,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        }
      });
    }
  }

  return { outcomes, stats, deduplications, ignored };
}

export async function runOperationalAutomationEngine({ actor = 'system' } = {}) {
  const [pagesSnapshot, productsSnapshot, taskEntries] = await Promise.all([
    getAdminPagesSnapshot(),
    getAdminProductsSnapshot(),
    readTaskStateEntries()
  ]);

  const latestEntries = latestTaskEntryMap(taskEntries);
  const pages = pagesSnapshot.items || [];
  const products = productsSnapshot.items || [];

  const results = await Promise.all([
    runTrafficZeroLeadRule({
      pages,
      actor,
      latestEntries
    }),
    runScaleLowVolumeRule({
      pages,
      products,
      actor,
      latestEntries
    }),
    runHighReadLowActionRule({
      pages,
      actor,
      latestEntries
    })
  ]);

  const ruleRuns = results.flatMap((item) => item.outcomes || []);
  const ruleStats = results.map((item) => item.stats);
  const deduplications = results.flatMap((item) => item.deduplications || []);
  const ignored = results.flatMap((item) => item.ignored || []);
  const createdTasks = ruleRuns.filter((item) => item?.created).length;
  const skippedDuplicates = ruleRuns.filter((item) => item?.skipped).length;
  const executedDirectly = ruleRuns.filter((item) => item?.executed).length;
  const errors = ruleStats.reduce((sum, item) => sum + Number(item?.errors || 0), 0);

  return {
    status: errors > 0 ? 'degraded' : 'completed',
    summary:
      createdTasks || executedDirectly
        ? `${createdTasks} task(s) automáticas criadas e ${executedDirectly} ação(ões) executadas pelo sistema.`
        : skippedDuplicates
          ? `Nenhuma nova task foi criada porque ${skippedDuplicates} caso(s) já estavam ativos.`
          : 'Nenhuma automação prioritária encontrou sinal novo neste ciclo.',
    payload: {
      createdTasks,
      skippedDuplicates,
      executedDirectly,
      errors,
      ruleStats,
      ignored,
      deduplications
    }
  };
}
