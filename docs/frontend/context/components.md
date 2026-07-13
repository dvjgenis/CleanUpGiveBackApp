# Context: components

Shared UI components in `frontend/src/components/`.

## Inventory

| Component | File | Role |
|-----------|------|------|
| ThemedText | `themed-text.tsx` | Theme-aware text |
| ThemedView | `themed-view.tsx` | Theme-aware container |
| ExternalLink | `external-link.tsx` | Opens URLs in in-app browser |
| HintRow | `hint-row.tsx` | Hint / tip row |
| WebBadge | `web-badge.tsx` | Web-only badge |
| AnimatedIcon | `animated-icon.web.tsx` | Web animated icon |
| Map / MapMarker / MapRoute / MapControls / MapUserLocation | `ui/map.tsx` | `mapcn-react-native` (MapLibre) map primitives — native-only, real CARTO basemap |
| Map / MapMarker / MapRoute (stub) | `ui/map.web.tsx` | Web platform stub for the above — see Patterns below |
| PhotoSubmittedHeroVideo | `ui/PhotoSubmittedHeroVideo.tsx` | Photo-submitted hero — animated checkmark GIF via `expo-image` |
| PlayOnceLottie | `ui/PlayOnceLottie.tsx` | Lottie hero wrapper — `autoPlay`, optional `loop` (default `false`), optional `topInset` headroom for upward overflow, `resizeMode="contain"` for missed-checkpoint / web photo-submitted fallback |
| PhotoEnlargeModal | `ui/PhotoEnlargeModal.tsx` | Full-screen read-only photo viewer with caption, close control, and optional prev/next — used on Session Detail photo gallery |
| SessionRouteMapPreview | `features/session-tracking/components/SessionRouteMapPreview.tsx` | Read-only MapLibre route preview for Session Detail — uses completed-session `routeCoordinates`; Expo Go/web fallback shows GPS point count |
| BottomNavBar | `navigation/BottomNavBar.tsx` | 5-tab Home dashboard navbar (Figma `566:376`): Home · Shop · Track · Sessions · Profile. `activeTab` drives green highlight; press handlers are wired per screen. |
| NavHomeIcon / NavShopIcon / NavTrackIcon / NavSessionsIcon / NavProfileIcon | `navigation/icons/*.tsx` | Fill-based `react-native-svg` icons hand-ported from `frontend/assets/figma/home-screen/nav/*.svg` for `BottomNavBar` |
| PulsingDot | `motion/PulsingDot.tsx` | Live-status indicator dot — gentle ~2.4s opacity pulse; respects reduced motion |
| SessionSetupGuideFooterActions | `session-setup/SessionSetupGuideFooterActions.tsx` | Guide step 1 footer — same Continue / Skip styles as steps 2–5 (top border, Noto Sans SemiBold 16) |
| SessionSetupTopAppBar | `session-setup/SessionSetupTopAppBar.tsx` | Figma `260:1392` — white top bar, drop shadow, back chevron + screen-centered Sanchez title |
| SessionSetupBackChevronIcon | `session-setup/icons/SessionSetupBackChevronIcon.tsx` | Figma `260:1497` back chevron for TopAppBar |
| SessionSetupCelebration | `session-setup/SessionSetupCelebration.tsx` | Setup-guide finale graphic: centered smiley + four stars with staggered fade/rotate entrance (Reanimated, Emil motion rules) |
| SessionSetupToggle | `session-setup/SessionSetupToggle.tsx` | Branded `Switch` for session setup form |
| SessionSetupInfoIcon | `session-setup/icons/SessionSetupInfoIcon.tsx` | Figma `IoIosInformationCircle` asset (260:1312); not shown on session setup form permissions header |
| SessionSetupDateField | `session-setup/SessionSetupDateField.tsx` | Guided typed session date prefilled to today (`Jun 16, 2026`); editable on tap; auto-formats month/day/year; no future dates; supports `hasError` border + imperative `validate()` |
| SessionSetupValidationToast | `session-setup/SessionSetupValidationToast.tsx` | Top alert toast listing missing required fields on session setup form submit (bulleted list, one field per line) |
| AnimatedPressable | `motion/AnimatedPressable.tsx` | Reanimated spring press on the Pressable itself (`scale 0.97`) so `width: '100%'` / `alignSelf: 'stretch'` resolve correctly (fixes shop Continue CTAs) |
| CoachmarkEnter | `motion/CoachmarkEnter.tsx` | Wrapper for session-setup guide steps — fade + scale (`0.95→1`, 200ms) per `design.md` §10.2 `coachmark` |
| OnboardingProgressPills | `onboarding/OnboardingProgressPills.tsx` | 5-step progress indicator for create-account / account-details / notification-preference; uses `figma-screens/tokens` |
| OnboardingIcons | `onboarding/OnboardingIcons.tsx` | Welcome logo/burst/underline + social + notification + success check (`AccountCreatedCheck` from `success-check.svg`) + creating-account question badge glyphs (`react-native-svg`); colors from tokens |
| tourAssets | `onboarding/tourAssets.ts` | Tour graphic modules + `prefetchTourGraphics` (webp shop/track; memory-disk via expo-image) |
| TourNavButtons | `onboarding/TourNavButtons.tsx` | Shared Continue / Previous pair for tour screens (`light` mint bg / `dark` green bg); cream `textOnPrimarySoft` on primary Continue; same CTA size as form onboarding (`paddingVertical: 20`) |
| TourIcons | `onboarding/TourIcons.tsx` | Tour star accents, search, and replay glyphs (`react-native-svg`); `TourSetStar` is the speckled lime star from `assets/figma/tour/star-set.svg` (Figma `112:7219`); colors from tokens |
| AppSplashScreen | `AppSplashScreen.tsx` | Solid `color/primary` splash; single logo + title fill bottom-up via a shrinking green cover (no stacked duplicates; instant full fill under reduced motion); fades out then hands off to welcome or home |
| Motion hooks | `motion/hooks.ts` | `useFadeUpEnter`, `useModalCardEnter`, `useAttentionShake`, `useCoachmarkEnter` — Emil Kowalski screen-enter patterns with `useReducedMotion()` skip |
| Motion tokens | `motion/index.ts` | Shared easing, durations, springs, `enterFrom`, `staggerDelay` per `design.md` §10 |
| TrackerActionButton | `features/session-tracking/components/TrackerActionButton.tsx` | Live-session primary/secondary CTAs — uses `AnimatedPressable` spring press |

### Figma-screens feature (`frontend/src/features/figma-screens/`)

| Component | File | Role |
|-----------|------|------|
| ServiceHoursWeekPicker | `components/ServiceHoursWeekPicker.tsx` | Service Hours week nav; calendar modal with month/year header + iOS-style month/year wheel on tap |
| DateWheelPicker | `components/DateWheelPicker.tsx` | Snap wheel for month/year (home) or month/day/year when `includeDay` (export) |
| WheelPickerColumn | `components/WheelPickerColumn.tsx` | Reusable snap-scroll column used by `DateWheelPicker` |
| EventsViewAllModal | `components/EventsViewAllModal.tsx` | Bottom sheet listing `allEvents`; opened from Recent Events **View All**; slides up on open and **swipes down** on **X**, backdrop tap, or back; scrollable event list with month, weekday, and year on each calendar badge; optional `onSelectEvent` → `/event-detail` |
| EventIcons | `components/EventIcons.tsx` | Event detail icons via `expo-image` + `require('@/assets/figma/event-detail/*')` |
| EventRegistrationSuccessModal | `components/EventRegistrationSuccessModal.tsx` | Registration confirmation overlay (Figma `787:406`); **Go Home** CTA |
| RegisterButton | `components/RegisterButton.tsx` | Figma `RegisterButton` (`196:272`) — primary 50px CTA, radius 12, Noto Sans 16 |
| EventDetailScreen | `screens/EventDetailScreen.tsx` | Event detail (Figma `196:226`); copy → Maps link + `LinkCopiedToast`; map tap → Apple/Google Maps; Register opens success modal; route `/event-detail` |
| weekCalendar utils | `utils/weekCalendar.ts` | Monday-based week math, ISO week labels, month grid builder |
| getTimeOfDayGreeting | `utils/getTimeOfDayGreeting.ts` | Local-time greeting: night (midnight–4:59 AM), morning (5 AM–noon), afternoon (noon–4:59 PM), evening (5 PM–11:59 PM) |
| HomeScreen | `screens/HomeScreen.tsx` | Home dashboard (`home_dashboard___final_branding`, Figma `406:291`); `HomeScreenWithData` accepts `HomeDashboardData`; greeting uses `getTimeOfDayGreeting`; default export uses first-time-user mock; recent events navigate to `/event-detail` |
| RecentSessionCard | `components/RecentSessionCard.tsx` | Recent Sessions list row (Figma `406:409`): activity title, date/time chips, duration |
| HomeScreenReturningUser | `screens/HomeScreenReturningUser.tsx` | Populated returning-user snapshot (preserved copy); preview via figma-screens `PreviewApp` |
| AccountIcons | `components/AccountIcons.tsx` | Account tab icons via `expo-image` + relative `require(.../assets/figma/account/*.svg)` |
| AccountScreen | `screens/AccountScreen.tsx` | Account tab (Figma `569:896`); profile hero, Records/Shop/Preferences/Permissions; Profile nav active |
| DeleteAccountScreen | `screens/DeleteAccountScreen.tsx` | Delete confirm (Figma `725:361`); type DELETE; toast + shake on invalid confirm |
| RequestDataScreen | `screens/RequestDataScreen.tsx` | Request your data (Figma `728:1385`); Access / Delete / Download radios + Submit → sent confirm |
| RequestDataSentScreen | `screens/RequestDataSentScreen.tsx` | Data request sent (Figma `728:1648`); centered success card; Continue → Account |
| OrderHistoryScreen | `screens/OrderHistoryScreen.tsx` | Order History (Figma `854:116`); Delivered cards + email receipt chips |
| order history mock | `mocks/orderHistory.ts` | Mock order rows for `OrderHistoryScreen` |
| DonationHistoryScreen | `screens/DonationHistoryScreen.tsx` | Donation History (Figma `854:205`); date + amount + email confirmation chips |
| donation history mock | `mocks/donationHistory.ts` | Mock donation rows for `DonationHistoryScreen` |
| ApprovalHistoryScreen | `screens/ApprovalHistoryScreen.tsx` | Approval History (Figma `854:294`); summary stats + status session cards |
| approval history mock | `mocks/approvalHistory.ts` | Mock stats + session rows for `ApprovalHistoryScreen` |
| ExportServiceRecordScreen | `screens/ExportServiceRecordScreen.tsx` | Export Service Record (Figma `854:383`); editable timeframe (type or calendar), status toggles, PDF/CSV, Export CTA → success |
| ExportDateField | `components/ExportDateField.tsx` | Timeframe date field — typed input + home-style calendar modal (month/day/year wheel on header tap) |
| ExportRecordSuccessScreen | `screens/ExportRecordSuccessScreen.tsx` | Export success (Figma `840:561`); Continue → Account; View PDF/CSV placeholder |
| NotificationsScreen | `screens/NotificationsScreen.tsx` | Notification preferences (Figma `649:774`); category cards with toggles; opened from home bell |
| SessionsScreen | `screens/SessionsScreen.tsx` | Sessions list (Figma `515:1791`); search + filter chips + sort dropdown (Most Recent / Oldest First / A–Z / Z–A); row opens `/session-detail` |
| SessionDetailScreen | `screens/SessionDetailScreen.tsx` | Session detail (Figma `515:1848`); `SessionRouteMapPreview` walking path (placeholder when empty); Photo Evidence card (`555:2380`) with mock thumbs; tap opens `PhotoEnlargeModal` |
| SessionDetailIcons | `components/SessionDetailIcons.tsx` | Back/share/hours/miles/photos via `expo-image` + `require('@/assets/figma/session-detail/*.svg')` |
| SessionsIcons | `components/SessionsIcons.tsx` | Sessions list icons via `expo-image` + `require('@/assets/figma/sessions-list/*.svg')` |
| ShopIcons | `components/ShopIcons.tsx` + `ShopAssetIcons.generated.tsx` | Shop/cart/checkout glyphs via `react-native-svg` (home cart/donate/streak + generated cart/checkout set) |
| CartBadge | `components/CartBadge.tsx` | Centered green cart-count pill; shared by Shop/Product Detail/Cart/Checkout top bars |
| EmptyCartToast | `components/EmptyCartToast.tsx` | Toast + `useCartIconPress` — empty cart icon tap alerts instead of navigating |
| LinkCopiedToast | `components/LinkCopiedToast.tsx` | Toast confirming a location Maps link was copied (event detail) |
| EventLocationMap | `components/EventLocationMap.tsx` | Event location map (MapLibre pin in dev client; Maps CTA in Expo Go/web); tap opens Apple/Google Maps |
| cartStore | `cartStore.ts` | In-memory cart (starts empty); items + donation; `addCartItem` / qty / remove / `clearCart`; `useCartItemCount` |
| DonateIcons | `components/DonateIcons.generated.tsx` | Donate screen SVGs (heart bg, title icon, recycle, crown, stripe) |
| PurchaseConfirmationIcons | `components/PurchaseConfirmationIcons.generated.tsx` | Receipt bg, hearts, donation icon |
| ShopScreen | `screens/ShopScreen.tsx` | Shop home (Figma `498:606`); donate card ($5/$10/$15/Custom → `/donate`); featured kit, category filters, product grid; Add to cart → `cartStore`; empty-cart toast; cart → `/cart`; route `/shop` |
| DonateScreen | `screens/DonateScreen.tsx` | Contribute (Figma `412:4` / PRD §6.20); presets + custom; Continue → donation confirmation; route `/donate?amount=` |
| ProductDetailScreen | `screens/ProductDetailScreen.tsx` | Product detail (Figma `492:114` + SKUs); carousel, kit includes, tote color swatches, qty + Add to cart → `cartStore`; empty-cart toast; cart → `/cart`; route `/product-detail?id=` |
| CartScreen | `screens/CartScreen.tsx` | Cart (Figma `657:1585` / PRD §6.22); line items + donation from `cartStore` (default $5), Continue → `/checkout`; route `/cart` |
| CheckoutScreen | `screens/CheckoutScreen.tsx` | Checkout (Figma `657:1809` / PRD §6.23); order summary from `cartStore`, shipping + payment forms; Place Order validates with red field highlights + `SessionSetupValidationToast`; route `/checkout` |
| PurchaseConfirmationScreen | `screens/PurchaseConfirmationScreen.tsx` | Thank-you receipt (Figma `494:262`); order mode or donation mode (`?mode=donation`); hearts enter animation; route `/purchase-confirmation` |
| cart mocks | `mocks/cart.ts` | Line item types, donation presets, tax/shipping helpers for cart flow |
| checkout mocks | `mocks/checkout.ts` | `getCheckoutSummary(items, donation)` from live cart for `CheckoutScreen` |
| purchase confirmation mocks | `mocks/purchaseConfirmation.ts` | Receipt copy + assets for `PurchaseConfirmationScreen` |
| donate mocks | `mocks/donate.ts` | Preset amounts, impact copy, asset requires for `DonateScreen` |
| sessions mocks | `mocks/sessions.ts` | Mock session rows + filter/sort helpers for `SessionsScreen` |
| session detail mock | `mocks/sessionDetail.ts` | `getSessionDetail(id)`; 4 stub `evidencePhotos` + empty `routeCoordinates` until live tracker wires in |
| account mock | `mocks/account.ts` | Default Jane Doe profile + hour stats for AccountScreen |

### Session tracking (live session UI)

| Component | Path | Role |
|-----------|------|------|
| LiveSessionMinimizedPill | `features/session-tracking/components/LiveSessionMinimizedPill.tsx` | Green minimized tracker pill (Figma `622:176`); checkpoint progress fill animates via `useAnimatedProgressFill` |
| useLiveSessionBarExit | `features/session-tracking/hooks/useLiveSessionBarExit.ts` | Pill slides down on expand; resets slide-up on Home refocus (`useFocusEffect`) |
| useLiveSessionMapReveal | `features/session-tracking/hooks/useLiveSessionMapReveal.ts` | Bottom-up map wipe (`mapRevealWipe` 480ms) + chrome fade when expanding from Home |
| useAnimatedProgressFill | `components/motion/hooks.ts` | Progress track fill animation (300ms enter, 220ms live updates) |

## Patterns

- Use Figma design tokens from `frontend/src/constants/tokens.ts` (or feature re-exports). `theme.ts` chrome colors/fonts/spacing are wired to those tokens.
- Prefer `ThemedView` + `ThemedText` over raw `View`/`Text` for light/dark support
- **Native-only modules need a `.web.tsx` stub, not a runtime `Platform.OS` check.** `@maplibre/maplibre-react-native`'s components call `codegenNativeComponent`, which `react-native-web` doesn't implement — the crash happens at *module-evaluation* time (when the file is `import`ed), before any `Platform.OS` branch in the importing code ever runs. Metro's platform-extension resolution (`.web.tsx` beats `.tsx` on web) is the only way to keep the native module out of the web bundle entirely. `ui/map.web.tsx` follows the existing `animated-icon.web.tsx` precedent: same exported API surface, inert implementation. Consumers (e.g. `features/session-tracking/components/LiveSessionMap.tsx`) still do their own `Platform.OS === 'web'` check so they can render a styled fallback instead of nothing.

## Policies

- Follow [brand.md](../brand.md) for colors and fonts
- New shared UI goes here; screen-specific UI stays in route files or `frontend/prototype/screens/`
