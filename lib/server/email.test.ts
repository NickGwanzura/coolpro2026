import { beforeEach, describe, expect, it, vi } from 'vitest';

const send = vi.fn();
const logEmail = vi.fn();
vi.mock('@/lib/server/email-log', () => ({ logEmail: (...args: unknown[]) => logEmail(...args) }));
vi.mock('resend', () => ({
  Resend: class {
    emails = { send };
  },
}));

async function loadEmail() {
  vi.resetModules();
  process.env.RESEND_API_KEY = 'test-key';
  return import('./email');
}

function lastEmail() {
  const call = send.mock.calls.at(-1)?.[0] as { to: string; subject: string; html: string };
  return call;
}

beforeEach(() => {
  send.mockReset();
  send.mockResolvedValue({ data: { id: 're_msg_1' }, error: null });
  logEmail.mockReset();
  logEmail.mockResolvedValue(undefined);
});

describe('verification email', () => {
  it('carries the confirm link, role wording and the expiry', async () => {
    const { sendVerificationEmail } = await loadEmail();
    const result = await sendVerificationEmail({
      email: 'ada@example.com',
      name: 'Ada',
      role: 'trainer',
      verifyUrl: 'https://zimhvacregistry.org/verify-email?token=abc123',
      hours: 48,
    });
    expect(result).toEqual({ sent: true });
    const email = lastEmail();
    expect(email.to).toBe('ada@example.com');
    expect(email.subject).toMatch(/Confirm your email/);
    expect(email.html).toContain('https://zimhvacregistry.org/verify-email?token=abc123');
    expect(email.html).toContain('a trainer or assessor');
    expect(email.html).toContain('48 hours');
    expect(email.subject).toMatch(/Confirm your email/);
    expect(send.mock.calls.at(-1)?.[0].replyTo).toBe('info@hevacraz.co.zw');
    expect(email.html).toContain('We received your application');
    expect(email.html).toContain('upload your ID or certificates');
  });
});

describe('application received email', () => {
  it('tells each role what is being checked and how long it takes', async () => {
    const { sendApplicationReceivedEmail } = await loadEmail();
    await sendApplicationReceivedEmail({ email: 'c@example.com', name: 'Cee', role: 'contractor' });
    const email = lastEmail();
    expect(email.subject).toBe('NOU / HEVACRAZ received your contractor application');
    expect(email.html).toContain('a contractor');
    expect(email.html).toContain('your business and trade details');
    expect(email.html).toContain('about 5 working days');
  });

  it('still works for a technician when no role is given', async () => {
    const { sendApplicationReceivedEmail } = await loadEmail();
    await sendApplicationReceivedEmail({ email: 't@example.com', name: 'Tee' });
    expect(lastEmail().subject).toBe('NOU / HEVACRAZ received your technician application');
  });
});

describe('approval email', () => {
  it('lists what the role can do and links to login', async () => {
    const { sendApprovalEmail } = await loadEmail();
    await sendApprovalEmail({ email: 's@example.com', name: 'Sam', role: 'student' });
    const email = lastEmail();
    expect(email.subject).toBe('Your NOU / HEVACRAZ student application has been approved');
    expect(email.html).toContain('a student');
    expect(email.html).toContain('/login');
    expect(email.html).toContain('Browse approved courses in the Learning Hub and enrol');
  });

  it('handles a role it has no wording for', async () => {
    const { sendApprovalEmail } = await loadEmail();
    await sendApprovalEmail({ email: 'x@example.com', name: 'Xe', role: 'vendor' });
    expect(lastEmail().html).toContain('vendor');
  });
});

describe('rejection email', () => {
  it('shows only the applicant message, escaped, and invites a re-application', async () => {
    const { sendApplicationRejectedEmail } = await loadEmail();
    await sendApplicationRejectedEmail({
      email: 'r@example.com',
      name: 'Rae',
      role: 'lecturer',
      applicantMessage: 'Please add a <b>letter</b> from your college',
    });
    const email = lastEmail();
    expect(email.subject).toBe('Update on your NOU / HEVACRAZ lecturer application');
    expect(email.html).toContain('Please add a &lt;b&gt;letter&lt;/b&gt; from your college');
    expect(email.html).not.toContain('<b>letter</b>');
    expect(email.html).toContain('apply again');
  });

  it('has no message block when none is given', async () => {
    const { sendApplicationRejectedEmail } = await loadEmail();
    await sendApplicationRejectedEmail({ email: 'r@example.com', name: 'Rae', role: 'lecturer' });
    expect(lastEmail().html).not.toContain('Message from the review team');
  });
});

describe('sending safely', () => {
  it('escapes applicant-controlled names', async () => {
    const { sendApplicationReceivedEmail } = await loadEmail();
    await sendApplicationReceivedEmail({ email: 'e@example.com', name: '<script>alert(1)</script>', role: 'student' });
    expect(lastEmail().html).not.toContain('<script>');
  });

  it('reports not sent, without throwing, when the provider rejects', async () => {
    send.mockResolvedValue({ error: { message: 'bad address' } });
    const { sendApprovalEmail } = await loadEmail();
    await expect(sendApprovalEmail({ email: 'e@example.com', name: 'E', role: 'student' })).resolves.toEqual({ sent: false, error: 'bad address' });
  });

  it('reports not sent, without throwing, when sending itself fails', async () => {
    send.mockRejectedValue(new Error('network down'));
    const { sendApprovalEmail } = await loadEmail();
    await expect(sendApprovalEmail({ email: 'e@example.com', name: 'E', role: 'student' })).resolves.toEqual({ sent: false, error: 'network down' });
  });

  it('reports not sent when no API key is configured', async () => {
    vi.resetModules();
    delete process.env.RESEND_API_KEY;
    const { sendApprovalEmail } = await import('./email');
    await expect(sendApprovalEmail({ email: 'e@example.com', name: 'E', role: 'student' })).resolves.toMatchObject({ sent: false });
    expect(send).not.toHaveBeenCalled();
  });
});

describe('new application email for administrators', () => {
  const base = {
    to: 'admin@example.com',
    adminName: 'Admin',
    roleLabel: 'Trainer / Assessor',
    applicantName: 'Ada <Lovelace>',
    applicantEmail: 'ada@example.com',
    details: [
      { label: 'Phone', value: '+263 77 100 0001' },
      { label: 'Province', value: 'Harare' },
    ],
    reviewUrl: 'https://zimhvacregistry.org/admin/applications',
  };

  it('shows who applied, the details, and a review button', async () => {
    const { sendNewApplicationAdminEmail } = await loadEmail();
    await sendNewApplicationAdminEmail({ ...base, emailConfirmed: false });
    const email = lastEmail();
    expect(email.to).toBe('admin@example.com');
    expect(email.subject).toBe('New trainer / assessor application: Ada <Lovelace>');
    expect(email.html).toContain('Ada &lt;Lovelace&gt;');
    expect(email.html).not.toContain('Ada <Lovelace>');
    expect(email.html).toContain('+263 77 100 0001');
    expect(email.html).toContain('https://zimhvacregistry.org/admin/applications');
    expect(email.html).toContain('Review application');
  });

  it('warns when the applicant has not confirmed their email, and not when they have', async () => {
    const { sendNewApplicationAdminEmail } = await loadEmail();
    await sendNewApplicationAdminEmail({ ...base, emailConfirmed: false });
    expect(lastEmail().html).toContain('has been asked to confirm their email');
    await sendNewApplicationAdminEmail({ ...base, emailConfirmed: true });
    expect(lastEmail().html).not.toContain('has been asked to confirm their email');
    expect(lastEmail().html).toContain('Yes, ready to review');
  });
});

describe('branded layout', () => {
  it('shows both logos on every email, with absolute URLs and alt text', async () => {
    const { sendVerificationEmail, sendApprovalEmail, sendApplicationRejectedEmail } = await loadEmail();
    await sendVerificationEmail({ email: 'a@example.com', name: 'A', role: 'student', verifyUrl: 'https://x.test/v', hours: 48 });
    const html = lastEmail().html;
    expect(html).toMatch(/src="https?:\/\/[^"]+\/logos\/ministry-of-environment\.jpeg"/);
    expect(html).toMatch(/src="https?:\/\/[^"]+\/logos\/hevacraz-logo\.jpeg"/);
    expect(html).toContain('alt="Ministry of Environment, Climate and Wildlife, Government of Zimbabwe"');
    expect(html).toContain('alt="HEVACRAZ');
    expect(html).toContain('width="96"');
    for (const send of [
      () => sendApprovalEmail({ email: 'a@example.com', name: 'A', role: 'student' }),
      () => sendApplicationRejectedEmail({ email: 'a@example.com', name: 'A', role: 'student' }),
    ]) {
      await send();
      expect(lastEmail().html).toContain('/logos/ministry-of-environment.jpeg');
      expect(lastEmail().html).toContain('/logos/hevacraz-logo.jpeg');
    }
  });

  it('uses table layout and a hidden preview line for mail clients', async () => {
    const { sendApprovalEmail } = await loadEmail();
    await sendApprovalEmail({ email: 'a@example.com', name: 'A', role: 'student' });
    const html = lastEmail().html;
    expect(html).toContain('role="presentation"');
    expect(html).toContain('display: none');
    expect(html).toContain('Your NOU / HEVACRAZ application has been approved.');
    expect(html).toContain('info@hevacraz.co.zw');
  });
});

describe('every email is recorded in the activity log', () => {
  const lastLog = () => logEmail.mock.calls.at(-1)?.[0] as Record<string, unknown>;

  it('records a successful send with its subject and the provider id, but not the body', async () => {
    const { sendApprovalEmail } = await loadEmail();
    await sendApprovalEmail({ email: 'a@example.com', name: 'A', role: 'student', log: { entityType: 'student_application', entityId: 'id-1', label: 'Ada' } });
    expect(logEmail).toHaveBeenCalledTimes(1);
    expect(lastLog()).toMatchObject({
      emailType: 'application_approved',
      recipientEmail: 'a@example.com',
      subject: 'Your NOU / HEVACRAZ student application has been approved',
      relatedEntityType: 'student_application',
      relatedEntityId: 'id-1',
      relatedLabel: 'Ada',
      sent: true,
      providerMessageId: 're_msg_1',
    });
    expect(JSON.stringify(lastLog())).not.toContain('<table');
  });

  it("records why a send failed, in the provider's words", async () => {
    send.mockResolvedValue({ data: null, error: { message: 'The zimhvacregistry.org domain is not verified.' } });
    const { sendVerificationEmail } = await loadEmail();
    const result = await sendVerificationEmail({ email: 'a@example.com', name: 'A', role: 'student', verifyUrl: 'https://x.test', hours: 48 });
    expect(result).toEqual({ sent: false, error: 'The zimhvacregistry.org domain is not verified.' });
    expect(lastLog()).toMatchObject({ emailType: 'application_verification', sent: false, errorMessage: 'The zimhvacregistry.org domain is not verified.' });
  });

  it('records a thrown network error as a failure with its message', async () => {
    send.mockRejectedValue(new Error('socket hang up'));
    const { sendApprovalEmail } = await loadEmail();
    const result = await sendApprovalEmail({ email: 'a@example.com', name: 'A', role: 'student' });
    expect(result).toEqual({ sent: false, error: 'socket hang up' });
    expect(lastLog()).toMatchObject({ sent: false, errorMessage: 'socket hang up' });
  });

  it('records a missing API key as a failure with a clear reason', async () => {
    vi.resetModules();
    delete process.env.RESEND_API_KEY;
    const { sendApprovalEmail } = await import('./email');
    const result = await sendApprovalEmail({ email: 'a@example.com', name: 'A', role: 'student' });
    expect(result.sent).toBe(false);
    expect(result.error).toMatch(/RESEND_API_KEY/);
    expect(lastLog()).toMatchObject({ sent: false });
    expect(String(lastLog().errorMessage)).toMatch(/not configured/);
  });

  it('still reports the send result when the log itself cannot be written', async () => {
    logEmail.mockRejectedValue(new Error('database down'));
    const { sendApprovalEmail } = await loadEmail();
    await expect(sendApprovalEmail({ email: 'a@example.com', name: 'A', role: 'student' })).resolves.toEqual({ sent: true });
  });

  it('gives each kind of email a sensible default type, and lets a caller override it', async () => {
    const m = await loadEmail();
    await m.sendPasswordResetEmail({ email: 'a@example.com', resetUrl: 'https://x.test/r' });
    expect(lastLog().emailType).toBe('password_reset');
    await m.sendInviteEmail({ email: 'a@example.com', inviteUrl: 'https://x.test/i', role: 'student', invitedBy: 'Admin' });
    expect(lastLog().emailType).toBe('invite');
    await m.sendInviteEmail({ email: 'a@example.com', inviteUrl: 'https://x.test/i', role: 'student', invitedBy: 'Admin', log: { type: 'account_activation' } });
    expect(lastLog().emailType).toBe('account_activation');
    await m.sendMembershipConfirmationEmail({ email: 'a@example.com', name: 'A', membershipNumber: 'M-1', expiryDate: '2027-01-01' });
    expect(lastLog().emailType).toBe('membership_confirmation');
    await m.sendCertificateEmail({ email: 'a@example.com', name: 'A', certificateNumber: 'C-1', pdfBase64: 'AAAA', fileName: 'c.pdf' });
    expect(lastLog().emailType).toBe('certificate');
  });

  it('logs both messages of a contact form submission', async () => {
    const { sendContactEmails } = await loadEmail();
    await sendContactEmails({ name: 'Visitor', email: 'v@example.com', subject: 'Hello', message: 'Hi there' });
    expect(logEmail.mock.calls.map((call) => call[0].emailType)).toEqual(['contact_notification', 'contact_confirmation']);
  });

  it('never stores a reset or invite link', async () => {
    const m = await loadEmail();
    await m.sendPasswordResetEmail({ email: 'a@example.com', resetUrl: 'https://x.test/reset?token=SECRET123' });
    await m.sendInviteEmail({ email: 'a@example.com', inviteUrl: 'https://x.test/invite?token=SECRET456', role: 'student', invitedBy: 'Admin' });
    for (const call of logEmail.mock.calls) expect(JSON.stringify(call[0])).not.toMatch(/SECRET/);
  });

  it('sends replies to the team inbox by default', async () => {
    const { sendApprovalEmail } = await loadEmail();
    await sendApprovalEmail({ email: 'a@example.com', name: 'A', role: 'student' });
    expect(send.mock.calls.at(-1)?.[0].replyTo).toBe('info@hevacraz.co.zw');
  });
});
