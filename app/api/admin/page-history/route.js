import { NextResponse } from 'next/server';

import { recordPageRecommendation, readPageRecommendations } from '@/lib/admin/page-recommendation-history';

export const dynamic = 'error';

export async function GET(request) {
  const url = new URL(request.url);
  const pagePath = url.searchParams.get('pagePath');

  if (!pagePath) {
    return NextResponse.json({ error: 'pagePath é obrigatório.' }, { status: 400 });
  }

  try {
    const entries = await readPageRecommendations(pagePath);
    return NextResponse.json({ entries });
  } catch (error) {
    console.error('page history read error', error);
    return NextResponse.json({ error: 'Falha ao ler histórico.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const pagePath = String(body?.pagePath || '').trim();
    const label = String(body?.label || '').trim();
    const status = String(body?.status || '').trim() || 'suggested';
    const detail = String(body?.detail || '').trim();
    const actor = String(body?.actor || 'admin').trim();

    if (!pagePath || !label) {
      return NextResponse.json({ error: 'pagePath e label sao obrigatorios.' }, { status: 400 });
    }

    const entry = await recordPageRecommendation({ pagePath, label, status, detail, actor });
    return NextResponse.json({ entry });
  } catch (error) {
    console.error('page history write error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 });
  }
}
