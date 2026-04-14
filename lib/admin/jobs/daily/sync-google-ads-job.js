import 'server-only';

import { syncGoogleAdsCampaignSnapshots } from '@/lib/admin/integrations/google-ads/google-ads-service';

export async function runDailyGoogleAdsSyncJob() {
  const startedAt = new Date().toISOString();

  try {
    const snapshot = await syncGoogleAdsCampaignSnapshots({});

    return {
      jobKey: 'daily-google-ads-sync',
      status: snapshot.status === 'completed' ? 'completed' : snapshot.status === 'blocked' ? 'degraded' : snapshot.status || 'completed',
      startedAt,
      finishedAt: new Date().toISOString(),
      summary: snapshot.reason,
      recordsWritten: snapshot.snapshotsPersisted || snapshot.campaignsPersisted || 0,
      payload: snapshot
    };
  } catch (error) {
    return {
      jobKey: 'daily-google-ads-sync',
      status: 'failed',
      startedAt,
      finishedAt: new Date().toISOString(),
      summary: error instanceof Error ? error.message : 'Falha desconhecida ao sincronizar Google Ads.',
      recordsWritten: 0,
      payload: null
    };
  }
}
