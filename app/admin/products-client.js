'use client';

import { useEffect, useMemo, useState } from 'react';

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

export default function ProductsClient() {
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
      const response = await fetch(`/api/admin/products?${params.toString()}`, { signal: controller.signal });
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
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="slug, nome ou categoria" />
        </label>
        <div className="admin-toolbar-note">
          <span>Produtos monitorados</span>
          <strong>{loading ? 'Atualizando...' : `${data.summary?.totalProducts || 0} produtos`}</strong>
        </div>
      </section>

      <div className="kpi-grid kpi-grid--compact">
        <article className="kpi-card"><span>Produtos com visitas</span><strong>{data.summary?.activeWithViews || 0}</strong></article>
        <article className="kpi-card"><span>Produtos com cliques</span><strong>{data.summary?.activeWithClicks || 0}</strong></article>
        <article className="kpi-card kpi-card--novo"><span>Produtos com leads</span><strong>{data.summary?.activeWithLeads || 0}</strong></article>
        <article className="kpi-card"><span>Cliques no período</span><strong>{data.summary?.totalClicks || 0}</strong></article>
        <article className="kpi-card"><span>Leads no período</span><strong>{data.summary?.totalLeads || 0}</strong></article>
      </div>

      <div className="admin-record-grid admin-record-grid--products">
        {(data.items || []).map((item) => (
          <article key={item.slug} className="admin-record-card">
            <div className="admin-card-head">
              <h2>{item.name}</h2>
              <span>{item.category}</span>
            </div>
            <p className="admin-record-slug">{item.slug}</p>
            <div className="admin-conversion-metrics">
              <span><b>{item.views}</b> visitas</span>
              <span><b>{item.clicks}</b> cliques</span>
              <span><b>{item.leads}</b> leads</span>
              <span><b>{item.ganhos}</b> ganhos</span>
              <span><b>{item.perdidos}</b> perdidos</span>
              <span><b>{item.clickRate || 0}%</b> CTR</span>
              <span><b>{item.leadRate || 0}%</b> lead/clique</span>
            </div>
            <div className="admin-record-foot">
              <small>Último lead: {formatDate(item.lastLeadAt)}</small>
              <a className="btn btn-ghost" href={item.siteUrl} target="_blank" rel="noopener noreferrer">Abrir no site</a>
            </div>
          </article>
        ))}
        {!loading && !(data.items || []).length ? (
          <div className="admin-card"><p>Nenhum produto encontrado para esse filtro.</p></div>
        ) : null}
      </div>
    </div>
  );
}
