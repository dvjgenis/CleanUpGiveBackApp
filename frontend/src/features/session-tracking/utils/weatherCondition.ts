import type { WeatherIconKey } from './weatherIconPaths';

/**
 * Map Open-Meteo WMO weather codes → in-app glyph keys.
 * @see https://open-meteo.com/en/docs
 */
export function weatherCodeToIconKey(
  weatherCode: number | null | undefined,
  isDay: boolean,
): WeatherIconKey {
  if (weatherCode == null || Number.isNaN(weatherCode)) {
    return isDay ? 'sunny' : 'night-clear';
  }

  switch (true) {
    case weatherCode === 0:
      return isDay ? 'sunny' : 'night-clear';
    case weatherCode === 1:
    case weatherCode === 2:
      return 'partly-cloudy';
    case weatherCode === 3:
      return 'cloudy';
    case weatherCode === 45:
    case weatherCode === 48:
      return 'fog';
    case weatherCode >= 51 && weatherCode <= 57:
      return 'showers';
    case weatherCode >= 61 && weatherCode <= 67:
    case weatherCode >= 80 && weatherCode <= 82:
      return 'rain';
    case weatherCode >= 71 && weatherCode <= 77:
    case weatherCode >= 85 && weatherCode <= 86:
      return 'snow';
    case weatherCode >= 95 && weatherCode <= 99:
      return 'thunderstorm';
    default:
      return isDay ? 'partly-cloudy' : 'night-clear';
  }
}
