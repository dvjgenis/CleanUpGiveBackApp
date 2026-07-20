import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { colors } from '../tokens';

type ArrowProps = {
  heading: number | null;
};

/** Overall square footprint of the heading marker, in px. Kept square so the
 * rotation transform below pivots around the dot's own center. Sized to
 * comfortably fit the beam's outer radius with margin to spare. */
const HEADING_MARKER_SIZE = 100;
const HEADING_MARKER_CENTER = HEADING_MARKER_SIZE / 2;
/** Outer white halo / inner primary dot radii, in px. */
const HEADING_DOT_OUTER_RADIUS = 11;
const HEADING_DOT_INNER_RADIUS = 7;
/**
 * Google Maps-style "location beam": a soft circular sector (pie slice)
 * fanning out from the dot toward the heading direction, rather than a
 * sharp-edged triangle. A true sector's chord widens with radius, so it
 * naturally reads as a cone even though the sector's point sits at the
 * center — the dot itself masks that point. Built from a flat-opacity
 * sector (rather than a `LinearGradient`/`feGaussianBlur` `url()` fill)
 * because anything referenced via `url(#id)` can paint one frame late
 * inside a native map `Marker` — the marker gets snapshotted into a
 * static bitmap before the fill resolves, so it renders solid black until
 * something forces a re-snapshot (e.g. a zoom change). Flat fills paint
 * synchronously and avoid that class of bug entirely.
 */
const HEADING_BEAM_OUTER_RADIUS = 48;
const HEADING_BEAM_OUTER_HALF_ANGLE_DEG = 34;
const HEADING_BEAM_OUTER_OPACITY = 0.16;

/** Builds an SVG path `d` string for a circular sector ("pie slice") pointing
 * straight up from `(cx, cy)`, spanning `halfAngleDeg` on either side of due
 * north, out to `radius`. */
function buildBeamSectorPath(cx: number, cy: number, radius: number, halfAngleDeg: number) {
  const halfAngleRad = (halfAngleDeg * Math.PI) / 180;
  const leftX = cx - radius * Math.sin(halfAngleRad);
  const leftY = cy - radius * Math.cos(halfAngleRad);
  const rightX = cx + radius * Math.sin(halfAngleRad);
  const rightY = cy - radius * Math.cos(halfAngleRad);
  return `M ${cx} ${cy} L ${leftX} ${leftY} A ${radius} ${radius} 0 0 1 ${rightX} ${rightY} Z`;
}

/** Circle at the session start point. Live tracker uses gray; route
 * replay/preview passes fill/border from `getReplayStartMarkerColors` so the
 * pin stays visible on both light Standard and dark Satellite/Hybrid maps. */
export function SessionStartMarker({
  color = colors.textTertiary,
  borderColor = colors.textOnPrimary,
}: {
  color?: string;
  borderColor?: string;
}) {
  return <View style={[styles.startMarker, { backgroundColor: color, borderColor }]} />;
}

/**
 * Live current-position marker: a primary-green dot with a white halo and,
 * once a GPS heading is available, a soft directional cone (narrow at the
 * dot, widening and fading as it extends outward, like a flashlight beam)
 * pointing the way the user is heading. The beam only appears when
 * `heading` is a valid number; otherwise a plain dot is shown. The whole
 * SVG rotates around its own center (which is also the dot's center), so
 * the dot stays pinned to the coordinate while the cone sweeps around it.
 */
export function SessionCurrentArrowMarker({ heading }: ArrowProps) {
  const hasHeading = heading != null && Number.isFinite(heading);

  return (
    <View
      style={[
        styles.headingMarker,
        hasHeading && { transform: [{ rotate: `${heading}deg` }] },
      ]}
    >
      <View style={styles.headingDotShadow} pointerEvents="none" />
      <Svg width={HEADING_MARKER_SIZE} height={HEADING_MARKER_SIZE}>
        {hasHeading && (
          <Path
            d={buildBeamSectorPath(
              HEADING_MARKER_CENTER,
              HEADING_MARKER_CENTER,
              HEADING_BEAM_OUTER_RADIUS,
              HEADING_BEAM_OUTER_HALF_ANGLE_DEG
            )}
            fill={colors.primary}
            fillOpacity={HEADING_BEAM_OUTER_OPACITY}
          />
        )}
        <Circle
          cx={HEADING_MARKER_CENTER}
          cy={HEADING_MARKER_CENTER}
          r={HEADING_DOT_OUTER_RADIUS}
          fill={colors.textOnPrimary}
        />
        <Circle
          cx={HEADING_MARKER_CENTER}
          cy={HEADING_MARKER_CENTER}
          r={HEADING_DOT_INNER_RADIUS}
          fill={colors.primary}
        />
      </Svg>
    </View>
  );
}

/** Green ring marker for the session end point on previews. */
export function SessionEndMarker() {
  return (
    <View style={styles.endMarker}>
      <View style={styles.endMarkerDot} />
    </View>
  );
}

const styles = StyleSheet.create({
  startMarker: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.textOnPrimary,
  },
  headingMarker: {
    width: HEADING_MARKER_SIZE,
    height: HEADING_MARKER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headingDotShadow: {
    position: 'absolute',
    width: HEADING_DOT_OUTER_RADIUS * 2,
    height: HEADING_DOT_OUTER_RADIUS * 2,
    borderRadius: HEADING_DOT_OUTER_RADIUS,
    backgroundColor: colors.textOnPrimary,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 4,
  },
  endMarker: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.textOnPrimary,
  },
  endMarkerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textOnPrimary,
  },
});
