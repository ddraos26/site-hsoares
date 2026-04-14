'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminGuidePanel } from '@/components/admin/admin-guide-panel';
import { fetchAdminJson, primeAdminJsonCache } from '@/lib/admin/client-fetch-cache';
import { resolveDashboardHref } from '@/lib/admin/core/dashboard-route-catalog';

function formatDateTime(value) {
  if (!value) return 'Sem registro';
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function openApprovalCard(router, href, basePath) {
  if (!href) return;
  router.push(resolveDashboardHref(href, basePath));
}

function isInteractiveTarget(target) {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest('a, button, input, textarea, select, option, label'));
}

function getApprovalCardProps(router, href, basePath) {
  if (!href) return {};

  return {
    role: 'link',
    tabIndex: 0,
    onClick: (event) => {
      if (isInteractiveTarget(event.target)) return;
      openApprovalCard(router, href, basePath);
    },
    onKeyDown: (event) => {
      if (event.target !== event.currentTarget || isInteractiveTarget(event.target)) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openApprovalCard(router, href, basePath);
      }
    }
  };
}

function MetricCard({ label, value, helper, tone = 'blue', href, router, basePath }) {
  return (
    <article className={`ops-metric-card ops-metric-card--${tone} ${href ? 'admin-actionable-card' : ''}`} {...getApprovalCardProps(router, href, basePath)}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </article>
  );
}

function getApprovalExecutionEffect(item) {
  const mode = String(item?.execution?.executionMode || '').trim();
  const sourceType = String(item?.execution?.sourceType || item?.sourceType || '').trim();
  const siteMutation = item?.execution?.siteMutation || null;

  if (siteMutation) {
    return {
      tone: 'warning',
      label: 'Ao aprovar: abre handoff manual no site',
      description: `${siteMutation.title || 'A recomendação visual'} vira uma orientação operacional para você implementar no VSCode, com acompanhamento depois.`
    };
  }

  if (sourceType === 'campaign' && mode === 'approval_required') {
    return {
      tone: 'success',
      label: 'Ao aprovar: muda fora do painel',
      description: 'Essa aprovação pode disparar mutação externa controlada na campanha, se o conector e os guardrails permitirem.'
    };
  }

  if (mode === 'operator_handoff') {
    return {
      tone: 'warning',
      label: 'Ao aprovar: abre handoff para operador',
      description:
        sourceType === 'campaign'
          ? 'O sistema cria a operação de mídia com contexto e acompanhamento, mas não altera a campanha sozinho neste clique.'
          : sourceType === 'seo'
            ? 'O sistema estrutura a ação de SEO e abre acompanhamento, mas não publica a mudança automaticamente.'
            : sourceType === 'integration'
              ? 'O sistema abre o desbloqueio estrutural e deixa a operação pronta, mas ainda não executa tudo sozinho.'
              : 'O sistema monta o plano, registra a operação e abre acompanhamento, mas ainda depende de etapa humana.'
    };
  }

  if (mode === 'approval_required') {
    return {
      tone: 'premium',
      label: 'Ao aprovar: organiza a execução interna',
      description:
        sourceType === 'page'
          ? 'O sistema fecha a decisão, registra a execução e abre revisão de impacto, mas não altera o site automaticamente.'
          : sourceType === 'product'
            ? 'O sistema prioriza, registra a execução e acompanha o resultado, mas não muda distribuição externa sozinho.'
            : 'O sistema executa o fluxo interno e registra tudo, sem mudança externa instantânea.'
    };
  }

  return {
    tone: 'blue',
    label: 'Ao aprovar: organiza o fluxo',
    description: 'Essa aprovação registra a decisão e reposiciona a operação para o próximo passo rastreável.'
  };
}

function getApprovalPrimaryActionLabel(item) {
  const mode = String(item?.execution?.executionMode || '').trim();
  const sourceType = String(item?.execution?.sourceType || item?.sourceType || '').trim();
  const siteMutation = item?.execution?.siteMutation || null;

  if (siteMutation) return 'Aprovar e abrir handoff';
  if (mode === 'operator_handoff') return 'Aprovar e abrir handoff';
  if (sourceType === 'campaign' && mode === 'approval_required') return 'Aprovar e liberar operação';
  if (mode === 'approval_required') return 'Aprovar e organizar execução';
  return 'Aprovar';
}

function ApprovalQueueCard({ item, router, basePath, savingId, onDecision }) {
  const href = item.href || '/admin/copiloto';
  const [instruction, setInstruction] = useState(item.rationale || '');
  const siteMutation = item?.execution?.siteMutation || null;
  const tone =
    item.risk === 'Alta'
      ? 'danger'
      : item.risk === 'Média'
        ? 'warning'
        : 'premium';

  return (
    <article className={`cockpit-approval-card cockpit-decision-card--${tone} admin-actionable-card`} {...getApprovalCardProps(router, href, basePath)}>
      <div className="cockpit-approval-head">
        <div>
          <span>Aguardando decisão</span>
          <h4>{item.title}</h4>
        </div>
        <strong>{item.risk}</strong>
      </div>

      <p>{item.reason}</p>

      {item.execution?.summary ? (
        <div className="cockpit-diagnosis-grid">
          <div>
            <small>Execução automática</small>
            <strong>{item.execution.summary}</strong>
          </div>
        </div>
      ) : null}

      {item.execution?.executionMode ? (
        <div className="cockpit-diagnosis-grid">
          <div>
            <small>Tipo de execução</small>
            <strong>
              {siteMutation
                ? 'Implementação manual guiada'
                : item.execution.executionMode === 'operator_handoff'
                    ? 'Pronta para operador'
                    : item.execution.executionMode === 'approval_required'
                      ? 'Aprovar e executar'
                      : 'Fluxo operacional'}
            </strong>
          </div>
        </div>
      ) : null}

      {item.execution?.steps?.length ? (
        <div className="task-history-list">
          {item.execution.steps.slice(0, 3).map((step) => (
            <div key={step} className="task-history-row">
              <div>
                <strong>Etapa planejada</strong>
                <small>{step}</small>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {siteMutation?.targetPaths?.length ? (
        <div className="cockpit-diagnosis-grid">
          <div>
            <small>Escopo da mudança</small>
            <strong>{siteMutation.targetPaths.includes('*') ? 'Site inteiro' : siteMutation.targetPaths.join(', ')}</strong>
          </div>
        </div>
      ) : null}

      {(() => {
        const effect = getApprovalExecutionEffect(item);
        return (
          <div className={`approval-effect-card approval-effect-card--${effect.tone}`}>
            <small>{effect.label}</small>
            <strong>{effect.description}</strong>
          </div>
        );
      })()}

      <div className="cockpit-diagnosis-grid">
        <div>
          <small>Recomendação</small>
          <strong>{item.recommendation}</strong>
        </div>
        <div>
          <small>Impacto</small>
          <strong>{item.impact}</strong>
        </div>
      </div>

      {item.aiGuidance ? (
        <div className="cockpit-diagnosis-grid">
          <div>
            <small>Leitura da IA</small>
            <strong>{item.aiGuidance.verdict || 'Sem veredito complementar'}</strong>
            <small>{item.aiGuidance.whyNow || item.aiGuidance.expectedUpside || 'Sem nota adicional da IA.'}</small>
          </div>
        </div>
      ) : null}

      <label className="admin-inline-field approval-note-field" onClick={(event) => event.stopPropagation()}>
        <span>Complemento para a IA ou para a execução</span>
        <textarea
          rows="3"
          value={instruction}
          placeholder="Ex.: aplicar no site inteiro, não mexer na copy, só destacar o WhatsApp."
          onChange={(event) => setInstruction(event.target.value)}
        />
      </label>

      <div className="admin-inline-actions">
        <a
          className="button button--ghost"
          href={resolveDashboardHref(href, basePath)}
          onClick={(event) => event.stopPropagation()}
        >
          Abrir contexto
        </a>
        <button
          type="button"
          className="button button--primary"
          disabled={savingId === item.id}
          onClick={(event) => {
            event.stopPropagation();
            void onDecision(item, 'approved', instruction);
          }}
        >
          {getApprovalPrimaryActionLabel(item)}
        </button>
        <button
          type="button"
          className="button button--ghost"
          disabled={savingId === item.id}
          onClick={(event) => {
            event.stopPropagation();
            void onDecision(item, 'rejected', instruction);
          }}
        >
          Rejeitar
        </button>
      </div>
    </article>
  );
}

export default function AdminApprovalsClient({
  apiBase = '/api/admin',
  basePath = '/admin',
  initialData = null,
  guide = ''
}) {
  const router = useRouter();
  const endpoint = `${apiBase}/approvals`;
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [nextFocus, setNextFocus] = useState(null);
  const [appliedHref, setAppliedHref] = useState('');
  const [previewHref, setPreviewHref] = useState('');

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchAdminJson(endpoint, { ttlMs: 45_000 });
      if (response?.error) throw new Error(response.detail || response.error);
      setData(response);
    } catch (err) {
      setError(err.message || 'Falha ao carregar aprovações.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialData) {
      primeAdminJsonCache(endpoint, initialData, 45_000);
      setData(initialData);
      setLoading(false);
      setError(null);
      return undefined;
    }

    void load();
    return undefined;
  }, [endpoint, initialData]);

  async function handleDecision(item, status, rationale = '') {
    setSavingId(item.id);
    setNotice('');
    setNextFocus(null);
    setAppliedHref('');
    setPreviewHref('');

    try {
      const response = await fetchAdminJson(`${apiBase}/approvals`, {
        fetchOptions: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: item.id,
            title: item.title,
            status,
            rationale
          })
        }
      });

      if (response?.error) {
        throw new Error(response.detail || response.error);
      }

      const executionError =
        response?.execution?.status === 'error'
          ? response.execution.detail || 'A decisão foi registrada, mas a execução automática falhou.'
          : '';

      if (!executionError && status === 'approved') {
        setNotice(response?.execution?.detail || 'A aprovação foi registrada e a execução automática foi disparada.');
        setAppliedHref(response?.execution?.appliedHref || '');
        setPreviewHref(response?.execution?.previewHref || '');
      } else if (!executionError) {
        setNotice(response?.execution?.detail || 'A recomendação foi rejeitada e a execução automática foi bloqueada.');
      }

      setNextFocus(response?.nextFocus || null);

      await load();

      if (executionError) {
        setError(executionError);
      }
    } catch (err) {
      setError(err.message || 'Falha ao registrar aprovação.');
    } finally {
      setSavingId(null);
    }
  }

  const pending = data?.approvals?.pending || [];
  const history = data?.approvals?.history || [];
  const approvedCount = history.filter((item) => item.status === 'approved').length;
  const rejectedCount = history.filter((item) => item.status === 'rejected').length;
  const leadApproval = pending[0] || null;
  const lastDecision = history[0] || null;
  const aiNarrative = data?.aiNarrative || null;

  const heroTitle = useMemo(() => {
    if (leadApproval) return `${leadApproval.title} precisa da sua validação antes do sistema agir`;
    if (lastDecision?.status === 'approved') return 'A fila sensível está limpa e a última decisão já foi aprovada';
    if (lastDecision?.status === 'rejected') return 'A fila sensível está limpa e a última decisão foi rejeitada com histórico';
    return 'Nenhuma decisão sensível pendente no momento';
  }, [lastDecision, leadApproval]);

  const heroBody = leadApproval
    ? leadApproval.reason
    : 'O sistema continua monitorando verba, pausa de campanha e outras ações críticas. Quando algo sensível aparecer, entra aqui com histórico e trilha de decisão.';
  const guideTitle =
    guide === 'approval-workflow'
      ? 'Passo a passo para aprovar com seguranca'
      : 'Como trabalhar esta fila';
  const guideDescription =
    guide === 'approval-workflow'
      ? 'Voce nao precisa estudar tudo do zero. Leia motivo, recomendacao e impacto. Se fizer sentido, aprove e o sistema executa.'
      : 'Aprovacoes existem para destravar o que a IA nao deve rodar sozinha.';

  if (loading) return <p className="dashboard-card-empty">Montando a fila de aprovações...</p>;
  if (error) return <p className="dashboard-error">{error}</p>;
  if (!data) return <p className="dashboard-card-empty">Sem dados para aprovações.</p>;

  return (
    <div className="cockpit-shell">
      <section className="cockpit-hero">
        <div className="cockpit-hero-main">
          <p className="eyebrow">Aprovações</p>
          <h3>{heroTitle}</h3>
          <p>{heroBody}</p>

          <div className="ops-chip-row">
            <span className="ops-chip ops-chip--warning">Pendentes: {pending.length}</span>
            <span className="ops-chip ops-chip--success">Aprovadas: {approvedCount}</span>
            <span className="ops-chip ops-chip--premium">Histórico: {history.length}</span>
            <span className={`ops-chip ops-chip--${aiNarrative?.source?.status === 'live' ? 'success' : 'warning'}`}>
              {aiNarrative?.source?.status === 'live' ? 'IA ativa' : 'IA em espera'}
            </span>
          </div>
        </div>

        <aside className="cockpit-confidence-card admin-actionable-card" {...getApprovalCardProps(router, lastDecision ? '/admin/historico' : '/admin/copiloto', basePath)}>
          <span>Última decisão registrada</span>
          <strong>{lastDecision ? lastDecision.title : 'Nenhuma ainda'}</strong>
          <small>
            {lastDecision
              ? `${lastDecision.status === 'approved' ? 'Aprovada' : 'Rejeitada'} em ${formatDateTime(lastDecision.decidedAt)}.`
              : 'Assim que você aprovar ou rejeitar algo, o histórico aparece aqui automaticamente.'}
          </small>
          {aiNarrative?.dailyHeadline ? <small>Leitura da IA: {aiNarrative.dailyHeadline}</small> : null}
        </aside>
      </section>

      <AdminGuidePanel
        eyebrow="Modo guiado"
        title={guideTitle}
        description={guideDescription}
        tone="warning"
        steps={[
          {
            title: 'Leia o motivo e o impacto',
            description: 'No card da aprovacao, foque primeiro em "Motivo", "Recomendacao" e "Impacto esperado".'
          },
          {
            title: 'Use "Abrir contexto" so se precisar conferir detalhe',
            description: 'Na maior parte das vezes, o proprio card ja deve te dar contexto suficiente para decidir rapido.'
          },
          {
            title: 'Se concordar, clique em "Aprovar e executar"',
            description: 'A decisao e registrada e o sistema dispara a execucao automatica do que estiver pronto.'
          },
          {
            title: 'Se nao fizer sentido, clique em "Rejeitar"',
            description: 'O sistema bloqueia a acao, registra a decisao e segue monitorando.'
          }
        ]}
      >
        {leadApproval ? (
          <button
            type="button"
            className="button button--primary"
            onClick={() => openApprovalCard(router, leadApproval.href || '/admin/aprovacoes', basePath)}
          >
            Abrir primeira aprovação
          </button>
        ) : null}
        <button
          type="button"
          className="button button--ghost"
          onClick={() => openApprovalCard(router, '/admin/continuar', basePath)}
        >
          Continuar do ponto certo
        </button>
      </AdminGuidePanel>

      {notice ? <p className="dashboard-card-empty">{notice}</p> : null}

      {appliedHref ? (
        <section className="admin-guide-card admin-guide-card--success">
          <div className="admin-guide-head">
            <div>
              <span>Ver mudança aplicada</span>
              <h3>Abrir página com a mudança aprovada</h3>
            </div>
          </div>
          <p className="admin-guide-description">
            A automação segura foi aplicada. Você pode abrir a página pública impactada agora para validar visualmente.
          </p>
          <div className="admin-guide-actions">
            <a className="button button--primary" href={appliedHref} target="_blank" rel="noopener noreferrer">
              Abrir página com a mudança aplicada
            </a>
          </div>
        </section>
      ) : null}

      {previewHref ? (
        <section className="admin-guide-card admin-guide-card--success">
          <div className="admin-guide-head">
            <div>
              <span>Ver preview do patch</span>
              <h3>Abrir página com o preview pronto</h3>
            </div>
          </div>
          <p className="admin-guide-description">
            O patch superficial foi preparado em preview. Valide visualmente e depois publique pelo módulo de automações.
          </p>
          <div className="admin-guide-actions">
            <a className="button button--primary" href={previewHref} target="_blank" rel="noopener noreferrer">
              Abrir preview do patch
            </a>
            <button
              type="button"
              className="button button--ghost"
              onClick={() => openApprovalCard(router, '/admin/automacoes', basePath)}
            >
              Ir para publicar
            </button>
          </div>
        </section>
      ) : null}

      {nextFocus ? (
        <section className="admin-guide-card admin-guide-card--success">
          <div className="admin-guide-head">
            <div>
              <span>Próxima pendência</span>
              <h3>{nextFocus.title}</h3>
            </div>
          </div>
          <p className="admin-guide-description">{nextFocus.reason}</p>
          <div className="admin-guide-actions">
            <button
              type="button"
              className="button button--primary"
              onClick={() => openApprovalCard(router, nextFocus.href, basePath)}
            >
              Ir para a próxima frente
            </button>
          </div>
        </section>
      ) : null}

      <section className="ops-metric-grid">
        <MetricCard
          label="Pendentes agora"
          value={pending.length}
          helper="Ações sensíveis aguardando você"
          tone="warning"
          href="/admin/aprovacoes"
          router={router}
          basePath={basePath}
        />
        <MetricCard
          label="Aprovadas"
          value={approvedCount}
          helper="Mudanças liberadas pelo seu aval"
          tone="success"
          href="/admin/historico"
          router={router}
          basePath={basePath}
        />
        <MetricCard
          label="Rejeitadas"
          value={rejectedCount}
          helper="Ações barradas e registradas"
          tone="danger"
          href="/admin/historico"
          router={router}
          basePath={basePath}
        />
        <MetricCard
          label="Fila histórica"
          value={history.length}
          helper={`Última leitura em ${formatDateTime(data.checkedAt)}`}
          tone="premium"
          href="/admin/copiloto"
          router={router}
          basePath={basePath}
        />
      </section>

      <section className="cockpit-grid-2">
        <article className="cockpit-panel cockpit-panel--primary">
          <div className="cockpit-panel-head">
            <div>
              <span>Fila pendente</span>
              <h3>O que precisa da sua caneta agora</h3>
            </div>
          </div>

          <div className="cockpit-stack-list">
            {pending.length ? (
              pending.map((item) => (
                <ApprovalQueueCard
                  key={item.id}
                  item={item}
                  router={router}
                  basePath={basePath}
                  savingId={savingId}
                  onDecision={handleDecision}
                />
              ))
            ) : (
              <p className="dashboard-card-empty">Nenhuma decisão crítica pendente no momento.</p>
            )}
          </div>
        </article>

        <article className="cockpit-panel">
          <div className="cockpit-panel-head">
            <div>
              <span>Rotina de aprovação</span>
              <h3>Onde a aprovação destrava resultado</h3>
            </div>
          </div>

          <div className="ops-action-grid">
            <article
              className="ops-action-card ops-action-card--warning admin-actionable-card"
              {...getApprovalCardProps(router, '/admin/copiloto', basePath)}
            >
              <span>Centro de decisão</span>
              <strong>Entender o motivo antes de aprovar</strong>
              <p>Revise os sinais que levaram o sistema a pedir intervenção humana.</p>
              <small>Ideal para verba, pausa e mudança crítica.</small>
            </article>

            <article
              className="ops-action-card ops-action-card--premium admin-actionable-card"
              {...getApprovalCardProps(router, '/admin/automacoes', basePath)}
            >
              <span>Automações</span>
              <strong>Ver o que ficou bloqueado</strong>
              <p>Entenda quais ações automáticas estão aguardando seu aval para seguir.</p>
              <small>Bom para ajustar políticas e evitar gargalo manual.</small>
            </article>

            <article
              className="ops-action-card ops-action-card--success admin-actionable-card"
              {...getApprovalCardProps(router, '/admin/historico', basePath)}
            >
              <span>Histórico</span>
              <strong>Revisar decisões já tomadas</strong>
              <p>Use o histórico para calibrar seu padrão de aprovação e risco.</p>
              <small>Ajuda a manter consistência operacional.</small>
            </article>
          </div>

          <div className="ops-inline-grid">
            <article className="ops-inline-card">
              <span>Regra do sistema</span>
              <strong>Ações sensíveis nunca correm sozinhas</strong>
              <p className="admin-card-footnote">Aumento de verba, pausa de campanha e ajustes críticos entram aqui antes de mudar estado real.</p>
            </article>
            <article className="ops-inline-card">
              <span>Objetivo</span>
              <strong>Reduzir atrito sem perder governança</strong>
              <p className="admin-card-footnote">O ideal é você decidir rápido com contexto claro, não analisar tudo do zero.</p>
            </article>
          </div>
        </article>
      </section>

      <section className="cockpit-panel">
        <div className="cockpit-panel-head">
          <div>
            <span>Histórico de decisões</span>
            <h3>Rastro auditável do que já foi liberado ou barrado</h3>
          </div>
        </div>

        {history.length ? (
          <div className="cockpit-grid-3">
            {history.slice(0, 6).map((item) => (
              <article
                key={`${item.id}-${item.decidedAt || item.status}`}
                className={`cockpit-approval-card ${item.status === 'approved' ? 'cockpit-automation-card--active' : 'cockpit-decision-card--danger'} admin-actionable-card`}
                {...getApprovalCardProps(router, item.href || '/admin/historico', basePath)}
              >
                <div className="cockpit-approval-head">
                  <div>
                    <span>{item.status === 'approved' ? 'Aprovado' : 'Rejeitado'}</span>
                    <h4>{item.title}</h4>
                  </div>
                  <strong>{formatDateTime(item.decidedAt)}</strong>
                </div>
                <p>{item.reason}</p>
                <small>{item.executionDetail || item.rationale || 'Sem observação adicional registrada.'}</small>
              </article>
            ))}
          </div>
        ) : (
          <p className="dashboard-card-empty">Seu histórico de aprovações ainda está vazio.</p>
        )}
      </section>
    </div>
  );
}
