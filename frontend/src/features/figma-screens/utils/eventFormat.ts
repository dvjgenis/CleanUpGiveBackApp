const MONTH_ABBREVIATIONS: Record<string, string> = {
  January: 'Jan',
  February: 'Feb',
  March: 'Mar',
  April: 'Apr',
  August: 'Aug',
  September: 'Sep',
  October: 'Oct',
  November: 'Nov',
  December: 'Dec',
};

/** Shortens full month names for compact event calendar badges (e.g. August → Aug). */
export function formatEventMonthLabel(month: string): string {
  const trimmed = month.trim();
  if (trimmed.length <= 4) {
    return trimmed;
  }

  return MONTH_ABBREVIATIONS[trimmed] ?? trimmed.slice(0, 3);
}
