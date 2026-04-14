import 'server-only';

import { getDb } from '@/lib/db';
import { ensureAdminOpsTables } from '@/lib/admin/admin-ops-db';
import { buildOperationDispatchPacket } from '@/lib/admin/operation-dispatch';
import { dispatchAutomationOperation } from '@/lib/admin/operation-dispatch';
import { upsertAutomationOperation } from '@/lib/admin/automation-operation-store';
import { recordTaskStateEntry } from '@/lib/admin/task-store';

const PRODUCT_APPROVAL_PREFIX = 'approval:product:';
const PAGE_APPROVAL_PREFIX = 'approval:page:';

function toTaskPriority(risk) {
  if (risk === 'Alta') return 'Urgente';
  if (risk === 'Média') return 'Alta';
  return 'Média';
}

function resolveAppliedSiteHref(plan, operatorInstructions = '') {
  const note = String(operatorInstructions || '').toLowerCase();
  if (
    note.includes('site inteiro') ||
    note.includes('todo o site') ||
    note.includes('todo site') ||
    note.includes('todas as paginas') ||
    note.includes('todas as páginas')
  ) {
    return '/';
  }

  const siteMutationTargets = plan?.payload?.siteMutation?.targetPaths;
  if (Array.isArray(siteMutationTargets) && siteMutationTargets.length) {
    return siteMutationTargets[0];
  }

  return plan?.payload?.siteHref || null;
}

function buildFallbackExecution(approval) {
  const priority = toTaskPriority(approval.risk);

  return {
    executorType: 'generic',
    sourceType: approval.sourceType || 'approval',
    sourceId: approval.id,
    completionTaskId: `approval:${approval.id}`,
    completionTaskTitle: approval.title,
    followUpTask: {
      id: `approval-followup:${approval.id}`,
      title: `Revisar desdobramento de ${approval.title}`,
      sourceLabel: 'Aprovações',
      href: approval.href || '/admin/aprovacoes',
      priority,
      note: `O sistema estruturou a execução aprovada e abriu uma revisão para acompanhar o resultado.`
    },
    payload: {
      approvalId: approval.id,
      title: approval.title,
      sourceType: approval.sourceType || 'approval',
      sourceId: approval.id,
      href: approval.href || '/admin/aprovacoes',
      recommendation: approval.recommendation || '',
      impact: approval.impact || '',
      risk: approval.risk || 'Média'
    },
    operation: {
      operationKey: `operation:${approval.id}`,
      sourceType: approval.sourceType || 'approval',
      sourceId: approval.id,
      category: 'general-approval',
      lane: 'operations',
      title: approval.title,
      description: approval.recommendation || approval.reason || '',
      status: 'completed',
      executionMode: 'approval_required',
      requiresApproval: true,
      priority,
      ownerLabel: 'Sistema',
      contextHref: approval.href || '/admin/aprovacoes',
      operationHref: approval.href || '/admin/aprovacoes',
      payload: {
        summary: 'Aprovacao generica convertida em acao operacional rastreavel.',
        steps: []
      }
    },
    resultDetail: `A aprovação foi registrada, o contexto foi estruturado e a revisão automática entrou na fila. Nenhuma mudança externa foi publicada neste clique.`
  };
}

function buildApprovalExecutionPlan(approval) {
  const execution = approval.execution || {};
  const priority = toTaskPriority(approval.risk);
  const summary = execution.summary || approval.recommendation || approval.reason || '';
  const steps = execution.steps || [];

  if (approval.id.startsWith(PRODUCT_APPROVAL_PREFIX) || execution.sourceType === 'product') {
    const slug =
      execution.sourceId ||
      (approval.id.startsWith(PRODUCT_APPROVAL_PREFIX) ? approval.id.slice(PRODUCT_APPROVAL_PREFIX.length) : approval.id);

    return {
      executorType: 'product',
      sourceType: 'product',
      sourceId: slug,
      completionTaskId: execution.taskKey || `product-decision:${slug}`,
      completionTaskTitle: approval.title,
      followUpTask: {
        id: execution.reviewTaskKey || `review:product:${slug}`,
        title: `Validar impacto aprovado em ${approval.title}`,
        sourceLabel: 'Produtos',
        href: execution.contextHref || approval.href || '/admin/produtos',
        priority,
        note: `A automação aprovada foi registrada. Agora o sistema acompanha se ${approval.title} respondeu bem à execução.`
      },
      payload: {
        approvalId: approval.id,
        title: approval.title,
        sourceType: 'product',
        sourceId: slug,
        href: execution.contextHref || approval.href || '/admin/produtos',
        queueHref: execution.queueHref || '',
        operationHref: execution.operationHref || '',
        siteHref: execution.siteHref || '',
        recommendation: approval.recommendation || '',
        impact: approval.impact || '',
        risk: approval.risk || 'Média',
        steps
      },
      operation: {
        operationKey: execution.operationKey || `operation:product:${slug}`,
        sourceType: 'product',
        sourceId: slug,
        category: execution.category || 'product-priority',
        lane: 'products',
        title: approval.title,
        description: summary,
        status: execution.operationStatus || 'completed',
        executionMode: execution.executionMode || 'approval_required',
        requiresApproval: true,
        priority,
        ownerLabel: execution.ownerLabel || 'Sistema',
        contextHref: execution.contextHref || approval.href || '/admin/produtos',
        queueHref: execution.queueHref || '',
        operationHref: execution.contextHref || execution.operationHref || approval.href || '/admin/produtos',
        siteHref: execution.siteHref || '',
        payload: {
          summary,
          steps
        }
      },
      resultDetail: `A priorização aprovada do produto foi executada internamente, saiu da fila sensível e entrou em acompanhamento automático de impacto. Nenhuma mudança externa foi aplicada neste clique.`
    };
  }

  if (approval.id.startsWith(PAGE_APPROVAL_PREFIX) || execution.sourceType === 'page') {
    const pagePath =
      execution.sourceId ||
      (approval.id.startsWith(PAGE_APPROVAL_PREFIX) ? approval.id.slice(PAGE_APPROVAL_PREFIX.length) : approval.id);
    const siteMutation = execution.siteMutation || null;
    const executeOnApproval = false;

    return {
      executorType: 'page',
      sourceType: 'page',
      sourceId: pagePath,
      executeOnApproval,
      completionTaskId: execution.taskKey || `page-decision:${pagePath}`,
      completionTaskTitle: approval.title,
      followUpTask: {
        id: execution.reviewTaskKey || `review:page:${pagePath}`,
        title: `Validar impacto aprovado em ${approval.title}`,
        sourceLabel: 'Páginas',
        href: execution.contextHref || approval.href || '/admin/paginas',
        priority,
        note: siteMutation
          ? `A recomendação visual foi aprovada. Agora a implementação deve ser feita manualmente no VSCode e depois validada no acompanhamento.`
          : `A automação aprovada foi registrada. Agora o sistema acompanha se ${approval.title} melhorou depois da decisão executada.`
      },
      payload: {
        approvalId: approval.id,
        title: approval.title,
        sourceType: 'page',
        sourceId: pagePath,
        href: execution.contextHref || approval.href || '/admin/paginas',
        queueHref: execution.queueHref || '',
        operationHref: execution.operationHref || '',
        siteHref: execution.siteHref || '',
        recommendation: approval.recommendation || '',
        impact: approval.impact || '',
        risk: approval.risk || 'Média',
        steps,
        siteMutation
      },
      operation: {
        operationKey: execution.operationKey || `operation:page:${pagePath}`,
        sourceType: 'page',
        sourceId: pagePath,
        category:
          execution.category ||
          (siteMutation ? 'site-implementation-brief' : 'page-optimization'),
        lane: 'pages',
        title: approval.title,
        description: summary,
        status: execution.operationStatus || (siteMutation ? 'ready' : 'completed'),
        executionMode: execution.executionMode || 'approval_required',
        requiresApproval: true,
        priority,
        ownerLabel: execution.ownerLabel || 'Sistema',
        contextHref: execution.contextHref || approval.href || '/admin/paginas',
        queueHref: execution.queueHref || '',
        operationHref: execution.contextHref || execution.operationHref || approval.href || '/admin/paginas',
        siteHref: execution.siteHref || '',
        payload: {
          summary,
          steps,
          siteMutation
        }
      },
      resultDetail: siteMutation
        ? `A recomendação visual da página foi aprovada e virou handoff manual com acompanhamento. O site não foi alterado automaticamente neste clique.`
        : `A priorização aprovada da página foi executada internamente, saiu da fila sensível e entrou em acompanhamento automático de impacto. O site não foi alterado automaticamente neste clique.`
    };
  }

  if (execution.sourceType === 'campaign') {
    const campaignId = execution.sourceId || approval.id;

    return {
      executorType: 'campaign',
      sourceType: 'campaign',
      sourceId: campaignId,
      completionTaskId: execution.taskKey || `campaign-decision:${campaignId}`,
      completionTaskTitle: approval.title,
      followUpTask: {
        id: execution.reviewTaskKey || `review:campaign:${campaignId}`,
        title: `Validar resposta operacional em ${approval.title}`,
        sourceLabel: 'Campanhas',
        href: execution.contextHref || approval.href || '/admin/campanhas',
        priority,
        note: `A campanha entrou na fila operacional com contexto e proximo passo definidos pelo sistema.`
      },
      payload: {
        approvalId: approval.id,
        title: approval.title,
        sourceType: 'campaign',
        sourceId: campaignId,
        href: execution.contextHref || approval.href || '/admin/campanhas',
        queueHref: execution.queueHref || '',
        operationHref: execution.operationHref || '',
        siteHref: execution.siteHref || '',
        recommendation: approval.recommendation || '',
        impact: approval.impact || '',
        risk: approval.risk || 'Média',
        steps
      },
      operation: {
        operationKey: execution.operationKey || `operation:campaign:${campaignId}`,
        sourceType: 'campaign',
        sourceId: campaignId,
        category: execution.category || 'campaign-adjustment',
        lane: 'campaigns',
        title: approval.title,
        description: summary,
        status: execution.operationStatus || 'ready',
        executionMode: execution.executionMode || 'operator_handoff',
        requiresApproval: true,
        priority,
        ownerLabel: execution.ownerLabel || 'Mídia',
        contextHref: execution.contextHref || approval.href || '/admin/campanhas',
        queueHref: execution.queueHref || '',
        operationHref: execution.contextHref || execution.operationHref || approval.href || '/admin/campanhas',
        siteHref: execution.siteHref || '',
        payload: {
          summary,
          steps
        }
      },
      resultDetail: `A decisão de campanha foi aprovada, virou plano operacional persistido e ficou pronta para dispatch controlado. A campanha não foi alterada externamente neste clique.`
    };
  }

  if (execution.sourceType === 'seo') {
    const seoId = execution.sourceId || approval.id;

    return {
      executorType: 'seo',
      sourceType: 'seo',
      sourceId: seoId,
      completionTaskId: execution.taskKey || `seo-decision:${seoId}`,
      completionTaskTitle: approval.title,
      followUpTask: {
        id: execution.reviewTaskKey || `review:seo:${seoId}`,
        title: `Medir ganho organico em ${approval.title}`,
        sourceLabel: 'SEO',
        href: execution.contextHref || approval.href || '/admin/seo',
        priority,
        note: `A oportunidade de SEO foi estruturada e agora entra em acompanhamento para medir CTR, posicao e resposta da pagina.`
      },
      payload: {
        approvalId: approval.id,
        title: approval.title,
        sourceType: 'seo',
        sourceId: seoId,
        href: execution.contextHref || approval.href || '/admin/seo',
        queueHref: execution.queueHref || '',
        operationHref: execution.operationHref || '',
        siteHref: execution.siteHref || '',
        recommendation: approval.recommendation || '',
        impact: approval.impact || '',
        risk: approval.risk || 'Média',
        steps
      },
      operation: {
        operationKey: execution.operationKey || `operation:seo:${seoId}`,
        sourceType: 'seo',
        sourceId: seoId,
        category: execution.category || 'seo-opportunity',
        lane: 'seo',
        title: approval.title,
        description: summary,
        status: execution.operationStatus || 'ready',
        executionMode: execution.executionMode || 'operator_handoff',
        requiresApproval: true,
        priority,
        ownerLabel: execution.ownerLabel || 'Conteúdo',
        contextHref: execution.contextHref || approval.href || '/admin/seo',
        queueHref: execution.queueHref || '',
        operationHref: execution.contextHref || execution.operationHref || approval.href || '/admin/seo',
        siteHref: execution.siteHref || '',
        payload: {
          summary,
          steps
        }
      },
      resultDetail: `A oportunidade orgânica foi aprovada e entrou na fila operacional com contexto, etapa e revisão de impacto. Nenhuma publicação externa foi feita automaticamente neste clique.`
    };
  }

  if (execution.sourceType === 'integration') {
    const integrationId = execution.sourceId || approval.id;

    return {
      executorType: 'integration',
      sourceType: 'integration',
      sourceId: integrationId,
      completionTaskId: execution.taskKey || `integration-decision:${integrationId}`,
      completionTaskTitle: approval.title,
      followUpTask: {
        id: execution.reviewTaskKey || `review:integration:${integrationId}`,
        title: `Validar desbloqueio em ${approval.title}`,
        sourceLabel: 'Integrações',
        href: execution.contextHref || approval.href || '/admin/configuracoes',
        priority,
        note: `O proximo desbloqueio de integrações foi estruturado e ficou pronto para andamento operacional.`
      },
      payload: {
        approvalId: approval.id,
        title: approval.title,
        sourceType: 'integration',
        sourceId: integrationId,
        href: execution.contextHref || approval.href || '/admin/configuracoes',
        queueHref: execution.queueHref || '',
        operationHref: execution.operationHref || '',
        siteHref: execution.siteHref || '',
        recommendation: approval.recommendation || '',
        impact: approval.impact || '',
        risk: approval.risk || 'Média',
        steps
      },
      operation: {
        operationKey: execution.operationKey || `operation:integration:${integrationId}`,
        sourceType: 'integration',
        sourceId: integrationId,
        category: execution.category || 'integration-unlock',
        lane: 'settings',
        title: approval.title,
        description: summary,
        status: execution.operationStatus || 'ready',
        executionMode: execution.executionMode || 'operator_handoff',
        requiresApproval: true,
        priority,
        ownerLabel: execution.ownerLabel || 'Operação',
        contextHref: execution.contextHref || approval.href || '/admin/configuracoes',
        queueHref: execution.queueHref || '',
        operationHref: execution.contextHref || execution.operationHref || approval.href || '/admin/configuracoes',
        siteHref: execution.siteHref || '',
        payload: {
          summary,
          steps
        }
      },
      resultDetail: `A aprovação destravou uma ação estrutural do cockpit e a operação correspondente entrou na fila com rastreio próprio. A mudança externa ainda depende do próximo passo operacional.`
    };
  }

  return buildFallbackExecution(approval);
}

export async function recordAutomationExecution({ status, payload, result }) {
  await ensureAdminOpsTables();

  const sql = getDb();
  const [row] = await sql`
    INSERT INTO automation_executions (
      status,
      payload,
      result,
      executed_at
    )
    VALUES (
      ${status},
      ${JSON.stringify(payload || {})}::jsonb,
      ${JSON.stringify(result || {})}::jsonb,
      now()
    )
    RETURNING id, status, payload, result, executed_at
  `;

  return row;
}

export async function readLatestApprovalExecutionMap(limit = 200) {
  await ensureAdminOpsTables();

  const sql = getDb();
  const rows = await sql`
    SELECT id, status, payload, result, executed_at
    FROM automation_executions
    ORDER BY executed_at DESC
    LIMIT ${limit}
  `;

  const map = new Map();

  for (const row of rows) {
    const approvalId = String(row?.payload?.approvalId || '').trim();
    if (!approvalId || map.has(approvalId)) continue;

    map.set(approvalId, {
      id: row.id,
      status: row.status || 'success',
      payload: row.payload || {},
      result: row.result || {},
      executedAt: row.executed_at || new Date().toISOString()
    });
  }

  return map;
}

export function attachApprovalExecutionState(state, executionMap = new Map()) {
  function decorate(item) {
    const execution = executionMap.get(item.id);
    if (!execution) return item;

    return {
      ...item,
      executionStatus: execution.status,
      executionDetail:
        execution.result?.detail ||
        execution.result?.error ||
        execution.payload?.recommendation ||
        'Execução automática registrada.',
      executedAt: execution.executedAt
    };
  }

  return {
    pending: (state?.pending || []).map(decorate),
    history: (state?.history || []).map(decorate)
  };
}

export async function executeApprovalAutomation({ approval, decisionStatus = 'approved', actor = 'admin', rationale = '' }) {
  await ensureAdminOpsTables();

  const priority = toTaskPriority(approval?.risk);
  const plan = buildApprovalExecutionPlan(approval);
  const approvalTaskId = `approval:${approval.id}`;
  const operatorInstructions = String(rationale || '').trim();

  await recordTaskStateEntry({
    id: approvalTaskId,
    status: 'done',
    actor,
    note:
      decisionStatus === 'approved'
        ? 'Aprovação registrada e enviada para execução automática.'
        : 'Aprovação rejeitada. A execução automática foi bloqueada.',
    title: approval.title,
    sourceLabel: 'Aprovações',
    href: approval.href || '/admin/aprovacoes',
    priority
  });

  if (decisionStatus !== 'approved') {
    const dispatchPacket = await buildOperationDispatchPacket(plan.operation);
    const cancelledOperation = await upsertAutomationOperation({
      ...plan.operation,
      status: 'cancelled',
      payload: {
        ...(plan.operation.payload || {}),
        dispatchPacket
      },
      result: {
        detail: 'A operação foi descartada porque a recomendação não recebeu aprovação.',
        blocked: true,
        dispatchPacket
      }
    });

    const execution = await recordAutomationExecution({
      status: 'cancelled',
      payload: {
        ...plan.payload,
        operationKey: cancelledOperation.key,
        decisionStatus,
        actor,
        operatorInstructions
      },
      result: {
        detail: 'A execução foi descartada porque a recomendação não recebeu aprovação.',
        blocked: true
      }
    });

    return {
      status: 'cancelled',
      executionId: execution.id,
      operationId: cancelledOperation.id,
      detail: 'A recomendação foi rejeitada e o sistema bloqueou a execução automática.'
    };
  }

  try {
    const dispatchPacket = await buildOperationDispatchPacket(plan.operation);
    const operation = await upsertAutomationOperation({
      ...plan.operation,
      payload: {
        ...(plan.operation.payload || {}),
        approvalId: approval.id,
        completionTaskId: plan.completionTaskId,
        reviewTaskId: plan.followUpTask.id,
        nextTaskId: plan.followUpTask.id,
        operatorInstructions,
        dispatchPacket
      },
      result: {
        detail: plan.resultDetail,
        approvalId: approval.id,
        nextTaskId: plan.followUpTask.id,
        dispatchPacket
      }
    });

    await recordTaskStateEntry({
      id: plan.completionTaskId,
      status: 'done',
      actor: 'sistema',
      note:
        operation.status === 'completed'
          ? 'Decisão aprovada e tratada automaticamente pelo executor do admin.'
          : 'Decisão aprovada e convertida em plano operacional persistido.',
      title: plan.completionTaskTitle,
      sourceLabel: plan.sourceType === 'page' ? 'Páginas' : plan.sourceType === 'product' ? 'Produtos' : 'Aprovações',
      href: plan.payload.href || approval.href || '/admin/tasks',
      priority
    });

    await recordTaskStateEntry({
      id: plan.followUpTask.id,
      status: 'pending',
      actor: 'sistema',
      note: plan.followUpTask.note,
      title: plan.followUpTask.title,
      sourceLabel: plan.followUpTask.sourceLabel,
      href: plan.followUpTask.href,
      priority: plan.followUpTask.priority
    });

    let finalDetail = plan.resultDetail;
    let previewHref = null;
    let appliedHref = null;

    if (plan.executeOnApproval) {
      const dispatch = await dispatchAutomationOperation({
        id: operation.id,
        actor: 'sistema'
      });
      finalDetail = dispatch?.operation?.result?.detail || finalDetail;
      previewHref = dispatch?.operation?.result?.previewHref || null;
      appliedHref = dispatch?.operation?.result?.appliedHref || null;
    }

    const execution = await recordAutomationExecution({
      status: 'success',
      payload: {
        ...plan.payload,
        operationKey: operation.key,
        decisionStatus,
        actor,
        operatorInstructions
      },
      result: {
        detail: finalDetail,
        touchedTasks: [approvalTaskId, plan.completionTaskId, plan.followUpTask.id],
        nextTaskId: plan.followUpTask.id,
        operationId: operation.id
      }
    });

    return {
      status: 'success',
      executionId: execution.id,
      operationId: operation.id,
      detail: finalDetail,
      nextTaskId: plan.followUpTask.id,
      previewHref,
      appliedHref:
        appliedHref ||
        (plan.executeOnApproval && plan.payload?.siteMutation?.applyMode === 'instant_safe'
          ? resolveAppliedSiteHref(plan, operatorInstructions)
          : null)
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    const execution = await recordAutomationExecution({
      status: 'error',
      payload: {
        ...plan.payload,
        decisionStatus,
        actor,
        operatorInstructions
      },
      result: {
        detail: 'A aprovação foi registrada, mas a execução automática falhou.',
        error: message
      }
    });

    return {
      status: 'error',
      executionId: execution.id,
      detail: `A aprovação foi salva, mas a execução automática falhou: ${message}`
    };
  }
}
