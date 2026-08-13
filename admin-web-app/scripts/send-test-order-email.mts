/**
 * Send both Figma order-email variants through Resend.
 *
 *   npx tsx scripts/send-test-order-email.mts --to=you@example.com
 *
 * Loads `admin-web-app/.env.local` for RESEND_API_KEY / EMAIL_FROM / DONNA_EMAIL.
 * CID-inlines the header pixel + shipping GIF (84KB) so this inbox shows the
 * local transparent truck without a Vercel deploy. Product thumbs stay hosted.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Resend } from 'resend';

import {
  buildOrderEmailHtml,
  ORDER_EMAIL_ASSET_BASE,
  ORDER_EMAIL_SUBJECTS,
} from '../src/lib/order-email-html';

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
const emailDir = join(here, '..', 'public', 'email');
const assetBase = ORDER_EMAIL_ASSET_BASE.replace(/\/$/, '');

const inlineAttachments = [
  {
    filename: 'header-pixel.png',
    content: readFileSync(join(emailDir, 'header-pixel.png')),
    contentType: 'image/png',
    inlineContentId: 'header-pixel.png',
  },
  {
    filename: 'shipping.gif',
    content: readFileSync(join(emailDir, 'shipping.gif')),
    contentType: 'image/gif',
    inlineContentId: 'shipping.gif',
  },
];

function htmlForSend(html: string): string {
  return html
    .replaceAll(`${assetBase}/header-pixel.png`, 'cid:header-pixel.png')
    .replaceAll(`${assetBase}/shipping.gif?v=6`, 'cid:shipping.gif');
}

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

const variants = [
  { variant: 'placed' as const, html: buildOrderEmailHtml({ variant: 'placed' }) },
  {
    variant: 'shipped' as const,
    html: buildOrderEmailHtml({
      variant: 'shipped',
      trackingNumber: '1Z999AA10123456784',
      carrier: 'UPS',
    }),
  },
];

const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');

for (const { variant, html } of variants) {
  const subject = `[TEST] ${ORDER_EMAIL_SUBJECTS[variant]} · ${stamp}`;
  const { data, error } = await resend.emails.send({
    from,
    to,
    subject,
    html: htmlForSend(html),
    attachments: inlineAttachments,
  });
  if (error) {
    console.error(`${variant} send failed:`, error.message);
    process.exit(1);
  }
  console.log(`${variant} sent to ${to} id=${data?.id ?? 'unknown'}`);
}
