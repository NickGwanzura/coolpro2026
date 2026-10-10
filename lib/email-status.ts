// What an email's status means, how provider events change it, and where its record lives.
// Pure and client-safe, so the page, the webhook and the tests agree.

export const EMAIL_STATUSES = ['sent', 'delayed', 'delivered', 'failed', 'bounced', 'complained'] as const;
export type EmailStatus = (typeof EMAIL_STATUSES)[number];

export const STATUS_LABEL: Record<EmailStatus, string> = {
  sent: 'Accepted',
  delayed: 'Delayed',
  delivered: 'Delivered',
  failed: 'Failed',
  bounced: 'Bounced',
  complained: 'Marked as spam',
};

/** Statuses an administrator should look at. */
export function isProblem(status: string): boolean {
  return status === 'failed' || status === 'bounced' || status === 'complained';
}

// A later, worse outcome wins over an earlier, better one, whatever order the events arrive in:
// a bounce reported after "delivered" is still a bounce, and a late "delivered" never hides one.
const RANK: Record<EmailStatus, number> = { failed: 0, sent: 1, delayed: 2, delivered: 3, bounced: 4, complained: 5 };

export function isEmailStatus(value: unknown): value is EmailStatus {
  return typeof value === 'string' && (EMAIL_STATUSES as readonly string[]).includes(value);
}

/** The status after a provider event, or the current one if the event should not change it. */
export function nextStatus(current: EmailStatus, incoming: EmailStatus): EmailStatus {
  return RANK[incoming] > RANK[current] ? incoming : current;
}

/** Maps a Resend webhook event name to a status; events we do not track map to null. */
export function statusForEvent(eventType: string): EmailStatus | null {
  switch (eventType) {
    case 'email.delivered': return 'delivered';
    case 'email.delivery_delayed': return 'delayed';
    case 'email.bounced': return 'bounced';
    case 'email.complained': return 'complained';
    case 'email.failed': return 'failed';
    default: return null;
  }
}

export function typeLabel(type: string): string {
  return type.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}

/** Where an administrator can open the record an email was about, if there is a page for it. */
export function relatedLink(entityType: string | null | undefined): string | null {
  switch (entityType) {
    case 'technician_application':
    case 'student_application':
    case 'supplier_application':
    case 'registration_application':
      return '/admin/applications';
    case 'membership':
      return '/admin/memberships';
    case 'contractor_application':
      return '/admin/contractors';
    default:
      return null;
  }
}

/** Email types an administrator can send again from the log without needing the original secret link. */
export const RESENDABLE_TYPES = ['application_verification', 'application_received', 'application_approved'] as const;

export function canResend(type: string, status: string): boolean {
  return (RESENDABLE_TYPES as readonly string[]).includes(type) && (isProblem(status) || status === 'delayed');
}

/** The provider's explanation for a bounce, failure or delay, pulled out of a webhook payload. */
export function eventDetail(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const record = data as Record<string, unknown>;
  const pick = (value: unknown, key: string): string | undefined => {
    if (!value || typeof value !== 'object') return undefined;
    const inner = (value as Record<string, unknown>)[key];
    return typeof inner === 'string' && inner.trim() ? inner.trim().slice(0, 500) : undefined;
  };
  return pick(record.bounce, 'message') ?? pick(record.failed, 'reason') ?? pick(record.delayed, 'message') ?? undefined;
}
