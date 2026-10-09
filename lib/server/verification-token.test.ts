import { describe, expect, it } from 'vitest';
import {
  evaluateVerification,
  generateVerificationToken,
  hashVerificationToken,
  verificationExpiry,
  VERIFICATION_TTL_HOURS,
} from './verification-token';

describe('verification tokens', () => {
  it('generates unique tokens and stores only their hash', () => {
    const a = generateVerificationToken();
    const b = generateVerificationToken();
    expect(a.token).not.toBe(b.token);
    expect(a.token.length).toBeGreaterThanOrEqual(43);
    expect(a.tokenHash).toBe(hashVerificationToken(a.token));
    expect(a.tokenHash).not.toContain(a.token);
    expect(a.tokenHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('expires after the configured number of hours', () => {
    const now = new Date('2026-10-09T10:00:00Z');
    expect(verificationExpiry(now).getTime() - now.getTime()).toBe(VERIFICATION_TTL_HOURS * 3600 * 1000);
  });
});

describe('evaluateVerification', () => {
  const now = new Date('2026-10-09T10:00:00Z');
  const future = new Date('2026-10-10T10:00:00Z');
  const past = new Date('2026-10-08T10:00:00Z');

  it('accepts a live, unused link', () => {
    expect(evaluateVerification({ expiresAt: future, verifiedAt: null }, now)).toBe('verified');
  });
  it('recognises an already-used link, even after it expired', () => {
    expect(evaluateVerification({ expiresAt: future, verifiedAt: past }, now)).toBe('already-verified');
    expect(evaluateVerification({ expiresAt: past, verifiedAt: past }, now)).toBe('already-verified');
  });
  it('rejects an expired or unknown link', () => {
    expect(evaluateVerification({ expiresAt: past, verifiedAt: null }, now)).toBe('expired');
    expect(evaluateVerification(undefined, now)).toBe('invalid');
  });
});
