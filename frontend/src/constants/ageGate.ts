import { ageFromBirthday } from '@/features/figma-screens/components/BirthdayPickerModal';

/** COPPA minimum age — users must be at least 13 (under 13 is blocked). */
export const MINIMUM_APP_AGE = 13;

export function isUnderMinimumAge(birthday: Date): boolean {
  return ageFromBirthday(birthday) < MINIMUM_APP_AGE;
}
