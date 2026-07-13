import type { MapCoordinate } from '../utils/openLocationInMaps';

export type WhatToBringIcon = 'clothing' | 'water' | 'shoes';

export type WhatToBringItem = {
  id: string;
  icon: WhatToBringIcon;
  label: string;
};

export type EventOrganizer = {
  name: string;
  bio: string;
  image: number;
};

export type EventDetail = {
  id: string;
  title: string;
  statusLabel: string;
  registeredCount: number;
  dateTimeLabel: string;
  addressShort: string;
  overview: string;
  organizer: EventOrganizer;
  whatToBring: WhatToBringItem[];
  locationName: string;
  locationAddress: string;
  /** WGS84 pin for the location map + Apple/Google Maps deep link. */
  coordinate: MapCoordinate;
  headerImages: number[];
};

const HEADER = require('@/assets/figma/event-detail/header.png');
const ORGANIZER = require('@/assets/figma/event-detail/organizer.png');

const DEFAULT_WHAT_TO_BRING: WhatToBringItem[] = [
  {
    id: 'clothing',
    icon: 'clothing',
    label: 'Comfortable, weather-appropriate clothing',
  },
  {
    id: 'water',
    icon: 'water',
    label: 'Water bottle',
  },
  {
    id: 'shoes',
    icon: 'shoes',
    label: 'Closed-toe shoes',
  },
];

/** Figma `events_detail` (`196:226`) — Downtown Riverfront Clean-up. */
export const downtownRiverfrontEvent: EventDetail = {
  id: 'ev-1',
  title: 'Downtown Riverfront Clean-up',
  statusLabel: 'UPCOMING',
  registeredCount: 14,
  dateTimeLabel: 'July 15 at 5PM',
  addressShort: '600 E Algonquin Rd, Des Plaines, IL, 60018',
  overview:
    "Join us for a community clean-up at the downtown riverfront! Let's come together to beautify our local waterways and enjoy a day of teamwork and fun. Bring your friends and family, and help us make a difference!",
  organizer: {
    name: 'D214 Life Program',
    bio: "Our schools are designed to serve students' unique needs with a focus on post-school success.",
    image: ORGANIZER,
  },
  whatToBring: DEFAULT_WHAT_TO_BRING,
  locationName: 'Clean Up - Give Back',
  locationAddress: '600 E Algonquin Rd, Des Plaines, IL, 60018',
  // Approximate pin for 600 E Algonquin Rd, Des Plaines, IL
  coordinate: { latitude: 42.0417, longitude: -87.887 },
  headerImages: [HEADER, HEADER, HEADER, HEADER],
};

const EVENT_DETAILS: Record<string, EventDetail> = {
  'ev-1': downtownRiverfrontEvent,
  'ev-2': {
    ...downtownRiverfrontEvent,
    id: 'ev-2',
    title: 'McKinley Road Clean-up',
    registeredCount: 9,
    dateTimeLabel: 'July 27 at 9AM',
    addressShort: '1425 N McKinley Rd, Des Plaines, IL, 60016',
    locationAddress: '1425 N McKinley Rd, Des Plaines, IL, 60016',
    coordinate: { latitude: 42.0512, longitude: -87.9005 },
    organizer: {
      name: 'Park District Volunteer Corps',
      bio: 'Local volunteers keeping Des Plaines parks and trails clean year-round.',
      image: ORGANIZER,
    },
  },
  'ev-3': {
    ...downtownRiverfrontEvent,
    id: 'ev-3',
    title: 'Mt Prospect Trail Clean-up',
    registeredCount: 11,
    dateTimeLabel: 'August 3 at 1PM',
    addressShort: '2200 E Algonquin Rd, Mt Prospect, IL, 60056',
    locationAddress: '2200 E Algonquin Rd, Mt Prospect, IL, 60056',
    coordinate: { latitude: 42.0458, longitude: -87.9372 },
    organizer: {
      name: 'Northwest Community Partners',
      bio: 'Community partners organizing neighborhood clean-ups across the northwest suburbs.',
      image: ORGANIZER,
    },
  },
  'ev-4': {
    ...downtownRiverfrontEvent,
    id: 'ev-4',
    title: 'Glenview Central Clean-up',
    registeredCount: 6,
    dateTimeLabel: 'August 10 at 8:30AM',
    addressShort: '800 Central Rd, Glenview, IL, 60025',
    locationAddress: '800 Central Rd, Glenview, IL, 60025',
    coordinate: { latitude: 42.0696, longitude: -87.7874 },
    organizer: {
      name: 'Glenview Green Team',
      bio: 'Neighbors working together to keep Glenview green and litter-free.',
      image: ORGANIZER,
    },
  },
};

export function getEventDetail(id: string | undefined): EventDetail {
  if (id && EVENT_DETAILS[id]) {
    return EVENT_DETAILS[id];
  }
  return downtownRiverfrontEvent;
}
