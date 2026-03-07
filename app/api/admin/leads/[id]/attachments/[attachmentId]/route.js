import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

function sanitizeFilename(value) {
  return String(value || 'anexo')
    .replace(/[^\w.\-() ]+/g, '_')
    .trim();
}

function isInlineContentType(value) {
  const type = String(value || '').toLowerCase();
  return type.startsWith('image/') || type === 'application/pdf';
}

export async function GET(_request, { params }) {
  try {
    const sql = getDb();

    const [attachment] = await sql`
      SELECT
        la.id,
        la.file_name,
        la.content_type,
        la.content_base64,
        la.file_size_bytes,
        la.lead_id
      FROM lead_attachments la
      INNER JOIN leads l ON l.id = la.lead_id
      WHERE la.id = ${params.attachmentId}
        AND la.lead_id = ${params.id}
      LIMIT 1
    `;

    if (!attachment) {
      return NextResponse.json({ error: 'Anexo não encontrado.' }, { status: 404 });
    }

    const contentType = attachment.content_type || 'application/octet-stream';
    const fileName = sanitizeFilename(attachment.file_name);
    const disposition = isInlineContentType(contentType) ? 'inline' : 'attachment';
    const buffer = Buffer.from(String(attachment.content_base64 || ''), 'base64');

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(attachment.file_size_bytes || buffer.byteLength),
        'Content-Disposition': `${disposition}; filename="${fileName}"`,
        'Cache-Control': 'private, no-store, max-age=0'
      }
    });
  } catch (error) {
    console.error('lead attachment download error', error);
    return NextResponse.json({ error: 'Falha ao abrir anexo.' }, { status: 500 });
  }
}
