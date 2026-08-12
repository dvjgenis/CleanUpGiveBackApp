# Backend spec: order emails

**Date:** 2026-08-12  
**Status:** Implemented. `/email/*` assets are live on Vercel (`cleanupgiveback-web-app`, 2026-08-12). Apply [`admin/db/020_order_emails_figma.sql`](../../../admin/db/020_order_emails_figma.sql) on Supabase; Fly redeploy `backend/sessions` for production `POST /emails/order-placed`.  
**Design:** [Figma Order Shipped `1311:359`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=1311-359)

Keep HTML in sync: `admin-web-app/src/lib/order-email-html.ts` ↔ `backend/sessions/src/lib/order-email-html.ts`.

## Summary

Two transactional emails share one 600px table layout from Figma. HTML is **code-owned** (`buildOrderEmailHtml`) — the Emails-tab sanitizer strips tables/images. DB rows store **subject** only (body is a stub).

| Variant | Trigger | `email_templates.template_type` | Subject |
|---------|---------|----------------------------------|---------|
| **placed** | Mobile checkout after a successful `shop_orders` insert → Fly `POST /emails/order-placed` | `order_placed` | Thank you for your order! |
| **shipped** | Admin first transition into `shipped` → `sendShopOrderEmail` | `shipped` | Your order is on its way! |

Both variants use the green-banner headline **Your order is on its way!** Placed keeps the thank-you subject and greeting. Shipped **Track Order** appears only when carrier + tracking yield a URL.

Not editable in `/emails` → Templates.

## Layout and type

Gmail strips webfonts and does not play Lottie/SVG. Images are **hosted HTTPS** on `https://cleanupgiveback-web-app.vercel.app/email/` — do not CID-inline (Gmail mobile treats CID as attachments and clips past ~102KB). Outlook typically shows the first GIF frame.

| Face | Copy |
|------|------|
| Sanchez | Headline `Your order is on its way!` (28px, 340×36 PNG); lime **Track Order** CTA (18px PNG) |
| Noto Sans | Body, labels, support, footer (rasterized PNGs). Greeting + live fields (name, address values, totals, line items) are HTML with hosted `@font-face` (`/email/fonts/NotoSans-*.ttf`) and Arial fallback |

**Header truck:** white-on-green GIF from `frontend/assets/animations/shipping.svg` (same motion as the Lottie) at 749×362, displayed **220×106**. Laptop nudges it slightly left (`padding-right: 24px`). Phone keeps `padding-right: 36px` (Gmail Android GIF clip).

**Greeting:** one wrapping HTML line (`Thank you for your order, {name}!`) so the name is not squeezed beside a prefix image on phone.

**Body copy** is left-aligned Noto, with a laptop PNG and a phone PNG swapped at `@media (max-width: 600px)` so type does not shrink with the 600px shell:

| Variant | Laptop | Phone |
|---------|--------|-------|
| placed | 16px, `order-placed-body.png` (452×24) | **18px**, `order-placed-body-mobile.png` (~292×45) |
| shipped | 16px, `order-shipped-body.png` (523×42) | **20px**, `order-shipped-body-mobile.png` (~288×92) |

Support and sage footer reuse the Forgot Password 14px Noto PNGs (desktop/mobile support wrap; Contact Us / Privacy / Unsubscribe / nonprofit).

## Placeholder-first

Figma sample copy is the default. Real `shop_orders` / volunteer fields replace a placeholder only when that field is present. Do not invent missing data.

| Field | Placeholder until |
|-------|-------------------|
| Volunteer name | `Alex Johnson` |
| Address | `XXXXX, XXXXX, XX XXXXX` until street **and** city exist (partial rows, `Address not provided`, country-only objects do not count) |
| Payment method | `—` until Stripe metadata exists |
| Order total | `$XX.XXX` until `total_cents` > 0 |
| Order # | `X-XXXX` / `######` until a real id |
| Order date | `MM/DD/YYYY` |
| Line items | `Product Item` / `X` / `$23.99` until named items exist |

## Hosted assets (production)

Confirmed after `cd admin-web-app && vercel --prod` (2026-08-12):

- `shipping.gif` (cache-bust `?v=4` in HTML)
- `order-on-its-way-headline.png` (`?v=2`)
- `track-order-button.png`
- `order-placed-body.png` / `order-placed-body-mobile.png`
- `order-shipped-body.png` (`?v=2`) / `order-shipped-body-mobile.png` (`?v=2`)
- `logo-mark.png` (white mark on the green header)
- Product thumbs: `cleanup-kit.png`, `trash-grabber.png`, `tote-bags.png`, `adult-safety-vest.png`, `child-safety-vest.png`, `product-placeholder.png`
- Label/chrome PNGs: `order-summary.png`, `order-label-*.png`, `order-col-*.png`, `order-row-total.png`, `order-number-prefix.png`
- Shared footer: `forgot-password-support.png` / `-mobile.png`, `forgot-password-contact-us.png`, `forgot-password-privacy.png`, `forgot-password-unsubscribe.png`, `forgot-password-nonprofit.png`
- Fonts: `/email/fonts/NotoSans-Regular.ttf`, `NotoSans-Bold.ttf`, `Sanchez-Regular.ttf`

## API contract

### `POST /emails/order-placed`

- **Auth:** volunteer JWT (`Authorization: Bearer`)
- **Body:** `{ "orderId": "<uuid>" }`
- **Guards:** order must exist and `shop_orders.user_id` must match the JWT subject
- **Recipient:** authenticated volunteer's email (JWT claim, else Auth `user_metadata.email`) — never a client-supplied `to`
- **Response:** `200 { "ok": true }` or `{ "ok": true, "skipped": true }` when Resend/email is missing; `404` if order not owned; `502` on send failure
- **Side effects:** Resend send + `email_log` row (`template_type: order_placed`)
- **Client:** `frontend/src/lib/shopOrders.ts` fires this after insert (non-blocking)

Shipped mail is sent from admin-web-app `updateOrderFulfillment` → `sendShopOrderEmail` (not this endpoint).

## Data model

Uses existing `shop_orders` (`items` jsonb, `shipping_address`, `total_cents`, `tracking_number`, `carrier`, `created_at`). No new columns. Migration `020` adds `order_placed` to `email_templates` / `email_log` check constraints.

## Acceptance criteria

- [x] AC-1: Placed email sends on checkout when API + Resend are configured (non-blocking if send fails)
- [x] AC-2: Shipped email sends only on first transition into `shipped`
- [x] AC-3: Layout matches Figma structure (green header, summary, items, sage footer)
- [x] AC-4: Every field shows Figma-style placeholder when real data is missing
- [x] AC-5: Real `shop_orders` / volunteer fields replace placeholders when present (per-field only)
- [x] AC-6: Payment method row always visible; value `—` until Stripe payment metadata exists
- [x] AC-6b: Address row always visible; value `XXXXX, XXXXX, XX XXXXX` until street and city are both present
- [x] AC-7: Shipped Track Order button appears only when carrier + tracking yield a real URL
- [x] AC-8: Images are hosted HTTPS; test/production sends do not CID-inline
- [x] AC-9: Greeting is one wrapping HTML line; body copy is left-aligned with laptop/phone PNG swap
- [x] AC-10: Sanchez is headline + Track Order only; remaining copy is Noto Sans (PNG chrome + `@font-face` for live fields)

## Security & privacy

- Order-placed recipient is never request-body `to` (same anti-relay rule as event registration)
- Order ownership check prevents sending another volunteer's receipt
- HTML interpolations are escaped in `buildOrderEmailHtml`
- Mock / missing emails skip send (`isMockAddress` on admin path)

## Test plan

1. `cd admin-web-app && npx tsx scripts/preview-order-emails.mts` — writes `tmp/order-email-*.html` and asserts copy
2. `cd admin-web-app && npx tsx scripts/send-test-order-email.mts --to=<inbox>` — live Resend of both variants (hosted URLs, no CID)
3. `cd admin-web-app && npx tsc --noEmit`
4. `cd backend/sessions && npx tsc --noEmit`
5. Apply `admin/db/020_order_emails_figma.sql` on Supabase before production sends log `order_placed`
6. After Vercel deploy, confirm images load from `https://cleanupgiveback-web-app.vercel.app/email/`
7. Fly redeploy `backend/sessions` so production checkout uses the same HTML as admin
