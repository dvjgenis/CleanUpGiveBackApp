/**
 * Renders the Figma Forgot Password email to HTML and asserts copy.
 *
 *   npx tsx scripts/preview-password-reset-email.mts
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildPasswordResetEmailHtml,
  PASSWORD_RESET_EMAIL_COPY,
  PASSWORD_RESET_EMAIL_PLACEHOLDER_URL,
} from '../src/lib/password-reset-email-html';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'tmp');

const html = buildPasswordResetEmailHtml({
  resetUrl: PASSWORD_RESET_EMAIL_PLACEHOLDER_URL,
});

mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, 'password-reset-email.html');
writeFileSync(outPath, html);

function assertContains(needle: string, label: string): void {
  if (!html.includes(needle)) {
    throw new Error(`${label} missing expected string: ${needle}`);
  }
}

function assertMissing(needle: string, label: string): void {
  if (html.includes(needle)) {
    throw new Error(`${label} unexpectedly contains: ${needle}`);
  }
}

assertContains(PASSWORD_RESET_EMAIL_COPY.headline, 'headline');
assertContains('okay, it happens', 'body');
assertContains('ignore this message', 'body close');
assertContains(PASSWORD_RESET_EMAIL_COPY.cta, 'cta');
assertContains(PASSWORD_RESET_EMAIL_PLACEHOLDER_URL, 'resetUrl');
assertContains('donnaadam@cleanupgiveback.org', 'support email');
assertContains('Contact Us', 'footer contact');
assertContains('Privacy Policy', 'footer privacy');
assertContains('Unsubscribe', 'footer unsubscribe');
assertContains('501(c)(3)', 'nonprofit');
assertContains('logo-mark-green.png', 'logo');
assertContains('forgot-password-headline.png', 'Sanchez headline image');
assertContains('forgot-password-body.png', 'Noto Sans body image');
assertContains('forgot-password-body-mobile.png', 'Noto Sans mobile body image');
assertContains('forgot-password-support.png', 'Noto Sans support image');
assertContains('forgot-password-support-mobile.png', 'Noto Sans mobile support image');
assertContains('forgot-password-contact-us.png', 'Noto Sans Contact Us image');
assertContains('forgot-password-privacy.png', 'Noto Sans Privacy image');
assertContains('forgot-password-unsubscribe.png', 'Noto Sans Unsubscribe image');
assertContains('forgot-password-nonprofit.png', 'Noto Sans nonprofit image');
assertContains('@media only screen and (max-width: 600px)', 'phone vs laptop body swap');
assertContains('reset-password-button.png', 'Sanchez CTA image');
assertContains('max-width:600px', 'order-email width');
assertMissing('forgot-password-shadow', 'sliced shadow');
assertMissing('fonts.googleapis.com', 'webfonts');
assertMissing('messsage', 'figma typo');
assertMissing('looks like you have been inactive', 'off-canvas leftover');

console.log(`Wrote ${outPath}`);
console.log('preview-password-reset-email: ok');
