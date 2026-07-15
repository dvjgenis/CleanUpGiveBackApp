# Context: app

Expo Router navigation and screen entry points.

## Purpose

`frontend/src/app/` defines file-based routes. The app currently ships a **WebView HTML prototype** under `/prototype/[screen]`.

## Routes

| Route | File | Notes |
|-------|------|-------|
| `/` | `index.tsx` | Splash (`AppSplashScreen`) then **Redirect to `/welcome`** until onboarding is marked complete; afterward Home dashboard (`HomeScreen`, Figma `406:291`) — **first-time-user** mock: empty chart (`0.0 hrs`), `0.0` impact stats, empty recent sessions with **"No recent sessions yet."** until a session is ended (`recentSessionsStore`); **three** recent events (tap → `/event-detail?id=…`); bell opens `/notifications`; **Shop** tab opens `/shop`; **Sessions** tab opens `/sessions-list`; **Profile** tab opens `/account` |
| `/welcome` | `welcome.tsx` | Welcome / login (Figma `112:6776`) — hero, email/password, Log In → home, Create an Account → `/create-account` |
| `/create-account` | `create-account.tsx` | Create account (Figma `105:2`) — Name/Email/Password + Apple/Google/Email social; Continue → `/creating-account` |
| `/creating-account` | `creating-account.tsx` | Creating account interstitial (Figma `137:73`) — rotating Did-you-know facts + linear progress bar; replace → `/account-phone` |
| `/account-phone` | `account-phone.tsx` | A few details — phone (Figma `712:323`, step 2/5); flag dropdown opens scrollable country-code picker (`constants/countries.ts`); Continue → `/account-details` |
| `/account-details` | `account-details.tsx` | A few details — birthday (type MM/YYYY or wheel picker) + service type (Figma `112:6882`, step 3/5); same scroll/form spacing as `/account-phone` (no extra header offset); Continue/Previous use shared onboarding CTA size (`paddingVertical: 20`); picker scrim fades with sheet exit (`sheetDismiss` timing); Continue → `/notification-preference` or `/under-age` if under 18 |
| `/notification-preference` | `notification-preference.tsx` | Stay updated (Figma `112:7130`) — preference chips are display-only (`chipBg` `#f0edec` + outline, not tappable); Enable / Not now → `/setup-complete` |
| `/setup-complete` | `setup-complete.tsx` | Account created success (Figma `133:93`) — static reimported checkmark (`AccountCreatedCheck`); lime corner blobs drift slightly toward opposite corners on enter; copy + Continue fade/slide in; subtitle uses `color/text/on-primary`; Continue marks onboarding complete → `/home-tour` |
| `/home-tour` | `home-tour.tsx` | Tour step 1 (Figma `137:527`) — home impact preview; prefetches shop/track webp graphics; Continue → `/shop-tour` |
| `/shop-tour` | `shop-tour.tsx` | Tour step 2 (Figma `137:115`) — shop gear preview (`shop-showcase.webp` via expo-image); Continue → `/track-tour` |
| `/track-tour` | `track-tour.tsx` | Tour step 3 (Figma `137:431`) — live map preview (`track-map.webp` via expo-image); Continue → `/session-tour` |
| `/session-tour` | `session-tour.tsx` | Tour step 4 (Figma `137:173`) — native search + tilted session rows; lime stars on approved left edges (`137:1002`/`1004`/`1006`); Continue → `/set-tour` |
| `/set-tour` | `set-tour.tsx` | Tour finale (Figma `112:7170`) — speckled lime stars (`star-set.svg`) orbit copy; empty on arrival, then staggered fade-in after ~450ms; Replay → `/home-tour`; Start Tracking → `/session-setup-guide`; Go Home → `/` |
| `/under-age` | `under-age.tsx` | Parent/admin permission gate (Figma `728:901`); Contact Admin mailto; **Learn why** → `/under-age-learn-why` |
| `/under-age-learn-why` | `under-age-learn-why.tsx` | Why admin approval is required (Figma `833:314`); four reason cards + Contact Admin; Back → `/under-age` |
| `/shop` | `shop.tsx` | Shop home (`ShopScreen`, Figma `498:606` / PRD §6.19) — mission copy, donate card ($5/$10/$15/Custom → `/donate?amount=`), featured Trash Clean Up Kit (**View Kit** → `/product-detail?id=cleanup-kit`), category chips (All/Kits/Tools/Safety/Bags; **Kits** grid shows Trash Clean Up Kit), 2-column product grid (**View** → `/product-detail?id=` per SKU); **Add to cart** updates shared `cartStore` (starts empty); cart badge count = total qty; empty cart icon → toast; cart with items → `/cart`; Shop tab active |
| `/donate` | `donate.tsx` | Contribute / Donate (`DonateScreen`, Figma `412:4` / PRD §6.20) — amount presets + custom; **Continue** → `/purchase-confirmation?mode=donation&amount=`; back → Shop |
| `/product-detail` | `product-detail.tsx` | Product detail (`ProductDetailScreen`, Figma `492:114` + SKU frames / PRD §6.21) — parameterized `?id=`; quantity stepper + **Add to cart** → `cartStore`; empty-cart toast on cart icon; cart badge reflects live count; back → Shop |
| `/cart` | `cart.tsx` | Cart (`CartScreen`, Figma `657:1585` / PRD §6.22) — line items + donation from `cartStore` (default $5), order summary, **Continue** → `/checkout`; back → previous |
| `/checkout` | `checkout.tsx` | Checkout (`CheckoutScreen`, Figma `657:1809` / PRD §6.23) — order summary from `cartStore` (same items + donation), shipping + payment forms; **Place Order** validates required fields (red label/border + missing-fields toast, same pattern as session setup) → `/purchase-confirmation`; empty-cart toast on cart icon; back → Cart |
| `/purchase-confirmation` | `purchase-confirmation.tsx` | Confirmation (`PurchaseConfirmationScreen`, Figma `494:262`) — order mode: cart lines; donation mode (`?mode=donation&amount=`): gift-only receipt; hearts animate; **Continue Shopping** / **Back to Shop** / **Go Home** |
| `/event-detail` | `event-detail.tsx` | Event detail (`EventDetailScreen`, Figma `196:226` / PRD §6.8) — hero carousel, overview/organizer/what-to-bring/location; copy icon copies Maps link + toast; map tap opens Apple/Google Maps; **Register** opens confirmation overlay (Figma `787:406`); **Go Home** → `/` |
| `/sessions-list` | `sessions-list.tsx` | Sessions list (`SessionsScreen`, Figma `515:1791` / PRD §6.16) — search, All/Approved/Under Review/Declined chips, status-bordered rows; fetches from Fly API when `EXPO_PUBLIC_API_URL` configured, else mock data; row tap → `/session-detail?id=` |
| `/session-detail` | `session-detail.tsx` | Session detail (`SessionDetailScreen`, Figma `515:1848` / PRD §6.18) — map hero, status, stats, photo evidence, New Session CTA; back returns to list |
| `/account` | `account.tsx` | Account tab (`AccountScreen`, Figma `569:896`) — profile hero + Records / Shop / Preferences / Permissions; Notifications → `/notifications`; Export Service Record → `/export-service-record`; Request Data → `/request-data`; Approval History → `/approval-history`; Order History → `/order-history`; Donation History → `/donation-history`; Delete Account → `/delete-account-confirm`; Sessions → `/sessions-list`; Profile tab active |
| `/delete-account-confirm` | `delete-account-confirm.tsx` | Delete account confirmation (`DeleteAccountScreen`, Figma `725:361`) — type **DELETE** to confirm; invalid confirm shows session-setup-style toast; back returns to Account |
| `/order-history` | `order-history.tsx` | Order History (`OrderHistoryScreen`, Figma `854:116`) — order cards with Delivered status + email receipt chips; back → Account |
| `/donation-history` | `donation-history.tsx` | Donation History (`DonationHistoryScreen`, Figma `854:205`) — donation amount cards + email confirmation chips; back → Account |
| `/approval-history` | `approval-history.tsx` | Approval History (`ApprovalHistoryScreen`, Figma `854:294`) — summary stats + session cards with Approved / Under Review / Not Approved; back → Account |
| `/export-service-record` | `export-service-record.tsx` | Export Service Record (`ExportServiceRecordScreen`, Figma `854:383`) — editable timeframe (type or calendar picker), status multi-select, PDF/CSV format; Export Record → `/export-record-success` |
| `/export-record-success` | `export-record-success.tsx` | Export success (`ExportRecordSuccessScreen`, Figma `840:561`) — checkmark card; Continue → `/account`; View PDF/CSV placeholder |
| `/request-data` | `request-data.tsx` | Request your data (`RequestDataScreen`, Figma `728:1385`) — Access / Delete / Download radio options; Submit → `/request-data-sent` |
| `/request-data-sent` | `request-data-sent.tsx` | Data request sent confirmation (`RequestDataSentScreen`, Figma `728:1648`); Continue → `/account` |
| `/notifications` | `notifications.tsx` | Notification preferences (`NotificationsScreen`, Figma `649:774`) — toggle categories, back returns to home; Sessions → `/sessions-list`; Profile → `/account` |
| `/session-setup-guide` | `session-setup-guide.tsx` | Session setup guide step 1 — "How does this work?" (Figma `session_setup_guide` intro); **Track** tab entry when no live session (always shown for now) |
| `/session-setup-step2` | `session-setup-step2.tsx` | Session setup guide step 2 |
| `/session-setup-step3` | `session-setup-step3.tsx` | Session setup guide step 3 — "Time is ticking..." (Figma `229:351`) |
| `/session-setup-step4` | `session-setup-step4.tsx` | Session setup guide step 4 — "Checkpoint photos for verification." (Figma `249:369`) |
| `/session-setup-step5` | `session-setup-step5.tsx` | Session setup guide step 5 — "Now that the session is over..." (Figma `249:387`) |
| `/session-setup-step6` | `session-setup-step6.tsx` | Session setup guide step 6 — location permission (Figma `728:639` / `permission-location`); **Enable location** calls `expo-location` `requestForegroundPermissionsAsync()` (iOS/Android system dialog) |
| `/session-setup-step7` | `session-setup-step7.tsx` | Session setup guide step 7 — camera permission (Figma `728:658` / `permission-camera`); **Enable camera** calls `expo-camera` `requestCameraPermissionsAsync()` (iOS/Android system dialog) |
| `/session-setup-complete` | `session-setup-complete.tsx` | Session setup finale — "That's it! Let's get tracking!" (Figma `251:405`) |
| `/session-setup` | `session-setup.tsx` | Session setup form (Figma `260:1312` / PRD §6.9) |
| `/live-session` | `live-session.tsx` | Live session tracker (Figma `251:439` / PRD §6.11); stack push uses `animation: 'none'` so expand-from-home runs a custom bottom-up map reveal wipe; back chevron minimizes to `/`; location pill shows live city + temperature via `expo-location` + Open-Meteo; GPS route + distance via `liveSessionStore`; map: WebView MapLibre in Expo Go, native MapLibre in dev client; persists session to Fly API when `EXPO_PUBLIC_API_URL` set; checkpoint card shows submitted photo count + green dots only when at least one photo was submitted **before** the 30-minute countdown expired (`submittedEarly`) |
| `/photo-checkpoint` | `photo-checkpoint.tsx` | Photo checkpoint prompt (Figma `364:115` / PRD §6.12) — **Take Photo** opens `/photo-capture` |
| `/photo-capture` | `photo-capture.tsx` | Two-step camera capture: front-camera selfie → back-camera progress photo → BeReal-style preview (Figma `383:239`: full-bleed progress + top-left selfie PiP + **Retake Photos** / **Submit**) → `/photo-submitted`; **Cancel** / Go Back uses `dismissTo('/live-session')` so the photo-required screen is not left on the stack |
| `/photo-submitted` | `photo-submitted.tsx` | Photo submitted confirmation (Figma `260:1571` / PRD §6.12) — hero animation inside the bordered card (`PhotoSubmittedHeroVideo`); resets checkpoint countdown on mount, live `MM:SS` timer ticks until **Continue Tracking**; shows session photo count only when the just-submitted photo was taken early (before countdown hit zero) |
| `/submission-confirmation` | `submission-confirmation.tsx` | Session detail / submission confirmation (Figma `269:1615` / PRD §6.15) — reads `getCompletedSessionSnapshot()` for **all** checkpoint photos (selfie + progress per submission), tap any thumbnail for enlarged view, timestamps, route map preview, duration, and setup fields |
| `/missed-checkpoint` | `missed-checkpoint.tsx` | Missed checkpoint error (Figma `269:1587` / PRD §6.13) — hero Lottie loops continuously |
| `/prototype/[screen]` | `prototype/[screen].tsx` | Renders Stitch HTML by screen key |
| Layout | `_layout.tsx` | Root `Stack` wrapped in `AuthProvider` (Supabase anonymous sign-in on launch); explicit `Stack.Screen` entries for native session routes, shop + donate + product-detail, account, event-detail, notifications, sessions-list + prototype; tab roots (`index`, `shop`, `sessions-list`, `account`) use `animation: 'fade'` |

## Patterns

- **Track tab** (`BottomNavBar` on home, sessions, account, notifications): active live session → `/live-session`; otherwise → `/session-setup-guide` (full guide flow through permissions, then `/session-setup` form)
- **Shop tab** → `/shop`; **Sessions tab** → `/sessions-list`; **Profile tab** → `/account`
- **Tab switches** use fade (not horizontal swipe); hierarchical pushes (product detail, session detail, account subpages) keep the default slide
- **Guide navigation:** Continue uses `router.push`; Previous/back use `router.back()` (reverse swipe). Step 6 Previous uses `router.replace('/session-setup-step5')` with `animationTypeForReplace: 'pop'` when Skip bypasses the stack.
- **Onboarding tour:** setup-complete → `/home-tour` → `/shop-tour` → `/track-tour` → `/session-tour` → `/set-tour` (Continue / Previous); finale Replay / Start Tracking / Go Home
- **NAV_RULES** + injected JS bridge handle cross-screen navigation via `postMessage`
- Metro bundles `.html` via `frontend/metro.config.js` (`assetExts` includes `html`)
- Asset loading: `expo-asset` + `expo-file-system` with fetch fallback

## Decisions

- Stack navigator over `NativeTabs` so `/prototype/*` routes are reachable (see [progress.md](../../progress.md))
- Tab-root screens fade in/out on BottomNav switches; nested screens keep slide
- `injectedJavaScriptBeforeContentLoaded` + `onMessage` for iOS WKWebView navigation
- Phone country picker uses Unicode flag emojis + dial codes from `constants/countries.ts` (no flag asset package); US formatting applies for US/CA only; modal scrim is static while only the sheet springs up/down (`animationType: none`)
- Phone step uses `KeyboardAvoidingView` + tap-outside / drag-to-dismiss so Continue stays reachable above the phone-pad keyboard

## Policies

- **Do not add new screens to the prototype.** New screens are registered in `frontend/design/figma/manifest.yaml` and implemented as native RN routes under `src/app/`.
- The HTML prototype (`/prototype/[screen]`) is **frozen** — it continues to run for Expo Go demos but receives no new features.
- Native production screens live under `src/app/<routeKey>.tsx` following Expo Router file-based conventions. Use the `routeKey` from `manifest.yaml` as the filename.
- When a native screen ships, set its `status` to `implemented` in `manifest.yaml` and remove its entry from `HTML_MAP`.
