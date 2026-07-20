import { useSyncExternalStore } from 'react';

import { DEFAULT_COUNTRY } from '@/constants/countries';
import type { ServiceType } from '@/constants/serviceTypes';

/** In-memory onboarding gate + profile fields for the prototype (no persistence yet). */
let onboardingComplete = false;
let preferredName = '';
let phoneCountryIso2 = DEFAULT_COUNTRY.iso2;
let phoneDigits = '';
/** First-of-month ISO date string (yyyy-mm-01), or null if not set. */
let birthdayIso: string | null = null;
let serviceType: ServiceType | null = null;

const listeners = new Set<() => void>();

let personalDetailsSnapshot: PersonalDetails = computePersonalDetailsSnapshot();

function notify() {
  personalDetailsSnapshot = computePersonalDetailsSnapshot();
  listeners.forEach((listener) => listener());
}

export function markOnboardingComplete(): void {
  onboardingComplete = true;
}

export function isOnboardingComplete(): boolean {
  return onboardingComplete;
}

/** Saves the preferred/display name from the account-phone details step. */
export function setPreferredName(name: string): void {
  preferredName = name.trim();
  notify();
}

export function getPreferredName(): string {
  return preferredName;
}

/** Saves the phone number (country + national digits) from the account-phone step. */
export function setPhone(countryIso2: string, digits: string): void {
  phoneCountryIso2 = countryIso2;
  phoneDigits = digits;
  notify();
}

export function getPhoneCountryIso2(): string {
  return phoneCountryIso2;
}

export function getPhoneDigits(): string {
  return phoneDigits;
}

/** Saves the birthday (month + year) from the account-details step. */
export function setBirthday(date: Date | null): void {
  birthdayIso = date ? new Date(date.getFullYear(), date.getMonth(), 1).toISOString() : null;
  notify();
}

export function getBirthday(): Date | null {
  return birthdayIso ? new Date(birthdayIso) : null;
}

/** Saves the service type (court ordered, volunteering, etc.) from the account-details step. */
export function setServiceType(value: ServiceType | null): void {
  serviceType = value;
  notify();
}

export function getServiceType(): ServiceType | null {
  return serviceType;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function subscribePreferredName(listener: () => void) {
  return subscribe(listener);
}

export function usePreferredName(): string {
  return useSyncExternalStore(subscribe, getPreferredName, getPreferredName);
}

export type PersonalDetails = {
  preferredName: string;
  phoneCountryIso2: string;
  phoneDigits: string;
  birthday: Date | null;
  serviceType: ServiceType | null;
};

function computePersonalDetailsSnapshot(): PersonalDetails {
  return {
    preferredName,
    phoneCountryIso2,
    phoneDigits,
    birthday: getBirthday(),
    serviceType,
  };
}

function getPersonalDetailsSnapshot(): PersonalDetails {
  return personalDetailsSnapshot;
}

/** Reads all editable personal-details fields as one snapshot, updating on any change. */
export function usePersonalDetails(): PersonalDetails {
  return useSyncExternalStore(subscribe, getPersonalDetailsSnapshot, getPersonalDetailsSnapshot);
}
