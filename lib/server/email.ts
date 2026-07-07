import { Resend } from 'resend';
import { SITE_URL } from '@/lib/site-url';

const FROM_ADDRESS = 'HEVACRAZ <noreply@zimhvacregistry.org>';

let _resend: Resend | null = null;

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!_resend) _resend = new Resend(apiKey);
  return _resend;
}

function emailShell(bodyHtml: string): string {
  return `
    <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #ffffff;">
      <div style="background: #1C1917; padding: 24px; text-align: center;">
        <img src="${SITE_URL}/logos/hevacraz-logo.jpeg" alt="HEVACRAZ" width="40" height="40"
             style="border-radius: 4px; display: block; margin: 0 auto 10px;" />
        <p style="color: #D97706; font-size: 11px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; margin: 0;">
          HEVACRAZ &middot; National Ozone Unit
        </p>
      </div>
      <div style="padding: 24px; border: 1px solid #E5E0DB; border-top: none;">
        ${bodyHtml}
      </div>
      <div style="padding: 20px 24px; text-align: center;">
        <p style="color: #A8A29E; font-size: 11px; line-height: 1.6; margin: 0;">
          HEVACRAZ &middot; <a href="mailto:info@hevacraz.co.zw" style="color: #A8A29E;">info@hevacraz.co.zw</a><br />
          National Ozone Unit &middot; <a href="mailto:nou@environment.gov.zw" style="color: #A8A29E;">nou@environment.gov.zw</a>
        </p>
      </div>
    </div>
  `;
}

function inviteEmailHtml(input: { inviteUrl: string; role: string; invitedBy: string }): string {
  return emailShell(`
    <p style="color: #1C1917; font-size: 18px; font-weight: 700; margin: 0 0 12px;">You've been invited</p>
    <p style="color: #1C1917; font-size: 14px; line-height: 1.6; margin: 0;">
      ${input.invitedBy} has invited you to join the HEVACRAZ / National Ozone Unit Zimbabwe
      compliance platform as a <strong>${input.role.replace('_', ' ')}</strong>.
    </p>
    <a href="${input.inviteUrl}"
       style="display: inline-block; margin-top: 16px; background: #D97706; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 20px;">
      Accept invite
    </a>
    <p style="color: #78716C; font-size: 12px; margin-top: 20px;">
      This invite expires in 7 days. If you didn't expect this, you can ignore this email.
    </p>
  `);
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
      subject: "You've been invited to HEVACRAZ / NOU Zimbabwe",
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
  return emailShell(`
    <p style="color: #1C1917; font-size: 18px; font-weight: 700; margin: 0 0 12px;">Application approved</p>
    <p style="color: #1C1917; font-size: 14px; line-height: 1.6; margin: 0;">
      Hi ${input.name}, your application to join HEVACRAZ / National Ozone Unit Zimbabwe
      as a <strong>${input.role.replace('_', ' ')}</strong> has been approved.
    </p>
    <p style="color: #1C1917; font-size: 14px; line-height: 1.6; margin: 12px 0 0;">
      You can now log in using the email and password you submitted with your application.
    </p>
    <a href="${input.loginUrl}"
       style="display: inline-block; margin-top: 16px; background: #D97706; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 20px;">
      Log in now
    </a>
    <p style="color: #78716C; font-size: 12px; margin-top: 20px;">
      If you didn't apply for this account, you can ignore this email.
    </p>
  `);
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
      subject: 'Your HEVACRAZ ' + input.role.replace('_', ' ') + ' application has been approved',
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
