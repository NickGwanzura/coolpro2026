import { Resend } from 'resend';

const FROM_ADDRESS = 'HEVACRAZ <noreply@zimhvacregistry.org>';

let _resend: Resend | null = null;

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!_resend) _resend = new Resend(apiKey);
  return _resend;
}

function inviteEmailHtml(input: { inviteUrl: string; role: string; invitedBy: string }): string {
  return `
    <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <div style="background: #1C1917; padding: 20px 24px;">
        <p style="color: #D97706; font-size: 11px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; margin: 0 0 4px;">HEVACRAZ / NOU</p>
        <p style="color: #ffffff; font-size: 18px; font-weight: 700; margin: 0;">You've been invited</p>
      </div>
      <div style="padding: 24px; border: 1px solid #E5E0DB; border-top: none;">
        <p style="color: #1C1917; font-size: 14px; line-height: 1.6;">
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
      </div>
    </div>
  `;
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
    console.log(`[email] RESEND_API_KEY not set — invite email not sent: ${input.email} -> ${input.inviteUrl}`);
    return { sent: false };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: input.email,
      subject: 'You’ve been invited to HEVACRAZ / NOU Zimbabwe',
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
