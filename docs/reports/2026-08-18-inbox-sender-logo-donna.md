# Briefing for Donna: volunteer inbox logo (the pink “N”)

**Date:** August 18, 2026  
**For:** Donna Adam  
**From:** Engineering  
**Decision needed:** Whether Clean Up Give Back should spend money to put the CUPGB mark in Gmail’s tiny circle next to volunteer emails.

---

## What volunteers see today

Volunteer mail is sent from **noreply@cleanupgiveback.org**. In Gmail’s inbox list, that address shows a **pink circle with the letter N** (the first letter of “noreply”). That circle is **not** something we can change from the app or from Resend.

**Inside the email**, volunteers already see the white CUPGB mark on the green header, product photos, and the shipping animation. Support is **info@cleanupgiveback.org** — Donna’s name is not in those volunteer emails.

So: the brand is already in the message. The gap is only the **tiny inbox icon**.

---

## Can we just upload a profile photo?

**No — not for Gmail.**

| Idea | Works in Gmail? |
|------|-----------------|
| Logo already in the email | Yes (this is live) |
| Gravatar / “profile picture” services | No |
| Changing the From name | No (still an N) |
| Paid inbox-logo certificate (CMC or VMC) + DNS | This is the only Gmail-supported path |

Gravatar and similar tools work in a few third-party mail apps. Gmail, Apple Mail, and Outlook ignore them.

---

## What Gmail actually requires (BIMI)

Gmail will only replace the letter circle with our logo if we buy a **mark certificate** and publish it in GoDaddy DNS. The industry name is **BIMI**.

There are two certificate types:

| Certificate | Rough yearly cost (2026) | What Gmail shows | Extra requirement |
|-------------|--------------------------|------------------|-------------------|
| **CMC** (Common Mark) | **$650–$1,400** | Logo in the circle | Logo in public use for **12+ months** (no trademark needed) |
| **VMC** (Verified Mark) | **$1,200–$1,500** | Logo **plus** a blue check | Registered trademark (USPTO, etc.) |

Prices vary by seller (DigiCert list is at the high end; resellers are cheaper). It renews every year.

We also have to tighten a mail-security setting called **DMARC** (today it is set to “monitor only”). That change is free, but it should be done carefully so real mail (Resend, Microsoft 365) is not accidentally junked.

**Engineering already hosted the square logo file** at:

`https://cleanupgiveback-web-app.vercel.app/email/bimi-logo.svg`

That file does nothing in Gmail until DMARC is tightened **and** a certificate is paid for.

---

## What this would take (if you say yes)

1. **Dulf / GoDaddy:** change DMARC from “none” to “quarantine” (watch mail for a few days, then optionally “reject”).
2. **Donna / org:** buy a CMC (or VMC if a trademark is already registered). Budget roughly **$1,000/year**.
3. **Engineering:** put the certificate file on the website and add one DNS text record.
4. **Wait** up to about 48 hours. Gmail can still hide the logo on mail it does not trust.

This does **not** change Donna’s own admin address (`donnaadam@cleanupgiveback.org`). Volunteer mail stays `noreply@`.

---

## Recommendation

**Do not buy a certificate yet** unless putting the mark in that Gmail circle is a priority this year.

Reasons:

- Volunteers already see the logo **inside** every branded email.
- CMC/VMC is an **annual** cost, not a one-time fee.
- CMC may not even be issuable until the logo has been in public use for a year.
- Changing DMARC has a small risk of affecting other mail until it is monitored.

**If you do want it:** approve ~$650–$1,400/year and confirm the logo has been used publicly for 12+ months (or that a trademark exists for VMC). Engineering can then walk Dulf through GoDaddy and host the certificate.

---

## Decision

Please pick one:

- **A — Wait.** Keep the logo in the email body. Inbox stays the pink N. No extra cost.
- **B — CMC.** Pay for the inbox logo (no blue check). Confirm 12-month public use of the mark.
- **C — VMC.** Pay more for logo + Gmail blue check. Needs a registered trademark.

Reply with A, B, or C. Engineering will not change GoDaddy or spend money until you choose.

---

**Ops detail (Dulf):** [admin/dulf-resend-supabase-fly.md](../admin/dulf-resend-supabase-fly.md) §2.2.1.
