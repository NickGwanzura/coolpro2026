import { beforeEach, describe, expect, it, vi } from 'vitest';

const send = vi.fn();
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
  send.mockResolvedValue({ error: null });
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
    expect(email.html).toContain('We received your application');
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
    await expect(sendApprovalEmail({ email: 'e@example.com', name: 'E', role: 'student' })).resolves.toEqual({ sent: false });
  });

  it('reports not sent, without throwing, when sending itself fails', async () => {
    send.mockRejectedValue(new Error('network down'));
    const { sendApprovalEmail } = await loadEmail();
    await expect(sendApprovalEmail({ email: 'e@example.com', name: 'E', role: 'student' })).resolves.toEqual({ sent: false });
  });

  it('reports not sent when no API key is configured', async () => {
    vi.resetModules();
    delete process.env.RESEND_API_KEY;
    const { sendApprovalEmail } = await import('./email');
    await expect(sendApprovalEmail({ email: 'e@example.com', name: 'E', role: 'student' })).resolves.toEqual({ sent: false });
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
