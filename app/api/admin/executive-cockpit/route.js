import { NextResponse } from 'next/server';
import { getAdminAiCockpitSnapshot } from '@/lib/admin/ai-control-center';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const snapshot = await getAdminAiCockpitSnapshot();
    return NextResponse.json(snapshot);
  } catch (error) {
    console.error('admin executive cockpit error', error);
    return NextResponse.json(
      {
        error: 'Falha ao carregar o centro de decisão.',
        detail: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
