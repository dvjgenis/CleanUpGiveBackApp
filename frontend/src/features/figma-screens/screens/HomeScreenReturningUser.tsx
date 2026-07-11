import { returningUserHomeDashboard } from '../mocks/home.returningUser';
import { HomeScreenWithData } from './HomeScreen';

/**
 * Returning-user snapshot of the Home dashboard (populated mock data).
 * Preserved copy of the pre–first-time-user Home screen state.
 */
export function HomeScreenReturningUser() {
  return <HomeScreenWithData data={returningUserHomeDashboard} />;
}
