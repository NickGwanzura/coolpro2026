import { NextResponse } from 'next/server';
import { readSessionFromRequest } from '@/lib/server/auth';
import { markNotificationsRead } from '@/lib/server/notifications';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Marks the user's own notifications read: `{ all: true }` or `{ ids: [...] }`. */
export async function POST(req: Request) {
  const session = await readSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { all?: unknown; ids?: unknown };

  if (body.all === true) {
    await markNotificationsRead(session.id, 'all');
  } else if (Array.isArray(body.ids)) {
    await markNotificationsRead(session.id, body.ids.filter((id): id is string => typeof id === 'string' && UUID.test(id)));
  } else {
    return NextResponse.json({ error: 'Send { all: true } or { ids: [...] }.' }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
