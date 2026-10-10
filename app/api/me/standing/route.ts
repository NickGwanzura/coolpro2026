import { NextResponse } from 'next/server';
import { desc, eq, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { contractorApplications, memberships, technicians } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';

/**
 * A technician's or contractor's own standing: registry record, latest membership, certificates
 * and whether a contractor still has onboarding to finish. Matched to the signed-in user by email.
 */
export async function GET(req: Request) {
  let session;
  try {
    session = await requireRole(req, ['technician', 'contractor']);
  } catch (e) {
    return e as Response;
  }

  const email = session.email.toLowerCase();
  const [technician] = await db
    .select()
    .from(technicians)
    .where(sql`lower(${technicians.email}) = ${email}`)
    .limit(1);

  const [membership] = technician
    ? await db.select().from(memberships).where(eq(memberships.technicianId, technician.id)).orderBy(desc(memberships.expiryDate)).limit(1)
    : [];

  const [onboarding] = session.role === 'contractor'
    ? await db.select({ status: contractorApplications.status }).from(contractorApplications).where(sql`lower(${contractorApplications.email}) = ${email}`).limit(1)
    : [];

  const certifications = Array.isArray(technician?.certifications)
    ? (technician.certifications as Array<{ name?: string; expiryDate?: string; status?: string }>).map((cert) => ({
        name: cert.name ?? 'Certificate',
        expiryDate: cert.expiryDate ?? null,
        status: cert.status ?? 'valid',
      }))
    : [];

  return NextResponse.json({
    technician: technician
      ? { registrationNumber: technician.registrationNumber, status: technician.status, expiryDate: technician.expiryDate, certifications }
      : null,
    membership: membership
      ? { membershipNumber: membership.membershipNumber, status: membership.status, expiryDate: membership.expiryDate }
      : null,
    contractorOnboarding: onboarding?.status ?? null,
  });
}
