/**
 * Write placeholder hours-reminder type PNGs (Alex / XXX) to public/email/.
 *
 *   npx tsx scripts/generate-hours-reminder-type-pngs.mts
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { HOURS_REMINDER_TYPE_FILES } from '../src/lib/hours-reminder-email-html';
import { renderHoursReminderTypePngs } from '../src/lib/hours-reminder-type-png';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'public/email');
const pngs = await renderHoursReminderTypePngs({});

writeFileSync(join(outDir, HOURS_REMINDER_TYPE_FILES.body), pngs.body);
writeFileSync(join(outDir, HOURS_REMINDER_TYPE_FILES.bodyMobile), pngs.bodyMobile);
writeFileSync(join(outDir, HOURS_REMINDER_TYPE_FILES.hours), pngs.hours);
writeFileSync(join(outDir, HOURS_REMINDER_TYPE_FILES.hoursMobile), pngs.hoursMobile);
writeFileSync(join(outDir, HOURS_REMINDER_TYPE_FILES.button), pngs.button);

console.log(`Wrote ${outDir}/${HOURS_REMINDER_TYPE_FILES.body}`);
console.log(`Wrote ${outDir}/${HOURS_REMINDER_TYPE_FILES.bodyMobile}`);
console.log(`Wrote ${outDir}/${HOURS_REMINDER_TYPE_FILES.hours}`);
console.log(`Wrote ${outDir}/${HOURS_REMINDER_TYPE_FILES.hoursMobile}`);
console.log(`Wrote ${outDir}/${HOURS_REMINDER_TYPE_FILES.button}`);
