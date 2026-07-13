import { StyleSheet, View } from 'react-native';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { Map, MapMarker } from '@/components/ui/map';

import { colors } from '../tokens';
import type { MapCoordinate } from '../utils/openLocationInMaps';

type Props = {
  address: string;
  coordinate: MapCoordinate;
  onPress: () => void;
};

/** MapLibre branch — only loaded outside Expo Go / web. */
export function EventLocationMapNative({ address, coordinate, onPress }: Props) {
  return (
    <View style={s.mapWrap}>
      <Map center={[coordinate.longitude, coordinate.latitude]} zoom={14} showLoader>
        <MapMarker longitude={coordinate.longitude} latitude={coordinate.latitude}>
          <View style={s.marker}>
            <View style={s.markerDot} />
          </View>
        </MapMarker>
      </Map>
      {/* Transparent overlay so taps open Maps (MapLibre swallows gestures). */}
      <AnimatedPressable
        scaleTo={1}
        onPress={onPress}
        accessibilityRole="link"
        accessibilityLabel={`Open ${address} in Maps`}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const s = StyleSheet.create({
  mapWrap: {
    width: '100%',
    aspectRatio: 382 / 203,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.chipSelectedBg,
  },
  marker: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  markerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.white,
  },
});
