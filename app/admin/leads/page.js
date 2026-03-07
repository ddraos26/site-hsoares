'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminShell } from '@/components/admin-shell';

const statuses = ['novo', 'em_contato', 'ganho', 'perdido'];
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

function formatStatus(status) {
  return {
    novo: 'Novo',
    em_contato: 'Em contato',
    ganho: 'Ganho',
    perdido: 'Perdido'
  }[status] || status;
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

export default function AdminLeadsPage() {
  const initial = useMemo(() => defaultRange(), []);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [status, setStatus] = useState('');
  const [product, setProduct] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState('lista');
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
  const [draggingLeadId, setDraggingLeadId] = useState(null);
  const [dropStatus, setDropStatus] = useState('');

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

      const nextSelectedId = preferredId || selectedLead?.lead?.id;
      if (nextSelectedId && leads.some((lead) => lead.id === nextSelectedId)) {
        await openLead(nextSelectedId);
      } else if (leads.length) {
        await openLead(leads[0].id);
      } else {
        setSelectedLead(null);
      }
    } catch {
      setFeedback('Não foi possível carregar os leads.');
    } finally {
      setLoading(false);
    }
  }

  async function openLead(id) {
    setDetailLoading(true);
    setFeedback('');

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
    } catch {
      setFeedback('Não foi possível carregar o lead.');
    } finally {
      setDetailLoading(false);
    }
  }

  async function updateStatusQuick(id, nextStatus) {
    try {
      const response = await fetch(`/api/admin/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadStatus: nextStatus })
      });

      if (!response.ok) {
        throw new Error('Falha ao atualizar status.');
      }

      setData((current) =>
        current.map((lead) =>
          lead.id === id
            ? {
                ...lead,
                lead_status: nextStatus,
                loss_reason: nextStatus === 'perdido' ? lead.loss_reason : null
              }
            : lead
        )
      );

      if (selectedLead?.lead?.id === id) {
        setSelectedLead((current) => ({
          ...current,
          lead: {
            ...current.lead,
            lead_status: nextStatus,
            loss_reason: nextStatus === 'perdido' ? current.lead.loss_reason : null
          }
        }));
        setSelectedStatus(nextStatus);
        if (nextStatus !== 'perdido') {
          setSelectedLossReason('');
        }
      }
    } catch {
      setFeedback('Não foi possível atualizar o status do lead.');
    }
  }

  async function saveLead() {
    if (!selectedLead?.lead?.id) return;

    setSaving(true);
    setFeedback('');

    try {
      const response = await fetch(`/api/admin/leads/${selectedLead.lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadStatus: selectedStatus,
          ownerName: selectedOwner,
          nextContactAt: selectedNextContactAt || null,
          lossReason: selectedStatus === 'perdido' ? selectedLossReason : null,
          notes: selectedNotes
        })
      });
      const payload = await response.json();

      if (!response.ok) {
        setFeedback(payload.error || 'Não foi possível salvar o lead.');
        return;
      }

      setSelectedLead((current) => ({
        ...current,
        lead: {
          ...current.lead,
          lead_status: selectedStatus,
          owner_name: selectedOwner,
          next_contact_at: selectedNextContactAt || null,
          loss_reason: selectedStatus === 'perdido' ? selectedLossReason : null,
          notes: selectedNotes
        }
      }));

      setData((current) =>
        current.map((lead) =>
          lead.id === selectedLead.lead.id
            ? {
                ...lead,
                lead_status: selectedStatus,
                owner_name: selectedOwner,
                next_contact_at: selectedNextContactAt || null,
                loss_reason: selectedStatus === 'perdido' ? selectedLossReason : null,
                notes: selectedNotes
              }
            : lead
        )
      );

      setFeedback('Lead atualizado com sucesso.');
    } catch {
      setFeedback('Não foi possível salvar o lead.');
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    load().catch(() => null);
  }, []);

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
      statuses.map((item) => ({
        status: item,
        label: formatStatus(item),
        leads: data.filter((lead) => lead.lead_status === item)
      })),
    [data]
  );

  const selectedDetails = selectedLead?.detailEvent?.details || [];
  const selectedAttachments = selectedLead?.attachments || selectedLead?.detailEvent?.attachments || [];
  const selectedAttachmentNames = selectedLead?.detailEvent?.attachmentNames || [];
  const selectedWhatsapp = normalizeWhatsappLink(selectedLead?.lead?.whatsapp);
  const selectedOutlookLink = buildOutlookComposeLink(selectedLead?.lead?.email);

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

    await updateStatusQuick(leadId, targetStatus);
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
      formatStatus(lead.lead_status),
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
    return (
      <article
        key={lead.id}
        className={`admin-lead-card admin-lead-card--${lead.lead_status} ${selectedLead?.lead?.id === lead.id ? 'is-active' : ''} ${compact ? 'admin-lead-card--compact' : ''} ${draggable ? 'admin-lead-card--draggable' : ''} ${draggingLeadId === lead.id ? 'is-dragging' : ''}`}
        draggable={draggable}
        onDragStart={() => handleLeadDragStart(lead.id)}
        onDragEnd={handleLeadDragEnd}
      >
        {!draggable ? (
          <button
            type="button"
            className="admin-lead-hit"
            onClick={() => openLead(lead.id)}
            aria-label={`Abrir lead ${lead.nome || lead.product_slug || lead.id}`}
          />
        ) : null}
        <div className="admin-lead-card-head">
          <div>
            <p className="admin-lead-date">{formatDate(lead.created_at)}</p>
            <h2>{lead.nome || 'Lead sem nome'}</h2>
          </div>
          <span className={`admin-status-badge admin-status-badge--${lead.lead_status}`}>{formatStatus(lead.lead_status)}</span>
        </div>
        {draggable ? <div className="admin-drag-hint">Arraste para mudar o status</div> : null}
        <div className="admin-lead-meta">
          <span>{lead.product_slug || '-'}</span>
          <span>{lead.page_path || '-'}</span>
          {lead.owner_name ? <span>Resp.: {lead.owner_name}</span> : null}
          {lead.next_contact_at ? <span>Retorno: {formatDate(lead.next_contact_at)}</span> : null}
          {lead.loss_reason ? <span>Perda: {lead.loss_reason}</span> : null}
        </div>
        <div className="admin-lead-contact">
          <p>{lead.whatsapp || '-'}</p>
          <p>{lead.email || '-'}</p>
        </div>
        {lead.notes ? <p className="admin-lead-notes-preview">{lead.notes}</p> : null}
        {!compact ? (
          <div className="admin-lead-actions">
            <select value={lead.lead_status} onChange={(e) => updateStatusQuick(lead.id, e.target.value)}>
              {statuses.map((item) => (
                <option key={item} value={item}>
                  {formatStatus(item)}
                </option>
              ))}
            </select>
            <button type="button" className="btn btn-ghost" onClick={() => openLead(lead.id)}>
              Ver detalhes
            </button>
          </div>
        ) : (
          <div className="admin-kanban-card-foot">
            <button type="button" className="btn btn-ghost" onClick={() => openLead(lead.id)}>
              Abrir
            </button>
          </div>
        )}
      </article>
    );
  }

  return (
    <AdminShell
      section="leads"
      title="Leads e atendimento"
      description="Filtro operacional, mudança de status e leitura completa das fichas recebidas."
    >
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
            {statuses.map((item) => (
              <option key={item} value={item}>
                {formatStatus(item)}
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

      <div className="kpi-grid kpi-grid--compact">
        <article className="kpi-card">
          <span>Total</span>
          <strong>{summary.total}</strong>
        </article>
        <article className="kpi-card kpi-card--novo">
          <span>Novos</span>
          <strong>{summary.novo}</strong>
        </article>
        <article className="kpi-card kpi-card--em-contato">
          <span>Em contato</span>
          <strong>{summary.em_contato}</strong>
        </article>
        <article className="kpi-card kpi-card--ganho">
          <span>Ganhos</span>
          <strong>{summary.ganho}</strong>
        </article>
        <article className="kpi-card kpi-card--perdido">
          <span>Perdidos</span>
          <strong>{summary.perdido}</strong>
        </article>
      </div>

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

      <section className={`admin-leads-layout ${viewMode === 'kanban' ? 'admin-leads-layout--detail-only' : ''}`}>
        {viewMode === 'lista' ? (
          <div className="admin-leads-list">
            {data.length ? data.map((lead) => renderLeadCard(lead)) : (
              <div className="admin-card">
                <p>Nenhum lead encontrado com os filtros atuais.</p>
              </div>
            )}
          </div>
        ) : null}

        <aside className="admin-lead-panel">
          {detailLoading ? (
            <div className="admin-card">
              <p>Carregando lead...</p>
            </div>
          ) : selectedLead?.lead ? (
            <div className={`admin-card admin-lead-detail admin-lead-detail--${selectedStatus}`}>
              <div className="admin-lead-detail-head">
                <div>
                  <p className="admin-lead-date">{formatDate(selectedLead.lead.created_at)}</p>
                  <h2>{selectedLead.lead.nome || 'Lead sem nome'}</h2>
                </div>
                <span className={`admin-status-badge admin-status-badge--${selectedStatus}`}>
                  {formatStatus(selectedStatus)}
                </span>
              </div>

              <div className="admin-lead-detail-actions">
                {selectedWhatsapp ? (
                  <a
                    className="btn btn-primary"
                    href={`https://wa.me/${selectedWhatsapp}`}
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
              </div>

              <div className="admin-detail-grid">
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

              <div className="admin-detail-grid">
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
                  <strong>Operação</strong>
                  <label className="admin-inline-field">
                    <span>Status</span>
                    <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                      {statuses.map((item) => (
                        <option key={item} value={item}>
                          {formatStatus(item)}
                        </option>
                      ))}
                    </select>
                  </label>
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
                      placeholder="Anote andamento, retorno, proposta, motivo da perda, etc."
                    />
                  </label>
                  <button type="button" className="btn btn-primary" onClick={saveLead} disabled={saving}>
                    {saving ? 'Salvando...' : 'Salvar lead'}
                  </button>
                </article>
              </div>

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
            </div>
          ) : (
            <div className="admin-card">
              <p>Selecione um lead para abrir os detalhes completos.</p>
            </div>
          )}
        </aside>
      </section>

      {feedback ? <p className="feedback">{feedback}</p> : null}
    </AdminShell>
  );
}
