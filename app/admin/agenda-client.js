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

function LeadList({ title, subtitle, items = [] }) {
  return (
    <section className="admin-card admin-list-card">
      <div className="admin-card-head">
        <h2>{title}</h2>
        <span>{subtitle}</span>
      </div>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <span>
              <b>{item.nome || 'Lead sem nome'}</b>
              <small>{item.product_slug || 'sem produto'}{item.owner_name ? ` · ${item.owner_name}` : ''}</small>
            </span>
            <span className="admin-inline-actions">
              <strong>{formatDate(item.next_contact_at || item.updated_at || item.created_at)}</strong>
              <a href={`/admin/leads?lead=${item.id}`} className="btn btn-ghost">Abrir</a>
            </span>
          </li>
        ))}
        {!items.length ? <li><span>Nenhum lead.</span><strong>OK</strong></li> : null}
      </ul>
    </section>
  );
}

export default function AgendaClient() {
  const initial = useMemo(() => defaultRange(), []);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [product, setProduct] = useState('');
  const [owner, setOwner] = useState('');
  const [data, setData] = useState({ summary: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      const params = new URLSearchParams({ from, to });
      if (product) params.set('product', product);
      if (owner) params.set('owner', owner);
      const response = await fetch(`/api/admin/agenda?${params.toString()}`, { signal: controller.signal });
      const payload = await response.json();
      setData(payload);
      setLoading(false);
    }

    load().catch(() => setLoading(false));
    return () => controller.abort();
  }, [from, to, product, owner]);

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
          <input value={product} onChange={(e) => setProduct(e.target.value)} placeholder="slug do produto" />
        </label>
        <label>
          Responsável
          <input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Ex.: Rodolfo" />
        </label>
        <div className="admin-toolbar-note">
          <span>Leitura operacional</span>
          <strong>{loading ? 'Atualizando...' : 'Agenda carregada'}</strong>
        </div>
      </section>

      <div className="kpi-grid kpi-grid--compact">
        <article className="kpi-card kpi-card--em-contato"><span>Vencidos</span><strong>{data.summary?.overdue || 0}</strong></article>
        <article className="kpi-card kpi-card--novo"><span>Hoje</span><strong>{data.summary?.today || 0}</strong></article>
        <article className="kpi-card"><span>Próximos 7 dias</span><strong>{data.summary?.upcoming || 0}</strong></article>
        <article className="kpi-card kpi-card--perdido"><span>Sem responsável</span><strong>{data.summary?.unassigned || 0}</strong></article>
        <article className="kpi-card"><span>Novos sem retorno</span><strong>{data.summary?.staleNew || 0}</strong></article>
      </div>

      <div className="admin-panel-grid">
        <LeadList title="Retornos vencidos" subtitle="Prioridade máxima" items={data.overdue || []} />
        <LeadList title="Compromissos de hoje" subtitle="Ação do dia" items={data.today || []} />
        <LeadList title="Próximos 7 dias" subtitle="Planejamento" items={data.upcoming || []} />
      </div>

      <div className="admin-panel-grid">
        <LeadList title="Leads sem responsável" subtitle="Distribuição pendente" items={data.unassigned || []} />
        <LeadList title="Novos sem retorno" subtitle="Mais de 12h sem avanço" items={data.staleNew || []} />
      </div>
    </div>
  );
}
