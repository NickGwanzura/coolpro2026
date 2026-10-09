import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { registrationApplications } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import { provisionUserFromApplication, ProvisionConflictError } from '@/lib/server/provision-user';
import { afterApplicationApproved, reviewBlockedReason } from '@/lib/server/application-flow';
import { toRegistrationApplication } from '@/lib/server/registration-serializers';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = await requireRole(req, ['org_admin']);
  } catch (e) {
    return e as Response;
  }

  const { id } = await params;
  const [row] = await db.select().from(registrationApplications).where(eq(registrationApplications.id, id)).limit(1);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const blocked = await reviewBlockedReason('registration_application', id, row.status, 'approve');
  if (blocked) return NextResponse.json({ error: blocked }, { status: 409 });

  const name = `${row.firstName} ${row.lastName}`.trim();
  try {
    await provisionUserFromApplication({
      name,
      email: row.email,
      passwordHash: row.passwordHash,
      role: row.role,
      region: row.region,
    });
  } catch (err) {
    if (err instanceof ProvisionConflictError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }

  const [updated] = await db
    .update(registrationApplications)
    .set({ status: 'approved', reviewedBy: session.name, reviewedAt: new Date() })
    .where(eq(registrationApplications.id, id))
    .returning();

  await afterApplicationApproved(
    { entityType: 'registration_application', entityId: id, role: row.role, name, email: row.email },
    { name: session.name, role: session.role },
    row.status,
  );

  return NextResponse.json(toRegistrationApplication(updated));
}
