import { createHmac, timingSafeEqual } from 'node:crypto';

const FIVE_MINUTES_S = 5 * 60;

/**
 * Checks a Resend (Svix) webhook signature. The signed text is `${id}.${timestamp}.${body}`, HMAC
 * SHA-256 with the secret (the part after "whsec_" is base64). The header can carry several
 * space-separated `v1,<signature>` entries; any one matching is enough. Old timestamps are
 * rejected so a captured request cannot be replayed later.
 */
export function verifyWebhookSignature(input: {
  secret: string;
  id: string | null;
  timestamp: string | null;
  signature: string | null;
  body: string;
  now?: number;
}): boolean {
  const { secret, id, timestamp, signature, body } = input;
  if (!secret || !id || !timestamp || !signature) return false;

  const seconds = Number(timestamp);
  const now = Math.floor((input.now ?? Date.now()) / 1000);
  if (!Number.isFinite(seconds) || Math.abs(now - seconds) > FIVE_MINUTES_S) return false;

  const key = Buffer.from(secret.startsWith('whsec_') ? secret.slice(6) : secret, 'base64');
  const expected = createHmac('sha256', key).update(`${id}.${timestamp}.${body}`).digest();

  return signature.split(' ').some((part) => {
    const [version, value] = part.split(',');
    if (version !== 'v1' || !value) return false;
    const given = Buffer.from(value, 'base64');
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}
