'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminGuidePanel } from '@/components/admin/admin-guide-panel';
import { AdminShell } from '@/components/admin-shell';
import {
  buildLeadQuickWhatsappMessage,
  formatLeadStatus,
  isLeadSlaLate,
  LEAD_STATUSES,
  LEAD_FIRST_RESPONSE_SLA_HOURS,
  resolveLeadAutomationState
} from '@/lib/admin/lead-automation';

const LOSS_REASON_OPTIONS = [
  'Preço',
  'Cobertura',
  'Sem retorno do cliente',
  'Fechou com concorrente',
  'Momento inadequado',
  'Documentação pendente',
  'Perfil recusado',
  'Outro'
];

function defaultRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10)
  };
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('pt-BR');
}

function formatDateTimeLocalValue(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

function normalizeWhatsappLink(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('55')) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

function buildOutlookComposeLink(email) {
  const target = String(email || '').trim();
  if (!target) return '';
  return `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(target)}`;
}

function escapeCsvCell(value) {
  const text = String(value ?? '');
  if (!text) return '';
  const normalized = text.replace(/\r?\n/g, ' ').trim();
  if (/[;"\n,]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
}

function getLeadParamFromUrl() {
  if (typeof window === 'undefined') return '';
  const params = new URLSearchParams(window.location.search);
  return params.get('lead') || '';
}

function getGuideParamFromUrl() {
  if (typeof window === 'undefined') return '';
  const params = new URLSearchParams(window.location.search);
  return params.get('guide') || '';
}

function getUrlFilterState() {
  if (typeof window === 'undefined') {
    return {
      status: '',
      product: '',
      owner: '',
      q: '',
      view: 'lista'
    };
  }

  const params = new URLSearchParams(window.location.search);

  return {
    status: params.get('status') || '',
    product: params.get('product') || '',
    owner: params.get('owner') || '',
    q: params.get('q') || '',
    view: params.get('view') === 'kanban' ? 'kanban' : 'lista'
  };
}

function formatNumber(value) {
  return new Intl.NumberFormat('pt-BR').format(Number(value || 0));
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function isOpenLeadStatus(status) {
  return status === 'novo' || status === 'em_contato';
}

function isLeadSlaBreached(lead) {
  return isLeadSlaLate({
    leadStatus: lead?.lead_status,
    createdAt: lead?.created_at
  });
}

function buildLeadPriorityScore(lead) {
  let score = 0;

  if (lead.lead_status === 'novo') score += 30;
  if (lead.lead_status === 'em_contato') score += 20;
  if (!String(lead.owner_name || '').trim()) score += 18;
  if (isLeadSlaBreached(lead)) score += 36;

  if (lead.next_contact_at && Date.parse(lead.next_contact_at) < Date.now()) {
    score += 28;
  }

  const ageInDays = Math.floor((Date.now() - Date.parse(lead.created_at || Date.now())) / (24 * 60 * 60 * 1000));

  if (ageInDays <= 2) score += 18;
  if (String(lead.product_slug || '').includes('seguro-celular')) score += 8;

  return score;
}

function formatLeadAge(value) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  const diff = Date.now() - date.getTime();
  const hours = Math.max(1, Math.floor(diff / (60 * 60 * 1000)));

  if (hours < 24) {
    return `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days}d`;
  }

  const months = Math.floor(days / 30);
  return `${months}m`;
}

function isLeadOverdue(lead) {
  return (
    isOpenLeadStatus(lead?.lead_status) &&
    lead?.next_contact_at &&
    Date.parse(lead.next_contact_at) < Date.now()
  );
}

function buildLeadNextMove(lead) {
  if (!String(lead?.owner_name || '').trim()) return 'Definir responsável';
  if (isLeadSlaBreached(lead)) return 'Responder agora para recuperar o SLA';
  if (isLeadOverdue(lead)) return 'Fazer follow-up agora';
  if (lead?.lead_status === 'novo') return 'Responder rápido';
  if (lead?.lead_status === 'em_contato') return 'Manter aquecido';
  if (lead?.lead_status === 'ganho') return 'Encaminhar pós-venda';
  return 'Registrar encerramento';
}

function buildLeadPrimaryContact(lead) {
  return lead?.whatsapp || lead?.email || '-';
}

function sortLeadsForDisplay(leads) {
  return [...leads].sort((left, right) => {
    const leftClosed = !isOpenLeadStatus(left.lead_status);
    const rightClosed = !isOpenLeadStatus(right.lead_status);

    if (leftClosed !== rightClosed) {
      return leftClosed ? 1 : -1;
    }

    const leftOverdue = isLeadOverdue(left);
    const rightOverdue = isLeadOverdue(right);
    if (leftOverdue !== rightOverdue) {
      return leftOverdue ? -1 : 1;
    }

    const leftSlaLate = isLeadSlaBreached(left);
    const rightSlaLate = isLeadSlaBreached(right);
    if (leftSlaLate !== rightSlaLate) {
      return leftSlaLate ? -1 : 1;
    }

    const leftUnassigned = !String(left.owner_name || '').trim();
    const rightUnassigned = !String(right.owner_name || '').trim();
    if (leftUnassigned !== rightUnassigned) {
      return leftUnassigned ? -1 : 1;
    }

    const statusWeight = {
      novo: 0,
      em_contato: 1,
      ganho: 2,
      perdido: 3
    };

    const weightDiff = (statusWeight[left.lead_status] ?? 99) - (statusWeight[right.lead_status] ?? 99);
    if (weightDiff !== 0) {
      return weightDiff;
    }

    return Date.parse(right.updated_at || right.created_at || 0) - Date.parse(left.updated_at || left.created_at || 0);
  });
}

export default function AdminLeadsPage() {
  const router = useRouter();
  const initial = useMemo(() => defaultRange(), []);
  const initialFilters = useMemo(() => getUrlFilterState(), []);
  const initialGuide = useMemo(() => getGuideParamFromUrl(), []);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [status, setStatus] = useState(initialFilters.status);
  const [product, setProduct] = useState(initialFilters.product);
  const [ownerFilter, setOwnerFilter] = useState(initialFilters.owner);
  const [query, setQuery] = useState(initialFilters.q);
  const [viewMode, setViewMode] = useState(initialFilters.view);
  const [guideMode] = useState(initialGuide);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('novo');
  const [selectedNotes, setSelectedNotes] = useState('');
  const [selectedOwner, setSelectedOwner] = useState('');
  const [selectedNextContactAt, setSelectedNextContactAt] = useState('');
  const [selectedLossReason, setSelectedLossReason] = useState('');
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [nextFocus, setNextFocus] = useState(null);
  const [draggingLeadId, setDraggingLeadId] = useState(null);
  const [dropStatus, setDropStatus] = useState('');
  const [isLeadDrawerOpen, setIsLeadDrawerOpen] = useState(false);
  const [preferredOwner, setPreferredOwner] = useState('');

  async function load(preferredId = getLeadParamFromUrl()) {
    setLoading(true);
    setFeedback('');

    try {
      const params = new URLSearchParams({ from, to });
      if (status) params.set('status', status);
      if (product) params.set('product', product);
      if (ownerFilter) params.set('owner', ownerFilter);
      if (query) params.set('q', query);

      const response = await fetch(`/api/admin/leads?${params}`);
      const payload = await response.json();
      const leads = payload.leads || [];
      setData(leads);

      const nextSelectedId = preferredId || (isLeadDrawerOpen ? selectedLead?.lead?.id : '');
      if (nextSelectedId && leads.some((lead) => lead.id === nextSelectedId)) {
        await openLead(nextSelectedId);
      } else {
        setSelectedLead(null);
        setIsLeadDrawerOpen(false);
      }
    } catch {
      setFeedback('Não foi possível carregar os leads.');
    } finally {
      setLoading(false);
    }
  }

  function syncLeadQueryParam(id) {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (id) {
      params.set('lead', id);
    } else {
      params.delete('lead');
    }
    const query = params.toString();
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}`;
    window.history.replaceState({}, '', nextUrl);
  }

  async function openLead(id, options = {}) {
    const shouldOpen = options.openDrawer ?? true;
    setDetailLoading(true);
    setFeedback('');
    if (shouldOpen) {
      setIsLeadDrawerOpen(true);
    }

    try {
      const response = await fetch(`/api/admin/leads/${id}`);
      const payload = await response.json();

      if (!response.ok) {
        setFeedback(payload.error || 'Não foi possível carregar o lead.');
        return;
      }

      setSelectedLead(payload);
      setSelectedStatus(payload.lead?.lead_status || 'novo');
      setSelectedNotes(payload.lead?.notes || '');
      setSelectedOwner(payload.lead?.owner_name || '');
      setSelectedNextContactAt(formatDateTimeLocalValue(payload.lead?.next_contact_at));
      setSelectedLossReason(payload.lead?.loss_reason || '');
      syncLeadQueryParam(id);
    } catch {
      setFeedback('Não foi possível carregar o lead.');
    } finally {
      setDetailLoading(false);
    }
  }

  function closeLeadDrawer() {
    setIsLeadDrawerOpen(false);
    syncLeadQueryParam('');
  }

  async function updateStatusQuick(id, nextStatus, options = {}) {
    const shouldReopenLead = options.reopenLead ?? (isLeadDrawerOpen && selectedLead?.lead?.id === id);
    setNextFocus(null);

    try {
      const response = await fetch(`/api/admin/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadStatus: nextStatus,
          actionKey: 'quick_status',
          actionLabel: 'Status atualizado'
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error('Falha ao atualizar status.');
      }

      await load(shouldReopenLead ? id : '');
      setNextFocus(payload?.nextFocus || null);
      setFeedback(
        payload.automation?.messages?.length
          ? `Lead reorganizado. ${payload.automation.messages[0]}`
          : 'Status do lead atualizado.'
      );
    } catch {
      setFeedback('Não foi possível atualizar o status do lead.');
    }
  }

  async function saveLead() {
    if (!selectedLead?.lead?.id) return;

    setSaving(true);
    setFeedback('');
    setNextFocus(null);

    const automation = resolveLeadAutomationState({
      leadStatus: selectedStatus,
      ownerName: selectedOwner,
      nextContactAt: selectedNextContactAt,
      notes: selectedNotes,
      lossReason: selectedLossReason
    });

    try {
      const response = await fetch(`/api/admin/leads/${selectedLead.lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadStatus: automation.effectiveStatus,
          ownerName: selectedOwner,
          nextContactAt: automation.effectiveNextContactAt || null,
          lossReason: automation.effectiveStatus === 'perdido' ? automation.effectiveLossReason : null,
          notes: selectedNotes
        })
      });
      const payload = await response.json();

      if (!response.ok) {
        setFeedback(payload.error || 'Não foi possível salvar o lead.');
        return;
      }
      if (selectedOwner && typeof window !== 'undefined') {
        setPreferredOwner(selectedOwner);
        window.localStorage.setItem('adminLeadPreferredOwner', selectedOwner);
      }

      await load(selectedLead.lead.id);
      setNextFocus(payload?.nextFocus || null);
      setFeedback(
        payload.automation?.messages?.length
          ? `Lead salvo com automação aplicada. ${payload.automation.messages[0]}`
          : 'Lead atualizado com sucesso.'
      );
    } catch {
      setFeedback('Não foi possível salvar o lead.');
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    load().catch(() => null);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const rememberedOwner = window.localStorage.getItem('adminLeadPreferredOwner') || '';
    setPreferredOwner(rememberedOwner);
  }, []);

  useEffect(() => {
    if (!isLeadDrawerOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        closeLeadDrawer();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLeadDrawerOpen]);

  const summary = useMemo(() => {
    const counts = {
      total: data.length,
      novo: 0,
      em_contato: 0,
      ganho: 0,
      perdido: 0
    };

    data.forEach((lead) => {
      counts[lead.lead_status] = (counts[lead.lead_status] || 0) + 1;
    });

    return counts;
  }, [data]);

  const ownerSuggestions = useMemo(
    () =>
      Array.from(new Set(data.map((lead) => String(lead.owner_name || '').trim()).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, 'pt-BR')
      ),
    [data]
  );

  const kanbanColumns = useMemo(
    () =>
      LEAD_STATUSES.map((item) => ({
        status: item,
        label: formatLeadStatus(item),
        leads: data.filter((lead) => lead.lead_status === item)
      })),
    [data]
  );

  const selectedDetails = selectedLead?.detailEvent?.details || [];
  const selectedAttachments = selectedLead?.attachments || selectedLead?.detailEvent?.attachments || [];
  const selectedAttachmentNames = selectedLead?.detailEvent?.attachmentNames || [];
  const selectedWhatsapp = normalizeWhatsappLink(selectedLead?.lead?.whatsapp);
  const selectedOutlookLink = buildOutlookComposeLink(selectedLead?.lead?.email);
  const selectedActivities = selectedLead?.activities || [];
  const selectedWhatsappMessage = buildLeadQuickWhatsappMessage({
    name: selectedLead?.lead?.nome,
    productSlug: selectedLead?.lead?.product_slug
  });
  const displayLeads = useMemo(() => sortLeadsForDisplay(data), [data]);
  const openPipeline = summary.novo + summary.em_contato;
  const overdueLeads = data.filter(
    (lead) =>
      isOpenLeadStatus(lead.lead_status) &&
      lead.next_contact_at &&
      Date.parse(lead.next_contact_at) < Date.now()
  );
  const slaLateLeads = data.filter((lead) => isLeadSlaBreached(lead));
  const unassignedLeads = data.filter(
    (lead) => isOpenLeadStatus(lead.lead_status) && !String(lead.owner_name || '').trim()
  );
  const winRate = summary.total ? Number(((summary.ganho / summary.total) * 100).toFixed(1)) : 0;
  const lossRate = summary.total ? Number(((summary.perdido / summary.total) * 100).toFixed(1)) : 0;
  const responsePressure = summary.total ? Number(((openPipeline / summary.total) * 100).toFixed(1)) : 0;

  const leadPriorityQueue = data
    .filter((lead) => isOpenLeadStatus(lead.lead_status))
    .map((lead) => ({
      ...lead,
      priorityScore: buildLeadPriorityScore(lead)
    }))
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 4);
  const guidedLead =
    leadPriorityQueue[0] ||
    displayLeads.find((lead) => isOpenLeadStatus(lead.lead_status)) ||
    displayLeads[0] ||
    null;
  const guideTitle =
    guideMode === 'lead-workflow'
      ? 'Passo a passo para tratar um lead sem se perder'
      : 'Como operar a Central de Leads';
  const guideDescription =
    guideMode === 'lead-workflow'
      ? 'Aqui o objetivo e abrir um lead, usar os botoes do painel lateral e salvar para a fila se reorganizar sozinha.'
      : 'Use esta tela como fila de atendimento. Nao tente interpretar tudo ao mesmo tempo: abra um lead, aja e salve.';

  const productHeat = Object.values(
    data.reduce((acc, lead) => {
      const key = String(lead.product_slug || 'sem-produto');
      if (!acc[key]) {
        acc[key] = { key, count: 0 };
      }
      acc[key].count += 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  const pipelineBars = LEAD_STATUSES.map((item) => {
    const count = summary[item] || 0;
    const percent = summary.total ? Math.max(8, (count / summary.total) * 100) : 0;
    return {
      key: item,
      label: formatLeadStatus(item),
      count,
      percent
    };
  });

  const leadActions = [
    {
      key: 'sla',
      tone: 'danger',
      title: 'Recuperar o SLA de primeira resposta',
      value: `${formatNumber(slaLateLeads.length)} leads novos fora do SLA de ${LEAD_FIRST_RESPONSE_SLA_HOURS}h`,
      description: slaLateLeads.length
        ? 'Esses leads pedem contato imediato para não virar perda por demora operacional.'
        : 'Nenhum lead novo passou do SLA interno neste recorte.'
    },
    {
      key: 'overdue',
      tone: 'warning',
      title: 'Atacar follow-ups vencidos',
      value: `${formatNumber(overdueLeads.length)} leads passaram do retorno combinado`,
      description: overdueLeads.length
        ? 'Esses leads já custaram atenção e podem esfriar sem uma ação rápida.'
        : 'Nenhum follow-up crítico vencido no momento.'
    },
    {
      key: 'assignment',
      tone: 'premium',
      title: 'Distribuir dono do lead',
      value: `${formatNumber(unassignedLeads.length)} leads sem responsável definido`,
      description: unassignedLeads.length
        ? 'Sem dono claro, o lead entra em zona cinzenta operacional.'
        : 'A fila aberta está bem distribuída.'
    }
  ];

  const automationPreview = useMemo(
    () =>
      resolveLeadAutomationState({
        leadStatus: selectedStatus,
        ownerName: selectedOwner,
        nextContactAt: selectedNextContactAt,
        notes: selectedNotes,
        lossReason: selectedLossReason
      }),
    [selectedStatus, selectedOwner, selectedNextContactAt, selectedNotes, selectedLossReason]
  );

  function resolveAssigneeName() {
    return (
      String(selectedOwner || '').trim() ||
      String(selectedLead?.lead?.owner_name || '').trim() ||
      String(preferredOwner || '').trim() ||
      String(ownerFilter || '').trim() ||
      ownerSuggestions[0] ||
      ''
    );
  }

  function resolveLeadDraftState(lead) {
    if (!lead?.id) {
      return {
        status: 'novo',
        owner: '',
        nextContactAt: '',
        lossReason: '',
        notes: ''
      };
    }

    if (selectedLead?.lead?.id === lead.id) {
      return {
        status: selectedStatus,
        owner: selectedOwner,
        nextContactAt: selectedNextContactAt,
        lossReason: selectedLossReason,
        notes: selectedNotes
      };
    }

    return {
      status: lead.lead_status || 'novo',
      owner: lead.owner_name || '',
      nextContactAt: lead.next_contact_at || '',
      lossReason: lead.loss_reason || '',
      notes: lead.notes || ''
    };
  }

  function resolveAssigneeNameForLead(lead, currentOwner = '') {
    return String(currentOwner || '').trim() || String(lead?.owner_name || '').trim() || resolveAssigneeName();
  }

  async function runLeadQuickAction(action, leadOverride = null) {
    const targetLead = leadOverride || selectedLead?.lead;
    if (!targetLead?.id) return;

    const leadDraft = resolveLeadDraftState(targetLead);
    const resolvedOwner = resolveAssigneeNameForLead(targetLead, leadDraft.owner);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    const configs = {
      assume: {
        payload: {
          ownerName: resolvedOwner,
          leadStatus: leadDraft.status === 'novo' ? 'em_contato' : leadDraft.status,
          actionKey: 'assume_lead',
          actionLabel: 'Lead assumido'
        },
        requiresOwner: true,
        feedback: 'Lead assumido e puxado para a fila ativa.'
      },
      tomorrow: {
        payload: {
          ownerName: leadDraft.owner || resolvedOwner || null,
          nextContactAt: tomorrow.toISOString(),
          leadStatus: leadDraft.status === 'novo' ? 'em_contato' : leadDraft.status,
          actionKey: 'schedule_tomorrow',
          actionLabel: 'Retorno agendado'
        },
        feedback: 'Retorno de amanhã agendado e fila reorganizada.'
      },
      won: {
        payload: {
          leadStatus: 'ganho',
          actionKey: 'mark_won',
          actionLabel: 'Lead marcado como ganho'
        },
        feedback: 'Lead marcado como ganho.'
      },
      lost: {
        payload: {
          leadStatus: 'perdido',
          lossReason: leadDraft.lossReason || 'Sem retorno do cliente',
          actionKey: 'mark_lost',
          actionLabel: 'Lead marcado como perdido'
        },
        feedback: 'Lead marcado como perdido.'
      }
    };

    const config = configs[action];
    if (!config) return;

    if (config.requiresOwner && !resolvedOwner) {
      setFeedback('Defina um responsável no lead pelo menos uma vez para a ação rápida “Assumir” ficar automática.');
      return;
    }

    setSaving(true);
    setFeedback('');
    setNextFocus(null);

    try {
      const response = await fetch(`/api/admin/leads/${targetLead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config.payload)
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Falha na ação rápida.');
      }

      if (config.payload.ownerName && typeof window !== 'undefined') {
        setPreferredOwner(config.payload.ownerName);
        window.localStorage.setItem('adminLeadPreferredOwner', config.payload.ownerName);
      }

      const shouldReopenLead = isLeadDrawerOpen && selectedLead?.lead?.id === targetLead.id;
      await load(shouldReopenLead ? targetLead.id : '');
      setNextFocus(payload?.nextFocus || null);
      setFeedback(
        payload.automation?.messages?.length ? `${config.feedback} ${payload.automation.messages[0]}` : config.feedback
      );
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Não foi possível executar a ação rápida.');
    } finally {
      setSaving(false);
    }
  }

  function handleLeadDragStart(leadId) {
    setDraggingLeadId(leadId);
    setDropStatus('');
  }

  function handleLeadDragEnd() {
    setDraggingLeadId(null);
    setDropStatus('');
  }

  function handleColumnDragOver(event, targetStatus) {
    event.preventDefault();
    if (!draggingLeadId) return;
    if (dropStatus !== targetStatus) {
      setDropStatus(targetStatus);
    }
  }

  async function handleColumnDrop(event, targetStatus) {
    event.preventDefault();
    const leadId = draggingLeadId;
    setDropStatus('');
    setDraggingLeadId(null);

    if (!leadId) return;
    const lead = data.find((item) => item.id === leadId);
    if (!lead || lead.lead_status === targetStatus) return;

    await updateStatusQuick(leadId, targetStatus, { reopenLead: false });
  }

  function exportCsv() {
    const headers = [
      'Data',
      'Status',
      'Nome',
      'WhatsApp',
      'Email',
      'Produto',
      'Página',
      'Responsável',
      'Próximo contato',
      'Motivo da perda',
      'Observações'
    ];

    const rows = data.map((lead) => [
      formatDate(lead.created_at),
      formatLeadStatus(lead.lead_status),
      lead.nome || '',
      lead.whatsapp || '',
      lead.email || '',
      lead.product_slug || '',
      lead.page_path || '',
      lead.owner_name || '',
      formatDate(lead.next_contact_at),
      lead.loss_reason || '',
      lead.notes || ''
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => escapeCsvCell(cell)).join(';'))
      .join('\n');

    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `leads-hsoares-${stamp}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function renderLeadCard(lead, compact = false, draggable = false) {
    const overdue = isLeadOverdue(lead);
    const slaLate = isLeadSlaBreached(lead);
    const priorityScore = buildLeadPriorityScore(lead);
    const whatsappLink = normalizeWhatsappLink(lead.whatsapp);

    if (compact) {
      return (
        <article
          key={lead.id}
          className={`admin-lead-card admin-lead-card--${lead.lead_status} ${selectedLead?.lead?.id === lead.id ? 'is-active' : ''} admin-lead-card--compact ${draggable ? 'admin-lead-card--draggable' : ''} ${draggingLeadId === lead.id ? 'is-dragging' : ''}`}
          draggable={draggable}
          onDragStart={() => handleLeadDragStart(lead.id)}
          onDragEnd={handleLeadDragEnd}
        >
          <div className="admin-lead-card-head">
            <div>
              <p className="admin-lead-date">{formatDate(lead.created_at)}</p>
              <h2>{lead.nome || 'Lead sem nome'}</h2>
            </div>
            <span className={`admin-status-badge admin-status-badge--${lead.lead_status}`}>{formatLeadStatus(lead.lead_status)}</span>
          </div>
          <div className="admin-lead-card-flags">
            {slaLate ? <span className="admin-lead-flag admin-lead-flag--warning">SLA estourado</span> : null}
            {overdue ? <span className="admin-lead-flag admin-lead-flag--danger">Follow-up vencido</span> : null}
          </div>
          {draggable ? <div className="admin-drag-hint">Arraste para mudar o status</div> : null}
          <div className="admin-lead-meta">
            <span>{lead.product_slug || '-'}</span>
            {lead.owner_name ? <span>Resp.: {lead.owner_name}</span> : null}
            {lead.next_contact_at ? <span>Retorno: {formatDate(lead.next_contact_at)}</span> : null}
          </div>
          <div className="admin-lead-contact">
            <p>{lead.whatsapp || '-'}</p>
            <p>{lead.email || '-'}</p>
          </div>
          {lead.notes ? <p className="admin-lead-notes-preview">{lead.notes}</p> : null}
          <div className="admin-kanban-card-foot">
            <button type="button" className="btn btn-ghost" onClick={() => openLead(lead.id)}>
              Abrir
            </button>
          </div>
        </article>
      );
    }

    return (
      <article
        key={lead.id}
        className={`admin-lead-card admin-lead-card--${lead.lead_status} admin-lead-card--list ${selectedLead?.lead?.id === lead.id ? 'is-active' : ''}`}
        role="button"
        tabIndex={0}
        onClick={() => openLead(lead.id)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openLead(lead.id);
          }
        }}
      >
        <div className="admin-lead-card-topline">
          <p className="admin-lead-date">{formatDate(lead.created_at)}</p>
          <div className="admin-lead-card-flags">
            {slaLate ? (
              <span className="admin-lead-flag admin-lead-flag--warning">
                Novo fora do SLA de {LEAD_FIRST_RESPONSE_SLA_HOURS}h
              </span>
            ) : null}
            {overdue ? <span className="admin-lead-flag admin-lead-flag--danger">Follow-up vencido</span> : null}
            <span className="admin-lead-flag admin-lead-flag--neutral">{formatLeadAge(lead.created_at)}</span>
            <span className={`admin-status-badge admin-status-badge--${lead.lead_status}`}>{formatLeadStatus(lead.lead_status)}</span>
          </div>
        </div>
        <div className="admin-lead-card-head admin-lead-card-head--list">
          <div>
            <h2>{lead.nome || 'Lead sem nome'}</h2>
            <p className="admin-lead-subtitle">
              {lead.owner_name ? `Responsável: ${lead.owner_name}` : 'Sem responsável definido'}
            </p>
          </div>
          <div className="admin-lead-score">
            <span>Score de ação</span>
            <strong>{priorityScore}</strong>
          </div>
        </div>
        <div className="admin-lead-meta">
          <span>{lead.product_slug || '-'}</span>
          <span>{lead.page_path || '-'}</span>
          {lead.next_contact_at ? <span>Retorno: {formatDate(lead.next_contact_at)}</span> : <span>Sem retorno marcado</span>}
          {lead.loss_reason ? <span>Perda: {lead.loss_reason}</span> : null}
        </div>
        <div className="admin-lead-list-layout">
          <div className="admin-lead-list-main">
            <div className="admin-lead-card-grid">
              <div className="admin-lead-card-stack">
                <span>Contato principal</span>
                <strong>{buildLeadPrimaryContact(lead)}</strong>
              </div>
              <div className="admin-lead-card-stack">
                <span>Próximo movimento</span>
                <strong>{buildLeadNextMove(lead)}</strong>
              </div>
            </div>
            {lead.notes ? <p className="admin-lead-notes-preview">{lead.notes}</p> : null}
          </div>

          <div className="admin-lead-list-side">
            <div className="admin-lead-quick-stack">
              <div className="admin-lead-quick-card">
                <span>WhatsApp</span>
                <strong>{lead.whatsapp || '-'}</strong>
              </div>
              <div className="admin-lead-quick-card">
                <span>E-mail</span>
                <strong>{lead.email || '-'}</strong>
              </div>
              <div className="admin-lead-quick-card">
                <span>Retorno</span>
                <strong>{lead.next_contact_at ? formatDate(lead.next_contact_at) : 'Sem agenda'}</strong>
              </div>
              <div className="admin-lead-quick-card">
                <span>Risco atual</span>
                <strong>
                  {overdue
                    ? 'Follow-up vencido'
                    : slaLate
                      ? `SLA de ${LEAD_FIRST_RESPONSE_SLA_HOURS}h estourado`
                      : 'Dentro do ritmo'}
                </strong>
              </div>
            </div>

            <div className="admin-lead-card-actions-group">
              <div className="admin-lead-card-footer admin-lead-card-footer--side">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={(event) => {
                    event.stopPropagation();
                    openLead(lead.id);
                  }}
                >
                  Abrir gestão
                </button>
                {whatsappLink ? (
                  <a
                    className="btn btn-ghost"
                    href={`https://wa.me/${whatsappLink}?text=${encodeURIComponent(
                      buildLeadQuickWhatsappMessage({ name: lead.nome, productSlug: lead.product_slug })
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(event) => event.stopPropagation()}
                  >
                    WhatsApp
                  </a>
                ) : null}
              </div>

              {isOpenLeadStatus(lead.lead_status) ? (
                <div className="admin-lead-card-footer admin-lead-card-footer--quick">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    disabled={saving}
                    onClick={(event) => {
                      event.stopPropagation();
                      void runLeadQuickAction('assume', lead);
                    }}
                  >
                    Assumir
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    disabled={saving}
                    onClick={(event) => {
                      event.stopPropagation();
                      void runLeadQuickAction('tomorrow', lead);
                    }}
                  >
                    Amanhã
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    disabled={saving}
                    onClick={(event) => {
                      event.stopPropagation();
                      void runLeadQuickAction('won', lead);
                    }}
                  >
                    Ganho
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    disabled={saving}
                    onClick={(event) => {
                      event.stopPropagation();
                      void runLeadQuickAction('lost', lead);
                    }}
                  >
                    Perdido
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <AdminShell
      section="leads"
      title="Central de Leads"
      description="Atendimento, priorização, follow-up, dono do lead e leitura operacional do funil comercial."
    >
      <section className="ops-hero ops-hero--leads">
        <div className="ops-hero-main">
          <p className="eyebrow">Central de atendimento</p>
          <h3>
            {slaLateLeads.length
              ? 'Hoje o foco é recuperar os leads novos que já saíram do SLA'
              : overdueLeads.length
              ? 'Hoje o foco é recuperar a fila que já está pedindo retorno'
              : summary.novo
                ? 'Hoje a missão é responder rápido e não deixar lead esfriar'
                : 'A operação de leads está organizada e pronta para refino fino'}
          </h3>
          <p>
            Essa área agora funciona como painel tático da operação comercial: mostra pressão da fila, follow-ups vencidos, leads sem dono, conversão por estágio e quem merece ação primeiro.
          </p>

          <div className="ops-chip-row">
            <span className="ops-chip ops-chip--danger">Fora do SLA: {formatNumber(slaLateLeads.length)}</span>
            <span className="ops-chip ops-chip--success">Win rate: {formatPercent(winRate)}</span>
            <span className="ops-chip ops-chip--warning">Loss rate: {formatPercent(lossRate)}</span>
            <span className="ops-chip ops-chip--premium">Fila aberta: {formatNumber(openPipeline)} leads</span>
          </div>
        </div>

        <aside className="ops-focus-card">
          <span>Pressão operacional</span>
          <strong>{formatPercent(responsePressure)}</strong>
          <p>Essa é a fatia da base que ainda está em aberto e depende de atendimento ativo para virar conversa útil, proposta ou fechamento.</p>
          <div className="ops-focus-meta">
            <div>
              <small>Fora SLA</small>
              <b>{formatNumber(slaLateLeads.length)}</b>
            </div>
            <div>
              <small>Vencidos</small>
              <b>{formatNumber(overdueLeads.length)}</b>
            </div>
            <div>
              <small>Sem dono</small>
              <b>{formatNumber(unassignedLeads.length)}</b>
            </div>
          </div>
        </aside>
      </section>

      <AdminGuidePanel
        eyebrow="Modo guiado"
        title={guideTitle}
        description={guideDescription}
        tone="success"
        steps={[
          {
            title: 'Comece por um lead da fila quente',
            description: 'Use "Fila para atacar já" ou clique em qualquer card da lista para abrir o lead.'
          },
          {
            title: 'No painel lateral, use os botões rápidos',
            description: 'Os botões mais importantes são "Assumir lead", "Abrir WhatsApp", "Retorno amanhã", "Marcar ganho" e "Marcar perdido".'
          },
          {
            title: 'Preencha responsável, próximo contato e observações se precisar',
            description: 'Isso deixa o lead organizado e evita que a próxima ação fique só na sua memória.'
          },
          {
            title: 'Finalize em "Salvar e reorganizar"',
            description: 'Esse clique confirma a mudança e move a fila automaticamente.'
          }
        ]}
      >
        {guidedLead ? (
          <button type="button" className="btn btn-primary" onClick={() => openLead(guidedLead.id)}>
            Abrir primeiro lead da fila
          </button>
        ) : null}
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => router.push('/admin/continuar')}
        >
          Continuar do ponto certo
        </button>
        {viewMode !== 'lista' ? (
          <button type="button" className="btn btn-ghost" onClick={() => setViewMode('lista')}>
            Ir para lista
          </button>
        ) : null}
      </AdminGuidePanel>

      {nextFocus ? (
        <section className="admin-guide-card admin-guide-card--success">
          <div className="admin-guide-head">
            <div>
              <span>Próxima pendência</span>
              <h3>{nextFocus.title}</h3>
            </div>
          </div>
          <p className="admin-guide-description">{nextFocus.reason}</p>
          <div className="admin-guide-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => router.push(nextFocus.href)}
            >
              Ir para a próxima frente
            </button>
          </div>
        </section>
      ) : null}

      <section className="ops-metric-grid">
        <article className="ops-metric-card ops-metric-card--danger">
          <span>SLA estourado</span>
          <strong>{formatNumber(slaLateLeads.length)}</strong>
          <small>Leads novos que já passaram do tempo interno de primeira resposta.</small>
        </article>
        <article className="ops-metric-card ops-metric-card--blue">
          <span>Total de leads</span>
          <strong>{formatNumber(summary.total)}</strong>
          <small>Leads carregados no recorte atual.</small>
        </article>
        <article className="ops-metric-card ops-metric-card--premium">
          <span>Em contato</span>
          <strong>{formatNumber(summary.em_contato)}</strong>
          <small>Base que exige continuidade e disciplina de follow-up.</small>
        </article>
        <article className="ops-metric-card ops-metric-card--success">
          <span>Ganhos</span>
          <strong>{formatNumber(summary.ganho)}</strong>
          <small>Conversas que já viraram resultado.</small>
        </article>
        <article className="ops-metric-card ops-metric-card--danger">
          <span>Perdidos</span>
          <strong>{formatNumber(summary.perdido)}</strong>
          <small>Volume que merece revisão de timing, proposta ou abordagem.</small>
        </article>
      </section>

      <section className="ops-grid">
        <article className="ops-panel">
          <div className="ops-panel-head">
            <div>
              <span>O que fazer agora</span>
              <h3>Prioridades da operação comercial</h3>
            </div>
          </div>
          <div className="ops-action-list">
            {leadActions.map((item, index) => (
              <article
                key={item.key}
                className={`ops-action-card ops-action-card--${item.tone || (index === 0 ? 'success' : index === 1 ? 'warning' : 'premium')}`}
              >
                <span>{item.title}</span>
                <strong>{item.value}</strong>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </article>

        <article className="ops-panel ops-panel--soft">
          <div className="ops-panel-head">
            <div>
              <span>Leitura rápida</span>
              <h3>Distribuição do pipeline</h3>
            </div>
          </div>

          <div className="ops-bar-list">
            {pipelineBars.map((item) => (
              <div key={item.key} className="ops-bar-row">
                <div className="ops-bar-copy">
                  <strong>{item.label}</strong>
                  <small>{formatNumber(item.count)} leads no estágio</small>
                </div>
                <div className="ops-bar-track">
                  <div className={`ops-bar-fill ops-bar-fill--${item.key}`} style={{ width: `${item.percent}%` }} />
                </div>
                <b>{formatPercent(summary.total ? (item.count / summary.total) * 100 : 0)}</b>
              </div>
            ))}
          </div>

          <div className="ops-inline-grid">
            <article className="ops-inline-card">
              <span>Produtos mais quentes</span>
              {productHeat.length ? (
                productHeat.map((item) => (
                  <div key={item.key} className="ops-inline-row">
                    <strong>{item.key}</strong>
                    <b>{formatNumber(item.count)}</b>
                  </div>
                ))
              ) : (
                <p className="dashboard-card-empty">Ainda sem distribuição relevante por produto.</p>
              )}
            </article>

            <article className="ops-inline-card">
              <span>Fila para atacar já</span>
              {leadPriorityQueue.length ? (
                leadPriorityQueue.map((lead) => (
                  <button
                    key={lead.id}
                    type="button"
                    className="ops-priority-pill"
                    onClick={() => openLead(lead.id)}
                  >
                    <strong>{lead.nome || lead.product_slug || 'Lead sem nome'}</strong>
                    <small>{formatLeadStatus(lead.lead_status)} · score {lead.priorityScore}</small>
                  </button>
                ))
              ) : (
                <p className="dashboard-card-empty">Nenhum lead aberto pedindo ação imediata.</p>
              )}
            </article>
          </div>
        </article>
      </section>

      <section className="admin-toolbar admin-toolbar--filters admin-filters">
        <label>
          De
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label>
          Até
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <label>
          Produto
          <input value={product} onChange={(e) => setProduct(e.target.value)} placeholder="slug do produto" />
        </label>
        <label>
          Responsável
          <input
            list="owner-suggestions"
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            placeholder="Ex.: Rodolfo"
          />
          <datalist id="owner-suggestions">
            {ownerSuggestions.map((owner) => (
              <option key={owner} value={owner} />
            ))}
          </datalist>
        </label>
        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos</option>
            {LEAD_STATUSES.map((item) => (
              <option key={item} value={item}>
                {formatLeadStatus(item)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Busca
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="nome, WhatsApp, e-mail, produto"
          />
        </label>
        <button className="btn btn-primary" onClick={() => load()}>
          {loading ? 'Filtrando...' : 'Filtrar'}
        </button>
        <button className="btn btn-ghost" type="button" onClick={exportCsv} disabled={!data.length}>
          Exportar CSV
        </button>
        <div className="admin-view-toggle">
          <button
            type="button"
            className={`btn ${viewMode === 'lista' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setViewMode('lista')}
          >
            Lista
          </button>
          <button
            type="button"
            className={`btn ${viewMode === 'kanban' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setViewMode('kanban')}
          >
            Kanban
          </button>
        </div>
      </section>

      {viewMode === 'kanban' ? (
        <section className="admin-kanban">
          {kanbanColumns.map((column) => (
            <div
              key={column.status}
              className={`admin-kanban-column admin-kanban-column--${column.status} ${dropStatus === column.status ? 'is-drop-target' : ''}`}
              onDragOver={(event) => handleColumnDragOver(event, column.status)}
              onDrop={(event) => handleColumnDrop(event, column.status)}
            >
              <div className="admin-kanban-head">
                <strong>{column.label}</strong>
                <span>{column.leads.length}</span>
              </div>
              <div className="admin-kanban-list">
                {column.leads.length ? column.leads.map((lead) => renderLeadCard(lead, true, true)) : <div className="admin-kanban-empty">Nenhum lead.</div>}
              </div>
            </div>
          ))}
        </section>
      ) : null}

      {viewMode === 'lista' ? (
        <section className="admin-leads-stage">
          <div className="admin-leads-stage-head">
            <div>
              <span>Fila operacional</span>
              <h3>Leads prontos para abrir, atualizar e mover com rapidez</h3>
            </div>
            <p>Clique em qualquer card para abrir a gestão completa em um painel por cima da tela, sem poluir a visualização da base.</p>
          </div>

          <div className="admin-leads-list-grid">
            {displayLeads.length ? (
              displayLeads.map((lead) => renderLeadCard(lead))
            ) : (
              <div className="admin-card">
                <p>Nenhum lead encontrado com os filtros atuais.</p>
              </div>
            )}
          </div>
        </section>
      ) : null}

      {isLeadDrawerOpen ? (
        <div className="admin-lead-drawer-shell" onClick={closeLeadDrawer}>
          <div className="admin-lead-drawer-backdrop" />
          <aside className={`admin-lead-drawer admin-lead-drawer--${selectedStatus}`} onClick={(event) => event.stopPropagation()}>
            {detailLoading ? (
              <div className="admin-card">
                <p>Carregando lead...</p>
              </div>
            ) : selectedLead?.lead ? (
              <>
                <div className="admin-lead-drawer-top">
                  <div>
                    <p className="admin-lead-date">{formatDate(selectedLead.lead.created_at)}</p>
                    <h2>{selectedLead.lead.nome || 'Lead sem nome'}</h2>
                    <p className="admin-lead-subtitle">
                      {selectedLead.lead.product_slug || 'Sem produto'} · {selectedLead.lead.page_path || 'Sem página'}
                    </p>
                  </div>
                  <div className="admin-lead-drawer-top-actions">
                    <span className={`admin-status-badge admin-status-badge--${selectedStatus}`}>
                      {formatLeadStatus(selectedStatus)}
                    </span>
                    <button type="button" className="btn btn-ghost" onClick={closeLeadDrawer}>
                      Fechar
                    </button>
                  </div>
                </div>

                <div className="admin-lead-detail-actions">
                  {selectedWhatsapp ? (
                    <a
                      className="btn btn-primary"
                      href={`https://wa.me/${selectedWhatsapp}?text=${encodeURIComponent(selectedWhatsappMessage)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Abrir WhatsApp
                    </a>
                  ) : null}
                  {selectedOutlookLink ? (
                    <a className="btn btn-ghost" href={selectedOutlookLink} target="_blank" rel="noopener noreferrer">
                      Abrir no Outlook
                    </a>
                  ) : null}
                  <button type="button" className="btn btn-ghost" onClick={() => void runLeadQuickAction('assume')} disabled={saving}>
                    Assumir lead
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => void runLeadQuickAction('tomorrow')} disabled={saving}>
                    Retorno amanhã
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => void runLeadQuickAction('won')} disabled={saving}>
                    Marcar ganho
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => void runLeadQuickAction('lost')} disabled={saving}>
                    Marcar perdido
                  </button>
                </div>

                <article className="admin-lead-automation-card">
                  <span>Automação no salvar</span>
                  {automationPreview.messages.length ? (
                    <ul>
                      {automationPreview.messages.map((message) => (
                        <li key={message}>{message}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>Sem regra extra para este lead agora. O salvamento só atualiza os dados e deixa a fila consistente.</p>
                  )}
                </article>

                <div className="admin-detail-grid admin-detail-grid--drawer">
                  <article className="admin-detail-card">
                    <strong>Contato</strong>
                    <ul>
                      <li>
                        <span>WhatsApp</span>
                        <b>{selectedLead.lead.whatsapp || '-'}</b>
                      </li>
                      <li>
                        <span>E-mail</span>
                        <b>{selectedLead.lead.email || '-'}</b>
                      </li>
                    </ul>
                  </article>

                  <article className="admin-detail-card">
                    <strong>Origem</strong>
                    <ul>
                      <li>
                        <span>Produto</span>
                        <b>{selectedLead.lead.product_slug || '-'}</b>
                      </li>
                      <li>
                        <span>Página</span>
                        <b>{selectedLead.lead.page_path || '-'}</b>
                      </li>
                      <li>
                        <span>Tipo</span>
                        <b>{selectedLead.detailEvent?.leadType || '-'}</b>
                      </li>
                      <li>
                        <span>Responsável</span>
                        <b>{selectedLead.lead.owner_name || '-'}</b>
                      </li>
                      <li>
                        <span>Próximo contato</span>
                        <b>{formatDate(selectedLead.lead.next_contact_at)}</b>
                      </li>
                      <li>
                        <span>Motivo da perda</span>
                        <b>{selectedLead.lead.loss_reason || '-'}</b>
                      </li>
                    </ul>
                  </article>
                </div>

                <article className="admin-detail-card admin-lead-operation-card">
                  <div className="admin-lead-operation-head">
                    <strong>Operação do lead</strong>
                    <small>Atualize e salve. A fila se reorganiza sozinha conforme o estágio final.</small>
                  </div>

                  <div className="admin-status-switch">
                    {LEAD_STATUSES.map((item) => (
                      <button
                        key={item}
                        type="button"
                        className={`admin-status-switch-btn admin-status-switch-btn--${item} ${selectedStatus === item ? 'is-active' : ''}`}
                        onClick={() => setSelectedStatus(item)}
                      >
                        {formatLeadStatus(item)}
                      </button>
                    ))}
                  </div>

                  <div className="admin-detail-grid admin-detail-grid--drawer">
                    <label className="admin-inline-field">
                      <span>Responsável</span>
                      <input
                        value={selectedOwner}
                        onChange={(e) => setSelectedOwner(e.target.value)}
                        placeholder="Ex.: Rodolfo"
                      />
                    </label>
                    <label className="admin-inline-field">
                      <span>Próximo contato</span>
                      <input
                        type="datetime-local"
                        value={selectedNextContactAt}
                        onChange={(e) => setSelectedNextContactAt(e.target.value)}
                      />
                    </label>
                  </div>

                  {selectedStatus === 'perdido' ? (
                    <label className="admin-inline-field">
                      <span>Motivo da perda</span>
                      <input
                        list="loss-reasons"
                        value={selectedLossReason}
                        onChange={(e) => setSelectedLossReason(e.target.value)}
                        placeholder="Selecione ou escreva o motivo"
                      />
                      <datalist id="loss-reasons">
                        {LOSS_REASON_OPTIONS.map((reason) => (
                          <option key={reason} value={reason} />
                        ))}
                      </datalist>
                    </label>
                  ) : null}

                  <label className="admin-inline-field">
                    <span>Observações internas</span>
                    <textarea
                      rows="5"
                      value={selectedNotes}
                      onChange={(e) => setSelectedNotes(e.target.value)}
                      placeholder="Anote andamento, retorno, proposta, motivo da perda, próximos passos e contexto comercial."
                    />
                  </label>
                </article>

                <div className="admin-detail-grid admin-detail-grid--drawer">
                  <article className="admin-detail-card">
                    <strong>Rastreio</strong>
                    <ul>
                      <li>
                        <span>Click ID</span>
                        <b>{selectedLead.lead.click_id || '-'}</b>
                      </li>
                      <li>
                        <span>Session ID</span>
                        <b>{selectedLead.lead.session_id || '-'}</b>
                      </li>
                      <li>
                        <span>UTM source</span>
                        <b>{selectedLead.lead.utm_source || '-'}</b>
                      </li>
                      <li>
                        <span>UTM medium</span>
                        <b>{selectedLead.lead.utm_medium || '-'}</b>
                      </li>
                      <li>
                        <span>UTM campaign</span>
                        <b>{selectedLead.lead.utm_campaign || '-'}</b>
                      </li>
                    </ul>
                  </article>

                  <article className="admin-detail-card">
                    <strong>Ficha enviada</strong>
                    {selectedDetails.length ? (
                      <div className="admin-detail-list">
                        {selectedDetails.map((item, index) => (
                          <div key={`${item.label}-${index}`} className="admin-detail-row">
                            <span>{item.label}</span>
                            <b>{item.value}</b>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="muted">Esse lead ainda não tem ficha detalhada registrada.</p>
                    )}
                  </article>
                </div>

                <article className="admin-detail-card">
                  <strong>Anexos</strong>
                  {selectedAttachments.length ? (
                    <div className="admin-attachment-list">
                      {selectedAttachments.map((attachment) => (
                        <a
                          key={attachment.id}
                          className="admin-attachment-pill"
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span>{attachment.name}</span>
                          <small>Abrir</small>
                        </a>
                      ))}
                    </div>
                  ) : selectedAttachmentNames.length ? (
                    <div className="admin-attachment-list">
                      {selectedAttachmentNames.map((name, index) => (
                        <span key={`${name}-${index}`} className="admin-attachment-pill admin-attachment-pill--disabled">
                          <span>{name}</span>
                          <small>Sem arquivo salvo</small>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="muted">Nenhum anexo registrado para esse lead.</p>
                  )}
                </article>

                <article className="admin-detail-card">
                  <strong>Timeline do lead</strong>
                  {selectedActivities.length ? (
                    <div className="task-history-list">
                      {selectedActivities.map((activity) => (
                        <div key={activity.id} className="task-history-row">
                          <div>
                            <strong>{activity.title}</strong>
                            <small>{activity.detail || 'Movimento registrado na operação.'}</small>
                          </div>
                          <small>{formatDate(activity.createdAt)}</small>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="muted">Ainda não há movimentações registradas para esse lead.</p>
                  )}
                </article>

                <div className="admin-lead-drawer-footer">
                  <button type="button" className="btn btn-ghost" onClick={closeLeadDrawer}>
                    Voltar para a fila
                  </button>
                  <button type="button" className="btn btn-primary" onClick={saveLead} disabled={saving}>
                    {saving ? 'Salvando...' : 'Salvar e reorganizar'}
                  </button>
                </div>
              </>
            ) : (
              <div className="admin-card">
                <p>Selecione um lead para abrir os detalhes completos.</p>
              </div>
            )}
          </aside>
        </div>
      ) : null}

      {feedback ? <p className="feedback">{feedback}</p> : null}
    </AdminShell>
  );
}
