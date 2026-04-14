import { NextResponse } from 'next/server';
import { getAdminDecisionEngineSnapshot } from '@/lib/admin/decision-engine';
import {
  defaultExecutionGuardrailPolicy,
  resetExecutionGuardrailPolicy,
  saveExecutionGuardrailPolicy
} from '@/lib/admin/execution-guardrails';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const snapshot = await getAdminDecisionEngineSnapshot();
    return NextResponse.json({
      checkedAt: snapshot.checkedAt,
      rules: snapshot.rules,
      guardrails: snapshot.guardrails,
      scores: snapshot.scores,
      cost: snapshot.cost
    });
  } catch (error) {
    console.error('admin rules error', error);
    return NextResponse.json(
      {
        error: 'Falha ao carregar o motor de regras.',
        detail: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const actor = String(body?.actor || 'admin');
    const reset = Boolean(body?.reset);

    const guardrails = reset
      ? await resetExecutionGuardrailPolicy()
      : await saveExecutionGuardrailPolicy({
          policy: body?.policy || defaultExecutionGuardrailPolicy,
          actor
        });

    const snapshot = await getAdminDecisionEngineSnapshot();

    return NextResponse.json({
      ok: true,
      checkedAt: snapshot.checkedAt,
      rules: snapshot.rules,
      guardrails,
      scores: snapshot.scores,
      cost: snapshot.cost
    });
  } catch (error) {
    console.error('admin rules update error', error);
    return NextResponse.json(
      {
        error: 'Falha ao salvar a política de execução.',
        detail: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
