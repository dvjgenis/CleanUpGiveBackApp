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
| AnimatedPressable | `motion/AnimatedPressable.tsx` | Reanimated spring press feedback (`scale 0.97`) for all Expo Go flow touch targets |
| CoachmarkEnter | `motion/CoachmarkEnter.tsx` | Wrapper for session-setup guide steps — fade + scale (`0.95→1`, 200ms) per `design.md` §10.2 `coachmark` |
| Motion hooks | `motion/hooks.ts` | `useFadeUpEnter`, `useModalCardEnter`, `useAttentionShake`, `useCoachmarkEnter` — Emil Kowalski screen-enter patterns with `useReducedMotion()` skip |
| Motion tokens | `motion/index.ts` | Shared easing, durations, springs, `enterFrom`, `staggerDelay` per `design.md` §10 |
| TrackerActionButton | `features/session-tracking/components/TrackerActionButton.tsx` | Live-session primary/secondary CTAs — uses `AnimatedPressable` spring press |

### Figma-screens feature (`frontend/src/features/figma-screens/`)

| Component | File | Role |
|-----------|------|------|
| ServiceHoursWeekPicker | `components/ServiceHoursWeekPicker.tsx` | Service Hours week nav; calendar modal with July YYYY header + iOS-style month/day/year wheel on tap |
| DateWheelPicker | `components/DateWheelPicker.tsx` | Three-column snap wheel for month, day, and year |
| WheelPickerColumn | `components/WheelPickerColumn.tsx` | Reusable snap-scroll column used by `DateWheelPicker` |
| EventsViewAllModal | `components/EventsViewAllModal.tsx` | Bottom sheet listing `allEvents`; opened from Recent Events **View All**; slides up on open and **swipes down** on **X**, backdrop tap, or back; scrollable event list with month, weekday, and year on each calendar badge |
| weekCalendar utils | `utils/weekCalendar.ts` | Monday-based week math, ISO week labels, month grid builder |
| getTimeOfDayGreeting | `utils/getTimeOfDayGreeting.ts` | Local-time greeting: night (midnight–4:59 AM), morning (5 AM–noon), afternoon (noon–4:59 PM), evening (5 PM–11:59 PM) |
| HomeScreen | `screens/HomeScreen.tsx` | Home dashboard (`home_dashboard___final_branding`, Figma `406:291`); `HomeScreenWithData` accepts `HomeDashboardData`; greeting uses `getTimeOfDayGreeting`; default export uses first-time-user mock |
| RecentSessionCard | `components/RecentSessionCard.tsx` | Recent Sessions list row (Figma `406:409`): activity title, date/time chips, duration |
| HomeScreenReturningUser | `screens/HomeScreenReturningUser.tsx` | Populated returning-user snapshot (preserved copy); preview via figma-screens `PreviewApp` |
| NotificationsScreen | `screens/NotificationsScreen.tsx` | Notification preferences (Figma `649:774`); category cards with toggles; opened from home bell |
| home mocks | `mocks/home.ts`, `mocks/home.returningUser.ts`, `mocks/home.types.ts` | `firstTimeHomeDashboard` vs `returningUserHomeDashboard` variants |

### Session tracking (live session UI)

| Component | Path | Role |
|-----------|------|------|
| LiveSessionMinimizedPill | `features/session-tracking/components/LiveSessionMinimizedPill.tsx` | Green minimized tracker pill (Figma `622:176`); checkpoint progress fill animates via `useAnimatedProgressFill` |
| useLiveSessionBarExit | `features/session-tracking/hooks/useLiveSessionBarExit.ts` | Pill slides down on expand; resets slide-up on Home refocus (`useFocusEffect`) |
| useLiveSessionMapReveal | `features/session-tracking/hooks/useLiveSessionMapReveal.ts` | Bottom-up map wipe (`mapRevealWipe` 480ms) + chrome fade when expanding from Home |
| useAnimatedProgressFill | `components/motion/hooks.ts` | Progress track fill animation (300ms enter, 220ms live updates) |

## Patterns

- Use `useColorScheme` / theme constants from `frontend/src/constants/theme.ts`
- Prefer `ThemedView` + `ThemedText` over raw `View`/`Text` for light/dark support
- **Native-only modules need a `.web.tsx` stub, not a runtime `Platform.OS` check.** `@maplibre/maplibre-react-native`'s components call `codegenNativeComponent`, which `react-native-web` doesn't implement — the crash happens at *module-evaluation* time (when the file is `import`ed), before any `Platform.OS` branch in the importing code ever runs. Metro's platform-extension resolution (`.web.tsx` beats `.tsx` on web) is the only way to keep the native module out of the web bundle entirely. `ui/map.web.tsx` follows the existing `animated-icon.web.tsx` precedent: same exported API surface, inert implementation. Consumers (e.g. `features/session-tracking/components/LiveSessionMap.tsx`) still do their own `Platform.OS === 'web'` check so they can render a styled fallback instead of nothing.

## Policies

- Follow [brand.md](../brand.md) for colors and fonts
- New shared UI goes here; screen-specific UI stays in route files or `frontend/prototype/screens/`
