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
| SessionRouteMapPreview | `features/session-tracking/components/SessionRouteMapPreview.tsx` | Read-only MapLibre route preview for Session Detail — uses completed-session `routeCoordinates`; Expo Go/web fallback shows GPS point count; `replayOnce` prop (Expo Go/WebView) plays a one-shot growing-polyline + tip-marker walking-path animation before settling into the static view, skipped when `useReducedMotion` is on; basemap layer comes from `mapLayer` (session-end layer via `SessionRouteMapPanel.initialMapLayer`) |
| MapTypesSheet | `features/session-tracking/components/MapTypesSheet.tsx` | Live-tracker Map Types bottom sheet (Standard / Satellite / Hybrid) — basemap wired to `liveSessionStore.mapLayer` via `setLiveSessionMapLayer`; brand-primary highlight on selected basemap |
| FreeTrialModal | `features/session-tracking/components/FreeTrialModal.tsx` | Paywall modal (Figma `1141:2178`) — shown full-screen from `LiveSessionScreen` when unpaid free-hour countdown hits zero (`elapsedSeconds >= FREE_TRIAL_DURATION_SECONDS`, default 3600; unless `trackerPaymentStore.hasPaid`); opaque `primary` full-screen backdrop, centered card, hourglass Lottie, $49.99 one-time pricing; Continue → `/checkout?mode=tracker&returnTo=live-session`; Pay Later → dismisses for this session mount. Live tracker also shows **Free hour left** `MM:SS` under the timer until expiry. Dev QA: `EXPO_PUBLIC_FREE_TRIAL_SECONDS` |
| HourglassIcon | `features/session-tracking/components/HourglassIcon.tsx` | 80×80 Lottie hourglass (`assets/animations/hourglass.json`) via `PlayOnceLottie`; plays once inside `FreeTrialModal` |
| WeatherConditionIcon | `features/session-tracking/components/icons/WeatherConditionIcon.tsx` | Live pill weather glyph from Open-Meteo WMO code — paths from Figma Weather Icons (react-icons/wi) |
| TrackerMapLightIcon / TrackerMapDarkIcon | `features/session-tracking/components/icons/TrackerMapThemeIcons.tsx` | Sun / moon map-tool glyphs; live tracker shows icon matching active theme (sun = light, moon = dark) |
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
| OnboardingProgressPills | `onboarding/OnboardingProgressPills.tsx` | Shared step indicator for onboarding + session-setup guide screens; active pills fill `primary`, remaining are outlined (`transparent` + `borderOutline`); uses `figma-screens/tokens` |
| OnboardingIcons | `onboarding/OnboardingIcons.tsx` | Welcome logo/burst/underline + social + notification + success check (`AccountCreatedCheck` from `success-check.svg`) + location/camera permission illustrations + creating-account question badge glyphs + `QuestionIcon` (circle question mark, used on under-age screen) (`react-native-svg`); colors from tokens |
| tourAssets | `onboarding/tourAssets.ts` | Tour graphic modules + `prefetchTourGraphics` (PNG shop-showcase, track-map, session-list; memory-disk via expo-image) |
| TourNavButtons | `onboarding/TourNavButtons.tsx` | Shared Continue / Previous pair for tour screens (`light` mint bg / `dark` green bg); cream `textOnPrimarySoft` on primary Continue; same CTA size as form onboarding (`paddingVertical: 20`) |
| OnboardingInfoFooterActions | `onboarding/OnboardingInfoFooterActions.tsx` | Shared Continue / Previous / (optional) Skip footer for onboarding info + permission + form screens — used by `FreeHourScreen`, `FreeKitScreen`, `LocationPermissionScreen`, `CameraPermissionScreen`, `NotificationPreferenceScreen` (all 3 buttons), and `AccountPhoneScreen`/`AccountDetailsScreen` (`hideSkip` — Continue/Previous only, no skippable action on these form steps); absolutely positioned to the screen bottom with an opaque `bgApp` fill + `borderOutline` top border (Figma `disclaimer` 1125:360 Footer); `continueLabel`/`skipLabel`/`disabled` props let permission screens show "Enable location/camera/notifications" + "Not now" while keeping identical spacing (`gap: 20` between all buttons) |
| TourIcons | `onboarding/TourIcons.tsx` | Tour star accents, search, and replay glyphs (`react-native-svg`); `TourSetStar` is the speckled lime star from `assets/figma/tour/star-set.svg` (Figma `112:7219`); colors from tokens |
| AppSplashScreen | `AppSplashScreen.tsx` | Solid `color/primary` splash; single logo + title fill bottom-up via a shrinking green cover (no stacked duplicates; instant full fill under reduced motion); fades out then hands off to welcome or home |
| Motion hooks | `motion/hooks.ts` | `useFadeUpEnter`, `useModalCardEnter`, `useAttentionShake`, `useCoachmarkEnter` — Emil Kowalski screen-enter patterns with `useReducedMotion()` skip |
| Motion tokens | `motion/index.ts` | Shared easing, durations, springs, `enterFrom`, `staggerDelay` per `design.md` §10 |
| TrackerActionButton | `features/session-tracking/components/TrackerActionButton.tsx` | Live-session primary/secondary CTAs — uses `AnimatedPressable` spring press |
| FeedbackThankYouScreen | `screens/FeedbackThankYouScreen.tsx` | Hand-designed (no Figma source) — sits between `FeedbackScreen`'s Submit and the next step; reuses the `FeedbackScreen` centered-card shell + a `CheckCircleIcon` spring pop-in; **Continue** → `/submission-confirmation` (session) or `/account` when `?returnTo=account`. Reached only via Submit; Skip bypasses it. |
| FeedbackScreen | `screens/FeedbackScreen.tsx` | Session-end + account feedback form (Figma `1126:1516`); optional `title` / `subtitle` / `source` — `/session-feedback` keeps default **"Rate your experience!"**; `/give-feedback` passes account copy |

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
| AccountDetailsScreen | `screens/AccountDetailsScreen.tsx` | Onboarding details step (Figma `112:6882`, step 3/5); birthday typed MM/YYYY + calendar-icon wheel picker (month/year only, `DateWheelPicker includeDay=false`); 2×2 radio service-type grid; age gate (<18 → `/under-age`); inline validation (touched/submitted pattern) for birthday + service type; Reanimated sheet modal for picker; colors from `figma-screens/tokens` |
| AccountScreen | `screens/AccountScreen.tsx` | Account tab (Figma `569:896`); profile hero, Records/Shop/Preferences/Permissions + bottom Give Feedback row (no section header) → `/give-feedback`; Camera/Location/Notifications toggles wired to OS permission request + Settings fallback; Profile nav active |
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
| SessionDetailScreen | `screens/SessionDetailScreen.tsx` | Session detail (Figma `515:1848`); `useSessionDetail` fetches from Fly API + signed Storage URLs; `SessionRouteMapPanel` walking path from cache or API; Photo Evidence card when checkpoints exist |
| SessionDetailIcons | `components/SessionDetailIcons.tsx` | Back/share/hours/miles/photos via `expo-image` + `require('@/assets/figma/session-detail/*.svg')` |
| SessionsIcons | `components/SessionsIcons.tsx` | Sessions list icons via `expo-image` + `require('@/assets/figma/sessions-list/*.svg')` |
| ShopIcons | `components/ShopIcons.tsx` + `ShopAssetIcons.generated.tsx` | Shop/cart/checkout glyphs via `react-native-svg` (home cart/donate/streak + generated cart/checkout set) |
| CartBadge | `components/CartBadge.tsx` | Centered green cart-count pill; shared by Shop/Product Detail/Cart/Checkout top bars |
| EmptyCartToast | `components/EmptyCartToast.tsx` | Toast + `useCartIconPress` — empty cart icon tap alerts instead of navigating |
| LinkCopiedToast | `components/LinkCopiedToast.tsx` | Toast confirming a location Maps link was copied (event detail) |
| EventLocationMap | `components/EventLocationMap.tsx` (+ `EventLocationMapNative` / `EventLocationMapWebView`) | Event location live map pin (WebView MapLibre in Expo Go; native MapLibre in dev-client; Maps CTA on web); tap opens Apple/Google Maps |
| cartStore | `cartStore.ts` | In-memory cart (starts empty); items + donation; `addCartItem` / qty / remove / `clearCart`; `useCartItemCount` |
| DonateIcons | `components/DonateIcons.generated.tsx` | Donate screen SVGs (heart bg, title icon, recycle, crown, stripe) |
| PurchaseConfirmationIcons | `components/PurchaseConfirmationIcons.generated.tsx` | Receipt bg, hearts, donation icon |
| ShopScreen | `screens/ShopScreen.tsx` | Shop home (Figma `498:606`); donate card ($5/$10/$15/Custom → `/donate`); featured kit, category filters, product grid; Add to cart → `cartStore`; empty-cart toast; cart → `/cart`; route `/shop` |
| DonateScreen | `screens/DonateScreen.tsx` | Contribute (Figma `412:4` / PRD §6.20); presets + custom; Continue → donation confirmation; route `/donate?amount=` |
| ProductDetailScreen | `screens/ProductDetailScreen.tsx` | Product detail (Figma `492:114` + SKUs); carousel, kit includes, tote color swatches, qty + Add to cart → `cartStore`; empty-cart toast; cart → `/cart`; route `/product-detail?id=` |
| CartScreen | `screens/CartScreen.tsx` | Cart (Figma `657:1585` / PRD §6.22); line items + donation from `cartStore` (default $5), Continue → `/checkout`; route `/cart` |
| CheckoutScreen | `screens/CheckoutScreen.tsx` | Checkout (Figma `657:1809` / PRD §6.23); order summary from `cartStore`, shipping + payment forms; Place Order validates with red field highlights + `SessionSetupValidationToast`; sticky footer extends white background to screen bottom while keyboard is open (iOS); route `/checkout` |
| PurchaseConfirmationScreen | `screens/PurchaseConfirmationScreen.tsx` | Thank-you receipt (Figma `494:262`); order mode or donation mode (`?mode=donation`); hearts enter animation; route `/purchase-confirmation` |
| cart mocks | `mocks/cart.ts` | Line item types, donation presets, tax/shipping helpers for cart flow |
| checkout mocks | `mocks/checkout.ts` | `getCheckoutSummary(items, donation)` from live cart for `CheckoutScreen` |
| purchase confirmation mocks | `mocks/purchaseConfirmation.ts` | Receipt copy + assets for `PurchaseConfirmationScreen` |
| donate mocks | `mocks/donate.ts` | Preset amounts, impact copy, asset requires for `DonateScreen` |
| sessions mocks | `mocks/sessions.ts` | Empty production list + filter/sort helpers; preview rows in `mocks/sessions.preview.ts` |
| session detail | `mocks/sessionDetail.ts` | `SessionDetailData` types + cache resolver; API fetch via `useSessionDetail` hook |
| account mock | `mocks/account.ts` | Default Jane Doe profile + hour stats for AccountScreen |

### Session tracking (live session UI)

| Component | Path | Role |
|-----------|------|------|
| LiveSessionMinimizedPill | `features/session-tracking/components/LiveSessionMinimizedPill.tsx` | Green minimized tracker pill (Figma `622:176`); checkpoint progress fill animates via `useAnimatedProgressFill` |
| useLiveSessionBarExit | `features/session-tracking/hooks/useLiveSessionBarExit.ts` | Pill slides down on expand; resets slide-up on Home refocus (`useFocusEffect`) |
| useLiveSessionMapReveal | `features/session-tracking/hooks/useLiveSessionMapReveal.ts` | Bottom-up map wipe (`mapRevealWipe` 480ms) + chrome fade when expanding from Home |
| useAnimatedProgressFill | `components/motion/hooks.ts` | Progress track fill animation (300ms enter, 220ms live updates) |

## Patterns

- **`FeedbackScreen`'s chat-bubble typing dots grow left-to-right** (small → medium → big) toward the bubble's tail. Figma `1126:1554` specced the mirror (big → medium → small, shrinking toward the tail) and an earlier session matched that spec, but explicit user feedback reversed it back to small → medium → big — treat this as the current intentional direction, not a regression, if revisiting. Fade-in stagger must also fade one dot in *before* the next starts (`BUBBLE_STAGGER_MS` > `BUBBLE_TIMING.duration`) — equal/overlapping timings read as "all at once" even though each dot animates independently.
- Use Figma design tokens from `frontend/src/constants/tokens.ts` (or feature re-exports). `theme.ts` chrome colors/fonts/spacing are wired to those tokens.
- Prefer `ThemedView` + `ThemedText` over raw `View`/`Text` for light/dark support
- **Native-only modules need a `.web.tsx` stub, not a runtime `Platform.OS` check.** `@maplibre/maplibre-react-native`'s components call `codegenNativeComponent`, which `react-native-web` doesn't implement — the crash happens at *module-evaluation* time (when the file is `import`ed), before any `Platform.OS` branch in the importing code ever runs. Metro's platform-extension resolution (`.web.tsx` beats `.tsx` on web) is the only way to keep the native module out of the web bundle entirely. `ui/map.web.tsx` follows the existing `animated-icon.web.tsx` precedent: same exported API surface, inert implementation. Consumers (e.g. `features/session-tracking/components/LiveSessionMap.tsx`) still do their own `Platform.OS === 'web'` check so they can render a styled fallback instead of nothing.
- **Never write `el.style.transform` on a MapLibre GL JS marker's root element** (the element passed to `new maplibregl.Marker({ element })` in `webViewMapHelpers.ts`). MapLibre owns that CSS property to translate the marker to its screen position on every `setLngLat`/pan/zoom, and will silently overwrite anything else written there — so setting a rotation directly on the root element causes it to snap to the container's top-left corner after the next map update (visible as the marker appearing, then jumping, on load or `setMapStyle`). Rotate an inner wrapper `<div>` instead (see `createArrowMarkerElement`/`updateArrowMarkerElement`), leaving MapLibre's root-element transform untouched.
- **Both `LiveSessionMapWebView.tsx` and `SessionRouteMapPreviewWebView.tsx` observe their `#map` container with a `ResizeObserver` and call `map.resize()` on change** (plus on `orientationchange`). MapLibre GL caches its canvas pixel size at construction time and never recomputes it on its own; the RN `WebView`'s container settles to its final layout size a beat after the HTML first runs, and physically rotating/moving the phone can resize it again. Without a `resize()` call, `map.project()` keeps using the stale size, so every marker (start, current-position, end/tip) visually drifts away from its true screen position. Any new WebView MapLibre instance in this feature needs the same observer wiring.
- **Don't gate a post-`setStyle` marker resync on `map.isStyleLoaded()`.** `LiveSessionMapWebView.tsx`'s `window.setMapStyle` (used by the live map-theme sun/moon toggle and layer switches) removes the start/current markers, calls `map.setStyle(...)`, and re-adds them once `map.once('style.load', ...)` fires. `'style.load'` only means the new style document (fetched from Carto's remote Voyager URL, or applied inline from the locally-patched Dark Matter JSON in `mapStyles.ts`) has been parsed and applied — `isStyleLoaded()` can still read `false` for a beat afterward while sources/tiles catch up. `applyRouteOverlay`'s regular `isStyleLoaded()` guard, if left in place for that resync call, silently skips `syncMarkers()` and leaves the just-removed markers permanently gone until the next GPS fix pushes a route update. Fixed by adding a `forceApply` param so the post-style-swap resync bypasses the guard (the `'style.load'` event already proves it's safe); the regular GPS-driven `window.updateRoute` path keeps the guard.

## Policies

- Follow [brand.md](../brand.md) for colors and fonts
- **The tracker's dark map style (`cartoDarkMatterStyle.json` + `buildCartoDarkMatterStyle()` in `mapStyles.ts`) is a local snapshot of Carto Dark Matter, not a live URL.** Upstream Dark Matter paints `landcover` (wood/grass/recreation_ground), `park_national_park`, and `park_nature_reserve` the same near-black (`#0e0e0e`) as the background, making parks/nature reserves/green landcover invisible; MapLibre's React Native wrapper has no `setPaintProperty`-style hook to patch this post-load, so the fix vendors the style's `layers` array locally (sources/sprite/glyphs still point at Carto's CDN) and repaints those layers a legible dark green (`#1f3d2a` fill / `#7fae8f` `poi_park` label text) at module load. If Carto changes upstream Dark Matter, re-fetch `https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json` and refresh the local copy — the greenspace layer IDs may need re-checking.
- **Carto's vector `park` source-layer (both Dark Matter and Voyager) only ships a `fill` layer for `class == national_park` and `class == nature_reserve`.** Named local parks (e.g. Devonshire Park) come through as `class == "park"` and get no polygon fill at all in the stock style — only a `poi_park` point label — so they read as basically absent on the map, independent of theme. `buildCartoDarkMatterStyle()` inserts a synthetic `park_local` fill layer (same `park_nature_reserve`-adjacent position in the layer stack, filtered to exclude `national_park`/`nature_reserve` so it doesn't double-paint) to cover this gap for dark mode. Voyager (light) was left as-is since only dark mode was reported as hard to read — if that gap needs fixing too, mirror `park_local` into a light-mode style override rather than assuming Carto will ever ship it upstream.
- New shared UI goes here; screen-specific UI stays in route files or `frontend/prototype/screens/`
