import 'server-only';

import { getIntegrationBlueprint } from '@/lib/admin/integrations';
import {
  getGoogleAdsCampaignSnapshot,
  pauseGoogleAdsCampaign,
  syncGoogleAdsCampaignSnapshots
} from '@/lib/admin/integrations/google-ads/google-ads-service';
import { getAdminCampaignsSnapshot } from '@/lib/admin/campaigns-overview';
import { getAdminProductsSnapshot } from '@/lib/admin/products-overview';
import { getAdminPagesSnapshot } from '@/lib/admin/pages-overview';
import { getSearchConsoleOpportunitySnapshot } from '@/lib/admin/search-console-intelligence';
import {
  readAutomationOperation,
  updateAutomationOperation
} from '@/lib/admin/automation-operation-store';
import { getDb } from '@/lib/db';
import { ensureAdminOpsTables } from '@/lib/admin/admin-ops-db';
import { evaluateDispatchGuardrails } from '@/lib/admin/execution-guardrails';
import { recordTaskStateEntry } from '@/lib/admin/task-store';
import {
  overwriteSiteAutomationState
} from '@/lib/site-automation';

const CORE_PRODUCTS = [
  { slug: 'cartao-credito-porto-bank' },
  { slug: 'seguro-celular' },
  { slug: 'seguro-viagem' },
  { slug: 'seguro-vida-on' }
];

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function matchCampaign(items = [], sourceId = '') {
  const normalizedSourceId = normalizeText(sourceId);
  return items.find((item) => {
    const normalizedName = normalizeText(item.name || '');
    const normalizedId = normalizeText(item.externalId || item.id || '');
    return normalizedName === normalizedSourceId || normalizedId === normalizedSourceId || normalizedName.includes(normalizedSourceId);
  }) || null;
}

function readinessFromStatus(status) {
  if (status === 'connected' || status === 'ready' || status === 'completed') {
    return {
      readiness: 'ready',
      readinessLabel: 'Pronto para executar'
    };
  }

  if (status === 'partial' || status === 'degraded') {
    return {
      readiness: 'partial',
      readinessLabel: 'Pronto com ressalvas'
    };
  }

  return {
    readiness: 'blocked',
    readinessLabel: 'Bloqueado'
  };
}

async function buildCampaignDispatchPacket(operation) {
  const [connector, campaignsSnapshot] = await Promise.all([
    getGoogleAdsCampaignSnapshot(),
    getAdminCampaignsSnapshot({ q: operation.sourceId || '' })
  ]);

  const campaign = matchCampaign(campaignsSnapshot.items || [], operation.sourceId || '');
  const command =
    operation.category === 'campaign-scale'
      ? 'scale-budget-gradually'
      : operation.category === 'campaign-review'
        ? 'review-or-pause'
        : 'review-campaign';

  let preflight = {
    type: 'google-ads-sync',
    status: 'skipped',
    summary: 'Sync externo não executado.'
  };

  if (connector.integration?.status === 'connected') {
    try {
      const syncResult = await syncGoogleAdsCampaignSnapshots({});
      preflight = {
        type: 'google-ads-sync',
        status: syncResult.status || 'completed',
        summary: syncResult.reason,
        snapshotDate: syncResult.snapshotDate,
        campaignsPersisted: syncResult.campaignsPersisted || 0,
        snapshotsPersisted: syncResult.snapshotsPersisted || 0
      };
    } catch (error) {
      preflight = {
        type: 'google-ads-sync',
        status: 'failed',
        summary: error instanceof Error ? error.message : 'Falha ao sincronizar Google Ads.'
      };
    }
  }

  const readinessState = readinessFromStatus(
    preflight.status === 'failed'
      ? 'partial'
      : connector.integration?.status || 'blocked'
  );

  return {
    kind: 'campaign-handoff',
    connectorKey: 'google-ads',
    connectorStatus: connector.integration?.status || 'pending',
    connectorStatusLabel: connector.integration?.statusLabel || 'Pendente',
    ...readinessState,
    command,
    target: campaign
      ? {
          id: campaign.id,
          externalId: campaign.externalId,
          name: campaign.name,
          status: campaign.statusLabel,
          score: campaign.score,
          spend: campaign.cost,
          conversions: campaign.conversions
        }
      : {
          name: operation.sourceId || 'Campanha sem match exato',
          status: 'Sem match interno'
        },
    brief:
      operation.category === 'campaign-scale'
        ? 'Escalar com proteção de CPL, mantendo acompanhamento curto de custo e resposta comercial.'
        : 'Revisar antes de manter verba, cruzando criativo, segmentação e destino da campanha.',
    checklist:
      operation.category === 'campaign-scale'
        ? [
            'Confirmar que a campanha continua liderando conversão e eficiência.',
            'Subir distribuição de forma gradual, sem perder leitura de CPL.',
            'Checar depois se a landing continuou respondendo ao reforço.'
          ]
        : [
            'Confirmar que existe gasto ou clique sem retorno compatível.',
            'Revisar criativo, palavra-chave, segmentação e landing no mesmo contexto.',
            'Reduzir ou pausar se a próxima leitura continuar improdutiva.'
          ],
    handoffText: `Campanha: ${campaign?.name || operation.sourceId}. Ação: ${command}. Próximo passo: ${
      operation.category === 'campaign-scale' ? 'reforçar orçamento com guarda de CPL' : 'revisar ou pausar antes de comprar mais tráfego'
    }.`,
    preflight
  };
}

async function buildSeoDispatchPacket(operation) {
  const snapshot = await getSearchConsoleOpportunitySnapshot(CORE_PRODUCTS);
  const query = String(operation.sourceId || '').trim();
  const targetQuery =
    snapshot.opportunities.find((item) => normalizeText(item.query) === normalizeText(query)) ||
    snapshot.topQueries.find((item) => normalizeText(item.query) === normalizeText(query)) ||
    null;
  const candidatePage = snapshot.pageOpportunities[0] || snapshot.topPages[0] || null;
  const readinessState = readinessFromStatus(snapshot.status);

  return {
    kind: 'seo-handoff',
    connectorKey: 'search-console',
    connectorStatus: snapshot.status,
    connectorStatusLabel: snapshot.statusLabel,
    ...readinessState,
    command: 'optimize-page-and-serp',
    target: {
      query,
      clicks: targetQuery?.clicks || 0,
      impressions: targetQuery?.impressions || 0,
      ctr: targetQuery?.ctr || 0,
      position: targetQuery?.position || null,
      page: candidatePage?.page || null
    },
    brief: 'Transformar oportunidade orgânica em atualização real de página, meta ou conteúdo satélite.',
    checklist: [
      'Revisar title/meta e promessa principal da página mais próxima da query.',
      'Ganhar relevância com copy mais aderente à intenção de busca.',
      'Voltar ao painel para medir CTR, posição e crescimento de clique.'
    ],
    handoffText: `Query: ${query}. Página candidata: ${candidatePage?.page || 'definir no painel de SEO'}. Próximo passo: reforçar título, meta e cobertura da intenção.`,
    preflight: {
      type: 'search-console-read',
      status: snapshot.status === 'connected' ? 'completed' : 'blocked',
      summary: snapshot.reason
    }
  };
}

async function buildIntegrationDispatchPacket(operation) {
  const blueprint = getIntegrationBlueprint(operation.sourceId) || getIntegrationBlueprint('google-ads');
  const missing = (blueprint?.requiredEnv || []).filter((key) => !String(process.env[key] || '').trim());
  const status = missing.length ? (missing.length === (blueprint?.requiredEnv || []).length ? 'blocked' : 'partial') : 'ready';
  const readinessState = readinessFromStatus(status);

  return {
    kind: 'integration-handoff',
    connectorKey: blueprint?.key || operation.sourceId,
    connectorStatus: status,
    connectorStatusLabel: readinessState.readinessLabel,
    ...readinessState,
    command: 'unlock-integration',
    target: {
      key: blueprint?.key || operation.sourceId,
      title: blueprint?.title || operation.sourceId,
      missing
    },
    brief: blueprint?.description || 'Desbloquear a próxima camada estrutural do cockpit.',
    checklist: [
      'Conferir as credenciais e permissões exigidas.',
      'Validar a integração no painel antes de subir para automação recorrente.',
      'Voltar ao cockpit para confirmar o ganho de leitura.'
    ],
    handoffText: `${blueprint?.title || operation.sourceId}: completar a configuração pendente e revalidar o conector no cockpit.`,
    preflight: {
      type: 'integration-readiness',
      status,
      summary: missing.length ? `Faltam ${missing.length} credenciais para liberar essa camada.` : 'A integração já está pronta para avanço.'
    }
  };
}

async function buildProductDispatchPacket(operation) {
  const snapshot = await getAdminProductsSnapshot({ q: operation.sourceId || '' });
  const target = (snapshot.items || [])[0] || null;

  return {
    kind: 'product-handoff',
    connectorKey: 'internal-ops',
    connectorStatus: 'ready',
    connectorStatusLabel: 'Pronto internamente',
    readiness: 'ready',
    readinessLabel: 'Pronto para executar',
    command: operation.category === 'distribution-scale' ? 'distribute-product' : 'review-product',
    target: target
      ? {
          slug: target.slug,
          name: target.name,
          opportunity: target.decision?.scores?.opportunity || 0,
          priority: target.decision?.scores?.priority || 0,
          urgency: target.decision?.scores?.urgency || 0
        }
      : {
          slug: operation.sourceId,
          name: operation.sourceId
        },
    brief: 'Transformar prioridade de produto em direção operacional de distribuição e acompanhamento.',
    checklist: [
      'Conferir a fila de leads ligada a esse produto.',
      'Direcionar distribuição e energia comercial para a frente priorizada.',
      'Voltar ao review para medir se o produto respondeu com mais lead e tração.'
    ],
    handoffText: `Produto: ${target?.name || operation.sourceId}. Próximo passo: distribuir atenção comercial e medir resposta no curto prazo.`,
    preflight: {
      type: 'internal-read-model',
      status: 'completed',
      summary: 'Produto reidratado no command center com links e scores atualizados.'
    }
  };
}

async function buildPageDispatchPacket(operation) {
  const snapshot = await getAdminPagesSnapshot({ q: operation.sourceId || '' });
  const target = (snapshot.items || [])[0] || null;
  const siteMutation = operation.payload?.siteMutation || null;
  const operatorInstructions = String(operation.payload?.operatorInstructions || '').trim();

  return {
    kind: 'page-handoff',
    connectorKey: 'internal-ops',
    connectorStatus: 'ready',
    connectorStatusLabel: 'Pronto internamente',
    readiness: 'ready',
    readinessLabel: 'Pronto para executar',
    command:
      siteMutation?.applyMode === 'patch_preview'
        ? 'prepare-site-patch-preview'
        : siteMutation
          ? 'apply-site-mutation'
          : 'optimize-landing',
    target: target
      ? {
          pagePath: target.pagePath,
          pageType: target.pageType,
          health: target.decision?.scores?.health || 0,
          urgency: target.decision?.scores?.urgency || 0
        }
      : {
          pagePath: operation.sourceId
        },
    brief: siteMutation?.applyMode === 'patch_preview'
      ? siteMutation.summary || 'Gerar um preview do patch superficial antes de publicar no site.'
      : siteMutation
      ? siteMutation.summary || 'Aplicar mutação segura de conversão na página aprovada.'
      : 'Levar a página crítica para revisão de copy, CTA e gargalo de conversão com contexto suficiente.',
    checklist: siteMutation?.applyMode === 'patch_preview'
      ? [
          `Gerar o preview de ${siteMutation.title || 'um patch superficial'} sem publicar direto no site.`,
          'Abrir a página com o preview pronto para validação visual.',
          'Publicar ou reverter pelo painel de automações com rollback disponível.'
        ]
      : siteMutation
      ? [
          `Aplicar ${siteMutation.title || 'a mutação segura do site'} sem editar código manualmente.`,
          'Registrar a mudança no histórico operacional.',
          'Voltar ao review para medir se a página melhorou a resposta.'
        ]
      : [
          'Abrir a página crítica no contexto de performance.',
          'Revisar hero, CTA e argumento principal antes de comprar mais tráfego.',
          'Voltar ao review para medir se a página melhorou a resposta.'
        ],
    handoffText: siteMutation?.applyMode === 'patch_preview'
      ? `Página: ${target?.pagePath || operation.sourceId}. Próximo passo: gerar preview de ${siteMutation.title || 'patch superficial'}${operatorInstructions ? ` com a observação: ${operatorInstructions}` : ''}.`
      : siteMutation
      ? `Página: ${target?.pagePath || operation.sourceId}. Próximo passo: aplicar ${siteMutation.title || 'a mutação segura'}${operatorInstructions ? ` com a observação: ${operatorInstructions}` : ''}.`
      : `Página: ${target?.pagePath || operation.sourceId}. Próximo passo: revisar copy, CTA e fricção principal.`,
    siteMutation,
    operatorInstructions,
    preflight: {
      type: 'internal-read-model',
      status: 'completed',
      summary: 'Página reidratada no command center com sinais atuais de conversão.'
    }
  };
}

export async function buildOperationDispatchPacket(operation) {
  if (!operation) return null;

  let packet = null;

  if (operation.sourceType === 'campaign') {
    packet = await buildCampaignDispatchPacket(operation);
  } else if (operation.sourceType === 'seo') {
    packet = await buildSeoDispatchPacket(operation);
  } else if (operation.sourceType === 'integration') {
    packet = await buildIntegrationDispatchPacket(operation);
  } else if (operation.sourceType === 'product') {
    packet = await buildProductDispatchPacket(operation);
  } else if (operation.sourceType === 'page') {
    packet = await buildPageDispatchPacket(operation);
  } else {
    packet = {
      kind: 'generic-handoff',
      connectorKey: 'internal-ops',
      connectorStatus: 'ready',
      connectorStatusLabel: 'Pronto internamente',
      readiness: 'ready',
      readinessLabel: 'Pronto para executar',
      command: 'review-operation',
      target: {
        sourceType: operation.sourceType,
        sourceId: operation.sourceId
      },
      brief: operation.description || 'Acao operacional pronta para andamento.',
      checklist: [
        'Abrir o contexto da operação.',
        'Executar a ação sugerida com o checklist atual.',
        'Voltar ao histórico para medir a resposta.'
      ],
      handoffText: operation.description || operation.title,
      preflight: {
        type: 'none',
        status: 'completed',
        summary: 'A operação já está pronta no fluxo interno.'
      }
    };
  }

  return {
    ...packet,
    guardrails: await evaluateDispatchGuardrails({ operation, dispatchPacket: packet })
  };
}

async function recordDispatchExecution({ operation, status, payload, result }) {
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
      ${JSON.stringify({
        operationId: operation.id,
        operationKey: operation.key,
        title: operation.title,
        sourceType: operation.sourceType,
        sourceId: operation.sourceId,
        ...(payload || {})
      })}::jsonb,
      ${JSON.stringify(result || {})}::jsonb,
      now()
    )
    RETURNING id
  `;

  return row?.id || null;
}

async function markOperationTaskState(operation, status, note, actor) {
  await recordTaskStateEntry({
    id: `operation-dispatch:${operation.key}`,
    status,
    actor,
    note,
    title: operation.title,
    sourceLabel: 'Operações',
    href: operation.contextHref || operation.operationHref || '/admin/automacoes',
    priority: operation.priority
  });
}

async function blockOperationDispatch(operation, dispatchPacket, actor) {
  const detail = dispatchPacket?.guardrails?.summary || dispatchPacket?.preflight?.summary || 'A política de execução bloqueou esta operação.';

  await markOperationTaskState(operation, 'blocked', detail, actor);

  return {
    finalStatus: 'blocked',
    detail,
    externalMutation: null
  };
}

async function dispatchInternalOperation(operation, dispatchPacket, actor) {
  await markOperationTaskState(
    operation,
    'done',
    'Operação interna executada e entregue ao fluxo operacional correspondente.',
    actor
  );

  return {
    finalStatus: 'completed',
    detail: dispatchPacket.brief || 'Operação interna executada com sucesso.',
    externalMutation: null
  };
}

async function dispatchProductOperation(operation, dispatchPacket, actor) {
  const targetName = dispatchPacket.target?.name || operation.sourceId || 'produto';
  const detail = `Produto ${targetName} entrou em execução assistida com playbook de distribuição e revisão curta de resposta comercial.`;

  await markOperationTaskState(operation, 'doing', detail, actor);

  return {
    finalStatus: 'completed',
    detail,
    executionArtifact: {
      type: 'product-distribution-playbook',
      focus: targetName,
      checklist: dispatchPacket.checklist || [],
      nextStep: dispatchPacket.handoffText || detail
    },
    externalMutation: null
  };
}

async function dispatchPageOperation(operation, dispatchPacket, actor) {
  const targetPage = dispatchPacket.target?.pagePath || operation.sourceId || 'página';

  if (dispatchPacket.command === 'prepare-site-patch-preview' && dispatchPacket.siteMutation) {
    await markOperationTaskState(
      operation,
      'done',
      'Alteracoes visuais automaticas no site foram desativadas. Essa frente agora exige implementacao manual no codigo.',
      actor
    );

    return {
      finalStatus: 'completed',
      detail: 'Preview automatico de patch desativado. Essa recomendacao visual agora deve ser implementada manualmente no codigo.',
      executionArtifact: {
        type: 'manual-site-implementation',
        targetPaths: dispatchPacket.siteMutation.targetPaths || [],
        note: dispatchPacket.operatorInstructions || ''
      },
      externalMutation: null
    };
  }

  if (dispatchPacket.command === 'apply-site-mutation' && dispatchPacket.siteMutation) {
    await markOperationTaskState(
      operation,
      'done',
      'Alteracoes visuais automaticas no site foram desativadas. Essa frente agora exige implementacao manual no codigo.',
      actor
    );

    return {
      finalStatus: 'completed',
      detail: 'Aplicacao automatica de mutacao visual desativada. Essa recomendacao agora deve ser implementada manualmente no codigo.',
      executionArtifact: {
        type: 'manual-site-implementation',
        targetPaths: dispatchPacket.siteMutation.targetPaths || [],
        note: dispatchPacket.operatorInstructions || ''
      },
      externalMutation: null
    };
  }

  const detail = `Página ${targetPage} foi enviada para revisão guiada de copy, CTA e gargalo de conversão.`;

  await markOperationTaskState(operation, 'doing', detail, actor);

  return {
    finalStatus: 'completed',
    detail,
    executionArtifact: {
      type: 'page-optimization-brief',
      focus: targetPage,
      checklist: dispatchPacket.checklist || [],
      nextStep: dispatchPacket.handoffText || detail
    },
    externalMutation: null
  };
}

export async function rollbackAutomationOperation({ id, actor = 'admin' }) {
  const operation = await readAutomationOperation(id);

  if (!operation) {
    throw new Error('Operação não encontrada para rollback.');
  }

  const artifact = operation.result?.executionArtifact || null;
  if (!['site-mutation', 'site-patch-published'].includes(artifact?.type) || !artifact.previousState) {
    throw new Error('Essa operação não possui rollback automático disponível.');
  }

  const restoredState = await overwriteSiteAutomationState({
    state: artifact.previousState,
    actor
  });

  const updated = await updateAutomationOperation({
    id: operation.id,
    status: 'completed',
    payload: {
      ...(operation.payload || {})
    },
    result: {
      ...(operation.result || {}),
      detail: 'Rollback da mutação segura do site executado com sucesso.',
      rollbackAt: new Date().toISOString(),
      rollbackActor: actor,
      rollbackAvailable: false,
      restoredState
    }
  });

  await markOperationTaskState(
    updated,
    'done',
    'Rollback aplicado. O site voltou ao estado anterior dessa mutação segura.',
    actor
  );

  const executionId = await recordDispatchExecution({
    operation: updated,
    status: 'success',
    payload: {
      dispatchType: 'site-mutation-rollback',
      actor
    },
    result: updated.result
  });

  return {
    ok: true,
    executionId,
    operation: updated,
    status: 'completed',
    detail: updated.result?.detail || 'Rollback executado.'
  };
}

export async function publishAutomationOperationPreview({ id, actor = 'admin' }) {
  const operation = await readAutomationOperation(id);

  if (!operation) {
    throw new Error('Operação não encontrada para publicação do patch.');
  }

  throw new Error('Publicacao automatica de alteracoes visuais foi desativada. Faça a implementacao manualmente no codigo.');
}

async function dispatchSeoOperation(operation, dispatchPacket, actor) {
  const query = dispatchPacket.target?.query || operation.sourceId || 'query';
  const detail = `Oportunidade SEO ${query} foi convertida em briefing executável para atualização de página e SERP.`;

  await markOperationTaskState(operation, 'doing', detail, actor);

  return {
    finalStatus: 'completed',
    detail,
    executionArtifact: {
      type: 'seo-brief',
      focus: query,
      targetPage: dispatchPacket.target?.page || null,
      checklist: dispatchPacket.checklist || [],
      nextStep: dispatchPacket.handoffText || detail
    },
    externalMutation: null
  };
}

async function dispatchCampaignOperation(operation, dispatchPacket, actor) {
  if (dispatchPacket.command === 'review-or-pause' && dispatchPacket.guardrails?.mode === 'blocked') {
    return blockOperationDispatch(operation, dispatchPacket, actor);
  }

  if (
    dispatchPacket.command === 'review-or-pause' &&
    dispatchPacket.readiness === 'ready' &&
    dispatchPacket.target?.externalId &&
    dispatchPacket.guardrails?.canMutateExternally
  ) {
    const mutation = await pauseGoogleAdsCampaign({ campaignId: dispatchPacket.target.externalId });
    const sync = await syncGoogleAdsCampaignSnapshots({});

    await markOperationTaskState(
      operation,
      'done',
      'Campanha pausada no Google Ads e sincronizada novamente no cockpit.',
      actor
    );

    return {
      finalStatus: 'completed',
      detail: 'Campanha pausada no Google Ads com sucesso e base sincronizada novamente.',
      externalMutation: {
        connector: 'google-ads',
        action: mutation.action,
        campaignId: mutation.campaignId,
        syncStatus: sync.status
      }
    };
  }

  await markOperationTaskState(
    operation,
    'doing',
    'Dispatch controlado executado. A operação está pronta para ação assistida, mas sem mutação externa segura disponível.',
    actor
  );

  return {
    finalStatus: 'completed',
    detail: 'Dispatch controlado concluído com preflight real, mas essa ação ainda depende de execução assistida fora do painel.',
    externalMutation: null
  };
}

async function dispatchIntegrationOperation(operation, dispatchPacket, actor) {
  const key = dispatchPacket.target?.key || operation.sourceId;

  if (key === 'google-ads') {
    const sync = await syncGoogleAdsCampaignSnapshots({});

    await markOperationTaskState(
      operation,
      sync.status === 'completed' ? 'done' : 'doing',
      sync.reason || 'Integração Google Ads revisada no dispatch controlado.',
      actor
    );

    return {
      finalStatus: sync.status === 'completed' ? 'completed' : 'blocked',
      detail: sync.reason,
      externalMutation: {
        connector: 'google-ads',
        action: 'sync-campaign-snapshots',
        status: sync.status
      }
    };
  }

  await markOperationTaskState(
    operation,
    'doing',
    'Dispatch estrutural executado. A integração segue preparada para configuração assistida.',
    actor
  );

  return {
    finalStatus: dispatchPacket.readiness === 'blocked' ? 'blocked' : 'completed',
    detail: dispatchPacket.preflight?.summary || 'Integração revisada no dispatch controlado.',
    externalMutation: null
  };
}

export async function dispatchAutomationOperation({ id, actor = 'admin' }) {
  const operation = await readAutomationOperation(id);

  if (!operation) {
    throw new Error('Operação não encontrada para dispatch.');
  }

  const dispatchPacket = operation.dispatchPacket?.guardrails
    ? operation.dispatchPacket
    : await buildOperationDispatchPacket(operation);

  if (dispatchPacket?.guardrails?.mode === 'blocked') {
    const blockedOperation = await updateAutomationOperation({
      id: operation.id,
      status: 'blocked',
      payload: {
        ...(operation.payload || {}),
        dispatchPacket
      },
      result: {
        ...(operation.result || {}),
        detail: dispatchPacket.guardrails.summary,
        blockedAt: new Date().toISOString(),
        actor
      }
    });

    const executionId = await recordDispatchExecution({
      operation: blockedOperation,
      status: 'blocked',
      payload: {
        dispatchPacket,
        actor
      },
      result: {
        detail: dispatchPacket.guardrails.summary,
        blocked: true,
        reasons: dispatchPacket.guardrails.reasons || []
      }
    });

    await markOperationTaskState(blockedOperation, 'blocked', dispatchPacket.guardrails.summary, actor);

    return {
      ok: true,
      executionId,
      operation: blockedOperation,
      status: 'blocked',
      detail: dispatchPacket.guardrails.summary
    };
  }

  const runningOperation = await updateAutomationOperation({
    id: operation.id,
    status: 'running',
    payload: {
      ...(operation.payload || {}),
      dispatchPacket
    },
    result: {
      ...(operation.result || {}),
      detail: 'Dispatch em andamento.',
      startedAt: new Date().toISOString(),
      actor
    }
  });

  try {
    let execution;

    if (operation.sourceType === 'campaign') {
      execution = await dispatchCampaignOperation(runningOperation, dispatchPacket, actor);
    } else if (operation.sourceType === 'integration') {
      execution = await dispatchIntegrationOperation(runningOperation, dispatchPacket, actor);
    } else if (operation.sourceType === 'product') {
      execution = await dispatchProductOperation(runningOperation, dispatchPacket, actor);
    } else if (operation.sourceType === 'page') {
      execution = await dispatchPageOperation(runningOperation, dispatchPacket, actor);
    } else if (operation.sourceType === 'seo') {
      execution = await dispatchSeoOperation(runningOperation, dispatchPacket, actor);
    } else {
      execution = await dispatchInternalOperation(runningOperation, dispatchPacket, actor);
    }

    const updated = await updateAutomationOperation({
      id: runningOperation.id,
      status: execution.finalStatus,
      payload: {
        ...(runningOperation.payload || {}),
        dispatchPacket
      },
      result: {
        ...(runningOperation.result || {}),
        detail: execution.detail,
        dispatchPacket,
        externalMutation: execution.externalMutation,
        executionArtifact: execution.executionArtifact || null,
        previewHref: execution.previewUrl || null,
        appliedHref: execution.appliedHref || null,
        dispatchedAt: new Date().toISOString(),
        actor
      }
    });

    const executionId = await recordDispatchExecution({
      operation: updated,
      status: execution.finalStatus === 'completed' ? 'success' : execution.finalStatus,
      payload: {
        dispatchType: 'controlled-dispatch',
        actor
      },
      result: updated.result
    });

    return {
      ok: true,
      operation: updated,
      executionId
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha desconhecida no dispatch.';
    const failed = await updateAutomationOperation({
      id: runningOperation.id,
      status: 'failed',
      payload: {
        ...(runningOperation.payload || {}),
        dispatchPacket
      },
      result: {
        ...(runningOperation.result || {}),
        detail: 'Dispatch falhou.',
        error: message,
        dispatchPacket,
        actor
      }
    });

    const executionId = await recordDispatchExecution({
      operation: failed || runningOperation,
      status: 'error',
      payload: {
        dispatchType: 'controlled-dispatch',
        actor
      },
      result: failed?.result || { detail: 'Dispatch falhou.', error: message }
    });

    throw Object.assign(new Error(message), {
      operation: failed,
      executionId
    });
  }
}
