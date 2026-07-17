import { useEffect, useRef } from 'react';

import { useMap } from '@/components/ui/map';

import type { RouteCoordinate } from '../utils/geo';

type Props = {
  currentCoordinate: RouteCoordinate | null;
  recenterToken: number;
  mapFollowEnabled: boolean;
};

/** Keeps the live-session map centered on the user when tracking starts, follow is on, or recenter is requested. */
export function LiveSessionMapCamera({
  currentCoordinate,
  recenterToken,
  mapFollowEnabled,
}: Props) {
  const { cameraRef, isLoaded } = useMap();
  const hasInitialCentered = useRef(false);
  const lastRecenterToken = useRef(recenterToken);

  useEffect(() => {
    if (!isLoaded || !cameraRef.current || !currentCoordinate) {
      return;
    }

    const recenterRequested = recenterToken !== lastRecenterToken.current;
    if (recenterRequested) {
      lastRecenterToken.current = recenterToken;
    }

    if (recenterRequested) {
      cameraRef.current.flyTo({
        center: currentCoordinate,
        zoom: 15,
        duration: 900,
      });
      return;
    }

    if (mapFollowEnabled) {
      cameraRef.current.easeTo({
        center: currentCoordinate,
        duration: 300,
      });
      return;
    }

    if (!hasInitialCentered.current) {
      hasInitialCentered.current = true;
      // Duration 0 — used after style remounts so layer/theme swaps land on the
      // pin without a visible zoom-out/fly-in.
      cameraRef.current.jumpTo({
        center: currentCoordinate,
        zoom: 15,
      });
    }
  }, [cameraRef, currentCoordinate, isLoaded, mapFollowEnabled, recenterToken]);

  return null;
}
