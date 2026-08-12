/**
 * Renders placeholder-first order emails to HTML files and asserts Figma copy.
 *
 *   npx tsx scripts/preview-order-emails.mts
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildOrderEmailHtml,
  ORDER_EMAIL_PLACEHOLDERS,
  trackingUrl,
} from '../src/lib/order-email-html';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'tmp');

const placed = buildOrderEmailHtml({ variant: 'placed' });
const shippedPlaceholder = buildOrderEmailHtml({ variant: 'shipped' });
const shippedTracked = buildOrderEmailHtml({
  variant: 'shipped',
  volunteerName: 'Alex Johnson',
  orderId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  createdAt: '2026-08-12T12:00:00.000Z',
  totalCents: 5000,
  shippingAddress: {
    line1: '600 E Algonquin Road',
    city: 'Des Plaines',
    state: 'IL',
    postalCode: '60018',
    country: 'US',
  },
  items: [
    { id: 'cleanup-kit', name: 'Trash Clean Up Kit', qty: 1, unitCents: 2999 },
    { id: 'tote-bags', name: 'Reusable Earth and Ocean Tote Bags', qty: 2, unitCents: 300 },
  ],
  trackingNumber: '1Z999AA10123456784',
  carrier: 'UPS',
});

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'order-email-placed.html'), placed);
writeFileSync(join(outDir, 'order-email-shipped.html'), shippedPlaceholder);
writeFileSync(join(outDir, 'order-email-shipped-tracked.html'), shippedTracked);

function assertContains(html: string, needle: string, label: string): void {
  if (!html.includes(needle)) {
    throw new Error(`${label} missing expected string: ${needle}`);
  }
}

function assertMissing(html: string, needle: string, label: string): void {
  if (html.includes(needle)) {
    throw new Error(`${label} unexpectedly contains: ${needle}`);
  }
}

assertContains(placed, 'Your order is on its way!', 'placed');
assertContains(placed, 'order-on-its-way-headline.png', 'placed');
assertContains(placed, 'order-placed-body.png', 'placed');
assertContains(placed, 'Thank you for your order,', 'placed');
assertContains(placed, 'order-placed-body-mobile.png', 'placed');
assertContains(placed, 'Noto Sans', 'placed');
assertContains(placed, 'forgot-password-support.png', 'placed');
assertContains(placed, ORDER_EMAIL_PLACEHOLDERS.volunteerName, 'placed');
assertContains(placed, ORDER_EMAIL_PLACEHOLDERS.orderNumberHeader, 'placed');
assertContains(placed, 'Order Summary', 'placed');
assertContains(placed, 'Payment Method:', 'placed');
assertContains(placed, ORDER_EMAIL_PLACEHOLDERS.address, 'placed');
assertContains(placed, ORDER_EMAIL_PLACEHOLDERS.paymentMethod, 'placed');
assertContains(placed, ORDER_EMAIL_PLACEHOLDERS.itemName, 'placed');
assertContains(placed, 'donnaadam@cleanupgiveback.org', 'placed');
assertContains(placed, '501(c)(3)', 'placed');
assertMissing(placed, 'Track Order', 'placed');

assertContains(shippedPlaceholder, 'Your order is on its way!', 'shipped placeholder');
assertContains(shippedPlaceholder, 'order-shipped-body.png', 'shipped placeholder');
assertContains(shippedPlaceholder, 'text-align:left', 'shipped placeholder');
assertContains(shippedPlaceholder, 'order-shipped-body-mobile.png', 'shipped placeholder');
assertContains(shippedPlaceholder, '@media only screen and (max-width: 600px)', 'shipped placeholder');
assertContains(shippedPlaceholder, 'Please wait 24 hours', 'shipped placeholder');
assertContains(shippedPlaceholder, ORDER_EMAIL_PLACEHOLDERS.address, 'shipped placeholder');
assertMissing(shippedPlaceholder, 'Track Order', 'shipped placeholder');

assertContains(shippedTracked, '600 E Algonquin Road', 'shipped tracked');
assertContains(shippedTracked, 'order-shipped-body-mobile.png', 'shipped tracked');
assertContains(shippedTracked, 'Trash Clean Up Kit', 'shipped tracked');
assertContains(shippedTracked, '$50.00', 'shipped tracked');
assertContains(shippedTracked, 'Track Order', 'shipped tracked');
assertContains(shippedTracked, 'track-order-button.png', 'shipped tracked');
const expectedTrack = trackingUrl('UPS', '1Z999AA10123456784');
if (!expectedTrack || !shippedTracked.includes(expectedTrack)) {
  throw new Error('shipped tracked missing UPS tracking URL');
}

assertMissing(placed, 'fonts.googleapis.com', 'placed');
assertMissing(placed, 'Georgia', 'placed');
assertMissing(shippedTracked, 'fonts.googleapis.com', 'shipped tracked');

console.log(`Wrote ${outDir}/order-email-placed.html`);
console.log(`Wrote ${outDir}/order-email-shipped.html`);
console.log(`Wrote ${outDir}/order-email-shipped-tracked.html`);
console.log('preview-order-emails: ok');
