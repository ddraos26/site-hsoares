import { NextResponse } from 'next/server';
import { getCachedBehaviorIntelligenceSnapshot } from '@/lib/admin/server-snapshot-cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const snapshot = await getCachedBehaviorIntelligenceSnapshot();
    return NextResponse.json(snapshot);
  } catch (error) {
    console.error('admin analytics intelligence error', error);
    return NextResponse.json(
      {
        error: 'Falha ao carregar o módulo de analytics/comportamento.',
        detail: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
