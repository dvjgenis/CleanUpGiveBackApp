# Admin chart types — recommendations & implementation

**Date:** 2026-07-22  
**Constraint:** Charts stay behind **Show charts** on Today — never compete with Donna’s review queue.

## Useful types (and why)

| Chart | Why it helps Donna | Why not clutter |
|-------|--------------------|-----------------|
| **Area / dual trend** — approved hours + submissions over time | Answers “is volume up or down?” for board updates and staffing her review day | One full-width panel; period-scoped |
| **Horizontal bars — queue age** | Shows backlog health (≤1d vs 8+ days waiting) | Purely operational; empty when queue is clear |
| **Horizontal bars — decisions** | Approved / declined / still reviewing mix for the period | Replaces a fourth donut with a clearer ranking |
| **Progress bars — court hours** | Who is behind on required hours at a glance | Complements court cards; only at-risk set |
| **Donuts (kept)** — status, activity, voluntary vs court | Composition snapshots for reporting | Grouped under a **Composition** label |

## Explicitly skipped (for now)

| Type | Reason |
|------|--------|
| Geo choropleth on the charts row | Already optional under Neighborhood map |
| Real-time streaming charts | Calm ops UI; period refresh is enough |
| Radar / sankey / funnels | Overkill for a single-admin program portal |
| Big calendar heatmap | Weak signal vs queue age + trend |

## Implementation

- Helpers: `admin/lib/dashboard-charts.ts`
- UI: `TrendAreaChart`, `HorizontalBarChart`, `CourtProgressChart`
- Wired in `DashboardWorkbench` Charts disclosure + `app/(admin)/page.tsx` `chartExtras`
