export type DonationHistoryItem = {
  id: string;
  dateLabel: string;
  amountLabel: string;
};

/** Mock donations for Donation History (Figma `donation_history`, node `854:205`). */
export const defaultDonationHistory: DonationHistoryItem[] = [
  {
    id: 'don-2026-06-03',
    dateLabel: 'June 3, 2026',
    amountLabel: '$25.00',
  },
  {
    id: 'don-2026-04-15',
    dateLabel: 'April 15, 2026',
    amountLabel: '$10.00',
  },
];
