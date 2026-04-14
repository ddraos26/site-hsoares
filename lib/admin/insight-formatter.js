import 'server-only';

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function formatInsightRecord(payload) {
  const priority = payload.priority || 'Média';
  const requiresApproval = Boolean(payload.requiresApproval);
  const title = payload.title || 'Insight';

  return {
    id: payload.id || `${payload.scopeType || 'scope'}-${payload.scopeId || slugify(title)}-${slugify(payload.insightType || 'insight')}`,
    scopeType: payload.scopeType || 'global',
    scopeId: payload.scopeId || slugify(title),
    insightType: payload.insightType || 'diagnostic',
    title,
    diagnosis: payload.diagnosis || '',
    reason: payload.reason || '',
    recommendation: payload.recommendation || '',
    priority,
    priorityRank: { Urgente: 4, Alta: 3, Média: 2, Baixa: 1 }[priority] || 0,
    impactEstimate: payload.impactEstimate || '',
    requiresApproval,
    requiresApprovalLabel: requiresApproval ? 'Sim' : 'Não',
    status: payload.status || 'ativo',
    tone: payload.tone || 'neutral',
    sourceRuleId: payload.sourceRuleId || null,
    evidence: payload.evidence || [],
    createdAt: payload.createdAt || new Date().toISOString()
  };
}
