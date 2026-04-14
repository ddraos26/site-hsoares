'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DailyChecklistPanel } from '@/components/admin/daily-checklist-panel';
import { fetchAdminJson, primeAdminJsonCache } from '@/lib/admin/client-fetch-cache';
import { resolveDashboardHref } from '@/lib/admin/core/dashboard-route-catalog';

function openMissionCard(router, href, basePath) {
  if (!href) return;
  router.push(resolveDashboardHref(href, basePath));
}

function getMissionCardProps(router, href, basePath) {
  if (!href) return {};

  return {
    role: 'link',
    tabIndex: 0,
    onClick: () => openMissionCard(router, href, basePath),
    onKeyDown: (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openMissionCard(router, href, basePath);
      }
    }
  };
}

function MissionList({ title, eyebrow, items, emptyText, tone = 'neutral', href, itemHrefResolver, router, basePath }) {
  return (
    <article className="mission-panel">
      <div className="mission-panel-head">
        <div>
          <span>{eyebrow}</span>
          <h3>{title}</h3>
        </div>
      </div>

      {items.length ? (
        <div className="mission-list">
          {items.map((item) => {
            const itemHref = itemHrefResolver ? itemHrefResolver(item) : href;

            return (
            <div
              key={item.id || item.title || item.key}
              className={`mission-item mission-item--${tone} ${itemHref ? 'admin-actionable-card' : ''}`}
              {...getMissionCardProps(router, itemHref, basePath)}
            >
              <strong>{item.title}</strong>
              <p>{item.description || item.diagnosis || item.reason || item.recommendation}</p>
              <small>{item.impact || item.effect || item.value || item.statusLabel}</small>
            </div>
          )})}
        </div>
      ) : (
        <p className="dashboard-card-empty">{emptyText}</p>
      )}
    </article>
  );
}

export default function MissionClient({ apiBase = '/api/admin', initialData = null, basePath = '/admin' }) {
  const router = useRouter();
  const endpoint = `${apiBase}/executive-cockpit`;
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialData) {
      primeAdminJsonCache(endpoint, initialData);
      setData(initialData);
      setLoading(false);
      setError(null);
      return undefined;
    }

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchAdminJson(endpoint);

        if (response?.error) {
          throw new Error(response.detail || response.error);
        }

        setData(response);
      } catch (err) {
        setError(err.message || 'Falha ao carregar a missão de hoje.');
      } finally {
        setLoading(false);
      }
    };

    void load();
    return undefined;
  }, [endpoint, initialData]);

  if (loading) {
    return <p className="dashboard-card-empty">Montando a missão de hoje...</p>;
  }

  if (error) {
    return <p className="dashboard-error">{error}</p>;
  }

  if (!data) {
    return <p className="dashboard-card-empty">Ainda não há sinais suficientes para a missão de hoje.</p>;
  }

  const topOpportunity = data.growthMoves[0] || data.seo.opportunities[0] || null;
  const primaryAlert = data.moneyLeaks[0] || null;
  const productOfDay = data.products[0] || null;
  const executionCenter = data.executionCenter || {};
  const operations = data.operations || { summary: {}, items: [] };
  const aiNarrative = data.aiNarrative || null;
  const dailyChecklist = data.dailyChecklist || null;

  const systemDid = [
    { key: 'alerts', title: 'Gerou alertas', description: 'O sistema identificou vazamentos e gargalos comerciais ativos.', statusLabel: `${data.moneyLeaks.length} alertas principais` },
    { key: 'priority', title: 'Recalculou prioridades', description: 'Os 4 produtos centrais foram reordenados por score, urgência e oportunidade.', statusLabel: `${data.products.length} produtos avaliados` },
    { key: 'runs', title: 'Organizou contexto', description: executionCenter.summary || 'Os registros com suporte da IA aparecem aqui assim que entram no histórico.', statusLabel: `${executionCenter.successfulRuns || 0} registros recentes` },
    { key: 'reviews', title: 'Abriu acompanhamentos', description: 'Toda sugestão tratada pode voltar para a fila com revisão de impacto.', statusLabel: `${executionCenter.pendingReviews || 0} revisões ativas` },
    { key: 'ops', title: 'Montou fila operacional', description: 'As decisões aprovadas viraram operações rastreáveis, com destino e próximo passo.', statusLabel: `${(operations.summary?.ready || 0) + (operations.summary?.running || 0)} ações prontas` },
    { key: 'risk', title: 'Classificou riscos', description: 'O sistema separou o que é vazamento, o que é oportunidade e o que exige aprovação.', statusLabel: `${executionCenter.pendingApprovals || data.approvals.length} aprovações pendentes` }
  ];

  return (
    <div className="mission-shell">
      <section className="mission-hero">
        <div className="mission-hero-main">
          <p className="eyebrow">Missão de Hoje</p>
          <h3>{aiNarrative?.missionHeadline || data.commandCenter.title}</h3>
          <p>{aiNarrative?.missionNarrative || data.commandCenter.diagnosis}</p>

          <div className="ops-chip-row">
            <span className="ops-chip ops-chip--success">IA organizou: {executionCenter.autonomousActions || 0}</span>
            <span className="ops-chip ops-chip--warning">Pendentes de aprovação: {executionCenter.pendingApprovals || 0}</span>
            <span className="ops-chip ops-chip--premium">Reviews abertas: {executionCenter.pendingReviews || 0}</span>
            <span className="ops-chip">Fila operacional: {(operations.summary?.ready || 0) + (operations.summary?.running || 0)}</span>
            <span className={`ops-chip ops-chip--${aiNarrative?.source?.status === 'live' ? 'success' : 'warning'}`}>
              {aiNarrative?.source?.status === 'live' ? 'IA ativa' : 'IA em espera'}
            </span>
          </div>
        </div>

        <aside className="mission-hero-side">
          <div className="mission-hero-card mission-hero-card--featured admin-actionable-card" {...getMissionCardProps(router, data.actionQueue?.[0]?.href || '/dashboard/decision-center', basePath)}>
            <small>Melhor decisão do dia</small>
            <strong>{aiNarrative?.decisionNarrative || data.commandCenter.recommendation}</strong>
            <p>{data.commandCenter.impact}</p>
          </div>

          <div className="mission-hero-stats">
            <div className="mission-hero-card admin-actionable-card" {...getMissionCardProps(router, '/dashboard/settings/integrations', basePath)}>
              <small>Situação geral</small>
              <strong>{data.integrations.summary.stageLabel}</strong>
              <p>{data.integrations.summary.stageDescription}</p>
            </div>
            <div className="mission-hero-card admin-actionable-card" {...getMissionCardProps(router, primaryAlert?.href || '/dashboard/decision-center', basePath)}>
              <small>Principal alerta</small>
              <strong>{primaryAlert?.title || 'Sem alerta crítico'}</strong>
              <p>{primaryAlert?.description || 'A operação está estável neste recorte.'}</p>
            </div>
            <div className="mission-hero-card admin-actionable-card" {...getMissionCardProps(router, topOpportunity?.href || (topOpportunity?.query ? '/dashboard/seo' : '/dashboard/decision-center'), basePath)}>
              <small>Principal oportunidade</small>
              <strong>{topOpportunity?.title || topOpportunity?.query || 'Sem oportunidade clara'}</strong>
              <p>{topOpportunity?.description || (topOpportunity ? `Posição ${topOpportunity.position} com ${topOpportunity.impressions} impressões.` : 'O sistema ainda não encontrou uma alavanca dominante.')}</p>
            </div>
            <div
              className="mission-hero-card admin-actionable-card"
              {...getMissionCardProps(router, productOfDay?.slug ? `/dashboard/products/${encodeURIComponent(productOfDay.slug)}` : '/dashboard/products', basePath)}
            >
              <small>Produto do dia</small>
              <strong>{productOfDay?.label || 'Sem produto líder'}</strong>
              <p>{productOfDay?.narrative?.recommendation || 'Aguardando mais massa crítica para uma indicação forte.'}</p>
            </div>
            <div className="mission-hero-card admin-actionable-card" {...getMissionCardProps(router, operations.focus?.nextOperation?.contextHref || operations.focus?.nextOperation?.operationHref || '/dashboard/history', basePath)}>
              <small>Próximo movimento</small>
              <strong>{operations.focus?.nextOperation?.title || executionCenter.headline || 'Sem registro recente'}</strong>
              <p>{operations.focus?.nextOperation?.description || executionCenter.summary || 'Os próximos contextos organizados pela IA aparecerão aqui.'}</p>
            </div>
            {aiNarrative?.topActions?.length ? (
              <div className="mission-hero-card admin-actionable-card" {...getMissionCardProps(router, '/dashboard/decision-center', basePath)}>
                <small>Top 3 ações da IA</small>
                <strong>{aiNarrative.topActions[0]}</strong>
                <p>{aiNarrative.topActions.slice(1).join(' ')}</p>
              </div>
            ) : null}
          </div>
        </aside>
      </section>

      <section className="mission-grid-2">
        <DailyChecklistPanel
          apiBase={apiBase}
          basePath={basePath}
          initialData={dailyChecklist}
          title="Checklist guiado do dia"
          eyebrow="Sua rotina"
        />

        <article className="mission-panel mission-panel--orientation">
          <div className="mission-panel-head">
            <div>
              <span>Rota do dia</span>
              <h3>O caminho curto para agir sem se perder</h3>
            </div>
          </div>

          <div className="mission-list">
            {[
              {
                key: '1',
                title: 'Veja o foco do dia',
                description: 'Comece pela missao e pelo principal alerta para entender rapido o que merece sua energia agora.',
                statusLabel: '1. O que olhar agora'
              },
              {
                key: '2',
                title: 'Entenda por que isso importa',
                description: 'O checklist e os cards explicam o motivo da prioridade antes de te jogar para dentro de uma tela.',
                statusLabel: '2. Por que isso importa'
              },
              {
                key: '3',
                title: 'Abra o contexto certo',
                description: 'Sempre prefira o clique que leva direto para a pagina, produto ou operacao citada pela IA.',
                statusLabel: '3. Proximo clique'
              },
              {
                key: '4',
                title: 'So depois aprofunde',
                description: 'Listas gerais de pagina, produto e campanha entram depois, quando voce ja sabe o que foi priorizado.',
                statusLabel: '4. Aprofundar'
              }
            ].map((item) => (
              <div key={item.key} className="mission-item mission-item--neutral">
                <strong>{item.title}</strong>
                <p>{item.description}</p>
                <small>{item.statusLabel}</small>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="mission-grid-2">
        <MissionList
          title="Ações recomendadas"
          eyebrow="Hoje"
          items={data.actionQueue.slice(0, 3).map((item) => ({
            ...item,
            description: item.recommendation
          }))}
          emptyText="Sem ações prioritárias no momento."
          tone="success"
          href="/dashboard/decision-center"
          itemHrefResolver={(item) => item.href || '/dashboard/decision-center'}
          router={router}
          basePath={basePath}
        />

        <MissionList
          title="O que precisa de mim"
          eyebrow="Aprovação humana"
          items={data.approvals}
          emptyText="Nenhuma aprovação crítica pendente."
          tone="warning"
          href="/dashboard/approvals"
          itemHrefResolver={(item) => item.href || '/dashboard/approvals'}
          router={router}
          basePath={basePath}
        />
      </section>

      <section className="mission-grid-2">
        <MissionList
          title="O que está ruim"
          eyebrow="Alertas"
          items={data.moneyLeaks}
          emptyText="Nenhum vazamento grave identificado."
          tone="danger"
          href="/dashboard/decision-center"
          router={router}
          basePath={basePath}
        />

        <MissionList
          title="O que está bom"
          eyebrow="Forças"
          items={data.growthMoves}
          emptyText="Sem uma força dominante identificada ainda."
          tone="success"
          href="/dashboard/campaigns"
          router={router}
          basePath={basePath}
        />
      </section>

      <section className="mission-grid-2">
        <MissionList
          title="O que o sistema já organizou"
          eyebrow="Leitura"
          items={systemDid}
          emptyText="Sem registros recentes ainda."
          tone="neutral"
          href="/dashboard/history"
          router={router}
          basePath={basePath}
        />

        <MissionList
          title="Fila operacional da IA"
          eyebrow="Próximo passo"
          items={(operations.items || []).slice(0, 4).map((item) => ({
            ...item,
            description: item.dispatchPacket?.brief || item.description,
            statusLabel: `${item.statusLabel} · ${item.dispatchPacket?.readinessLabel || item.executionModeLabel}`
          }))}
          emptyText="Nenhuma ação operacional aberta."
          tone="premium"
          href="/dashboard/automations"
          itemHrefResolver={(item) => item.contextHref || item.operationHref || '/dashboard/automations'}
          router={router}
          basePath={basePath}
        />
      </section>
    </div>
  );
}
