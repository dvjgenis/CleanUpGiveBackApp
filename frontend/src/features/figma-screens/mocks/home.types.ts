/** Shared mock shapes for Home dashboard variants. */

export type ImpactStat = {
  id: string;
  value: string;
  label: string;
  icon: 'miles' | 'locations' | 'sessions' | 'photos';
};

export type RecentSessionSummary = {
  id: string;
  title: string;
  dateLabel: string;
  timeLabel: string;
  durationLabel: string;
};

export type UpcomingEventSummary = {
  id: string;
  day: string;
  month: string;
  weekday: string;
  year: string;
  location: string;
  timeLabel: string;
  organization: string;
};

export type WeeklyHoursDatum = {
  day: string;
  value: number;
};

export type HomeDashboardData = {
  homeUser: { firstName: string };
  weeklyStreakHours: number;
  serviceHoursTotalLabel: string;
  weekRangeLabel: string;
  weekNumberLabel: string;
  /** ISO date (`YYYY-MM-DD`) for the Monday that starts the default chart week. */
  weekStartIso: string;
  weeklyHoursChart: readonly WeeklyHoursDatum[];
  impactStats: ImpactStat[];
  recentSessions: RecentSessionSummary[];
  /** Preview list shown on the home card. */
  recentEvents: UpcomingEventSummary[];
  /** Full catalog shown in the View All events modal. */
  allEvents: UpcomingEventSummary[];
  notificationCount: number;
};
