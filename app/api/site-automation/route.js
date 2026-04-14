import { NextResponse } from 'next/server';
import { readSiteAutomationState } from '@/lib/site-automation';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const previewToken = request.nextUrl.searchParams.get('preview') || '';
    const state = await readSiteAutomationState({ previewToken });
    return NextResponse.json({
      ok: true,
      state,
      previewToken: previewToken || null,
      checkedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('site automation state error', error);
    return NextResponse.json(
      {
        error: 'Falha ao carregar automações seguras do site.',
        detail: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
