"use client";

/**
 * Port of the real admin Insights page (`admin/app/(admin)/insights/page.tsx`).
 * Layout: Hours & submissions trend → queue age / decisions / court progress →
 * three donuts → US heatmap. `sessions`/`courtProgress` are fetched live from
 * Supabase by `admin-web-app/src/app/insights/page.tsx` and `.../analytics/page.tsx`
 * (see `@/lib/live-data`), falling back to mock fixtures when those tables are
 * empty — same prop-drilling pattern as `SessionsPage`/`DashboardPage`. Chart
 * data isn't re-scoped by the period range yet. Court progress shows View more
 * when there are more than 5 rows.
 */
import { Suspense, useState, useEffect } from "react";
import {
  MOCK_SESSIONS,
  MOCK_COURT_PROGRESS,
  buildQueueAgeBars,
  buildTrendSeries,
  buildDecisionBars,
  buildCourtProgressBars,
  buildGeoActivity,
  type MockSession,
  type MockCourtVolunteer,
} from "@/lib/mock-data";
import { PeriodToggle } from "@/components/ui/PeriodToggle";
import { usePeriodLabel, usePeriodSelection } from "@/components/ui/PeriodToggleBar";
import { filterByPeriod } from "@/lib/dashboard-period";
import { TrendAreaChart } from "@/components/ui/TrendAreaChart";
import { HorizontalBarChart } from "@/components/ui/HorizontalBarChart";
import { CourtProgressChart } from "@/components/ui/CourtProgressChart";
import { DonutChart } from "@/components/ui/DonutChart";
import { UsHeatmap } from "@/components/dashboard/UsHeatmap";
import { EnhancedUsHeatmap } from "@/components/ui/EnhancedUsHeatmap";
import { SampleDataBanner } from "@/components/ui/SampleDataBanner";
import { buildEnhancedGeoActivity, createMockSessionsWithGPS } from "@/lib/enhanced-geo-activity";

const ACTIVITY_COLORS = ["#007536", "#5a8f3a", "#835400", "#3d8f5c", "#6e7a6c"];

/**
 * Wrapper component that handles async geocoding for the enhanced heatmap.
 */
function EnhancedGeoHeatmapWrapper({ 
  sessions, 
  periodLabel, 
  isMock 
}: { 
  sessions: MockSession[]; 
  periodLabel: string; 
  isMock: boolean; 
}) {
  const [enhancedActivity, setEnhancedActivity] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function loadEnhancedActivity() {
      setIsLoading(true);
      try {
        // For demo purposes, mix real sessions with GPS-enabled mock sessions
        const gpsEnabledSessions = createMockSessionsWithGPS();
        const legacySessions = sessions.map(s => ({
          id: s.id,
          status: s.status,
          duration_seconds: s.duration_seconds,
          adjusted_hours: s.adjusted_hours,
          state_fips: s.state_fips,
        }));
        
        const allSessions = [...legacySessions, ...gpsEnabledSessions];
        const activity = await buildEnhancedGeoActivity(allSessions);
        setEnhancedActivity(activity);
      } catch (error) {
        console.error('Failed to build enhanced geo activity:', error);
        // Fallback to regular heatmap
        setEnhancedActivity({
          byState: buildGeoActivity(sessions).byState,
          byCounty: [],
          byNeighborhood: [],
          geocodingStats: {
            totalSessions: sessions.length,
            geocodedSessions: 0,
            failedGeocodings: 0,
            cachedResults: 0,
          },
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    loadEnhancedActivity();
  }, [sessions]);
  
  if (isLoading) {
    return (
      <div className="bg-bg-surface border border-border-outline rounded-md p-lg">
        <div className="animate-pulse">
          <div className="h-6 w-48 bg-bg-surface-elevated rounded mb-md" />
          <div className="h-64 bg-bg-surface-elevated rounded" />
        </div>
      </div>
    );
  }
  
  if (!enhancedActivity) {
    // Fallback to regular heatmap on error
    return <UsHeatmap activity={buildGeoActivity(sessions)} periodLabel={periodLabel} isMock={isMock} />;
  }
  
  return <EnhancedUsHeatmap activity={enhancedActivity} periodLabel={periodLabel} isMock={isMock} />;
}

export function AnalyticsPage({
  sessions = MOCK_SESSIONS,
  courtProgress = MOCK_COURT_PROGRESS,
  isMock = false,
  useEnhancedGeocoding = false,
}: {
  sessions?: MockSession[];
  courtProgress?: MockCourtVolunteer[];
  isMock?: boolean;
  useEnhancedGeocoding?: boolean;
}) {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto">
          <div className="h-11 w-full bg-bg-surface-elevated rounded-sm animate-pulse mb-lg" />
        </div>
      }
    >
      <AnalyticsPageInner 
        sessions={sessions} 
        courtProgress={courtProgress} 
        isMock={isMock}
        useEnhancedGeocoding={useEnhancedGeocoding}
      />
    </Suspense>
  );
}

function AnalyticsPageInner({
  sessions,
  courtProgress,
  isMock,
  useEnhancedGeocoding,
}: {
  sessions: MockSession[];
  courtProgress: MockCourtVolunteer[];
  isMock: boolean;
  useEnhancedGeocoding: boolean;
}) {
  const now = new Date();
  const selection = usePeriodSelection();
  const periodLabelText = usePeriodLabel(now);

  // Filter sessions by the selected period
  const filteredSessions = filterByPeriod(sessions, selection, now);

  const underReview = filteredSessions.filter((s) => s.status === "under_review");
  const approved = filteredSessions.filter((s) => s.status === "approved");
  const declined = filteredSessions.filter((s) => s.status === "not_approved");
  const totalSessions = filteredSessions.length;

  const statusSlices = [
    { name: "Approved", value: approved.length, color: "#007536" },
    { name: "Under Review", value: underReview.length, color: "#fcab29" },
    { name: "Declined", value: declined.length, color: "#ba1a1a" },
  ].filter((s) => s.value > 0);

  const activityMap: Record<string, number> = {};
  for (const s of filteredSessions) {
    const key = s.activity?.trim() || "Other";
    activityMap[key] = (activityMap[key] ?? 0) + 1;
  }
  const sortedActivities = Object.entries(activityMap).sort((a, b) => b[1] - a[1]);
  const topActivities = sortedActivities.slice(0, 4);
  const otherCount = sortedActivities.slice(4).reduce((sum, [, v]) => sum + v, 0);
  const activitySlices = [
    ...topActivities.map(([name, value], i) => ({
      name,
      value,
      color: ACTIVITY_COLORS[i] ?? "#6e7a6c",
    })),
    ...(otherCount > 0 ? [{ name: "Other", value: otherCount, color: "#6e7a6c" }] : []),
  ];

  const courtOrdered = approved.filter((s) => s.court_ordered).length;
  const voluntary = approved.length - courtOrdered;
  const courtSlices = [
    { name: "Voluntary", value: voluntary, color: "#007536" },
    { name: "Court-ordered", value: courtOrdered, color: "#835400" },
  ].filter((s) => s.value > 0);

  return (
    <div className="max-w-6xl mx-auto">
      <header className="flex flex-col gap-md mb-lg">
        <div className="flex items-start justify-between gap-md">
          <div>
            <h1 className="font-heading text-[28px] sm:text-[32px] leading-[36px] sm:leading-[40px] text-text-primary">Insights</h1>
            <p className="mt-xs font-body text-[14px] text-text-tertiary">{periodLabelText}</p>
          </div>
          
          {/* Enhanced Geocoding Toggle */}
          <div className="flex items-center gap-sm">
            <label className="flex items-center gap-xs cursor-pointer">
              <input
                type="checkbox"
                checked={useEnhancedGeocoding}
                onChange={(e) => {
                  // This would need to be lifted up to parent component in a real implementation
                  console.log('Enhanced geocoding toggle:', e.target.checked);
                }}
                className="w-4 h-4 text-primary bg-bg-surface border-border-outline rounded focus:ring-primary focus:ring-2"
              />
              <span className="font-data text-[12px] text-text-tertiary">Enhanced Geocoding</span>
            </label>
          </div>
        </div>
        <PeriodToggle selection={selection} />
      </header>

      {isMock && <SampleDataBanner />}

      <div className="flex flex-col gap-md">
        <TrendAreaChart
          title="Hours & submissions"
          subtitle={periodLabelText}
          data={buildTrendSeries(filteredSessions)}
          index={0}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-md">
          <HorizontalBarChart
            title="How long sessions wait"
            subtitle="Under review, by age"
            data={buildQueueAgeBars(underReview, now)}
            emptyLabel="No sessions waiting for review"
            index={1}
          />
          <HorizontalBarChart
            title="Decisions"
            data={buildDecisionBars(filteredSessions)}
            index={2}
          />
          <CourtProgressChart
            title="Court progress"
            data={buildCourtProgressBars(courtProgress)}
            index={3}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-md">
          <DonutChart title="Session Status" data={statusSlices} total={totalSessions} index={4} />
          <DonutChart title="Activity Types" data={activitySlices} total={totalSessions} index={5} />
          <DonutChart
            title="Approved — Session Type"
            data={courtSlices}
            total={courtOrdered + voluntary}
            index={6}
          />
        </div>
        {useEnhancedGeocoding ? (
          <EnhancedGeoHeatmapWrapper 
            sessions={filteredSessions} 
            periodLabel={periodLabelText} 
            isMock={isMock} 
          />
        ) : (
          <UsHeatmap activity={buildGeoActivity(filteredSessions)} periodLabel={periodLabelText} isMock={isMock} />
        )}
      </div>
    </div>
  );
}
