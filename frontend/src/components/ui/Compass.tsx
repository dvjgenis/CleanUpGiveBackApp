import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { G, Polygon } from 'react-native-svg';
import * as Location from 'expo-location';

// Figma 985:567 — compass geometry (47.25×47.25 frame)
const VIEW = 47.25;
const CENTER = VIEW / 2; // 23.625

const NEEDLE_HALF = 18.9; // radius to arrowhead tip
const DIAG_HALF = 17.48;  // intercardinal spoke radius (slightly shorter)
const DIAG_W = 2.469;     // tick width

// Green cardinal tick at each of N / E / S / W positions
const CARDINAL_ANGLES = [0, 90, 180, 270] as const;

// Grey intercardinal ticks (NNE, NE, NW, NNW + their opposites)
const INTERCARDINAL_ANGLES = [-112.5, -67.5, -45, -22.5, 22.5, 45] as const;

const GREEN = '#009540';
const RED = '#BA1A1A';
const TICK_COLOR = '#3E4A3D';

const DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;

function bearingToLabel(deg: number): string {
  const normalized = ((deg % 360) + 360) % 360;
  return DIRECTIONS[Math.round(normalized / 45) % 8];
}

// Returns positive heading angle (clockwise = facing direction) + readable label
function useHeadingAngle() {
  const angle = useSharedValue(0);
  const [label, setLabel] = useState('N');
  const prevRaw = useRef(0);
  const cumulative = useRef(0);
  const initialized = useRef(false);

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      sub = await Location.watchHeadingAsync((data) => {
        const raw = data.trueHeading >= 0 ? data.trueHeading : data.magHeading;

        if (!initialized.current) {
          initialized.current = true;
          prevRaw.current = raw;
          cumulative.current = raw;
          angle.value = raw;
          setLabel(bearingToLabel(raw));
          return;
        }

        let delta = raw - prevRaw.current;
        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;
        cumulative.current += delta;
        prevRaw.current = raw;
        angle.value = withTiming(cumulative.current, { duration: 150 });
        setLabel(bearingToLabel(raw));
      });
    })();

    return () => { sub?.remove(); };
  }, [angle]);

  return { angle, label };
}

type Props = {
  size?: number;
  borderColor?: string;
  backgroundColor?: string;
};

export function Compass({ size = 44, borderColor = '#C8C8C8', backgroundColor = '#FFFFFF' }: Props) {
  const { angle: headingAngle, label: directionLabel } = useHeadingAngle();

  const tickStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${headingAngle.value}deg` }],
  }));

  const fontSize = Math.max(7, Math.round(size * 0.27));
  const lineHeight = Math.round(fontSize * 1.15);
  // Vertically center the text by explicit top offset
  const labelTop = Math.round((size - lineHeight) / 2);

  return (
    <View
      style={[
        styles.ring,
        { width: size, height: size, borderRadius: size / 2, borderColor, backgroundColor },
      ]}
    >
      {/* Static compass background */}
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        style={StyleSheet.absoluteFill}
      >
        <G transform={`translate(${CENTER}, ${CENTER})`}>

          {/* Grey intercardinal ticks — pair at each end of each spoke */}
          {INTERCARDINAL_ANGLES.map((a) => (
            <G key={a} transform={`rotate(${a})`} opacity={0.5}>
              <Polygon
                points={`0,${-DIAG_HALF} ${-DIAG_W},${-DIAG_HALF + 3} ${DIAG_W},${-DIAG_HALF + 3}`}
                fill={TICK_COLOR}
              />
              <Polygon
                points={`0,${DIAG_HALF} ${-DIAG_W},${DIAG_HALF - 3} ${DIAG_W},${DIAG_HALF - 3}`}
                fill={TICK_COLOR}
              />
            </G>
          ))}

          {/* Green cardinal ticks at N / E / S / W (tip points outward) */}
          {CARDINAL_ANGLES.map((a) => (
            <G key={a} transform={`rotate(${a})`} opacity={0.8}>
              <Polygon
                points={`0,${-NEEDLE_HALF} ${-DIAG_W},${-NEEDLE_HALF + 3} ${DIAG_W},${-NEEDLE_HALF + 3}`}
                fill={GREEN}
              />
            </G>
          ))}

        </G>
      </Svg>

      {/* Rotating red tick — top = current facing direction */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.center, tickStyle]}>
        <Svg width={size} height={size} viewBox={`0 0 ${VIEW} ${VIEW}`}>
          <G transform={`translate(${CENTER}, ${CENTER})`}>
            <Polygon
              points={`0,${-NEEDLE_HALF} ${-DIAG_W},${-NEEDLE_HALF + 3} ${DIAG_W},${-NEEDLE_HALF + 3}`}
              fill={RED}
              opacity={0.9}
            />
          </G>
        </Svg>
      </Animated.View>

      {/* Direction label — explicitly centered by computed top + full-width textAlign */}
      <Text
        style={[
          styles.directionLabel,
          { fontSize, lineHeight, top: labelTop },
        ]}
        pointerEvents="none"
      >
        {directionLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  directionLabel: {
    position: 'absolute',
    left: 0,
    right: 0,
    fontWeight: '700',
    color: TICK_COLOR,
    textAlign: 'center',
  },
});
