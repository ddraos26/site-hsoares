import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

const ALLOWED_STATUSES = new Set(['novo', 'em_contato', 'ganho', 'perdido']);

function sanitize(value, limit = 5000) {
  return String(value || '').trim().slice(0, limit);
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

    return NextResponse.json({
      lead,
      detailEvent: detailEvent
        ? {
            id: detailEvent.id,
            eventType: detailEvent.event_type,
            createdAt: detailEvent.created_at,
            leadType: payload?.leadType || '',
            details: Array.isArray(payload?.details) ? payload.details : [],
            attachmentNames: Array.isArray(payload?.attachmentNames) ? payload.attachmentNames : []
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
    const notes = sanitize(body?.notes);

    if (nextStatus && !ALLOWED_STATUSES.has(nextStatus)) {
      return NextResponse.json({ error: 'Status inválido.' }, { status: 400 });
    }

    const sql = getDb();
    await sql`
      UPDATE leads
      SET
        lead_status = COALESCE(${nextStatus || null}, lead_status),
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
