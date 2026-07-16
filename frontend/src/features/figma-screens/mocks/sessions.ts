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

/** Production sessions list — populated from the Fly API when configured. */
export const mockSessionsList: SessionListItem[] = [];

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
