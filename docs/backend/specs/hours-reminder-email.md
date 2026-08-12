# Backend spec: hours-reminder email

**Date:** 2026-08-12  
**Status:** Implemented and on production Vercel (`cleanupgiveback-web-app`, 2026-08-12). Bell GIF and type PNGs are public at `/email/`. Apply [`admin/db/021_hours_reminder_figma.sql`](../../../admin/db/021_hours_reminder_figma.sql) on Supabase if that stub body is not already on the `hours_reminder` row.  
**Design:** [Figma Nudge `1311:432`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=1311-432)

## Summary

Daily Vercel cron (`GET /api/cron/send-hours-reminders`) nudges court-ordered volunteers who have not logged a session in 7–10 days. HTML is **code-owned** (`buildHoursReminderEmailHtml`) — the Emails-tab sanitizer strips tables/images. The DB row stores **subject** only (body is a stub).

**Placeholder-first:** Figma sample copy is the default (`Alex`, `XXX`). Real volunteer first name and completed hours replace a placeholder only when that field is present.

Lottie JSON does not play in Gmail/Outlook/Apple Mail. The Figma bell is a CUPGB-recolored `Bell.json` exported as an animated GIF hosted at `https://cleanupgiveback-web-app.vercel.app/email/nudge-bell.gif`. Outlook typically shows the first frame.

Gmail strips webfonts, so body (Sanchez), hours (Noto Sans Bold), and Open App (Sanchez) are 2x PNGs — same approach as Forgot Password. Desktop body/hours are 16px; phone uses 24px PNGs swapped with `@media (max-width: 600px)` so type does not shrink with the 600px shell. The bell displays at 120×120. Current hours stays Figma amber (`#fcab29`) on a deep-green band (`#004d21`, ~5.3:1) so it reads as an accent on the forest header. Support and footer are the shared 14px Noto Sans PNGs (same files as Forgot Password); mailto wraps the images. Cron and test sends CID-inline those PNGs (plus logo + bell) so Gmail shows them without waiting on Vercel. Name/hours PNGs are generated per send.

**Open App** href is `HOURS_REMINDER_OPEN_APP_URL` (`https://cleanupgiveback.org/` until an App Store URL exists).

## Trigger

Existing cron in [`admin-web-app/src/lib/hours-reminders.ts`](../../../admin-web-app/src/lib/hours-reminders.ts):

- Court-ordered volunteers only (`court_orders.user_id`)
- Idle 7–10 days since last non-active session (no session on record counts as idle)
- Dedup: skip if `email_log` already has `hours_reminder` in the last 7 days
- Skip mock / missing emails (`isMockAddress`)
- Push notification still fires independently when a push token exists

## Data model

No new columns. Completed hours match volunteer-profile `courtCompletedHours`: sum of `approved` + `court_ordered` session hours (`adjusted_hours` else `duration_seconds / 3600`) dated after `court_orders.hours_reset_at`.

## Acceptance criteria

- [x] AC-1: Cron still sends `hours_reminder` on the 7–10 day idle window with 7-day dedup
- [x] AC-2: Layout matches Figma structure (green header + bell + body + hours + Open App, support line, sage footer). Body and Open App are Sanchez; hours is Noto Sans Bold amber on a deep-green band (WCAG AA). Support/footer are 14px Noto Sans PNGs. Rasterized because Gmail cannot load those webfonts.
- [x] AC-3: Name and hours show Figma placeholders (`Alex`, `XXX`) when real data is missing
- [x] AC-4: Real first name and completed hours replace placeholders per-field when present
- [x] AC-5: Open App uses `HOURS_REMINDER_OPEN_APP_URL` (swap-later placeholder)
- [x] AC-6: Bell is a hosted GIF (not Lottie JSON) with CUPGB amber fills
- [x] AC-7: Hours reminder is not editable in the Emails tab (sanitizer would flatten the layout)

## Security & privacy

- Recipient is the volunteer directory email, never a client-supplied `to`
- HTML interpolations are escaped in `buildHoursReminderEmailHtml`
- Mock / missing emails skip send

## Test plan

1. `cd admin-web-app && npx tsx scripts/preview-hours-reminder-email.mts` — writes `tmp/hours-reminder-email.html` and asserts copy
2. `cd admin-web-app && npx tsx scripts/send-test-hours-reminder-email.mts --to=<inbox>` — live Resend (CID-inlines type PNGs)
3. `cd admin-web-app && npx tsc --noEmit`
4. Apply `admin/db/021_hours_reminder_figma.sql` on Supabase
5. Production assets: `https://cleanupgiveback-web-app.vercel.app/email/nudge-bell.gif` (and `hours-reminder-*.png`) return 200. Cron/test sends still CID-inline type PNGs so Gmail shows Sanchez/Noto Sans even if a hosted file is stale.
