export type ApprovalStatus = 'approved' | 'underReview' | 'notApproved';

export type ApprovalHistoryItem = {
  id: string;
  sessionNumber: string;
  dateLabel: string;
  durationLabel: string;
  locationLabel: string;
  status: ApprovalStatus;
  note?: string;
};

export type ApprovalHistoryStats = {
  approved: number;
  underReview: number;
  notApproved: number;
};

/** Summary stats for Approval History (Figma `approval_history`, node `854:294`). */
export const defaultApprovalHistoryStats: ApprovalHistoryStats = {
  approved: 14,
  underReview: 3,
  notApproved: 1,
};

/** Mock session rows for Approval History (Figma `854:294`). */
export const defaultApprovalHistory: ApprovalHistoryItem[] = [
  {
    id: 's-0182',
    sessionNumber: 'SESSION #S-0182',
    dateLabel: 'November 14, 2023',
    durationLabel: '2h 15min',
    locationLabel: 'Riverside Park',
    status: 'approved',
  },
  {
    id: 's-0179',
    sessionNumber: 'SESSION #S-0179',
    dateLabel: 'October 29, 2023',
    durationLabel: '1h 45min',
    locationLabel: 'Main Street Trail',
    status: 'approved',
  },
  {
    id: 's-0183',
    sessionNumber: 'SESSION #S-0183',
    dateLabel: 'November 18, 2023',
    durationLabel: '3h 00min',
    locationLabel: 'Oak Valley Beach',
    status: 'underReview',
    note: 'Awaiting admin review. Typically 2–3 business days.',
  },
  {
    id: 's-0171',
    sessionNumber: 'SESSION #S-0171',
    dateLabel: 'September 05, 2023',
    durationLabel: '45min',
    locationLabel: 'Downtown Plaza',
    status: 'notApproved',
    note: 'Reason: Insufficient photo documentation. Please resubmit with before/after photos.',
  },
];
