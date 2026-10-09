import { createHash, randomBytes } from 'node:crypto';

export const VERIFICATION_TTL_HOURS = 48;

/** A new random token. Only `tokenHash` is stored; the raw token goes in the email link. */
export function generateVerificationToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, tokenHash: hashVerificationToken(token) };
}

export function hashVerificationToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function verificationExpiry(now: Date = new Date()): Date {
  return new Date(now.getTime() + VERIFICATION_TTL_HOURS * 60 * 60 * 1000);
}

export type VerificationState = 'verified' | 'already-verified' | 'expired' | 'invalid';

/** Decides what a clicked link means, given the stored row (or nothing). Pure so it can be tested. */
export function evaluateVerification(
  row: { expiresAt: Date; verifiedAt: Date | null } | undefined,
  now: Date = new Date(),
): VerificationState {
  if (!row) return 'invalid';
  if (row.verifiedAt) return 'already-verified';
  if (row.expiresAt.getTime() < now.getTime()) return 'expired';
  return 'verified';
}
