/**
 * Component to display geocoding statistics and quality metrics for the enhanced heatmap.
 */

type GeocodingStatsProps = {
  stats: {
    totalSessions: number;
    geocodedSessions: number;
    failedGeocodings: number;
    cachedResults: number;
  };
  className?: string;
};

export function GeocodingStats({ stats, className = "" }: GeocodingStatsProps) {
  const { totalSessions, geocodedSessions, failedGeocodings, cachedResults } = stats;
  const legacyFipsSessions = totalSessions - geocodedSessions - failedGeocodings;
  const successRate = totalSessions > 0 ? ((geocodedSessions + legacyFipsSessions) / totalSessions) * 100 : 0;
  const cacheHitRate = geocodedSessions > 0 ? (cachedResults / (geocodedSessions + cachedResults)) * 100 : 0;

  if (totalSessions === 0) return null;

  return (
    <div className={`bg-bg-surface border border-border-outline rounded-md p-md ${className}`}>
      <h4 className="font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary mb-sm">
        Geocoding Quality
      </h4>
      <div className="grid grid-cols-2 gap-md text-center">
        <div>
          <p className="font-data text-[14px] font-semibold text-text-primary">
            {successRate.toFixed(1)}%
          </p>
          <p className="font-data text-[10px] text-text-tertiary">Success Rate</p>
        </div>
        <div>
          <p className="font-data text-[14px] font-semibold text-text-primary">
            {totalSessions}
          </p>
          <p className="font-data text-[10px] text-text-tertiary">Total Sessions</p>
        </div>
      </div>
      
      <div className="mt-sm pt-sm border-t border-border-outline">
        <div className="flex justify-between items-center text-xs">
          <span className="text-text-tertiary">GPS geocoded:</span>
          <span className="text-text-primary">{geocodedSessions}</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-text-tertiary">Legacy FIPS:</span>
          <span className="text-text-primary">{legacyFipsSessions}</span>
        </div>
        {failedGeocodings > 0 && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#ba1a1a]">Failed:</span>
            <span className="text-[#ba1a1a]">{failedGeocodings}</span>
          </div>
        )}
        {cachedResults > 0 && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-text-tertiary">Cache hit rate:</span>
            <span className="text-text-primary">{cacheHitRate.toFixed(1)}%</span>
          </div>
        )}
      </div>
      
      {successRate < 90 && (
        <div className="mt-sm p-sm bg-[#ffddb5] border border-[#fcab29]/40 rounded-sm">
          <p className="font-body text-[11px] text-[#835400]">
            Some sessions lack location data. Enable GPS tracking for better insights.
          </p>
        </div>
      )}
    </div>
  );
}