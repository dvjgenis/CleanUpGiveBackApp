# Clean Up - Give Back — Compliance & Launch Checklist

**Date:** 2026-08-13  
**Status:** Living engineering + product checklist — **not legal advice**; counsel must review before public traffic  
**Audience:** Product, engineering, operations, counsel  
**Parent:** [privacy-and-data-protection.md](privacy-and-data-protection.md)

This is the launch board for *this* app (location tracking, selfie evidence, court-service hours, 501(c)(3)). It is not a generic SaaS + ads + LLM + subscriptions list. Items that do not apply are listed under [Out of scope](#10-explicitly-out-of-scope).

In-app draft copy lives in [`frontend/src/features/figma-screens/content/privacyPolicyContent.ts`](../../frontend/src/features/figma-screens/content/privacyPolicyContent.ts). Outline: [mobile-app-privacy-policy-outline.md](mobile-app-privacy-policy-outline.md). Backend rights: [privacy-and-data-rights.md](../backend/specs/privacy-and-data-rights.md).

## Status legend

| Tag | Meaning |
|-----|---------|
| **done** | Shipped and matches current product |
| **partial** | Started; not launch-ready |
| **not started** | No implementation |
| **policy-only** | Claimed in the draft policy, not built |
| **when shipped** | Do this when that feature goes live (do not block launch on it today) |
| **ops** | Confirm in dashboards / DNS / hosting, not only in code |

Suggested work order is at the [bottom](#suggested-order-of-work).

---

## Related documents

| Document | Purpose |
|----------|---------|
| [privacy-and-data-protection.md](privacy-and-data-protection.md) | Nationwide privacy framework |
| [mobile-app-privacy-policy-outline.md](mobile-app-privacy-policy-outline.md) | Draft policy outline for counsel |
| [privacy-and-data-rights.md](../backend/specs/privacy-and-data-rights.md) | Cascade delete, export, retention jobs |
| [ADR-003](../adr/ADR-003-minor-data-protection-baseline.md) | Strictest-baseline architecture |
| [accounts-and-access.md](../accounts-and-access.md) | Processors and env (no secrets) |
| [implementation-plan.md](../implementation-plan.md) | Privacy & compliance milestone list |

---

## 0. Counsel & publication (do this first)

- [ ] **Legal review:** Counsel reviews Privacy Policy, Terms, retention, court-sharing, COPPA/AADC, and Illinois BIPA posture before public traffic. *(not started — this folder already requires it)*
- [ ] **Publish Privacy Policy** on a stable HTTPS URL (e.g. `cleanupgiveback.org/privacy`), not only in-app. *(partial — in-app draft only)*
- [ ] **Publish Terms of Service** on a stable HTTPS URL and wire the in-app Terms row (`AccountPrivacyScreen` is currently `onPress={() => {}}`). *(not started)*
- [ ] **Fill the mailing address** (street + ZIP) on both documents. *(policy-only placeholder)*
- [ ] **Effective / last-updated dates** match the hosted + in-app copies.
- [ ] **Scope statement:** Policy covers mobile app, `cleanupgiveback.org`, and admin console — or say what it does *not* cover.
- [ ] **Signup acceptance:** Required checkbox for Privacy + Terms before account creation. *(not started / incomplete)*
- [ ] App Store **Privacy Nutrition Labels** and Google Play **Data Safety** match the published policy (precise location, photos, contacts, identifiers, diagnostics). *(not started)*
- [ ] iOS **PrivacyInfo.xcprivacy** / Android Data Safety declarations complete.

---

## 1. Privacy Policy — make the draft accurate

### Remove or qualify over-claims

- [ ] Remove **“transactional email is not utilized in this version”** (Resend is live).
- [ ] Qualify **Stripe / card / mailing address** as *when Shop, Donate, or program fees are used* — or drop until payments ship.
- [ ] Qualify **hashed password** until email/password auth ships (mobile is anonymous auth today).
- [ ] Fix **local session drafts / interrupted-session recovery** (live-session resume was removed 2026-08-12). Disclose what *is* stored on-device: preferences, map theme, session notes, cached sessions, unlock flag, deleted-session ids.
- [ ] Do not promise **Account → Privacy** deletion/export until those screens hit a backend.
- [ ] Do not publish **90-day GPS / 1-year photo** retention unless jobs enforce it — or say “while the account is active, and as required by law/court programs.”
- [ ] Treat **MapLibre** as on-device software, not a cloud processor.

### Disclose data actually collected

- [ ] Volunteer **feedback** (rating + comment → `volunteer_feedback`)
- [ ] **Service type:** Court Ordered / Volunteering / School / Other (`user_metadata.service_type`)
- [ ] **Session notes** (on-device)
- [ ] **Calendar** permission when adding events (`expo-calendar`)
- [ ] **Checkpoint lat/long** (in addition to the walking route)
- [ ] Session metadata: timestamps, duration, distance, checkpoint misses, map layer, approval status, admin hours adjustments, admin notes, decline reasons
- [ ] **Event registration** records
- [ ] **Email log** (`email_log`) and **admin audit log**
- [ ] **Court-order** records (admin-managed)
- [ ] **Company codes**
- [ ] Push **notification contents** (not only tokens)
- [ ] **IP / network metadata** via hosts and tile/weather APIs
- [ ] Whether **digital signature** images are stored and printed on PDFs
- [ ] Approximate coordinates sent to **Open-Meteo**

### Disclose recipients / processors actually used

- [x] Supabase (Auth, Postgres, Storage) — in draft
- [x] Fly.io (sessions API, US) — in draft
- [ ] Resend — keep; list real message types (registration, approve/decline, hours reminder, OTP, shipped order)
- [x] Expo (push + EAS) — in draft
- [x] Apple / Google — in draft
- [x] CARTO / Esri (map tiles) — in draft
- [x] Open-Meteo — in draft
- [ ] **Vercel** (admin console processes volunteer PII)
- [ ] **OpenStreetMap** (service-letter static maps)
- [ ] **Photon (Komoot), Nominatim, US Census**, optional **Google Places** (admin geocoding / place search)
- [x] **Authorized reviewers** (Donna / program staff) — in draft; still too vague for courts
- [ ] **Courts, probation, schools, employers** as categories of people who may receive service-letter PDFs (name, hours, maps, photos)
- [x] Explicit **no ads / no sale / no remarketing / no ad SDKs** — in draft; keep

### Add legal sections the draft lacks

- [ ] **Controller identity** + complete contact
- [x] **Background / Always location** — session-only, prominent indicator, stops on finalize/cancel *(keep; align with `app.json` purpose strings)*
- [ ] **Sharing for official verification** — what is in a PDF, who can receive it, that deletion may be refused for court-mandated logs
- [ ] **Teens 13–17** — GPS + selfies still collected; same high defaults; no under-13 accounts *(partial in draft)*
- [ ] **Illinois BIPA** assessment: photos for human review vs face templates (do not call it facial recognition unless matching ships)
- [ ] **Sensitive PI:** precise geolocation + face photos
- [ ] **International transfers / storage region** (US: Supabase, Fly, Vercel)
- [ ] **Breach notification** (Illinois PIPA + applicable state law)
- [ ] **Grace period length** after account closure (spec draft: 30 days — pick one number)
- [ ] **Cookies** for the admin website (mobile has none)
- [ ] **CCPA language:** “we honor these rights for all users” — do not claim you are a CCPA “business” unless counsel says so
- [ ] **GDPR:** US-only + store geo, *or* real legal-bases / SCC section
- [ ] **Incident reporting** contact and “notify as required by law”
- [ ] Processor **DPAs** executed and listed (Supabase, Fly, Resend, Vercel, map/geocode vendors; Stripe when live)

---

## 2. Terms of Service (missing entirely)

- [ ] Acceptable use (no fake GPS, no recycled/stolen photos, no under-13 use)
- [ ] Hours verification is **program evidence**, not a court ruling or legal advice
- [ ] Nighttime / session rules the app enforces
- [ ] Photo and location consent for verification and reviewer access
- [ ] Account suspension / termination
- [ ] Intellectual property
- [ ] Limitation of liability / indemnity appropriate for a 501(c)(3)
- [ ] Governing law: Illinois
- [ ] **Refund rules:** merchandise vs donations vs program/tracker fees (different)
- [ ] When Stripe ships: payment terms, failed payment, no silent access via client redirect *(when shipped)*

---

## 3. Data rights (must match the policy)

- [ ] **Delete My Account** permanently removes Auth user, profile, sessions, checkpoints, photos, feedback, local caches — except court-mandated holds. *(not started — `/delete-account-confirm` types DELETE then goes Home)*
- [ ] Delete flow **tells the user** if court logs will be retained and for how long.
- [ ] **Access / download** returns profile + sessions + metadata (JSON); photos as signed URLs or archive. *(not started — `/request-data` is a fake success screen)*
- [ ] **Export service record PDF** for approved sessions only where that is the product rule. *(partial — PDF exists for approved sessions; privacy “full export” does not)*
- [ ] **Correction** of name, email, phone in-app (email OTP already in personal-details). *(partial)*
- [ ] Log every access/deletion request (who, when, outcome).
- [ ] Retention jobs: GPS after verification window; photos after stated period; 30-day grace then hard purge — **or change the policy**. *(not started)*
- [ ] Under-13: keep client wipe; **server must reject** under-13 registration when email auth ships. *(partial — client wipe only)*
- [ ] Age-gate **before** name/email/phone (compliance spec / PRD §6.0a). *(not started)*

---

## 4. Core security & authentication

- [x] Secrets only in env / Fly / Vercel in current workflow — never in client bundles. *(ops — still scan git history)*
- [ ] **Scan git history** for keys (`gitleaks` / `trufflehog`) and rotate anything found. *(not started)*
- [x] Anon/public keys on mobile + admin browser; **service role** only on server, cookie-free for admin list reads.
- [ ] Move admin role to **`app_metadata`** (not client-writable `user_metadata.role`). *(known hole — deferred)*
- [ ] `BYPASS_AUTH=false` on Vercel production. *(ops)*
- [ ] **MFA** on admin (Donna) accounts.
- [ ] RLS: volunteers read/write only their rows; admins via explicit policies; storage path-scoped. *(partial)*
- [ ] Confirm `session-photos` is **private**; signed URLs short TTL. *(partial — design yes, audit TTL)*
- [ ] `event-photos` may stay public for heroes; never put evidence there.
- [ ] Prisma / parameterized queries only; no string-built SQL. *(partial)*
- [ ] Validate types/schemas on Fly routes and admin actions; escape volunteer text in PDFs and HTML email. *(partial — email HTML sanitized)*
- [ ] Server-side JWT/session checks on every protected route. *(partial)*
- [ ] Volunteers cannot set `status`, hours, admin notes, `is_admin`, or other users’ `user_id`.
- [ ] Trim API JSON (no hashes, service keys, other users’ data, internal flags).
- [ ] Admin cookies: HttpOnly, Secure, SameSite (confirm `@supabase/ssr` production defaults). *(ops)*
- [ ] HTTPS on apex, www, Vercel admin, Fly API. *(ops)*
- [ ] Passwords via **Supabase Auth only** when email auth ships — no custom hashing. *(when shipped)*
- [ ] **Email verification** on signup when leaving anonymous auth. *(when shipped)*
- [ ] Dependabot or `npm audit` in CI for `frontend/`, `admin-web-app/`, `backend/sessions/`. *(not started)*
- [ ] Security headers on admin: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy. *(not started — `admin-web-app/next.config.ts` has none)*

---

## 5. Storage, GPS, photos & abuse

- [ ] Upload allowlist: JPEG/PNG (or HEIC if accepted); reject other MIME types.
- [ ] Max file size on client **and** server/storage policies.
- [ ] Orphan / failed-upload cleanup.
- [x] Session-only GPS; no tracking after finalize/cancel; visible live indicator. *(keep tested on EAS Always-location)*
- [ ] Background location **only** while a session is active; App Store justification matches policy. *(partial — product behavior yes; store copy/review pending)*
- [ ] Rate limits: auth, password reset, photo upload, session ingest, PDF, email send. *(not started)*
- [ ] Bot protection on public signup / donate / contact **when those forms are live**. *(when shipped)*
- [ ] SPF + DKIM + **DMARC** on `cleanupgiveback.org`. *(partial — Resend domain verified)*
- [ ] Resend env vars on **Vercel production** as well as Fly/local. *(ops)*

---

## 6. Payments *(when Stripe ships — do not block launch on this today)*

Shop, donate, and tracker checkout are UI mocks; `backend/payments/` is empty. See [accounts-and-access.md](../accounts-and-access.md).

- [ ] Stripe only on server; never store PAN; publishable key in client only. *(when shipped)*
- [ ] **Webhooks** (signed) update order/donation/unlock status — not the success URL. *(when shipped)*
- [ ] Failed payment / dunning rules if any paid feature gates access. *(when shipped)*
- [ ] Refund policy in Terms (shop vs donation vs program fee). *(when shipped — draft the shop/donation distinction in ToS now)*
- [ ] No recurring plans → no renewal-reminder or “symmetrical cancel” duty unless subscriptions are added.
- [ ] If IAP: Apple/Google billing rules; if web Stripe: don’t unlock IAP-gated features via web on iOS without store compliance. *(when shipped)*

---

## 7. Monitoring & reliability

- [ ] Error tracking (Sentry or similar) on mobile, admin, Fly. *(not started)*
- [ ] External uptime checks on `https://cleanup-sessions.fly.dev/health` (or `/health/deep`) and the Vercel admin host. *(not started — in-app Production Readiness panel exists)*
- [ ] Confirm Supabase **automated backups** on; **test a restore once**. *(ops)*
- [x] No fake testimonials in the app. *(n/a in app today — keep true on `cleanupgiveback.org`)*

---

## 8. Illinois, minors, courts (this product’s extra legal surface)

- [ ] COPPA: block under 13; no stored signup PII; no parental-consent flow unless product changes. *(partial — client-side wipe)*
- [ ] AADC-style defaults for **all** 13+ users (opt-in notifications, no dark patterns). *(partial)*
- [ ] Counsel sign-off on **teen selfies + precise GPS**.
- [ ] BIPA: written determination that stored checkpoint selfies are photographs for human review, not biometric identifiers — or add notice/consent if face matching / perceptual hash ships later.
- [ ] Written **court-retention schedule** vs user deletion.
- [ ] Service-letter sharing described in Privacy + Terms (who, what, why).
- [ ] DPIA completed and signed. *(outline only — see privacy-and-data-protection.md §8)*
- [ ] Incident-response plan (who calls counsel, who notifies users, Illinois timelines).

---

## 9. Store / platform specifics

- [x] Location purpose strings in `frontend/app.json` (When In Use vs Always).
- [x] Camera purpose string matches checkpoint use.
- [ ] Calendar purpose string if Add to Calendar stays. *(confirm iOS `NSCalendars*` / usage description)*
- [ ] Push: opt-in; no marketing as default. *(partial)*
- [x] No ATT / tracking prompt needed **unless** cross-app tracking is added (it should not be).
- [ ] Account deletion path that App Store reviewers can complete end-to-end. *(blocked on section 3)*

---

## 10. Explicitly out of scope

Do **not** put these on the launch board unless the product changes:

- Advertising / remarketing / ad-network disclosure
- AI spend caps, prompt-injection, LLM fallbacks (no model APIs in the app)
- Subscription renewal reminders and cancel-symmetry (no recurring plans today)
- GPC / do-not-sell **signal handling** until a website tracker exists (keep the policy sentence that we do not sell)

---

## Suggested order of work

1. Counsel + hosted Privacy & Terms (sections 0–2)
2. Stop over-promising deletion/export/retention — then **build** them (section 3)
3. Admin role hardening, RLS/storage audit, headers, rate limits, git-secret scan (sections 4–5)
4. Sentry, uptime, backup restore (section 7)
5. Store labels + Always-location review (section 9)
6. Stripe block (section 6) only when payments actually ship
