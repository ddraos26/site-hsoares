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

function formatDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatStatus(status) {
  return (
    {
      novo: 'Novo',
      em_contato: 'Em contato',
      ganho: 'Ganho',
      perdido: 'Perdido'
    }[status] || status
  );
}

function summarizeStatuses(rows) {
  const counts = {
    novo: 0,
    em_contato: 0,
    ganho: 0,
    perdido: 0
  };

  (rows || []).forEach((row) => {
    counts[row.lead_status] = row.total;
  });

  return counts;
}

function maxByTotal(rows) {
  return Math.max(1, ...(rows || []).map((row) => row.total || 0));
}

const DEFAULT_GOALS = {
  daily: 5,
  weekly: 25
};

export default function DashboardClient() {
  const defaults = useMemo(() => dateRange(), []);
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const [product, setProduct] = useState('');
  const [owner, setOwner] = useState('');
  const [dailyGoal, setDailyGoal] = useState(DEFAULT_GOALS.daily);
  const [weeklyGoal, setWeeklyGoal] = useState(DEFAULT_GOALS.weekly);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const statusCounts = useMemo(() => summarizeStatuses(data?.leadStatusSummary), [data]);
  const lossReasonMax = useMemo(() => maxByTotal(data?.lossReasons), [data]);
  const dailyProgress = Math.min(100, Math.round(((data?.summary?.todayLeads || 0) / Math.max(1, dailyGoal)) * 100));
  const weeklyProgress = Math.min(100, Math.round(((data?.summary?.weekLeads || 0) / Math.max(1, weeklyGoal)) * 100));

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('hsoares-admin-goals');
      if (!stored) return;
      const parsed = JSON.parse(stored);
      if (parsed.daily) setDailyGoal(Number(parsed.daily));
      if (parsed.weekly) setWeeklyGoal(Number(parsed.weekly));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        'hsoares-admin-goals',
        JSON.stringify({ daily: dailyGoal, weekly: weeklyGoal })
      );
    } catch {}
  }, [dailyGoal, weeklyGoal]);

  useEffect(() => {
    const controller = new AbortController();
    let interval;

    async function load() {
      setLoading(true);
      const params = new URLSearchParams({ from, to });
      if (product) params.set('product', product);
      if (owner) params.set('owner', owner);
      const response = await fetch(`/api/admin/dashboard?${params.toString()}`, { signal: controller.signal });
      const payload = await response.json();
      setData(payload);
      setLoading(false);
    }

    load().catch(() => setLoading(false));
    interval = window.setInterval(() => {
      load().catch(() => null);
    }, 20000);

    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, [from, to, product, owner]);

  if (loading && !data) {
    return <p>Carregando métricas...</p>;
  }

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
          <input
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            placeholder="slug do produto"
          />
        </label>
        <label>
          Responsável
          <input
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            placeholder="Ex.: Rodolfo"
          />
        </label>
        <div className="admin-toolbar-note">
          <span>Atualização automática</span>
          <strong>{product || owner ? 'Painel filtrado' : 'A cada 20 segundos'}</strong>
        </div>
      </section>

      <div className="kpi-grid kpi-grid--admin">
        <article className="kpi-card">
          <p>Online agora</p>
          <strong>{data?.summary?.onlineUsers || 0}</strong>
          <small>Últimos {data?.summary?.activeWindowMinutes || 3} min</small>
        </article>
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
        <article className="kpi-card kpi-card--em-contato">
          <p>Retornos pendentes</p>
          <strong>{data?.summary?.overdueFollowUps || 0}</strong>
        </article>
        <article className="kpi-card kpi-card--novo">
          <p>Próximos retornos</p>
          <strong>{data?.summary?.upcomingFollowUps || 0}</strong>
        </article>
      </div>

      <div className="kpi-grid kpi-grid--compact">
        <article className="kpi-card kpi-card--novo">
          <span>Leads novos</span>
          <strong>{statusCounts.novo}</strong>
        </article>
        <article className="kpi-card kpi-card--em-contato">
          <span>Em contato</span>
          <strong>{statusCounts.em_contato}</strong>
        </article>
        <article className="kpi-card kpi-card--ganho">
          <span>Ganhos</span>
          <strong>{statusCounts.ganho}</strong>
        </article>
        <article className="kpi-card kpi-card--perdido">
          <span>Perdidos</span>
          <strong>{statusCounts.perdido}</strong>
        </article>
      </div>

      <div className="admin-panel-grid admin-panel-grid--wide">
        <section className="admin-card admin-goals-card">
          <div className="admin-card-head">
            <h2>Metas comerciais</h2>
            <span>Hoje e últimos 7 dias</span>
          </div>
          <div className="admin-goals-grid">
            <article className="admin-goal-block">
              <div className="admin-goal-head">
                <strong>Meta diária de leads</strong>
                <input
                  type="number"
                  min="1"
                  value={dailyGoal}
                  onChange={(e) => setDailyGoal(Math.max(1, Number(e.target.value || 1)))}
                />
              </div>
              <div className="admin-goal-progress-shell" aria-hidden="true">
                <div className="admin-goal-progress admin-goal-progress--daily" style={{ width: `${Math.max(8, dailyProgress)}%` }} />
              </div>
              <div className="admin-goal-foot">
                <span>{data?.summary?.todayLeads || 0} leads hoje</span>
                <b>{dailyProgress}%</b>
              </div>
            </article>

            <article className="admin-goal-block">
              <div className="admin-goal-head">
                <strong>Meta semanal de leads</strong>
                <input
                  type="number"
                  min="1"
                  value={weeklyGoal}
                  onChange={(e) => setWeeklyGoal(Math.max(1, Number(e.target.value || 1)))}
                />
              </div>
              <div className="admin-goal-progress-shell" aria-hidden="true">
                <div className="admin-goal-progress admin-goal-progress--weekly" style={{ width: `${Math.max(8, weeklyProgress)}%` }} />
              </div>
              <div className="admin-goal-foot">
                <span>{data?.summary?.weekLeads || 0} leads nos últimos 7 dias</span>
                <b>{weeklyProgress}%</b>
              </div>
            </article>
          </div>
        </section>
      </div>

      <div className="admin-panel-grid">
        <section className="admin-card admin-list-card">
          <div className="admin-card-head">
            <h2>Páginas mais acessadas</h2>
            <span>Tráfego bruto</span>
          </div>
          <ul>
            {(data?.topPages || []).map((item) => (
              <li key={item.page_path}>
                <span>{item.page_path}</span>
                <strong>{item.views}</strong>
              </li>
            ))}
          </ul>
        </section>

        <section className="admin-card admin-list-card">
          <div className="admin-card-head">
            <h2>Produtos com mais cliques</h2>
            <span>Saída para contratação</span>
          </div>
          <ul>
            {(data?.topProducts || []).map((item) => (
              <li key={item.product_slug || 'na'}>
                <span>{item.product_slug || 'sem produto'}</span>
                <strong>{item.clicks}</strong>
              </li>
            ))}
          </ul>
        </section>

        <section className="admin-card admin-list-card">
          <div className="admin-card-head">
            <h2>Taxa de clique por página</h2>
            <span>Eficiência de conversão</span>
          </div>
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

      <div className="admin-panel-grid">
        <section className="admin-card admin-list-card">
          <div className="admin-card-head">
            <h2>Leads sem responsável</h2>
            <span>Distribuição comercial pendente</span>
          </div>
          <ul>
            {(data?.unassignedLeads || []).map((item) => (
              <li key={item.id}>
                <span>
                  <b>{item.nome || 'Lead sem nome'}</b>
                  <small>{item.product_slug || 'sem produto'}</small>
                </span>
                <strong>{formatDateTime(item.created_at)}</strong>
              </li>
            ))}
            {!data?.unassignedLeads?.length ? <li><span>Sem leads sem responsável.</span><strong>OK</strong></li> : null}
          </ul>
        </section>

        <section className="admin-card admin-list-card">
          <div className="admin-card-head">
            <h2>Novos sem retorno</h2>
            <span>Mais de 12h sem avanço</span>
          </div>
          <ul>
            {(data?.staleNewLeads || []).map((item) => (
              <li key={item.id}>
                <span>
                  <b>{item.nome || 'Lead sem nome'}</b>
                  <small>{item.product_slug || 'sem produto'}</small>
                </span>
                <strong>{formatDateTime(item.updated_at)}</strong>
              </li>
            ))}
            {!data?.staleNewLeads?.length ? <li><span>Nenhum lead novo parado.</span><strong>OK</strong></li> : null}
          </ul>
        </section>

        <section className="admin-card admin-list-card">
          <div className="admin-card-head">
            <h2>Alertas rápidos</h2>
            <span>Leitura executiva</span>
          </div>
          <ul>
            <li>
              <span>Leads sem responsável</span>
              <strong>{data?.summary?.unassignedLeads || 0}</strong>
            </li>
            <li>
              <span>Novos sem retorno</span>
              <strong>{data?.summary?.staleNewLeads || 0}</strong>
            </li>
            <li>
              <span>Retornos pendentes</span>
              <strong>{data?.summary?.overdueFollowUps || 0}</strong>
            </li>
            <li>
              <span>Próximos retornos</span>
              <strong>{data?.summary?.upcomingFollowUps || 0}</strong>
            </li>
          </ul>
        </section>
      </div>

      <div className="admin-panel-grid admin-panel-grid--wide">
        <section className="admin-card admin-conversion-card">
          <div className="admin-card-head">
            <h2>Conversão por produto</h2>
            <span>Visitas, cliques e leads no período</span>
          </div>
          {(data?.conversionByProduct || []).length ? (
            <div className="admin-conversion-list">
              {data.conversionByProduct.map((item) => (
                <div key={item.product_slug} className="admin-conversion-row">
                  <div className="admin-conversion-title">
                    <strong>{item.product_slug}</strong>
                    <span>{item.views} visitas</span>
                  </div>
                  <div className="admin-conversion-metrics">
                    <span><b>{item.clicks}</b> cliques</span>
                    <span><b>{item.leads}</b> leads</span>
                    <span><b>{item.click_rate || 0}%</b> CTR</span>
                    <span><b>{item.lead_rate || 0}%</b> lead/clique</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="admin-empty-note">Ainda não há volume suficiente para comparar produtos nesse filtro.</p>
          )}
        </section>
      </div>

      <div className="admin-panel-grid admin-panel-grid--wide">
        <section className="admin-card admin-loss-card">
          <div className="admin-card-head">
            <h2>Motivos de perda</h2>
            <span>Principais objeções no período</span>
          </div>
          {(data?.lossReasons || []).length ? (
            <div className="admin-loss-list">
              {data.lossReasons.map((item) => (
                <div key={item.loss_reason} className="admin-loss-row">
                  <div className="admin-loss-copy">
                    <strong>{item.loss_reason}</strong>
                    <span>{item.total} lead{item.total > 1 ? 's' : ''}</span>
                  </div>
                  <div className="admin-loss-bar-shell" aria-hidden="true">
                    <div
                      className="admin-loss-bar"
                      style={{ width: `${Math.max(10, (item.total / lossReasonMax) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="admin-empty-note">Ainda não há leads perdidos com motivo preenchido no período.</p>
          )}
        </section>
      </div>

      <div className="admin-panel-grid">
        <section className="admin-card admin-list-card">
          <div className="admin-card-head">
            <h2>Leads que exigem atenção</h2>
            <span>Próximo retorno vencido ou sem ação há 48h</span>
          </div>
          <ul>
            {(data?.overdueFollowUps || []).map((item) => (
              <li key={item.id}>
                <span>
                  <b>{item.nome || 'Lead sem nome'}</b>
                  <small>{item.product_slug || 'sem produto'}{item.owner_name ? ` · ${item.owner_name}` : ''}</small>
                </span>
                <strong>{item.next_contact_at ? formatDateTime(item.next_contact_at) : 'Sem retorno agendado'}</strong>
              </li>
            ))}
            {!data?.overdueFollowUps?.length ? <li><span>Nenhum lead crítico.</span><strong>OK</strong></li> : null}
          </ul>
        </section>

        <section className="admin-card admin-list-card">
          <div className="admin-card-head">
            <h2>Próximos retornos</h2>
            <span>Agenda comercial</span>
          </div>
          <ul>
            {(data?.upcomingFollowUps || []).map((item) => (
              <li key={item.id}>
                <span>
                  <b>{item.nome || 'Lead sem nome'}</b>
                  <small>{item.product_slug || 'sem produto'}{item.owner_name ? ` · ${item.owner_name}` : ''}</small>
                </span>
                <strong>{formatDateTime(item.next_contact_at)}</strong>
              </li>
            ))}
            {!data?.upcomingFollowUps?.length ? <li><span>Nenhum retorno agendado.</span><strong>-</strong></li> : null}
          </ul>
        </section>

        <section className="admin-card admin-list-card">
          <div className="admin-card-head">
            <h2>Leads mais recentes</h2>
            <span>Fila comercial</span>
          </div>
          <ul>
            {(data?.recentLeads || []).map((item) => (
              <li key={item.id}>
                <span>
                  <b>{item.nome || 'Lead sem nome'}</b>
                  <small>{item.product_slug || 'sem produto'}{item.owner_name ? ` · ${item.owner_name}` : ''}</small>
                </span>
                <strong>{formatStatus(item.lead_status)}</strong>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
