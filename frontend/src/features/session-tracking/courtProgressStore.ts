import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import { fetchCourtProgress, type CourtProgressResponse } from '@/lib/courtProgressApi';
import { getServiceType } from '@/lib/supabase';

const STORAGE_KEY = '@cugb/courtProgress';

/**
 * Combines the backend's `court_orders`-derived progress with the volunteer's
 * self-selected onboarding service type. A volunteer who picked "Court Ordered" should
 * see this module even before an admin has entered `required_hours`/`due_date` for
 * them — `hasCourtOrder` alone isn't enough to gate on, since that only reflects
 * whether an admin has already configured an order.
 */
export type CourtProgressState = {
  progress: CourtProgressResponse | null;
  isCourtOrderedServiceType: boolean;
};

const INITIAL_STATE: CourtProgressState = { progress: null, isCourtOrderedServiceType: false };

/** Flip to `true` locally to preview the Court Progress card with fake numbers
 * instead of the real `/me/court-progress` response — never commit as `true`. */
const USE_MOCK_COURT_PROGRESS = false;

const MOCK_COURT_PROGRESS: CourtProgressState = {
  isCourtOrderedServiceType: true,
  progress: {
    hasCourtOrder: true,
    requiredHours: 40,
    completedHours: 22.5,
    remainingHours: 17.5,
    dueDate: 'Dec 15, 2026',
    caseReference: 'MOCK-CASE-0001',
    status: 'at_risk',
  },
};

let courtProgress: CourtProgressState = INITIAL_STATE;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function setCourtProgress(next: CourtProgressState) {
  courtProgress = next;
  notify();
  void persistCourtProgress();
}

async function persistCourtProgress() {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(courtProgress));
  } catch (error) {
    console.warn('[courtProgress] persist failed:', error);
  }
}

export function getCourtProgress(): CourtProgressState {
  return USE_MOCK_COURT_PROGRESS ? MOCK_COURT_PROGRESS : courtProgress;
}

export function subscribeCourtProgress(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useCourtProgress(): CourtProgressState {
  return useSyncExternalStore(subscribeCourtProgress, getCourtProgress, getCourtProgress);
}

/** Whether the Court Progress card should render at all — see module doc comment. */
export function shouldShowCourtProgress(state: CourtProgressState): boolean {
  return state.isCourtOrderedServiceType || state.progress?.hasCourtOrder === true;
}

export async function hydrateCourtProgressFromStorage() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }
    const parsed = JSON.parse(raw) as CourtProgressState;
    if (!parsed || typeof parsed !== 'object') {
      return;
    }
    setCourtProgress({ ...INITIAL_STATE, ...parsed });
  } catch (error) {
    console.warn('[courtProgress] hydrate from storage failed:', error);
  }
}

export async function hydrateCourtProgressFromApi() {
  try {
    const [progress, serviceType] = await Promise.all([fetchCourtProgress(), getServiceType()]);
    setCourtProgress({
      progress,
      isCourtOrderedServiceType: serviceType === 'Court Ordered',
    });
  } catch (error) {
    console.warn('[courtProgress] hydrate from API failed:', error);
  }
}

export function resetCourtProgress() {
  setCourtProgress(INITIAL_STATE);
}
