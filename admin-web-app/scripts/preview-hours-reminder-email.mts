/**
 * Renders placeholder-first and filled hours-reminder emails to HTML files
 * and asserts Figma copy. Rasterizes filled type PNGs into tmp/.
 *
 *   npx tsx scripts/preview-hours-reminder-email.mts
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  buildHoursReminderEmailHtml,
  HOURS_REMINDER_CHROME_FILES,
  HOURS_REMINDER_CTA_LABEL,
  HOURS_REMINDER_OPEN_APP_URL,
  HOURS_REMINDER_PLACEHOLDERS,
  HOURS_REMINDER_SUBJECT,
  HOURS_REMINDER_TYPE_FILES,
  hoursReminderHeadline,
  hoursReminderHoursLine,
} from '../src/lib/hours-reminder-email-html';
import { renderHoursReminderTypePngs } from '../src/lib/hours-reminder-type-png';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'tmp');
const localAssetBase = pathToFileURL(join(here, '..', 'public', 'email')).href;

mkdirSync(outDir, { recursive: true });

const filledPngs = await renderHoursReminderTypePngs({
  volunteerName: 'Alex Johnson',
  currentHours: 12.5,
});
const filledBodyPath = join(outDir, 'hours-reminder-body-filled.png');
const filledBodyMobilePath = join(outDir, 'hours-reminder-body-mobile-filled.png');
const filledHoursPath = join(outDir, 'hours-reminder-hours-filled.png');
const filledHoursMobilePath = join(outDir, 'hours-reminder-hours-mobile-filled.png');
const filledButtonPath = join(outDir, 'hours-reminder-button-filled.png');
writeFileSync(filledBodyPath, filledPngs.body);
writeFileSync(filledBodyMobilePath, filledPngs.bodyMobile);
writeFileSync(filledHoursPath, filledPngs.hours);
writeFileSync(filledHoursMobilePath, filledPngs.hoursMobile);
writeFileSync(filledButtonPath, filledPngs.button);

const placeholder = buildHoursReminderEmailHtml({ assetBase: localAssetBase });
const filled = buildHoursReminderEmailHtml({
  volunteerName: 'Alex Johnson',
  currentHours: 12.5,
  assetBase: localAssetBase,
  typeUrls: {
    body: pathToFileURL(filledBodyPath).href,
    bodyMobile: pathToFileURL(filledBodyMobilePath).href,
    hours: pathToFileURL(filledHoursPath).href,
    hoursMobile: pathToFileURL(filledHoursMobilePath).href,
    button: pathToFileURL(filledButtonPath).href,
  },
});

writeFileSync(join(outDir, 'hours-reminder-email.html'), placeholder);
writeFileSync(join(outDir, 'hours-reminder-email-filled.html'), filled);

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

assertContains(placeholder, HOURS_REMINDER_SUBJECT, 'placeholder');
assertContains(placeholder, hoursReminderHeadline(), 'placeholder');
assertContains(placeholder, hoursReminderHoursLine(), 'placeholder');
assertContains(placeholder, HOURS_REMINDER_CTA_LABEL, 'placeholder');
assertContains(placeholder, HOURS_REMINDER_OPEN_APP_URL, 'placeholder');
assertContains(placeholder, 'donnaadam@cleanupgiveback.org', 'placeholder');
assertContains(placeholder, '501(c)(3)', 'placeholder');
assertContains(placeholder, 'nudge-bell.gif', 'placeholder');
assertContains(placeholder, HOURS_REMINDER_TYPE_FILES.body, 'placeholder');
assertContains(placeholder, HOURS_REMINDER_TYPE_FILES.bodyMobile, 'placeholder');
assertContains(placeholder, HOURS_REMINDER_TYPE_FILES.hours, 'placeholder');
assertContains(placeholder, HOURS_REMINDER_TYPE_FILES.hoursMobile, 'placeholder');
assertContains(placeholder, HOURS_REMINDER_TYPE_FILES.button, 'placeholder');
assertContains(placeholder, HOURS_REMINDER_CHROME_FILES.support, 'placeholder');
assertContains(placeholder, HOURS_REMINDER_CHROME_FILES.supportMobile, 'placeholder');
assertContains(placeholder, HOURS_REMINDER_CHROME_FILES.contact, 'placeholder');
assertContains(placeholder, HOURS_REMINDER_CHROME_FILES.privacy, 'placeholder');
assertContains(placeholder, HOURS_REMINDER_CHROME_FILES.unsubscribe, 'placeholder');
assertContains(placeholder, HOURS_REMINDER_CHROME_FILES.nonprofit, 'placeholder');
assertContains(placeholder, `Hi ${HOURS_REMINDER_PLACEHOLDERS.firstName},`, 'placeholder');
assertContains(placeholder, `Current hours: ${HOURS_REMINDER_PLACEHOLDERS.currentHours}`, 'placeholder');
assertMissing(placeholder, 'fonts.googleapis.com', 'placeholder');
assertMissing(placeholder, 'font-family:\'Sanchez\'', 'placeholder');
assertMissing(placeholder, 'font-family:\'Noto Sans\'', 'placeholder');
assertMissing(placeholder, 'Georgia', 'placeholder');
assertMissing(placeholder, 'Current hours: 12.5', 'placeholder');

assertContains(filled, 'Hi Alex,', 'filled');
assertContains(filled, 'Current hours: 12.5', 'filled');
assertContains(filled, 'hours-reminder-body-filled.png', 'filled');
assertMissing(filled, 'Current hours: XXX', 'filled');

console.log(`Wrote ${outDir}/hours-reminder-email.html`);
console.log(`Wrote ${outDir}/hours-reminder-email-filled.html`);
console.log('preview-hours-reminder-email: ok');
