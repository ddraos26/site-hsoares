'use client';

import { useEffect, useMemo, useState } from 'react';

function defaultRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) };
}

export default function PagesClient() {
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
      const response = await fetch(`/api/admin/pages?${params.toString()}`, { signal: controller.signal });
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
        <label>Página<input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="/produtos/seguro-fianca" /></label>
        <div className="admin-toolbar-note"><span>Mapa de páginas</span><strong>{loading ? 'Atualizando...' : `${data.summary?.totalPages || 0} páginas`}</strong></div>
      </section>

      <div className="kpi-grid kpi-grid--compact">
        <article className="kpi-card"><span>Páginas</span><strong>{data.summary?.totalPages || 0}</strong></article>
        <article className="kpi-card"><span>Views</span><strong>{data.summary?.totalViews || 0}</strong></article>
        <article className="kpi-card"><span>Cliques</span><strong>{data.summary?.totalClicks || 0}</strong></article>
        <article className="kpi-card kpi-card--novo"><span>Leads</span><strong>{data.summary?.totalLeads || 0}</strong></article>
        <article className="kpi-card"><span>Páginas com lead</span><strong>{data.summary?.pagesWithLeads || 0}</strong></article>
      </div>

      <div className="admin-record-grid admin-record-grid--files">
        {(data.items || []).map((item) => (
          <article key={item.pagePath} className="admin-record-card">
            <div className="admin-card-head"><h2>{item.pagePath}</h2><span>Página monitorada</span></div>
            <div className="admin-conversion-metrics">
              <span><b>{item.views}</b> visitas</span>
              <span><b>{item.clicks}</b> cliques</span>
              <span><b>{item.leads}</b> leads</span>
              <span><b>{item.clickRate}%</b> CTR</span>
              <span><b>{item.leadRate}%</b> lead/view</span>
            </div>
            <div className="admin-record-foot">
              <small>Leitura de tráfego e conversão por rota.</small>
              <a className="btn btn-ghost" href={item.pagePath} target="_blank" rel="noopener noreferrer">Abrir no site</a>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
