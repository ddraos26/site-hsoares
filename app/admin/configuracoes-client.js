'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAdminJson, primeAdminJsonCache } from '@/lib/admin/client-fetch-cache';
import {
  copilotoDeliverables,
  getIntegrationTone,
  implementationRoadmap
} from '@/lib/admin/integrations';
import { resolveDashboardHref } from '@/lib/admin/core/dashboard-route-catalog';

const publicEmail = 'contato@hsoaresseguros.com.br';
const internalLeadAlert = 'rodolfohsoaresseguros@gmail.com';
const publicWhatsapp = '(11) 9 7206-4288';

const formatDateTime = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

function renderMissing(item) {
  if (!item?.missing?.length) return null;
  return `Falta: ${item.missing.join(', ')}.`;
}

function renderOperationalDetail(item) {
  if (item?.summary?.spend != null) {
    return `Última leitura: ${item.summary.clicks || 0} cliques, ${item.summary.conversions || 0} conversões e ${new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 2
    }).format(Number(item.summary.spend || 0))} em gasto.`;
  }

  if (item?.summary?.whatsappConnected != null) {
    return `WhatsApp: ${item.summary.whatsappConnected ? 'ok' : 'pendente'} · CRM: ${item.summary.crmConnected ? 'ok' : 'pendente'}.`;
  }

  return item?.details?.[0] || '';
}

function resolveIntegrationHref(key) {
  switch (key) {
    case 'lead-database':
      return '/admin/leads';
    case 'google-analytics':
      return '/admin/analytics';
    case 'search-console':
      return '/admin/seo';
    case 'meta-ads':
    case 'google-ads':
      return '/admin/campanhas';
    case 'whatsapp-crm':
      return '/admin/leads';
    default:
      return '/admin/configuracoes';
  }
}

function openSettingsCard(router, href, basePath) {
  if (!href) return;
  router.push(resolveDashboardHref(href, basePath));
}

function getSettingsCardProps(router, href, basePath) {
  if (!href) return {};

  return {
    role: 'link',
    tabIndex: 0,
    onClick: () => openSettingsCard(router, href, basePath),
    onKeyDown: (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openSettingsCard(router, href, basePath);
      }
    }
  };
}

function MetricCard({ label, value, helper, tone = 'blue', href, router, basePath }) {
  return (
    <article className={`ops-metric-card ops-metric-card--${tone} ${href ? 'admin-actionable-card' : ''}`} {...getSettingsCardProps(router, href, basePath)}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </article>
  );
}

export default function AdminConfiguracoesClient({
  apiBase = '/api/admin',
  basePath = '/admin',
  initialData = null
}) {
  const router = useRouter();
  const endpoint = `${apiBase}/integrations`;
  const [integrationData, setIntegrationData] = useState(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialData) {
      primeAdminJsonCache(endpoint, initialData, 45_000);
      setIntegrationData(initialData);
      setLoading(false);
      setError(null);
      return undefined;
    }

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const payload = await fetchAdminJson(endpoint, { ttlMs: 45_000 });
        if (payload?.error) {
          throw new Error(payload.detail || payload.error);
        }
        setIntegrationData(payload);
      } catch (err) {
        setError(err.message || 'Falha ao carregar as integrações.');
      } finally {
        setLoading(false);
      }
    };

    void load();
    return undefined;
  }, [endpoint, initialData]);

  const summary = integrationData?.summary;
  const items = integrationData?.items || [];
  const lastCheckedAt = integrationData?.checkedAt;
  const aiReadiness = integrationData?.aiReadiness;
  const trackingQuality = integrationData?.trackingQuality;

  const operationalStack = useMemo(
    () =>
      items.filter((item) =>
        ['lead-database', 'google-analytics', 'search-console', 'meta-ads', 'google-ads', 'whatsapp-crm'].includes(item.key)
      ),
    [items]
  );

  const criticalConnections = useMemo(
    () => items.filter((item) => ['meta-ads', 'google-ads', 'whatsapp-crm'].includes(item.key)),
    [items]
  );

  const heroTitle = summary
    ? `Hoje o admin está em modo ${summary.stageLabel.toLowerCase()}`
    : 'O admin está checando as integrações do sistema';

  if (loading) return <p className="dashboard-card-empty">Sincronizando integrações...</p>;
  if (error) return <p className="dashboard-error">{error}</p>;
  if (!integrationData) return <p className="dashboard-card-empty">Sem dados de integrações agora.</p>;

  return (
    <div className="cockpit-shell">
      <section className="cockpit-hero">
        <div className="cockpit-hero-main">
          <p className="eyebrow">Configurações e integrações</p>
          <h3>{heroTitle}</h3>
          <p>
            {summary?.stageDescription ||
              'Assim que as integrações responderem, esta tela mostra o que já alimenta o cockpit e qual conexão destrava a próxima camada de receita.'}
          </p>

          <div className="ops-chip-row">
            <span className="ops-chip ops-chip--success">Conectadas: {summary?.connected || 0}</span>
            <span className="ops-chip ops-chip--premium">Prontas: {summary?.ready || 0}</span>
            <span className="ops-chip ops-chip--warning">Parciais + pendentes: {(summary?.partial || 0) + (summary?.pending || 0)}</span>
            <span className={`ops-chip ops-chip--${aiReadiness?.provider?.configured ? 'success' : 'warning'}`}>
              {aiReadiness?.provider?.configured ? 'IA pronta' : 'IA pendente'}
            </span>
            <span className={`ops-chip ops-chip--${trackingQuality?.status === 'healthy' ? 'success' : trackingQuality?.status === 'pending' ? 'premium' : 'warning'}`}>
              {trackingQuality?.statusLabel || 'Tracking em leitura'}
            </span>
          </div>
        </div>

        <aside className="cockpit-confidence-card admin-actionable-card" {...getSettingsCardProps(router, '/admin/configuracoes', basePath)}>
          <span>Próximo desbloqueio</span>
          <strong>{summary?.nextUnlockTitle || 'Base operacional consolidada'}</strong>
          <small>{summary?.nextUnlockDescription || 'As camadas principais já estão ligadas. O próximo passo é aprofundar atribuição e fechamento.'}</small>
          <small>Última leitura: {formatDateTime(lastCheckedAt)}</small>
        </aside>
      </section>

      <section className="ops-metric-grid">
        <MetricCard
          label="Conectadas"
          value={summary?.connected || 0}
          helper="Camadas operacionais respondendo"
          tone="success"
          href="/admin/configuracoes"
          router={router}
          basePath={basePath}
        />
        <MetricCard
          label="Prontas para ativar"
          value={summary?.ready || 0}
          helper="Estrutura montada, faltando ligar"
          tone="premium"
          href="/admin/configuracoes"
          router={router}
          basePath={basePath}
        />
        <MetricCard
          label="Parciais"
          value={summary?.partial || 0}
          helper="Conexões que ainda pedem ajuste"
          tone="warning"
          href="/admin/configuracoes"
          router={router}
          basePath={basePath}
        />
        <MetricCard
          label="Pendentes"
          value={summary?.pending || 0}
          helper="Camadas ainda sem ligação"
          tone="danger"
          href="/admin/configuracoes"
          router={router}
          basePath={basePath}
        />
      </section>

      <section className="admin-connection-grid">
        {aiReadiness ? (
          <article
            className="admin-connection-card admin-actionable-card"
            {...getSettingsCardProps(router, '/admin/custo-ia', basePath)}
          >
            <p className="eyebrow">IA real</p>
            <h3>{aiReadiness.provider.statusLabel}</h3>
            <strong>{aiReadiness.provider.model}</strong>
            <p>{aiReadiness.nextAction}</p>
            <ul>
              {(aiReadiness.checklist || []).slice(0, 3).map((item) => (
                <li key={item.key}>{item.title}: {item.status === 'done' ? 'ok' : 'pendente'}</li>
              ))}
            </ul>
            <p className="admin-card-footnote">
              Cobertura atual: {(aiReadiness.coverage?.modules || []).join(' · ')}
            </p>
          </article>
        ) : null}
        {trackingQuality ? (
          <article
            className="admin-connection-card admin-actionable-card"
            {...getSettingsCardProps(router, '/admin/campanhas', basePath)}
          >
            <p className="eyebrow">Atribuição do site</p>
            <h3>{trackingQuality.statusLabel}</h3>
            <strong>{trackingQuality.healthScore}% de saúde</strong>
            <p>{trackingQuality.summary}</p>
            <ul>
              {(trackingQuality.metrics || []).slice(0, 3).map((item) => (
                <li key={item.key}>
                  {item.label}: {item.coverage}% com origem
                </li>
              ))}
            </ul>
            <p className="admin-card-footnote">{trackingQuality.nextAction}</p>
          </article>
        ) : null}
        {operationalStack.map((item) => (
          <article
            key={item.key}
            className={`admin-connection-card admin-actionable-card`}
            {...getSettingsCardProps(router, resolveIntegrationHref(item.key), basePath)}
          >
            <p className="eyebrow">{item.eyebrow}</p>
            <h3>{item.title}</h3>
            <strong>{item.statusLabel}</strong>
            <p>{item.reason}</p>
            <ul>
              {item.unlocks.slice(0, 3).map((unlock) => (
                <li key={unlock}>{unlock}</li>
              ))}
            </ul>
            {renderOperationalDetail(item) ? <p className="admin-card-footnote">{renderOperationalDetail(item)}</p> : null}
            {renderMissing(item) ? <p className="admin-card-footnote">{renderMissing(item)}</p> : null}
          </article>
        ))}
      </section>

      <section className="admin-card">
        <div className="admin-card-head">
          <h2>Conexões que destravam dinheiro de verdade</h2>
          <span>Prioridade do projeto</span>
        </div>
        <div className="admin-connection-grid">
          {criticalConnections.map((item) => (
            <article
              key={item.key}
              className="admin-connection-card admin-actionable-card"
              {...getSettingsCardProps(router, resolveIntegrationHref(item.key), basePath)}
            >
              <p className="eyebrow">{item.eyebrow}</p>
              <h3>{item.title}</h3>
              <strong>{item.subtitle}</strong>
              <p>{item.reason}</p>
              <ul>
                {item.unlocks.map((unlock) => (
                  <li key={unlock}>{unlock}</li>
                ))}
              </ul>
              {renderOperationalDetail(item) ? <p className="admin-card-footnote">{renderOperationalDetail(item)}</p> : null}
              <p className="admin-card-footnote">
                <b>Próximo passo:</b> {item.nextAction}
              </p>
              {renderMissing(item) ? <p className="admin-card-footnote">{renderMissing(item)}</p> : null}
            </article>
          ))}
        </div>
      </section>

      <div className="admin-panel-grid">
        <section className="admin-card admin-actionable-card" {...getSettingsCardProps(router, '/admin/leads', basePath)}>
          <div className="admin-card-head">
            <h2>Leads do site</h2>
            <span>Envio transacional</span>
          </div>
          <div className="admin-detail-list">
            <div className="admin-detail-row">
              <span>Destino atual</span>
              <b>{internalLeadAlert}</b>
            </div>
            <div className="admin-detail-row">
              <span>Reply-to público</span>
              <b>{publicEmail}</b>
            </div>
            <div className="admin-detail-row">
              <span>Remetente atual</span>
              <b>onboarding@resend.dev</b>
            </div>
          </div>
        </section>

        <section className="admin-card admin-actionable-card" {...getSettingsCardProps(router, '/admin/analytics', basePath)}>
          <div className="admin-card-head">
            <h2>Infraestrutura operacional</h2>
            <span>Base atual</span>
          </div>
          <div className="admin-detail-list">
            <div className="admin-detail-row">
              <span>Site</span>
              <b>Vercel</b>
            </div>
            <div className="admin-detail-row">
              <span>Banco</span>
              <b>Neon Postgres</b>
            </div>
            <div className="admin-detail-row">
              <span>DNS atual</span>
              <b>Wix</b>
            </div>
          </div>
        </section>

        <section className="admin-card admin-actionable-card" {...getSettingsCardProps(router, '/admin/copiloto', basePath)}>
          <div className="admin-card-head">
            <h2>Contato público</h2>
            <span>Frente comercial</span>
          </div>
          <div className="admin-detail-list">
            <div className="admin-detail-row">
              <span>E-mail público</span>
              <b>{publicEmail}</b>
            </div>
            <div className="admin-detail-row">
              <span>WhatsApp principal</span>
              <b>{publicWhatsapp}</b>
            </div>
            <div className="admin-detail-row">
              <span>CNPJ</span>
              <b>11.194.245.0001-13</b>
            </div>
          </div>
        </section>
      </div>

      <div className="admin-panel-grid admin-panel-grid--wide admin-strategy-grid">
        <section className="admin-card admin-card--tinted">
          <div className="admin-card-head">
            <h2>O que o copiloto vai entregar depois</h2>
            <span>Valor prático</span>
          </div>
          <ul className="admin-value-list">
            {copilotoDeliverables.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="admin-card admin-card--tinted">
          <div className="admin-card-head">
            <h2>Ordem recomendada de implementação</h2>
            <span>Sem desperdício</span>
          </div>
          <div className="admin-roadmap-grid">
            {implementationRoadmap.map((item) => (
              <article key={item.step} className="admin-roadmap-card">
                <span className="admin-roadmap-step">{item.step}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
