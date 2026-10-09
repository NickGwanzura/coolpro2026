// Decision rules for reviewing an application. Pure, so the same checks apply to every role.

export type ReviewAction = 'approve' | 'reject';

const OPEN_STATUSES = ['submitted', 'under-review'];

/**
 * Returns a message explaining why the review cannot go ahead, or null when it can.
 * - Only open applications (submitted or under review) can be decided; a finished one cannot be
 *   approved or rejected again.
 * - An application whose email is still unconfirmed cannot be approved. It can be rejected, so an
 *   admin can clear out a fake or abandoned one.
 */
export function checkDecisionAllowed(input: {
  status: string;
  action: ReviewAction;
  emailUnconfirmed: boolean;
}): string | null {
  if (!OPEN_STATUSES.includes(input.status)) {
    return `A ${input.status} application cannot be ${input.action === 'approve' ? 'approved' : 'rejected'}.`;
  }
  if (input.action === 'approve' && input.emailUnconfirmed) {
    return 'The applicant has not confirmed their email address yet. Ask them to use the link in their confirmation email, or reject the application.';
  }
  return null;
}
