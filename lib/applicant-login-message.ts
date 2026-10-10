// What to tell someone who tries to log in while their application is still being processed.
// Pure, so the wording and the decision rules can be tested.

export interface ApplicantLoginState {
  code: 'email_unconfirmed' | 'application_pending' | 'application_rejected';
  message: string;
}

/**
 * Only called after the person proved they own the application by giving its password, so it is
 * safe to say where the application stands. Approved applications are not handled here: an
 * approved applicant has an account and logs in normally.
 */
export function applicantLoginState(input: { status: string; emailUnconfirmed: boolean }): ApplicantLoginState | null {
  if (input.status === 'rejected') {
    return {
      code: 'application_rejected',
      message: 'Your application was not approved, so there is no account to log in to yet. Check the email we sent you for the reason, or apply again from the Join page.',
    };
  }
  if (input.status !== 'submitted' && input.status !== 'under-review') return null;
  if (input.emailUnconfirmed) {
    return {
      code: 'email_unconfirmed',
      message: 'Your application is waiting for you to confirm your email address. Open the confirmation email we sent you and click the button. Nothing there? Check your spam folder, or ask for a new link at zimhvacregistry.org/verify-email.',
    };
  }
  return {
    code: 'application_pending',
    message: 'Your application is still being reviewed, so you cannot log in yet. We will email you as soon as a decision is made.',
  };
}
