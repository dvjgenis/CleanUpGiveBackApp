import { StyleSheet, View } from 'react-native';

import { colors, radius } from '../tokens';

type Props = {
  /** Total number of steps in the Session Setup wizard. */
  total: number;
  /** 0-indexed current step. */
  currentIndex: number;
};

/**
 * Step indicator for the Session Setup wizard — matches the Figma
 * `ProgressPills` component seen on the permission frames (728:639/728:658):
 * completed/current pills filled `color/primary`, remaining pills
 * `color/border/outline`.
 */
export function ProgressPills({ total, currentIndex }: Props) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }, (_, index) => (
        <View
          key={index}
          style={[
            styles.pill,
            { backgroundColor: index <= currentIndex ? colors.primary : colors.borderOutline },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  pill: {
    flex: 1,
    height: 4,
    borderRadius: radius.full,
  },
});
