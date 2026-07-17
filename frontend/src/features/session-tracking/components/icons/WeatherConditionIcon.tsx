import Svg, { Path } from 'react-native-svg';

import { WEATHER_ICON_PATHS, type WeatherIconKey } from '../../utils/weatherIconPaths';

type Props = {
  condition: WeatherIconKey;
  color?: string;
  size?: number;
};

/**
 * Live-tracker weather glyph — paths from Figma Weather Icons (react-icons/wi)
 * https://www.figma.com/design/QJZGbrXDPi86smOSecdF7s/…?node-id=2-78993
 */
export function WeatherConditionIcon({
  condition,
  color = '#3E4A3D',
  size = 18,
}: Props) {
  const d = WEATHER_ICON_PATHS[condition] ?? WEATHER_ICON_PATHS.sunny;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d={d} fill={color} />
    </Svg>
  );
}
