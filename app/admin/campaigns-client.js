'use client';

import { useEffect, useMemo, useState } from 'react';

function defaultRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) };
}

export default function CampaignsClient() {
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
      const response = await fetch(`/api/admin/campaigns?${params.toString()}`, { signal: controller.signal });
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
        <label>Campanha<input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="source, medium ou campaign" /></label>
        <div className="admin-toolbar-note"><span>Aquisição</span><strong>{loading ? 'Atualizando...' : `${data.summary?.totalCampaigns || 0} campanhas`}</strong></div>
      </section>

      <div className="kpi-grid kpi-grid--compact">
        <article className="kpi-card"><span>Campanhas</span><strong>{data.summary?.totalCampaigns || 0}</strong></article>
        <article className="kpi-card"><span>Views</span><strong>{data.summary?.totalViews || 0}</strong></article>
        <article className="kpi-card"><span>Cliques</span><strong>{data.summary?.totalClicks || 0}</strong></article>
        <article className="kpi-card kpi-card--novo"><span>Leads</span><strong>{data.summary?.totalLeads || 0}</strong></article>
        <article className="kpi-card"><span>Campanhas com lead</span><strong>{data.summary?.campaignsWithLeads || 0}</strong></article>
      </div>

      <div className="admin-record-grid admin-record-grid--files">
        {(data.items || []).map((item) => (
          <article key={item.label} className="admin-record-card">
            <div className="admin-card-head"><h2>{item.label}</h2><span>{item.source || 'sem source'}</span></div>
            <div className="admin-conversion-metrics">
              <span><b>{item.views}</b> visitas</span>
              <span><b>{item.clicks}</b> cliques</span>
              <span><b>{item.leads}</b> leads</span>
              <span><b>{item.ganhos}</b> ganhos</span>
              <span><b>{item.perdidos}</b> perdidos</span>
              <span><b>{item.clickRate}%</b> CTR</span>
              <span><b>{item.leadRate}%</b> lead/clique</span>
            </div>
            <div className="admin-record-foot"><small>UTM consolidada de tráfego e captura.</small><span className="admin-record-slug">{item.medium || 'sem medium'} · {item.campaign || 'sem campaign'}</span></div>
          </article>
        ))}
      </div>
    </div>
  );
}
