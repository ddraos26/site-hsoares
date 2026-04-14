import { NextResponse } from 'next/server';
import { getAdminPagesSnapshot } from '@/lib/admin/pages-overview';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const snapshot = await getAdminPagesSnapshot({
      from: searchParams.get('from'),
      to: searchParams.get('to'),
      q: searchParams.get('q')
    });

    return NextResponse.json(snapshot);
  } catch (error) {
    console.error('admin pages error', error);
    return NextResponse.json({ error: 'Falha ao carregar páginas.' }, { status: 500 });
  }
}
