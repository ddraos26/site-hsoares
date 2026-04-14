import { NextResponse } from 'next/server';
import { getCachedSearchConsoleOpportunitySnapshot } from '@/lib/admin/server-snapshot-cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const snapshot = await getCachedSearchConsoleOpportunitySnapshot();
    return NextResponse.json(snapshot);
  } catch (error) {
    console.error('admin search-console intelligence error', error);
    return NextResponse.json(
      {
        error: 'Falha ao carregar a inteligência orgânica.',
        detail: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
