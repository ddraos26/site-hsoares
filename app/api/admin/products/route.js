import { NextResponse } from 'next/server';
import { getCachedAdminProductsSnapshot } from '@/lib/admin/server-snapshot-cache';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const snapshot = await getCachedAdminProductsSnapshot({
      from: searchParams.get('from'),
      to: searchParams.get('to'),
      q: searchParams.get('q')
    });

    return NextResponse.json(snapshot);
  } catch (error) {
    console.error('admin products error', error);
    return NextResponse.json({ error: 'Falha ao carregar produtos.' }, { status: 500 });
  }
}
