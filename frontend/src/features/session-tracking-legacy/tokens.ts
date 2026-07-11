import type { TextStyle } from 'react-native';

/**
 * Session Tracking feature design tokens.
 *
 * Sourced from the Figma Design System (docs/frontend/brand.md, design.md) —
 * see [docs/frontend/brand.md](../../../../docs/frontend/brand.md) for the
 * canonical primitive/semantic color tables and 14 text styles.
 *
 * Scoped to this feature folder rather than `src/constants/theme.ts` because
 * that file still holds generic Expo-template values (see the
 * figma-to-native-handoff spec) — migrating the whole app's theme constants
 * is a separate, larger pass.
 */

// ─── Primitives ─────────────────────────────────────────────────────────────

export const primitives = {
  green500: '#009540',
  green50: '#f7fff1',
  gray900: '#1c1b1b',
  gray700: '#3e4a3d',
  gray500: '#6e7a6c',
  gray300: '#bdcaba',
  gray200: '#e5e2e1',
  white: '#ffffff',
  cream50: '#fcf9f8',
  lime500: '#c2d832',
  amber100: '#ffddb5',
  amber700: '#835400',
  amber500: '#fcab29',
  red50: '#ffd9de',
  red600: '#ba1a1a',
} as const;

// ─── Semantic colors ────────────────────────────────────────────────────────

export const colors = {
  primary: primitives.green500,
  bgApp: primitives.cream50,
  bgSurface: '#f6f3f2',
  textPrimary: primitives.gray900,
  textTertiary: primitives.gray700,
  textOnPrimary: primitives.white,
  borderOutline: primitives.gray300,
  borderChipSelected: primitives.gray200,
  accentLime: primitives.lime500,
  status: {
    approved: {
      bg: primitives.green50,
      text: primitives.green500,
      border: primitives.green500,
    },
    pending: {
      bg: primitives.amber100,
      text: primitives.amber700,
      border: primitives.amber500,
    },
    declined: {
      bg: primitives.red50,
      text: primitives.red600,
      border: primitives.red600,
    },
  },
} as const;

// ─── Spacing ────────────────────────────────────────────────────────────────

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
  '4xl': 64,
} as const;

/** Default horizontal screen margin per PRD §11.5 (20px min, 24px preferred). */
export const screenPaddingHorizontal = spacing.lg;

// ─── Radius ─────────────────────────────────────────────────────────────────

export const radius = {
  sm: 8,
  md: 16,
  search: 22,
  full: 9999,
} as const;

// ─── Elevation (structural chrome only — see brand.md §Elevation) ─────────

export const shadows = {
  navBottom: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 2,
  },
  barTop: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
} as const;

// ─── Typography ─────────────────────────────────────────────────────────────
// Font families as exported by @expo-google-fonts/* — load these exact names
// via useFonts before rendering any screen in this feature (see dev/PreviewApp.tsx).

export const fontFamilies = {
  sanchezRegular: 'Sanchez_400Regular',
  notoSansRegular: 'NotoSans_400Regular',
  notoSansMedium: 'NotoSans_500Medium',
  notoSansSemiBold: 'NotoSans_600SemiBold',
  notoSansBold: 'NotoSans_700Bold',
  ibmPlexSansRegular: 'IBMPlexSans_400Regular',
  ibmPlexSansMedium: 'IBMPlexSans_500Medium',
  ibmPlexSansSemiBold: 'IBMPlexSans_600SemiBold',
} as const;

type TextStyleToken = Pick<TextStyle, 'fontFamily' | 'fontSize' | 'lineHeight' | 'letterSpacing'>;

/** The 14 canonical text styles (design.md §5.4). Only the ones this feature uses are exercised, but all are defined for parity with the DS page. */
export const textStyles = {
  displayHero: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 40,
    lineHeight: 48,
  },
  headlinePage: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 28,
    lineHeight: 36,
  },
  headlineDetail: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 20,
    lineHeight: 28,
  },
  bodyDefault: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyLarge: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 18,
    lineHeight: 26,
  },
  bodySmall: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    lineHeight: 20,
  },
  bodyEmphasis: {
    fontFamily: fontFamilies.notoSansMedium,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyStrong: {
    fontFamily: fontFamilies.notoSansBold,
    fontSize: 16,
    lineHeight: 24,
  },
  labelOverline: {
    fontFamily: fontFamilies.ibmPlexSansMedium,
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.08 * 12,
  },
  labelStatus: {
    fontFamily: fontFamilies.ibmPlexSansMedium,
    fontSize: 12,
    lineHeight: 16,
  },
  labelButton: {
    fontFamily: fontFamilies.ibmPlexSansSemiBold,
    fontSize: 16,
    lineHeight: 20,
  },
  navTab: {
    fontFamily: fontFamilies.ibmPlexSansSemiBold,
    fontSize: 12,
    lineHeight: 18,
  },
  dataStat: {
    fontFamily: fontFamilies.ibmPlexSansSemiBold,
    fontSize: 28,
    lineHeight: 36,
  },
  dataTimer: {
    fontFamily: fontFamilies.ibmPlexSansMedium,
    fontSize: 40,
    lineHeight: 48,
  },
  // Used by MinimizedTrackerBar's distance/time value pair (Noto Sans SemiBold,
  // per the 622:176 spec) — an outlier not in the canonical 14, kept local.
  minimizedStatValue: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 24,
    lineHeight: 28,
  } as TextStyleToken,
} satisfies Record<string, TextStyleToken>;

export type TextStyleName = keyof typeof textStyles;
