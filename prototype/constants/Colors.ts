// PROTOTYPE — NOT FINAL. All tokens subject to change.
//
// Primary + Black: user-specified.
// Accent + surfaces + status: extracted from Stitch design HTML (MD3/Material You palette).

export const Colors = {
  // ─── Brand (user-specified, non-negotiable) ───────────────────────────────
  primary: '#009540',
  black: '#161616',
  white: '#FFFFFF',

  // ─── CTA Accent (from Stitch) ────────────────────────────────────────────
  accent: '#fcab29',           // Amber — secondary CTA, under-review, warnings
  accentDark: '#835400',       // Dark amber — text on accent containers
  accentContainer: '#ffddb5',  // Light amber — under-review background chip

  // ─── Primary green shades (from Stitch palette) ──────────────────────────
  primaryDark: '#006e2d',      // Pressed/hover state
  primaryDeep: '#005320',      // Headers, deep surfaces
  primaryLight: '#66de7f',     // Active indicators, success tints
  primaryContainer: '#f7fff2', // Very light green — approved chip background

  // ─── Surfaces (from Stitch) ──────────────────────────────────────────────
  background: '#fcf9f8',       // App background (warm near-white)
  surface: '#f6f3f2',          // Card / input fill
  surfaceVariant: '#e8ebe9',   // Subtle dividers, hover states
  surfaceDeep: '#e5e2e1',      // Borders, separators

  // ─── Text ────────────────────────────────────────────────────────────────
  textPrimary: '#161616',      // = black (user specified)
  textSecondary: '#6e7a6c',    // Muted green-gray from Stitch
  textOnPrimary: '#FFFFFF',    // White on green buttons
  textOnAccent: '#2a1800',     // Dark on amber backgrounds
  textOnDark: '#FFFFFF',       // White on dark surfaces
  textDisabled: '#bdcaba',     // Inactive / disabled labels

  // ─── Status (approval workflow) ──────────────────────────────────────────
  approved: '#009540',         // = primary
  approvedContainer: '#f7fff2',
  underReview: '#fcab29',      // = accent
  underReviewContainer: '#ffddb5',
  notApproved: '#ba1a1a',      // Error red (from Stitch)
  notApprovedContainer: '#ffd9de',

  // ─── Semantic ────────────────────────────────────────────────────────────
  error: '#ba1a1a',
  errorContainer: '#ffd9de',
  border: '#e5e2e1',
  borderFocus: '#009540',      // = primary
  overlay: 'rgba(0,0,0,0.45)', // Coachmark dimming overlay

  // ─── Google auth button brand colors ─────────────────────────────────────
  googleBlue: '#4285F4',
} as const;

export type ColorKey = keyof typeof Colors;
