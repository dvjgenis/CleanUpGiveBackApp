# Briefing for Donna: Shippo shipping (checkout rates → auto label)

**Date:** August 20, 2026  
**For:** Donna Adams  
**From:** Engineering  
**Decision needed:** Approve this Shippo plan — live rates at checkout, label bought automatically when the order is placed, tracking in the app.

**Full research:** [shippo-vs-easypost-2026-08.md](../research/shippo-vs-easypost-2026-08.md)  
Prices checked on vendor pages **August 20, 2026**. Postage is extra. Shippo is **not** connected yet.

---

## What happens today

A volunteer places an order in the app. You see it in admin. For **USPS ship**, you buy postage yourself, **paste** the tracking number, and mark Shipped. The volunteer gets the “on its way” email and a Track package button.

Office **pickup** orders do not need a label. You mark them Fulfilled.

**The volunteer’s phone never talks to Shippo directly.** A Supabase Edge Function (or our existing server) holds the API key and calls Shippo.

---

## What would change

1. At checkout, the volunteer sees **real shipping options and prices** (USPS Ground, Priority, etc.) and picks one.
2. When they place the order, our backend **buys the label automatically** — no paste.
3. The volunteer sees **order confirmed + tracking** in the app.
4. You open admin, **download the label** from the saved link, print, pack, and ship.
5. **Live tracking** updates in the volunteer’s app as the package moves.

You still pack and get the box to USPS. The label PDF still has to be printed and stuck on (or use a USPS QR at the Post Office).

**Stripe gate:** label purchase should run **only after payment succeeds**. Until Stripe is live, we keep today’s flow or use test labels only.

---

## How Shippo runs from checkout to delivered

Rate selection happens **before** purchase. Weight and box size go in the first `POST /shipments` call (inside `parcels`).

1. **Volunteer adds items and enters shipping address (mobile app)**  
   Checkout collects the ship-to address. Cart already exists.

2. **Fetch rates (before Place Order)**  
   ```text
   Mobile app → Supabase Edge Function → POST /shipments (Shippo)
   ```  
   We send `address_from`, `address_to`, and `parcels` (**weight** in lb plus length, width, height). Shippo returns carrier rates. The Edge Function sends them back to the app.

3. **Volunteer selects a shipping option (mobile app)**  
   Example choices:
   - USPS Ground — $4.99 — 5 days  
   - USPS Priority — $8.99 — 3 days  
   - FedEx Express — $24.99 — 1 day  

   They pick one. We hold the `rate_id` until checkout completes.

4. **Volunteer places order**  
   The app sends the order plus the chosen `rate_id` to Supabase.

5. **Edge Function buys the label**  
   After the order (and payment, when Stripe is live) is saved:
   ```text
   POST /transactions  ← rate_id
   ```  
   Shippo returns `label_url`, `tracking_number`, and related IDs.

6. **Store in Supabase**  
   Save on `shop_orders` (or related columns): `transaction_id`, `tracking_number`, `label_url`, chosen rate, and order details.

7. **Volunteer notified**  
   Confirmation screen + Order History show the tracking number. Shipped email can fire automatically.

8. **Admin (you)**  
   New order appears in admin. Download the label from `label_url`, print it, pack the kit, and drop off at USPS.

9. **Carrier picks up**  
   USPS scans the barcode. The package enters their network.

10. **Tracking webhooks (Shippo → Supabase → app)**  
    ```text
    Shippo → Edge Function (webhook) → Supabase DB → Mobile app (Realtime)
    ```  
    The volunteer sees live updates (`IN_TRANSIT` → `OUT_FOR_DELIVERY` → `DELIVERED`) in Order History.

11. **Delivered**  
    Status → `DELIVERED`. Order complete.

**Pickup orders** skip Shippo steps 2–10. Mark **Fulfilled**. No label.

### Architecture summary

```text
Mobile app → Supabase DB / Edge Functions → Shippo API
                                               ↓
Admin app ← Supabase DB ← Edge Function ← Shippo webhooks
Mobile app ← Supabase Realtime ←────────────────┘
```

Shippo API key stays on the server (Edge Function), never in the Expo app.

**Shippo docs:** [API Quickstart](https://docs.goshippo.com/guides/api-quickstart) · [Webhooks](https://docs.goshippo.com/docs/Tracking/Webhooks) · [Rates API](https://docs.goshippo.com/docs/rates/rates/)

---

## What Shippo confirmed (assistant Q&A, 2026-08-20)

### Can we buy labels from our own UI?

**Yes — REST API from our backend, not MCP.**  
MCP (`https://mcp.shippo.com`) is for AI assistants only. Checkout and admin use Edge Functions → `api.goshippo.com`.

### Does this happen automatically?

**Not until we build it.** Shippo does not connect to Supabase by itself. We write Edge Functions for rates, label buy, and webhooks. After that, each order runs the same code — you are not calling Shippo by hand.

### When is the label purchased?

**Right after Place Order** (step 5), using the `rate_id` the volunteer already chose. That is **before** you print and ship, but **after** checkout — so the label is ready when you open admin.

We should only buy after **Stripe payment succeeds**, so we do not spend postage on unpaid orders.

### Who stores the shipping data?

**Shippo** holds the label. We **send** address, weight, and parcel size in `POST /shipments`, then buy with `POST /transactions`. We **save** `transaction_id`, `tracking_number`, and `label_url` in Supabase for admin and the app.

### Where do you see purchased labels?

- **Admin:** order detail → open `label_url` → print  
- **Shippo dashboard:** [app.goshippo.com](https://app.goshippo.com)  
- **API:** `GET /transactions/{id}` if needed

### Is `label_url` what you print?

**Yes.** PDF/PNG with from/to addresses, service, tracking, and barcode. Stick it on the box.

### What is on the label (Transaction)?

| Field | What it is |
|-------|------------|
| `status` | e.g. `SUCCESS`, `ERROR` |
| `tracking_number` | Carrier tracking number |
| `tracking_status` | e.g. `IN_TRANSIT`, `DELIVERED` |
| `label_url` | Printable PDF/PNG |
| `tracking_url_provider` | Carrier tracking page |
| `eta` | Estimated arrival |
| `rate` | Rate object ID (price is on the Rate, not here) |
| `metadata` | Our order id, if we set it |

Price lives on the **Rate** (`amount`, `currency`). Look up via `GET /rates/{id}`.

---

## Cost at our volume (~20–100 packages/month)

Software only. **Postage is the real bill** (what the volunteer picks at checkout).

| Labels / month | Shippo API |
|----------------|------------|
| 20 | **$0** (30 free) |
| 50 | **$1.40** |
| 100 | **$4.90** |

Shippo API: 30 labels free, then **7¢** each. No useful cap at 100/month.

---

## Recommendation

**Approve Shippo** with checkout rate selection + automatic label buy + webhooks. About **$0–$5/month** software at 20–100 kits. You print from admin; volunteers see rates at checkout and live tracking in the app.

Use a **test** Shippo account (SAMPLE labels) until Stripe and the full flow are ready.

---

## Decision

Please pick one:

- **A — Build Shippo.** Checkout rates, auto label on order, admin print, live tracking. (Recommended.)
- **B — Wait.** Keep pasting tracking. No Shippo integration yet.

Reply with A or B. Also send:

1. Exact **ship-from** street address and phone for labels.  
2. Paper labels vs a 4×6 thermal printer.  
3. Default kit vs tote **weight and box size** (we need this for `POST /shipments`).

Engineering will not spend live postage or wire Shippo until you choose.

---

**Detail (setup + API):** [research/shippo-vs-easypost-2026-08.md](../research/shippo-vs-easypost-2026-08.md)  
**Earlier shipping context:** [research/shipping-integration-2026-08.md](../research/shipping-integration-2026-08.md)
