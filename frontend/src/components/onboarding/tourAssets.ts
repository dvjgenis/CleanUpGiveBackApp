import { Asset } from 'expo-asset';
import { Image as ExpoImage } from 'expo-image';

/** Tour middle-graphic modules — prefer small webp for fast first paint. */
export const TOUR_GRAPHICS = {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  shopShowcase: require('@/assets/figma/tour/shop-showcase.webp') as number,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  trackMap: require('@/assets/figma/tour/track-map.webp') as number,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  homeStats: require('@/assets/figma/tour/home-stats.png') as number,
} as const;

/** Warm memory-disk cache so shop/track tour graphics paint immediately. */
export async function prefetchTourGraphics(
  keys: (keyof typeof TOUR_GRAPHICS)[] = ['shopShowcase', 'trackMap'],
): Promise<void> {
  await Promise.allSettled(
    keys.map(async (key) => {
      try {
        const asset = Asset.fromModule(TOUR_GRAPHICS[key]);
        await asset.downloadAsync();
        if (!asset.localUri) return;
        await ExpoImage.prefetch(asset.localUri, 'memory-disk');
      } catch {
        // Non-fatal — screen still loads from the module require.
      }
    }),
  );
}
