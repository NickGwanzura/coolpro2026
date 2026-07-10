import { eq, like, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { technicianApplications, technicians, supplierApplications } from '@/db/schema/index';

/**
 * Registration numbers are system-issued, not applicant-supplied — HEVACRAZ, not the
 * applicant, is the authority that assigns a practitioner/supplier registry ID. Numbers
 * are sequential per calendar year per kind (ZIM/TECH/2026/0001, ZIM/SUP/2026/0001) and
 * checked for collisions against both the applications table and, for technicians, the
 * live registry table (which carries a DB-level unique constraint).
 */
async function isTechnicianRegistrationNumberTaken(candidate: string): Promise<boolean> {
  const [appMatch] = await db
    .select({ id: technicianApplications.id })
    .from(technicianApplications)
    .where(eq(technicianApplications.registrationNumber, candidate))
    .limit(1);
  if (appMatch) return true;

  const [techMatch] = await db
    .select({ id: technicians.id })
    .from(technicians)
    .where(eq(technicians.registrationNumber, candidate))
    .limit(1);
  return Boolean(techMatch);
}

async function isSupplierRegistrationNumberTaken(candidate: string): Promise<boolean> {
  const [match] = await db
    .select({ id: supplierApplications.id })
    .from(supplierApplications)
    .where(eq(supplierApplications.registrationNumber, candidate))
    .limit(1);
  return Boolean(match);
}

export async function generateTechnicianRegistrationNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `ZIM/TECH/${year}/`;

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(technicianApplications)
    .where(like(technicianApplications.registrationNumber, `${prefix}%`));

  let seq = count + 1;
  let candidate = `${prefix}${String(seq).padStart(4, '0')}`;
  while (await isTechnicianRegistrationNumberTaken(candidate)) {
    seq += 1;
    candidate = `${prefix}${String(seq).padStart(4, '0')}`;
  }
  return candidate;
}

export async function generateSupplierRegistrationNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `ZIM/SUP/${year}/`;

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(supplierApplications)
    .where(like(supplierApplications.registrationNumber, `${prefix}%`));

  let seq = count + 1;
  let candidate = `${prefix}${String(seq).padStart(4, '0')}`;
  while (await isSupplierRegistrationNumberTaken(candidate)) {
    seq += 1;
    candidate = `${prefix}${String(seq).padStart(4, '0')}`;
  }
  return candidate;
}
