import { NextResponse } from 'next/server';
import { getGoogleAdsCampaignSnapshot, syncGoogleAdsCampaignSnapshots } from '@/lib/admin/integrations/google-ads/google-ads-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const snapshot = await getGoogleAdsCampaignSnapshot();
    return NextResponse.json(snapshot);
  } catch (error) {
    console.error('dashboard google ads error', error);
    return NextResponse.json({ error: 'Falha ao carregar a leitura do Google Ads.' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const result = await syncGoogleAdsCampaignSnapshots();
    return NextResponse.json(result);
  } catch (error) {
    console.error('dashboard google ads sync error', error);
    return NextResponse.json({ error: 'Falha ao sincronizar o Google Ads no banco.' }, { status: 500 });
  }
}
