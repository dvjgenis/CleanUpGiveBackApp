import type { TextStyle } from 'react-native';

// ─── Design tokens — Figma design system variables (file DrDcQH14n7ntDQ80F7au9S) ──

export const colors = {
  bgApp: '#fcf9f8',                // --color-bg-app
  primary: '#009540',              // --color-primary
  textPrimary: '#1c1b1b',          // --color-text-primary
  textNavInactive: '#3e4a3d',      // --color-text-nav-inactive
  textOnPrimary: '#ffffff',        // --color-text-on-primary
  borderOutline: '#bdcaba',        // --color-border-outline
  accentLime: '#c2d832',           // --color-accent-lime
  statusPendingBorder: '#fcab29',  // --color-status-pending-border
  chipBg: '#f0edec',               // Figma streak/week badge fill
  white: '#ffffff',                // --color-text-on-primary
  textTertiary: '#3e4a3d',      // From session-tracking tokens
} as const;

export const radius = {
  sm: 8,
  md: 16,
  search: 22,
  full: 9999,
} as const;

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

export const textStyles = {
  headlinePage: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 28,
    lineHeight: 36,
  },
  bodySmall: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    lineHeight: 20,
  },
  labelOverline: {
    fontFamily: fontFamilies.ibmPlexSansMedium,
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.08 * 12,
  },
} satisfies Record<string, TextStyleToken>;