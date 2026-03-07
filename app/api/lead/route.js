import { NextResponse } from 'next/server';
import { registerEventInDb } from '@/lib/analytics';
import { getDb } from '@/lib/db';
import { getClientIp, hasJsonContentType, isAllowedOrigin } from '@/lib/request';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

function sanitize(value) {
  return String(value || '').trim();
}

function sanitizeLong(value, limit = 3000) {
  return String(value || '').trim().slice(0, limit);
}

function normalizePhone(value) {
  return value.replace(/\D/g, '');
}

function normalizeDetails(details) {
  if (!Array.isArray(details)) {
    return [];
  }

  return details
    .map((item) => ({
      label: sanitize(item?.label).slice(0, 120),
      value: sanitizeLong(item?.value)
    }))
    .filter((item) => item.label && item.value);
}

function normalizeAttachments(attachments) {
  const source = Array.isArray(attachments) ? attachments : attachments ? [attachments] : [];

  return source
    .map((attachment) => {
      if (!attachment || typeof attachment !== 'object') {
        return null;
      }

      const name = sanitize(attachment.name).slice(0, 160);
      const type = sanitize(attachment.type).slice(0, 120);
      const contentBase64 = String(attachment.contentBase64 || '').trim();
      const fileSizeBytes = Number(attachment.fileSizeBytes || 0);

      if (!name || !contentBase64) {
        return null;
      }

      return {
        name,
        type,
        contentBase64,
        fileSizeBytes: Number.isFinite(fileSizeBytes) && fileSizeBytes > 0 ? Math.round(fileSizeBytes) : null
      };
    })
    .filter(Boolean);
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function sendLeadEmail(payload) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return;
  }

  const toEmail = process.env.LEAD_TO_EMAIL || 'rodolfo@hsoaresseguros.com.br';
  const fromEmail = process.env.LEAD_FROM_EMAIL || 'H Soares Seguros <onboarding@resend.dev>';
  const publicReplyTo = process.env.LEAD_REPLY_TO_EMAIL || 'contato@hsoaresseguros.com.br';

  const lines = [
    ['Nome', payload.nome || 'Não informado'],
    ['WhatsApp', payload.whatsapp || 'Não informado'],
    ['E-mail', payload.email || 'Não informado'],
    ['Produto', payload.productSlug || 'Não informado'],
    ['Página', payload.pagePath || 'Não informada'],
    ['Click ID', payload.clickId || 'Não informado'],
    ['Tipo de lead', payload.leadType || 'Não informado'],
    ['UTM Source', payload.utmSource || ''],
    ['UTM Medium', payload.utmMedium || ''],
    ['UTM Campaign', payload.utmCampaign || '']
  ];

  const detailLines = (payload.details || []).map((item) => [item.label, item.value]);

  const html = [...lines, ...detailLines]
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px;border:1px solid #ddd;font-weight:600;">${escapeHtml(label)}</td><td style="padding:8px;border:1px solid #ddd;">${escapeHtml(value)}</td></tr>`
    )
    .join('');

  const emailPayload = {
    from: fromEmail,
    to: [toEmail],
    subject: `Novo lead ${payload.productSlug || 'site'}`,
    html: `<table style="border-collapse:collapse;width:100%;max-width:700px">${html}</table>`,
    reply_to: [publicReplyTo]
  };

  if (payload.attachments?.length) {
    emailPayload.attachments = payload.attachments.map((attachment) => ({
      filename: attachment.name,
      content: attachment.contentBase64,
      contentType: attachment.type || undefined
    }));
  }

  let response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(emailPayload)
  });

  if (!response.ok && emailPayload.attachments) {
    const fallbackPayload = { ...emailPayload };
    delete fallbackPayload.attachments;

    response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(fallbackPayload)
    });
  }

  if (!response.ok) {
    throw new Error('Falha ao enviar e-mail do lead.');
  }
}

export async function POST(request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Origem não autorizada.' }, { status: 403 });
  }

  if (!hasJsonContentType(request)) {
    return NextResponse.json({ error: 'Content-Type inválido.' }, { status: 415 });
  }

  const ip = getClientIp(request);
  const gate = rateLimit({ key: `lead:${ip}`, limit: 30, windowMs: 60_000 });
  if (!gate.allowed) {
    return NextResponse.json({ error: 'Limite de envio excedido.' }, { status: 429 });
  }

  const body = await request.json();

  if (sanitize(body?.empresa_site)) {
    return NextResponse.json({ ok: true });
  }

  const payload = {
    nome: sanitize(body?.nome),
    whatsapp: sanitize(body?.whatsapp),
    email: sanitize(body?.email),
    productSlug: sanitize(body?.productSlug),
    pagePath: sanitize(body?.pagePath),
    clickId: sanitize(body?.clickId),
    sessionId: sanitize(body?.sessionId),
    utmSource: sanitize(body?.utm_source),
    utmMedium: sanitize(body?.utm_medium),
    utmCampaign: sanitize(body?.utm_campaign),
    referrer: sanitize(body?.referrer),
    leadType: sanitize(body?.leadType)
  };
  const details = normalizeDetails(body?.details);
  const attachments = normalizeAttachments(body?.attachments || body?.attachment);
  if (attachments.length > 12) {
    return NextResponse.json({ error: 'Limite de 12 arquivos por envio.' }, { status: 413 });
  }

  const cleanPhone = normalizePhone(payload.whatsapp);
  if (payload.whatsapp && (cleanPhone.length < 10 || cleanPhone.length > 13)) {
    return NextResponse.json({ error: 'WhatsApp inválido.' }, { status: 400 });
  }

  let totalAttachmentBytes = 0;
  for (const attachment of attachments) {
    const attachmentBytes = Buffer.byteLength(attachment.contentBase64, 'base64');
    if (attachmentBytes > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'O arquivo deve ter no máximo 5 MB.' }, { status: 413 });
    }
    totalAttachmentBytes += attachmentBytes;
  }

  if (totalAttachmentBytes > 20 * 1024 * 1024) {
    return NextResponse.json({ error: 'O total de anexos deve ter no máximo 20 MB.' }, { status: 413 });
  }

  try {
    const hasDatabase = Boolean(process.env.DATABASE_URL);
    const hasEmail = Boolean(process.env.RESEND_API_KEY);

    if (!hasDatabase && !hasEmail) {
      return NextResponse.json({ error: 'Captação temporariamente indisponível.' }, { status: 503 });
    }

    if (!hasDatabase && hasEmail) {
      await sendLeadEmail({ ...payload, details, attachments });
      return NextResponse.json({ ok: true, skipped: 'DATABASE_URL ausente' });
    }

    const sql = getDb();

    const [lead] = await sql`
      INSERT INTO leads (
        nome, whatsapp, email, product_slug, page_path, click_id, session_id,
        utm_source, utm_medium, utm_campaign, referrer, user_agent, ip_address
      ) VALUES (
        ${payload.nome || null}, ${payload.whatsapp || null}, ${payload.email || null}, ${payload.productSlug || null}, ${payload.pagePath || null},
        ${payload.clickId || null}, ${payload.sessionId || null}, ${payload.utmSource || null}, ${payload.utmMedium || null}, ${payload.utmCampaign || null},
        ${payload.referrer || null}, ${sanitize(request.headers.get('user-agent')) || null}, ${ip}
      )
      RETURNING id
    `;

    if (attachments.length) {
      await sql`
        CREATE TABLE IF NOT EXISTS lead_attachments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
          file_name TEXT NOT NULL,
          content_type TEXT,
          file_size_bytes INTEGER,
          content_base64 TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;

      for (const attachment of attachments) {
        await sql`
          INSERT INTO lead_attachments (
            lead_id,
            file_name,
            content_type,
            file_size_bytes,
            content_base64
          ) VALUES (
            ${lead.id},
            ${attachment.name},
            ${attachment.type || null},
            ${attachment.fileSizeBytes || Buffer.byteLength(attachment.contentBase64, 'base64')},
            ${attachment.contentBase64}
          )
        `;
      }
    }

    await registerEventInDb({
      eventType: 'lead_submit',
      pagePath: payload.pagePath,
      productSlug: payload.productSlug,
      clickId: payload.clickId,
      sessionId: payload.sessionId,
      utmSource: payload.utmSource,
      utmMedium: payload.utmMedium,
      utmCampaign: payload.utmCampaign,
      referrer: payload.referrer,
      userAgent: sanitize(request.headers.get('user-agent')),
      ipAddress: ip,
      payload: {
        leadType: payload.leadType || 'micro_capture',
        details,
        attachmentNames: attachments.map((attachment) => attachment.name),
        attachmentCount: attachments.length
      }
    });

    try {
      await sendLeadEmail({ ...payload, details, attachments });
    } catch (emailError) {
      console.error('lead email warning', emailError);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('lead error', error);
    return NextResponse.json({ error: 'Não foi possível gravar o lead.' }, { status: 500 });
  }
}
