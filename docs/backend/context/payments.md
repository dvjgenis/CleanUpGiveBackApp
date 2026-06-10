# Context: payments

Shop checkout and donation processing.

## Purpose

Handles cart checkout, order history, and donation flows shown in Stitch screens (`checkout_form`, `thank_you`, `donate`, etc.). Currently HTML-only prototype.

## Planned responsibilities

- Payment intent creation and confirmation
- Order and donation records
- Receipt / thank-you state
- Webhook handling for payment provider events

## Integrations

- Payment provider TBD — see [accounts-and-access.md](../../accounts-and-access.md)

## Code

- `backend/payments/` — service scaffold (empty)
