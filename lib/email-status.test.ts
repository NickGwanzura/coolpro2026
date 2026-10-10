import { describe, expect, it } from 'vitest';
import { canResend, eventDetail, isEmailStatus, isProblem, nextStatus, relatedLink, statusForEvent, typeLabel } from './email-status';

describe('nextStatus', () => {
  it('moves forward as the provider reports progress', () => {
    expect(nextStatus('sent', 'delivered')).toBe('delivered');
    expect(nextStatus('sent', 'delayed')).toBe('delayed');
    expect(nextStatus('delayed', 'delivered')).toBe('delivered');
  });

  it('never lets a late "delivered" hide a bounce or a complaint', () => {
    expect(nextStatus('bounced', 'delivered')).toBe('bounced');
    expect(nextStatus('complained', 'delivered')).toBe('complained');
    expect(nextStatus('complained', 'bounced')).toBe('complained');
  });

  it('lets a bounce arrive after "delivered"', () => {
    expect(nextStatus('delivered', 'bounced')).toBe('bounced');
    expect(nextStatus('delivered', 'complained')).toBe('complained');
  });

  it('keeps the current status for a repeat or an earlier event', () => {
    expect(nextStatus('delivered', 'delivered')).toBe('delivered');
    expect(nextStatus('delivered', 'sent')).toBe('delivered');
    expect(nextStatus('delivered', 'delayed')).toBe('delivered');
  });
});

describe('statusForEvent', () => {
  it('maps the events we track and ignores the rest', () => {
    expect(statusForEvent('email.delivered')).toBe('delivered');
    expect(statusForEvent('email.delivery_delayed')).toBe('delayed');
    expect(statusForEvent('email.bounced')).toBe('bounced');
    expect(statusForEvent('email.complained')).toBe('complained');
    expect(statusForEvent('email.failed')).toBe('failed');
    for (const ignored of ['email.sent', 'email.opened', 'email.clicked', 'domain.updated', '']) {
      expect(statusForEvent(ignored)).toBeNull();
    }
  });
});

describe('helpers', () => {
  it('knows which statuses need attention', () => {
    for (const bad of ['failed', 'bounced', 'complained']) expect(isProblem(bad)).toBe(true);
    for (const fine of ['sent', 'delivered', 'delayed']) expect(isProblem(fine)).toBe(false);
  });

  it('validates a status value', () => {
    expect(isEmailStatus('bounced')).toBe(true);
    expect(isEmailStatus('lost')).toBe(false);
    expect(isEmailStatus(undefined)).toBe(false);
  });

  it('turns a type into a readable label', () => {
    expect(typeLabel('application_verification')).toBe('Application verification');
  });

  it('links to the page for a record, where one exists', () => {
    expect(relatedLink('student_application')).toBe('/admin/applications');
    expect(relatedLink('registration_application')).toBe('/admin/applications');
    expect(relatedLink('membership')).toBe('/admin/memberships');
    expect(relatedLink('contractor_application')).toBe('/admin/contractors');
    expect(relatedLink('user')).toBeNull();
    expect(relatedLink(undefined)).toBeNull();
  });

  it('offers resend only for safe email types, and only when something went wrong', () => {
    expect(canResend('application_verification', 'bounced')).toBe(true);
    expect(canResend('application_approved', 'failed')).toBe(true);
    expect(canResend('application_approved', 'delivered')).toBe(false);
    expect(canResend('password_reset', 'failed')).toBe(false);
    expect(canResend('invite', 'bounced')).toBe(false);
  });
});

describe('eventDetail', () => {
  it('pulls the reason out of bounce and failure payloads', () => {
    expect(eventDetail({ email_id: 'x', bounce: { message: 'Mailbox does not exist', type: 'Permanent' } })).toBe('Mailbox does not exist');
    expect(eventDetail({ failed: { reason: 'Invalid recipient' } })).toBe('Invalid recipient');
  });

  it('returns nothing when there is no usable reason', () => {
    expect(eventDetail({ email_id: 'x' })).toBeUndefined();
    expect(eventDetail({ bounce: { message: '   ' } })).toBeUndefined();
    expect(eventDetail(null)).toBeUndefined();
    expect(eventDetail('text')).toBeUndefined();
  });

  it('trims very long reasons', () => {
    expect(eventDetail({ bounce: { message: 'x'.repeat(900) } })?.length).toBe(500);
  });
});
