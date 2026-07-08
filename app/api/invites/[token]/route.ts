import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { invites } from '@/db/schema/index';

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [invite] = await db.select().from(invites).where(eq(invites.token, token)).limit(1);

  if (!invite) {
    return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
  }

  if (invite.status === 'pending' && invite.expiresAt < new Date()) {
    await db.update(invites).set({ status: 'expired' }).where(eq(invites.id, invite.id));
    return NextResponse.json({ error: 'This invite has expired' }, { status: 410 });
  }

  if (invite.status !== 'pending') {
    return NextResponse.json({ error: `This invite is ${invite.status}` }, { status: 410 });
  }

  if (invite.role === 'org_admin') {
    return NextResponse.json({ error: 'Org admin invites are no longer supported' }, { status: 403 });
  }

  return NextResponse.json({
    email: invite.email,
    role: invite.role,
    region: invite.region,
    expiresAt: invite.expiresAt,
  });
}
