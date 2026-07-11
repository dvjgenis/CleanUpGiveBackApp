# Context: maps

Map and location services for live session tracking.

## Purpose

Powers route display, GPS sampling, and geofencing during cleanup sessions. UI prototype exists in `live_session___refined_map_tracker.html`; native implementation is not yet wired.

## Planned responsibilities

- Stream or batch GPS coordinates during an active session — **wired in app** via `liveSessionStore` (`watchPositionAsync`, route polyline, haversine distance)
- Render route polyline and session stats
- Geofence validation for checkpoint zones
- Map provider abstraction (tiles, geocoding)

## Integrations

- Map provider TBD — see [accounts-and-access.md](../../accounts-and-access.md)
- Frontend: `expo-location` + map component; live tracker weather via [Open-Meteo](https://open-meteo.com/) (current temperature + reverse geocoding, no API key)

## Code

- `backend/maps/` — service scaffold (empty)
