import 'server-only';

import { getAdminAiApprovalsSnapshot } from '@/lib/admin/ai-control-center';
import { getAdminDailyChecklistSnapshot } from '@/lib/admin/daily-checklist-store';
import { resolveDashboardHref } from '@/lib/admin/core/dashboard-route-catalog';
import { getCachedAdminTasksSnapshot, getCachedExecutiveCockpitSnapshot } from '@/lib/admin/server-snapshot-cache';

function sanitizeText(value, limit = 240) {
  return String(value || '').trim().slice(0, limit);
}

function appendQuery(href, params) {
  const value = sanitizeText(href, 300);
  if (!value) return '';

  const [pathWithQuery, hash = ''] = value.split('#');
  const search = new URLSearchParams();
  const [path, existingQuery = ''] = pathWithQuery.split('?');

  if (existingQuery) {
    const existing = new URLSearchParams(existingQuery);
    existing.forEach((entry, key) => search.set(key, entry));
  }

  Object.entries(params || {}).forEach(([key, entry]) => {
    if (entry == null || entry === '') return;
    search.set(key, String(entry));
  });

  const finalPath = `${path}${search.toString() ? `?${search}` : ''}`;
  return hash ? `${finalPath}#${hash}` : finalPath;
}

function guideForHref(href = '', fallback = 'decision-workflow') {
  const value = String(href || '');
  if (value.includes('/admin/leads')) return 'lead-workflow';
  if (value.includes('/admin/tasks')) return 'task-workflow';
  if (value.includes('/admin/aprovacoes')) return 'approval-workflow';
  if (value.includes('/admin/automacoes')) return 'automation-workflow';
  if (value.includes('/admin/missao-hoje')) return 'mission-start';
  if (value.includes('/admin/checklist')) return 'checklist-flow';
  return fallback;
}

function decorateFocusHref(href, fallbackGuide) {
  return appendQuery(href, {
    guide: guideForHref(href, fallbackGuide)
  });
}

function buildFocusItem({ href, title, reason, bucket, fallbackGuide = 'decision-workflow', basePath = '/admin' }) {
  const adminHref = decorateFocusHref(href, fallbackGuide);

  return {
    bucket: sanitizeText(bucket, 120),
    title: sanitizeText(title, 180),
    reason: sanitizeText(reason, 240),
    href: basePath === '/dashboard' ? resolveDashboardHref(adminHref, '/dashboard') : adminHref,
    adminHref,
    dashboardHref: resolveDashboardHref(adminHref, '/dashboard')
  };
}

export async function getAdminNextFocus({ basePath = '/admin' } = {}) {
  const [approvalsSnapshot, tasksSnapshot, checklistSnapshot, cockpitSnapshot] = await Promise.all([
    getAdminAiApprovalsSnapshot(),
    getCachedAdminTasksSnapshot(),
    getAdminDailyChecklistSnapshot(),
    getCachedExecutiveCockpitSnapshot()
  ]);

  const pendingApproval = approvalsSnapshot.approvals?.pending?.[0] || null;
  if (pendingApproval) {
    return buildFocusItem({
      href: pendingApproval.href || '/admin/aprovacoes',
      title: pendingApproval.title || 'Aprovação pendente',
      reason: pendingApproval.reason || pendingApproval.recommendation || 'Existe uma decisão sensível esperando sua caneta.',
      bucket: 'Aprovação',
      fallbackGuide: 'approval-workflow',
      basePath
    });
  }

  const topTask = tasksSnapshot.topTask || null;
  if (topTask?.href) {
    return buildFocusItem({
      href: topTask.href,
      title: topTask.title || 'Próxima task',
      reason: topTask.recommendation || topTask.description || 'Essa é a frente operacional mais forte agora.',
      bucket: 'Task',
      fallbackGuide: topTask.sourceType === 'lead' ? 'lead-workflow' : 'task-workflow',
      basePath
    });
  }

  const nextChecklistItem = (checklistSnapshot.items || []).find((item) => !item.isDone && item.href);
  if (nextChecklistItem) {
    return buildFocusItem({
      href: nextChecklistItem.href,
      title: nextChecklistItem.title || 'Próximo passo do checklist',
      reason: nextChecklistItem.description || 'Esse é o próximo item vivo do seu dia.',
      bucket: nextChecklistItem.bucket || 'Checklist',
      fallbackGuide: 'checklist-flow',
      basePath
    });
  }

  const firstAction = cockpitSnapshot.actionQueue?.[0] || null;
  if (firstAction?.href) {
    return buildFocusItem({
      href: firstAction.href,
      title: firstAction.title || 'Próxima ação',
      reason: firstAction.recommendation || firstAction.diagnosis || 'Essa é a principal ação sugerida pelo sistema agora.',
      bucket: firstAction.bucket || 'Decisão',
      fallbackGuide: 'decision-workflow',
      basePath
    });
  }

  return buildFocusItem({
    href: '/admin/checklist',
    title: 'Voltar para o checklist',
    reason: 'A fila principal está limpa. Use o checklist para revisar o que falta no dia.',
    bucket: 'Rotina',
    fallbackGuide: 'checklist-flow',
    basePath
  });
}
