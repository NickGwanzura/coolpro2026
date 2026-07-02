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

/**
 * Activates a login account for an approved application. Inserts a new `users` row keyed by
 * email, or reactivates/updates an existing one (e.g. a rejected-then-reapplied applicant).
 * passwordHash can be null for applications submitted before password capture existed —
 * those accounts stay inactive until an admin resets a password for them.
 */
export async function provisionUserFromApplication(input: ProvisionInput): Promise<void> {
  const email = input.email.trim().toLowerCase();

  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (existing) {
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
    return;
  }

  await db.insert(users).values({
    name: input.name,
    email,
    passwordHash: input.passwordHash,
    role: input.role,
    region: input.region,
    status: input.passwordHash ? 'active' : 'pending',
    isDemo: false,
  });
}
