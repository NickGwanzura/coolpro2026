import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { users } from '@/db/schema/index';

type ProvisionInput = {
  name: string;
  email: string;
  passwordHash: string | null;
  role: typeof users.$inferSelect['role'];
  region: string;
};

/** Thrown when provisioning would silently change an existing active account's role. */
export class ProvisionConflictError extends Error {}

const POSTGRES_UNIQUE_VIOLATION = '23505';

function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code?: string }).code === POSTGRES_UNIQUE_VIOLATION;
}

async function upsertExisting(existing: typeof users.$inferSelect, input: ProvisionInput): Promise<void> {
  if (existing.status === 'active' && existing.role !== input.role) {
    throw new ProvisionConflictError(
      `An active account already exists for ${existing.email} with role "${existing.role}". ` +
      `Approving this application would change it to "${input.role}" — reject this application or ` +
      `update the existing account manually via System Users first.`,
    );
  }

  await db
    .update(users)
    .set({
      name: input.name,
      role: input.role,
      region: input.region,
      status: input.passwordHash || existing.passwordHash ? 'active' : 'pending',
      passwordHash: input.passwordHash ?? existing.passwordHash,
      updatedAt: new Date(),
    })
    .where(eq(users.id, existing.id));
}

/**
 * Activates a login account for an approved application. Inserts a new `users` row keyed by
 * email, or reactivates/updates an existing one (e.g. a rejected-then-reapplied applicant).
 * passwordHash can be null for applications submitted before password capture existed —
 * those accounts stay inactive until an admin resets a password for them.
 *
 * Throws ProvisionConflictError (never silently overwrites) if an already-active account
 * exists under a different role — callers should catch this and surface it to the admin
 * rather than let the application auto-approve into an inconsistent state.
 */
export async function provisionUserFromApplication(input: ProvisionInput): Promise<void> {
  const email = input.email.trim().toLowerCase();

  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (existing) {
    await upsertExisting(existing, input);
    return;
  }

  try {
    await db.insert(users).values({
      name: input.name,
      email,
      passwordHash: input.passwordHash,
      role: input.role,
      region: input.region,
      status: input.passwordHash ? 'active' : 'pending',
      isDemo: false,
    });
  } catch (err) {
    // Another request provisioned this email between our SELECT and this INSERT.
    if (!isUniqueViolation(err)) throw err;

    const [raced] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!raced) throw err;
    await upsertExisting(raced, input);
  }
}
