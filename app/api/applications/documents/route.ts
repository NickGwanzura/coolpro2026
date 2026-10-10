import { NextResponse } from 'next/server';
import { checkDocumentFile, MAX_DOCUMENT_BYTES } from '@/lib/application-documents';
import { addApplicationDocument, resolveUploadSession } from '@/lib/server/application-documents';
import { checkRateLimit, getClientIp } from '@/lib/server/rate-limit';

/** An applicant uploads one proof document. The token from their confirmation email is the key. */
export async function POST(req: Request) {
  if (!checkRateLimit(`application-document:${getClientIp(req)}`, 20, 15 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many uploads. Please wait a few minutes and try again.' }, { status: 429 });
  }

  // Refuse oversized bodies before reading them into memory.
  const declared = Number(req.headers.get('content-length') ?? 0);
  if (declared > MAX_DOCUMENT_BYTES + 512 * 1024) {
    return NextResponse.json({ error: `Each file must be ${MAX_DOCUMENT_BYTES / 1024 / 1024} MB or smaller.` }, { status: 413 });
  }

  const form = await req.formData().catch(() => null);
  const token = form?.get('token');
  const file = form?.get('file');
  if (typeof token !== 'string' || !(file instanceof File)) {
    return NextResponse.json({ error: 'Choose a file to upload.' }, { status: 400 });
  }

  const problem = checkDocumentFile({ name: file.name, type: file.type, size: file.size });
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  const resolved = await resolveUploadSession(token);
  if ('error' in resolved) return NextResponse.json({ error: resolved.error }, { status: resolved.status });

  const stored = await addApplicationDocument(resolved.session, {
    name: file.name,
    type: file.type,
    data: Buffer.from(await file.arrayBuffer()),
  });
  if ('error' in stored) return NextResponse.json({ error: stored.error }, { status: stored.status });
  return NextResponse.json(stored.document, { status: 201 });
}
