import 'server-only';

import { getAdminPagesSnapshot } from '@/lib/admin/pages-overview';
import { recordPageRecommendation } from '@/lib/admin/page-recommendation-history';
import { buildPagePreviewPayload } from '@/lib/admin/page-preview-dispatch';

export async function runDailyPagePreviewDispatchJob() {
  const snapshot = await getAdminPagesSnapshot({ limit: 8 });
  const candidates = snapshot.items
    .filter((item) => item.decision?.automation?.level !== 'recommendation')
    .slice(0, 4);

  const entries = [];
  for (const page of candidates) {
    try {
      const preview = buildPagePreviewPayload(page);
      const entry = await recordPageRecommendation({
        pagePath: page.pagePath,
        label: `Preview pronto — ${preview.summary}`,
        status: 'preview',
        detail: `${preview.detail} · confiança ${preview.confidence}`,
        actor: 'system'
      });
      entries.push({ page: page.pagePath, preview, entryId: entry?.id });
    } catch (error) {
      entries.push({
        page: page.pagePath,
        error: error instanceof Error ? error.message : 'Preview indisponivel'
      });
    }
  }

  return {
    jobKey: 'daily-page-preview-dispatch',
    status: entries.some((item) => item.error) ? 'degraded' : 'completed',
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    summary: `Foram preparados ${entries.length} previews operacionais de páginas.`,
    payload: {
      entries
    }
  };
}
