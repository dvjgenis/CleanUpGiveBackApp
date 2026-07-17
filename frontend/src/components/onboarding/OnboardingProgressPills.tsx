import { colors as C, radius } from '@/features/figma-screens/tokens';
import { StyleSheet, View } from 'react-native';

/** Figma ProgressPills — 6-step onboarding indicator (create → details → location → camera → free-hour → notif). */
export function OnboardingProgressPills({
  total = 6,
  active = 1,
}: {
  total?: number;
  /** Number of filled pills from the left (1–total). */
  active?: number;
}) {
  return (
    <View style={styles.pillsRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.pill,
            i < active
              ? { backgroundColor: C.primary }
              : { backgroundColor: 'transparent', borderWidth: 1, borderColor: C.borderOutline },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    flex: 1,
    height: 4,
    borderRadius: radius.full,
  },
});
