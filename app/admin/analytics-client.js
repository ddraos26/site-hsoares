'use client';

import { useEffect, useState } from 'react';
import { fetchAdminJson, primeAdminJsonCache } from '@/lib/admin/client-fetch-cache';
import { formatPageLabel } from '@/lib/admin/page-presentation';

const formatNumber = (value) => new Intl.NumberFormat('pt-BR').format(Number(value || 0));
const formatDuration = (seconds) => {
  const total = Number(seconds || 0);
  if (!total) return '0s';
  if (total < 60) return `${Math.round(total)}s`;
  const minutes = Math.floor(total / 60);
  const remaining = Math.round(total % 60);
  return `${minutes}m ${remaining}s`;
};

function formatFlowLabel(value) {
  const text = String(value || '').trim();
  return text.startsWith('/') ? formatPageLabel(text) : text;
}

function MetricCard({ label, value, helper, tone = 'blue' }) {
  return (
    <article className={`intelligence-metric-card intelligence-metric-card--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </article>
  );
}

function StackList({ title, eyebrow, items, renderItem, emptyText }) {
  return (
    <article className="intelligence-panel">
      <div className="intelligence-panel-head">
        <div>
          <span>{eyebrow}</span>
          <h3>{title}</h3>
        </div>
      </div>

      {items.length ? (
        <div className="intelligence-list">{items.map(renderItem)}</div>
      ) : (
        <p className="dashboard-card-empty">{emptyText}</p>
      )}
    </article>
  );
}

export default function AnalyticsClient({ apiBase = '/api/admin', initialData = null }) {
  const endpoint = `${apiBase}/analytics`;
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialData) {
      primeAdminJsonCache(endpoint, initialData, 60_000);
      setData(initialData);
      setLoading(false);
      setError(null);
      return undefined;
    }

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchAdminJson(endpoint, { ttlMs: 60_000 });

        if (response?.error) {
          throw new Error(response.detail || response.error);
        }

        setData(response);
      } catch (err) {
        setError(err.message || 'Falha ao carregar analytics/comportamento.');
      } finally {
        setLoading(false);
      }
    };

    void load();
    return undefined;
  }, [endpoint, initialData]);

  if (loading) {
    return <p className="dashboard-card-empty">Montando o módulo de analytics/comportamento...</p>;
  }

  if (error) {
    return <p className="dashboard-error">{error}</p>;
  }

  if (!data) {
    return <p className="dashboard-card-empty">Ainda não há dados suficientes para o módulo de analytics/comportamento.</p>;
  }

  return (
    <div className="intelligence-shell">
      <section className="intelligence-hero intelligence-hero--analytics">
        <div className="intelligence-hero-main">
          <p className="eyebrow">Analytics / Comportamento</p>
          <h3>Como as pessoas entram, navegam, clicam e abandonam o funil</h3>
          <p>{data.reason}</p>

          <div className="intelligence-pill-row">
            <span className="intelligence-chip intelligence-chip--blue">Tracking próprio: {data.statusLabel}</span>
            <span className={`intelligence-chip intelligence-chip--${data.ga4?.status === 'connected' ? 'success' : 'warning'}`}>
              GA4: {data.ga4?.statusLabel || 'Não conectado'}
            </span>
            <span className="intelligence-chip intelligence-chip--purple">Janela: {data.windowDays} dias</span>
          </div>
        </div>

        <aside className="intelligence-hero-side">
          <article className="intelligence-focus-card">
            <span>Leitura rápida</span>
            <strong>{formatNumber(data.summary.sessions)} sessões</strong>
            <p>{formatNumber(data.summary.pageViews)} page views, {formatNumber(data.summary.leads)} leads e {formatNumber(data.summary.whatsappClicks)} cliques em WhatsApp no período.</p>
          </article>

          <article className="intelligence-focus-card intelligence-focus-card--soft">
            <span>GA4</span>
            <strong>{data.ga4?.summary ? `${formatNumber(data.ga4.summary.activeUsers)} usuários ativos` : 'Conexão opcional'}</strong>
            <p>{data.ga4?.reason}</p>
          </article>
        </aside>
      </section>

      <section className="intelligence-metric-grid">
        <MetricCard label="Sessões" value={formatNumber(data.summary.sessions)} helper="Janelas reais de navegação" tone="blue" />
        <MetricCard label="Page views" value={formatNumber(data.summary.pageViews)} helper="Volume total de leitura" tone="purple" />
        <MetricCard label="Leads" value={formatNumber(data.summary.leads)} helper="Captação comercial observada" tone="green" />
        <MetricCard label="Cliques em WhatsApp" value={formatNumber(data.summary.whatsappClicks)} helper="Sinal de intenção direta" tone="gold" />
        <MetricCard label="CTAs principais" value={formatNumber(data.summary.primaryCtas)} helper="Cliques comerciais fortes" tone="blue" />
        <MetricCard label="Páginas por sessão" value={data.summary.avgPagesPerSession.toFixed(1)} helper="Profundidade média de navegação" tone="purple" />
      </section>

      <section className="intelligence-grid-2">
        <StackList
          title="A IA recomenda"
          eyebrow="Decisão"
          items={data.recommendations}
          emptyText="Sem recomendação dominante no momento."
          renderItem={(item) => (
            <div key={item.title} className={`intelligence-list-card intelligence-list-card--${item.tone}`}>
              <strong>{item.title}</strong>
              <p>{item.description}</p>
              <small>{item.effect}</small>
            </div>
          )}
        />

        <StackList
          title="Eventos comerciais"
          eyebrow="Sinais"
          items={data.topEvents}
          emptyText="Sem eventos relevantes no período."
          renderItem={(item) => (
            <div key={item.eventType} className="intelligence-stat-row">
              <div>
                <strong>{item.label}</strong>
                <small>{item.eventType}</small>
              </div>
              <b>{formatNumber(item.total)}</b>
            </div>
          )}
        />
      </section>

      <section className="intelligence-grid-2">
        <StackList
          title="Canais de entrada"
          eyebrow="Origem"
          items={data.channels}
          emptyText="Sem canais suficientes para leitura."
          renderItem={(item) => (
            <div key={item.key} className="intelligence-stat-row">
              <div>
                <strong>{item.label}</strong>
                <small>{formatNumber(item.sessions)} sessões</small>
              </div>
              <b>{item.share}%</b>
            </div>
          )}
        />

        <StackList
          title="Dispositivos"
          eyebrow="Contexto"
          items={data.devices}
          emptyText="Sem leitura de dispositivo disponível."
          renderItem={(item) => (
            <div key={item.device} className="intelligence-stat-row">
              <div>
                <strong>{item.device}</strong>
                <small>{formatNumber(item.sessions)} sessões</small>
              </div>
              <b>{item.share}%</b>
            </div>
          )}
        />
      </section>

      <section className="intelligence-grid-3">
        <StackList
          title="Páginas de entrada"
          eyebrow="Entrada"
          items={data.entryPages}
          emptyText="Sem páginas de entrada registradas."
          renderItem={(item) => (
            <div key={item.pagePath} className="intelligence-stat-row">
              <div>
                <strong>{formatPageLabel(item.pagePath)}</strong>
                <small>Início de jornada · {item.pagePath}</small>
              </div>
              <b>{formatNumber(item.sessions)}</b>
            </div>
          )}
        />

        <StackList
          title="Páginas de saída"
          eyebrow="Saída"
          items={data.exitPages}
          emptyText="Sem páginas de saída registradas."
          renderItem={(item) => (
            <div key={item.pagePath} className="intelligence-stat-row">
              <div>
                <strong>{formatPageLabel(item.pagePath)}</strong>
                <small>Ponto final da navegação · {item.pagePath}</small>
              </div>
              <b>{formatNumber(item.sessions)}</b>
            </div>
          )}
        />

        <StackList
          title="Fluxos fortes"
          eyebrow="Navegação"
          items={data.topFlows}
          emptyText="Sem transições relevantes no período."
          renderItem={(item) => (
            <div key={`${item.from}-${item.to}`} className="intelligence-stat-row">
              <div>
                <strong>{formatFlowLabel(item.from)}</strong>
                <small>{formatFlowLabel(item.to)}</small>
              </div>
              <b>{formatNumber(item.total)}</b>
            </div>
          )}
        />
      </section>

      <section className="intelligence-panel">
        <div className="intelligence-panel-head">
          <div>
            <span>Jornada por produto</span>
            <h3>Onde cada produto prende atenção e gera movimento comercial</h3>
          </div>
        </div>

        {data.productJourneys.length ? (
          <div className="intelligence-product-grid">
            {data.productJourneys.map((item) => (
              <article key={item.slug} className="intelligence-product-card">
                <span>{item.slug}</span>
                <h4>{item.label}</h4>
                <p>{formatNumber(item.views)} views, {formatNumber(item.commercialClicks)} cliques comerciais e {formatNumber(item.leads)} leads.</p>
                <div className="intelligence-product-meta">
                  <small>CTR comercial</small>
                  <b>{item.clickRate}%</b>
                </div>
                <div className="intelligence-product-meta">
                  <small>Lead por clique</small>
                  <b>{item.leadRate}%</b>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="dashboard-card-empty">Ainda não há jornada suficiente por produto.</p>
        )}
      </section>

      <section className="intelligence-grid-2">
        <StackList
          title="Top páginas no GA4"
          eyebrow="Complemento"
          items={data.ga4?.topPages || []}
          emptyText="Conecte o GA4 para ver páginas com mais usuários ativos."
          renderItem={(item) => (
            <div key={item.pagePath} className="intelligence-stat-row">
              <div>
                <strong>{formatPageLabel(item.pagePath)}</strong>
                <small>{formatDuration(item.avgSessionDuration)} de sessão média</small>
              </div>
              <b>{formatNumber(item.activeUsers)}</b>
            </div>
          )}
        />

        <article className="intelligence-panel intelligence-panel--soft">
          <div className="intelligence-panel-head">
            <div>
              <span>Estado da integração</span>
              <h3>O que esse módulo já lê sozinho</h3>
            </div>
          </div>

          <div className="intelligence-bullet-list">
            <div>
              <strong>Tracking próprio</strong>
              <p>Page views, origem, eventos relevantes, jornadas de entrada/saída e produto.</p>
            </div>
            <div>
              <strong>Captação comercial</strong>
              <p>Leads, cliques de WhatsApp, CTAs principais e sinais de intenção no período.</p>
            </div>
            <div>
              <strong>GA4 opcional</strong>
              <p>{data.ga4?.reason}</p>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
