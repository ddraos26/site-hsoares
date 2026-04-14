export const LEAD_STATUSES = ['novo', 'em_contato', 'ganho', 'perdido'];
export const LEAD_FIRST_RESPONSE_SLA_HOURS = 1;

export function isOpenLeadStatus(status) {
  return status === 'novo' || status === 'em_contato';
}

export function getLeadAgeHours(value) {
  if (!value) return 0;

  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return 0;

  return Math.max(0, Math.floor((Date.now() - parsed) / (60 * 60 * 1000)));
}

export function isLeadSlaLate({ leadStatus, createdAt }) {
  return leadStatus === 'novo' && getLeadAgeHours(createdAt) >= LEAD_FIRST_RESPONSE_SLA_HOURS;
}

export function isLeadFollowUpLate({ leadStatus, nextContactAt }) {
  return Boolean(
    isOpenLeadStatus(leadStatus) &&
      nextContactAt &&
      !Number.isNaN(Date.parse(nextContactAt)) &&
      Date.parse(nextContactAt) < Date.now()
  );
}

export function formatLeadStatus(status) {
  return (
    {
      novo: 'Novo',
      em_contato: 'Em contato',
      ganho: 'Ganho',
      perdido: 'Perdido'
    }[status] || status
  );
}

export function resolveLeadAutomationState({ leadStatus, ownerName, nextContactAt, notes, lossReason }) {
  let effectiveStatus = leadStatus || 'novo';
  let effectiveNextContactAt = nextContactAt || '';
  let effectiveLossReason = lossReason || '';
  const messages = [];

  if (
    effectiveStatus === 'novo' &&
    (String(ownerName || '').trim() || String(nextContactAt || '').trim() || String(notes || '').trim())
  ) {
    effectiveStatus = 'em_contato';
    messages.push('Ao salvar, este lead sobe automaticamente para Em contato porque já existe andamento operacional.');
  }

  if ((effectiveStatus === 'ganho' || effectiveStatus === 'perdido') && effectiveNextContactAt) {
    effectiveNextContactAt = '';
    messages.push('Ao encerrar a oportunidade, o próximo contato é removido automaticamente para limpar a fila.');
  }

  if (effectiveStatus !== 'perdido' && effectiveLossReason) {
    effectiveLossReason = '';
  }

  return {
    effectiveStatus,
    effectiveNextContactAt,
    effectiveLossReason,
    messages
  };
}

export function deriveLeadTaskStatus({ leadStatus, ownerName, nextContactAt, notes }) {
  const normalizedStatus = String(leadStatus || '').trim();
  const hasOperationalProgress =
    Boolean(String(ownerName || '').trim()) ||
    Boolean(String(nextContactAt || '').trim()) ||
    Boolean(String(notes || '').trim());

  if (normalizedStatus === 'ganho' || normalizedStatus === 'perdido') {
    return 'done';
  }

  if (normalizedStatus === 'em_contato' || hasOperationalProgress) {
    return 'doing';
  }

  return 'pending';
}

export function buildLeadQuickWhatsappMessage({ name, productSlug }) {
  const firstName = String(name || '').trim().split(' ')[0] || 'tudo bem';
  const productLabel = String(productSlug || '').trim().replace(/-/g, ' ');

  if (productLabel) {
    return `Olá, ${firstName}! Aqui é da H Soares Seguros. Recebemos seu interesse em ${productLabel} e já posso te orientar nos próximos passos.`;
  }

  return `Olá, ${firstName}! Aqui é da H Soares Seguros. Recebemos seu contato e já posso te orientar nos próximos passos.`;
}
