export type SessionApprovalStatus = 'approved' | 'pending' | 'declined';

export type SessionListFilter = 'all' | 'approved' | 'under-review' | 'declined';

export type SessionSortOption = 'most-recent' | 'oldest-first' | 'title-az' | 'title-za';

export type SessionListItem = {
  id: string;
  title: string;
  dateLabel: string;
  timeLabel: string;
  /** ISO date for sorting (session start day). */
  sortDate: string;
  status: SessionApprovalStatus;
};

/** Figma `sessions_list___hybrid_redesign` (node `515:1791`) — mock rows. */
export const mockSessionsList: SessionListItem[] = [
  {
    id: 'lincoln-park',
    title: 'Lincoln Park Beach Cleanup',
    dateLabel: 'Aug 5, 2026',
    timeLabel: '9:00–11:00 AM',
    sortDate: '2026-08-05',
    status: 'approved',
  },
  {
    id: 'north-side',
    title: 'North Side Neighborhood Clean Up',
    dateLabel: 'Sep 10, 2026',
    timeLabel: '10:00 AM–12:00 PM',
    sortDate: '2026-09-10',
    status: 'pending',
  },
  {
    id: 'des-plaines-river',
    title: 'Des Plaines River Trail Clean Up',
    dateLabel: 'Oct 22, 2026',
    timeLabel: '8:00–10:00 AM',
    sortDate: '2026-10-22',
    status: 'approved',
  },
  {
    id: 'community-garden',
    title: 'Community Garden Planting Day',
    dateLabel: 'Nov 12, 2026',
    timeLabel: '1:00–3:00 PM',
    sortDate: '2026-11-12',
    status: 'approved',
  },
  {
    id: 'park-district-trees',
    title: 'Park District Tree Planting',
    dateLabel: 'Dec 9, 2026',
    timeLabel: '10:00 AM–12:00 PM',
    sortDate: '2026-12-09',
    status: 'pending',
  },
  {
    id: 'west-loop',
    title: 'West Loop Litter Cleanup',
    dateLabel: 'Jan 15, 2027',
    timeLabel: '9:00–11:00 AM',
    sortDate: '2027-01-15',
    status: 'approved',
  },
  {
    id: 'south-side',
    title: 'South Side Community Cleanup',
    dateLabel: 'Feb 18, 2027',
    timeLabel: '1:00–3:00 PM',
    sortDate: '2027-02-18',
    status: 'declined',
  },
  {
    id: 'historic-site',
    title: 'Des-Plaines Historic Site Restoration',
    dateLabel: 'Mar 25, 2027',
    timeLabel: '10:00 AM–1:00 PM',
    sortDate: '2027-03-25',
    status: 'declined',
  },
];

export const SESSION_FILTER_CHIPS: { id: SessionListFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'approved', label: 'Approved' },
  { id: 'under-review', label: 'Under Review' },
  { id: 'declined', label: 'Declined' },
];

export const SESSION_SORT_OPTIONS: { id: SessionSortOption; label: string }[] = [
  { id: 'most-recent', label: 'MOST RECENT' },
  { id: 'oldest-first', label: 'OLDEST FIRST' },
  { id: 'title-az', label: 'A–Z' },
  { id: 'title-za', label: 'Z–A' },
];

export function filterMatchesStatus(
  filter: SessionListFilter,
  status: SessionApprovalStatus,
): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'approved':
      return status === 'approved';
    case 'under-review':
      return status === 'pending';
    case 'declined':
      return status === 'declined';
    default: {
      const _exhaustive: never = filter;
      return _exhaustive;
    }
  }
}

export function sortSessions(
  sessions: SessionListItem[],
  sort: SessionSortOption,
): SessionListItem[] {
  const next = [...sessions];
  switch (sort) {
    case 'most-recent':
      return next.sort((a, b) => b.sortDate.localeCompare(a.sortDate));
    case 'oldest-first':
      return next.sort((a, b) => a.sortDate.localeCompare(b.sortDate));
    case 'title-az':
      return next.sort((a, b) => a.title.localeCompare(b.title));
    case 'title-za':
      return next.sort((a, b) => b.title.localeCompare(a.title));
    default: {
      const _exhaustive: never = sort;
      return _exhaustive;
    }
  }
}
