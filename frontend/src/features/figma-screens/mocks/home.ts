import type { HomeDashboardData, ImpactStat, RecentSessionSummary, UpcomingEventSummary } from './home.types';
import { getCurrentWeekMeta } from '../utils/weekCalendar';

export type { HomeDashboardData, ImpactStat, RecentSessionSummary, UpcomingEventSummary };

/**
 * Mock location-mapped remote thumbnails (stand-in for Google Places photos).
 * Keys are stable Unsplash Source URLs keyed by Des Plaines / Mt Prospect venues.
 */
const EVENT_IMAGE_BY_LOCATION: Record<string, { uri: string }> = {
  '600 E Algonquin Rd, Des Plaines, IL 60016, USA': {
    uri: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80',
  },
  '1425 N McKinley Rd, Des Plaines, IL 60016, USA': {
    uri: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80',
  },
  '2200 E Algonquin Rd, Mt Prospect, IL 60056, USA': {
    uri: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80',
  },
  '800 Central Rd, Glenview, IL 60025, USA': {
    uri: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80',
  },
};

function eventImageForLocation(location: string): { uri: string } {
  return (
    EVENT_IMAGE_BY_LOCATION[location] ?? {
      uri: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80',
    }
  );
}

export { eventImageForLocation };

/** First-time user — empty stats; week fields are merged at render time in `HomeScreen`. */
export const firstTimeHomeDashboard: HomeDashboardData = {
  homeUser: { firstName: 'Shivam' },
  weeklyStreakHours: 0,
  serviceHoursTotalLabel: '0.0 hrs',
  ...getCurrentWeekMeta(),
  weeklyHoursChart: [
    { day: 'Mon', value: 0 },
    { day: 'Tue', value: 0 },
    { day: 'Wed', value: 0 },
    { day: 'Thu', value: 0 },
    { day: 'Fri', value: 0 },
    { day: 'Sat', value: 0 },
    { day: 'Sun', value: 0 },
  ],
  impactStats: [
    { id: 'miles', value: '0.0', label: 'MILES COVERED', icon: 'miles' },
    { id: 'locations', value: '0.0', label: 'LOCATIONS CLEANED', icon: 'locations' },
    { id: 'sessions', value: '0.0', label: 'SESSIONS COMPLETED', icon: 'sessions' },
    { id: 'photos', value: '0.0', label: 'PHOTOS SUBMITTED', icon: 'photos' },
  ],
  recentSessions: [],
  recentEvents: [
    {
      id: 'ev-1',
      title: 'Community Clean-Up Day',
      day: '20',
      month: 'July',
      weekday: 'Mon',
      year: '2026',
      location: '600 E Algonquin Rd, Des Plaines, IL 60016, USA',
      timeLabel: '10:30 AM - 12:30 PM',
      organization: 'D214 Life Program',
      image: eventImageForLocation('600 E Algonquin Rd, Des Plaines, IL 60016, USA'),
    },
    {
      id: 'ev-2',
      title: 'McKinley Park Restoration',
      day: '27',
      month: 'July',
      weekday: 'Mon',
      year: '2026',
      location: '1425 N McKinley Rd, Des Plaines, IL 60016, USA',
      timeLabel: '9:00 AM - 11:00 AM',
      organization: 'Park District Volunteer Corps',
      image: eventImageForLocation('1425 N McKinley Rd, Des Plaines, IL 60016, USA'),
    },
    {
      id: 'ev-3',
      title: 'Mt Prospect Trail Clean-Up',
      day: '3',
      month: 'August',
      weekday: 'Mon',
      year: '2026',
      location: '2200 E Algonquin Rd, Mt Prospect, IL 60056, USA',
      timeLabel: '1:00 PM - 3:30 PM',
      organization: 'Northwest Community Partners',
      image: eventImageForLocation('2200 E Algonquin Rd, Mt Prospect, IL 60056, USA'),
    },
  ],
  allEvents: [
    {
      id: 'ev-1',
      title: 'Community Clean-Up Day',
      day: '20',
      month: 'July',
      weekday: 'Mon',
      year: '2026',
      location: '600 E Algonquin Rd, Des Plaines, IL 60016, USA',
      timeLabel: '10:30 AM - 12:30 PM',
      organization: 'D214 Life Program',
      image: eventImageForLocation('600 E Algonquin Rd, Des Plaines, IL 60016, USA'),
    },
    {
      id: 'ev-2',
      title: 'McKinley Park Restoration',
      day: '27',
      month: 'July',
      weekday: 'Mon',
      year: '2026',
      location: '1425 N McKinley Rd, Des Plaines, IL 60016, USA',
      timeLabel: '9:00 AM - 11:00 AM',
      organization: 'Park District Volunteer Corps',
      image: eventImageForLocation('1425 N McKinley Rd, Des Plaines, IL 60016, USA'),
    },
    {
      id: 'ev-3',
      title: 'Mt Prospect Trail Clean-Up',
      day: '3',
      month: 'August',
      weekday: 'Mon',
      year: '2026',
      location: '2200 E Algonquin Rd, Mt Prospect, IL 60056, USA',
      timeLabel: '1:00 PM - 3:30 PM',
      organization: 'Northwest Community Partners',
      image: eventImageForLocation('2200 E Algonquin Rd, Mt Prospect, IL 60056, USA'),
    },
    {
      id: 'ev-4',
      title: 'Glenview Central Park Day',
      day: '10',
      month: 'August',
      weekday: 'Mon',
      year: '2026',
      location: '800 Central Rd, Glenview, IL 60025, USA',
      timeLabel: '8:30 AM - 10:30 AM',
      organization: 'Glenview Green Team',
      image: eventImageForLocation('2200 E Algonquin Rd, Mt Prospect, IL 60056, USA'),
    },
  ],
  notificationCount: 0,
};
