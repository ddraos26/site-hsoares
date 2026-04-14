import { NextResponse } from 'next/server';
import { getAdminOperationalSnapshot } from '@/lib/admin/operational-dashboard';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const snapshot = await getAdminOperationalSnapshot();
    return NextResponse.json(snapshot);
  } catch (error) {
    console.error('admin operations error', error);
    return NextResponse.json(
      {
        error: 'Falha ao carregar a operação guiada.',
        detail: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

