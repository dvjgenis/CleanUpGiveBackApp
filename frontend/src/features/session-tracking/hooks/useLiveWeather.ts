import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import {
  fetchCurrentTemperatureF,
  fetchPlaceName,
  formatTemperatureFahrenheit,
} from '../services/weather';

const REFRESH_INTERVAL_MS = 10 * 60 * 1000;

export type LiveWeatherState = {
  placeLabel: string | null;
  temperatureLabel: string;
  isLoading: boolean;
};

const INITIAL_STATE: LiveWeatherState = {
  placeLabel: null,
  temperatureLabel: '—',
  isLoading: true,
};

async function resolvePlaceLabel(latitude: number, longitude: number): Promise<string | null> {
  if (Platform.OS !== 'web') {
    try {
      const results = await Location.reverseGeocodeAsync({ latitude, longitude });
      const first = results[0];
      if (first) {
        return first.city ?? first.subregion ?? first.region ?? first.district ?? null;
      }
    } catch {
      // Fall through to Open-Meteo reverse geocoding.
    }
  }

  return fetchPlaceName(latitude, longitude);
}

async function loadLiveWeather(): Promise<Pick<LiveWeatherState, 'placeLabel' | 'temperatureLabel'>> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    return { placeLabel: null, temperatureLabel: '—' };
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  const { latitude, longitude } = position.coords;
  const [placeLabel, temperatureF] = await Promise.all([
    resolvePlaceLabel(latitude, longitude),
    fetchCurrentTemperatureF(latitude, longitude),
  ]);

  return {
    placeLabel,
    temperatureLabel: formatTemperatureFahrenheit(temperatureF),
  };
}

export function useLiveWeather(): LiveWeatherState {
  const [state, setState] = useState<LiveWeatherState>(INITIAL_STATE);

  const refresh = useCallback(async () => {
    setState((current) => ({ ...current, isLoading: true }));

    try {
      const next = await loadLiveWeather();
      setState({
        placeLabel: next.placeLabel,
        temperatureLabel: next.temperatureLabel,
        isLoading: false,
      });
    } catch {
      setState((current) => ({
        placeLabel: current.placeLabel,
        temperatureLabel: '—',
        isLoading: false,
      }));
    }
  }, []);

  useEffect(() => {
    void refresh();

    const intervalId = setInterval(() => {
      void refresh();
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [refresh]);

  return state;
}
