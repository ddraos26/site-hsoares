import { NextResponse } from 'next/server';
import { getAdminDecisionEngineSnapshot } from '@/lib/admin/decision-engine';
import { getAdminAiReadinessSnapshot } from '@/lib/admin/ai-readiness';
import { aiUsagePolicy } from '@/lib/admin/ai-usage-policy';
import { getAdminTrackingQualitySnapshot } from '@/lib/admin/tracking-quality';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [snapshot, aiReadiness, trackingQuality] = await Promise.all([
      getAdminDecisionEngineSnapshot(),
      getAdminAiReadinessSnapshot(),
      getAdminTrackingQualitySnapshot()
    ]);
    return NextResponse.json({
      checkedAt: snapshot.checkedAt,
      cost: snapshot.cost,
      promptBundle: snapshot.promptBundle,
      aiUsagePolicy,
      aiReadiness,
      trackingQuality
    });
  } catch (error) {
    console.error('admin ai cost error', error);
    return NextResponse.json(
      {
        error: 'Falha ao carregar o controle de custo da IA.',
        detail: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
