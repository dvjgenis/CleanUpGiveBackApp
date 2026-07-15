import { StyleSheet, View } from 'react-native';

import { colors } from '../tokens';

type ArrowProps = {
  heading: number | null;
};

/** Gray circle at the session start point. */
export function SessionStartMarker() {
  return <View style={styles.startMarker} />;
}

/** Green directional arrow for the live current position. */
export function SessionCurrentArrowMarker({ heading }: ArrowProps) {
  return (
    <View
      style={[
        styles.arrowContainer,
        heading != null && { transform: [{ rotate: `${heading}deg` }] },
      ]}
    >
      <View style={styles.arrowHead} />
      <View style={styles.arrowTail} />
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
    backgroundColor: colors.textTertiary,
    borderWidth: 2,
    borderColor: colors.textOnPrimary,
  },
  arrowContainer: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowHead: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderBottomWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: colors.primary,
    marginBottom: -2,
  },
  arrowTail: {
    width: 6,
    height: 8,
    borderRadius: 3,
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.textOnPrimary,
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
