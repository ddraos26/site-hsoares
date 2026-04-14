'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAdminJson, primeAdminJsonCache } from '@/lib/admin/client-fetch-cache';
import { MiniSignalRail } from '@/components/admin/lightweight-charts';
import { buildDashboardPageDetailHref, formatPageLabel } from '@/lib/admin/page-presentation';

const formatNumber = (value) => new Intl.NumberFormat('pt-BR').format(Number(value || 0));

function stripDomain(value) {
  return String(value || '').replace('https://hsoaresseguros.com.br', '') || '/';
}

function buildGoogleSearchUrl(query) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function openSeoCard(router, href, external = false) {
  if (!href) return;
  if (external) {
    window.open(href, '_blank', 'noopener,noreferrer');
    return;
  }
  router.push(href);
}

function getSeoCardProps(router, href, external = false) {
  if (!href) return {};

  return {
    role: 'link',
    tabIndex: 0,
    onClick: () => openSeoCard(router, href, external),
    onKeyDown: (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openSeoCard(router, href, external);
      }
    }
  };
}

function resolveOpportunityHref(item) {
  if (!item) return '/dashboard/seo';
  if (item.page) return buildDashboardPageDetailHref(stripDomain(item.page));
  if (item.query) return buildGoogleSearchUrl(item.query);
  return '/dashboard/seo';
}

function SeoMetricCard({ label, value, helper, tone = 'blue', href, router }) {
  return (
    <article className={`intelligence-metric-card intelligence-metric-card--${tone} ${href ? 'admin-actionable-card' : ''}`} {...getSeoCardProps(router, href, href?.startsWith('http'))}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </article>
  );
}

function SeoList({ title, eyebrow, items, renderItem, emptyText, id }) {
  return (
    <article className="intelligence-panel" id={id}>
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

export default function SeoClient({ apiBase = '/api/admin', initialData = null }) {
  const router = useRouter();
  const endpoint = `${apiBase}/search-console-intelligence`;
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialData) {
      primeAdminJsonCache(endpoint, initialData, 120_000);
      setData(initialData);
      setLoading(false);
      setError(null);
      return undefined;
    }

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchAdminJson(endpoint, { ttlMs: 120_000 });

        if (response?.error) {
          throw new Error(response.detail || response.error);
        }

        setData(response);
      } catch (err) {
        setError(err.message || 'Falha ao carregar o módulo de SEO.');
      } finally {
        setLoading(false);
      }
    };

    void load();
    return undefined;
  }, [endpoint, initialData]);

  if (loading) {
    return <p className="dashboard-card-empty">Montando o módulo de SEO...</p>;
  }

  if (error) {
    return <p className="dashboard-error">{error}</p>;
  }

  if (!data) {
    return <p className="dashboard-card-empty">Ainda não há dados suficientes para o módulo de SEO.</p>;
  }

  const primaryOpportunity = data.opportunities[0] || data.pageOpportunities[0] || null;
  const primaryPage = data.pageOpportunities[0] || data.topPages[0] || null;

  return (
    <div className="intelligence-shell">
      <section className="intelligence-hero intelligence-hero--seo">
        <div className="intelligence-hero-main">
          <p className="eyebrow">SEO</p>
          <h3>Onde existe demanda orgânica, onde o CTR está ruim e o que merece conteúdo ou ajuste comercial</h3>
          <p>{data.reason}</p>

          <div className="intelligence-pill-row">
            <span className={`intelligence-chip intelligence-chip--${data.status === 'connected' ? 'success' : 'warning'}`}>{data.statusLabel}</span>
            {data.propertyId ? <span className="intelligence-chip intelligence-chip--blue">{data.propertyId}</span> : null}
            {data.serviceAccountEmail ? <span className="intelligence-chip intelligence-chip--purple">{data.serviceAccountEmail}</span> : null}
          </div>
        </div>

        <aside className="intelligence-hero-side">
          <article
            className={`intelligence-focus-card ${primaryOpportunity ? 'admin-actionable-card' : ''}`}
            {...getSeoCardProps(router, resolveOpportunityHref(primaryOpportunity), Boolean(primaryOpportunity?.query && !primaryOpportunity?.page))}
          >
            <span>Melhor oportunidade</span>
            <strong>{primaryOpportunity?.query || (primaryOpportunity?.page ? formatPageLabel(stripDomain(primaryOpportunity.page)) : '') || 'Aguardando sinal forte'}</strong>
            <p>
              {primaryOpportunity
                ? `${formatNumber(primaryOpportunity.impressions)} impressões, CTR ${primaryOpportunity.ctr}% e posição ${primaryOpportunity.position}.`
                : 'Assim que o Search Console estiver conectado, esse bloco passa a apontar a melhor brecha orgânica do momento.'}
            </p>
            {primaryOpportunity ? (
              <MiniSignalRail
                tone="premium"
                items={[
                  { label: 'Imp', value: primaryOpportunity.impressions || 0 },
                  { label: 'Cliq', value: primaryOpportunity.clicks || 0 },
                  { label: 'CTR', value: Number(primaryOpportunity.ctr || 0) }
                ]}
              />
            ) : null}
          </article>

          <article
            className={`intelligence-focus-card intelligence-focus-card--soft ${primaryPage ? 'admin-actionable-card' : ''}`}
            {...getSeoCardProps(router, primaryPage ? buildDashboardPageDetailHref(stripDomain(primaryPage.page)) : '/dashboard/pages')}
          >
            <span>Decisão comercial</span>
            <strong>{data.pageOpportunities.length ? 'Reforçar páginas com intenção' : 'Conectar a propriedade'}</strong>
            <p>{data.pageOpportunities.length ? 'As páginas com posição intermediária e CTR baixo são as primeiras a merecer copy, título e CTA mais fortes.' : data.reason}</p>
          </article>
        </aside>
      </section>

      <section className="intelligence-metric-grid">
        <SeoMetricCard
          label="Queries fortes"
          value={formatNumber(data.topQueries.length)}
          helper="Termos visíveis no recorte"
          tone="blue"
          href="/dashboard/seo#queries"
          router={router}
          chartItems={[
            { label: 'Top', value: data.topQueries.length },
            { label: 'Rise', value: data.risingQueries.length },
            { label: 'Fall', value: data.fallingQueries.length }
          ]}
        />
        <SeoMetricCard
          label="Oportunidades"
          value={formatNumber(data.opportunities.length)}
          helper="Queries com espaço para crescer"
          tone="gold"
          href={resolveOpportunityHref(primaryOpportunity)}
          router={router}
          chartItems={[
            { label: 'Opp', value: data.opportunities.length },
            { label: 'Low CTR', value: data.lowCtrQueries.length },
            { label: 'Pages', value: data.pageOpportunities.length }
          ]}
        />
        <SeoMetricCard
          label="Páginas com potencial"
          value={formatNumber(data.pageOpportunities.length)}
          helper="Rotas com baixa captura do clique"
          tone="green"
          href={primaryPage ? buildDashboardPageDetailHref(stripDomain(primaryPage.page)) : '/dashboard/pages'}
          router={router}
          chartItems={[
            { label: 'Pot', value: data.pageOpportunities.length },
            { label: 'Top', value: data.topPages.length },
            { label: 'Site', value: data.sitemaps.length }
          ]}
        />
        <SeoMetricCard
          label="Sitemaps"
          value={formatNumber(data.sitemaps.length)}
          helper="Leitura de envio/indexação"
          tone="purple"
          href="/dashboard/seo#sitemaps"
          router={router}
          chartItems={[
            { label: 'Maps', value: data.sitemaps.length },
            { label: 'Top', value: data.topPages.length },
            { label: 'CTR', value: data.bestCtrQueries.length }
          ]}
        />
      </section>

      <section className="intelligence-grid-2">
        <SeoList
          id="priorities"
          title="O que a IA recomenda"
          eyebrow="Prioridade"
          items={[
            data.opportunities[0]
              ? {
                  title: `Atacar a query "${data.opportunities[0].query}"`,
                  description: `Ela já tem ${formatNumber(data.opportunities[0].impressions)} impressões e está em posição ${data.opportunities[0].position}.`,
                  helper: 'Melhore título, promessa e cobertura do termo.',
                  tone: 'premium',
                  href: buildGoogleSearchUrl(data.opportunities[0].query),
                  external: true
                }
              : null,
            data.lowCtrQueries[0]
              ? {
                  title: `Corrigir CTR de "${data.lowCtrQueries[0].query}"`,
                  description: 'O termo aparece bastante, mas converte pouco clique orgânico.',
                  helper: 'Revisar title, meta e gancho comercial.',
                  tone: 'warning',
                  href: buildGoogleSearchUrl(data.lowCtrQueries[0].query),
                  external: true
                }
              : null,
            data.pageOpportunities[0]
              ? {
                  title: `Atualizar ${formatPageLabel(stripDomain(data.pageOpportunities[0].page))}`,
                  description: 'A página já existe, mas pode ganhar mais tráfego e clique sem precisar de uma rota nova.',
                  helper: 'Refine copy, hierarquia e CTA comercial.',
                  tone: 'success',
                  href: buildDashboardPageDetailHref(stripDomain(data.pageOpportunities[0].page))
                }
              : null
          ].filter(Boolean)}
          emptyText="Sem recomendação dominante enquanto a propriedade não responde."
          renderItem={(item) => (
            <div
              key={item.title}
              className={`intelligence-list-card intelligence-list-card--${item.tone} ${item.href ? 'admin-actionable-card' : ''}`}
              {...getSeoCardProps(router, item.href, item.external)}
            >
              <strong>{item.title}</strong>
              <p>{item.description}</p>
              <small>{item.helper}</small>
            </div>
          )}
        />

        <SeoList
          id="queries"
          title="Queries de oportunidade"
          eyebrow="Busca"
          items={data.opportunities}
          emptyText="Conecte o Search Console para ver queries com espaço real de crescimento."
          renderItem={(item) => (
            <div
              key={item.query}
              className="intelligence-stat-row admin-actionable-card"
              {...getSeoCardProps(router, buildGoogleSearchUrl(item.query), true)}
            >
              <div>
                <strong>{item.query}</strong>
                <small>{formatNumber(item.impressions)} impressões · CTR {item.ctr}%</small>
              </div>
              <b>Pos. {item.position}</b>
            </div>
          )}
        />
      </section>

      <section className="intelligence-grid-2">
        <SeoList
          title="Melhor CTR"
          eyebrow="Vitórias"
          items={data.bestCtrQueries}
          emptyText="Sem termos suficientes para leitura de CTR."
          renderItem={(item) => (
            <div
              key={item.query}
              className="intelligence-stat-row admin-actionable-card"
              {...getSeoCardProps(router, buildGoogleSearchUrl(item.query), true)}
            >
              <div>
                <strong>{item.query}</strong>
                <small>{formatNumber(item.clicks)} cliques · posição {item.position}</small>
              </div>
              <b>{item.ctr}%</b>
            </div>
          )}
        />

        <SeoList
          title="Pior CTR"
          eyebrow="Revisar"
          items={data.lowCtrQueries}
          emptyText="Sem queries com massa crítica para revisão."
          renderItem={(item) => (
            <div
              key={item.query}
              className="intelligence-stat-row admin-actionable-card"
              {...getSeoCardProps(router, buildGoogleSearchUrl(item.query), true)}
            >
              <div>
                <strong>{item.query}</strong>
                <small>{formatNumber(item.impressions)} impressões · posição {item.position}</small>
              </div>
              <b>{item.ctr}%</b>
            </div>
          )}
        />
      </section>

      <section className="intelligence-grid-2">
        <SeoList
          title="Queries em crescimento"
          eyebrow="Momentum"
          items={data.risingQueries}
          emptyText="Sem leitura comparativa suficiente."
          renderItem={(item) => (
            <div
              key={item.query}
              className="intelligence-stat-row admin-actionable-card"
              {...getSeoCardProps(router, buildGoogleSearchUrl(item.query), true)}
            >
              <div>
                <strong>{item.query}</strong>
                <small>+{formatNumber(item.clickDelta)} cliques · +{formatNumber(item.impressionDelta)} impressões</small>
              </div>
              <b>{item.growthScore}</b>
            </div>
          )}
        />

        <SeoList
          title="Queries em queda"
          eyebrow="Queda"
          items={data.fallingQueries}
          emptyText="Sem queda relevante no recorte."
          renderItem={(item) => (
            <div
              key={item.query}
              className="intelligence-stat-row admin-actionable-card"
              {...getSeoCardProps(router, buildGoogleSearchUrl(item.query), true)}
            >
              <div>
                <strong>{item.query}</strong>
                <small>{item.clickDelta} cliques · {item.impressionDelta} impressões</small>
              </div>
              <b>{item.growthScore}</b>
            </div>
          )}
        />
      </section>

      <section className="intelligence-grid-2">
        <SeoList
          title="Páginas orgânicas fortes"
          eyebrow="Rotas"
          items={data.topPages}
          emptyText="Sem páginas orgânicas identificadas."
          renderItem={(item) => (
            <div
              key={item.page}
              className="intelligence-stat-row admin-actionable-card"
              {...getSeoCardProps(router, buildDashboardPageDetailHref(stripDomain(item.page)))}
            >
              <div>
                <strong>{formatPageLabel(stripDomain(item.page))}</strong>
                <small>{formatNumber(item.impressions)} impressões · CTR {item.ctr}%</small>
              </div>
              <b>Pos. {item.position}</b>
            </div>
          )}
        />

        <SeoList
          id="sitemaps"
          title="Páginas com potencial"
          eyebrow="Atualizar"
          items={data.pageOpportunities}
          emptyText="Sem páginas com potencial claro no recorte."
          renderItem={(item) => (
            <div
              key={item.page}
              className="intelligence-stat-row admin-actionable-card"
              {...getSeoCardProps(router, buildDashboardPageDetailHref(stripDomain(item.page)))}
            >
              <div>
                <strong>{formatPageLabel(stripDomain(item.page))}</strong>
                <small>{formatNumber(item.impressions)} impressões · CTR {item.ctr}%</small>
              </div>
              <b>Pos. {item.position}</b>
            </div>
          )}
        />
      </section>
    </div>
  );
}
