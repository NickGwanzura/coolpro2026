import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { verifyWebhookSignature } from './webhook-signature';

const SECRET = `whsec_${Buffer.from('a-test-signing-key-123').toString('base64')}`;
const NOW = 1_760_000_000_000;
const id = 'msg_123';
const timestamp = String(NOW / 1000);
const body = JSON.stringify({ type: 'email.delivered', data: { email_id: 'abc' } });

function sign(overrides: { secret?: string; id?: string; timestamp?: string; body?: string } = {}) {
  const key = Buffer.from((overrides.secret ?? SECRET).slice(6), 'base64');
  const digest = createHmac('sha256', key).update(`${overrides.id ?? id}.${overrides.timestamp ?? timestamp}.${overrides.body ?? body}`).digest('base64');
  return `v1,${digest}`;
}
const check = (signature: string | null, extra: Partial<Parameters<typeof verifyWebhookSignature>[0]> = {}) =>
  verifyWebhookSignature({ secret: SECRET, id, timestamp, signature, body, now: NOW, ...extra });

describe('verifyWebhookSignature', () => {
  it('accepts a correctly signed request', () => {
    expect(check(sign())).toBe(true);
  });

  it('accepts when one of several signatures matches (key rotation)', () => {
    expect(check(`v1,AAAA ${sign()}`)).toBe(true);
  });

  it('rejects a tampered body, id or timestamp', () => {
    expect(check(sign(), { body: body.replace('delivered', 'bounced') })).toBe(false);
    expect(check(sign(), { id: 'msg_999' })).toBe(false);
    expect(check(sign({ timestamp: String(NOW / 1000 + 1) }))).toBe(false);
  });

  it('rejects a signature made with a different secret', () => {
    const other = `whsec_${Buffer.from('another-key').toString('base64')}`;
    expect(check(sign({ secret: other }))).toBe(false);
  });

  it('rejects a replayed old request', () => {
    const old = String(NOW / 1000 - 10 * 60);
    expect(verifyWebhookSignature({ secret: SECRET, id, timestamp: old, signature: sign({ timestamp: old }), body, now: NOW })).toBe(false);
  });

  it('rejects missing pieces and unknown signature versions', () => {
    expect(check(null)).toBe(false);
    expect(check('')).toBe(false);
    expect(check(sign().replace('v1,', 'v2,'))).toBe(false);
    expect(verifyWebhookSignature({ secret: '', id, timestamp, signature: sign(), body, now: NOW })).toBe(false);
    expect(verifyWebhookSignature({ secret: SECRET, id: null, timestamp, signature: sign(), body, now: NOW })).toBe(false);
    expect(check('v1,not-base64-at-all!!')).toBe(false);
  });
});
