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

function formatSize(value) {
  const bytes = Number(value || 0);
  if (!bytes) return '0 KB';
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default function FilesClient() {
  const initial = useMemo(() => defaultRange(), []);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [product, setProduct] = useState('');
  const [query, setQuery] = useState('');
  const [data, setData] = useState({ summary: {}, items: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      const params = new URLSearchParams({ from, to });
      if (product) params.set('product', product);
      if (query) params.set('q', query);
      const response = await fetch(`/api/admin/files?${params.toString()}`, { signal: controller.signal });
      const payload = await response.json();
      setData(payload);
      setLoading(false);
    }

    load().catch(() => setLoading(false));
    return () => controller.abort();
  }, [from, to, product, query]);

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
          Busca
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="arquivo, lead, e-mail" />
        </label>
        <div className="admin-toolbar-note">
          <span>Central de anexos</span>
          <strong>{loading ? 'Atualizando...' : `${data.summary?.totalFiles || 0} arquivos`}</strong>
        </div>
      </section>

      <div className="kpi-grid kpi-grid--compact">
        <article className="kpi-card"><span>Total de arquivos</span><strong>{data.summary?.totalFiles || 0}</strong></article>
        <article className="kpi-card"><span>Arquivos hoje</span><strong>{data.summary?.filesToday || 0}</strong></article>
        <article className="kpi-card"><span>Leads com anexo</span><strong>{data.summary?.leadsWithFiles || 0}</strong></article>
        <article className="kpi-card"><span>Volume total</span><strong>{formatSize(data.summary?.totalSizeBytes || 0)}</strong></article>
      </div>

      <div className="admin-record-grid admin-record-grid--files">
        {(data.items || []).map((item) => (
          <article key={item.id} className="admin-record-card admin-record-card--file">
            <div className="admin-card-head">
              <h2>{item.name}</h2>
              <span>{formatSize(item.sizeBytes)}</span>
            </div>
            <div className="admin-lead-meta">
              <span>{item.productSlug || 'sem produto'}</span>
              <span>{item.contentType || 'arquivo'}</span>
              <span>{item.leadStatus || 'sem status'}</span>
            </div>
            <div className="admin-detail-list">
              <div className="admin-detail-row"><span>Lead</span><b>{item.leadName || 'Lead sem nome'}</b></div>
              <div className="admin-detail-row"><span>E-mail</span><b>{item.leadEmail || '-'}</b></div>
              <div className="admin-detail-row"><span>WhatsApp</span><b>{item.leadWhatsapp || '-'}</b></div>
              <div className="admin-detail-row"><span>Recebido em</span><b>{formatDate(item.createdAt)}</b></div>
            </div>
            <div className="admin-record-foot">
              <a href={`/admin/leads?lead=${item.leadId}`} className="btn btn-ghost">Abrir lead</a>
              <a href={item.url} className="btn btn-primary" target="_blank" rel="noopener noreferrer">Abrir arquivo</a>
            </div>
          </article>
        ))}
        {!loading && !(data.items || []).length ? (
          <div className="admin-card"><p>Nenhum arquivo encontrado para esse filtro.</p></div>
        ) : null}
      </div>
    </div>
  );
}
