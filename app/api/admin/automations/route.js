import { NextResponse } from 'next/server';
import { getAdminDecisionEngineSnapshot } from '@/lib/admin/decision-engine';
import {
  dispatchAutomationOperation,
  publishAutomationOperationPreview,
  rollbackAutomationOperation
} from '@/lib/admin/operation-dispatch';
import { runAdminOpsJobCycle } from '@/lib/admin/job-runner';
import { adminOperatingMode, isAdminAdvisoryOnlyMode } from '@/lib/admin/operating-mode';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const snapshot = await getAdminDecisionEngineSnapshot();
    return NextResponse.json({
      checkedAt: snapshot.checkedAt,
      automations: snapshot.automations,
      jobs: snapshot.jobs,
      operations: snapshot.operations,
      mission: snapshot.mission,
      approvals: snapshot.approvals,
      guardrails: snapshot.guardrails,
      cost: snapshot.cost
    });
  } catch (error) {
    console.error('admin automations error', error);
    return NextResponse.json(
      {
        error: 'Falha ao carregar o módulo de automações.',
        detail: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const action = String(body?.action || '').trim();

    if (action === 'run-job-cycle') {
      const cycle = await runAdminOpsJobCycle({ triggerType: 'manual', actor: 'admin' });
      const snapshot = await getAdminDecisionEngineSnapshot();

      return NextResponse.json({
        ok: true,
        cycle,
        checkedAt: snapshot.checkedAt,
        automations: snapshot.automations,
        jobs: snapshot.jobs,
        operations: snapshot.operations,
        mission: snapshot.mission,
        approvals: snapshot.approvals,
        guardrails: snapshot.guardrails,
        cost: snapshot.cost
      });
    }

    if (isAdminAdvisoryOnlyMode()) {
      return NextResponse.json(
        {
          error: `${adminOperatingMode.label}: execucao manual desativada.`,
          detail: adminOperatingMode.summary
        },
        { status: 409 }
      );
    }

    if (action === 'rollback') {
      const id = String(body?.id || '').trim();

      if (!id) {
        return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
      }

      const rollback = await rollbackAutomationOperation({ id, actor: 'admin' });
      const snapshot = await getAdminDecisionEngineSnapshot();

      return NextResponse.json({
        ok: true,
        rollback,
        checkedAt: snapshot.checkedAt,
        automations: snapshot.automations,
        jobs: snapshot.jobs,
        operations: snapshot.operations,
        mission: snapshot.mission,
        approvals: snapshot.approvals,
        guardrails: snapshot.guardrails,
        cost: snapshot.cost
      });
    }

    if (action === 'publish-preview') {
      const id = String(body?.id || '').trim();

      if (!id) {
        return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
      }

      const publish = await publishAutomationOperationPreview({ id, actor: 'admin' });
      const snapshot = await getAdminDecisionEngineSnapshot();

      return NextResponse.json({
        ok: true,
        publish,
        checkedAt: snapshot.checkedAt,
        automations: snapshot.automations,
        jobs: snapshot.jobs,
        operations: snapshot.operations,
        mission: snapshot.mission,
        approvals: snapshot.approvals,
        guardrails: snapshot.guardrails,
        cost: snapshot.cost
      });
    }

    const id = String(body?.id || '').trim();

    if (!id) {
      return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
    }

    const dispatch = await dispatchAutomationOperation({ id, actor: 'admin' });
    const snapshot = await getAdminDecisionEngineSnapshot();

    return NextResponse.json({
      ok: true,
      dispatch,
      checkedAt: snapshot.checkedAt,
      automations: snapshot.automations,
      jobs: snapshot.jobs,
      operations: snapshot.operations,
      mission: snapshot.mission,
      approvals: snapshot.approvals,
      guardrails: snapshot.guardrails,
      cost: snapshot.cost
    });
  } catch (error) {
    console.error('admin automations dispatch error', error);
    return NextResponse.json(
      {
        error: 'Falha ao disparar a operação.',
        detail: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
