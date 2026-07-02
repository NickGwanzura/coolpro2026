/**
 * Outbound email is not wired up yet — Resend integration is planned but not connected.
 * Until then, invite links are never emailed; the admin who creates an invite must copy
 * the link from the dashboard and share it manually. This function intentionally no-ops
 * so the invite flow works end-to-end today and only needs its body filled in later.
 */
export async function sendInviteEmail(_input: {
  email: string;
  inviteUrl: string;
  role: string;
  invitedBy: string;
}): Promise<{ sent: boolean }> {
  // TODO: wire up Resend here. Example shape:
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({ from: ..., to: _input.email, subject: ..., html: ... });
  console.log(`[email] Invite email not sent (Resend not configured yet): ${_input.email} -> ${_input.inviteUrl}`);
  return { sent: false };
}
