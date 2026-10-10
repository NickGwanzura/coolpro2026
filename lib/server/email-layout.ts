import { SITE_URL } from '@/lib/site-url';

// Shared look for every email the app sends: a white header carrying both logos, an amber accent,
// a content card, and a footer. Layout uses tables and inline styles because that is what mail
// clients (Outlook, Gmail, Apple Mail) render reliably.

export const BRAND = {
  ink: '#1C1917',
  amber: '#D97706',
  amberSoft: '#FEF3C7',
  green: '#5A7D5A',
  line: '#E5E0DB',
  muted: '#78716C',
  soft: '#FAFAF9',
  page: '#F3F1EE',
};

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Absolute URLs: mail clients cannot load images from a relative path. */
export function logoUrls(siteUrl: string = SITE_URL) {
  const base = siteUrl.replace(/\/$/, '');
  return {
    ministry: `${base}/logos/ministry-of-environment.jpeg`,
    hevacraz: `${base}/logos/hevacraz-logo.jpeg`,
  };
}

/**
 * Wraps body content in the branded layout. Every outbound message goes through this, so the
 * logos and footer are guaranteed to be on all of them.
 */
export function emailShell(bodyHtml: string, preview = 'NOU / HEVACRAZ Zimbabwe HVAC Compliance Registry', siteUrl: string = SITE_URL): string {
  const logos = logoUrls(siteUrl);
  const site = siteUrl.replace(/\/$/, '');
  const logoStyle = 'display: block; width: 96px; height: 96px; border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic;';

  return `
<div style="display: none; max-height: 0; overflow: hidden; opacity: 0; color: transparent; mso-hide: all;">${escapeHtml(preview)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${BRAND.page}; font-family: ${FONT};">
  <tr>
    <td align="center" style="padding: 28px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width: 100%; max-width: 600px; background-color: #ffffff; border: 1px solid ${BRAND.line}; border-radius: 12px; overflow: hidden;">
        <tr><td style="height: 5px; line-height: 5px; font-size: 0; background-color: ${BRAND.amber};">&nbsp;</td></tr>
        <tr>
          <td align="center" style="padding: 30px 24px 10px; background-color: #ffffff;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
              <tr>
                <td style="padding: 0 22px 0 0;">
                  <img src="${logos.ministry}" alt="Ministry of Environment, Climate and Wildlife, Government of Zimbabwe" width="96" height="96" style="${logoStyle}" />
                </td>
                <td style="padding: 0 0 0 22px; border-left: 1px solid ${BRAND.line};">
                  <img src="${logos.hevacraz}" alt="HEVACRAZ, Heating, Ventilation, Air Conditioning and Refrigeration Association of Zimbabwe" width="96" height="96" style="${logoStyle}" />
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding: 8px 24px 24px; border-bottom: 1px solid ${BRAND.line};">
            <p style="margin: 0; color: ${BRAND.amber}; font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase;">NOU / HEVACRAZ &middot; National Ozone Unit Zimbabwe</p>
            <p style="margin: 6px 0 0; color: ${BRAND.ink}; font-size: 20px; font-weight: 700; line-height: 1.3;">Zimbabwe HVAC Compliance Registry</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 32px 34px 34px; color: ${BRAND.ink}; font-size: 15px; line-height: 1.7;">
            ${bodyHtml}
          </td>
        </tr>
        <tr>
          <td align="center" style="padding: 24px; background-color: ${BRAND.ink};">
            <p style="margin: 0; color: #D6D3D1; font-size: 12px; line-height: 1.8;">
              <a href="mailto:info@hevacraz.co.zw" style="color: #D6D3D1; text-decoration: none;">info@hevacraz.co.zw</a>
              &nbsp;&middot;&nbsp;
              <a href="mailto:nou@environment.gov.zw" style="color: #D6D3D1; text-decoration: none;">nou@environment.gov.zw</a>
            </p>
            <p style="margin: 8px 0 0; font-size: 12px;">
              <a href="${site}" style="color: ${BRAND.amber}; font-weight: 700; text-decoration: none;">${escapeHtml(site.replace(/^https?:\/\//, ''))}</a>
            </p>
            <p style="margin: 12px 0 0; color: #A8A29E; font-size: 11px; line-height: 1.6;">
              You are receiving this email because of activity on the Zimbabwe HVAC Compliance Registry.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
}

// ---------------------------------------------------------------------------
// Building blocks. Functions taking `text` escape it; those taking `html` expect safe markup.
// ---------------------------------------------------------------------------

export function eyebrow(text: string): string {
  return `<p style="margin: 0 0 10px; color: ${BRAND.green}; font-size: 12px; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase;">${escapeHtml(text)}</p>`;
}

export function heading(text: string): string {
  return `<h1 style="margin: 0 0 14px; color: ${BRAND.ink}; font-size: 24px; font-weight: 750; line-height: 1.3;">${escapeHtml(text)}</h1>`;
}

/** `html` must already be escaped (use escapeHtml on any user-supplied value). */
export function paragraph(html: string): string {
  return `<p style="margin: 0 0 14px; color: ${BRAND.ink}; font-size: 15px; line-height: 1.7;">${html}</p>`;
}

export function smallPrint(html: string): string {
  return `<p style="margin: 22px 0 0; color: ${BRAND.muted}; font-size: 12px; line-height: 1.6;">${html}</p>`;
}

/** A button that stays clickable and coloured in Outlook as well as modern clients. */
export function button(label: string, url: string): string {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 22px 0 6px;">
  <tr>
    <td align="center" bgcolor="${BRAND.amber}" style="background-color: ${BRAND.amber}; border-radius: 8px;">
      <a href="${escapeHtml(url)}" style="display: inline-block; padding: 14px 26px; color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; border-radius: 8px;">${escapeHtml(label)}</a>
    </td>
  </tr>
</table>`;
}

/** Label and value pairs in a bordered card. */
export function detailCard(rows: Array<{ label: string; value: string }>): string {
  const body = rows
    .map(
      (row, index) => `
    <tr>
      <td style="padding: 10px 16px; width: 38%; vertical-align: top; color: ${BRAND.muted}; font-size: 13px; ${index > 0 ? `border-top: 1px solid ${BRAND.line};` : ''}">${escapeHtml(row.label)}</td>
      <td style="padding: 10px 16px; vertical-align: top; color: ${BRAND.ink}; font-size: 14px; font-weight: 600; ${index > 0 ? `border-top: 1px solid ${BRAND.line};` : ''}">${escapeHtml(row.value)}</td>
    </tr>`,
    )
    .join('');
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 18px 0; background-color: ${BRAND.soft}; border: 1px solid ${BRAND.line}; border-radius: 8px;">${body}
</table>`;
}

/** Numbered steps, for "what happens next". */
export function stepList(steps: Array<{ title: string; body: string }>): string {
  const rows = steps
    .map(
      (step, index) => `
    <tr>
      <td width="34" valign="top" style="padding: 0 12px 14px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td align="center" width="26" height="26" bgcolor="${BRAND.ink}" style="width: 26px; height: 26px; background-color: ${BRAND.ink}; border-radius: 13px; color: #ffffff; font-size: 13px; font-weight: 700;">${index + 1}</td>
        </tr></table>
      </td>
      <td valign="top" style="padding: 0 0 14px; color: ${BRAND.ink}; font-size: 14px; line-height: 1.6;">
        <strong>${escapeHtml(step.title)}</strong><br /><span style="color: ${BRAND.muted};">${escapeHtml(step.body)}</span>
      </td>
    </tr>`,
    )
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 18px 0 4px;">${rows}</table>`;
}

export function bulletList(items: string[]): string {
  return `<ul style="margin: 0 0 14px; padding-left: 22px; color: ${BRAND.ink}; font-size: 14px; line-height: 1.8;">${items
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join('')}</ul>`;
}

/** A highlighted note, such as the reason an application was not approved. */
export function callout(text: string, tone: 'info' | 'warning' = 'info'): string {
  const border = tone === 'warning' ? BRAND.amber : BRAND.green;
  const background = tone === 'warning' ? BRAND.amberSoft : BRAND.soft;
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 18px 0;">
  <tr>
    <td style="padding: 14px 16px; background-color: ${background}; border-left: 4px solid ${border}; border-radius: 4px; color: ${BRAND.ink}; font-size: 14px; line-height: 1.6; white-space: pre-line;">${escapeHtml(text)}</td>
  </tr>
</table>`;
}
