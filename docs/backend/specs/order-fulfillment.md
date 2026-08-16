# Spec: Order fulfillment (pickup vs USPS ship)

**Date:** 2026-08-15  
**Status:** Implemented (Phase 1 — manual USPS)  
**Related:** [shipping-integration-2026-08.md](../../research/shipping-integration-2026-08.md), [order-emails.md](order-emails.md)

## Summary

Volunteers choose **how they'll receive an order**: **USPS ship**, **office pickup**, or **local drop-off**. App access is $49.99 either way. A cleanup kit is optional on tracker checkout. Donna still buys USPS labels on Pirate Ship and pastes tracking in admin. Pickup orders are marked **Fulfilled** with no tracking email.

Mobile checkout labels this **How you'll receive it**; admin shows **Pickup** vs **Shipping** sections.

## User stories

- As a volunteer, I want to pick up locally or have Donna ship via USPS, so I am not forced to mail every order.
- As a volunteer who already has supplies, I want to pay for app access without a kit.
- As Donna, I want to see fulfillment type and kit requested on each order, so I know whether to print a label or coordinate a handoff.

## Data model

Migration [`admin/db/022_order_fulfillment.sql`](../../../admin/db/022_order_fulfillment.sql):

| Column | Values |
|--------|--------|
| `fulfillment_method` | `usps_ship` (default) · `office_pickup` · `local_dropoff` |
| `includes_kit` | boolean, default `true` |
| `status` | existing + `fulfilled` (pickup complete) |

`shipping_address` is `null` when fulfillment is office pickup. For local drop-off it stores the volunteer’s drop-off address.

## Acceptance criteria

- [x] **AC-1:** Checkout (shop + tracker) offers USPS ship / office pickup / local drop-off. Address fields are required only for USPS ship. Office pickup shows the Clean Up Give Back address; tapping opens Maps. Local drop-off street autocomplete can fill the address (Photon). If the volunteer types the street instead, they must pick city, then state, then ZIP (ZIP list from the chosen city and state). Shows distance from Clean Up Give Back. In range: confirms the address is close enough and that Donna will contact them to arrange a time. Drop-off more than 30 miles away shows a too-far message (ship via USPS or email Donna), hides card fields until they switch to Ship via USPS, and blocks Place Order.
- [x] **AC-2:** Tracker checkout persists a `shop_orders` row and fires order-placed email. Same $49.99. Optional kit toggle (default on).
- [x] **AC-3:** Admin order detail shows fulfillment method and kit requested. Copy-address + carrier/tracking only for USPS ship.
- [x] **AC-4:** Admin marks ship orders **Shipped** (USPS tracking required) and pickup orders **Fulfilled**. Shipped email fires only on first `shipped` transition when `fulfillment_method = usps_ship`.
- [x] **AC-5:** Order History reads live `shop_orders`. **Track package** appears only for USPS ship with a tracking URL.

## Out of scope

- Shippo / in-admin label purchase
- FedEx/UPS as offered carriers
- Multi-chapter fulfillment
- Separate prices for pickup vs ship
- Charged shipping rates
- Ready-for-pickup email (Donna coordinates in person)

## Test plan

1. Shop checkout → USPS ship → address required → admin copy-address works.
2. Shop checkout → office pickup → no address → admin Fulfilled, no shipped email.
3. Tracker checkout → kit off → `includes_kit = false`.
4. Tracker checkout writes `shop_orders` and sends order-placed when API+Resend are configured.
5. Admin ship + USPS tracking → shipped email once.
6. Order History shows live rows; track link only on shipped USPS orders.
