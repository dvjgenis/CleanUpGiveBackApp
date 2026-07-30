/**
 * Enhanced US Heatmap with GPS → FIPS geocoding and multiple resolution tiers.
 */
'use client';

import { useState } from 'react';
import { UsHeatmap } from '../dashboard/UsHeatmap';
import { GeocodingStats } from './GeocodingStats';
import type { EnhancedGeoActivity, GeoTier } from '@/lib/enhanced-geo-activity';

type Props = {
  activity: EnhancedGeoActivity;
  periodLabel: string;
  isMock?: boolean;
};

const TIER_OPTIONS: { value: GeoTier; label: string; description: string }[] = [
  { value: 'state', label: 'State', description: 'State-level aggregation' },
  { value: 'county', label: 'County', description: 'County-level detail' },
  { value: 'neighborhood', label: 'Neighborhood', description: 'Neighborhood-level detail' },
];

export function EnhancedUsHeatmap({ activity, periodLabel, isMock = false }: Props) {
  const [selectedTier, setSelectedTier] = useState<GeoTier>('state');
  
  // Convert enhanced activity back to the format expected by the original UsHeatmap
  const legacyActivity = {
    byState: activity.byState,
    byCounty: selectedTier === 'county' ? activity.byCounty : [],
    byNeighborhood: selectedTier === 'neighborhood' ? activity.byNeighborhood : [],
  };
  
  const hasCountyData = activity.byCounty.length > 0;
  const hasNeighborhoodData = activity.byNeighborhood.length > 0;
  
  return (
    <div className="flex flex-col gap-md">
      {/* Tier Selection */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading text-[20px] leading-[28px] text-text-primary">
            Geographic Activity
          </h3>
          <p className="font-body text-[13px] text-text-tertiary mt-xs">
            {periodLabel} • {selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)}-level view
          </p>
        </div>
        
        <div className="flex gap-xs">
          {TIER_OPTIONS.map((tier) => {
            const isDisabled = 
              (tier.value === 'county' && !hasCountyData) ||
              (tier.value === 'neighborhood' && !hasNeighborhoodData);
            
            return (
              <button
                key={tier.value}
                type="button"
                onClick={() => !isDisabled && setSelectedTier(tier.value)}
                disabled={isDisabled}
                className={`px-md py-sm rounded-sm font-data text-[12px] font-semibold transition-colors ${
                  selectedTier === tier.value
                    ? 'bg-primary text-white'
                    : isDisabled
                    ? 'bg-bg-surface-elevated text-text-tertiary cursor-not-allowed'
                    : 'bg-bg-surface text-text-tertiary border border-border-outline hover:border-primary hover:text-primary'
                }`}
                title={isDisabled ? `No ${tier.value}-level data available` : tier.description}
              >
                {tier.label}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Enhanced Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-md">
        <div className="lg:col-span-3">
          <UsHeatmap 
            activity={legacyActivity} 
            periodLabel={periodLabel} 
            isMock={isMock} 
          />
        </div>
        <div className="flex flex-col gap-md">
          <GeocodingStats stats={activity.geocodingStats} />
          
          {/* Data Quality Indicator */}
          <div className="bg-bg-surface border border-border-outline rounded-md p-md">
            <h4 className="font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary mb-sm">
              Available Data
            </h4>
            <div className="space-y-xs">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-tertiary">State level:</span>
                <span className="text-primary font-semibold">{activity.byState.length} regions</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={hasCountyData ? 'text-text-tertiary' : 'text-text-tertiary/50'}>
                  County level:
                </span>
                <span className={hasCountyData ? 'text-text-primary' : 'text-text-tertiary/50'}>
                  {activity.byCounty.length} counties
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={hasNeighborhoodData ? 'text-text-tertiary' : 'text-text-tertiary/50'}>
                  Neighborhood:
                </span>
                <span className={hasNeighborhoodData ? 'text-text-primary' : 'text-text-tertiary/50'}>
                  {activity.byNeighborhood.length} areas
                </span>
              </div>
            </div>
          </div>
          
          {/* Data Confidence */}
          <div className="bg-bg-surface border border-border-outline rounded-md p-md">
            <h4 className="font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary mb-sm">
              Data Confidence
            </h4>
            <div className="space-y-xs">
              {getCurrentTierData(activity, selectedTier).slice(0, 3).map((item, index) => {
                const confidenceColor = 
                  (item.confidence || 1) >= 0.9 ? 'text-primary' :
                  (item.confidence || 1) >= 0.7 ? 'text-[#835400]' : 'text-[#ba1a1a]';
                
                return (
                  <div key={item.id} className="flex items-center justify-between text-xs">
                    <span className="text-text-tertiary truncate max-w-[80px]" title={item.name}>
                      {item.name}
                    </span>
                    <span className={`font-semibold ${confidenceColor}`}>
                      {((item.confidence || 1) * 100).toFixed(0)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Development Note */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-[#f7fff1] border border-primary/30 text-primary px-md py-sm rounded-sm">
          <p className="font-body text-[12px]">
            <strong>Development:</strong> This is a mock geocoding implementation. 
            In production, this would use a real geocoding service (Google Maps, OpenCage, etc.) 
            to convert GPS coordinates to FIPS codes for accurate county/neighborhood mapping.
          </p>
        </div>
      )}
    </div>
  );
}

function getCurrentTierData(activity: EnhancedGeoActivity, tier: GeoTier) {
  switch (tier) {
    case 'state':
      return activity.byState;
    case 'county':
      return activity.byCounty;
    case 'neighborhood':
      return activity.byNeighborhood;
    default:
      return activity.byState;
  }
}