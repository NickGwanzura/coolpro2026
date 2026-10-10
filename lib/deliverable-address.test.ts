import { describe, expect, it } from 'vitest';
import { isUndeliverableAddress } from './deliverable-address';

describe('isUndeliverableAddress', () => {
  it('flags placeholder and reserved domains', () => {
    for (const email of ['org@coolpro.demo', 'a@something.test', 'a@x.example', 'a@x.invalid', 'a@example.com', 'A@Example.ORG', 'a@host.localhost']) {
      expect(isUndeliverableAddress(email)).toBe(true);
    }
  });

  it('flags malformed addresses', () => {
    expect(isUndeliverableAddress('nobody')).toBe(true);
    expect(isUndeliverableAddress('a@localhost')).toBe(true);
    expect(isUndeliverableAddress('')).toBe(true);
  });

  it('keeps real addresses, including the registry domain and personal mailboxes', () => {
    for (const email of ['orgadmin@zimhvacregistry.org', 'motsialfred@gmail.com', 'nicholas.gwanzura@outlook.com', 'a@demo.co.zw']) {
      expect(isUndeliverableAddress(email)).toBe(false);
    }
  });
});
