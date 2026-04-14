'use client';

import { useEffect, useMemo, useState } from 'react';
import { primeAdminJsonCache } from '@/lib/admin/client-fetch-cache';
import { formatPageLabel } from '@/lib/admin/page-presentation';

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function AdminRulesClient({ apiBase = '/api/admin' }) {
  const endpoint = `${apiBase}/rules`;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [policyForm, setPolicyForm] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetcher(endpoint);
        if (response?.error) throw new Error(response.detail || response.error);
        setData(response);
        primeAdminJsonCache(endpoint, response, 30_000);
      } catch (err) {
        setError(err.message || 'Falha ao carregar regras.');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [endpoint]);

  useEffect(() => {
    if (!data?.guardrails?.policy) return;
    setPolicyForm({
      campaign: {
        minimumSpendForPause: String(data.guardrails.policy.campaign.minimumSpendForPause ?? ''),
        minimumClicksForPause: String(data.guardrails.policy.campaign.minimumClicksForPause ?? ''),
        blockPauseWithAnyConversion: Boolean(data.guardrails.policy.campaign.blockPauseWithAnyConversion),
        requireApprovalForAnyBudgetChange: Boolean(data.guardrails.policy.campaign.requireApprovalForAnyBudgetChange),
        recommendationBudgetIncreasePercent: String(data.guardrails.policy.campaign.recommendationBudgetIncreasePercent ?? ''),
        hardBlockBudgetIncreasePercent: String(data.guardrails.policy.campaign.hardBlockBudgetIncreasePercent ?? '')
      },
      page: {
        autoPublishEnabled: Boolean(data.guardrails.policy.page.autoPublishEnabled)
      },
      product: {
        autoDistributionEnabled: Boolean(data.guardrails.policy.product.autoDistributionEnabled)
      },
      seo: {
        autoPublishEnabled: Boolean(data.guardrails.policy.seo.autoPublishEnabled)
      },
      integration: {
        autoSyncWhenReady: Boolean(data.guardrails.policy.integration.autoSyncWhenReady)
      }
    });
  }, [data]);

  if (loading) return <p className="dashboard-card-empty">Montando o motor de regras...</p>;
  if (error) return <p className="dashboard-error">{error}</p>;
  if (!data) return <p className="dashboard-card-empty">Sem dados para regras.</p>;

  const guardrails = data.guardrails;
  const updatedFootnote = useMemo(() => {
    if (!guardrails?.source?.updatedAt) return 'Usando o perfil recomendado do sistema.';
    return `Último ajuste salvo em ${new Date(guardrails.source.updatedAt).toLocaleString('pt-BR')} por ${guardrails.source.updatedBy || 'admin'}.`;
  }, [guardrails]);

  const setNumeric = (domain, field, value) => {
    setPolicyForm((current) => ({
      ...current,
      [domain]: {
        ...current[domain],
        [field]: value
      }
    }));
  };

  const setBoolean = (domain, field, checked) => {
    setPolicyForm((current) => ({
      ...current,
      [domain]: {
        ...current[domain],
        [field]: checked
      }
    }));
  };

  const handleSave = async () => {
    if (!policyForm) return;
    setSaving(true);
    setError(null);
    setSaveMessage(null);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          policy: {
            campaign: {
              minimumSpendForPause: Number(policyForm.campaign.minimumSpendForPause || 0),
              minimumClicksForPause: Number(policyForm.campaign.minimumClicksForPause || 0),
              blockPauseWithAnyConversion: Boolean(policyForm.campaign.blockPauseWithAnyConversion),
              requireApprovalForAnyBudgetChange: Boolean(policyForm.campaign.requireApprovalForAnyBudgetChange),
              recommendationBudgetIncreasePercent: Number(policyForm.campaign.recommendationBudgetIncreasePercent || 0),
              hardBlockBudgetIncreasePercent: Number(policyForm.campaign.hardBlockBudgetIncreasePercent || 0)
            },
            page: {
              autoPublishEnabled: Boolean(policyForm.page.autoPublishEnabled)
            },
            product: {
              autoDistributionEnabled: Boolean(policyForm.product.autoDistributionEnabled)
            },
            seo: {
              autoPublishEnabled: Boolean(policyForm.seo.autoPublishEnabled)
            },
            integration: {
              autoSyncWhenReady: Boolean(policyForm.integration.autoSyncWhenReady)
            }
          }
        }),
        cache: 'no-store'
      });
      const payload = await response.json();
      if (!response.ok || payload?.error) throw new Error(payload?.detail || payload?.error || 'Falha ao salvar.');
      setData(payload);
      primeAdminJsonCache(endpoint, payload, 30_000);
      setSaveMessage('Política da IA salva com sucesso.');
    } catch (err) {
      setError(err.message || 'Falha ao salvar a política da IA.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    setError(null);
    setSaveMessage(null);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset: true }),
        cache: 'no-store'
      });
      const payload = await response.json();
      if (!response.ok || payload?.error) throw new Error(payload?.detail || payload?.error || 'Falha ao restaurar.');
      setData(payload);
      primeAdminJsonCache(endpoint, payload, 30_000);
      setSaveMessage('Valores recomendados restaurados.');
    } catch (err) {
      setError(err.message || 'Falha ao restaurar a política recomendada.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="intelligence-shell">
      <section className="intelligence-hero intelligence-hero--seo">
        <div className="intelligence-hero-main">
          <p className="eyebrow">Regras de negócio</p>
          <h3>Thresholds, gatilhos, ações e score engine desacoplados da interface</h3>
          <p>
            As regras ficam no backend e definem quando marcar algo como crítico, quando sugerir revisão, quando pedir aprovação e quando reduzir o uso da IA.
          </p>

          <div className="intelligence-pill-row">
            <span className="intelligence-chip intelligence-chip--blue">Regras ativas: {data.rules.rules.filter((rule) => rule.isActive).length}</span>
            <span className="intelligence-chip intelligence-chip--purple">Disparos atuais: {data.rules.matches.length}</span>
            <span className="intelligence-chip intelligence-chip--success">Política: {guardrails?.profile?.label || 'Conservadora'}</span>
            <span className="intelligence-chip intelligence-chip--warning">Modo IA: {data.cost.currentModeLabel}</span>
          </div>
        </div>
      </section>

      {guardrails ? (
        <section className="intelligence-grid-2">
          <article className="intelligence-panel">
            <div className="intelligence-panel-head">
              <div>
                <span>Governança de execução</span>
                <h3>{guardrails.profile.label}</h3>
              </div>
            </div>
            <p>{guardrails.profile.summary}</p>
            <p>{guardrails.profile.operatorGuide}</p>
            <small>{updatedFootnote}</small>
            <div className="intelligence-bullet-list">
              {guardrails.flows.map((item) => (
                <div key={item.key}>
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                  <small>{item.examples.join(' · ')}</small>
                </div>
              ))}
            </div>
          </article>

          <article className="intelligence-panel intelligence-panel--soft">
            <div className="intelligence-panel-head">
              <div>
                <span>Resumo recomendado</span>
                <h3>Com o que começar agora</h3>
              </div>
            </div>
            <div className="intelligence-bullet-list">
              <div>
                <strong>Automático seguro</strong>
                <p>{guardrails.summary.automaticSafe} frentes já podem rodar sozinhas.</p>
              </div>
              <div>
                <strong>Com sua aprovação</strong>
                <p>{guardrails.summary.limitedWithApproval} frentes ficam liberadas, mas com travas.</p>
              </div>
              <div>
                <strong>Só recomendação</strong>
                <p>{guardrails.summary.recommendationOnly} frentes continuam humanas até termos histórico suficiente.</p>
              </div>
            </div>
          </article>
        </section>
      ) : null}

      {guardrails ? (
        <section className="intelligence-panel">
          <div className="intelligence-panel-head">
            <div>
              <span>Controle da autonomia</span>
              <h3>Ajuste os limites da IA sem mexer em código</h3>
            </div>
          </div>
          <div className="admin-rules-form-grid">
            <article className="intelligence-list-card intelligence-list-card--neutral admin-rules-form-card">
              <strong>Campanhas</strong>
              <p>Esses números controlam quando a IA pode sugerir ou bloquear execução em mídia.</p>
              <label className="admin-rules-field">
                <small>Gasto mínimo para pausa externa</small>
                <input type="number" value={policyForm?.campaign.minimumSpendForPause || ''} onChange={(event) => setNumeric('campaign', 'minimumSpendForPause', event.target.value)} />
              </label>
              <label className="admin-rules-field">
                <small>Cliques mínimos para pausa externa</small>
                <input type="number" value={policyForm?.campaign.minimumClicksForPause || ''} onChange={(event) => setNumeric('campaign', 'minimumClicksForPause', event.target.value)} />
              </label>
              <label className="admin-rules-field">
                <small>% de aumento ainda controlado</small>
                <input type="number" value={policyForm?.campaign.recommendationBudgetIncreasePercent || ''} onChange={(event) => setNumeric('campaign', 'recommendationBudgetIncreasePercent', event.target.value)} />
              </label>
              <label className="admin-rules-field">
                <small>% de aumento bloqueado</small>
                <input type="number" value={policyForm?.campaign.hardBlockBudgetIncreasePercent || ''} onChange={(event) => setNumeric('campaign', 'hardBlockBudgetIncreasePercent', event.target.value)} />
              </label>
              <label className="admin-rules-toggle">
                <input type="checkbox" checked={Boolean(policyForm?.campaign.blockPauseWithAnyConversion)} onChange={(event) => setBoolean('campaign', 'blockPauseWithAnyConversion', event.target.checked)} />
                <span>Bloquear pausa se houver qualquer conversão</span>
              </label>
              <label className="admin-rules-toggle">
                <input type="checkbox" checked={Boolean(policyForm?.campaign.requireApprovalForAnyBudgetChange)} onChange={(event) => setBoolean('campaign', 'requireApprovalForAnyBudgetChange', event.target.checked)} />
                <span>Exigir aprovação em qualquer mudança de verba</span>
              </label>
            </article>

            <article className="intelligence-list-card intelligence-list-card--neutral admin-rules-form-card">
              <strong>Autonomia por domínio</strong>
              <p>Aqui você escolhe onde a IA pode andar mais solta e onde ela continua só assistindo.</p>
              <label className="admin-rules-toggle">
                <input type="checkbox" checked={Boolean(policyForm?.integration.autoSyncWhenReady)} onChange={(event) => setBoolean('integration', 'autoSyncWhenReady', event.target.checked)} />
                <span>Permitir sync automático das integrações prontas</span>
              </label>
              <label className="admin-rules-toggle">
                <input type="checkbox" checked={Boolean(policyForm?.product.autoDistributionEnabled)} onChange={(event) => setBoolean('product', 'autoDistributionEnabled', event.target.checked)} />
                <span>Afrouxar distribuição de produto</span>
              </label>
              <label className="admin-rules-toggle">
                <input type="checkbox" checked={Boolean(policyForm?.page.autoPublishEnabled)} onChange={(event) => setBoolean('page', 'autoPublishEnabled', event.target.checked)} />
                <span>Liberar publicação automática em páginas</span>
              </label>
              <label className="admin-rules-toggle">
                <input type="checkbox" checked={Boolean(policyForm?.seo.autoPublishEnabled)} onChange={(event) => setBoolean('seo', 'autoPublishEnabled', event.target.checked)} />
                <span>Liberar publicação automática em SEO</span>
              </label>
              <small className="admin-rules-footnote">Os produtos core continuam protegidos automaticamente: Cartão Porto, Seguro Celular, Viagem e Vida.</small>
            </article>
          </div>
          <div className="admin-inline-actions">
            <button type="button" className="button button--primary" disabled={saving} onClick={() => void handleSave()}>
              {saving ? 'Salvando...' : 'Salvar política'}
            </button>
            <button type="button" className="button button--ghost" disabled={saving} onClick={() => void handleReset()}>
              Restaurar recomendado
            </button>
            {saveMessage ? <small className="admin-rules-save-note">{saveMessage}</small> : null}
          </div>
        </section>
      ) : null}

      {guardrails ? (
        <section className="intelligence-panel">
          <div className="intelligence-panel-head">
            <div>
              <span>Valores recomendados</span>
              <h3>O que a IA pode ou não pode fazer por domínio</h3>
            </div>
          </div>
          <div className="intelligence-grid-2">
            {guardrails.domains.map((domain) => (
              <article key={domain.key} className="intelligence-list-card intelligence-list-card--neutral">
                <strong>{domain.title}</strong>
                <p>{domain.summary}</p>
                <small>{domain.autonomyLabel}</small>
                {domain.values.map((item) => (
                  <div key={`${domain.key}-${item.label}`}>
                    <strong>{item.label}</strong>
                    <p>{item.value}</p>
                    <small>{item.reason}</small>
                  </div>
                ))}
                <div>
                  <strong>O sistema pode fazer</strong>
                  <p>{domain.systemCan.join(' · ')}</p>
                </div>
                <div>
                  <strong>O sistema ainda pede sua caneta</strong>
                  <p>{domain.systemNeedsApproval.join(' · ')}</p>
                </div>
                <div>
                  <strong>O sistema não faz sozinho</strong>
                  <p>{domain.systemWillNotDo.join(' · ')}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="intelligence-grid-2">
        <article className="intelligence-panel">
          <div className="intelligence-panel-head">
            <div>
              <span>Rule catalog</span>
              <h3>Regras configuradas no backend</h3>
            </div>
          </div>
          <div className="intelligence-list">
            {data.rules.rules.map((rule) => (
              <div key={rule.id} className="intelligence-list-card intelligence-list-card--neutral">
                <strong>{rule.name}</strong>
                <p>{rule.description}</p>
                <small>Tipo: {rule.type}. Trigger: {rule.trigger}. Aprovação: {rule.requiresApproval ? 'Sim' : 'Não'}.</small>
                <small>Condição: {JSON.stringify(rule.conditionJson)}</small>
                <small>Ação: {JSON.stringify(rule.actionJson)}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="intelligence-panel intelligence-panel--soft">
          <div className="intelligence-panel-head">
            <div>
              <span>Disparos</span>
              <h3>O que já bateu nas regras</h3>
            </div>
          </div>
          {data.rules.matches.length ? (
            <div className="intelligence-list">
              {data.rules.matches.map((item) => (
                <div key={`${item.ruleId}-${item.scopeId}`} className="intelligence-list-card intelligence-list-card--warning">
                  <strong>{item.ruleName}</strong>
                  <p>{item.diagnosis}</p>
                  <small>Escopo: {item.scopeType} · {item.label}</small>
                </div>
              ))}
            </div>
          ) : (
            <p className="dashboard-card-empty">Nenhuma regra disparou neste recorte.</p>
          )}
        </article>
      </section>

      <section className="intelligence-grid-2">
        <article className="intelligence-panel">
          <div className="intelligence-panel-head">
            <div>
              <span>Scores</span>
              <h3>ProductOpportunityScore e companhia</h3>
            </div>
          </div>
          <div className="intelligence-bullet-list">
            <div>
              <strong>ProductOpportunityScore</strong>
              <p>Combina tração, conversão, SEO e foco comercial.</p>
            </div>
            <div>
              <strong>ProductProfitPriorityScore</strong>
              <p>Pesa ganho, lead rate, saúde e foco do produto.</p>
            </div>
            <div>
              <strong>PageHealthScore</strong>
              <p>Olha CTA, leads, saída e sinais de comportamento.</p>
            </div>
            <div>
              <strong>CampaignHealthScore</strong>
              <p>Olha clique, lead, eficiência e custo quando existir.</p>
            </div>
            <div>
              <strong>SeoOpportunityScore</strong>
              <p>Pesa impressões, CTR, posição e clique potencial.</p>
            </div>
            <div>
              <strong>UrgencyScore</strong>
              <p>Amplifica o que precisa ser feito antes de escalar.</p>
            </div>
          </div>
        </article>

        <article className="intelligence-panel">
          <div className="intelligence-panel-head">
            <div>
              <span>Leaders por score</span>
              <h3>Quem está puxando o motor</h3>
            </div>
          </div>
          <div className="intelligence-bullet-list">
            <div>
              <strong>Produto</strong>
              <p>{data.scores.products[0]?.label || 'Sem líder'}.</p>
            </div>
            <div>
              <strong>Página</strong>
              <p>{data.scores.pages[0]?.pagePath ? formatPageLabel(data.scores.pages[0].pagePath) : 'Sem líder'}.</p>
            </div>
            <div>
              <strong>Campanha</strong>
              <p>{data.scores.campaigns[0]?.label || 'Sem líder'}.</p>
            </div>
            <div>
              <strong>SEO</strong>
              <p>{data.scores.seo[0]?.query || 'Sem líder'}.</p>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
