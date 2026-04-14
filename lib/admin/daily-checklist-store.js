import 'server-only';

import { getDb } from '@/lib/db';
import { ensureAdminOpsTables } from '@/lib/admin/admin-ops-db';
import { formatPageLabel, replacePagePathWithLabel } from '@/lib/admin/page-presentation';
import {
  getCachedAdminPagesSnapshot,
  getCachedExecutiveCockpitSnapshot
} from '@/lib/admin/server-snapshot-cache';

function normalizeDate(value) {
  return String(value || new Date().toISOString().slice(0, 10)).slice(0, 10);
}

function sanitizeText(value, limit = 240) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, limit);
}

function withGuide(href, guide) {
  const value = sanitizeText(href, 240);
  const guideKey = sanitizeText(guide, 120);

  if (!value || !guideKey) return value;

  const [pathWithQuery, hash = ''] = value.split('#');
  const separator = pathWithQuery.includes('?') ? '&' : '?';
  const guidedHref = `${pathWithQuery}${separator}guide=${encodeURIComponent(guideKey)}`;

  return hash ? `${guidedHref}#${hash}` : guidedHref;
}

function inferGuideForHref(href) {
  const value = String(href || '');

  if (value.includes('/admin/leads')) return 'lead-workflow';
  if (value.includes('/dashboard/pages/') || value.includes('/admin/paginas')) return 'decision-workflow';
  if (value.includes('/admin/tasks')) return 'task-workflow';
  if (value.includes('/admin/aprovacoes')) return 'decision-workflow';
  if (value.includes('/admin/automacoes')) return 'automation-workflow';
  if (value.includes('/admin/seo')) return 'seo-workflow';
  if (value.includes('/admin/missao-hoje')) return 'mission-start';
  return 'decision-workflow';
}

function buildChecklistBlueprint(cockpit = {}, pagesSnapshot = {}) {
  const items = [];
  const topPage = pagesSnapshot.commandCenter?.topPriority || pagesSnapshot.items?.[0] || null;
  const action = cockpit.actionQueue?.[0] || null;
  const approval = cockpit.approvals?.[0] || null;
  const alert = cockpit.moneyLeaks?.[0] || null;
  const opportunity = cockpit.growthMoves?.[0] || null;
  const operation = cockpit.operations?.focus?.nextOperation || null;

  if (topPage) {
    const topPageLabel = formatPageLabel(topPage.pagePath);

    items.push({
      key: 'page-focus',
      bucket: 'Pagina',
      title: sanitizeText(`Abrir ${topPageLabel}`, 120),
      description:
        sanitizeText(
          `${topPage.views || 0} visitas, ${topPage.leads || 0} leads. ${topPage.decision?.diagnosis?.summary || topPage.decision?.headline || ''}`,
          220
        ) || 'Abrir a pagina principal do dia e entender o que esta acontecendo nela.',
      href: withGuide(sanitizeText(topPage.links?.contextHref, 240) || '/admin/paginas', 'decision-workflow'),
      position: 1,
      payload: { source: 'pages', sourceId: topPage.pagePath || 'page-focus' }
    });

    items.push({
      key: 'page-action',
      bucket: 'Acao',
      title: sanitizeText(topPage.decision?.recommendation?.summary || 'Executar a principal acao dessa pagina', 120),
      description:
        sanitizeText(
          `${topPage.decision?.automation?.nextStep || topPage.decision?.recommendation?.summary || ''}`,
          220
        ) || 'Fazer a principal acao recomendada para a pagina que lidera o dia.',
      href: withGuide(sanitizeText(topPage.links?.contextHref, 240) || '/admin/paginas', 'decision-workflow'),
      position: 2,
      payload: { source: 'pages', sourceId: topPage.pagePath || 'page-action' }
    });
  } else {
    items.push({
      key: 'review-mission',
      bucket: 'Comeco',
      title: 'Alinhar a Missao do Dia',
      description:
        sanitizeText(cockpit.commandCenter?.title || cockpit.commandCenter?.diagnosis) ||
        'Abrir a missao e decidir o foco do dia antes de entrar nas outras abas.',
      href: withGuide('/admin/missao-hoje', 'mission-start'),
      position: 1,
      payload: { source: 'mission' }
    });
  }

  if (action) {
    items.push({
      key: 'primary-action',
      bucket: 'Acao',
      title: sanitizeText(action.title || 'Executar prioridade principal', 120),
      description:
        sanitizeText(action.recommendation || action.description || action.diagnosis, 220) ||
        'Executar a principal recomendacao do sistema para hoje.',
      href: withGuide(sanitizeText(action.href, 240) || '/admin/copiloto', inferGuideForHref(action.href)),
      position: topPage ? 3 : 2,
      payload: { source: 'actionQueue', sourceId: action.id || action.title || 'primary' }
    });
  }

  if (approval) {
    items.push({
      key: 'pending-approval',
      bucket: 'Decisao',
      title: sanitizeText(`Decidir: ${approval.title || 'recomendacao importante'}`, 120),
      description:
        sanitizeText(approval.reason || approval.recommendation || approval.impact, 220) ||
        'Olhar a recomendacao, decidir se voce vai seguir com ela e tirar isso da frente.',
      href: withGuide(sanitizeText(approval.href, 240) || '/admin/aprovacoes', 'decision-workflow'),
      position: topPage ? 4 : 3,
      payload: { source: 'approvals', sourceId: approval.id || 'approval' }
    });
  }

  if (alert) {
    items.push({
      key: 'critical-alert',
      bucket: 'Risco',
      title: sanitizeText(alert.title || 'Tratar alerta principal', 120),
      description:
        sanitizeText(alert.description || alert.diagnosis || alert.recommendation, 220) ||
        'Corrigir o principal vazamento detectado no dia.',
      href: withGuide(sanitizeText(alert.href, 240) || '/admin/copiloto', inferGuideForHref(alert.href)),
      position: topPage ? 5 : 4,
      payload: { source: 'moneyLeaks', sourceId: alert.id || 'alert' }
    });
  }

  if (operation) {
    const operationTitle =
      operation.sourceType === 'page'
        ? replacePagePathWithLabel(operation.title, operation.sourceId)
        : operation.title;

    items.push({
      key: 'next-operation',
      bucket: 'Execucao',
      title: sanitizeText(operationTitle || 'Acompanhar execucao em andamento', 120),
      description:
        sanitizeText(operation.description || operation.reason, 220) ||
        'Abrir a fila operacional e acompanhar a proxima execucao da IA.',
      href: withGuide(
        sanitizeText(operation.contextHref, 240) ||
          sanitizeText(operation.operationHref, 240) ||
          sanitizeText(operation.queueHref, 240) ||
          '/admin/automacoes',
        'automation-workflow'
      ),
      position: topPage ? 6 : 5,
      payload: { source: 'operations', sourceId: operation.id || operation.operationKey || 'operation' }
    });
  } else if (opportunity) {
    items.push({
      key: 'top-opportunity',
      bucket: 'Oportunidade',
      title: sanitizeText(opportunity.title || opportunity.query || 'Aproveitar oportunidade do dia', 120),
      description:
        sanitizeText(opportunity.description || opportunity.recommendation || opportunity.value, 220) ||
        'Aproveitar a melhor oportunidade detectada pelo sistema hoje.',
      href: withGuide(sanitizeText(opportunity.href, 240) || '/admin/seo', inferGuideForHref(opportunity.href || '/admin/seo')),
      position: topPage ? 6 : 5,
      payload: { source: 'growthMoves', sourceId: opportunity.id || opportunity.query || 'opportunity' }
    });
  }

  items.push({
    key: 'close-day',
    bucket: 'Fechamento',
    title: 'Fechar pendencias do dia',
    description: 'Antes de sair, revisar historico, tasks e o que ainda ficou sem dono ou sem retorno.',
    href: withGuide('/admin/historico', 'close-day'),
    position: topPage ? 7 : 6,
    payload: { source: 'history' }
  });

  return items;
}

async function upsertChecklistBlueprint(sql, date, item) {
  await sql`
    INSERT INTO admin_daily_checklist_items (
      checklist_date,
      item_key,
      title,
      description,
      bucket,
      href,
      position,
      source_payload,
      updated_at
    )
    VALUES (
      ${date}::date,
      ${item.key},
      ${item.title},
      ${item.description || null},
      ${item.bucket || null},
      ${item.href || null},
      ${item.position || 0},
      ${JSON.stringify(item.payload || {})}::jsonb,
      now()
    )
    ON CONFLICT (checklist_date, item_key) DO UPDATE SET
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      bucket = EXCLUDED.bucket,
      href = EXCLUDED.href,
      position = EXCLUDED.position,
      source_payload = EXCLUDED.source_payload,
      updated_at = now()
  `;
}

function summarizeChecklist(items = []) {
  const total = items.length;
  const completed = items.filter((item) => item.isDone).length;
  const pending = Math.max(0, total - completed);

  return {
    total,
    completed,
    pending,
    percent: total ? Number(((completed / total) * 100).toFixed(1)) : 0,
    label:
      total && pending === 0
        ? 'Dia fechado'
        : total
          ? `${completed}/${total} feitos hoje`
          : 'Sem checklist montado'
  };
}

export async function getAdminDailyChecklistSnapshot({ date, cockpit } = {}) {
  await ensureAdminOpsTables();
  const effectiveDate = normalizeDate(date);
  const sql = getDb();
  const [sourceCockpit, pagesSnapshot] = await Promise.all([
    cockpit ? Promise.resolve(cockpit) : getCachedExecutiveCockpitSnapshot(),
    getCachedAdminPagesSnapshot()
  ]);
  const blueprint = buildChecklistBlueprint(sourceCockpit, pagesSnapshot);

  await Promise.all(blueprint.map((item) => upsertChecklistBlueprint(sql, effectiveDate, item)));

  const rows = await sql`
    SELECT item_key, title, description, bucket, href, position, is_done, done_at
    FROM admin_daily_checklist_items
    WHERE checklist_date = ${effectiveDate}::date
    ORDER BY position ASC, created_at ASC
  `;

  const statusMap = new Map(rows.map((row) => [row.item_key, row]));
  const items = blueprint.map((item) => {
    const row = statusMap.get(item.key);

    return {
      key: item.key,
      bucket: item.bucket || row?.bucket || '',
      title: item.title,
      description: item.description || row?.description || '',
      href: item.href || row?.href || '',
      position: item.position || row?.position || 0,
      isDone: Boolean(row?.is_done),
      doneAt: row?.done_at ? new Date(row.done_at).toISOString() : null
    };
  });

  return {
    date: effectiveDate,
    checkedAt: new Date().toISOString(),
    summary: summarizeChecklist(items),
    items
  };
}

export async function setAdminDailyChecklistItemStatus({ date, itemKey, isDone, actor = 'admin', cockpit } = {}) {
  await ensureAdminOpsTables();
  const effectiveDate = normalizeDate(date);
  const key = sanitizeText(itemKey, 120);

  if (!key) {
    throw new Error('itemKey obrigatorio para atualizar o checklist.');
  }

  const snapshot = await getAdminDailyChecklistSnapshot({ date: effectiveDate, cockpit });
  const target = snapshot.items.find((item) => item.key === key);

  if (!target) {
    throw new Error('Item do checklist nao encontrado para esta data.');
  }

  const sql = getDb();
  await sql`
    UPDATE admin_daily_checklist_items
    SET
      is_done = ${Boolean(isDone)},
      done_at = ${isDone ? new Date().toISOString() : null},
      updated_by = ${actor},
      updated_at = now()
    WHERE checklist_date = ${effectiveDate}::date
      AND item_key = ${key}
  `;

  return getAdminDailyChecklistSnapshot({ date: effectiveDate, cockpit });
}
