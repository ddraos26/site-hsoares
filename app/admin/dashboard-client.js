'use client';

import { useEffect, useMemo, useState } from 'react';

function dateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 7);
  return {
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10)
  };
}

export default function DashboardClient() {
  const defaults = useMemo(() => dateRange(), []);
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      const response = await fetch(`/api/admin/dashboard?from=${from}&to=${to}`, { signal: controller.signal });
      const payload = await response.json();
      setData(payload);
      setLoading(false);
    }

    load().catch(() => setLoading(false));
    return () => controller.abort();
  }, [from, to]);

  if (loading && !data) {
    return <p>Carregando métricas...</p>;
  }

  return (
    <div className="admin-stack">
      <div className="admin-filters">
        <label>
          De
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label>
          Até
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
      </div>

      <div className="kpi-grid">
        <article className="kpi-card">
          <p>Visitas no período</p>
          <strong>{data?.summary?.totalViews || 0}</strong>
        </article>
        <article className="kpi-card">
          <p>Cliques Porto</p>
          <strong>{data?.summary?.totalClicks || 0}</strong>
        </article>
        <article className="kpi-card">
          <p>Leads captados</p>
          <strong>{data?.summary?.totalLeads || 0}</strong>
        </article>
        <article className="kpi-card">
          <p>CTR médio</p>
          <strong>{data?.summary?.ctr || 0}%</strong>
        </article>
      </div>

      <section className="admin-card">
        <h2>Páginas mais acessadas</h2>
        <ul>
          {(data?.topPages || []).map((item) => (
            <li key={item.page_path}>
              <span>{item.page_path}</span>
              <strong>{item.views}</strong>
            </li>
          ))}
        </ul>
      </section>

      <section className="admin-card">
        <h2>Produtos com mais cliques</h2>
        <ul>
          {(data?.topProducts || []).map((item) => (
            <li key={item.product_slug || 'na'}>
              <span>{item.product_slug || 'sem produto'}</span>
              <strong>{item.clicks}</strong>
            </li>
          ))}
        </ul>
      </section>

      <section className="admin-card">
        <h2>Taxa de clique por página</h2>
        <ul>
          {(data?.ctrByPage || []).map((item) => (
            <li key={item.page_path}>
              <span>{item.page_path}</span>
              <strong>{item.ctr}%</strong>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
