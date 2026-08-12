/**
 * Figma `1311:449` Forgot Password email HTML.
 *
 * Same 600px table shell as the order-shipped email (no floating card,
 * no CSS/image drop shadow — Gmail mangles both). Headline and body are
 * rasterized Sanchez / Noto Sans so Gmail keeps those faces. Body has two
 * 16px PNGs: full-width wrap for laptop, ~320px wrap for phone (`@media` swap
 * so type does not shrink with the 600px shell). Support and footer copy are
 * 14px Noto Sans PNGs (links wrap those images). Headline and CTA stay Sanchez.
 * The CTA is a Sanchez PNG (same 18px / 16×37 padding box as Track Order)
 * because Gmail will not load Sanchez on an HTML button.
 */

export type PasswordResetEmailInput = {
  resetUrl: string;
};

export const PASSWORD_RESET_EMAIL_SUBJECT = 'Forgot Password?';

/** Placeholder CTA target for preview/test sends until a recovery link exists. */
export const PASSWORD_RESET_EMAIL_PLACEHOLDER_URL = 'https://cleanupgiveback.org/reset-password';

export const PASSWORD_RESET_EMAIL_COPY = {
  headline: 'Forgot Password?',
  body: "That's okay, it happens. Click on the button below to reset your password. If you did not make this request, ignore this message.",
  cta: 'Reset Password',
} as const;

/** Hosted on the production admin deploy — Resend needs a public image URL. */
export const PASSWORD_RESET_EMAIL_ASSET_BASE = 'https://cleanupgiveback-web-app.vercel.app/email';

const LOGO_MARK_URL = `${PASSWORD_RESET_EMAIL_ASSET_BASE}/logo-mark-green.png`;
const HEADLINE_URL = `${PASSWORD_RESET_EMAIL_ASSET_BASE}/forgot-password-headline.png`;
const BODY_URL = `${PASSWORD_RESET_EMAIL_ASSET_BASE}/forgot-password-body.png`;
const BODY_MOBILE_URL = `${PASSWORD_RESET_EMAIL_ASSET_BASE}/forgot-password-body-mobile.png`;
const CTA_URL = `${PASSWORD_RESET_EMAIL_ASSET_BASE}/reset-password-button.png`;
const SUPPORT_URL = `${PASSWORD_RESET_EMAIL_ASSET_BASE}/forgot-password-support.png`;
const SUPPORT_MOBILE_URL = `${PASSWORD_RESET_EMAIL_ASSET_BASE}/forgot-password-support-mobile.png`;
const CONTACT_URL = `${PASSWORD_RESET_EMAIL_ASSET_BASE}/forgot-password-contact-us.png`;
const PRIVACY_URL = `${PASSWORD_RESET_EMAIL_ASSET_BASE}/forgot-password-privacy.png`;
const UNSUBSCRIBE_URL = `${PASSWORD_RESET_EMAIL_ASSET_BASE}/forgot-password-unsubscribe.png`;
const NONPROFIT_URL = `${PASSWORD_RESET_EMAIL_ASSET_BASE}/forgot-password-nonprofit.png`;
const SUPPORT_EMAIL = 'donnaadam@cleanupgiveback.org';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildPasswordResetEmailHtml(input: PasswordResetEmailInput): string {
  const resetUrl = input.resetUrl.trim();
  if (!resetUrl) {
    throw new Error('buildPasswordResetEmailHtml requires resetUrl');
  }
  const safeUrl = escapeHtml(resetUrl);
  const headline = escapeHtml(PASSWORD_RESET_EMAIL_COPY.headline);
  const body = escapeHtml(PASSWORD_RESET_EMAIL_COPY.body);
  const cta = escapeHtml(PASSWORD_RESET_EMAIL_COPY.cta);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${headline}</title>
  <style type="text/css">
    @media only screen and (max-width: 600px) {
      .pr-body-desktop,
      .pr-support-desktop {
        display: none !important;
        max-height: 0 !important;
        overflow: hidden !important;
        mso-hide: all !important;
      }
      .pr-body-mobile,
      .pr-support-mobile {
        display: table !important;
        width: auto !important;
        max-height: none !important;
        overflow: visible !important;
      }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#fcf9f8;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fcf9f8;">
  <tr>
    <td align="center" style="padding:0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;font-family:Arial,Helvetica,sans-serif;">
        <tr>
          <td style="padding:12px 20px 0;">
            <img src="${LOGO_MARK_URL}" width="32" height="42" alt="Clean Up Give Back" style="display:block;border:0;width:32px;height:42px;">
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:16px 24px 0;">
            <img src="${HEADLINE_URL}" width="218" height="31" alt="${headline}" style="display:block;border:0;margin:0 auto;width:218px;height:31px;">
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:12px 24px 0;">
            <table role="presentation" class="pr-body-desktop" cellpadding="0" cellspacing="0" align="center">
              <tr>
                <td align="center">
                  <img src="${BODY_URL}" width="498" height="42" alt="${body}" style="display:block;border:0;margin:0 auto;max-width:100%;height:auto;">
                </td>
              </tr>
            </table>
            <table role="presentation" class="pr-body-mobile" cellpadding="0" cellspacing="0" align="center" style="display:none;max-height:0;overflow:hidden;mso-hide:all;width:0;">
              <tr>
                <td align="center">
                  <img src="${BODY_MOBILE_URL}" width="307" height="85" alt="${body}" style="display:block;border:0;margin:0 auto;width:307px;height:auto;max-width:100%;">
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:12px 24px 0;">
            <a href="${safeUrl}" style="display:inline-block;line-height:0;text-decoration:none;">
              <img src="${CTA_URL}" width="210" height="55" alt="${cta}" style="display:block;border:0;width:210px;height:55px;">
            </a>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:24px 24px 24px;">
            <table role="presentation" class="pr-support-desktop" cellpadding="0" cellspacing="0" align="center">
              <tr>
                <td align="center">
                  <a href="mailto:${SUPPORT_EMAIL}" style="display:inline-block;line-height:0;text-decoration:none;">
                    <img src="${SUPPORT_URL}" width="402" height="36" alt="Please do not reply to this email. For customer service, email ${SUPPORT_EMAIL}" style="display:block;border:0;margin:0 auto;max-width:100%;height:auto;">
                  </a>
                </td>
              </tr>
            </table>
            <table role="presentation" class="pr-support-mobile" cellpadding="0" cellspacing="0" align="center" style="display:none;max-height:0;overflow:hidden;mso-hide:all;width:0;">
              <tr>
                <td align="center">
                  <a href="mailto:${SUPPORT_EMAIL}" style="display:inline-block;line-height:0;text-decoration:none;">
                    <img src="${SUPPORT_MOBILE_URL}" width="310" height="52" alt="Please do not reply to this email. For customer service, email ${SUPPORT_EMAIL}" style="display:block;border:0;margin:0 auto;width:310px;height:auto;max-width:100%;">
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background-color:#bdcaba;padding:28px 24px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="mailto:${SUPPORT_EMAIL}" style="display:inline-block;line-height:0;text-decoration:none;">
                    <img src="${CONTACT_URL}" width="76" height="23" alt="Contact Us" style="display:inline-block;border:0;width:76px;height:23px;">
                  </a>
                  &nbsp;&nbsp;&nbsp;
                  <a href="mailto:${SUPPORT_EMAIL}?subject=Privacy%20Policy" style="display:inline-block;line-height:0;text-decoration:none;">
                    <img src="${PRIVACY_URL}" width="92" height="23" alt="Privacy Policy" style="display:inline-block;border:0;width:92px;height:23px;">
                  </a>
                  &nbsp;&nbsp;&nbsp;
                  <a href="mailto:${SUPPORT_EMAIL}?subject=Unsubscribe" style="display:inline-block;line-height:0;text-decoration:none;">
                    <img src="${UNSUBSCRIBE_URL}" width="85" height="23" alt="Unsubscribe" style="display:inline-block;border:0;width:85px;height:23px;">
                  </a>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-top:25px;">
                  <img src="${NONPROFIT_URL}" width="376" height="23" alt="Clean Up - Give Back is a 501(c)(3) nonprofit organization" style="display:block;border:0;margin:0 auto;max-width:100%;height:auto;">
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}
