import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { technicians } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import { sendCertificateEmail } from '@/lib/server/email';
import { logEmail } from '@/lib/server/email-log';

const MAX_PDF_BASE64_LENGTH = 8 * 1024 * 1024; // ~6MB decoded, generous for a single-page certificate

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireRole(req, ['trainer', 'lecturer', 'org_admin']);
  } catch (e) {
    return e as Response;
  }

  const { id } = await params;
  const [row] = await db.select().from(technicians).where(eq(technicians.id, id)).limit(1);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!row.email) return NextResponse.json({ error: 'This technician has no email on file' }, { status: 400 });

  const body = await req.json().catch(() => ({})) as { pdfBase64?: string; certificateNumber?: string };
  if (!body.pdfBase64 || !body.certificateNumber) {
    return NextResponse.json({ error: 'pdfBase64 and certificateNumber are required' }, { status: 400 });
  }
  if (body.pdfBase64.length > MAX_PDF_BASE64_LENGTH) {
    return NextResponse.json({ error: 'Certificate PDF is too large' }, { status: 400 });
  }

  const result = await sendCertificateEmail({
    email: row.email,
    name: row.name,
    certificateNumber: body.certificateNumber,
    pdfBase64: body.pdfBase64,
    fileName: `${row.name.replace(/\s+/g, '-')}-certificate.pdf`,
  });

  await logEmail({
    emailType: 'certificate_sent',
    recipientEmail: row.email,
    relatedEntityType: 'technician',
    relatedEntityId: row.id,
    sent: result.sent,
  }).catch(() => {});

  if (!result.sent) return NextResponse.json({ error: 'Failed to send certificate email' }, { status: 502 });
  return NextResponse.json({ sent: true });
}
