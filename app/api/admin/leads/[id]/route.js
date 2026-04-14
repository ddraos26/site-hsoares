import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { resolveLeadAutomationState } from '@/lib/admin/lead-automation';
import { recordLeadActivity, readRecentLeadActivities } from '@/lib/admin/lead-activity-store';
import { getAdminNextFocus } from '@/lib/admin/next-focus';
import { syncLeadTaskState } from '@/lib/admin/task-store';

export const dynamic = 'force-dynamic';

const ALLOWED_STATUSES = new Set(['novo', 'em_contato', 'ganho', 'perdido']);

function sanitize(value, limit = 5000) {
  return String(value || '').trim().slice(0, limit);
}

function parseDateTimeInput(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

function buildChangeMessages(previousLead, nextLead) {
  const changes = [];

  if (previousLead.lead_status !== nextLead.lead_status) {
    changes.push(`Status: ${previousLead.lead_status} -> ${nextLead.lead_status}`);
  }

  if ((previousLead.owner_name || '') !== (nextLead.owner_name || '')) {
    changes.push(`Responsável: ${previousLead.owner_name || 'sem dono'} -> ${nextLead.owner_name || 'sem dono'}`);
  }

  if ((previousLead.next_contact_at || '') !== (nextLead.next_contact_at || '')) {
    changes.push('Próximo contato atualizado');
  }

  if ((previousLead.loss_reason || '') !== (nextLead.loss_reason || '')) {
    changes.push(`Motivo da perda: ${nextLead.loss_reason || 'limpo'}`);
  }

  if ((previousLead.notes || '') !== (nextLead.notes || '')) {
    changes.push('Observações internas atualizadas');
  }

  return changes;
}

export async function GET(_request, { params }) {
  try {
    const routeParams = await params;
    const leadId = routeParams?.id;
    const sql = getDb();

    const [lead] = await sql`
      SELECT
        id,
        nome,
        whatsapp,
        email,
        product_slug,
        page_path,
        click_id,
        session_id,
        utm_source,
        utm_medium,
        utm_campaign,
        referrer,
        user_agent,
        ip_address,
        lead_status,
        owner_name,
        next_contact_at,
        loss_reason,
        notes,
        created_at,
        updated_at
      FROM leads
      WHERE id = ${leadId}
      LIMIT 1
    `;

    if (!lead) {
      return NextResponse.json({ error: 'Lead não encontrado.' }, { status: 404 });
    }

    let detailEvent = null;

    if (lead.click_id) {
      [detailEvent] = await sql`
        SELECT id, event_type, payload, created_at
        FROM conversion_events
        WHERE event_type = 'lead_submit'
          AND click_id = ${lead.click_id}
        ORDER BY created_at DESC
        LIMIT 1
      `;
    }

    if (!detailEvent && lead.session_id) {
      [detailEvent] = await sql`
        SELECT id, event_type, payload, created_at
        FROM conversion_events
        WHERE event_type = 'lead_submit'
          AND session_id = ${lead.session_id}
          AND (${lead.product_slug || null}::text IS NULL OR product_slug = ${lead.product_slug || null})
        ORDER BY created_at DESC
        LIMIT 1
      `;
    }

    const payload = detailEvent?.payload || {};
    let attachments = [];

    try {
      attachments = await sql`
        SELECT id, file_name, content_type, file_size_bytes, created_at
        FROM lead_attachments
        WHERE lead_id = ${lead.id}
        ORDER BY created_at ASC
      `;
    } catch (error) {
      if (!String(error?.message || '').includes('lead_attachments')) {
        throw error;
      }
    }

    const activities = await readRecentLeadActivities({ leadId: lead.id, limit: 12 });

    return NextResponse.json({
      lead,
      attachments: attachments.map((attachment) => ({
        id: attachment.id,
        name: attachment.file_name,
        contentType: attachment.content_type,
        sizeBytes: attachment.file_size_bytes,
        createdAt: attachment.created_at,
        url: `/api/admin/leads/${lead.id}/attachments/${attachment.id}`
      })),
      detailEvent: detailEvent
        ? {
            id: detailEvent.id,
            eventType: detailEvent.event_type,
            createdAt: detailEvent.created_at,
            leadType: payload?.leadType || '',
            details: Array.isArray(payload?.details) ? payload.details : [],
            attachmentNames: Array.isArray(payload?.attachmentNames) ? payload.attachmentNames : [],
            attachments: attachments.map((attachment) => ({
              id: attachment.id,
              name: attachment.file_name,
              contentType: attachment.content_type,
              sizeBytes: attachment.file_size_bytes,
              createdAt: attachment.created_at,
              url: `/api/admin/leads/${lead.id}/attachments/${attachment.id}`
            }))
          }
        : null,
      activities
    });
  } catch (error) {
    console.error('lead detail error', error);
    return NextResponse.json({ error: 'Falha ao carregar lead.' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const routeParams = await params;
    const leadId = routeParams?.id;
    const body = await request.json();
    const nextStatus = String(body?.leadStatus || '').trim();
    const normalizedStatus = nextStatus || null;
    const hasNotes = Object.prototype.hasOwnProperty.call(body || {}, 'notes');
    const hasOwner = Object.prototype.hasOwnProperty.call(body || {}, 'ownerName');
    const hasNextContactAt = Object.prototype.hasOwnProperty.call(body || {}, 'nextContactAt');
    const hasLossReason = Object.prototype.hasOwnProperty.call(body || {}, 'lossReason');
    const notes = sanitize(body?.notes);
    const ownerName = sanitize(body?.ownerName, 160);
    const nextContactAt = parseDateTimeInput(body?.nextContactAt);
    const lossReason = sanitize(body?.lossReason, 500);
    const actionKey = sanitize(body?.actionKey, 120);
    const actionLabel = sanitize(body?.actionLabel, 160);

    if (nextStatus && !ALLOWED_STATUSES.has(nextStatus)) {
      return NextResponse.json({ error: 'Status inválido.' }, { status: 400 });
    }

    if (hasNextContactAt && body?.nextContactAt && !nextContactAt) {
      return NextResponse.json({ error: 'Próximo contato inválido.' }, { status: 400 });
    }

    const sql = getDb();
    const [currentLead] = await sql`
      SELECT
        id,
        lead_status,
        owner_name,
        next_contact_at,
        loss_reason,
        notes,
        nome,
        product_slug,
        updated_at
      FROM leads
      WHERE id = ${leadId}
      LIMIT 1
    `;

    if (!currentLead) {
      return NextResponse.json({ error: 'Lead não encontrado.' }, { status: 404 });
    }

    const mergedInput = {
      leadStatus: normalizedStatus || currentLead.lead_status,
      ownerName: hasOwner ? ownerName : currentLead.owner_name,
      nextContactAt: hasNextContactAt ? nextContactAt : currentLead.next_contact_at,
      lossReason: hasLossReason ? lossReason : currentLead.loss_reason,
      notes: hasNotes ? notes : currentLead.notes
    };

    const automation = resolveLeadAutomationState(mergedInput);
    const finalStatus = automation.effectiveStatus;
    const finalOwner = hasOwner ? ownerName || null : currentLead.owner_name;
    const finalNotes = hasNotes ? notes || null : currentLead.notes;
    const finalNextContactAt = hasNextContactAt
      ? automation.effectiveNextContactAt || null
      : finalStatus === 'ganho' || finalStatus === 'perdido'
        ? null
        : currentLead.next_contact_at;
    const finalLossReason =
      finalStatus === 'perdido'
        ? hasLossReason
          ? automation.effectiveLossReason || null
          : currentLead.loss_reason
        : null;

    const [updatedLead] = await sql`
      UPDATE leads
      SET
        lead_status = ${finalStatus},
        owner_name = ${finalOwner || null},
        next_contact_at = ${finalNextContactAt || null}::timestamptz,
        loss_reason = ${finalLossReason || null},
        notes = ${finalNotes || null},
        updated_at = now()
      WHERE id = ${leadId}
      RETURNING
        id,
        nome,
        product_slug,
        lead_status,
        owner_name,
        next_contact_at,
        loss_reason,
        notes,
        updated_at
    `;

    const changes = buildChangeMessages(currentLead, updatedLead);

    await syncLeadTaskState({
      leadId: updatedLead.id,
      leadStatus: updatedLead.lead_status,
      ownerName: updatedLead.owner_name,
      nextContactAt: updatedLead.next_contact_at,
      notes: updatedLead.notes,
      actor: 'admin',
      note: changes.join(' · ') || actionLabel || 'Lead reorganizado pela operação.',
      title: `Responder ${updatedLead.nome || updatedLead.product_slug || 'lead'}`,
      productSlug: updatedLead.product_slug,
      leadName: updatedLead.nome
    });

    if (changes.length || actionKey || automation.messages.length) {
      await recordLeadActivity({
        leadId: updatedLead.id,
        eventType: actionKey || 'lead_update',
        title: actionLabel || 'Lead atualizado',
        detail: changes.join(' · ') || 'Atualização operacional aplicada no lead.',
        payload: {
          automationMessages: automation.messages,
          previousStatus: currentLead.lead_status,
          nextStatus: updatedLead.lead_status
        },
        actor: 'admin'
      });
    }

    const nextFocus = await getAdminNextFocus({ basePath: '/admin' });
    return NextResponse.json({ ok: true, lead: updatedLead, automation, nextFocus });
  } catch (error) {
    console.error('update lead error', error);
    return NextResponse.json({ error: 'Falha ao atualizar lead.' }, { status: 500 });
  }
}
