import { NextResponse } from 'next/server';
import { getAdminAiInsightsSnapshot } from '@/lib/admin/ai-control-center';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const snapshot = await getAdminAiInsightsSnapshot();
    return NextResponse.json({
      checkedAt: snapshot.checkedAt,
      summaries: snapshot.summaries,
      mission: snapshot.mission,
      insights: snapshot.insights,
      scores: snapshot.scores,
      promptBundle: snapshot.promptBundle,
      approvals: snapshot.approvals,
      automations: snapshot.automations,
      operations: snapshot.operations,
      executionCenter: snapshot.executionCenter,
      aiNarrative: snapshot.aiNarrative
    });
  } catch (error) {
    console.error('admin insights error', error);
    return NextResponse.json(
      {
        error: 'Falha ao carregar o módulo de IA / Insights.',
        detail: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
