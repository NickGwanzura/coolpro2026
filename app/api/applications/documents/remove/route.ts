import { NextResponse } from 'next/server';
import { removeApplicationDocument, resolveUploadSession } from '@/lib/server/application-documents';
import { checkRateLimit, getClientIp } from '@/lib/server/rate-limit';

/** An applicant removes one of their own uploads (for example a wrong file). */
export async function POST(req: Request) {
  if (!checkRateLimit(`application-document-remove:${getClientIp(req)}`, 30, 15 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests. Please try again shortly.' }, { status: 429 });
  }
  const body = (await req.json().catch(() => ({}))) as { token?: unknown; id?: unknown };
  const resolved = await resolveUploadSession(typeof body.token === 'string' ? body.token : '');
  if ('error' in resolved) return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  if (typeof body.id !== 'string') return NextResponse.json({ error: 'Choose a document to remove.' }, { status: 400 });

  const removed = await removeApplicationDocument(resolved.session, body.id);
  return removed ? NextResponse.json({ removed: true }) : NextResponse.json({ error: 'Document not found.' }, { status: 404 });
}
