import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

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

export async function GET(_request, { params }) {
  try {
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
      WHERE id = ${params.id}
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
        : null
    });
  } catch (error) {
    console.error('lead detail error', error);
    return NextResponse.json({ error: 'Falha ao carregar lead.' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const body = await request.json();
    const nextStatus = String(body?.leadStatus || '').trim();
    const hasNotes = Object.prototype.hasOwnProperty.call(body || {}, 'notes');
    const hasOwner = Object.prototype.hasOwnProperty.call(body || {}, 'ownerName');
    const hasNextContactAt = Object.prototype.hasOwnProperty.call(body || {}, 'nextContactAt');
    const hasLossReason = Object.prototype.hasOwnProperty.call(body || {}, 'lossReason');
    const notes = sanitize(body?.notes);
    const ownerName = sanitize(body?.ownerName, 160);
    const nextContactAt = parseDateTimeInput(body?.nextContactAt);
    const lossReason = sanitize(body?.lossReason, 500);

    if (nextStatus && !ALLOWED_STATUSES.has(nextStatus)) {
      return NextResponse.json({ error: 'Status inválido.' }, { status: 400 });
    }

    if (hasNextContactAt && body?.nextContactAt && !nextContactAt) {
      return NextResponse.json({ error: 'Próximo contato inválido.' }, { status: 400 });
    }

    const sql = getDb();
    await sql`
      UPDATE leads
      SET
        lead_status = COALESCE(${nextStatus || null}, lead_status),
        owner_name = CASE WHEN ${hasOwner} THEN ${ownerName || null} ELSE owner_name END,
        next_contact_at = CASE WHEN ${hasNextContactAt} THEN ${nextContactAt} ELSE next_contact_at END,
        loss_reason = CASE
          WHEN ${hasLossReason} THEN ${lossReason || null}
          WHEN ${nextStatus || null} = 'perdido' THEN loss_reason
          WHEN ${nextStatus || null} IS NOT NULL AND ${nextStatus || null} <> 'perdido' THEN NULL
          ELSE loss_reason
        END,
        notes = CASE WHEN ${hasNotes} THEN ${notes || null} ELSE notes END,
        updated_at = now()
      WHERE id = ${params.id}
    `;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('update lead error', error);
    return NextResponse.json({ error: 'Falha ao atualizar lead.' }, { status: 500 });
  }
}
