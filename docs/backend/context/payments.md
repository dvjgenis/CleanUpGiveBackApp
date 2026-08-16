# Context: payments

Shop checkout and donation processing.

## Purpose

Handles cart checkout, order history, tracker unlock ($49.99 app access), and donation flows. Checkout records `fulfillment_method` (USPS ship / office pickup / local drop-off) and `includes_kit`. Same price regardless of fulfillment. Mobile UI exists (`/checkout`, `/donate`, tracker paywall); **no live Stripe charges yet**.

## Status (2026-08-03)

- **Resend** (transactional email) is configured and verified — not part of payments, but unblocks receipts/notices once Stripe ships.
- **Stripe** is the planned processor — **next implementation priority** after Resend. Not wired; `backend/payments/` empty; donate/checkout/confirmation remain client mocks.
- Admin `/payments` reads `shop_orders` / `donations` when rows exist; writers arrive with Stripe webhooks (or seeding).

## Planned responsibilities

- Stripe PaymentIntent / Checkout Session (test mode first)
- Order and donation records in Supabase
- Webhook handling (`checkout.session.completed`, etc.)
- Receipt / thank-you state + optional Resend confirmation email
- Tracker unlock via successful payment (`markTrackerPaid` / server entitlement)

## Integrations

- **Stripe** — see [accounts-and-access.md](../../accounts-and-access.md)
- Resend — order-placed (checkout) and order-shipped (admin fulfillment) emails live; payment receipts still wait on Stripe. Spec: [order-emails.md](../specs/order-emails.md)

## Code

- `backend/payments/` — service scaffold (empty)
- Mobile: `CheckoutScreen`, `DonateScreen`, `FreeTrialModal` / tracker checkout mode (UI only)
