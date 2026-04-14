import 'server-only';

import {
  deleteAdminRuntimeSetting,
  readAdminRuntimeSetting,
  upsertAdminRuntimeSetting
} from '@/lib/admin/runtime-settings-store';

const EXECUTION_GUARDRAIL_SETTING_KEY = 'execution-guardrails';

function buildValue(label, value, reason) {
  return { label, value, reason };
}

function toNumber(value, fallback, { min = 0, max = 999999 } = {}) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function toBoolean(value, fallback) {
  if (typeof value === 'boolean') return value;
  return fallback;
}

const EXECUTION_GUARDRAIL_PROFILE = {
  key: 'conservative-assisted',
  label: 'Conservador assistido',
  summary: 'A IA ajuda forte, mas só executa fora do painel quando o risco está claramente controlado.',
  operatorGuide:
    'Começamos travando orçamento, pausa e publicação externa. Depois que o histórico provar estabilidade, podemos afrouxar alguns limites com segurança.'
};

export const defaultExecutionGuardrailPolicy = {
  campaign: {
    minimumSpendForPause: 150,
    minimumClicksForPause: 25,
    blockPauseWithAnyConversion: true,
    requireApprovalForAnyBudgetChange: true,
    recommendationBudgetIncreasePercent: 10,
    hardBlockBudgetIncreasePercent: 15
  },
  page: {
    autoPublishEnabled: false
  },
  product: {
    autoDistributionEnabled: false,
    protectedCoreProducts: ['cartao-credito-porto-bank', 'seguro-celular', 'seguro-viagem', 'seguro-vida-on']
  },
  seo: {
    autoPublishEnabled: false
  },
  integration: {
    autoSyncWhenReady: true
  }
};

export function normalizeExecutionGuardrailPolicy(input = {}) {
  return {
    campaign: {
      minimumSpendForPause: toNumber(input?.campaign?.minimumSpendForPause, defaultExecutionGuardrailPolicy.campaign.minimumSpendForPause, { min: 0, max: 100000 }),
      minimumClicksForPause: toNumber(input?.campaign?.minimumClicksForPause, defaultExecutionGuardrailPolicy.campaign.minimumClicksForPause, { min: 0, max: 10000 }),
      blockPauseWithAnyConversion: toBoolean(input?.campaign?.blockPauseWithAnyConversion, defaultExecutionGuardrailPolicy.campaign.blockPauseWithAnyConversion),
      requireApprovalForAnyBudgetChange: toBoolean(input?.campaign?.requireApprovalForAnyBudgetChange, defaultExecutionGuardrailPolicy.campaign.requireApprovalForAnyBudgetChange),
      recommendationBudgetIncreasePercent: toNumber(
        input?.campaign?.recommendationBudgetIncreasePercent,
        defaultExecutionGuardrailPolicy.campaign.recommendationBudgetIncreasePercent,
        { min: 0, max: 100 }
      ),
      hardBlockBudgetIncreasePercent: toNumber(
        input?.campaign?.hardBlockBudgetIncreasePercent,
        defaultExecutionGuardrailPolicy.campaign.hardBlockBudgetIncreasePercent,
        { min: 0, max: 100 }
      )
    },
    page: {
      autoPublishEnabled: toBoolean(input?.page?.autoPublishEnabled, defaultExecutionGuardrailPolicy.page.autoPublishEnabled)
    },
    product: {
      autoDistributionEnabled: toBoolean(input?.product?.autoDistributionEnabled, defaultExecutionGuardrailPolicy.product.autoDistributionEnabled),
      protectedCoreProducts: defaultExecutionGuardrailPolicy.product.protectedCoreProducts
    },
    seo: {
      autoPublishEnabled: toBoolean(input?.seo?.autoPublishEnabled, defaultExecutionGuardrailPolicy.seo.autoPublishEnabled)
    },
    integration: {
      autoSyncWhenReady: toBoolean(input?.integration?.autoSyncWhenReady, defaultExecutionGuardrailPolicy.integration.autoSyncWhenReady)
    }
  };
}

export function summarizeExecutionAutonomy(policy = defaultExecutionGuardrailPolicy) {
  const campaignStrict =
    policy.campaign.requireApprovalForAnyBudgetChange &&
    policy.campaign.blockPauseWithAnyConversion &&
    Number(policy.campaign.minimumSpendForPause || 0) >= 150 &&
    Number(policy.campaign.minimumClicksForPause || 0) >= 25;

  const externalToggles =
    Number(Boolean(policy.product.autoDistributionEnabled)) +
    Number(Boolean(policy.page.autoPublishEnabled)) +
    Number(Boolean(policy.seo.autoPublishEnabled));

  if (campaignStrict && externalToggles === 0) {
    return {
      key: 'conservative',
      label: 'IA em modo conservador',
      tone: 'warning',
      summary: 'A IA prioriza análise, organização e execução segura. Ações externas sensíveis continuam fortemente protegidas.',
      nextStep: 'Boa fase para aprender o negócio sem correr risco financeiro desnecessário.'
    };
  }

  if (externalToggles >= 2 || !policy.campaign.requireApprovalForAnyBudgetChange) {
    return {
      key: 'aggressive',
      label: 'IA em modo mais agressivo',
      tone: 'danger',
      summary: 'A IA está com mais liberdade operacional. Isso acelera execução, mas aumenta a necessidade de revisão de resultado.',
      nextStep: 'Use quando a operação já estiver validada e você quiser ganhar velocidade.'
    };
  }

  return {
    key: 'assisted',
    label: 'IA em modo assistido',
    tone: 'premium',
    summary: 'A IA já organiza boa parte da operação, mas ainda deixa publicação e mudanças sensíveis na sua mão.',
    nextStep: 'É o melhor meio-termo para subir automação sem perder controle do negócio.'
  };
}

async function readExecutionGuardrailSetting() {
  const stored = await readAdminRuntimeSetting(EXECUTION_GUARDRAIL_SETTING_KEY);
  if (!stored?.value) return null;

  return {
    ...stored,
    value: normalizeExecutionGuardrailPolicy(stored.value)
  };
}

function buildGuardrailDomains(policy) {
  return [
    {
      key: 'campaign',
      title: 'Campanhas',
      autonomyLabel: 'Aprovação + trava forte',
      summary: 'Campanha é onde a IA mais pode causar prejuízo se agir cedo demais. Aqui a régua começa conservadora.',
      values: [
        buildValue(
          'Pausa externa só com evidência mínima',
          `R$ ${policy.campaign.minimumSpendForPause} gastos e ${policy.campaign.minimumClicksForPause} cliques no recorte atual`,
          'Evita pausar campanha por amostra pequena.'
        ),
        buildValue(
          'Proteção comercial',
          policy.campaign.blockPauseWithAnyConversion ? 'Se houver 1 conversão ou mais, a pausa automática fica bloqueada' : 'A pausa pode ocorrer mesmo com conversão, desde que você aprove.',
          'Uma campanha que já converteu merece tratamento mais cuidadoso.'
        ),
        buildValue(
          'Escala de verba',
          policy.campaign.requireApprovalForAnyBudgetChange ? 'Sempre com aprovação' : 'Pode escalar automaticamente dentro do teto configurado',
          'Verba é a área mais sensível do sistema.'
        ),
        buildValue(
          'Aumento sugerido com teto',
          `Até ${policy.campaign.recommendationBudgetIncreasePercent}% continua controlado; acima de ${policy.campaign.hardBlockBudgetIncreasePercent}% fica bloqueado por padrão`,
          'Limita decisões impulsivas de mídia.'
        )
      ],
      systemCan: [
        'Sincronizar snapshots e preparar preflight do Google Ads.',
        'Pausar campanha com aprovação quando ela gasta, clica e não converte.',
        'Abrir operação pronta para revisão com contexto completo.'
      ],
      systemNeedsApproval: [
        'Qualquer pausa sensível.',
        'Qualquer mudança de verba.',
        'Redistribuição de prioridade entre campanhas.'
      ],
      systemWillNotDo: [
        'Criar campanha nova sozinho.',
        'Escalar orçamento agressivamente.',
        'Pausar campanha que já converteu no recorte quando a proteção estiver ligada.'
      ]
    },
    {
      key: 'page',
      title: 'Páginas',
      autonomyLabel: 'Revisão assistida',
      summary: 'A IA pode diagnosticar e priorizar páginas, mas publicar mudança em copy ou CTA ainda fica protegido.',
      values: [
        buildValue('Publicação automática', policy.page.autoPublishEnabled ? 'Ligada' : 'Desligada', 'Mudança de página mexe em conversão e posicionamento.'),
        buildValue('Ação automática permitida', 'Criar task, ranquear urgência e abrir contexto certo', 'A IA acelera a operação sem publicar alteração silenciosa.'),
        buildValue('Mudança em copy/CTA', 'Sempre com revisão humana', 'Mantém sua caneta nas mensagens do negócio.')
      ],
      systemCan: [
        'Detectar gargalo de CTA e conversão.',
        'Abrir tarefa com contexto e prioridade.',
        'Levar você direto para a página que precisa de ação.'
      ],
      systemNeedsApproval: [
        'Publicar alteração de hero, CTA ou prova.',
        'Pausar campanha por causa da página.'
      ],
      systemWillNotDo: [
        'Editar landing em produção sem validação.',
        'Trocar promessa comercial sozinho.'
      ]
    },
    {
      key: 'product',
      title: 'Produtos',
      autonomyLabel: 'Priorização automática, distribuição assistida',
      summary: 'A IA pode ranquear produto e puxar sua atenção, mas não deve redistribuir esforço comercial pesado sem validação.',
      values: [
        buildValue('Repriorização interna', 'Ligada', 'Score, ranking e tasks podem rodar sozinhos.'),
        buildValue('Mudança de distribuição externa', policy.product.autoDistributionEnabled ? 'Ligada com cuidado' : 'Sempre com aprovação', 'Produto envolve verba, operação e foco comercial.'),
        buildValue('Produto core protegido', 'Cartão Porto, Seguro Celular, Viagem e Vida nunca recebem corte automático', 'Protege as frentes principais do negócio.')
      ],
      systemCan: [
        'Reclassificar prioridade e urgência.',
        'Gerar missão do dia e tasks.',
        'Abrir aprovação pronta para escala ou revisão.'
      ],
      systemNeedsApproval: [
        'Aumentar distribuição comercial.',
        'Mexer em foco de produto principal.'
      ],
      systemWillNotDo: [
        'Reduzir produto core automaticamente.',
        'Trocar prioridade estratégica sozinho.'
      ]
    },
    {
      key: 'seo',
      title: 'SEO',
      autonomyLabel: 'Somente recomendação executável',
      summary: 'A IA já consegue enxergar oportunidade orgânica, mas publicação automática ainda não é segura neste estágio.',
      values: [
        buildValue('Leitura automática', 'Ligada', 'A IA já pode gerar oportunidades e prioridades diariamente.'),
        buildValue('Publicação automática de title/meta', policy.seo.autoPublishEnabled ? 'Ligada com cautela' : 'Desligada', 'Ainda falta histórico suficiente para confiar em mudança autônoma.'),
        buildValue('Mudança de conteúdo', 'Sempre com aprovação', 'Conteúdo mexe em tráfego e posicionamento por semanas.')
      ],
      systemCan: [
        'Identificar queries promissoras.',
        'Priorizar páginas para atualizar.',
        'Abrir checklist executável para SEO.'
      ],
      systemNeedsApproval: [
        'Alterar title/meta.',
        'Subir nova página ou conteúdo.'
      ],
      systemWillNotDo: [
        'Publicar SEO direto em produção.',
        'Trocar estrutura de conteúdo sozinho.'
      ]
    },
    {
      key: 'integration',
      title: 'Integrações',
      autonomyLabel: 'Seguro automático',
      summary: 'Quando o risco é baixo, a IA pode agir sozinha para sincronizar e manter a base viva.',
      values: [
        buildValue('Sync automático', policy.integration.autoSyncWhenReady ? 'Ligado quando o conector está saudável' : 'Desligado', 'Mantém snapshots e observabilidade em dia.'),
        buildValue('Ação com credencial faltante', 'Bloqueada', 'Sem credencial completa o sistema só orienta o próximo passo.'),
        buildValue('Revalidação pós-sync', 'Sempre ligada', 'Toda ação automática volta ao cockpit para conferência.')
      ],
      systemCan: [
        'Sincronizar conectores prontos.',
        'Testar readiness e registrar bloqueios.',
        'Atualizar a fila operacional sozinha.'
      ],
      systemNeedsApproval: [
        'Troca de credenciais sensíveis.',
        'Ativação de integração nova em produção.'
      ],
      systemWillNotDo: [
        'Inventar credencial faltante.',
        'Mascarar conector parcial como pronto.'
      ]
    }
  ];
}

const EXECUTION_FLOWS = [
  {
    key: 'safe-auto',
    title: 'Automático seguro',
    description: 'Sync, task, priorização interna e atualizações sem risco financeiro direto.',
    examples: ['Atualizar snapshots', 'Gerar checklist', 'Reordenar prioridades', 'Criar tasks']
  },
  {
    key: 'approval-limited',
    title: 'Aprovação com limite',
    description: 'Ação sensível só roda depois da sua caneta e ainda passa pelas travas conservadoras.',
    examples: ['Pausar campanha sem conversão', 'Escalar distribuição de produto', 'Mexer em campanha']
  },
  {
    key: 'recommendation-only',
    title: 'Somente recomendação',
    description: 'A IA entrega diagnóstico, contexto e plano, mas a execução segue humana.',
    examples: ['Publicar copy nova', 'Trocar title/meta', 'Mudar promessa de oferta']
  }
];

export async function getExecutionGuardrailPolicy() {
  const stored = await readExecutionGuardrailSetting();
  return stored?.value || normalizeExecutionGuardrailPolicy(defaultExecutionGuardrailPolicy);
}

export async function getExecutionGuardrailsSnapshot() {
  const policy = await getExecutionGuardrailPolicy();
  const stored = await readExecutionGuardrailSetting();

  return {
    checkedAt: new Date().toISOString(),
    profile: EXECUTION_GUARDRAIL_PROFILE,
    policy,
    flows: EXECUTION_FLOWS,
    domains: buildGuardrailDomains(policy),
    summary: {
      automaticSafe: 2,
      limitedWithApproval: 2,
      recommendationOnly: 2
    },
    autonomy: summarizeExecutionAutonomy(policy),
    source: {
      isCustomized: Boolean(stored),
      updatedAt: stored?.updatedAt || null,
      updatedBy: stored?.updatedBy || null
    }
  };
}

export async function saveExecutionGuardrailPolicy({ policy, actor = 'admin' }) {
  const normalized = normalizeExecutionGuardrailPolicy(policy);
  await upsertAdminRuntimeSetting({
    settingKey: EXECUTION_GUARDRAIL_SETTING_KEY,
    value: normalized,
    actor
  });

  return getExecutionGuardrailsSnapshot();
}

export async function resetExecutionGuardrailPolicy() {
  await deleteAdminRuntimeSetting(EXECUTION_GUARDRAIL_SETTING_KEY);
  return getExecutionGuardrailsSnapshot();
}

export async function evaluateDispatchGuardrails({ operation, dispatchPacket }) {
  const policy = await getExecutionGuardrailPolicy();
  const sourceType = operation?.sourceType || dispatchPacket?.kind || 'generic';

  if (sourceType === 'campaign') {
    const spend = Number(dispatchPacket?.target?.spend || 0);
    const clicks = Number(dispatchPacket?.target?.clicks || 0);
    const conversions = Number(dispatchPacket?.target?.conversions || 0);
    const status = String(dispatchPacket?.target?.status || '').toLowerCase();
    const reasons = [];

    if (dispatchPacket?.readiness === 'blocked') {
      reasons.push('O conector ainda não está pronto para mutação externa.');
    }

    if (dispatchPacket?.command === 'review-or-pause') {
      if (status.includes('pausad')) {
        reasons.push('A campanha já está pausada e não deve receber nova mutação.');
      }

      if (policy.campaign.blockPauseWithAnyConversion && conversions >= 1) {
        reasons.push('A campanha já converteu no recorte atual e precisa de revisão humana antes de pausar.');
      }

      if (spend < policy.campaign.minimumSpendForPause) {
        reasons.push(`Ainda não há gasto suficiente para pausa automática. Régua atual: R$ ${policy.campaign.minimumSpendForPause}.`);
      }

      if (clicks < policy.campaign.minimumClicksForPause) {
        reasons.push(`Ainda não há clique suficiente para pausa automática. Régua atual: ${policy.campaign.minimumClicksForPause} cliques.`);
      }
    }

    if (!reasons.length && dispatchPacket?.command === 'review-or-pause') {
      return {
        mode: 'external_safe',
        canMutateExternally: true,
        summary: 'Dentro da política atual: a campanha pode ser pausada depois da sua aprovação.',
        reasons: []
      };
    }

    if (dispatchPacket?.command === 'review-or-pause') {
      return {
        mode: 'blocked',
        canMutateExternally: false,
        summary: reasons[0] || 'A política atual bloqueou a mutação externa desta campanha.',
        reasons
      };
    }

    return {
      mode: 'assist_only',
      canMutateExternally: false,
      summary: 'Mudanças de orçamento continuam assistidas neste estágio do projeto.',
      reasons: [
        `Aumento sugerido acima de ${policy.campaign.recommendationBudgetIncreasePercent}% segue pedindo sua aprovação.`,
        `Acima de ${policy.campaign.hardBlockBudgetIncreasePercent}% o sistema bloqueia a execução por padrão.`
      ]
    };
  }

  if (sourceType === 'integration') {
    return {
      mode: dispatchPacket?.readiness === 'blocked' || !policy.integration.autoSyncWhenReady ? 'blocked' : 'external_safe',
      canMutateExternally: dispatchPacket?.readiness !== 'blocked' && policy.integration.autoSyncWhenReady,
      summary:
        dispatchPacket?.readiness === 'blocked'
          ? 'A integração ainda não está pronta para sync automático.'
          : policy.integration.autoSyncWhenReady
            ? 'A integração pode rodar sync automático com segurança.'
            : 'O sync automático foi desligado na política atual.',
      reasons:
        dispatchPacket?.readiness === 'blocked'
          ? [dispatchPacket?.preflight?.summary || 'Faltam credenciais ou readiness do conector.']
          : policy.integration.autoSyncWhenReady
            ? []
            : ['A política atual exige disparo manual para sync de integração.']
    };
  }

  if (sourceType === 'page') {
    return {
      mode: policy.page.autoPublishEnabled ? 'assist_only' : 'assist_only',
      canMutateExternally: false,
      summary: 'A IA pode organizar a fila e preparar o contexto, mas publicação em página continua protegida.',
      reasons: ['Mudança de copy, CTA e hero ainda depende de revisão humana.']
    };
  }

  if (sourceType === 'product') {
    const protectedProduct = policy.product.protectedCoreProducts.includes(String(operation?.sourceId || '').trim());

    return {
      mode: 'assist_only',
      canMutateExternally: false,
      summary: protectedProduct
        ? 'Produto core protegido: a IA pode priorizar internamente, mas qualquer mudança externa continua assistida.'
        : policy.product.autoDistributionEnabled
          ? 'A distribuição externa está mais solta, mas ainda não roda sem operador.'
          : 'A IA pode priorizar internamente, mas distribuição externa continua assistida.',
      reasons: protectedProduct
        ? ['Produtos principais do negócio não recebem corte ou redistribuição automática.']
        : ['Escala e redistribuição comercial continuam exigindo validação humana.']
    };
  }

  if (sourceType === 'seo') {
    return {
      mode: 'assist_only',
      canMutateExternally: false,
      summary: 'SEO já entra no radar operacional, mas publicação automática continua bloqueada por segurança.',
      reasons: ['Title, meta e conteúdo ainda precisam de aprovação antes de ir para produção.']
    };
  }

  return {
    mode: 'external_safe',
    canMutateExternally: true,
    summary: 'Operação interna segura para execução.',
    reasons: []
  };
}
