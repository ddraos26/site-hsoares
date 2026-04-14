import { formatPageLabel } from '@/lib/admin/page-presentation';

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function round(value) {
  return Math.round(Number(value || 0));
}

function buildPriorityLabel(score) {
  if (score >= 78) return 'Muito alta';
  if (score >= 58) return 'Alta';
  if (score >= 38) return 'Média';
  return 'Baixa';
}

function buildImpactLabel(score) {
  if (score >= 78) return 'Impacto direto em receita ou desperdício';
  if (score >= 58) return 'Impacto relevante em captação';
  if (score >= 38) return 'Impacto incremental';
  return 'Impacto baixo no momento';
}

function buildExecutionDescriptor({ level, entityLabel, action }) {
  if (level === 'safe_auto') {
    return {
      level,
      label: 'Automático seguro',
      requiresApproval: false,
      title: 'O sistema já pode agir',
      summary: `Podemos ${action} sem risco operacional alto.`,
      nextStep: `Gerar checklist e reposicionar ${entityLabel} automaticamente.`
    };
  }

  if (level === 'approval') {
    return {
      level,
      label: 'Precisa da sua decisão',
      requiresApproval: true,
      title: 'Precisa da sua caneta',
      summary: `Existe espaço para ${action}, mas isso mexe em verba, prioridade ou distribuição.`,
      nextStep: `Decidir se vale seguir com ${entityLabel} agora e executar isso no lugar certo.`
    };
  }

  return {
    level: 'recommendation',
    label: 'Somente recomendação',
    requiresApproval: false,
    title: 'Manter em observação',
    summary: `Ainda não vale automatizar ${entityLabel}; o melhor agora é acompanhar e revisar.`,
    nextStep: `Manter ${entityLabel} monitorado e reagir quando o sinal ficar mais forte.`
  };
}

function buildProductState(item) {
  const views = Number(item.views || 0);
  const clicks = Number(item.clicks || 0);
  const leads = Number(item.leads || 0);
  const gains = Number(item.ganhos || 0);
  const losses = Number(item.perdidos || 0);
  const clickRate = Number(item.clickRate || 0);
  const leadRate = Number(item.leadRate || 0);

  if (views >= 80 && leads === 0) return 'waste';
  if (clicks >= 12 && leadRate < 8) return 'conversion_gap';
  if (leadRate >= 18 && views < 90) return 'scale';
  if (leads > 0 && views < 35) return 'hidden_winner';
  if (losses > gains && leads >= 3) return 'commercial_friction';
  return 'stable';
}

function buildPageState(item) {
  const views = Number(item.views || 0);
  const clicks = Number(item.clicks || 0);
  const leads = Number(item.leads || 0);
  const clickRate = Number(item.clickRate || 0);
  const leadRate = Number(item.leadRate || 0);

  if (views >= 80 && leads === 0) return 'conversion_bottleneck';
  if (views >= 50 && clickRate < 4) return 'weak_cta';
  if (leadRate >= 12 && views < 120) return 'scale';
  if (leads > 0 && views < 30) return 'hidden_winner';
  if (clicks >= 14 && leadRate < 4) return 'low_intent';
  return 'stable';
}

function buildProductScores(item, state) {
  const views = Number(item.views || 0);
  const clicks = Number(item.clicks || 0);
  const leads = Number(item.leads || 0);
  const gains = Number(item.ganhos || 0);
  const losses = Number(item.perdidos || 0);
  const clickRate = Number(item.clickRate || 0);
  const leadRate = Number(item.leadRate || 0);

  const health = round(
    clamp((views / 180) * 18 + (clicks / 30) * 16 + (leads / 8) * 24 + (clickRate / 12) * 16 + (leadRate / 20) * 26)
  );
  const opportunity = round(
    clamp((leadRate / 18) * 42 + (leads / 6) * 26 + (views < 90 && leadRate >= 12 ? 18 : 0) + (clickRate >= 5 ? 10 : 0))
  );
  const profitPriority = round(clamp((gains / 4) * 34 + (leadRate / 16) * 28 + (leads / 6) * 16 - (losses / 4) * 18 + 12));
  const urgency = round(
    clamp(
      (state === 'waste' ? 44 : 0) +
        (state === 'conversion_gap' ? 34 : 0) +
        (state === 'commercial_friction' ? 28 : 0) +
        (views >= 140 && leadRate < 5 ? 18 : 0) +
        (losses > gains ? 10 : 0)
    )
  );
  const priority = round(clamp(opportunity * 0.38 + profitPriority * 0.24 + urgency * 0.38));

  return { health, opportunity, profitPriority, urgency, priority };
}

function buildPageScores(item, state) {
  const views = Number(item.views || 0);
  const clicks = Number(item.clicks || 0);
  const leads = Number(item.leads || 0);
  const clickRate = Number(item.clickRate || 0);
  const leadRate = Number(item.leadRate || 0);

  const health = round(
    clamp((views / 220) * 18 + (clicks / 35) * 18 + (leads / 6) * 28 + (clickRate / 10) * 18 + (leadRate / 14) * 18)
  );
  const opportunity = round(
    clamp((leadRate / 12) * 38 + (leads / 5) * 24 + (views < 120 && leadRate >= 10 ? 20 : 0) + (clickRate >= 4 ? 12 : 0))
  );
  const urgency = round(
    clamp(
      (state === 'conversion_bottleneck' ? 42 : 0) +
        (state === 'weak_cta' ? 34 : 0) +
        (state === 'low_intent' ? 26 : 0) +
        (views >= 120 && leadRate < 3 ? 14 : 0)
    )
  );
  const priority = round(clamp(opportunity * 0.34 + health * 0.24 + urgency * 0.42));

  return { health, opportunity, urgency, priority };
}

function buildProductDecisionCopy(item, state, scores) {
  const label = item.name || item.slug || 'produto';

  const byState = {
    waste: {
      tone: 'danger',
      headline: `${label} está consumindo atenção sem virar lead`,
      observation: `${item.views} visitas e ${item.clicks} cliques, mas nenhum lead no período.`,
      diagnosis: 'Existe procura, mas a proposta comercial ou a página não estão convertendo esse interesse em oportunidade.',
      reasons: [
        'Tráfego já validado, conversão ainda nula.',
        'Comprar mais mídia agora tende a ampliar desperdício.',
        'O gargalo parece estar entre clique, promessa e captura.'
      ],
      recommendation: 'Revisar oferta, CTA, argumento comercial e rota de captação antes de escalar.',
      impact: buildImpactLabel(scores.urgency),
      executionLevel: 'safe_auto',
      executionAction: 'abrir checklist de correção e retirar prioridade de escala'
    },
    conversion_gap: {
      tone: 'warning',
      headline: `${label} desperta interesse, mas perde eficiência na conversão`,
      observation: `${item.clicks} cliques e lead rate de ${item.leadRate.toFixed(1)}%.`,
      diagnosis: 'A curiosidade comercial existe, porém o produto não está fechando bem a passagem entre intenção e lead.',
      reasons: [
        'A mensagem gera clique, mas não sustenta o próximo passo.',
        'Há chance de desalinhamento entre anúncio, página e proposta.',
        'O problema parece mais de conversão do que de demanda.'
      ],
      recommendation: 'Refinar copy, prova de valor e CTA antes de aumentar distribuição.',
      impact: buildImpactLabel(scores.priority),
      executionLevel: 'safe_auto',
      executionAction: 'gerar tarefa de otimização de conversão'
    },
    scale: {
      tone: 'success',
      headline: `${label} merece ganhar mais distribuição`,
      observation: `Lead rate de ${item.leadRate.toFixed(1)}% com volume ainda controlado.`,
      diagnosis: 'O produto já mostra eficiência comercial suficiente para testar mais alcance com disciplina.',
      reasons: [
        'Conversão acima da média do portfólio.',
        'Baixo volume relativo frente ao potencial.',
        'Existe chance clara de capturar mais receita com mais distribuição.'
      ],
      recommendation: 'Priorizar mídia, remarketing ou reforço comercial para escalar com controle.',
      impact: buildImpactLabel(scores.opportunity),
      executionLevel: 'approval',
      executionAction: 'subir prioridade de investimento e distribuição'
    },
    hidden_winner: {
      tone: 'success',
      headline: `${label} é um vencedor escondido`,
      observation: `Pouco volume, mas já com ${item.leads} leads e sinais comerciais úteis.`,
      diagnosis: 'O produto responde bem no pouco tráfego que recebe, então o gargalo é exposição e não qualidade.',
      reasons: [
        'Já converteu antes de ganhar volume relevante.',
        'Existe espaço para crescer sem reinventar a oferta.',
        'Pode virar alavanca rápida de receita.'
      ],
      recommendation: 'Dar mais visibilidade e testar aquisição incremental com acompanhamento próximo.',
      impact: buildImpactLabel(scores.opportunity),
      executionLevel: 'approval',
      executionAction: 'elevar prioridade do produto na distribuição'
    },
    commercial_friction: {
      tone: 'warning',
      headline: `${label} gera conversa, mas sofre no fechamento`,
      observation: `${item.ganhos || 0} ganhos contra ${item.perdidos || 0} perdidos no recorte.`,
      diagnosis: 'O problema parece mais comercial do que de topo de funil: o produto atrai lead, mas perde força no meio da jornada.',
      reasons: [
        'Existe captação, porém a taxa de perda está pressionando resultado.',
        'Pode haver fricção de preço, timing ou expectativa.',
        'Vale ajustar abordagem antes de empurrar mais tráfego.'
      ],
      recommendation: 'Revisar objeções recorrentes, qualificação e discurso comercial do produto.',
      impact: buildImpactLabel(scores.urgency),
      executionLevel: 'recommendation',
      executionAction: 'manter revisão comercial assistida'
    },
    stable: {
      tone: 'premium',
      headline: `${label} está estável e sob controle`,
      observation: `O produto entrega leitura suficiente sem sinal forte de crise ou escala imediata.`,
      diagnosis: 'No momento, a melhor decisão é monitorar e agir quando houver sinal mais claro de desperdício ou oportunidade.',
      reasons: [
        'Sem gargalo dominante no recorte.',
        'Sem tração extraordinária pedindo escala imediata.',
        'O produto está pronto para acompanhamento contínuo.'
      ],
      recommendation: 'Manter o produto no radar e concentrar energia onde o impacto será maior hoje.',
      impact: buildImpactLabel(scores.priority),
      executionLevel: 'recommendation',
      executionAction: 'seguir em monitoramento'
    }
  };

  return byState[state] || byState.stable;
}

function buildPageDecisionCopy(item, state, scores) {
  const label = formatPageLabel(item.pagePath);

  const byState = {
    conversion_bottleneck: {
      tone: 'danger',
      headline: `${label} recebe tráfego, mas não entrega conversão`,
      observation: `${item.views} visitas com ${item.leads} leads no período.`,
      diagnosis: 'A página já prova demanda, então o gargalo está na mensagem, na oferta ou na passagem para ação.',
      reasons: [
        'Há entrada suficiente para diagnosticar desperdício.',
        'Escalar tráfego agora ampliaria perda.',
        'O problema parece de conversão da página, não de distribuição.'
      ],
      recommendation: 'Rever copy, prova, CTA e arquitetura da página antes de investir mais tráfego.',
      impact: buildImpactLabel(scores.urgency),
      executionLevel: 'safe_auto',
      executionAction: 'abrir checklist de correção de página'
    },
    weak_cta: {
      tone: 'warning',
      headline: `${label} está atraindo leitura, mas não empurra ação`,
      observation: `CTR interno de ${item.clickRate.toFixed(1)}% com tráfego já relevante.`,
      diagnosis: 'O usuário entra, mas o CTA principal não está conduzindo a próxima ação com clareza.',
      reasons: [
        'Interesse inicial existe, intenção não avança.',
        'CTA, hierarquia ou copy podem estar fracos.',
        'O ganho aqui vem mais de UX e mensagem do que de tráfego.'
      ],
      recommendation: 'Reforçar CTA principal, proposta de valor e hierarquia comercial da página.',
      impact: buildImpactLabel(scores.priority),
      executionLevel: 'safe_auto',
      executionAction: 'criar checklist de reforço de CTA'
    },
    scale: {
      tone: 'success',
      headline: `${label} está pronta para receber mais tráfego`,
      observation: `Lead rate de ${item.leadRate.toFixed(1)}% com volume ainda controlado.`,
      diagnosis: 'A página já mostra eficiência suficiente para testar mais distribuição sem operar no escuro.',
      reasons: [
        'Conversão acima do nível de conforto.',
        'Volume ainda baixo diante da eficiência.',
        'Boa candidata para mídia, orgânico ou remarketing.'
      ],
      recommendation: 'Empurrar mais tráfego qualificado e medir sustentação da conversão.',
      impact: buildImpactLabel(scores.opportunity),
      executionLevel: 'approval',
      executionAction: 'aumentar distribuição da página'
    },
    hidden_winner: {
      tone: 'success',
      headline: `${label} converte bem mesmo com pouca exposição`,
      observation: `Poucas visitas, mas já com captação ativa.`,
      diagnosis: 'A página responde melhor do que o volume atual sugere, então o gargalo principal é descoberta.',
      reasons: [
        'Boa resposta com pouca audiência.',
        'Oportunidade clara de ganho incremental.',
        'Pode virar rota prioritária do produto ligado.'
      ],
      recommendation: 'Ganhar visibilidade com mídia, links internos ou reforço orgânico.',
      impact: buildImpactLabel(scores.opportunity),
      executionLevel: 'approval',
      executionAction: 'subir prioridade de distribuição'
    },
    low_intent: {
      tone: 'warning',
      headline: `${label} gera clique, mas pouca intenção comercial real`,
      observation: `${item.clicks} cliques com lead rate de ${item.leadRate.toFixed(1)}%.`,
      diagnosis: 'O usuário interage, mas a jornada ainda não está filtrando ou convencendo o suficiente.',
      reasons: [
        'A ação acontece, porém não amadurece em lead.',
        'Pode haver fricção entre CTA e expectativa.',
        'Vale revisar qualidade do clique e da proposta.'
      ],
      recommendation: 'Ajustar CTA, clareza da oferta e alinhamento entre intenção e próximo passo.',
      impact: buildImpactLabel(scores.priority),
      executionLevel: 'recommendation',
      executionAction: 'seguir em revisão assistida'
    },
    stable: {
      tone: 'premium',
      headline: `${label} está estável e monitorada`,
      observation: 'Não há sinal dominante de crise ou de oportunidade extraordinária neste recorte.',
      diagnosis: 'A página segue útil para acompanhamento, mas não precisa roubar a prioridade do dia.',
      reasons: [
        'Sem gargalo dominante agora.',
        'Sem sinal forte de escala imediata.',
        'Acompanhamento contínuo é suficiente no momento.'
      ],
      recommendation: 'Manter monitoramento e focar em páginas com sinal mais claro de retorno.',
      impact: buildImpactLabel(scores.priority),
      executionLevel: 'recommendation',
      executionAction: 'seguir em observação'
    }
  };

  return byState[state] || byState.stable;
}

function buildDecisionModel(copy, scores, entityLabel) {
  return {
    tone: copy.tone,
    headline: copy.headline,
    scores: {
      ...scores,
      priorityLabel: buildPriorityLabel(scores.priority)
    },
    observability: {
      title: 'Observabilidade',
      summary: copy.observation
    },
    diagnosis: {
      title: 'Diagnóstico',
      summary: copy.diagnosis,
      reasons: copy.reasons
    },
    recommendation: {
      title: 'Recomendação',
      summary: copy.recommendation,
      priority: buildPriorityLabel(scores.priority),
      impact: copy.impact
    },
    automation: buildExecutionDescriptor({
      level: copy.executionLevel,
      entityLabel,
      action: copy.executionAction
    })
  };
}

function buildPageSiteMutationCandidate(item, state) {
  return null;
}

export function decorateProductForDecision(item) {
  const state = buildProductState(item);
  const scores = buildProductScores(item, state);
  const copy = buildProductDecisionCopy(item, state, scores);

  return {
    ...item,
    decision: buildDecisionModel(copy, scores, `o produto ${item.name || item.slug || ''}`.trim())
  };
}

export function decoratePageForDecision(item) {
  const state = buildPageState(item);
  const scores = buildPageScores(item, state);
  const copy = buildPageDecisionCopy(item, state, scores);
  const siteMutationCandidate = buildPageSiteMutationCandidate(item, state);
  const pageLabel = formatPageLabel(item.pagePath);

  return {
    ...item,
    decision: {
      ...buildDecisionModel(copy, scores, `a página ${pageLabel || ''}`.trim()),
      siteMutationCandidate
    }
  };
}

function buildCommandCenter(items = [], entityLabel) {
  const sorted = [...items].sort(
    (left, right) =>
      Number(right.decision?.scores?.priority || 0) - Number(left.decision?.scores?.priority || 0) ||
      Number(right.decision?.scores?.opportunity || 0) - Number(left.decision?.scores?.opportunity || 0)
  );

  const topPriority = sorted[0] || null;
  const urgentFix = sorted.find((item) => Number(item.decision?.scores?.urgency || 0) >= 60) || null;
  const scaleCandidate = sorted.find(
    (item) => item.decision?.automation?.level === 'approval' && Number(item.decision?.scores?.opportunity || 0) >= 55
  ) || null;

  const approvalCount = sorted.filter((item) => item.decision?.automation?.requiresApproval).length;
  const autoSafeCount = sorted.filter((item) => item.decision?.automation?.level === 'safe_auto').length;
  const healthyCount = sorted.filter(
    (item) =>
      Number(item.decision?.scores?.health || 0) >= 60 &&
      Number(item.decision?.scores?.urgency || 0) < 45
  ).length;

  return {
    topPriority,
    urgentFix,
    scaleCandidate,
    approvalCount,
    autoSafeCount,
    healthyCount,
    mission: topPriority
      ? `A IA já resumiu a leitura de ${entityLabel}: ${topPriority.decision.headline}`
      : `Ainda faltam sinais para a IA montar uma prioridade forte de ${entityLabel}.`
  };
}

export function buildProductsCommandCenter(items = []) {
  return buildCommandCenter(items, 'produtos');
}

export function buildPagesCommandCenter(items = []) {
  return buildCommandCenter(items, 'páginas');
}
