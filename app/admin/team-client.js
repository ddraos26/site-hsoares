'use client';

import { useEffect, useMemo, useState } from 'react';

function defaultRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) };
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('pt-BR');
}

export default function TeamClient() {
  const initial = useMemo(() => defaultRange(), []);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [query, setQuery] = useState('');
  const [data, setData] = useState({ summary: {}, items: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      const params = new URLSearchParams({ from, to });
      if (query) params.set('q', query);
      const response = await fetch(`/api/admin/team?${params.toString()}`, { signal: controller.signal });
      const payload = await response.json();
      setData(payload);
      setLoading(false);
    }
    load().catch(() => setLoading(false));
    return () => controller.abort();
  }, [from, to, query]);

  return (
    <div className="admin-stack">
      <section className="admin-toolbar admin-filters">
        <label>De<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label>Até<input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
        <label>Responsável<input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="nome do responsável" /></label>
        <div className="admin-toolbar-note"><span>Performance da equipe</span><strong>{loading ? 'Atualizando...' : `${data.summary?.assignedOwners || 0} responsáveis`}</strong></div>
      </section>

      <div className="kpi-grid kpi-grid--compact">
        <article className="kpi-card"><span>Responsáveis</span><strong>{data.summary?.assignedOwners || 0}</strong></article>
        <article className="kpi-card kpi-card--perdido"><span>Sem responsável</span><strong>{data.summary?.unassignedLeads || 0}</strong></article>
        <article className="kpi-card kpi-card--em-contato"><span>Retornos vencidos</span><strong>{data.summary?.overdue || 0}</strong></article>
        <article className="kpi-card kpi-card--ganho"><span>Ganhos</span><strong>{data.summary?.ganhos || 0}</strong></article>
        <article className="kpi-card"><span>Registros</span><strong>{data.summary?.totalOwners || 0}</strong></article>
      </div>

      <div className="admin-record-grid admin-record-grid--files">
        {(data.items || []).map((item) => (
          <article key={item.ownerName} className="admin-record-card">
            <div className="admin-card-head"><h2>{item.ownerName}</h2><span>Última ação: {formatDate(item.lastUpdateAt)}</span></div>
            <div className="admin-conversion-metrics">
              <span><b>{item.total}</b> leads</span>
              <span><b>{item.novos}</b> novos</span>
              <span><b>{item.emContato}</b> em contato</span>
              <span><b>{item.ganhos}</b> ganhos</span>
              <span><b>{item.perdidos}</b> perdidos</span>
              <span><b>{item.overdue}</b> vencidos</span>
              <span><b>{item.winRate}%</b> win rate</span>
            </div>
            <div className="admin-record-foot"><small>Produtividade e acompanhamento da carteira.</small><span className="admin-record-slug">Distribuição operacional</span></div>
          </article>
        ))}
      </div>
    </div>
  );
}
