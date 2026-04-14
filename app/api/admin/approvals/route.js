import { NextResponse } from 'next/server';
import { getAdminAiApprovalsSnapshot } from '@/lib/admin/ai-control-center';
import { getAdminDecisionEngineSnapshot } from '@/lib/admin/decision-engine';
import { getAdminNextFocus } from '@/lib/admin/next-focus';
import { executeApprovalAutomation } from '@/lib/admin/approval-execution';
import { recordApprovalDecision } from '@/lib/admin/approval-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const snapshot = await getAdminAiApprovalsSnapshot();
    return NextResponse.json({
      checkedAt: snapshot.checkedAt,
      approvals: snapshot.approvals,
      aiNarrative: snapshot.aiNarrative
    });
  } catch (error) {
    console.error('admin approvals error', error);
    return NextResponse.json(
      {
        error: 'Falha ao carregar a fila de aprovações.',
        detail: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const id = String(body?.id || '').trim();
    const status = String(body?.status || '').trim();
    const rationale = String(body?.rationale || '').trim();
    const title = String(body?.title || '').trim();

    if (!id || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
    }

    const snapshot = await getAdminDecisionEngineSnapshot();
    const approval =
      (snapshot.approvals.pending || []).find((item) => item.id === id) ||
      (snapshot.approvals.history || []).find((item) => item.id === id) ||
      null;

    const entry = await recordApprovalDecision({
      id,
      status,
      rationale,
      title,
      actor: 'admin'
    });

    let execution = null;

    if (approval) {
      execution = await executeApprovalAutomation({
        approval,
        decisionStatus: status,
        actor: 'admin',
        rationale
      });
    }

    const nextFocus = await getAdminNextFocus({ basePath: '/admin' });
    return NextResponse.json({ ok: true, entry, execution, nextFocus });
  } catch (error) {
    console.error('admin approval decision error', error);
    return NextResponse.json(
      {
        error: 'Falha ao registrar a decisão de aprovação.',
        detail: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
