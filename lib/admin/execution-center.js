import 'server-only';

function isErrorStatus(status) {
  return status === 'error' || status === 'danger' || status === 'failed';
}

function isBlockedStatus(status) {
  return status === 'cancelled' || status === 'warning';
}

export function buildExecutionCenter(history, pendingApprovals = 0) {
  const latestApprovals = history?.latestApprovals || [];
  const automationRuns = history?.automationRuns || [];
  const latestTasks = history?.latestTasks || [];
  const operationSummary = history?.operations?.summary || history?.operationSummary || {};

  const approvedCount = latestApprovals.filter((item) => item.status === 'approved').length;
  const rejectedCount = latestApprovals.filter((item) => item.status === 'rejected').length;
  const successfulRuns = automationRuns.filter((item) => item.status === 'success').length;
  const failedRuns = automationRuns.filter((item) => isErrorStatus(item.status)).length;
  const blockedRuns = automationRuns.filter((item) => isBlockedStatus(item.status)).length;
  const pendingReviews = latestTasks.filter(
    (item) => item.status !== 'done' && String(item.id || '').startsWith('review:')
  ).length;
  const autonomousActions = approvedCount + successfulRuns;
  const readyOperations = operationSummary.ready || 0;
  const runningOperations = operationSummary.running || 0;
  const completedOperations = operationSummary.completed || 0;
  const lastRun = automationRuns[0] || null;
  const lastApproval = latestApprovals[0] || null;

  let headline = 'A IA está em modo de observação';
  let summary = 'Assim que novas decisões, registros ou revisões acontecerem, o painel principal passa a mostrar esse rastro.';

  if (pendingApprovals > 0) {
    headline = `${pendingApprovals} aprovações ainda bloqueiam seu próximo passo`;
    summary = 'A IA já estruturou a ação, mas ainda depende da sua caneta para tirar isso da fila sensível.';
  } else if (readyOperations > 0 || runningOperations > 0) {
    headline = `${readyOperations + runningOperations} sugestões já estão prontas para revisar`;
    summary = 'A IA já tirou a decisão do campo das ideias e deixou o próximo passo organizado, com destino e memória.';
  } else if (failedRuns > 0) {
    headline = `${failedRuns} registros pedem revisão`;
    summary = 'Uma ou mais rotinas não fecharam bem e agora pedem revisão operacional.';
  } else if (autonomousActions > 0) {
    headline = `${autonomousActions} decisões já andaram com suporte da IA`;
    summary = 'O sistema já registrou decisões, handoffs e acompanhamentos com rastro claro no histórico.';
  }

  return {
    headline,
    summary,
    pendingApprovals,
    approvedCount,
    rejectedCount,
    successfulRuns,
    failedRuns,
    blockedRuns,
    pendingReviews,
    autonomousActions,
    readyOperations,
    runningOperations,
    completedOperations,
    lastRun,
    lastApproval
  };
}
