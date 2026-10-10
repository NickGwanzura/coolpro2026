import { describe, expect, it } from 'vitest';
import { checkRateLimit, getClientIp } from './rate-limit';

const req = (headers: Record<string, string>) => new Request('https://example.test/', { headers });

describe('getClientIp', () => {
  it('prefers a valid X-Real-IP', () => {
    expect(getClientIp(req({ 'x-real-ip': '41.60.1.2', 'x-forwarded-for': '9.9.9.9' }))).toBe('41.60.1.2');
  });

  it('falls back to the last X-Forwarded-For entry, which the proxy added', () => {
    expect(getClientIp(req({ 'x-forwarded-for': '6.6.6.6, 41.60.1.2' }))).toBe('41.60.1.2');
    expect(getClientIp(req({ 'x-forwarded-for': '41.60.1.2' }))).toBe('41.60.1.2');
  });

  it('ignores addresses a visitor made up earlier in the list', () => {
    expect(getClientIp(req({ 'x-forwarded-for': '1.1.1.1, 2.2.2.2, 41.60.1.2' }))).toBe('41.60.1.2');
  });

  it('shares one bucket when nothing usable is sent', () => {
    expect(getClientIp(req({}))).toBe('unknown');
    expect(getClientIp(req({ 'x-real-ip': 'not-an-ip' }))).toBe('unknown');
    expect(getClientIp(req({ 'x-forwarded-for': 'garbage' }))).toBe('unknown');
  });

  it('understands IPv6', () => {
    expect(getClientIp(req({ 'x-real-ip': '2001:db8::1' }))).toBe('2001:db8::1');
  });
});

describe('checkRateLimit', () => {
  it('allows up to the limit, then blocks, per key', () => {
    const key = `test:${Math.random()}`;
    expect([1, 2, 3].map(() => checkRateLimit(key, 3, 60_000))).toEqual([true, true, true]);
    expect(checkRateLimit(key, 3, 60_000)).toBe(false);
    expect(checkRateLimit(`${key}:other`, 3, 60_000)).toBe(true);
  });
});
