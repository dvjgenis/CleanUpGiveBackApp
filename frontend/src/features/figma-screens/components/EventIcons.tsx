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

export function EventShareIcon({ width = 24, height = 24, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('@/assets/figma/event-detail/share.svg')}
      width={width ?? 24}
      height={height ?? 24}
      style={style}
    />
  );
}

export function EventCopyIcon({ width = 18, height = 18, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('@/assets/figma/event-detail/copy.svg')}
      width={width ?? 18}
      height={height ?? 18}
      style={style}
    />
  );
}

export function EventCalendarIcon({ width = 18, height = 18, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('@/assets/figma/event-detail/calendar.svg')}
      width={width ?? 18}
      height={height ?? 18}
      style={style}
    />
  );
}

export function EventClothingIcon({ width = 24, height = 24, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('@/assets/figma/event-detail/clothing.svg')}
      width={width ?? 24}
      height={height ?? 24}
      style={style}
    />
  );
}

export function EventWaterBottleIcon({ width = 24, height = 24, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('@/assets/figma/event-detail/water-bottle.svg')}
      width={width ?? 24}
      height={height ?? 24}
      style={style}
    />
  );
}

export function EventShoesIcon({ width = 24, height = 24, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('@/assets/figma/event-detail/shoes.svg')}
      width={width ?? 24}
      height={height ?? 24}
      style={style}
    />
  );
}

export function EventInstagramIcon({ width = 24, height = 24, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('@/assets/figma/event-detail/instagram.svg')}
      width={width ?? 24}
      height={height ?? 24}
      style={style}
    />
  );
}

export function EventFacebookIcon({ width = 24, height = 24, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('@/assets/figma/event-detail/facebook.svg')}
      width={width ?? 24}
      height={height ?? 24}
      style={style}
    />
  );
}

export function EventYouTubeIcon({ width = 24, height = 24, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('@/assets/figma/event-detail/youtube.svg')}
      width={width ?? 24}
      height={height ?? 24}
      style={style}
    />
  );
}

export function EventSuccessCheckIcon({ width = 79, height = 79, style }: Partial<AssetIconProps>) {
  return (
    <AssetIcon
      source={require('@/assets/figma/event-detail/success-check.svg')}
      width={width ?? 79}
      height={height ?? 79}
      style={style}
    />
  );
}
