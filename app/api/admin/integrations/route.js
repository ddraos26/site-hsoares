import { NextResponse } from 'next/server';
import { getAdminIntegrationSnapshot } from '@/lib/admin/integration-status';
import { getAdminAiReadinessSnapshot } from '@/lib/admin/ai-readiness';
import { getAdminTrackingQualitySnapshot } from '@/lib/admin/tracking-quality';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [snapshot, aiReadiness, trackingQuality] = await Promise.all([
      getAdminIntegrationSnapshot(),
      getAdminAiReadinessSnapshot(),
      getAdminTrackingQualitySnapshot()
    ]);
    return NextResponse.json({
      ...snapshot,
      aiReadiness,
      trackingQuality
    });
  } catch (error) {
    console.error('admin integrations error', error);
    return NextResponse.json(
      {
        error: 'Falha ao carregar o status das integrações.',
        detail: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
