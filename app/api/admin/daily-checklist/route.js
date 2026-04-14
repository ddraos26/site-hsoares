import { NextResponse } from 'next/server';
import {
  getAdminDailyChecklistSnapshot,
  setAdminDailyChecklistItemStatus
} from '@/lib/admin/daily-checklist-store';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = String(searchParams.get('date') || '').trim() || undefined;
    const snapshot = await getAdminDailyChecklistSnapshot({ date });
    return NextResponse.json(snapshot);
  } catch (error) {
    console.error('admin daily checklist error', error);
    return NextResponse.json(
      {
        error: 'Falha ao carregar o checklist diario.',
        detail: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const itemKey = String(body?.itemKey || '').trim();
    const isDone = body?.isDone === true;
    const date = String(body?.date || '').trim() || undefined;

    if (!itemKey) {
      return NextResponse.json({ error: 'Payload invalido.' }, { status: 400 });
    }

    const snapshot = await setAdminDailyChecklistItemStatus({
      date,
      itemKey,
      isDone,
      actor: 'admin'
    });

    return NextResponse.json({ ok: true, snapshot });
  } catch (error) {
    console.error('admin daily checklist state error', error);
    return NextResponse.json(
      {
        error: 'Falha ao atualizar o checklist diario.',
        detail: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
