'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchAdminJson, primeAdminJsonCache } from '@/lib/admin/client-fetch-cache';
import { buildTaskActionGuide } from '@/lib/admin/task-action-guide';
import { formatPageLabel } from '@/lib/admin/page-presentation';

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
  if (!value) return 'Sem lead recente';
  return new Date(value).toLocaleString('pt-BR');
}

function formatNumber(value) {
  return new Intl.NumberFormat('pt-BR').format(Number(value || 0));
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function buildPageMotion(item) {
  if (item.views >= 80 && item.leads === 0) return 'Corrigir conversão';
  if (item.views >= 50 && item.clickRate < 4) return 'Reforçar CTA';
  if (item.leadRate >= 12 && item.views < 120) return 'Escalar tráfego';
  if (item.views < 25 && item.leads > 0) return 'Ganhar distribuição';
  return 'Ajuste fino';
}

function buildPageTone(item) {
  if (item.views >= 80 && item.leads === 0) return 'danger';
  if (item.leadRate >= 12) return 'success';
  if (item.views >= 50 && item.clickRate < 4) return 'warning';
  return 'premium';
}

function buildPageNarrative(item) {
  const motion = buildPageMotion(item);

  if (motion === 'Corrigir conversão') {
    return 'A página já recebe atenção, mas está deixando lead na mesa.';
  }

  if (motion === 'Reforçar CTA') {
    return 'A leitura indica interesse inicial, mas o clique no CTA principal ainda está tímido.';
  }

  if (motion === 'Escalar tráfego') {
    return 'Já existe resposta comercial suficiente para testar mais distribuição com controle.';
  }

  if (motion === 'Ganhar distribuição') {
    return 'Converte bem no pouco volume que chega. Vale dar mais visibilidade.';
  }

  return 'A página já produz leitura útil e pede otimização incremental, não ruptura.';
}

function buildPageGuide(item) {
  return buildTaskActionGuide({
    id: `page-decision:${item.pagePath}`,
    title: item.decision?.headline || formatPageLabel(item.pagePath),
    description: item.decision?.diagnosis?.summary || '',
    recommendation: item.decision?.recommendation?.summary || item.decision?.automation?.nextStep || '',
    sourceType: 'page-decision',
    sourceLabel: 'Páginas',
    href: item.links?.contextHref,
    productLabel: item.pageType,
    metadata: [item.decision?.automation?.nextStep, item.decision?.recommendation?.impact].filter(Boolean)
  });
}

function buildPageActionText(item, guide) {
  const summary = String(item.decision?.recommendation?.summary || '').trim();

  if (guide.destination === 'Google Ads') {
    return 'Olhar essa pagina no Google Ads e decidir se vale mandar mais trafego para ela agora.';
  }

  if (guide.destination === 'Search Console') {
    return 'Olhar essa pagina no Search Console e decidir se ela merece mais atencao organica agora.';
  }

  if (guide.destination === 'Google Analytics') {
    return 'Conferir no Analytics como as pessoas estao se comportando nessa pagina.';
  }

  if (guide.destination === 'VSCode') {
    return 'Essa pagina pede ajuste manual no site. Leia a recomendacao e, se fizer sentido, implemente no VSCode.';
  }

  return summary || 'Abrir o contexto da pagina e seguir o proximo passo recomendado.';
}

function openPageCard(router, href, external = false) {
  if (!href) return;
  if (external) {
    window.open(href, '_blank', 'noopener,noreferrer');
    return;
  }
  router.push(href);
}

function getPageCardProps(router, href, external = false) {
  if (!href) return {};

  return {
    role: 'link',
    tabIndex: 0,
    onClick: () => openPageCard(router, href, external),
    onKeyDown: (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openPageCard(router, href, external);
      }
    }
  };
}

function PagesMetricCard({ label, value, helper, tone = 'blue', href, router }) {
  return (
    <article className={`ops-metric-card ops-metric-card--${tone} ${href ? 'admin-actionable-card' : ''}`} {...getPageCardProps(router, href)}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </article>
  );
}

function PageActionCard({ title, item, helper, tone = 'blue', href, router, external = false }) {
  return (
    <article className={`ops-action-card ops-action-card--${tone} ${href ? 'admin-actionable-card' : ''}`} {...getPageCardProps(router, href, external)}>
      <span>{title}</span>
      {item ? (
        <>
          <strong>{formatPageLabel(item.pagePath)}</strong>
          <p>{item.decision?.recommendation?.summary || item.decision?.diagnosis?.summary}</p>
          <small>{helper}</small>
        </>
      ) : (
        <>
          <strong>Sem destaque dominante</strong>
          <p>O painel ainda não encontrou uma página com urgência ou escala claramente acima das outras.</p>
          <small>Amplie o recorte ou conecte mais tráfego para aprofundar a leitura.</small>
        </>
      )}
    </article>
  );
}

function PageRankingRow({ item, maxValue, href, router }) {
  const priority = Number(item.decision?.scores?.priority || 0);
  const width = maxValue > 0 ? Math.max(12, (priority / maxValue) * 100) : 12;

  return (
    <div className={`ops-bar-row ${href ? 'admin-actionable-card' : ''}`} {...getPageCardProps(router, href)}>
      <div className="ops-bar-copy">
        <strong>{formatPageLabel(item.pagePath)}</strong>
        <small>{item.decision?.headline} · {item.decision?.automation?.label}</small>
      </div>
      <div className="ops-bar-track">
        <div className={`ops-bar-fill ops-bar-fill--${item.decision?.tone || 'premium'}`} style={{ width: `${width}%` }} />
      </div>
      <b>{priority}</b>
    </div>
  );
}

function PageDecisionCard({ item, router }) {
  const guide = buildPageGuide(item);
  const actionText = buildPageActionText(item, guide);
  const headline = item.decision?.headline || item.pagePath;
  const diagnosis = item.decision?.diagnosis?.summary || buildPageNarrative(item);
  const pageLabel = formatPageLabel(item.pagePath);

  return (
    <article
      className={`product-command-card page-command-card product-command-card--${item.decision?.tone || 'premium'} admin-actionable-card`}
      {...getPageCardProps(router, item.links?.contextHref || '')}
    >
      <div className="product-command-top">
        <div>
          <span>{item.pageType} · {item.pagePath}</span>
          <h3>{pageLabel}</h3>
        </div>
        <b>{item.decision?.scores?.priority || 0}</b>
      </div>

      <p className="product-command-copy">{headline}</p>

      <div className="product-command-summary-grid">
        <div className="product-command-summary-card">
          <span>Como ela esta hoje</span>
          <strong>{formatNumber(item.views)} visitas · {formatNumber(item.leads)} leads</strong>
          <small>{formatPercent(item.leadRate || 0)} de conversao no recorte atual.</small>
        </div>
        <div className="product-command-summary-card">
          <span>Diagnostico</span>
          <strong>{diagnosis}</strong>
          <small>Leitura curta do que esta acontecendo nessa pagina.</small>
        </div>
        <div className="product-command-summary-card">
          <span>O que fazer agora</span>
          <strong>{actionText}</strong>
          <small>{item.decision?.recommendation?.impact || 'Acao principal sugerida para esta pagina.'}</small>
        </div>
        <div className="product-command-summary-card">
          <span>Onde fazer</span>
          <strong>{guide.destination}</strong>
          <small>{guide.helper}</small>
        </div>
      </div>

      <div className="product-command-foot">
        <small>Ultimo lead: {formatDate(item.lastLeadAt)}</small>
        <div className="admin-inline-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={(event) => {
              event.stopPropagation();
              openPageCard(router, item.links?.contextHref || '');
            }}
          >
            Ver pagina
          </button>
          {item.productSlug ? (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={(event) => {
                event.stopPropagation();
                openPageCard(router, item.links?.queueHref || '/admin/leads');
              }}
            >
              Ver leads
            </button>
          ) : null}
          {guide.destinationHref ? (
            <a
              className="btn btn-ghost"
              href={guide.destinationHref}
              target={guide.destinationKind === 'external' ? '_blank' : undefined}
              rel={guide.destinationKind === 'external' ? 'noopener noreferrer' : undefined}
              onClick={(event) => event.stopPropagation()}
            >
              {guide.buttonLabel}
            </a>
          ) : null}
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
  );
}

export default function PagesClient({ apiBase = '/api/admin', initialData = null, initialRange = null }) {
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
      const endpoint = `${apiBase}/pages?${params.toString()}`;
      const isInitialQuery = Boolean(initialData && !query && from === fallbackRange.from && to === fallbackRange.to);

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
          b.views - a.views
      ),
    [data.items]
  );

  const commandCenter = data.commandCenter || {};
  const topPage = commandCenter.topPriority || rankedItems[0] || null;
  const fixCandidate = commandCenter.urgentFix || null;
  const scaleCandidate = commandCenter.scaleCandidate || null;
  const maxScore = rankedItems.reduce(
    (highest, item) => Math.max(highest, Number(item.decision?.scores?.priority || 0)),
    0
  );

  return (
    <div className="page-command-shell">
        <section className="ops-hero ops-hero--pages">
        <div className="ops-hero-main">
          <p className="eyebrow">Páginas</p>
          <h3>
            {topPage
              ? topPage.decision?.headline || `${formatPageLabel(topPage.pagePath)} lidera a leitura de saúde e prontidão`
              : 'A IA está organizando a prioridade das páginas'}
          </h3>
          <p>
            Aqui voce olha as paginas do site como unidade principal de trabalho: como cada uma esta hoje, qual e o problema ou oportunidade e onde agir agora.
          </p>

        <div className="ops-chip-row">
            <span className="ops-chip ops-chip--premium">{commandCenter.mission || 'Aguardando sinais fortes de página'}</span>
            <span className="ops-chip ops-chip--success">Automático seguro: {formatNumber(commandCenter.autoSafeCount || 0)}</span>
            <span className="ops-chip ops-chip--warning">Pedem sua decisão: {formatNumber(commandCenter.approvalCount || 0)}</span>
        </div>
        {!topPage ? (
          <div className="ops-hero-status">
            <h4>IA em análise contínua</h4>
            <p>
              A camada de observabilidade já coletou visitas, leads e sinais comportamentais. Agora a IA está traduzindo:
              diagnosticar o que acontece, recomendar o que fazer, apontar os próximos passos de execução.
            </p>
            <p>
              Assim que aparecer uma decisão clara, o card principal abre automaticamente o próximo fluxo de atuação.
            </p>
          </div>
        ) : null}
      </div>

        <aside
          className={`ops-focus-card ${topPage ? 'admin-actionable-card' : ''}`}
          {...getPageCardProps(router, topPage?.links?.contextHref || '')}
        >
          <span>Leitura principal</span>
          <strong>{topPage?.decision?.recommendation?.priority || 'Sem destaque dominante'}</strong>
          <p>{topPage?.decision?.recommendation?.summary || 'Assim que mais sinais entrarem, essa área aponta a página mais promissora ou mais urgente do período.'}</p>
          <div className="ops-focus-meta">
            <div>
              <small>Saúde</small>
              <b>{formatNumber(topPage?.decision?.scores?.health || 0)}</b>
            </div>
            <div>
              <small>Oportunidade</small>
              <b>{formatNumber(topPage?.decision?.scores?.opportunity || 0)}</b>
            </div>
            <div>
              <small>Urgência</small>
              <b>{formatNumber(topPage?.decision?.scores?.urgency || 0)}</b>
            </div>
          </div>
        </aside>
      </section>

      <section className="ops-metric-grid">
        <PagesMetricCard
          label="Paginas no radar"
          value={formatNumber(rankedItems.length)}
          helper="Paginas com leitura suficiente para decidir o proximo passo"
          tone="blue"
          href="/admin/paginas"
          router={router}
        />
        <PagesMetricCard
          label="Precisam de atencao"
          value={formatNumber(commandCenter.autoSafeCount || 0)}
          helper="Paginas que pedem ajuste ou acompanhamento mais de perto"
          tone="warning"
          href={fixCandidate?.links?.contextHref || '/admin/paginas'}
          router={router}
        />
        <PagesMetricCard
          label="Pedem sua decisão"
          value={formatNumber(commandCenter.approvalCount || 0)}
          helper="Paginas que valem sua caneta antes de mexer em trafego, verba ou prioridade"
          tone="success"
          href={scaleCandidate?.links?.contextHref || '/admin/paginas'}
          router={router}
        />
        <PagesMetricCard
          label="Base tranquila"
          value={formatNumber(commandCenter.healthyCount || 0)}
          helper="Paginas que estao bem e nao precisam roubar sua atencao agora"
          tone="premium"
          href="/admin/paginas"
          router={router}
        />
      </section>

      <section className="ops-grid">
        <article className="ops-panel">
          <div className="ops-panel-head">
            <div>
              <span>Decisão prática</span>
              <h3>Por onde comecar nas paginas</h3>
            </div>
          </div>
          <div className="ops-action-grid">
            <PageActionCard
              title="Corrigir conversão"
              item={fixCandidate}
              helper={fixCandidate ? fixCandidate.decision?.diagnosis?.summary : 'Nenhuma pagina esta claramente queimando atencao agora.'}
              tone="danger"
              href={fixCandidate?.links?.contextHref || '/admin/paginas'}
              router={router}
            />
            <PageActionCard
              title="Escalar página"
              item={scaleCandidate}
              helper={scaleCandidate ? scaleCandidate.decision?.automation?.summary : 'Ainda nao ha uma pagina claramente pronta para escala.'}
              tone="success"
              href={scaleCandidate?.links?.contextHref || '/admin/paginas'}
              router={router}
            />
            <PageActionCard
              title="Abrir no site"
              item={topPage}
              helper={topPage ? topPage.decision?.recommendation?.impact : 'Assim que surgir uma pagina dominante, esse acesso fica direto.'}
              tone="premium"
              href={topPage?.links?.siteHref || '/'}
              router={router}
              external
            />
          </div>
        </article>

        <article className="ops-panel ops-panel--soft">
          <div className="ops-panel-head">
            <div>
              <span>Ranking visual</span>
              <h3>Paginas em ordem de prioridade</h3>
            </div>
          </div>
          <div className="ops-bar-list">
            {rankedItems.length ? (
              rankedItems.map((item) => (
                <PageRankingRow
                  key={item.pagePath}
                  item={item}
                  maxValue={maxScore}
                  href={item.links?.contextHref}
                  router={router}
                />
              ))
            ) : (
              <p className="dashboard-card-empty">Ainda não há páginas suficientes para montar o ranking.</p>
            )}
          </div>
        </article>
      </section>

      <section className="admin-toolbar admin-filters">
        <label>
          De
          <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        </label>
        <label>
          Até
          <input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        </label>
        <label>
          Página
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="/produtos/seguro-celular" />
        </label>
        <div className="admin-toolbar-note">
          <span>Radar de paginas</span>
          <strong>{loading ? 'Atualizando...' : `${data.summary?.totalPages || 0} paginas`}</strong>
        </div>
      </section>

      <section className="product-command-card-grid page-command-card-grid">
        {rankedItems.map((item) => (
          <PageDecisionCard key={item.pagePath} item={item} router={router} />
        ))}

        {!loading && !rankedItems.length ? (
          <div className="admin-card">
            <p>Nenhuma página encontrada para esse filtro.</p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
