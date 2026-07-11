# CleanUpGiveBack — Screen Map

> This document maps PRD screens → Figma frames → Stitch counterparts (legacy) → prototype code files.
> **Figma is now the design ground truth.** See [`frontend/design/figma/manifest.yaml`](../../frontend/design/figma/manifest.yaml) for the migration index.

Updated: 2026-06-30

---

## Design System

Token authority: **Figma Design System page** ([`1:3`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=1-3)) — 104 variables, 14 text styles.
Full token reference: [`docs/frontend/brand.md`](../brand.md).

> The token table previously in this document has been removed — it contained Stitch-era values that are superseded by the Figma variable collections. Refer to `brand.md` for all current token values.

---

## Auth / Onboarding

> Figma page: **1·Onboarding** ([node 627:29](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=627-29)) · Token binding: ✅ complete (2026-06-30)
> Figma `routeKey` values: `splash-loading`, `welcome`, `create-account`, `account-details`, `notification-preference`, `setup-complete`, `coachmark-tutorial` — see [manifest.yaml](../../frontend/design/figma/manifest.yaml)

| # | PRD Screen | PRD § | Figma node | Stitch Match *(legacy)* | Stitch ID *(legacy)* | Code File | Status |
|---|---|---|---|---|---|---|---|
| 0 | Splash / App Loading | — | [`827:111`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=827-111) | — | — | `expo-splash-screen` (`app.json`) | 🎨 Figma designed |
| 1 | Welcome / Auth | 6.1 | — | Welcome - Standardized Progress ★ | `e77c3364e32f4b22823b7a0c9cd0cbdd` | `prototype/screens/auth/Welcome.tsx` | ✅ |
| 2 | Create Account | 6.2 | Create Account - Standardized Progress | `e2433a03392344ac97a58c93420583fc` | `prototype/screens/auth/CreateAccount.tsx` | ✅ |
| 3 | Account Details | 6.3 | Account Details - Standardized Progress | `91668378750f490ea367ba08af63b86e` | `prototype/screens/auth/AccountDetails.tsx` | ✅ |
| 4 | Notification Preference | 6.4 | Notification Preference - Standardized Redo | `095341a446e448a2904d0ee93ea78e4b` | `prototype/screens/auth/NotificationPreference.tsx` | ✅ |
| 5 | Setup Complete | 6.5 | — | — | `prototype/screens/auth/SetupComplete.tsx` | ✅ Generated |
| 6 | Coachmark Tutorial | 6.6 | — | — | `prototype/screens/auth/Coachmark.tsx` | ✅ Generated |

---

## Main App

> Figma pages: **2·Home & Events** · **3·Shop & Payments** · **4·Session Tracking** · **5·Sessions History**
> See [manifest.yaml](../../frontend/design/figma/manifest.yaml) for `routeKey` values and Figma node IDs.

| # | PRD Screen | PRD § | Stitch Match *(legacy)* | Stitch ID *(legacy)* | Code File | Status |
|---|---|---|---|---|---|---|
| 7 | Home | 6.7 | Home Dashboard - Final Branding | `68fe23e48c51440aa28e15830b3236c6` | `prototype/screens/home/Home.tsx` | ✅ |
| 8 | Event Detail | 6.8 | — | — | `prototype/screens/event/EventDetail.tsx` | ✅ Generated |
| 9 | Session Setup | 6.9 | Session Setup - PRD Aligned Standardized | `ac088fa0affe4ae8b4c3661cf41cfe95` | `prototype/screens/session/SessionSetup.tsx` | ✅ |
| 10 | Permission Check — Location | 6.10 | — | — | `prototype/screens/session/Permissions.tsx` (step 0) | ✅ Generated |
| 11 | Permission Check — Camera | 6.10 | — | — | `prototype/screens/session/Permissions.tsx` (step 1) | ✅ Generated |
| 12 | Live Cleanup Session | 6.11 | Live Session - Refined Map Tracker | `8045c50bbe924b1bbcc9228bed1c8c50` | `prototype/screens/session/LiveSession.tsx` | ✅ |
| 13 | Photo Checkpoint Popup | 6.12 | Photo Checkpoint | `ea5a2302b5824da9a3076d9bd26bb9a1` | `prototype/screens/session/PhotoCheckpoint.tsx` | ✅ |
| 14 | Missed Checkpoint / Restart | 6.13 | Restart Required | `23fca9a5d2d44b2ebf7a6e7d184de288` | `prototype/screens/session/MissedCheckpoint.tsx` | ✅ |
| 15 | Session Review | 6.14 | — | — | `prototype/screens/session/SessionReview.tsx` | ✅ Generated |
| 16 | Submission Confirmation | 6.15 | Submission Confirmation - PRD Aligned ★ | `b20acc3de1c441239b0622b1640219c6` | `prototype/screens/session/SubmissionConfirmation.tsx` | ✅ |
| 17 | Sessions List View | 6.16 | Sessions List View - Standardized Refined | `5f1eff26ce264ff184ce9ad1d213d2d1` | `prototype/screens/sessions/SessionsList.tsx` | ✅ |
| 18 | Sessions Calendar View | 6.17 | Sessions Calendar View - Standardized Refined ★ | `4acdb9adf830431eb3a267328a1324e0` | `prototype/screens/sessions/SessionsCalendar.tsx` | ✅ |
| 19 | Session Detail | 6.18 | — | — | `prototype/screens/sessions/SessionDetail.tsx` | ✅ Generated |
| 20 | Shop Home | 6.19 | Shop Home - PRD & Reference Aligned | `851c8e35bde84ed48af36bd305da0311` | `prototype/screens/shop/ShopHome.tsx` | ✅ |
| 21 | Donate | 6.20 | Donate | `1ebb06ee3aab4f79b373714156a51e6d` | `prototype/screens/shop/Donate.tsx` | ✅ |
| 22 | Product Detail | 6.21 | Product Detail: Cleanup Kit - High Fidelity | `492:114` (+ SKU frames `909:126`, `905:166`, `905:236`, `905:306` in Figma) | `prototype/screens/shop/ProductDetail.tsx` | ✅ Figma · RN placeholder |
| 23 | Cart | 6.22 | Shopping Cart (No Tote Bag) | `62818b1ae3d24b928b85c0a6e53cad28` | `prototype/screens/shop/Cart.tsx` | ✅ |
| 24 | Checkout | 6.23 | — | — | `prototype/screens/shop/Checkout.tsx` | ✅ Generated |
| 25 | Purchase / Donation Confirmation | 6.24 | Thank You! (No Tote Bag) | `d38314d06d2e4d58ba492326a7e2dceb` | `prototype/screens/shop/PurchaseConfirmation.tsx` | ✅ |
| 26 | Account | 6.25 | Account | `9e1f4cc7670241aa9668da2cbf10ace4` | `prototype/screens/account/Account.tsx` | ✅ |

---

## Account Sub-pages

> Figma page: **6·Account & Settings** — see [manifest.yaml](../../frontend/design/figma/manifest.yaml)

| # | PRD Screen | PRD § | Stitch Match *(legacy)* | Stitch ID *(legacy)* | Code File | Status |
|---|---|---|---|---|---|---|
| 27 | Notification Settings | 6.26 | Notification Settings - Refined Toggles | `83a91d33190545b49c11af078e4ff4e7` | `prototype/screens/account/NotificationSettings.tsx` | ✅ |
| 28 | Privacy & Permissions | 6.27 | — | — | `prototype/screens/account/PrivacyPermissions.tsx` | ✅ Generated |
| 29 | Order History | 6.28 | Order History | `da9870f8fbb1470887beaee7a93e0fec` | `prototype/screens/account/OrderHistory.tsx` | ✅ |
| 30 | Donation History | 6.29 | Donation History | `360ff7413c6d4660a9b4fd0a74ea6c77` | `prototype/screens/account/DonationHistory.tsx` | ✅ |
| 31 | Export Service Record | 6.30 | Export Service Record | `69ae4c567c2d48448cbd4b2b847c791d` | `prototype/screens/account/ExportServiceRecord.tsx` | ✅ |
| 32 | Approval History | 7 | — | — | — | 🎨 Figma designed (`854:294`) |

---

## Duplicate Stitch Screens (resolved)

| PRD Screen | Stitch Versions | Canonical (★) | Retired |
|---|---|---|---|
| Welcome / Auth | "Welcome" + "Welcome - Standardized Progress" | Welcome - Standardized Progress | Welcome (`6843db9f...`) |
| Submission Confirmation | "Refined Design" + "PRD Aligned" | Submission Confirmation - PRD Aligned | Refined Design (`cbf7c07a...`) |
| Sessions Calendar View | "Standardized Refined" + "with Toggle" | Standardized Refined | with Toggle (`85f51fde...`) |

---

## Gap Summary

| Gap type | Count |
|---|---|
| Missing from Stitch → generated in code | 11 |
| Present in Stitch → implemented in code | 20 |
| Duplicates resolved | 3 sets |

### 11 screens generated from PRD spec (not in Stitch)
1. Setup Complete (§6.5)
2. Coachmark Tutorial — 6-step sequence (§6.6)
3. Event Detail (§6.8)
4. Permission Check — Location (§6.10 step 0)
5. Permission Check — Camera (§6.10 step 1)
6. Session Review (§6.14)
7. Session Detail (§6.18)
8. Checkout (§6.23)
9. Privacy & Permissions (§6.27)

---

## Reference Images in Stitch (not app screens)

These 27 items in the Stitch project are reference assets — not generated mobile screens. They have no `deviceType` and no `htmlCode`. They should not be confused with actual app screens.

- 5 product photos (vest, grabber, gloves, tote, cleanup kit)
- 1 volunteer documentary photo
- 1 road map image
- 1 leaf background image
- 1 PRD markdown file upload
- 18 screenshots / reference images

---

## Accessibility Checklist

Applied across all 31 code files:

- [x] `accessibilityRole="header"` on all screen headlines
- [x] `accessibilityRole="button"` + `accessibilityLabel` on all touchables
- [x] `accessibilityRole="tab"` + `accessibilityState={{ selected }}` on BottomNav items
- [x] `accessibilityRole="switch"` on all Switch components
- [x] `accessibilityRole="dialog"` + `accessibilityViewIsModal` on PhotoCheckpoint overlay
- [x] Status tags include both text and color — never color alone
- [x] Input components use `accessibilityLabel`, `accessibilityRequired`, `accessibilityInvalid`
- [x] Disabled CTAs use `accessibilityState={{ disabled: true }}`
- [x] Minimum 44pt tap targets on all interactive elements
- [x] Dot calendar indicators carry descriptive `accessibilityLabel`

### WCAG 2.1 AA contrast — flag for review before sign-off

| Pair | Notes |
|---|---|
| `#009540` on `#FAFBFA` | Verify ≥ 4.5:1 — primary green on background |
| `#fcab29` on `#FAFBFA` | Verify ≥ 4.5:1 — accent amber on background |
| `#6e7a6c` on `#FAFBFA` | Verify ≥ 4.5:1 — secondary text on background |
| White on `#009540` | Should pass — white on primary green |

---

## Motion Inventory

| Screen | Motion applied |
|---|---|
| SetupComplete | Fade + 8px translateY, 220ms easeOut |
| Coachmark | Per-step fade + scale 0.95→1, 200ms |
| EventDetail | Fade + 8px translateY, 220ms easeOut |
| PhotoCheckpoint | Slide up from bottom, spring damping 20 |
| SubmissionConfirmation | Fade + 8px translateY, 220ms easeOut |
| PrimaryButton (all) | Scale 0.97 press / 1.0 release, spring |

All other screens: instant, no decorative animation.

---

## Compliance & Privacy (designed — 2026-06-30)

> 13 screens in [manifest.yaml](../../frontend/design/figma/manifest.yaml) — Figma frames designed on Page 6 + Page 7. Existing screen modifications still pending — see [figma-compliance-screen-gap-audit.md](../compliance/figma-compliance-screen-gap-audit.md).

### Page 6 · Account (2 new)

| Route key | PRD § | Purpose | Figma node | Status |
|-----------|-------|---------|------------|--------|
| `account-privacy` | 6.37 | Account tab → Preferences → Privacy hub | `723:405` | designed |
| `privacy-permissions` | 6.27 | OS permissions (split from privacy-security) | `723:455` | designed |

### Page 7 · Compliance & Legal (11 new)

| Route key | PRD § | Purpose | Figma node | Status |
|-----------|-------|---------|------------|--------|
| `age-gate` | 6.0a | Neutral DOB screening (pre-auth) | `722:51` | designed |
| `parental-consent-notice` | 6.0b | Parent direct notice | `723:307` | designed |
| `parental-consent-verify` | 6.0c | Verifiable consent | `723:317` | designed |
| `parental-consent-pending` | 6.0d | Blocked until verified | `723:332` | designed |
| `teen-privacy-notice` | 6.0e | Teen highest-privacy defaults | `723:49` | designed |
| `privacy-policy` | 6.31 | Policy viewer | `723:339` | designed |
| `terms-of-service` | 6.32 | ToS viewer | `723:352` | designed |
| `privacy-rights-request` | 6.33 | CCPA access/deletion form | `723:365` | designed |
| `delete-account-confirm` | 6.35 | Account deletion + re-auth | `723:378` | designed |
| `permission-location` | 6.10 | Location permission explainer | `728:639` | designed |
| `permission-camera` | 6.10 | Camera permission explainer | `728:658` | designed |

**Docs:** [privacy-and-data-protection.md](../compliance/privacy-and-data-protection.md) · [privacy-compliance-prd-addendum.md](specs/privacy-compliance-prd-addendum.md)
