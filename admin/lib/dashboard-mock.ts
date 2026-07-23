/** Shared dashboard / court mock fixtures for local preview when DB is empty. */

export type MockSession = {
  id: string;
  user_id: string;
  volunteer_name: string;
  activity: string | null;
  status: string;
  duration_seconds: number | null;
  adjusted_hours: number | null;
  court_ordered: boolean;
  distance_miles: number | null;
  started_at: string;
  ended_at: string;
  created_at: string;
  /** Mock neighborhood for metro heatmap */
  neighborhood_id: string;
};

export type MockCourtVolunteer = {
  id: string;
  name: string;
  email: string;
  requiredHours: number;
  completedHours: number;
  sessions: number;
  status: 'in_progress' | 'at_risk' | 'completed';
  dueDate: string;
};

export const MOCK_SESSIONS: MockSession[] = [
  {
    id: 'm1',
    user_id: 'u1',
    volunteer_name: 'Maya Chen',
    activity: 'Park Cleanup',
    status: 'approved',
    duration_seconds: 5400,
    adjusted_hours: null,
    court_ordered: false,
    distance_miles: 2.3,
    started_at: '2026-07-14T09:00:00Z',
    ended_at: '2026-07-14T10:30:00Z',
    created_at: '2026-07-14T10:35:00Z',
    neighborhood_id: 'oak-hills',
  },
  {
    id: 'm2',
    user_id: 'u2',
    volunteer_name: 'Jordan Lee',
    activity: 'Beach Cleanup',
    status: 'approved',
    duration_seconds: 7200,
    adjusted_hours: null,
    court_ordered: true,
    distance_miles: 3.1,
    started_at: '2026-07-13T08:30:00Z',
    ended_at: '2026-07-13T10:30:00Z',
    created_at: '2026-07-13T10:40:00Z',
    neighborhood_id: 'harbor',
  },
  {
    id: 'm3',
    user_id: 'u3',
    volunteer_name: 'Isaiah Grant',
    activity: 'Trail Cleanup',
    status: 'under_review',
    duration_seconds: 3600,
    adjusted_hours: null,
    court_ordered: false,
    distance_miles: 1.8,
    started_at: '2026-07-12T10:00:00Z',
    ended_at: '2026-07-12T11:00:00Z',
    created_at: '2026-07-12T11:05:00Z',
    neighborhood_id: 'riverside',
  },
  {
    id: 'm4',
    user_id: 'u4',
    volunteer_name: 'Priya Nair',
    activity: 'Neighborhood Cleanup',
    status: 'approved',
    duration_seconds: 4500,
    adjusted_hours: null,
    court_ordered: true,
    distance_miles: 2.0,
    started_at: '2026-07-11T09:00:00Z',
    ended_at: '2026-07-11T10:15:00Z',
    created_at: '2026-07-11T10:20:00Z',
    neighborhood_id: 'midtown',
  },
  {
    id: 'm5',
    user_id: 'u5',
    volunteer_name: 'Sam Ortiz',
    activity: 'River Cleanup',
    status: 'not_approved',
    duration_seconds: 2700,
    adjusted_hours: null,
    court_ordered: false,
    distance_miles: 1.2,
    started_at: '2026-07-10T11:00:00Z',
    ended_at: '2026-07-10T11:45:00Z',
    created_at: '2026-07-10T11:50:00Z',
    neighborhood_id: 'riverside',
  },
  {
    id: 'm6',
    user_id: 'u1',
    volunteer_name: 'Maya Chen',
    activity: 'Park Cleanup',
    status: 'approved',
    duration_seconds: 6300,
    adjusted_hours: null,
    court_ordered: false,
    distance_miles: 2.8,
    started_at: '2026-07-09T08:00:00Z',
    ended_at: '2026-07-09T09:45:00Z',
    created_at: '2026-07-09T09:50:00Z',
    neighborhood_id: 'university',
  },
  {
    id: 'm7',
    user_id: 'u6',
    volunteer_name: 'Nadia Flores',
    activity: 'Beach Cleanup',
    status: 'under_review',
    duration_seconds: 3900,
    adjusted_hours: null,
    court_ordered: true,
    distance_miles: 1.5,
    started_at: '2026-07-08T09:30:00Z',
    ended_at: '2026-07-08T10:35:00Z',
    created_at: '2026-07-08T10:40:00Z',
    neighborhood_id: 'harbor',
  },
  {
    id: 'm8',
    user_id: 'u7',
    volunteer_name: 'Tyler Washington',
    activity: 'Highway Litter Pick',
    status: 'approved',
    duration_seconds: 5100,
    adjusted_hours: 2.0,
    court_ordered: true,
    distance_miles: 3.5,
    started_at: '2026-07-07T07:00:00Z',
    ended_at: '2026-07-07T08:25:00Z',
    created_at: '2026-07-07T08:30:00Z',
    neighborhood_id: 'industrial',
  },
  {
    id: 'm9',
    user_id: 'u8',
    volunteer_name: 'Alex Rivera',
    activity: 'Trail Cleanup',
    status: 'approved',
    duration_seconds: 4200,
    adjusted_hours: null,
    court_ordered: false,
    distance_miles: 2.1,
    started_at: '2026-07-06T10:00:00Z',
    ended_at: '2026-07-06T11:10:00Z',
    created_at: '2026-07-06T11:15:00Z',
    neighborhood_id: 'oak-hills',
  },
  {
    id: 'm10',
    user_id: 'u9',
    volunteer_name: 'Aaliyah Brooks',
    activity: 'Neighborhood Cleanup',
    status: 'under_review',
    duration_seconds: 3300,
    adjusted_hours: null,
    court_ordered: false,
    distance_miles: 1.7,
    started_at: '2026-07-05T09:00:00Z',
    ended_at: '2026-07-05T09:55:00Z',
    created_at: '2026-07-05T10:00:00Z',
    neighborhood_id: 'southside',
  },
  {
    id: 'm11',
    user_id: 'u2',
    volunteer_name: 'Jordan Lee',
    activity: 'Park Cleanup',
    status: 'approved',
    duration_seconds: 7800,
    adjusted_hours: null,
    court_ordered: true,
    distance_miles: 4.0,
    started_at: '2026-07-04T08:00:00Z',
    ended_at: '2026-07-04T10:10:00Z',
    created_at: '2026-07-04T10:15:00Z',
    neighborhood_id: 'lakefront',
  },
  {
    id: 'm12',
    user_id: 'u10',
    volunteer_name: 'Chris Park',
    activity: 'River Cleanup',
    status: 'invalid',
    duration_seconds: 600,
    adjusted_hours: null,
    court_ordered: false,
    distance_miles: 0.3,
    started_at: '2026-07-03T12:00:00Z',
    ended_at: '2026-07-03T12:10:00Z',
    created_at: '2026-07-03T12:12:00Z',
    neighborhood_id: 'riverside',
  },
  {
    id: 'm13',
    user_id: 'u1',
    volunteer_name: 'Maya Chen',
    activity: 'Park Cleanup',
    status: 'approved',
    duration_seconds: 4800,
    adjusted_hours: null,
    court_ordered: false,
    distance_miles: 2.0,
    started_at: '2026-06-20T09:00:00Z',
    ended_at: '2026-06-20T10:20:00Z',
    created_at: '2026-06-20T10:25:00Z',
    neighborhood_id: 'university',
  },
  {
    id: 'm14',
    user_id: 'u4',
    volunteer_name: 'Priya Nair',
    activity: 'Beach Cleanup',
    status: 'approved',
    duration_seconds: 5400,
    adjusted_hours: null,
    court_ordered: true,
    distance_miles: 2.4,
    started_at: '2026-06-12T08:00:00Z',
    ended_at: '2026-06-12T09:30:00Z',
    created_at: '2026-06-12T09:35:00Z',
    neighborhood_id: 'harbor',
  },
];

export const MOCK_COURT_AT_RISK: MockCourtVolunteer[] = [
  {
    id: 'c5',
    name: 'Isaiah Grant',
    email: 'isaiah.g@email.com',
    requiredHours: 25,
    completedHours: 7.0,
    sessions: 3,
    status: 'at_risk',
    dueDate: '2026-07-31',
  },
  {
    id: 'c8',
    name: 'Nadia Flores',
    email: 'nadia.f@email.com',
    requiredHours: 45,
    completedHours: 12.5,
    sessions: 5,
    status: 'at_risk',
    dueDate: '2026-07-28',
  },
  {
    id: 'c3',
    name: 'Aaliyah Brooks',
    email: 'aaliyah.b@email.com',
    requiredHours: 20,
    completedHours: 9.5,
    sessions: 4,
    status: 'in_progress',
    dueDate: '2026-08-01',
  },
];

export const MOCK_FEEDBACK_AVG = 4.2;
export const MOCK_OPEN_ORDERS = 4;
