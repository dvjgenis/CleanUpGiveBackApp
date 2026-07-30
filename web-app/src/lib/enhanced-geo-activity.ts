/**
 * Enhanced geo activity builder that supports GPS → FIPS geocoding
 * for county and neighborhood-level heatmap tiers.
 */

import { geocodePoint, type GeoPoint, type GeocodingResult } from './geocode';
import { STATE_FIPS_NAME } from './us-heatmap';
import { computedHours } from './mock-data';

export type SessionWithLocation = {
  id: string;
  status: 'approved' | 'under_review' | 'not_approved';
  duration_seconds: number | null;
  adjusted_hours: number | null;
  // Either FIPS code (existing data) or GPS coordinates (new data)
  state_fips?: string;
  latitude?: number;
  longitude?: number;
};

export type GeoTier = 'state' | 'county' | 'neighborhood';

export type EnhancedGeoActivity = {
  byState: GeoUnitStats[];
  byCounty: GeoUnitStats[];
  byNeighborhood: GeoUnitStats[];
  geocodingStats: {
    totalSessions: number;
    geocodedSessions: number;
    failedGeocodings: number;
    cachedResults: number;
  };
};

export type GeoUnitStats = {
  id: string;
  name: string;
  sessionCount: number;
  hours: number;
  underReview: number;
  confidence?: number; // For geocoded results
};

// Simple in-memory cache for geocoding results
const geocodingCache = new Map<string, GeocodingResult>();

function getCacheKey(lat: number, lng: number): string {
  // Round to 4 decimal places (~11m precision) for caching
  const roundedLat = Math.round(lat * 10000) / 10000;
  const roundedLng = Math.round(lng * 10000) / 10000;
  return `${roundedLat},${roundedLng}`;
}

/**
 * Build enhanced geo activity data with support for GPS → FIPS geocoding.
 */
export async function buildEnhancedGeoActivity(
  sessions: SessionWithLocation[],
  preferredTier: GeoTier = 'state'
): Promise<EnhancedGeoActivity> {
  const stats = {
    totalSessions: sessions.length,
    geocodedSessions: 0,
    failedGeocodings: 0,
    cachedResults: 0,
  };
  
  const stateMap = new Map<string, GeoUnitStats>();
  const countyMap = new Map<string, GeoUnitStats>();
  const neighborhoodMap = new Map<string, GeoUnitStats>();
  
  // Process sessions sequentially to avoid overwhelming geocoding API
  for (const session of sessions) {
    let geocodingResult: GeocodingResult | null = null;
    
    // Try to get location data
    if (session.latitude && session.longitude) {
      // Use GPS coordinates with geocoding
      const cacheKey = getCacheKey(session.latitude, session.longitude);
      const cached = geocodingCache.get(cacheKey);
      
      if (cached) {
        geocodingResult = cached;
        stats.cachedResults++;
      } else {
        const result = await geocodePoint({
          latitude: session.latitude,
          longitude: session.longitude,
        });
        
        if ('fips' in result) {
          geocodingResult = result;
          geocodingCache.set(cacheKey, result);
          stats.geocodedSessions++;
        } else {
          stats.failedGeocodings++;
          continue; // Skip sessions that couldn't be geocoded
        }
      }
    } else if (session.state_fips) {
      // Use existing FIPS code
      geocodingResult = {
        fips: {
          state: session.state_fips,
          county: '000', // Unknown county
        },
        names: {
          state: STATE_FIPS_NAME[session.state_fips] || `State ${session.state_fips}`,
          county: 'Unknown County',
        },
        confidence: 1.0, // Full confidence for existing data
      };
    } else {
      // No location data available
      continue;
    }
    
    if (!geocodingResult) continue;
    
    const sessionHours = computedHours(session.duration_seconds, session.adjusted_hours);
    const isUnderReview = session.status === 'under_review';
    
    // Update state-level stats
    const stateId = geocodingResult.fips.state;
    const stateName = geocodingResult.names.state;
    const stateStats = stateMap.get(stateId) || {
      id: stateId,
      name: stateName,
      sessionCount: 0,
      hours: 0,
      underReview: 0,
      confidence: geocodingResult.confidence,
    };
    stateStats.sessionCount++;
    stateStats.hours += sessionHours;
    if (isUnderReview) stateStats.underReview++;
    // Update confidence to minimum of all sessions in this state
    stateStats.confidence = Math.min(stateStats.confidence || 1, geocodingResult.confidence);
    stateMap.set(stateId, stateStats);
    
    // Update county-level stats (if available)
    if (geocodingResult.fips.county && geocodingResult.fips.county !== '000') {
      const countyId = `${stateId}${geocodingResult.fips.county}`;
      const countyName = geocodingResult.names.county || 'Unknown County';
      const countyStats = countyMap.get(countyId) || {
        id: countyId,
        name: countyName,
        sessionCount: 0,
        hours: 0,
        underReview: 0,
        confidence: geocodingResult.confidence,
      };
      countyStats.sessionCount++;
      countyStats.hours += sessionHours;
      if (isUnderReview) countyStats.underReview++;
      countyStats.confidence = Math.min(countyStats.confidence || 1, geocodingResult.confidence);
      countyMap.set(countyId, countyStats);
    }
    
    // Update neighborhood-level stats (if available)
    if (geocodingResult.fips.tract && geocodingResult.names.neighborhood) {
      const neighborhoodId = `${stateId}${geocodingResult.fips.county}${geocodingResult.fips.tract}`;
      const neighborhoodName = geocodingResult.names.neighborhood;
      const neighborhoodStats = neighborhoodMap.get(neighborhoodId) || {
        id: neighborhoodId,
        name: neighborhoodName,
        sessionCount: 0,
        hours: 0,
        underReview: 0,
        confidence: geocodingResult.confidence,
      };
      neighborhoodStats.sessionCount++;
      neighborhoodStats.hours += sessionHours;
      if (isUnderReview) neighborhoodStats.underReview++;
      neighborhoodStats.confidence = Math.min(neighborhoodStats.confidence || 1, geocodingResult.confidence);
      neighborhoodMap.set(neighborhoodId, neighborhoodStats);
    }
  }
  
  return {
    byState: Array.from(stateMap.values()).sort((a, b) => b.sessionCount - a.sessionCount),
    byCounty: Array.from(countyMap.values()).sort((a, b) => b.sessionCount - a.sessionCount),
    byNeighborhood: Array.from(neighborhoodMap.values()).sort((a, b) => b.sessionCount - a.sessionCount),
    geocodingStats: stats,
  };
}

/**
 * Create mock sessions with GPS coordinates for testing the enhanced geocoding.
 */
export function createMockSessionsWithGPS(): SessionWithLocation[] {
  return [
    // Chicago area sessions
    {
      id: 'gps1',
      status: 'approved',
      duration_seconds: 5400,
      adjusted_hours: null,
      latitude: 41.8781,
      longitude: -87.6298, // Downtown Chicago
    },
    {
      id: 'gps2',
      status: 'under_review',
      duration_seconds: 3600,
      adjusted_hours: null,
      latitude: 41.9342,
      longitude: -87.6755, // Lincoln Park
    },
    {
      id: 'gps3',
      status: 'approved',
      duration_seconds: 7200,
      adjusted_hours: null,
      latitude: 41.8675,
      longitude: -87.6169, // River North
    },
    // New York area sessions
    {
      id: 'gps4',
      status: 'approved',
      duration_seconds: 4800,
      adjusted_hours: null,
      latitude: 40.7589,
      longitude: -73.9851, // Midtown Manhattan
    },
    {
      id: 'gps5',
      status: 'not_approved',
      duration_seconds: 1800,
      adjusted_hours: null,
      latitude: 40.7505,
      longitude: -73.9934, // Times Square
    },
    // Los Angeles area sessions
    {
      id: 'gps6',
      status: 'approved',
      duration_seconds: 6300,
      adjusted_hours: null,
      latitude: 34.0522,
      longitude: -118.2437, // Downtown LA
    },
    // Mix with existing FIPS data
    {
      id: 'legacy1',
      status: 'approved',
      duration_seconds: 5400,
      adjusted_hours: null,
      state_fips: '48', // Texas
    },
    {
      id: 'legacy2',
      status: 'under_review',
      duration_seconds: 3200,
      adjusted_hours: null,
      state_fips: '12', // Florida
    },
  ];
}