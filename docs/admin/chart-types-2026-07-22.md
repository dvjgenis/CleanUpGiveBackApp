# Admin chart types — recommendations & implementation

**Date:** 2026-07-22  
**Updated:** 2026-07-27 — Today surfaces the hours trend + metro heatmap in place of Court Hours / Recent Decisions list tiles; deeper composition charts stay on `/insights`.  
**Constraint:** Charts support Donna's review day — they sit below the review queue, never above it.

## Useful types (and why)

| Chart | Why it helps Donna | Why not clutter |
|-------|--------------------|-----------------|
| **Area / dual trend** — approved hours + submissions over time | Answers “is volume up or down?” for board updates and staffing her review day | Full-width under Review on Today; period-scoped |
| **US heat map** — nation choropleth → state **county bubble heat** → **neighborhood tiles** | Shows where volunteers are cleaning; county bubbles for sparse geography; neighborhood level uses a share strip + heat tiles (count/hours) instead of a schematic polygon map | Full-width under the trend on Today; Census boundaries via us-atlas |
| **Horizontal bars — days waiting** | Shows how long under-review sessions have been waiting (≤1d vs 8+ days) | Insights only; empty when nothing is waiting |
| **Horizontal bars — decisions** | Approved / declined / still reviewing mix for the period | Insights only |
| **Progress bars — court hours** | Who is behind on required hours at a glance | Insights + `/court-hours` |
| **Donuts (kept)** — status, activity, voluntary vs court | Composition snapshots for reporting | Insights Composition row |

## Explicitly skipped (for now)

| Type | Reason |
|------|--------|
| Real-time streaming charts | Calm ops UI; period refresh is enough |
| Radar / sankey / funnels | Overkill for a single-admin program portal |
| Big calendar heatmap | Weak signal vs days-waiting bars + trend |

## Implementation

- Helpers: `admin/lib/dashboard-charts.ts` (bar/trend series) + `admin/lib/dashboard-insights.ts` (composition donuts, neighborhood stats, and the Today Snapshot summary — shared by both views)
- Data loading shared via `admin/lib/dashboard-data.ts` (`loadScopedDashboardData`), so Today and Insights never diverge on the mock/live fallback or period scoping
- Today (`DashboardWorkbench`): `TrendAreaChart` + `UsHeatmap` (US → county → neighborhood drill) under Review/metrics; Snapshot tile still links to `/insights`
- Insights (`insights/page.tsx`): full chart suite including trend, US heat map, waiting/decision bars, court progress, donuts
- Map helpers: `admin/lib/us-geo.ts` (TopoJSON fetch + Albers USA), `admin/lib/us-heatmap.ts` (heat colors + Cook County neighborhood schematic)
- Payments (`/payments`): stacked `RevenueBarChart` (donations + shop, last 6 months) — separate from Insights so money ops stay on their own route
- Metric tiles keep SVG **MiniDonut** / **FeedbackEmojiStrip** visuals
