import { NextResponse } from 'next/server';
import { getRevenueIntelligenceSnapshot } from '@/lib/admin/revenue-intelligence';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const snapshot = await getRevenueIntelligenceSnapshot();
    return NextResponse.json(snapshot);
  } catch (error) {
    console.error('admin revenue intelligence error', error);
    return NextResponse.json(
      {
        error: 'Falha ao carregar a inteligência de mídia e fechamento.',
        detail: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
