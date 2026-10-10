import { Resend } from 'resend';
import { SITE_URL } from '@/lib/site-url';
import { APPLICANT_ROLES, isApplicantRole } from '@/lib/application-roles';
import { BRAND, bulletList, button, callout, detailCard, emailShell, escapeHtml, eyebrow, heading, paragraph, smallPrint, stepList } from '@/lib/server/email-layout';

const FROM_ADDRESS = process.env.EMAIL_FROM ?? 'NOU / HEVACRAZ <noreply@zimhvacregistry.org>';
const CONTACT_TO_ADDRESS = process.env.CONTACT_TO_EMAIL ?? 'info@hevacraz.co.zw';
let _resend: Resend | null = null;

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!_resend) _resend = new Resend(apiKey);
  return _resend;
}

interface OutgoingEmail {
  to: string;
  subject: string;
  html: string;
  /** Short name used in server logs, for example "verification". */
  label: string;
}

/**
 * Single place that sends an email through Resend. Never throws: a missing API key or a failed
 * send is reported as { sent: false } so the caller (an approval, a signup) is never blocked by
 * email trouble. Recipient addresses are not written to logs.
 */
async function deliver(email: OutgoingEmail): Promise<{ sent: boolean }> {
  const resend = getResendClient();
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY not set — ${email.label} email not sent.`);
    return { sent: false };
  }
  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: email.to,
      subject: email.subject,
      html: email.html,
      // Mail is sent from a no-reply address; replies go to the team's real inbox instead.
      replyTo: process.env.EMAIL_REPLY_TO ?? CONTACT_TO_ADDRESS,
    });
    if (error) {
      console.error(`[email] Resend rejected ${email.label} email:`, error.message);
      return { sent: false };
    }
    return { sent: true };
  } catch (err) {
    console.error(`[email] Failed to send ${email.label} email:`, err instanceof Error ? err.message : err);
    return { sent: false };
  }
}

function roleInfo(role: string | undefined) {
  return role && isApplicantRole(role) ? APPLICANT_ROLES[role] : null;
}

function inviteEmailHtml(input: { inviteUrl: string; role: string; invitedBy: string }): string {
  const role = escapeHtml(input.role.replace('_', ' '));
  return emailShell(`
    ${eyebrow('Registry access')}
    ${heading("You've been invited")}
    ${paragraph(`${escapeHtml(input.invitedBy)} has invited you to join the HEVACRAZ / National Ozone Unit Zimbabwe compliance platform as a <strong>${role}</strong>.`)}
    ${button('Accept invite', input.inviteUrl)}
    ${smallPrint("This invite expires in 7 days. If you didn't expect it, you can ignore this email.")}
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
    // Invite URLs are bearer credentials; never write them (or recipient addresses) to logs.
    console.warn('[email] RESEND_API_KEY not set — invite email not sent.');
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
  const info = roleInfo(input.role);
  const roleText = info ? escapeHtml(info.withArticle) : `a ${escapeHtml(input.role.replace('_', ' '))}`;
  return emailShell(`
    ${eyebrow('Application approved')}
    ${heading("You're approved")}
    ${paragraph(`Hi ${escapeHtml(input.name)}, your application to join HEVACRAZ / National Ozone Unit Zimbabwe as ${roleText} has been approved. Your account is ready.`)}
    ${paragraph('Log in with the email address and password you chose when you applied.')}
    ${button('Log in now', input.loginUrl)}
    ${info ? `<p style="margin: 22px 0 6px; font-size: 15px; font-weight: 700;">What you can do now</p>${bulletList(info.afterApproval)}` : ''}
    ${smallPrint('Forgotten your password? Use "Forgot password" on the login page. If you didn\'t apply for this account, you can ignore this email.')}
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
  const loginUrl = `${SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login`;
  return deliver({
    to: input.email,
    subject: 'Your NOU / HEVACRAZ ' + (roleInfo(input.role)?.label ?? input.role.replace('_', ' ')).toLowerCase() + ' application has been approved',
    html: approvalEmailHtml({ ...input, loginUrl }),
    label: 'approval',
  });
}

// ---------------------------------------------------------------------------
// New application alert for administrators
// ---------------------------------------------------------------------------

export interface NewApplicationAdminEmail {
  to: string;
  adminName: string;
  roleLabel: string;
  applicantName: string;
  applicantEmail: string;
  /** Extra facts about the applicant, shown in a table (phone, province, organisation ...). */
  details: Array<{ label: string; value: string }>;
  /** False when the applicant has not yet clicked their confirmation link. */
  emailConfirmed: boolean;
  reviewUrl: string;
}

function newApplicationAdminEmailHtml(input: NewApplicationAdminEmail): string {
  const role = input.roleLabel.toLowerCase();
  return emailShell(`
    ${eyebrow('Action needed')}
    ${heading(`New ${role} application`)}
    ${paragraph(`Hello ${escapeHtml(input.adminName)}, <strong>${escapeHtml(input.applicantName)}</strong> has submitted a ${escapeHtml(role)} application to join the registry.`)}
    ${detailCard([
      { label: 'Role', value: input.roleLabel },
      { label: 'Name', value: input.applicantName },
      { label: 'Email', value: input.applicantEmail },
      ...input.details,
      { label: 'Email confirmed', value: input.emailConfirmed ? 'Yes, ready to review' : 'Not yet' },
    ])}
    ${input.emailConfirmed
      ? ''
      : callout('The applicant has been asked to confirm their email address. You can approve the application once they have; the Applications page will show it as ready.', 'warning')}
    ${button('Review application', input.reviewUrl)}
    ${smallPrint('You are getting this because you are an administrator of the registry. Approving or rejecting sends the applicant an email.')}
  `, `New ${role} application from ${input.applicantName}.`);
}

/** Tells an administrator that a new application has been submitted. */
export async function sendNewApplicationAdminEmail(input: NewApplicationAdminEmail): Promise<{ sent: boolean }> {
  return deliver({
    to: input.to,
    subject: `New ${input.roleLabel.toLowerCase()} application: ${input.applicantName}`,
    html: newApplicationAdminEmailHtml(input),
    label: 'new-application-admin',
  });
}

// ---------------------------------------------------------------------------
// Admin operational notices
// ---------------------------------------------------------------------------

function adminNoticeEmailHtml(input: { name: string; title: string; message: string; action?: string }): string {
  return emailShell(`
    ${eyebrow('Platform update')}
    ${heading(input.title)}
    ${paragraph(`Hello ${escapeHtml(input.name)},`)}
    ${paragraph(escapeHtml(input.message))}
    ${input.action ? callout(`Action: ${input.action}`, 'warning') : ''}
  `, input.title);
}

export async function sendAdminNoticeEmail(input: {
  email: string;
  name: string;
  title: string;
  message: string;
  action?: string;
}): Promise<{ sent: boolean }> {
  return deliver({
    to: input.email,
    subject: `NOU / HEVACRAZ update: ${input.title}`,
    html: adminNoticeEmailHtml(input),
    label: 'admin-notice',
  });
}

function platformUpdateEmailHtml(input: {
  name: string;
  title: string;
  intro: string;
  sections: Array<{ heading: string; body: string }>;
}): string {
  const name = escapeHtml(input.name);
  const title = escapeHtml(input.title);
  const intro = escapeHtml(input.intro).replace(/\n/g, '<br />');
  const sectionsHtml = input.sections
    .map((section) => `
      <div style="margin-top: 18px;">
        <p style="color: ${BRAND.ink}; font-size: 15px; font-weight: 750; margin: 0 0 6px;">${escapeHtml(section.heading)}</p>
        <p style="color: ${BRAND.ink}; font-size: 14px; line-height: 1.7; margin: 0;">${escapeHtml(section.body).replace(/\n/g, '<br />')}</p>
      </div>
    `)
    .join('');

  return emailShell(`
    <p style="color: ${BRAND.green}; font-size: 12px; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; margin: 0 0 10px;">Platform update</p>
    <p style="color: ${BRAND.ink}; font-size: 22px; font-weight: 750; margin: 0 0 12px;">${title}</p>
    <p style="color: ${BRAND.ink}; font-size: 14px; line-height: 1.7; margin: 0;">Hello ${name},</p>
    <p style="color: ${BRAND.ink}; font-size: 14px; line-height: 1.7; margin: 12px 0 0;">${intro}</p>
    ${sectionsHtml}
  `, input.title);
}

/** Sends a multi-section branded platform-update email to an administrator. */
export async function sendPlatformUpdateEmail(input: {
  email: string;
  name: string;
  title: string;
  intro: string;
  sections: Array<{ heading: string; body: string }>;
}): Promise<{ sent: boolean }> {
  const resend = getResendClient();
  if (!resend) {
    console.log('[email] RESEND_API_KEY not set — platform update not sent:', input.email);
    return { sent: false };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: input.email,
      subject: `NOU / HEVACRAZ update: ${input.title}`,
      html: platformUpdateEmailHtml(input),
    });

    if (error) {
      console.error('[email] Resend rejected platform update:', error.message);
      return { sent: false };
    }

    return { sent: true };
  } catch (err) {
    console.error('[email] Failed to send platform update:', err instanceof Error ? err.message : err);
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

function applicationReceivedEmailHtml(input: { name: string; role?: string }): string {
  const info = roleInfo(input.role ?? 'technician');
  const who = info ? escapeHtml(info.withArticle) : 'a member';
  const focus = info ? escapeHtml(info.reviewFocus) : 'your details';
  const time = info ? info.reviewTime : 'a few working days';
  return emailShell(`
    ${eyebrow('Email confirmed')}
    ${heading('Your application is in review')}
    ${paragraph(`Thanks, ${escapeHtml(input.name)}. Your email is confirmed and your application to join as ${who} is now with the HEVACRAZ review team. We are checking ${focus}.`)}
    ${stepList([
      { title: 'Email confirmed', body: 'Done. Thank you.' },
      { title: 'Review in progress', body: `A reviewer will look at your application, usually within ${time}.` },
      { title: 'You hear from us', body: 'We email you the decision. If approved, you can log in straight away.' },
    ])}
    ${smallPrint('You do not need to do anything else. Questions? Email info@hevacraz.co.zw.')}
  `, 'Your NOU / HEVACRAZ application is now in review.');
}

export async function sendApplicationReceivedEmail(input: { email: string; name: string; role?: string }): Promise<{ sent: boolean }> {
  const label = roleInfo(input.role ?? 'technician')?.label.toLowerCase() ?? 'registry';
  return deliver({
    to: input.email,
    subject: `NOU / HEVACRAZ received your ${label} application`,
    html: applicationReceivedEmailHtml(input),
    label: 'application-received',
  });
}

function verificationEmailHtml(input: { name: string; role: string; verifyUrl: string; hours: number }): string {
  const info = roleInfo(input.role);
  const who = info ? escapeHtml(info.withArticle) : 'a member';
  return emailShell(`
    ${eyebrow('Application submitted')}
    ${heading('We received your application')}
    ${paragraph(`Hi ${escapeHtml(input.name)}, thanks for applying to join HEVACRAZ / National Ozone Unit Zimbabwe as ${who}. There is one more step: please confirm this email address so we can start reviewing.`)}
    ${button('Confirm my email', input.verifyUrl)}
    ${stepList([
      { title: 'Application submitted', body: 'Done. An administrator has been told.' },
      { title: 'Confirm your email and add your documents', body: 'Click the button above. On the next page you can upload your ID or certificates.' },
      { title: 'Review and decision', body: info ? `We check ${info.reviewFocus}, usually within ${info.reviewTime}, then email you.` : 'We review your application and email you the decision.' },
    ])}
    ${smallPrint(`This link works for ${input.hours} hours. Your application is not reviewed until you confirm. If you didn't apply, you can ignore this email and nothing will happen.`)}
  `, 'We received your application. Confirm your email to start the review.');
}

export async function sendVerificationEmail(input: {
  email: string;
  name: string;
  role: string;
  verifyUrl: string;
  hours: number;
}): Promise<{ sent: boolean }> {
  return deliver({
    to: input.email,
    subject: 'Confirm your email for your NOU / HEVACRAZ application',
    html: verificationEmailHtml(input),
    label: 'verification',
  });
}

function applicationRejectedEmailHtml(input: { name: string; role?: string; applicantMessage?: string }): string {
  const role = roleInfo(input.role)?.label.toLowerCase() ?? input.role?.replace('_', ' ') ?? 'application';
  return emailShell(`
    ${eyebrow('Application update')}
    ${heading('Application not approved')}
    ${paragraph(`Hi ${escapeHtml(input.name)}, your HEVACRAZ / National Ozone Unit Zimbabwe ${escapeHtml(role)} application was not approved at this time.`)}
    ${input.applicantMessage ? `${paragraph('<strong>Message from the review team</strong>')}${callout(input.applicantMessage, 'warning')}` : ''}
    ${paragraph('You are welcome to apply again once you have addressed the points above.')}
    ${smallPrint('If you have questions, contact HEVACRAZ at info@hevacraz.co.zw.')}
  `, 'Your NOU / HEVACRAZ application was not approved.');
}

/**
 * Sent to an applicant when their application is rejected. Only ever carries the optional
 * applicant-facing message — internal admin notes are a completely separate field on the
 * application record and must never be passed into this function.
 */
export async function sendApplicationRejectedEmail(input: {
  email: string;
  name: string;
  role?: string;
  applicantMessage?: string;
}): Promise<{ sent: boolean }> {
  return deliver({
    to: input.email,
    subject: 'Update on your NOU / HEVACRAZ ' + (roleInfo(input.role)?.label.toLowerCase() ?? input.role?.replace('_', ' ') ?? '') + ' application',
    html: applicationRejectedEmailHtml(input),
    label: 'rejection',
  });
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

function certificateEmailHtml(input: { name: string; certificateNumber: string }): string {
  const name = escapeHtml(input.name);
  const certificateNumber = escapeHtml(input.certificateNumber);
  return emailShell(`
    <p style="color: ${BRAND.green}; font-size: 12px; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; margin: 0 0 10px;">Certificate of competency</p>
    <p style="color: ${BRAND.ink}; font-size: 22px; font-weight: 750; margin: 0 0 12px;">Your certificate is attached, ${name}</p>
    <p style="color: ${BRAND.ink}; font-size: 14px; line-height: 1.7; margin: 0;">
      Your National Certificate of Competency (${certificateNumber}) is attached to this email as a PDF.
      It carries a QR code that can be scanned at any time to independently verify it on the public
      HEVACRAZ registry.
    </p>
  `, `Your certificate ${certificateNumber} is attached.`);
}

/** Emails a pre-generated certificate PDF (built client-side with the technician's photo/QR) as an attachment. */
export async function sendCertificateEmail(input: {
  email: string;
  name: string;
  certificateNumber: string;
  pdfBase64: string;
  fileName: string;
}): Promise<{ sent: boolean }> {
  const resend = getResendClient();
  if (!resend) {
    console.log('[email] RESEND_API_KEY not set — certificate not sent:', input.email);
    return { sent: false };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: input.email,
      subject: `Your NOU / HEVACRAZ certificate — ${input.certificateNumber}`,
      html: certificateEmailHtml(input),
      attachments: [{ filename: input.fileName, content: input.pdfBase64, contentType: 'application/pdf' }],
    });
    if (error) {
      console.error('[email] Resend rejected certificate email:', error.message);
      return { sent: false };
    }
    return { sent: true };
  } catch (err) {
    console.error('[email] Failed to send certificate email:', err instanceof Error ? err.message : err);
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

export async function sendPasswordResetEmail(input: {
  email: string;
  resetUrl: string;
}): Promise<{ sent: boolean }> {
  const resend = getResendClient();
  if (!resend) return { sent: false };

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: input.email,
      subject: 'Reset your NOU / HEVACRAZ password',
      html: emailShell(`
        <p style="color: ${BRAND.green}; font-size: 12px; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; margin: 0 0 10px;">Account security</p>
        <p style="color: ${BRAND.ink}; font-size: 22px; font-weight: 750; margin: 0 0 12px;">Reset your password</p>
        <p style="color: ${BRAND.ink}; font-size: 14px; line-height: 1.7; margin: 0;">
          We received a request to reset the password for your HEVACRAZ Compliance Platform account.
          Use the secure link below within 30 minutes. If you didn't request this, you can ignore this email.
        </p>
        <a href="${escapeHtml(input.resetUrl)}"
           style="display: inline-block; margin-top: 18px; background: ${BRAND.amber}; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 13px 22px; border-radius: 4px;">
          Reset password
        </a>
      `, 'A password reset was requested for your HEVACRAZ account.'),
    });

    if (error) {
      console.error('[email] Resend rejected password reset email:', error.message);
      return { sent: false };
    }
    return { sent: true };
  } catch (err) {
    console.error('[email] Failed to send password reset email:', err instanceof Error ? err.message : err);
    return { sent: false };
  }
}
