# Backend spec: password-reset email

**Date:** 2026-08-12  
**Status:** HTML implemented; `/email/*` assets **live** on Vercel (2026-08-12). Send path **not wired**.  
**Design:** [Figma Forgot Password `1311:449`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=1311-449)

## Summary

Code-owned table HTML for the Forgot Password email (`buildPasswordResetEmailHtml` in `admin-web-app/src/lib/password-reset-email-html.ts`). Same 600px white shell, logo size (32×42), CTA (18px / `16px 37px`), support line, and sage footer as the order-shipped email. No drop shadow (Gmail mangles CSS and sliced-image shadows).

Gmail strips webfonts, so branded type is 2x PNGs under `admin-web-app/public/email/` (hosted at `https://cleanupgiveback-web-app.vercel.app/email/`):

| Face | Copy |
|------|------|
| Sanchez | Headline `Forgot Password?` (24px); lime **Reset Password** CTA (18px) |
| Noto Sans | Body (16px), support line, footer links, nonprofit line (14px) |

Body uses two 16px Noto Sans PNGs swapped with `@media (max-width: 600px)`: full-width wrap for laptop, ~320px wrap for phone so type does not shrink with the 600px shell. Support has the same desktop/mobile wrap. Footer mailto links wrap the Noto PNGs (Contact Us / Privacy / Unsubscribe). Headline and CTA stay Sanchez.

Welcome → Forgot Password remains a no-op. There is no `email_templates` / `email_log` type and no copy in `backend/sessions/` until a live send path exists.

`resetUrl` is required. Preview/test scripts pass `https://cleanupgiveback.org/reset-password` until a Supabase recovery link is available.

Figma typo `messsage` is corrected to `message`. Off-canvas leftover copy in the Figma frame (inactive-hours nudge) is not in this email.

The mark on this layout is forest-green `logo-mark-green.png` (white `logo-mark.png` is for the green order-email header).

## Hosted assets (production)

Confirmed `200` after `cd admin-web-app && vercel --prod` (2026-08-12):

- `logo-mark-green.png`
- `forgot-password-headline.png`
- `forgot-password-body.png` / `forgot-password-body-mobile.png`
- `reset-password-button.png`
- `forgot-password-support.png` / `forgot-password-support-mobile.png`
- `forgot-password-contact-us.png` / `forgot-password-privacy.png` / `forgot-password-unsubscribe.png`
- `forgot-password-nonprofit.png`

Test sends still CID-inline those PNGs so Gmail shows them even if a later local change is not deployed yet.

## API contract

None yet. Test send only:

```bash
cd admin-web-app && npx tsx scripts/send-test-password-reset-email.mts --to=<inbox>
```

## Data model

No migration. Do not add `password_reset` to `email_templates` / `email_log` until a production send site exists.

## Acceptance criteria

- [x] AC-1: Layout matches the order-shipped 600px shell (logo 32×42, 24px headline, 16px body on laptop and phone, 18px lime CTA, support line, sage footer) — no drop shadow
- [x] AC-2: CTA href is the caller-supplied `resetUrl`
- [x] AC-3: HTML interpolations are escaped
- [x] AC-5: Headline and CTA are rasterized Sanchez; everything else is rasterized Noto Sans (Gmail cannot load those webfonts on HTML text)
- [x] AC-6: `/email/forgot-password-*.png` and `logo-mark-green.png` load from production Vercel
- [ ] AC-4: Welcome Forgot Password sends this email with a real recovery link (out of scope)

## Security & privacy

- `resetUrl` is escaped as an HTML attribute
- Live send is a manual test script; recipient comes from `--to=` / `TEST_EMAIL_TO` / `DONNA_EMAIL`, not a user-supplied relay on a public endpoint

## Test plan

1. `cd admin-web-app && npx tsx scripts/preview-password-reset-email.mts` — writes `tmp/password-reset-email.html` and asserts copy
2. `cd admin-web-app && npx tsx scripts/send-test-password-reset-email.mts --to=<inbox>` — live Resend
3. `cd admin-web-app && npx tsc --noEmit`
4. Confirm `https://cleanupgiveback-web-app.vercel.app/email/forgot-password-body.png` (and the other `forgot-password-*.png` files) return `200`
