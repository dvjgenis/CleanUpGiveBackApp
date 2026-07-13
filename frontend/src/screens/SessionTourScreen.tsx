import { IBMPlexSans_600SemiBold } from '@expo-google-fonts/ibm-plex-sans';
import { NotoSans_400Regular, NotoSans_600SemiBold } from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TourNavButtons } from '@/components/onboarding/TourNavButtons';
import { TourSearchIcon, TourSessionStar } from '@/components/onboarding/TourIcons';
import { colors as C } from '@/features/figma-screens/tokens';

type SessionStatus = 'approved' | 'pending' | 'declined';

type TourSessionRow = {
  title: string;
  status: SessionStatus;
  /** Alternating tilt: odd rows −2°, even rows +2° (Figma `137:518`). */
  rotateDeg: -2 | 2;
  /** Lime star on left edge of approved rows only (Figma `137:1002` / `1004` / `1006`). */
  showStar?: boolean;
};

const TOUR_SESSIONS: TourSessionRow[] = [
  { title: 'Lake Park', status: 'approved', rotateDeg: -2, showStar: true },
  { title: 'River Trail', status: 'pending', rotateDeg: 2 },
  { title: 'Fulton Park', status: 'approved', rotateDeg: -2, showStar: true },
  { title: 'Downtown Des Plaines', status: 'declined', rotateDeg: 2 },
  { title: 'Oakbrook Terrace', status: 'approved', rotateDeg: -2, showStar: true },
];

const STATUS_LABEL: Record<SessionStatus, string> = {
  approved: 'Approved',
  pending: 'Pending',
  declined: 'Declined',
};

function statusBadgeStyles(status: SessionStatus) {
  switch (status) {
    case 'approved':
      return { backgroundColor: C.primary, color: C.textOnPrimary };
    case 'pending':
      return { backgroundColor: C.statusPendingBg, color: C.statusPendingText };
    case 'declined':
      return { backgroundColor: C.statusDeclinedBg, color: C.statusDeclinedText };
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

/**
 * Star size + offset from Figma session_tour (390×844):
 * vectors at x=6.125, rows content at x≈15.13 → left ≈ −9;
 * tops sit ~10px above each approved row frame (nudged down from Figma −16).
 */
const STAR = {
  width: 28.25,
  height: 44.75,
  left: -9,
  top: -10,
} as const;

const ROW_CARD_HEIGHT = 56;
const ROW_CARD_RADIUS = 16;
const ROW_PAD_X = 19;
const BADGE_PAD_X = 8;
const BADGE_HEIGHT = 22;

/** Approx. width for 11px Noto Sans SemiBold status labels. */
function badgeWidthFor(label: string) {
  return BADGE_PAD_X * 2 + Math.ceil(label.length * 6.6);
}

function SessionRow({ row }: { row: TourSessionRow }) {
  const badge = statusBadgeStyles(row.status);
  const badgeLabel = STATUS_LABEL[row.status];
  const [cardWidth, setCardWidth] = useState(0);
  const badgeWidth = badgeWidthFor(badgeLabel);
  const badgeX = Math.max(ROW_PAD_X, cardWidth - ROW_PAD_X - badgeWidth);
  const badgeY = (ROW_CARD_HEIGHT - BADGE_HEIGHT) / 2;
  /** Optical vertical center for 18px IBM Plex Sans. */
  const titleBaselineY = ROW_CARD_HEIGHT / 2 + 6;
  const badgeBaselineY = ROW_CARD_HEIGHT / 2 + 4;

  return (
    <View style={s.rowSlot} onLayout={(e) => setCardWidth(e.nativeEvent.layout.width)}>
      {row.showStar ? (
        <View
          style={s.star}
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <TourSessionStar width={STAR.width} height={STAR.height} />
        </View>
      ) : null}
      {/*
        Entire card (chrome + title + badge) lives in one SVG under a single
        rotate transform so every label shares the parent card’s angle.
      */}
      <View
        style={[s.rowCard, { transform: [{ rotate: `${row.rotateDeg}deg` }] }]}
        accessibilityLabel={`${row.title}, ${badgeLabel}`}
      >
        {cardWidth > 0 ? (
          <Svg width={cardWidth} height={ROW_CARD_HEIGHT}>
            <Rect
              x={0.5}
              y={0.5}
              width={cardWidth - 1}
              height={ROW_CARD_HEIGHT - 1}
              rx={ROW_CARD_RADIUS}
              ry={ROW_CARD_RADIUS}
              fill={C.bgApp}
              stroke={C.textNavInactive}
              strokeWidth={1}
            />
            <SvgText
              x={ROW_PAD_X}
              y={titleBaselineY}
              fontSize={18}
              fontFamily="IBMPlexSans_600SemiBold"
              fontWeight="600"
              fill={C.textNavInactive}
            >
              {row.title}
            </SvgText>
            <Rect
              x={badgeX}
              y={badgeY}
              width={badgeWidth}
              height={BADGE_HEIGHT}
              rx={8}
              ry={8}
              fill={badge.backgroundColor}
            />
            <SvgText
              x={badgeX + badgeWidth / 2}
              y={badgeBaselineY}
              fontSize={11}
              fontFamily="NotoSans_600SemiBold"
              fontWeight="600"
              fill={badge.color}
              textAnchor="middle"
            >
              {badgeLabel}
            </SvgText>
          </Svg>
        ) : null}
      </View>
    </View>
  );
}

/** Figma `session_tour` (137:173) — onboarding tour step 4. */
export function SessionTourScreen() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    IBMPlexSans_600SemiBold,
    NotoSans_400Regular,
    NotoSans_600SemiBold,
  });

  if (!fontsLoaded) return <View style={s.root} />;

  return (
    <View style={s.root}>
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <View style={s.body}>
          <Text style={s.title}>View your previous sessions.</Text>

          <View style={s.middle} accessibilityLabel="Search sessions and previous session status list">
            <View style={s.searchBar} accessibilityRole="search">
              <TourSearchIcon size={18} color={C.bgApp} />
              <Text style={s.searchPlaceholder}>Search sessions</Text>
            </View>

            <View style={s.sessionList}>
              {TOUR_SESSIONS.map((row) => (
                <SessionRow key={row.title} row={row} />
              ))}
            </View>
          </View>
        </View>

        <TourNavButtons
          variant="dark"
          onContinue={() => router.push('/set-tour')}
          onPrevious={() => router.back()}
        />
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.primary,
  },
  safe: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  body: {
    flex: 1,
    gap: 25,
    paddingTop: 12,
  },
  title: {
    fontFamily: 'Sanchez_400Regular',
    fontSize: 40,
    lineHeight: 48,
    color: C.bgApp,
  },
  middle: {
    width: '100%',
    gap: 15,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: C.bgApp,
    borderRadius: 22,
    overflow: 'hidden',
  },
  searchPlaceholder: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 14,
    lineHeight: 18,
    color: C.bgApp,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  sessionList: {
    width: '100%',
    gap: 10,
  },
  rowSlot: {
    width: '100%',
    height: 68.55,
    justifyContent: 'center',
    position: 'relative',
  },
  rowCard: {
    height: ROW_CARD_HEIGHT,
    width: '100%',
  },
  star: {
    position: 'absolute',
    left: STAR.left,
    top: STAR.top,
    zIndex: 2,
  },
});
