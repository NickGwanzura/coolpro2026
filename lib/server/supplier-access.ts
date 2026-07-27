import { and, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { supplierApplications } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';

/** Supplier operations are available only after the invited business has completed onboarding and been approved. */
export async function requireApprovedSupplier(req: Request) {
  const session = requireRole(req, ['vendor']);
  const [application] = await db.select({ id: supplierApplications.id })
    .from(supplierApplications)
    .where(and(eq(supplierApplications.email, session.email), eq(supplierApplications.status, 'approved')))
    .limit(1);

  if (!application) {
    throw new Response('Supplier onboarding is incomplete or awaiting approval.', { status: 403 });
  }
  return session;
}
