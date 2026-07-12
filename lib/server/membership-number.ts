import { eq, like, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { memberships } from '@/db/schema/index';

/**
 * Membership numbers are system-issued (mirrors generateTechnicianRegistrationNumber),
 * sequential per calendar year. The prefix is the one thing likely to change before this
 * ships — it lives here as a single constant rather than being hardcoded at call sites, so
 * updating the numbering format later is a one-line change.
 */
const MEMBERSHIP_NUMBER_PREFIX_TEMPLATE = (year: number) => `HEVACRAZ/MEM/${year}/`;

export async function generateMembershipNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = MEMBERSHIP_NUMBER_PREFIX_TEMPLATE(year);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(memberships)
    .where(like(memberships.membershipNumber, `${prefix}%`));

  let seq = count + 1;
  let candidate = `${prefix}${String(seq).padStart(4, '0')}`;
  while (await isMembershipNumberTaken(candidate)) {
    seq += 1;
    candidate = `${prefix}${String(seq).padStart(4, '0')}`;
  }
  return candidate;
}

async function isMembershipNumberTaken(candidate: string): Promise<boolean> {
  const [match] = await db
    .select({ id: memberships.id })
    .from(memberships)
    .where(eq(memberships.membershipNumber, candidate))
    .limit(1);
  return Boolean(match);
}
