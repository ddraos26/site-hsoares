'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchAdminJson, primeAdminJsonCache } from '@/lib/admin/client-fetch-cache';
import { MiniSignalRail } from '@/components/admin/lightweight-charts';

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

function formatNumber(value) {
  return new Intl.NumberFormat('pt-BR').format(Number(value || 0));
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(value || 0));
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function formatDate(value) {
  if (!value) return 'Sem snapshot';
  const parsed = String(value).includes('T') ? new Date(value) : new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return 'Sem snapshot';
  return parsed.toLocaleDateString('pt-BR');
}

function formatPlacementLabel(value) {
  return (
    {
      'hero-primary': 'Hero principal',
      'hero-support': 'Hero apoio no WhatsApp',
      'closing-band': 'Faixa final oficial',
      'closing-support': 'Faixa final de apoio',
      'conversion-box': 'Box de conversão',
      'proof-source': 'Fonte oficial Porto',
      'sem-marcacao': 'Sem marcação'
    }[String(value || '').trim().toLowerCase()] || value || 'Sem marcação'
  );
}

function buildHeroTitle(summary, bestCampaign, fixCandidate) {
  if (fixCandidate) {
    return `${fixCandidate.name} pede revisão antes de receber mais verba`;
  }

  if (bestCampaign?.conversions > 0) {
    return `${bestCampaign.name} lidera a leitura comercial das campanhas`;
  }

  if ((summary?.totalCampaigns || 0) > 0 && (summary?.totalSpend || 0) === 0) {
    return 'Conta conectada. Agora o foco é transformar estrutura em tração real';
  }

  return 'Campanhas no radar para decidir onde escalar, revisar ou segurar verba';
}

function buildHeroNarrative(summary, bestCampaign, fixCandidate) {
  if (fixCandidate) {
    return 'Já existe um ponto claro de atenção na mídia. O painel está priorizando preservar verba e corrigir a campanha antes de aumentar distribuição.';
  }

  if (bestCampaign?.conversions > 0) {
    return 'A camada de mídia já devolve conversão. O próximo passo é cruzar custo, lead real e qualidade comercial para decidir escala com segurança.';
  }

  if ((summary?.totalCampaigns || 0) > 0 && (summary?.totalSpend || 0) === 0) {
    return 'O Google Ads já está dentro do admin e a conta está pronta. Agora vale organizar naming, tracking e landing para começar com aprendizado limpo.';
  }

  return 'Essa tela agora cruza Google Ads, sinais do site e recomendação prática para você saber rapidamente o que ativar, o que revisar e onde ainda falta tracking.';
}

function openCampaignCard(router, href) {
  if (!href) return;
  router.push(href);
}

function getCampaignCardProps(router, href) {
  if (!href) return {};

  return {
    role: 'link',
    tabIndex: 0,
    onClick: () => openCampaignCard(router, href),
    onKeyDown: (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openCampaignCard(router, href);
      }
    }
  };
}

function CampaignMetricCard({ label, value, helper, tone = 'blue', href, router }) {
  return (
    <article className={`ops-metric-card ops-metric-card--${tone} ${href ? 'admin-actionable-card' : ''}`} {...getCampaignCardProps(router, href)}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </article>
  );
}

function CampaignActionCard({ title, headline, body, helper, tone = 'blue', href, router }) {
  return (
    <article className={`campaign-action-card campaign-action-card--${tone} ${href ? 'admin-actionable-card' : ''}`} {...getCampaignCardProps(router, href)}>
      <div className="campaign-action-main">
        <span>{title}</span>
        <strong>{headline}</strong>
        <p>{body}</p>
      </div>
      <small>{helper}</small>
    </article>
  );
}

function CampaignRankingRow({ item, maxValue, href, router }) {
  const width = maxValue > 0 ? Math.max(12, (item.score / maxValue) * 100) : 12;

  return (
    <div className={`ops-bar-row ${href ? 'admin-actionable-card' : ''}`} {...getCampaignCardProps(router, href)}>
      <div className="ops-bar-copy">
        <strong>{item.name}</strong>
        <small>
          {item.motion} · CTR {formatPercent(item.ctr)} ·{' '}
          {item.conversions > 0 ? `CPA ${formatCurrency(item.cpa)}` : 'sem conversão'}
        </small>
      </div>
      <div className="ops-bar-track">
        <div className={`ops-bar-fill ops-bar-fill--${item.tone}`} style={{ width: `${width}%` }} />
      </div>
      <b>{item.score}</b>
    </div>
  );
}

function TrackingSignalRow({ item }) {
  const leadRateWidth = Math.max(10, Math.min(100, Number(item.leadRate || 0) * 2.5));

  return (
    <div className="campaign-tracking-row">
      <div className="campaign-tracking-copy">
        <strong>{item.label}</strong>
        <small>
          {formatNumber(item.views)} visitas · {formatNumber(item.clicks)} cliques · {formatNumber(item.leads)} leads
        </small>
      </div>
      <div className="campaign-tracking-bar">
        <div className="campaign-tracking-bar-fill" style={{ width: `${leadRateWidth}%` }} />
      </div>
      <b>{formatPercent(item.leadRate)}</b>
    </div>
  );
}

function TrafficBucketRow({ item }) {
  const clickRateWidth = Math.max(10, Math.min(100, Number(item.officialClickRate || 0) * 6));

  return (
    <div className="campaign-tracking-row">
      <div className="campaign-tracking-copy">
        <strong>{item.label}</strong>
        <small>
          {formatNumber(item.views)} visitas · {formatNumber(item.officialClicks)} cliques Porto · {formatNumber(item.supportClicks)} apoios
        </small>
      </div>
      <div className="campaign-tracking-bar">
        <div className="campaign-tracking-bar-fill" style={{ width: `${clickRateWidth}%` }} />
      </div>
      <b>{formatPercent(item.officialClickRate)}</b>
    </div>
  );
}

function PlacementSignalRow({ item }) {
  const width = Math.max(10, Math.min(100, Number(item.totalClicks || 0) * 14));

  return (
    <div className="campaign-tracking-row">
      <div className="campaign-tracking-copy">
        <strong>{formatPlacementLabel(item.placement)}</strong>
        <small>
          {formatNumber(item.officialClicks)} cliques Porto · {formatNumber(item.supportClicks)} cliques de apoio
        </small>
      </div>
      <div className="campaign-tracking-bar">
        <div className="campaign-tracking-bar-fill" style={{ width: `${width}%` }} />
      </div>
      <b>{formatNumber(item.totalClicks)}</b>
    </div>
  );
}

function StatusChip({ status, label }) {
  const normalized = String(status || '').toLowerCase();
  const tone =
    normalized === 'enabled'
      ? 'success'
      : normalized === 'paused'
        ? 'warning'
        : normalized === 'removed'
          ? 'danger'
          : 'premium';

  return <span className={`campaign-status-chip campaign-status-chip--${tone}`}>{label}</span>;
}

export default function CampaignsClient({ apiBase = '/api/admin', initialData = null, initialRange = null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fallbackRange = useMemo(() => initialRange || defaultRange(), [initialRange]);
  const initialFilters = useMemo(() => getUrlFilterState(searchParams, fallbackRange), [searchParams, fallbackRange]);
  const [from, setFrom] = useState(initialFilters.from);
  const [to, setTo] = useState(initialFilters.to);
  const [query, setQuery] = useState(initialFilters.query);
  const [data, setData] = useState(
    initialData || {
      summary: {},
      focus: {},
      items: [],
      tracking: { summary: {}, items: [] },
      trafficQuality: { summary: {}, items: [], placements: [] },
      account: {}
    }
  );
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
      const endpoint = `${apiBase}/campaigns?${params.toString()}`;
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

  const rankedItems = useMemo(() => data.items || [], [data.items]);
  const topCampaign = data.focus?.bestCampaign || rankedItems[0] || null;
  const fixCandidate = data.focus?.fixCandidate || null;
  const launchCandidate = data.focus?.launchCandidate || rankedItems.find((item) => item.status === 'PAUSED') || null;
  const trackingCandidate = data.focus?.trackingCandidate || data.tracking?.items?.[0] || null;
  const trafficQuality = data.trafficQuality || { summary: {}, items: [], placements: [] };
  const trafficSummary = trafficQuality.summary || {};
  const maxScore = rankedItems.reduce((highest, item) => Math.max(highest, item.score || 0), 0);
  const heroTitle = buildHeroTitle(data.summary, topCampaign, fixCandidate);
  const heroNarrative = buildHeroNarrative(data.summary, topCampaign, fixCandidate);

  return (
    <div className="campaign-command-shell">
      <section className="ops-hero ops-hero--campaigns">
        <div className="ops-hero-main">
          <p className="eyebrow">Campanhas e mídia</p>
          <h3>{heroTitle}</h3>
          <p>{heroNarrative}</p>

          <div className="ops-chip-row">
            <span className="ops-chip ops-chip--success">
              Google Ads {rankedItems.length ? 'conectado' : 'pronto para receber campanhas'}
            </span>
            <span className="ops-chip ops-chip--warning">
              Investimento monitorado: {formatCurrency(data.summary?.totalSpend || 0)}
            </span>
            <span className="ops-chip ops-chip--premium">
              Leads no site: {formatNumber(data.summary?.trackedSiteLeads || 0)}
            </span>
            <span className="ops-chip">
              Conta: {data.account?.customerId || 'aguardando customer ID'}
            </span>
          </div>
        </div>

        <aside
          className={`ops-focus-card ${(topCampaign || launchCandidate) ? 'admin-actionable-card' : ''}`}
          {...getCampaignCardProps(router, topCampaign ? `/dashboard/campaigns/${topCampaign.id}` : launchCandidate ? `/dashboard/campaigns/${launchCandidate.id}` : '')}
        >
          <span>Melhor decisão do período</span>
          <strong>
            {fixCandidate
              ? 'Preservar verba e corrigir'
              : topCampaign?.conversions > 0
                ? 'Escalar com controle'
                : launchCandidate
                  ? 'Ativar com cautela'
                  : 'Monitorar sinais iniciais'}
          </strong>
          <p>
            {fixCandidate?.recommendation ||
              topCampaign?.recommendation ||
              launchCandidate?.recommendation ||
              'A camada de mídia já está no painel. Assim que mais sinais entrarem, a recomendação passa a ficar mais agressiva.'}
          </p>
          <div className="ops-focus-meta">
            <div>
              <small>Campanhas</small>
              <b>{formatNumber(data.summary?.totalCampaigns || 0)}</b>
            </div>
            <div>
              <small>Cliques</small>
              <b>{formatNumber(data.summary?.totalClicks || 0)}</b>
            </div>
            <div>
              <small>Conversões</small>
              <b>{formatNumber(data.summary?.totalConversions || 0)}</b>
            </div>
          </div>
          <MiniSignalRail
            tone={fixCandidate ? 'danger' : topCampaign?.conversions > 0 ? 'success' : 'premium'}
            items={[
              { label: 'Imp', value: data.summary?.totalImpressions || 0 },
              { label: 'Cliques', value: data.summary?.totalClicks || 0 },
              { label: 'Conv', value: data.summary?.totalConversions || 0 }
            ]}
          />
        </aside>
      </section>

      <section className="ops-metric-grid">
        <CampaignMetricCard
          label="Campanhas em radar"
          value={formatNumber(data.summary?.totalCampaigns || 0)}
          helper={`${formatNumber(data.summary?.pausedCampaigns || 0)} pausadas · ${formatNumber(data.summary?.activeCampaigns || 0)} ativas`}
          tone="blue"
          href="/dashboard/campaigns"
          router={router}
          chartItems={[
            { label: 'Total', value: data.summary?.totalCampaigns || 0 },
            { label: 'Ativas', value: data.summary?.activeCampaigns || 0 },
            { label: 'Paus', value: data.summary?.pausedCampaigns || 0 }
          ]}
        />
        <CampaignMetricCard
          label="Investimento"
          value={formatCurrency(data.summary?.totalSpend || 0)}
          helper={`CPC médio ${formatCurrency(data.summary?.averageCpc || 0)}`}
          tone="warning"
          href="/dashboard/campaigns"
          router={router}
          chartItems={[
            { label: 'Spend', value: data.summary?.totalSpend || 0 },
            { label: 'Cliq', value: data.summary?.totalClicks || 0 },
            { label: 'Conv', value: data.summary?.totalConversions || 0 }
          ]}
        />
        <CampaignMetricCard
          label="CTR médio"
          value={formatPercent(data.summary?.averageCtr || 0)}
          helper={`${formatNumber(data.summary?.totalImpressions || 0)} impressões · ${formatNumber(data.summary?.totalClicks || 0)} cliques`}
          tone="premium"
          href="/dashboard/analytics"
          router={router}
          chartItems={[
            { label: 'Imp', value: data.summary?.totalImpressions || 0 },
            { label: 'Cliq', value: data.summary?.totalClicks || 0 },
            { label: 'CTR', value: data.summary?.averageCtr || 0 }
          ]}
        />
        <CampaignMetricCard
          label="Conversões"
          value={formatNumber(data.summary?.totalConversions || 0)}
          helper={`${formatNumber(data.summary?.trackedSiteLeads || 0)} leads rastreados no site`}
          tone="danger"
          href="/admin/leads"
          router={router}
          chartItems={[
            { label: 'Conv', value: data.summary?.totalConversions || 0 },
            { label: 'Leads', value: data.summary?.trackedSiteLeads || 0 },
            { label: 'GAds', value: data.summary?.trackedGoogleCampaigns || 0 }
          ]}
        />
      </section>

      <section className="campaign-top-grid">
        <article className="ops-panel">
          <div className="ops-panel-head">
            <div>
              <span>Decisão prática</span>
              <h3>O que fazer agora com a mídia</h3>
            </div>
          </div>
          <div className="campaign-action-stack">
            <CampaignActionCard
              title="Escalar com critério"
              headline={topCampaign?.conversions > 0 ? topCampaign.name : launchCandidate?.name || 'Sem campanha pronta para escalar'}
              body={
                topCampaign?.conversions > 0
                  ? topCampaign.narrative
                  : launchCandidate?.narrative || 'Ainda não existe campanha com conversão suficiente para aumentar verba com segurança.'
              }
              helper={
                topCampaign?.conversions > 0
                  ? 'Cruze CPA com lead real antes de subir orçamento.'
                  : 'Use a próxima ativação com tracking e landing já alinhados.'
              }
              tone="success"
              href="/dashboard/campaigns"
              router={router}
            />
            <CampaignActionCard
              title="Corrigir antes de comprar"
              headline={fixCandidate?.name || 'Nenhuma campanha queimando verba agora'}
              body={
                fixCandidate?.narrative ||
                'Neste recorte ainda não apareceu uma campanha claramente desperdiçando investimento.'
              }
              helper={
                fixCandidate
                  ? 'Revise criativo, segmentação e página de destino.'
                  : 'Mantenha o radar ligado para o primeiro sinal de ineficiência.'
              }
              tone="danger"
              href="/dashboard/campaigns"
              router={router}
            />
            <CampaignActionCard
              title="Alinhar tracking"
              headline={trackingCandidate?.label || 'Organizar UTMs da nova conta'}
              body={
                trackingCandidate
                  ? 'O site já tem tráfego nessa frente, mas a captura ainda não acompanha o volume que está entrando.'
                  : 'A nova conta já conectou. O próximo ganho é padronizar naming, UTM e páginas para que Ads e site conversem melhor.'
              }
              helper={
                trackingCandidate
                  ? 'Boa frente para revisar CTA, prova de valor e atribuição.'
                  : 'Sem isso, o admin lê mídia e site em blocos separados.'
              }
              tone="premium"
              href={trackingCandidate ? '/admin/leads' : '/dashboard/analytics'}
              router={router}
            />
          </div>
        </article>

        <article className="ops-panel ops-panel--soft campaign-score-panel">
          <div className="ops-panel-head">
            <div>
              <span>Ranking visual</span>
              <h3>Score de eficiência e prontidão</h3>
            </div>
          </div>
          <div className="ops-bar-list">
            {rankedItems.length ? (
              rankedItems.map((item) => (
                <CampaignRankingRow key={item.id} item={item} maxValue={maxScore} href={`/dashboard/campaigns/${item.id}`} router={router} />
              ))
            ) : (
              <p className="dashboard-card-empty">Assim que campanhas forem sincronizadas, o ranking aparece aqui.</p>
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
          Campanha
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="nome, status, produto ou UTM" />
        </label>
        <div className="admin-toolbar-note">
          <span>Radar de mídia</span>
          <strong>{loading ? 'Atualizando...' : `${data.summary?.totalCampaigns || 0} campanhas`}</strong>
        </div>
      </section>

      <section className="campaign-layout-grid">
        <article className="ops-panel">
          <div className="ops-panel-head">
            <div>
              <span>Campanhas do Google Ads</span>
              <h3>Leitura operacional de verba, clique e conversão</h3>
            </div>
          </div>

          <div className="campaign-command-card-grid">
            {rankedItems.length ? (
              rankedItems.map((item) => (
                <article
                  key={item.id}
                  className={`campaign-command-card campaign-command-card--${item.tone} admin-actionable-card`}
                  {...getCampaignCardProps(router, `/dashboard/campaigns/${item.id}`)}
                >
                  <div className="campaign-command-top">
                    <div>
                      <span>{item.productName || 'Google Ads'}</span>
                      <h3>{item.name}</h3>
                    </div>
                    <div className="campaign-command-top-right">
                      <StatusChip status={item.status} label={item.statusLabel} />
                      <b>{item.score}</b>
                    </div>
                  </div>

                  <p className="campaign-command-copy">{item.narrative}</p>

                  <div className="campaign-command-metrics">
                    <span><b>{formatCurrency(item.cost)}</b> investimento</span>
                    <span><b>{formatNumber(item.impressions)}</b> impressões</span>
                    <span><b>{formatNumber(item.clicks)}</b> cliques</span>
                    <span><b>{formatPercent(item.ctr)}</b> CTR</span>
                    <span><b>{formatNumber(item.conversions)}</b> conversões</span>
                    <span><b>{item.conversions > 0 ? formatCurrency(item.cpa) : 'sem CPA'}</b></span>
                  </div>

                  <div className="campaign-command-progress">
                    <div className={`campaign-command-progress-bar campaign-command-progress-bar--${item.tone}`} style={{ width: `${Math.max(item.score, 12)}%` }} />
                  </div>

                  <MiniSignalRail
                    tone={item.tone}
                    items={[
                      { label: 'Imp', value: item.impressions },
                      { label: 'Cliques', value: item.clicks },
                      { label: 'Conv', value: item.conversions }
                    ]}
                  />

                  <div className="campaign-command-recommendation">
                    <small>Recomendação</small>
                    <p>{item.recommendation}</p>
                  </div>

                  <div className="campaign-command-foot">
                    <small>Último snapshot: {formatDate(item.lastSnapshotDate)}</small>
                    <span>{item.trackingLabel || 'Sem match claro com UTM no site'}</span>
                  </div>
                </article>
              ))
            ) : (
              <div className="campaign-empty-state">
                <strong>Nenhuma campanha sincronizada ainda</strong>
                <p>
                  A conta do Google Ads já está conectada. Assim que o painel captar campanhas com snapshot, esta área vira o centro de leitura de verba e eficiência.
                </p>
              </div>
            )}
          </div>
        </article>

        <aside className="ops-panel ops-panel--soft">
          <div className="ops-panel-head">
            <div>
              <span>Captação do site</span>
              <h3>UTMs e sinais comerciais que já chegaram</h3>
            </div>
          </div>

          <div className="ops-inline-grid">
            <article className="ops-inline-card">
              <span>Conta anunciante</span>
              <div className="ops-inline-row">
                <strong>{data.account?.customerId || 'Sem customer ID'}</strong>
                <small>Google Ads</small>
              </div>
              <div className="ops-inline-row">
                <strong>{data.account?.loginCustomerId || 'Sem MCC'}</strong>
                <small>Conta gerente</small>
              </div>
            </article>

            <article className="ops-inline-card">
              <span>Tracking do site</span>
              <div className="ops-inline-row">
                <strong>{formatNumber(data.tracking?.summary?.totalCampaigns || 0)}</strong>
                <small>frentes com UTM</small>
              </div>
              <div className="ops-inline-row">
                <strong>{formatNumber(data.tracking?.summary?.totalLeads || 0)}</strong>
                <small>leads captados</small>
              </div>
            </article>

            <article className="ops-inline-card">
              <span>Leitura do tráfego</span>
              <div className="ops-inline-row">
                <strong>{formatNumber(trafficSummary.paidViews || 0)}</strong>
                <small>visitas pagas</small>
              </div>
              <div className="ops-inline-row">
                <strong>{formatPercent(trafficSummary.officialClickRate || 0)}</strong>
                <small>taxa para clique oficial</small>
              </div>
            </article>

            <article className="ops-inline-card">
              <span>Rota principal x apoio</span>
              <div className="ops-inline-row">
                <strong>{formatNumber(trafficSummary.totalOfficialClicks || 0)}</strong>
                <small>cliques Porto</small>
              </div>
              <div className="ops-inline-row">
                <strong>{formatNumber(trafficSummary.totalSupportClicks || 0)}</strong>
                <small>cliques de apoio</small>
              </div>
            </article>
          </div>

          <p className="campaign-command-copy">
            {trafficSummary.narrative ||
              'Assim que o site acumular visitas e cliques suficientes, esta área mostra se o tráfego pago chega limpo e se a rota principal está dominando o apoio.'}
          </p>

          <div className="campaign-tracking-list">
            {(data.tracking?.items || []).length ? (
              data.tracking.items.map((item) => <TrackingSignalRow key={item.label} item={item} />)
            ) : (
              <p className="dashboard-card-empty">Ainda não há UTMs suficientes para montar a leitura de captação do site.</p>
            )}
          </div>

          <div className="ops-panel-head">
            <div>
              <span>Qualidade do tráfego</span>
              <h3>Pago, orgânico/referral e direto sem misturar tudo</h3>
            </div>
          </div>

          <div className="campaign-tracking-list">
            {(trafficQuality.items || []).length ? (
              trafficQuality.items.map((item) => <TrafficBucketRow key={item.bucket} item={item} />)
            ) : (
              <p className="dashboard-card-empty">Ainda não há volume suficiente para separar o tráfego por bucket com segurança.</p>
            )}
          </div>

          <div className="ops-panel-head">
            <div>
              <span>Posição do CTA</span>
              <h3>Onde o clique oficial e o apoio estão acontecendo</h3>
            </div>
          </div>

          <div className="campaign-tracking-list">
            {(trafficQuality.placements || []).length ? (
              trafficQuality.placements.map((item) => <PlacementSignalRow key={item.placement} item={item} />)
            ) : (
              <p className="dashboard-card-empty">Assim que os CTAs rastreados acumularem uso, as posições com mais clique aparecem aqui.</p>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}
