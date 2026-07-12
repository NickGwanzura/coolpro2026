import { Resend } from 'resend';
import { SITE_URL } from '@/lib/site-url';

const FROM_ADDRESS = process.env.EMAIL_FROM ?? 'NOU / HEVACRAZ <noreply@zimhvacregistry.org>';
const CONTACT_TO_ADDRESS = process.env.CONTACT_TO_EMAIL ?? 'info@hevacraz.co.zw';
const BRAND = {
  ink: '#1C1917',
  amber: '#D97706',
  green: '#5A7D5A',
  line: '#E5E0DB',
  muted: '#78716C',
  soft: '#FAFAF9',
};

let _resend: Resend | null = null;

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!_resend) _resend = new Resend(apiKey);
  return _resend;
}

// Every email in this app renders through emailShell, so the NOU / HEVACRAZ header banner
// (logo + brand line) and footer are guaranteed to appear on every outbound message —
// this is the single point of control for that requirement.
function emailShell(bodyHtml: string, preview = 'NOU / HEVACRAZ Zimbabwe HVAC Compliance Registry'): string {
  return `
    <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; color: transparent;">
      ${escapeHtml(preview)}
    </div>
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #ffffff;">
      <div style="background: ${BRAND.ink}; padding: 28px 24px; text-align: center;">
        <img src="${SITE_URL}/logos/hevacraz-logo.jpeg" alt="NOU / HEVACRAZ" width="40" height="40"
             style="border-radius: 6px; display: block; margin: 0 auto 12px;" />
        <p style="color: ${BRAND.amber}; font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; margin: 0;">
          NOU / HEVACRAZ &middot; National Ozone Unit Zimbabwe
        </p>
        <p style="color: #ffffff; font-size: 20px; font-weight: 750; margin: 8px 0 0;">
          Zimbabwe HVAC Compliance Registry
        </p>
      </div>
      <div style="padding: 28px; border: 1px solid ${BRAND.line}; border-top: none;">
        ${bodyHtml}
      </div>
      <div style="padding: 22px 24px; text-align: center; background: ${BRAND.soft};">
        <p style="color: ${BRAND.muted}; font-size: 11px; line-height: 1.7; margin: 0;">
          NOU / HEVACRAZ &middot; <a href="mailto:info@hevacraz.co.zw" style="color: ${BRAND.muted};">info@hevacraz.co.zw</a><br />
          National Ozone Unit &middot; <a href="mailto:nou@environment.gov.zw" style="color: ${BRAND.muted};">nou@environment.gov.zw</a><br />
          <a href="${SITE_URL}" style="color: ${BRAND.amber}; font-weight: 700; text-decoration: none;">${SITE_URL.replace(/^https?:\/\//, '')}</a>
        </p>
      </div>
    </div>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function inviteEmailHtml(input: { inviteUrl: string; role: string; invitedBy: string }): string {
  const invitedBy = escapeHtml(input.invitedBy);
  const role = escapeHtml(input.role.replace('_', ' '));
  const inviteUrl = escapeHtml(input.inviteUrl);

  return emailShell(`
    <p style="color: ${BRAND.green}; font-size: 12px; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; margin: 0 0 10px;">Registry access</p>
    <p style="color: ${BRAND.ink}; font-size: 22px; font-weight: 750; margin: 0 0 12px;">You've been invited</p>
    <p style="color: ${BRAND.ink}; font-size: 14px; line-height: 1.7; margin: 0;">
      ${invitedBy} has invited you to join the HEVACRAZ / National Ozone Unit Zimbabwe
      compliance platform as a <strong>${role}</strong>.
    </p>
    <a href="${inviteUrl}"
       style="display: inline-block; margin-top: 18px; background: ${BRAND.amber}; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 13px 22px; border-radius: 4px;">
      Accept invite
    </a>
    <p style="color: ${BRAND.muted}; font-size: 12px; line-height: 1.6; margin-top: 20px;">
      This invite expires in 7 days. If you didn't expect this, you can ignore this email.
    </p>
  `, 'You have been invited to the NOU / HEVACRAZ Zimbabwe registry.');
}

/**
 * Sends an invite email via Resend. Never throws — a failed/unconfigured send should never
 * break invite creation itself; the invite link remains valid and copyable from the admin
 * dashboard regardless of email delivery outcome.
 */
export async function sendInviteEmail(input: {
  email: string;
  inviteUrl: string;
  role: string;
  invitedBy: string;
}): Promise<{ sent: boolean }> {
  const resend = getResendClient();
  if (!resend) {
    console.log('[email] RESEND_API_KEY not set — invite email not sent:', input.email, '->', input.inviteUrl);
    return { sent: false };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: input.email,
      subject: "You've been invited to NOU / HEVACRAZ Zimbabwe",
      html: inviteEmailHtml(input),
    });

    if (error) {
      console.error('[email] Resend rejected invite email:', error.message);
      return { sent: false };
    }

    return { sent: true };
  } catch (err) {
    console.error('[email] Failed to send invite email:', err instanceof Error ? err.message : err);
    return { sent: false };
  }
}

// ---------------------------------------------------------------------------
// Approval notification email (application-based registrations)
// ---------------------------------------------------------------------------

function approvalEmailHtml(input: {
  name: string;
  role: string;
  loginUrl: string;
}): string {
  const name = escapeHtml(input.name);
  const role = escapeHtml(input.role.replace('_', ' '));
  const loginUrl = escapeHtml(input.loginUrl);

  return emailShell(`
    <p style="color: ${BRAND.green}; font-size: 12px; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; margin: 0 0 10px;">Application update</p>
    <p style="color: ${BRAND.ink}; font-size: 22px; font-weight: 750; margin: 0 0 12px;">Application approved</p>
    <p style="color: ${BRAND.ink}; font-size: 14px; line-height: 1.7; margin: 0;">
      Hi ${name}, your application to join HEVACRAZ / National Ozone Unit Zimbabwe
      as a <strong>${role}</strong> has been approved.
    </p>
    <p style="color: ${BRAND.ink}; font-size: 14px; line-height: 1.7; margin: 12px 0 0;">
      You can now log in using the email and password you submitted with your application.
    </p>
    <a href="${loginUrl}"
       style="display: inline-block; margin-top: 18px; background: ${BRAND.amber}; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 13px 22px; border-radius: 4px;">
      Log in now
    </a>
    <p style="color: ${BRAND.muted}; font-size: 12px; line-height: 1.6; margin-top: 20px;">
      If you didn't apply for this account, you can ignore this email.
    </p>
  `, 'Your NOU / HEVACRAZ application has been approved.');
}

/**
 * Sends an approval notification email via Resend. Never throws — a failed send should never
 * break the approval itself. The admin can always communicate with the applicant manually.
 */
export async function sendApprovalEmail(input: {
  email: string;
  name: string;
  role: string;
}): Promise<{ sent: boolean }> {
  const resend = getResendClient();
  if (!resend) {
    console.log('[email] RESEND_API_KEY not set — approval email not sent:', input.email);
    return { sent: false };
  }

  const loginUrl = `${SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login`;

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: input.email,
      subject: 'Your NOU / HEVACRAZ ' + input.role.replace('_', ' ') + ' application has been approved',
      html: approvalEmailHtml({ ...input, loginUrl }),
    });

    if (error) {
      console.error('[email] Resend rejected approval email:', error.message);
      return { sent: false };
    }

    return { sent: true };
  } catch (err) {
    console.error('[email] Failed to send approval email:', err instanceof Error ? err.message : err);
    return { sent: false };
  }
}

// ---------------------------------------------------------------------------
// Admin operational notices
// ---------------------------------------------------------------------------

function adminNoticeEmailHtml(input: { name: string; title: string; message: string; action?: string }): string {
  const name = escapeHtml(input.name);
  const title = escapeHtml(input.title);
  const message = escapeHtml(input.message);
  const action = input.action ? escapeHtml(input.action) : null;

  return emailShell(`
    <p style="color: ${BRAND.green}; font-size: 12px; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; margin: 0 0 10px;">Platform update</p>
    <p style="color: ${BRAND.ink}; font-size: 22px; font-weight: 750; margin: 0 0 12px;">${title}</p>
    <p style="color: ${BRAND.ink}; font-size: 14px; line-height: 1.7; margin: 0;">Hello ${name},</p>
    <p style="color: ${BRAND.ink}; font-size: 14px; line-height: 1.7; margin: 12px 0 0;">${message}</p>
    ${action ? `<div style="margin-top: 18px; border-left: 3px solid ${BRAND.amber}; background: ${BRAND.soft}; padding: 12px 14px; color: ${BRAND.ink}; font-size: 14px; line-height: 1.6;"><strong>Action:</strong> ${action}</div>` : ''}
  `, input.title);
}

/** Sends a branded operational update to an administrator. */
export async function sendAdminNoticeEmail(input: {
  email: string;
  name: string;
  title: string;
  message: string;
  action?: string;
}): Promise<{ sent: boolean }> {
  const resend = getResendClient();
  if (!resend) {
    console.log('[email] RESEND_API_KEY not set — admin notice not sent:', input.email);
    return { sent: false };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: input.email,
      subject: `NOU / HEVACRAZ update: ${input.title}`,
      html: adminNoticeEmailHtml(input),
    });

    if (error) {
      console.error('[email] Resend rejected admin notice:', error.message);
      return { sent: false };
    }

    return { sent: true };
  } catch (err) {
    console.error('[email] Failed to send admin notice:', err instanceof Error ? err.message : err);
    return { sent: false };
  }
}

function contactNotificationHtml(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): string {
  const name = escapeHtml(input.name);
  const email = escapeHtml(input.email);
  const subject = escapeHtml(input.subject);
  const message = escapeHtml(input.message).replace(/\n/g, '<br />');

  return emailShell(`
    <p style="color: ${BRAND.green}; font-size: 12px; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; margin: 0 0 10px;">Website enquiry</p>
    <p style="color: ${BRAND.ink}; font-size: 22px; font-weight: 750; margin: 0 0 12px;">New contact message</p>
    <div style="background: ${BRAND.soft}; border: 1px solid ${BRAND.line}; padding: 16px; margin: 0 0 18px;">
      <p style="margin: 0 0 8px; color: ${BRAND.ink}; font-size: 14px;"><strong>Name:</strong> ${name}</p>
      <p style="margin: 0 0 8px; color: ${BRAND.ink}; font-size: 14px;"><strong>Email:</strong> <a href="mailto:${email}" style="color: ${BRAND.amber};">${email}</a></p>
      <p style="margin: 0; color: ${BRAND.ink}; font-size: 14px;"><strong>Topic:</strong> ${subject}</p>
    </div>
    <p style="color: ${BRAND.ink}; font-size: 14px; line-height: 1.7; margin: 0;">${message}</p>
  `, `New NOU / HEVACRAZ website enquiry from ${input.name}.`);
}

function contactConfirmationHtml(input: {
  name: string;
  subject: string;
}): string {
  const name = escapeHtml(input.name);
  const subject = escapeHtml(input.subject);

  return emailShell(`
    <p style="color: ${BRAND.green}; font-size: 12px; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; margin: 0 0 10px;">Message received</p>
    <p style="color: ${BRAND.ink}; font-size: 22px; font-weight: 750; margin: 0 0 12px;">Thanks, ${name}</p>
    <p style="color: ${BRAND.ink}; font-size: 14px; line-height: 1.7; margin: 0;">
      We received your HEVACRAZ enquiry about <strong>${subject}</strong>. A member of the team will respond within one working day.
    </p>
    <a href="${SITE_URL}/contact"
       style="display: inline-block; margin-top: 18px; background: ${BRAND.amber}; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 13px 22px; border-radius: 4px;">
      Visit contact page
    </a>
  `, 'NOU / HEVACRAZ received your message.');
}

// ---------------------------------------------------------------------------
// Technician application lifecycle emails
// ---------------------------------------------------------------------------

function applicationReceivedEmailHtml(input: { name: string }): string {
  const name = escapeHtml(input.name);
  return emailShell(`
    <p style="color: ${BRAND.green}; font-size: 12px; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; margin: 0 0 10px;">Application received</p>
    <p style="color: ${BRAND.ink}; font-size: 22px; font-weight: 750; margin: 0 0 12px;">Thanks, ${name}</p>
    <p style="color: ${BRAND.ink}; font-size: 14px; line-height: 1.7; margin: 0;">
      Your technician registration application has been received and is now in the HEVACRAZ
      review queue. We'll email you as soon as a decision has been made.
    </p>
  `, 'Your HEVACRAZ technician application has been received.');
}

/** Sent to an applicant immediately after they submit a technician application. */
export async function sendApplicationReceivedEmail(input: { email: string; name: string }): Promise<{ sent: boolean }> {
  const resend = getResendClient();
  if (!resend) {
    console.log('[email] RESEND_API_KEY not set — application-received email not sent:', input.email);
    return { sent: false };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: input.email,
      subject: 'NOU / HEVACRAZ received your technician application',
      html: applicationReceivedEmailHtml(input),
    });
    if (error) {
      console.error('[email] Resend rejected application-received email:', error.message);
      return { sent: false };
    }
    return { sent: true };
  } catch (err) {
    console.error('[email] Failed to send application-received email:', err instanceof Error ? err.message : err);
    return { sent: false };
  }
}

function applicationRejectedEmailHtml(input: { name: string; applicantMessage?: string }): string {
  const name = escapeHtml(input.name);
  const message = input.applicantMessage ? escapeHtml(input.applicantMessage) : null;
  return emailShell(`
    <p style="color: ${BRAND.green}; font-size: 12px; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; margin: 0 0 10px;">Application update</p>
    <p style="color: ${BRAND.ink}; font-size: 22px; font-weight: 750; margin: 0 0 12px;">Application not approved</p>
    <p style="color: ${BRAND.ink}; font-size: 14px; line-height: 1.7; margin: 0;">
      Hi ${name}, your HEVACRAZ technician registration application was not approved at this time.
    </p>
    ${message ? `<div style="margin-top: 18px; border-left: 3px solid ${BRAND.amber}; background: ${BRAND.soft}; padding: 12px 14px; color: ${BRAND.ink}; font-size: 14px; line-height: 1.6;">${message}</div>` : ''}
    <p style="color: ${BRAND.muted}; font-size: 12px; line-height: 1.6; margin-top: 20px;">
      If you have questions, contact HEVACRAZ at info@hevacraz.co.zw.
    </p>
  `, 'Your NOU / HEVACRAZ technician application was not approved.');
}

/**
 * Sent to an applicant when their application is rejected. Only ever carries the optional
 * applicant-facing message — internal admin notes are a completely separate field on the
 * application record and must never be passed into this function.
 */
export async function sendApplicationRejectedEmail(input: {
  email: string;
  name: string;
  applicantMessage?: string;
}): Promise<{ sent: boolean }> {
  const resend = getResendClient();
  if (!resend) {
    console.log('[email] RESEND_API_KEY not set — rejection email not sent:', input.email);
    return { sent: false };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: input.email,
      subject: 'Update on your NOU / HEVACRAZ technician application',
      html: applicationRejectedEmailHtml(input),
    });
    if (error) {
      console.error('[email] Resend rejected rejection email:', error.message);
      return { sent: false };
    }
    return { sent: true };
  } catch (err) {
    console.error('[email] Failed to send rejection email:', err instanceof Error ? err.message : err);
    return { sent: false };
  }
}

function membershipConfirmationEmailHtml(input: { name: string; membershipNumber: string; expiryDate: string }): string {
  const name = escapeHtml(input.name);
  const membershipNumber = escapeHtml(input.membershipNumber);
  const expiryDate = escapeHtml(input.expiryDate);
  return emailShell(`
    <p style="color: ${BRAND.green}; font-size: 12px; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; margin: 0 0 10px;">Membership confirmed</p>
    <p style="color: ${BRAND.ink}; font-size: 22px; font-weight: 750; margin: 0 0 12px;">Welcome to HEVACRAZ, ${name}</p>
    <p style="color: ${BRAND.ink}; font-size: 14px; line-height: 1.7; margin: 0;">
      Your HEVACRAZ membership is now active.
    </p>
    <div style="margin-top: 18px; background: ${BRAND.soft}; border: 1px solid ${BRAND.line}; padding: 16px;">
      <p style="margin: 0 0 8px; color: ${BRAND.ink}; font-size: 14px;"><strong>Membership number:</strong> ${membershipNumber}</p>
      <p style="margin: 0; color: ${BRAND.ink}; font-size: 14px;"><strong>Valid until:</strong> ${expiryDate}</p>
    </div>
  `, `Your HEVACRAZ membership ${membershipNumber} is now active.`);
}

/** Sent when a membership is created/activated for a technician. */
export async function sendMembershipConfirmationEmail(input: {
  email: string;
  name: string;
  membershipNumber: string;
  expiryDate: string;
}): Promise<{ sent: boolean }> {
  const resend = getResendClient();
  if (!resend) {
    console.log('[email] RESEND_API_KEY not set — membership confirmation not sent:', input.email);
    return { sent: false };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: input.email,
      subject: 'Your NOU / HEVACRAZ membership is active',
      html: membershipConfirmationEmailHtml(input),
    });
    if (error) {
      console.error('[email] Resend rejected membership confirmation:', error.message);
      return { sent: false };
    }
    return { sent: true };
  } catch (err) {
    console.error('[email] Failed to send membership confirmation:', err instanceof Error ? err.message : err);
    return { sent: false };
  }
}

export async function sendContactEmails(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<{ sent: boolean }> {
  const resend = getResendClient();
  if (!resend) {
    console.log('[email] RESEND_API_KEY not set — contact email not sent:', input.email);
    return { sent: false };
  }

  try {
    const notification = await resend.emails.send({
      from: FROM_ADDRESS,
      to: CONTACT_TO_ADDRESS,
      replyTo: input.email,
      subject: `NOU / HEVACRAZ website enquiry: ${input.subject}`,
      html: contactNotificationHtml(input),
    });

    if (notification.error) {
      console.error('[email] Resend rejected contact notification:', notification.error.message);
      return { sent: false };
    }

    const confirmation = await resend.emails.send({
      from: FROM_ADDRESS,
      to: input.email,
      subject: 'NOU / HEVACRAZ received your message',
      html: contactConfirmationHtml(input),
    });

    if (confirmation.error) {
      console.error('[email] Resend rejected contact confirmation:', confirmation.error.message);
      return { sent: false };
    }

    return { sent: true };
  } catch (err) {
    console.error('[email] Failed to send contact email:', err instanceof Error ? err.message : err);
    return { sent: false };
  }
}
