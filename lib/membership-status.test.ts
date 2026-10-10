import { describe, expect, it } from 'vitest';
import { daysUntil, describeRenewal, gettingStartedChecklist, renewalState, summariseCertifications } from './membership-status';

const NOW = Date.parse('2026-10-10T12:00:00Z');
const inDays = (n: number) => new Date(NOW + n * 86_400_000).toISOString().slice(0, 10);

describe('renewal', () => {
  it('counts whole days, negative once passed', () => {
    expect(daysUntil(inDays(10), NOW)).toBe(10);
    expect(daysUntil(inDays(-3), NOW)).toBeLessThan(0);
    expect(daysUntil(undefined, NOW)).toBeNull();
    expect(daysUntil('not a date', NOW)).toBeNull();
  });

  it('classifies a date as expired, due soon or ok', () => {
    expect(renewalState(inDays(-5), NOW)).toBe('expired');
    expect(renewalState(inDays(30), NOW)).toBe('due-soon');
    expect(renewalState(inDays(60), NOW)).toBe('due-soon');
    expect(renewalState(inDays(200), NOW)).toBe('ok');
    expect(renewalState(null, NOW)).toBe('unknown');
  });

  it('says it in plain words', () => {
    expect(describeRenewal(inDays(10), NOW)).toBe('Expires in 10 days');
    expect(describeRenewal(inDays(1), NOW)).toBe('Expires in 1 day');
    expect(describeRenewal(inDays(-2), NOW)).toMatch(/^Expired \d+ days? ago$/);
    expect(describeRenewal(inDays(300), NOW)).toBe(`Valid until ${inDays(300)}`);
    expect(describeRenewal(undefined, NOW)).toBe('No expiry date on record');
  });
});

describe('summariseCertifications', () => {
  it('splits certificates into valid, expiring soon and expired', () => {
    const summary = summariseCertifications(
      [
        { expiryDate: inDays(400), status: 'valid' },
        { expiryDate: inDays(30), status: 'valid' },
        { expiryDate: inDays(-10), status: 'valid' },
        { expiryDate: inDays(500), status: 'expired' },
        { expiryDate: null, status: 'valid' },
      ],
      NOW,
    );
    expect(summary).toEqual({ valid: 2, expiringSoon: 1, expired: 2 });
  });
});

describe('gettingStartedChecklist', () => {
  it('ticks off what has been done', () => {
    const items = gettingStartedChecklist({ jobs: 2, gasLogs: 0, cocRequests: 0, hasMembership: true, isContractor: false });
    expect(items.map((i) => [i.key, i.done])).toEqual([['job', true], ['log', false], ['coc', false], ['membership', true]]);
  });

  it('leaves membership off the list for contractors', () => {
    const items = gettingStartedChecklist({ jobs: 0, gasLogs: 0, cocRequests: 0, hasMembership: false, isContractor: true });
    expect(items.map((i) => i.key)).toEqual(['job', 'log', 'coc']);
  });
});
