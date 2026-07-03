import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { users, userStatusEnum } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import { VALID_ROLES } from '@/lib/roles';

const VALID_STATUSES = userStatusEnum.enumValues;

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = requireRole(req, ['org_admin']);
  } catch (e) {
    return e as Response;
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({})) as {
    role?: string;
    status?: string;
    region?: string;
    name?: string;
  };

  const [existing] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const isSelf = existing.id === session.id;
  if (isSelf && body.role && body.role !== 'org_admin') {
    return NextResponse.json({ error: 'You cannot change your own role away from org_admin' }, { status: 400 });
  }
  if (isSelf && body.status && body.status !== 'active') {
    return NextResponse.json({ error: 'You cannot deactivate your own account' }, { status: 400 });
  }

  const update: Partial<typeof users.$inferInsert> = { updatedAt: new Date() };

  if (body.role !== undefined) {
    if (!VALID_ROLES.includes(body.role as (typeof VALID_ROLES)[number])) {
      return NextResponse.json({ error: 'Unknown role' }, { status: 400 });
    }
    update.role = body.role as (typeof VALID_ROLES)[number];
  }
  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status as (typeof VALID_STATUSES)[number])) {
      return NextResponse.json({ error: 'Unknown status' }, { status: 400 });
    }
    update.status = body.status as (typeof VALID_STATUSES)[number];
  }
  if (body.region !== undefined) {
    if (!body.region.trim()) {
      return NextResponse.json({ error: 'Region cannot be empty' }, { status: 400 });
    }
    update.region = body.region.trim();
  }
  if (body.name !== undefined) {
    if (!body.name.trim()) {
      return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
    }
    update.name = body.name.trim();
  }

  const [updated] = await db.update(users).set(update).where(eq(users.id, id)).returning();
  const { passwordHash: _passwordHash, ...rest } = updated;
  return NextResponse.json(rest);
}
