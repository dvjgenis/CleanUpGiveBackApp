import { Image, type ImageStyle } from 'expo-image';
import type { DimensionValue, StyleProp } from 'react-native';

type AssetIconProps = {
  width: number;
  height: number;
  style?: StyleProp<ImageStyle>;
};

function AssetIcon({
  source,
  width,
  height,
  style,
}: AssetIconProps & { source: number }) {
  return (
    <Image
      source={source}
      style={[{ width: width as DimensionValue, height: height as DimensionValue }, style]}
      contentFit="contain"
      accessibilityIgnoresInvertColors
    />
  );
}

/** Figma `Back icon` (node `196:318`). */
export function SessionDetailBackIcon({ width = 24, height = 24, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('@/assets/figma/session-detail/back.svg')}
      width={width ?? 24}
      height={height ?? 24}
      style={style}
    />
  );
}

/** Figma `Share icon` (node `196:321`). */
export function SessionDetailShareIcon({ width = 24, height = 24, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('@/assets/figma/session-detail/share.svg')}
      width={width ?? 24}
      height={height ?? 24}
      style={style}
    />
  );
}

/** Figma Hours Icon (node `555:2354`). */
export function SessionDetailHoursIcon({ width = 18, height = 18, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('@/assets/figma/session-detail/hours.svg')}
      width={width ?? 18}
      height={height ?? 18}
      style={style}
    />
  );
}

/** Figma Miles Icon (node `555:2362`). */
export function SessionDetailMilesIcon({ width = 18, height = 18, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('@/assets/figma/session-detail/miles.svg')}
      width={width ?? 18}
      height={height ?? 18}
      style={style}
    />
  );
}

/** Figma `MdOutlinePhotoCamera` (node `536:2188`). */
export function SessionDetailPhotosIcon({ width = 18, height = 18, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('@/assets/figma/session-detail/photos.svg')}
      width={width ?? 18}
      height={height ?? 18}
      style={style}
    />
  );
}
