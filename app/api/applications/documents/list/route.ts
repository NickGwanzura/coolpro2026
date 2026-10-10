import { NextResponse } from 'next/server';
import { MAX_DOCUMENTS_PER_APPLICATION, PROOF_HINTS } from '@/lib/application-documents';
import { listApplicationDocuments, resolveUploadSession } from '@/lib/server/application-documents';
import { checkRateLimit, getClientIp } from '@/lib/server/rate-limit';

/** What the applicant has uploaded so far, and what they are asked for. */
export async function POST(req: Request) {
  if (!checkRateLimit(`application-document-list:${getClientIp(req)}`, 60, 15 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests. Please try again shortly.' }, { status: 429 });
  }
  const body = (await req.json().catch(() => ({}))) as { token?: unknown };
  const resolved = await resolveUploadSession(typeof body.token === 'string' ? body.token : '');
  if ('error' in resolved) return NextResponse.json({ error: resolved.error }, { status: resolved.status });

  const documents = await listApplicationDocuments(resolved.session.entityType, resolved.session.entityId);
  return NextResponse.json({
    documents,
    limit: MAX_DOCUMENTS_PER_APPLICATION,
    hint: PROOF_HINTS[resolved.session.role],
  });
}
