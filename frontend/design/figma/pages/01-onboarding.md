# Page 1 · Onboarding

**Figma page:** `1·Onboarding`  
**Figma node:** [`627:29`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=627-29)  
**Token binding status:** ✅ All text nodes bound — color variables + typography primitives (verified 2026-06-30 text-token sweep; 139 text layers).

## Screens (9)

| Route key | PRD § | Figma node | Legacy HTML key | Status |
|-----------|-------|------------|----------------|--------|
| `splash-loading` | — | [`827:111`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=827-111) | — | designed |
| `parent-permission-confirmation` | 6.0d | [`728:901`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=728-901) | — | bound |
| `parent-permission-learn-why` | 6.0d | [`833:314`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=833-314) | — | bound |
| `welcome` | 6.1 | — | `welcome___standardized_progress` | designed |
| `create-account` | 6.2 | — | `create_account___standardized_progress` | designed |
| `account-details` | 6.3 | — | `account_details___standardized_progress` | designed |
| `notification-preference` | 6.4 | — | `notification_preference___standardized_redo` | designed |
| `setup-complete` | 6.5 | — | `setup_complete` | designed |
| `coachmark-tutorial` | 6.6 | — | `coachmark_tutorial` | designed |

## Minor permission gate

| Screen | Node | Flow |
|--------|------|------|
| `parent-permission-confirmation` | [`728:901`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=728-901) | Blocker modal — Contact Admin + **Learn why** link |
| `parent-permission-learn-why` | [`833:314`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=833-314) | Plain-language explainer; Back → blocker; CTA → Contact Admin |

## Splash loading screen

Disney+-inspired cinematic splash on page **1 · Onboarding** ([`827:111`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=827-111)):

- Dark radial forest-green background (`green/500` glow center → near-black edges)
- Centered white vegetation brand mark (cloned from `welcome`)
- Lime-to-green glowing arc sweep over the logo (`lime/500` + `green/500`)
- Sanchez brand name + Noto Sans tagline: *Service tracking, simplified.*
- `_impl-notes` layer with `@route splash-loading` handoff tags

## Flow

```
splash-loading → welcome
welcome
  → create-account (Sign up with Email)
    → account-details (Continue)
      → notification-preference (Continue)
        → setup-complete (Enable Notifications / Not now)
          → coachmark-tutorial (Start Quick Tour)
          → session-setup (Start Tracking)
          → home (Go to Home)
```

## Notes

- Progress bar appears across Welcome → Create Account → Account Details → Notification Preference (4 steps).
- Token binding was performed in the 2026-06-30 session; see `PROGRESS.md` for details.
- `welcome.html` (no suffix) is the retired Stitch original — do not implement.
