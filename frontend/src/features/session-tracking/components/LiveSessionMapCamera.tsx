import { useEffect, useRef } from 'react';

import { useMap } from '@/components/ui/map';

import type { RouteCoordinate } from '../utils/geo';

type Props = {
  currentCoordinate: RouteCoordinate | null;
  recenterToken: number;
};

/** Keeps the live-session map centered on the user when tracking starts or recenter is requested. */
export function LiveSessionMapCamera({ currentCoordinate, recenterToken }: Props) {
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

    if (!hasInitialCentered.current) {
      hasInitialCentered.current = true;
      cameraRef.current.easeTo({
        center: currentCoordinate,
        zoom: 15,
        duration: 0,
      });
    }
  }, [cameraRef, currentCoordinate, isLoaded, recenterToken]);

  return null;
}
