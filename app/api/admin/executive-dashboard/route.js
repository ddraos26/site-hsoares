import { NextResponse } from 'next/server';
import { getCachedExecutiveDashboardSnapshot } from '@/lib/admin/server-snapshot-cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const snapshot = await getCachedExecutiveDashboardSnapshot();
    return NextResponse.json(snapshot);
  } catch (error) {
    console.error('admin executive dashboard error', error);
    return NextResponse.json(
      {
        error: 'Falha ao carregar o dashboard executivo.',
        detail: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
