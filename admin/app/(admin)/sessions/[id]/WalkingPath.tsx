interface Props {
  distanceMiles: number | null;
  /** Point count from `sessions.route` (jsonb) when it's an array; null when unknown/absent. */
  pointCount: number | null;
}

/**
 * Placeholder for the GPS walking-path map. `sessions.route` (jsonb) already stores
 * breadcrumb points from the mobile app, but no map renderer is wired up yet — this
 * shows an honest "coming soon" state instead of silently omitting the section.
 */
export function WalkingPath({ distanceMiles, pointCount }: Props) {
  const hasRoute = pointCount != null && pointCount > 0;

  return (
    <section className="bg-bg-surface border border-border-outline rounded-md p-lg">
      <div className="flex items-center justify-between mb-md">
        <h2 className="font-heading text-[20px] leading-[28px] text-text-primary">Walking Path</h2>
        {distanceMiles != null && (
          <span className="font-data text-[12px] text-text-tertiary">{distanceMiles.toFixed(2)} mi logged</span>
        )}
      </div>
      <div className="relative aspect-[16/9] rounded-sm border border-dashed border-border-outline bg-bg-surface-elevated overflow-hidden">
        <svg
          viewBox="0 0 320 160"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full opacity-50"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M24 130 C 70 40, 120 150, 165 70 S 250 20, 296 60"
            stroke="#009540"
            strokeWidth="3"
            strokeDasharray="7 7"
            strokeLinecap="round"
          />
          <circle cx="24" cy="130" r="5" fill="#009540" />
          <circle cx="296" cy="60" r="5" fill="#ba1a1a" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center px-lg">
          <div className="text-center bg-bg-surface/90 rounded-sm px-md py-sm">
            <p className="font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary">Map view — coming soon</p>
            <p className="font-body text-[13px] text-text-tertiary mt-xs">
              {hasRoute
                ? `GPS route logged (${pointCount} point${pointCount !== 1 ? 's' : ''})`
                : 'No GPS route recorded for this session'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
