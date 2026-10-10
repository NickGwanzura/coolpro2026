import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { emailLog } from '@/db/schema/index';
import { eventDetail, isEmailStatus, nextStatus, statusForEvent } from '@/lib/email-status';
import { verifyWebhookSignature } from '@/lib/server/webhook-signature';

/**
 * Resend calls this when an email is delivered, delayed, bounces, fails or is reported as spam, so
 * the Email Activity page shows what really happened rather than just "accepted". Every request
 * must carry a valid signature from the secret in RESEND_WEBHOOK_SECRET.
 */
export async function POST(req: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'The email webhook is not configured on this server.' }, { status: 503 });
  }

  const body = await req.text();
  const valid = verifyWebhookSignature({
    secret,
    id: req.headers.get('svix-id'),
    timestamp: req.headers.get('svix-timestamp'),
    signature: req.headers.get('svix-signature'),
    body,
  });
  if (!valid) return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 });

  let event: { type?: unknown; data?: Record<string, unknown> };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const incoming = typeof event.type === 'string' ? statusForEvent(event.type) : null;
  const messageId = typeof event.data?.email_id === 'string' ? event.data.email_id : null;
  if (!incoming || !messageId) return NextResponse.json({ ok: true, ignored: true });

  const [row] = await db.select().from(emailLog).where(eq(emailLog.providerMessageId, messageId)).limit(1);
  if (!row) return NextResponse.json({ ok: true, matched: false });

  const current = isEmailStatus(row.status) ? row.status : 'sent';
  const updated = nextStatus(current, incoming);
  if (updated === current) return NextResponse.json({ ok: true, changed: false });

  await db
    .update(emailLog)
    .set({
      status: updated,
      statusUpdatedAt: new Date(),
      errorMessage: eventDetail(event.data) ?? row.errorMessage,
    })
    .where(eq(emailLog.id, row.id));
  return NextResponse.json({ ok: true, changed: true, status: updated });
}
