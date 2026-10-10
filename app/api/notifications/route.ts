import { NextResponse } from 'next/server';
import { readSessionFromRequest } from '@/lib/server/auth';
import { listNotifications } from '@/lib/server/notifications';

/** The signed-in user's own notifications, newest first. */
export async function GET(req: Request) {
  const session = await readSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(await listNotifications(session.id));
}
