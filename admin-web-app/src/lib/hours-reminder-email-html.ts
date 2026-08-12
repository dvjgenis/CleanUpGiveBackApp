/**
 * Figma `1311:432` Hours-reminder (Nudge) email HTML.
 *
 * Table + inline CSS only — Gmail/Outlook strip `<style>` blocks, SVG, and
 * webfonts. Body (Sanchez), hours (Noto Sans Bold), and Open App (Sanchez)
 * are rasterized PNGs. Support and footer reuse the Forgot Password 14px
 * Noto Sans PNGs (links wrap those images). Lottie cannot play in mail
 * clients; the bell is a hosted GIF. Placeholder-first: name and hours use
 * Figma sample copy until a real volunteer value is present. Do not invent
 * missing data.
 */

export type HoursReminderEmailInput = {
  volunteerName?: string | null;
  currentHours?: number | null;
  /** Override hosted asset origin (preview uses a file:// path). */
  assetBase?: string | null;
  /** Override type PNG URLs (CID or file://). Defaults to `${assetBase}/hours-reminder-*.png`. */
  typeUrls?: {
    body?: string;
    bodyMobile?: string;
    hours?: string;
    hoursMobile?: string;
    button?: string;
  };
};

export const HOURS_REMINDER_PLACEHOLDERS = {
  firstName: 'Alex',
  currentHours: 'XXX',
} as const;

export const HOURS_REMINDER_SUBJECT = 'Missing you at Clean Up Give Back!';

export const HOURS_REMINDER_CTA_LABEL = 'Open App';

/** Swap when an App Store URL exists. */
export const HOURS_REMINDER_OPEN_APP_URL = 'https://cleanupgiveback.org/';

/** Hosted on the production admin deploy — Resend needs a public image URL. */
export const HOURS_REMINDER_ASSET_BASE = 'https://cleanupgiveback-web-app.vercel.app/email';

export const HOURS_REMINDER_TYPE_FILES = {
  body: 'hours-reminder-body.png',
  bodyMobile: 'hours-reminder-body-mobile.png',
  hours: 'hours-reminder-hours.png',
  hoursMobile: 'hours-reminder-hours-mobile.png',
  button: 'hours-reminder-button.png',
} as const;

/** Shared 14px Noto Sans chrome (same assets as Forgot Password). */
export const HOURS_REMINDER_CHROME_FILES = {
  support: 'forgot-password-support.png',
  supportMobile: 'forgot-password-support-mobile.png',
  contact: 'forgot-password-contact-us.png',
  privacy: 'forgot-password-privacy.png',
  unsubscribe: 'forgot-password-unsubscribe.png',
  nonprofit: 'forgot-password-nonprofit.png',
} as const;

export const HOURS_REMINDER_CHROME_SIZES = {
  support: { width: 402, height: 36 },
  supportMobile: { width: 310, height: 52 },
  contact: { width: 76, height: 23 },
  privacy: { width: 92, height: 23 },
  unsubscribe: { width: 85, height: 23 },
  nonprofit: { width: 376, height: 23 },
} as const;

export const HOURS_REMINDER_BELL_SIZE = 120;

/** Desktop body + hours (matches other transactional emails). Phone uses 24px. */
export const HOURS_REMINDER_TYPE_FONT_SIZE = 16;
export const HOURS_REMINDER_TYPE_FONT_SIZE_MOBILE = 24;

/** Amber on deep green so hours stay an accent and meet WCAG AA (~5.3:1). */
export const HOURS_REMINDER_HOURS_FG = '#fcab29';
export const HOURS_REMINDER_HOURS_BG = '#004d21';

export const HOURS_REMINDER_TYPE_SIZES = {
  body: { width: 560, height: 80 },
  bodyMobile: { width: 320, height: 240 },
  hours: { width: 560, height: 40 },
  hoursMobile: { width: 320, height: 48 },
  button: { width: 180, height: 55 },
} as const;

const SUPPORT_EMAIL = 'donnaadam@cleanupgiveback.org';

export function firstNameFromVolunteer(name: string | null | undefined): string | null {
  const token = name?.trim().split(/\s+/)[0];
  return token ? token : null;
}

export function formatCurrentHours(hours: number | null | undefined): string | null {
  if (hours == null || !Number.isFinite(hours)) return null;
  return hours.toFixed(1);
}

export function resolveHoursReminderField(
  realValue: string | null | undefined,
  placeholder: string,
): string {
  const trimmed = realValue?.trim();
  return trimmed ? trimmed : placeholder;
}

export function hoursReminderHeadline(volunteerName?: string | null): string {
  const firstName = resolveHoursReminderField(
    firstNameFromVolunteer(volunteerName),
    HOURS_REMINDER_PLACEHOLDERS.firstName,
  );
  return `Hi ${firstName}, looks like you have been inactive for a while. Let’s start logging some service hours! Open the app to start logging your hours!`;
}

export function hoursReminderHoursLine(currentHours?: number | null): string {
  const hours = resolveHoursReminderField(
    formatCurrentHours(currentHours),
    HOURS_REMINDER_PLACEHOLDERS.currentHours,
  );
  return `Current hours: ${hours}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildHoursReminderEmailHtml(input: HoursReminderEmailInput = {}): string {
  const headline = hoursReminderHeadline(input.volunteerName);
  const hoursLine = hoursReminderHoursLine(input.currentHours);
  const assetBase = (input.assetBase?.trim() || HOURS_REMINDER_ASSET_BASE).replace(/\/$/, '');
  const logoUrl = `${assetBase}/logo-mark.png`;
  const bellUrl = `${assetBase}/nudge-bell.gif`;
  const bodyUrl = input.typeUrls?.body ?? `${assetBase}/${HOURS_REMINDER_TYPE_FILES.body}`;
  const bodyMobileUrl = input.typeUrls?.bodyMobile ?? `${assetBase}/${HOURS_REMINDER_TYPE_FILES.bodyMobile}`;
  const hoursUrl = input.typeUrls?.hours ?? `${assetBase}/${HOURS_REMINDER_TYPE_FILES.hours}`;
  const hoursMobileUrl = input.typeUrls?.hoursMobile ?? `${assetBase}/${HOURS_REMINDER_TYPE_FILES.hoursMobile}`;
  const buttonUrl = input.typeUrls?.button ?? `${assetBase}/${HOURS_REMINDER_TYPE_FILES.button}`;
  const openHref = HOURS_REMINDER_OPEN_APP_URL;
  const { body: bodySize, bodyMobile: bodyMobileSize, hours: hoursSize, hoursMobile: hoursMobileSize, button: buttonSize } =
    HOURS_REMINDER_TYPE_SIZES;
  const chrome = HOURS_REMINDER_CHROME_FILES;
  const chromeSize = HOURS_REMINDER_CHROME_SIZES;
  const supportUrl = `${assetBase}/${chrome.support}`;
  const supportMobileUrl = `${assetBase}/${chrome.supportMobile}`;
  const contactUrl = `${assetBase}/${chrome.contact}`;
  const privacyUrl = `${assetBase}/${chrome.privacy}`;
  const unsubscribeUrl = `${assetBase}/${chrome.unsubscribe}`;
  const nonprofitUrl = `${assetBase}/${chrome.nonprofit}`;
  const supportAlt = `Please do not reply to this email. For customer service, email ${SUPPORT_EMAIL}`;
  const bellSize = HOURS_REMINDER_BELL_SIZE;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(HOURS_REMINDER_SUBJECT)}</title>
  <style type="text/css">
    @media only screen and (max-width: 600px) {
      .hr-support-desktop,
      .hr-type-desktop {
        display: none !important;
        max-height: 0 !important;
        overflow: hidden !important;
        mso-hide: all !important;
      }
      .hr-support-mobile,
      .hr-type-mobile {
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
          <td style="background-color:#009540;padding:16px 20px 40px;">
            <img src="${logoUrl}" width="32" height="42" alt="Clean Up Give Back" style="display:block;border:0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding-top:24px;">
                  <img src="${bellUrl}" width="${bellSize}" height="${bellSize}" alt="" style="display:block;width:${bellSize}px;height:${bellSize}px;border:0;margin:0 auto;">
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-top:28px;font-size:0;line-height:0;">
                  <table role="presentation" class="hr-type-desktop" cellpadding="0" cellspacing="0" align="center">
                    <tr>
                      <td align="center">
                        <img src="${escapeHtml(bodyUrl)}" width="${bodySize.width}" height="${bodySize.height}" alt="${escapeHtml(headline)}" style="display:block;border:0;margin:0 auto;max-width:100%;height:auto;">
                      </td>
                    </tr>
                  </table>
                  <table role="presentation" class="hr-type-mobile" cellpadding="0" cellspacing="0" align="center" style="display:none;max-height:0;overflow:hidden;mso-hide:all;width:0;">
                    <tr>
                      <td align="center">
                        <img src="${escapeHtml(bodyMobileUrl)}" width="${bodyMobileSize.width}" height="${bodyMobileSize.height}" alt="${escapeHtml(headline)}" style="display:block;border:0;margin:0 auto;width:${bodyMobileSize.width}px;height:auto;max-width:100%;">
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-top:28px;font-size:0;line-height:0;">
                  <table role="presentation" class="hr-type-desktop" cellpadding="0" cellspacing="0" align="center">
                    <tr>
                      <td align="center">
                        <img src="${escapeHtml(hoursUrl)}" width="${hoursSize.width}" height="${hoursSize.height}" alt="${escapeHtml(hoursLine)}" style="display:block;border:0;margin:0 auto;max-width:100%;height:auto;">
                      </td>
                    </tr>
                  </table>
                  <table role="presentation" class="hr-type-mobile" cellpadding="0" cellspacing="0" align="center" style="display:none;max-height:0;overflow:hidden;mso-hide:all;width:0;">
                    <tr>
                      <td align="center">
                        <img src="${escapeHtml(hoursMobileUrl)}" width="${hoursMobileSize.width}" height="${hoursMobileSize.height}" alt="${escapeHtml(hoursLine)}" style="display:block;border:0;margin:0 auto;width:${hoursMobileSize.width}px;height:auto;max-width:100%;">
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-top:32px;font-size:0;line-height:0;">
                  <a href="${escapeHtml(openHref)}" style="display:inline-block;line-height:0;text-decoration:none;">
                    <img src="${escapeHtml(buttonUrl)}" width="${buttonSize.width}" height="${buttonSize.height}" alt="${escapeHtml(HOURS_REMINDER_CTA_LABEL)}" style="display:block;border:0;width:${buttonSize.width}px;height:${buttonSize.height}px;">
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:32px 24px 28px;">
            <table role="presentation" class="hr-support-desktop" cellpadding="0" cellspacing="0" align="center">
              <tr>
                <td align="center">
                  <a href="mailto:${SUPPORT_EMAIL}" style="display:inline-block;line-height:0;text-decoration:none;">
                    <img src="${supportUrl}" width="${chromeSize.support.width}" height="${chromeSize.support.height}" alt="${escapeHtml(supportAlt)}" style="display:block;border:0;margin:0 auto;max-width:100%;height:auto;">
                  </a>
                </td>
              </tr>
            </table>
            <table role="presentation" class="hr-support-mobile" cellpadding="0" cellspacing="0" align="center" style="display:none;max-height:0;overflow:hidden;mso-hide:all;width:0;">
              <tr>
                <td align="center">
                  <a href="mailto:${SUPPORT_EMAIL}" style="display:inline-block;line-height:0;text-decoration:none;">
                    <img src="${supportMobileUrl}" width="${chromeSize.supportMobile.width}" height="${chromeSize.supportMobile.height}" alt="${escapeHtml(supportAlt)}" style="display:block;border:0;margin:0 auto;width:${chromeSize.supportMobile.width}px;height:auto;max-width:100%;">
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
                    <img src="${contactUrl}" width="${chromeSize.contact.width}" height="${chromeSize.contact.height}" alt="Contact Us" style="display:inline-block;border:0;width:${chromeSize.contact.width}px;height:${chromeSize.contact.height}px;">
                  </a>
                  &nbsp;&nbsp;&nbsp;
                  <a href="mailto:${SUPPORT_EMAIL}?subject=Privacy%20Policy" style="display:inline-block;line-height:0;text-decoration:none;">
                    <img src="${privacyUrl}" width="${chromeSize.privacy.width}" height="${chromeSize.privacy.height}" alt="Privacy Policy" style="display:inline-block;border:0;width:${chromeSize.privacy.width}px;height:${chromeSize.privacy.height}px;">
                  </a>
                  &nbsp;&nbsp;&nbsp;
                  <a href="mailto:${SUPPORT_EMAIL}?subject=Unsubscribe" style="display:inline-block;line-height:0;text-decoration:none;">
                    <img src="${unsubscribeUrl}" width="${chromeSize.unsubscribe.width}" height="${chromeSize.unsubscribe.height}" alt="Unsubscribe" style="display:inline-block;border:0;width:${chromeSize.unsubscribe.width}px;height:${chromeSize.unsubscribe.height}px;">
                  </a>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-top:25px;">
                  <img src="${nonprofitUrl}" width="${chromeSize.nonprofit.width}" height="${chromeSize.nonprofit.height}" alt="Clean Up - Give Back is a 501(c)(3) nonprofit organization" style="display:block;border:0;margin:0 auto;max-width:100%;height:auto;">
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
