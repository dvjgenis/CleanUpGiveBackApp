import type { HomeDashboardData, ImpactStat, RecentSessionSummary, UpcomingEventSummary } from './home.types';
import { getCurrentWeekMeta } from '../utils/weekCalendar';

export type { HomeDashboardData, ImpactStat, RecentSessionSummary, UpcomingEventSummary };

/** Event card thumbnails — real photos (shared with event-detail / session scenes). */
const EVENT_IMAGE_HEADER = require('@/assets/figma/event-detail/header.png');
const EVENT_IMAGE_VOLUNTEERS = require('@/assets/images/scenes/volunteers.png');
const EVENT_IMAGE_PARK = require('@/assets/images/screens/session-detail/photo-2.png');
const EVENT_IMAGE_TRAIL = require('@/assets/images/screens/session-detail/photo-4.png');

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
      image: EVENT_IMAGE_HEADER,
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
      image: EVENT_IMAGE_VOLUNTEERS,
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
      image: EVENT_IMAGE_PARK,
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
      image: EVENT_IMAGE_HEADER,
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
      image: EVENT_IMAGE_VOLUNTEERS,
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
      image: EVENT_IMAGE_PARK,
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
      image: EVENT_IMAGE_TRAIL,
    },
  ],
  notificationCount: 0,
};
