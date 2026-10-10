import { describe, expect, it, vi } from 'vitest';

vi.mock('@/db/client', () => ({ db: {} }));
import { splitRelated } from './email-log';

describe('splitRelated', () => {
  const id = '3f2b1c4e-8a5d-4e6f-9b0a-1c2d3e4f5a6b';

  it('keeps a real record id and its label', () => {
    expect(splitRelated(id, 'Ada')).toEqual({ entityId: id, label: 'Ada' });
    expect(splitRelated(id, undefined)).toEqual({ entityId: id, label: null });
  });

  it('turns something that is not an id (such as an email address) into the label', () => {
    expect(splitRelated('someone@example.com', undefined)).toEqual({ entityId: null, label: 'someone@example.com' });
  });

  it('prefers an explicit label over a bad id', () => {
    expect(splitRelated('not-an-id', 'Invite for Ada')).toEqual({ entityId: null, label: 'Invite for Ada' });
  });

  it('handles nothing at all', () => {
    expect(splitRelated(undefined, undefined)).toEqual({ entityId: null, label: null });
  });
});
