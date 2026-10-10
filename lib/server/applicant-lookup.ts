import { desc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import {
  registrationApplications,
  studentApplications,
  supplierApplications,
  technicianApplications,
  users,
} from '@/db/schema/index';
import { applicantLoginState, type ApplicantLoginState } from '@/lib/applicant-login-message';
import { isVerificationPending, type ApplicationEntityType } from '@/lib/server/email-verification';
import { verifyPassword } from '@/lib/server/password';

interface Candidate {
  entityType: ApplicationEntityType;
  id: string;
  status: string;
  passwordHash: string | null;
  submittedAt: Date;
}

/**
 * For a log-in attempt with no matching account: if the email and password match a self-registered
 * application, say where that application stands. Returns null when nothing matches, so a stranger
 * learns nothing about which emails have applied.
 */
export async function applicantLoginStateFor(email: string, password: string): Promise<ApplicantLoginState | null> {
  const [technicians, students, suppliers, professionals] = await Promise.all([
    db.select().from(technicianApplications).where(eq(technicianApplications.email, email)).orderBy(desc(technicianApplications.submittedAt)).limit(3),
    db.select().from(studentApplications).where(eq(studentApplications.email, email)).orderBy(desc(studentApplications.submittedAt)).limit(3),
    db.select().from(supplierApplications).where(eq(supplierApplications.email, email)).orderBy(desc(supplierApplications.submittedAt)).limit(3),
    db.select().from(registrationApplications).where(eq(registrationApplications.email, email)).orderBy(desc(registrationApplications.submittedAt)).limit(3),
  ]);

  const candidates: Candidate[] = [
    ...technicians.map((row) => ({ entityType: 'technician_application' as const, id: row.id, status: row.status, passwordHash: row.passwordHash, submittedAt: row.submittedAt })),
    ...students.map((row) => ({ entityType: 'student_application' as const, id: row.id, status: row.status, passwordHash: row.passwordHash, submittedAt: row.submittedAt })),
    ...suppliers.map((row) => ({ entityType: 'supplier_application' as const, id: row.id, status: row.status, passwordHash: row.passwordHash, submittedAt: row.submittedAt })),
    ...professionals.map((row) => ({ entityType: 'registration_application' as const, id: row.id, status: row.status, passwordHash: row.passwordHash, submittedAt: row.submittedAt })),
  ].sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());

  for (const candidate of candidates) {
    if (!candidate.passwordHash || !(await verifyPassword(password, candidate.passwordHash))) continue;
    const emailUnconfirmed = await isVerificationPending(candidate.entityType, candidate.id);
    return applicantLoginState({ status: candidate.status, emailUnconfirmed });
  }
  return null;
}

/** True when someone already has a login for this email, so a new application would be pointless. */
export async function accountExistsFor(email: string): Promise<boolean> {
  const [row] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  return row !== undefined;
}

export const ACCOUNT_EXISTS_MESSAGE =
  'An account with this email already exists. Log in, or use "Forgot password" on the login page.';
