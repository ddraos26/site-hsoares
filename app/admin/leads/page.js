'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const statuses = ['novo', 'em_contato', 'ganho', 'perdido'];

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

export default function AdminLeadsPage() {
  const initial = useMemo(() => defaultRange(), []);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [status, setStatus] = useState('');
  const [product, setProduct] = useState('');
  const [query, setQuery] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('novo');
  const [selectedNotes, setSelectedNotes] = useState('');
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  async function load(preferredId) {
    setLoading(true);
    setFeedback('');

    try {
      const params = new URLSearchParams({ from, to });
      if (status) params.set('status', status);
      if (product) params.set('product', product);
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
    } catch {
      setFeedback('Não foi possível carregar o lead.');
    } finally {
      setDetailLoading(false);
    }
  }

  async function updateStatusQuick(id, nextStatus) {
    await fetch(`/api/admin/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadStatus: nextStatus })
    });

    setData((current) =>
      current.map((lead) => (lead.id === id ? { ...lead, lead_status: nextStatus } : lead))
    );

    if (selectedLead?.lead?.id === id) {
      setSelectedLead((current) => ({
        ...current,
        lead: { ...current.lead, lead_status: nextStatus }
      }));
      setSelectedStatus(nextStatus);
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
          notes: selectedNotes
        }
      }));

      setData((current) =>
        current.map((lead) =>
          lead.id === selectedLead.lead.id ? { ...lead, lead_status: selectedStatus, notes: selectedNotes } : lead
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

  const selectedDetails = selectedLead?.detailEvent?.details || [];
  const selectedAttachments = selectedLead?.detailEvent?.attachmentNames || [];
  const selectedWhatsapp = normalizeWhatsappLink(selectedLead?.lead?.whatsapp);

  return (
    <main className="admin-page">
      <div className="admin-header">
        <h1>Leads</h1>
        <Link href="/admin" className="btn btn-ghost">
          Voltar ao Dashboard
        </Link>
      </div>

      <div className="admin-filters">
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
      </div>

      <div className="kpi-grid">
        <article className="kpi-card">
          <span>Total</span>
          <strong>{summary.total}</strong>
        </article>
        <article className="kpi-card">
          <span>Novos</span>
          <strong>{summary.novo}</strong>
        </article>
        <article className="kpi-card">
          <span>Em contato</span>
          <strong>{summary.em_contato}</strong>
        </article>
        <article className="kpi-card">
          <span>Ganhos</span>
          <strong>{summary.ganho}</strong>
        </article>
      </div>

      <section className="admin-leads-layout">
        <div className="admin-leads-list">
          {data.length ? (
            data.map((lead) => (
              <article
                key={lead.id}
                className={`admin-lead-card ${selectedLead?.lead?.id === lead.id ? 'is-active' : ''}`}
              >
                <button type="button" className="admin-lead-hit" onClick={() => openLead(lead.id)} aria-label={`Abrir lead ${lead.nome || lead.product_slug || lead.id}`} />
                <div className="admin-lead-card-head">
                  <div>
                    <p className="admin-lead-date">{formatDate(lead.created_at)}</p>
                    <h2>{lead.nome || 'Lead sem nome'}</h2>
                  </div>
                  <span className={`admin-status-badge admin-status-badge--${lead.lead_status}`}>
                    {formatStatus(lead.lead_status)}
                  </span>
                </div>
                <div className="admin-lead-meta">
                  <span>{lead.product_slug || '-'}</span>
                  <span>{lead.page_path || '-'}</span>
                </div>
                <div className="admin-lead-contact">
                  <p>{lead.whatsapp || '-'}</p>
                  <p>{lead.email || '-'}</p>
                </div>
                {lead.notes ? <p className="admin-lead-notes-preview">{lead.notes}</p> : null}
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
              </article>
            ))
          ) : (
            <div className="admin-card">
              <p>Nenhum lead encontrado com os filtros atuais.</p>
            </div>
          )}
        </div>

        <aside className="admin-lead-panel">
          {detailLoading ? (
            <div className="admin-card">
              <p>Carregando lead...</p>
            </div>
          ) : selectedLead?.lead ? (
            <div className="admin-card admin-lead-detail">
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
                {selectedLead.lead.email ? (
                  <a className="btn btn-ghost" href={`mailto:${selectedLead.lead.email}`}>
                    Enviar e-mail
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
                      <span key={attachment} className="admin-attachment-pill">
                        {attachment}
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
    </main>
  );
}
