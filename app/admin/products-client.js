'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchAdminJson, primeAdminJsonCache } from '@/lib/admin/client-fetch-cache';

function defaultRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10)
  };
}

function getUrlFilterState(searchParams, fallbackRange) {
  return {
    from: searchParams.get('from') || fallbackRange.from,
    to: searchParams.get('to') || fallbackRange.to,
    query: searchParams.get('q') || ''
  };
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('pt-BR');
}

function formatNumber(value) {
  return new Intl.NumberFormat('pt-BR').format(Number(value || 0));
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function buildProductScore(item) {
  const score =
    clamp((Number(item.views || 0) / 180) * 18, 0, 18) +
    clamp((Number(item.clicks || 0) / 30) * 18, 0, 18) +
    clamp((Number(item.leads || 0) / 8) * 26, 0, 26) +
    clamp((Number(item.clickRate || 0) / 12) * 16, 0, 16) +
    clamp((Number(item.leadRate || 0) / 25) * 22, 0, 22);

  return Math.round(clamp(score, 0, 100));
}

function buildProductMotion(item) {
  if (item.views >= 80 && item.leads === 0) return 'Corrigir agora';
  if (item.clicks >= 12 && item.leadRate < 8) return 'Otimizar conversão';
  if (item.leadRate >= 18 && item.views < 80) return 'Escalar distribuição';
  if (item.views < 25 && item.clicks < 6) return 'Ganhar tração';
  return 'Ajuste fino';
}

function buildProductTone(item) {
  if (item.views >= 80 && item.leads === 0) return 'danger';
  if (item.leadRate >= 18) return 'success';
  if (item.clicks >= 10 && item.leads <= 1) return 'warning';
  return 'premium';
}

function buildProductNarrative(item) {
  const motion = buildProductMotion(item);

  if (motion === 'Corrigir agora') {
    return 'Recebe tráfego, mas ainda não transforma atenção em lead.';
  }

  if (motion === 'Otimizar conversão') {
    return 'O interesse existe, mas a página ainda deixa lead na mesa.';
  }

  if (motion === 'Escalar distribuição') {
    return 'Converte bem e pede mais visibilidade para crescer com eficiência.';
  }

  if (motion === 'Ganhar tração') {
    return 'Ainda precisa de mais entrada qualificada para validar melhor o potencial.';
  }

  return 'Já tem sinais úteis e pede ajustes estratégicos, não ruptura.';
}

function openProductCard(router, href, external = false) {
  if (!href) return;
  if (external) {
    window.open(href, '_blank', 'noopener,noreferrer');
    return;
  }
  router.push(href);
}

function getProductCardProps(router, href, external = false) {
  if (!href) return {};

  return {
    role: 'link',
    tabIndex: 0,
    onClick: () => openProductCard(router, href, external),
    onKeyDown: (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openProductCard(router, href, external);
      }
    }
  };
}

function ProductsMetricCard({ label, value, helper, tone = 'blue', href, router }) {
  return (
    <article className={`ops-metric-card ops-metric-card--${tone} ${href ? 'admin-actionable-card' : ''}`} {...getProductCardProps(router, href)}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </article>
  );
}

function ProductActionCard({ title, item, helper, tone = 'blue', href, router, external = false }) {
  return (
    <article className={`ops-action-card ops-action-card--${tone} ${href ? 'admin-actionable-card' : ''}`} {...getProductCardProps(router, href, external)}>
      <span>{title}</span>
      {item ? (
        <>
          <strong>{item.name}</strong>
          <p>{item.decision?.recommendation?.summary || item.decision?.diagnosis?.summary}</p>
          <small>{helper}</small>
        </>
      ) : (
        <>
          <strong>Sem destaque claro</strong>
          <p>O sistema ainda não encontrou uma alavanca dominante nesse recorte.</p>
          <small>Amplie a janela ou conecte mais fontes para aprofundar a leitura.</small>
        </>
      )}
    </article>
  );
}

function ProductRankingRow({ item, maxValue, href, router }) {
  const priority = Number(item.decision?.scores?.priority || 0);
  const width = maxValue > 0 ? Math.max(12, (priority / maxValue) * 100) : 12;

  return (
    <div className={`ops-bar-row ${href ? 'admin-actionable-card' : ''}`} {...getProductCardProps(router, href)}>
      <div className="ops-bar-copy">
        <strong>{item.name}</strong>
        <small>{item.decision?.headline} · {item.decision?.automation?.label}</small>
      </div>
      <div className="ops-bar-track">
        <div className={`ops-bar-fill ops-bar-fill--${item.decision?.tone || 'premium'}`} style={{ width: `${width}%` }} />
      </div>
      <b>{priority}</b>
    </div>
  );
}

export default function ProductsClient({ apiBase = '/api/admin', initialData = null, initialRange = null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fallbackRange = useMemo(() => initialRange || defaultRange(), [initialRange]);
  const initialFilters = useMemo(() => getUrlFilterState(searchParams, fallbackRange), [searchParams, fallbackRange]);
  const [from, setFrom] = useState(initialFilters.from);
  const [to, setTo] = useState(initialFilters.to);
  const [query, setQuery] = useState(initialFilters.query);
  const [data, setData] = useState(initialData || { summary: {}, items: [] });
  const [loading, setLoading] = useState(!initialData);

  useEffect(() => {
    const nextFilters = getUrlFilterState(searchParams, fallbackRange);

    setFrom((current) => (current === nextFilters.from ? current : nextFilters.from));
    setTo((current) => (current === nextFilters.to ? current : nextFilters.to));
    setQuery((current) => (current === nextFilters.query ? current : nextFilters.query));
  }, [searchParams, fallbackRange]);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      const params = new URLSearchParams({ from, to });
      if (query) params.set('q', query);
      const endpoint = `${apiBase}/products?${params.toString()}`;
      const isInitialQuery = Boolean(
        initialData &&
          !query &&
          from === fallbackRange.from &&
          to === fallbackRange.to
      );

      if (isInitialQuery) {
        primeAdminJsonCache(endpoint, initialData, 45_000);
        setData(initialData);
        setLoading(false);
        return;
      }

      const payload = await fetchAdminJson(endpoint, {
        ttlMs: 45_000,
        fetchOptions: { signal: controller.signal }
      });
      setData(payload);
      setLoading(false);
    }

    load().catch(() => setLoading(false));
    return () => controller.abort();
  }, [apiBase, fallbackRange.from, fallbackRange.to, from, initialData, query, to]);

  const rankedItems = useMemo(
    () =>
      [...(data.items || [])].sort(
        (a, b) =>
          Number(b.decision?.scores?.priority || 0) - Number(a.decision?.scores?.priority || 0) ||
          b.leads - a.leads ||
          b.clicks - a.clicks
      ),
    [data.items]
  );

  const commandCenter = data.commandCenter || {};
  const topProduct = commandCenter.topPriority || rankedItems[0] || null;
  const scaleCandidate = commandCenter.scaleCandidate || null;
  const fixCandidate = commandCenter.urgentFix || null;
  const contentCandidate =
    rankedItems.find((item) => Number(item.decision?.scores?.opportunity || 0) >= 45 && item.slug !== scaleCandidate?.slug) ||
    rankedItems[1] ||
    null;
  const maxScore = rankedItems.reduce(
    (highest, item) => Math.max(highest, Number(item.decision?.scores?.priority || 0)),
    0
  );
  const totalWins = rankedItems.reduce((sum, item) => sum + Number(item.ganhos || 0), 0);
  const totalLosses = rankedItems.reduce((sum, item) => sum + Number(item.perdidos || 0), 0);

  return (
    <div className="product-command-shell">
      <section className="ops-hero ops-hero--products">
        <div className="ops-hero-main">
          <p className="eyebrow">Produtos centrais</p>
          <h3>
            {topProduct
              ? topProduct.decision?.headline || `${topProduct.name} puxa a prioridade do período`
              : 'A IA está organizando a prioridade comercial dos produtos'}
          </h3>
          <p>
            Em vez de despejar análise de dados, o sistema já traz a leitura executiva do produto: o que aconteceu, por que isso importa, o que fazer e o que pode seguir para automação ou aprovação.
          </p>

          <div className="ops-chip-row">
            <span className="ops-chip ops-chip--premium">{commandCenter.mission || 'Aguardando sinais fortes de produto'}</span>
            <span className="ops-chip ops-chip--success">Automático seguro: {formatNumber(commandCenter.autoSafeCount || 0)}</span>
            <span className="ops-chip ops-chip--warning">Requer aprovação: {formatNumber(commandCenter.approvalCount || 0)}</span>
          </div>
        </div>

        <aside
          className={`ops-focus-card ${topProduct ? 'admin-actionable-card' : ''}`}
          {...getProductCardProps(router, topProduct?.links?.contextHref || '')}
        >
          <span>Foco principal</span>
          <strong>{topProduct?.decision?.recommendation?.priority || 'Sem destaque dominante'}</strong>
          <p>{topProduct?.decision?.recommendation?.summary || 'Assim que mais sinais entrarem, o painel passa a indicar qual produto merece energia imediata.'}</p>
          <div className="ops-focus-meta">
            <div>
              <small>Saúde</small>
              <b>{formatNumber(topProduct?.decision?.scores?.health || 0)}</b>
            </div>
            <div>
              <small>Oportunidade</small>
              <b>{formatNumber(topProduct?.decision?.scores?.opportunity || 0)}</b>
            </div>
            <div>
              <small>Urgência</small>
              <b>{formatNumber(topProduct?.decision?.scores?.urgency || 0)}</b>
            </div>
          </div>
        </aside>
      </section>

      <section className="ops-metric-grid">
        <ProductsMetricCard
          label="Fila de decisão"
          value={formatNumber(rankedItems.length)}
          helper="Produtos com leitura suficiente para decisão"
          tone="blue"
          href="/admin/produtos"
          router={router}
        />
        <ProductsMetricCard
          label="Correção automática"
          value={formatNumber(commandCenter.autoSafeCount || 0)}
          helper="Produtos que já podem entrar em correção segura"
          tone="warning"
          href={fixCandidate?.links?.contextHref || '/admin/produtos'}
          router={router}
        />
        <ProductsMetricCard
          label="Prontos para escalar"
          value={formatNumber(commandCenter.approvalCount || 0)}
          helper="Pedidos de aprovação para distribuição ou investimento"
          tone="success"
          href={scaleCandidate?.links?.contextHref || '/admin/produtos'}
          router={router}
        />
        <ProductsMetricCard
          label="Base saudável"
          value={formatNumber(commandCenter.healthyCount || 0)}
          helper="Produtos que não precisam roubar sua atenção hoje"
          tone="premium"
          href="/admin/produtos"
          router={router}
        />
      </section>

      <section className="ops-grid">
        <article className="ops-panel">
          <div className="ops-panel-head">
            <div>
              <span>Decisão prática</span>
              <h3>Onde atacar agora</h3>
            </div>
          </div>
          <div className="ops-action-grid">
            <ProductActionCard
              title="Escalar mídia"
              item={scaleCandidate}
              helper={scaleCandidate ? scaleCandidate.decision?.automation?.summary : 'Ainda não há candidato limpo de escala.'}
              tone="success"
              href={scaleCandidate?.links?.contextHref || '/admin/campanhas'}
              router={router}
            />
            <ProductActionCard
              title="Corrigir página"
              item={fixCandidate}
              helper={fixCandidate ? fixCandidate.decision?.diagnosis?.summary : 'Nenhum produto está claramente desperdiçando atenção agora.'}
              tone="danger"
              href={fixCandidate?.links?.contextHref || '/admin/paginas'}
              router={router}
            />
            <ProductActionCard
              title="Ganhar prioridade"
              item={contentCandidate}
              helper={contentCandidate ? contentCandidate.decision?.recommendation?.impact : 'Sem indicação forte de prioridade secundária neste recorte.'}
              tone="premium"
              href={contentCandidate?.links?.operationHref || '/admin/produtos'}
              router={router}
            />
          </div>
        </article>

        <article className="ops-panel ops-panel--soft">
          <div className="ops-panel-head">
            <div>
              <span>Ranking visual</span>
              <h3>Score de prioridade comercial</h3>
            </div>
          </div>
          <div className="ops-bar-list">
            {rankedItems.length ? (
              rankedItems.map((item) => (
                <ProductRankingRow
                  key={item.slug}
                  item={item}
                  maxValue={maxScore}
                  href={item.links?.contextHref}
                  router={router}
                />
              ))
            ) : (
              <p className="dashboard-card-empty">Ainda não há produtos suficientes para montar o ranking.</p>
            )}
          </div>
        </article>
      </section>

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
          <span>Radar de produto</span>
          <strong>{loading ? 'Atualizando...' : `${data.summary?.totalProducts || 0} produtos`}</strong>
        </div>
      </section>

      <section className="product-command-card-grid">
        {rankedItems.map((item) => (
          <article
            key={item.slug}
            className={`product-command-card product-command-card--${item.decision?.tone || 'premium'} admin-actionable-card`}
            {...getProductCardProps(router, item.links?.contextHref || '')}
          >
            <div className="product-command-top">
              <div>
                <span>{item.category}</span>
                <h3>{item.name}</h3>
              </div>
              <b>{item.decision?.scores?.priority || 0}</b>
            </div>

            <p className="product-command-slug">{item.slug}</p>
            <p className="product-command-copy">{item.decision?.headline}</p>

            <div className="product-command-summary-grid">
              <div className="product-command-summary-card">
                <span>Observabilidade</span>
                <strong>{item.decision?.observability?.title}</strong>
                <small>{item.decision?.observability?.summary}</small>
              </div>
              <div className="product-command-summary-card">
                <span>Diagnóstico</span>
                <strong>{item.decision?.diagnosis?.title}</strong>
                <small>{item.decision?.diagnosis?.summary}</small>
              </div>
              <div className="product-command-summary-card">
                <span>Recomendação</span>
                <strong>{item.decision?.recommendation?.priority}</strong>
                <small>{item.decision?.recommendation?.summary}</small>
              </div>
              <div className="product-command-summary-card">
                <span>Execução</span>
                <strong>{item.decision?.automation?.label}</strong>
                <small>{item.decision?.automation?.nextStep}</small>
              </div>
            </div>

            <div className="product-command-metrics">
              <span><b>{formatNumber(item.decision?.scores?.health || 0)}</b> saúde</span>
              <span><b>{formatNumber(item.decision?.scores?.opportunity || 0)}</b> oportunidade</span>
              <span><b>{formatNumber(item.decision?.scores?.urgency || 0)}</b> urgência</span>
            </div>

            <div className="product-command-progress">
              <div
                className={`product-command-progress-bar product-command-progress-bar--${item.decision?.tone || 'premium'}`}
                style={{ width: `${Math.max(Number(item.decision?.scores?.priority || 0), 12)}%` }}
              />
            </div>

            <div className="product-command-foot product-command-foot--actions">
              <small>Último lead: {formatDate(item.lastLeadAt)}</small>
              <div className="product-command-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={(event) => {
                    event.stopPropagation();
                    router.push(item.links?.queueHref || '/admin/leads');
                  }}
                >
                  Abrir fila
                </button>
                <a
                  className="btn btn-ghost"
                  href={item.links?.siteHref || item.siteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(event) => event.stopPropagation()}
                >
                  Abrir no site
                </a>
              </div>
            </div>
          </article>
        ))}

        {!loading && !rankedItems.length ? (
          <div className="admin-card">
            <p>Nenhum produto encontrado para esse filtro.</p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
