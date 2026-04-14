import { NextResponse } from 'next/server';
import { getAdminCampaignsSnapshot } from '@/lib/admin/campaigns-overview';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const payload = await getAdminCampaignsSnapshot({
      from: searchParams.get('from') || undefined,
      to: searchParams.get('to') || undefined,
      q: searchParams.get('q') || undefined
    });

    return NextResponse.json(payload);
  } catch (error) {
    console.error('admin campaigns error', error);
    return NextResponse.json({ error: 'Falha ao carregar campanhas.' }, { status: 500 });
  }
}
