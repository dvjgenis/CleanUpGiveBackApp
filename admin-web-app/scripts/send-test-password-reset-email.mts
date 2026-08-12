/**
 * Send the Figma Forgot Password email through Resend.
 *
 *   npx tsx scripts/send-test-password-reset-email.mts --to=you@example.com
 *
 * Loads `admin-web-app/.env.local` for RESEND_API_KEY / EMAIL_FROM / DONNA_EMAIL.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Resend } from 'resend';

import {
  buildPasswordResetEmailHtml,
  PASSWORD_RESET_EMAIL_ASSET_BASE,
  PASSWORD_RESET_EMAIL_PLACEHOLDER_URL,
  PASSWORD_RESET_EMAIL_SUBJECT,
} from '../src/lib/password-reset-email-html';

function loadEnvFile(path: string): void {
  if (!existsSync(path)) return;
  for (const raw of readFileSync(path, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

const here = dirname(fileURLToPath(import.meta.url));
loadEnvFile(join(here, '..', '.env.local'));

const toArg = process.argv.find((arg) => arg.startsWith('--to='))?.slice(5);
const to = toArg || process.env.TEST_EMAIL_TO || process.env.DONNA_EMAIL;
const apiKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM ?? 'noreply@cleanupgiveback.org';

if (!apiKey) {
  console.error('RESEND_API_KEY is not set');
  process.exit(1);
}
if (!to) {
  console.error('Pass --to=email@example.com or set TEST_EMAIL_TO / DONNA_EMAIL');
  process.exit(1);
}

const resend = new Resend(apiKey);
const hostedHtml = buildPasswordResetEmailHtml({
  resetUrl: PASSWORD_RESET_EMAIL_PLACEHOLDER_URL,
});
const assetDir = join(here, '..', 'public/email');
const inlineFiles = [
  'logo-mark-green.png',
  'forgot-password-headline.png',
  'forgot-password-body.png',
  'forgot-password-body-mobile.png',
  'reset-password-button.png',
  'forgot-password-support.png',
  'forgot-password-support-mobile.png',
  'forgot-password-contact-us.png',
  'forgot-password-privacy.png',
  'forgot-password-unsubscribe.png',
  'forgot-password-nonprofit.png',
];
const html = hostedHtml.replaceAll(`${PASSWORD_RESET_EMAIL_ASSET_BASE}/`, 'cid:');
const attachments = inlineFiles.map((filename) => ({
  filename,
  content: readFileSync(join(assetDir, filename)),
  contentType: 'image/png',
  inlineContentId: filename,
}));
const subject = `[TEST] ${PASSWORD_RESET_EMAIL_SUBJECT}`;

const { data, error } = await resend.emails.send({ from, to, subject, html, attachments });
if (error) {
  console.error('password-reset send failed:', error.message);
  process.exit(1);
}
console.log(`password-reset sent to ${to} id=${data?.id ?? 'unknown'}`);
