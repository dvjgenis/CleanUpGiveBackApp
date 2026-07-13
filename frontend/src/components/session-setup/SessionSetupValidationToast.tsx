import { StyleSheet, Text, View } from 'react-native';

import { colors as tokens } from '@/constants/tokens';

const C = {
  textPrimary: tokens.textPrimary,
  statusDeclined: tokens.statusDeclinedText,
  statusDeclinedBg: tokens.statusDeclinedBg,
} as const;


type Props = {
  visible: boolean;
  missingLabels: string[];
};

/** Top toast for session setup form validation errors. */
export function SessionSetupValidationToast({ visible, missingLabels }: Props) {
  if (!visible || missingLabels.length === 0) {
    return null;
  }

  return (
    <View
      style={s.toast}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Text style={s.toastTitle}>There are missing fields</Text>
      {missingLabels.map((label) => (
        <Text key={label} style={s.listLine}>
          {'\u2022  '}
          {label}
        </Text>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  toast: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: C.statusDeclinedBg,
    borderWidth: 1,
    borderColor: C.statusDeclined,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },

  toastTitle: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 14,
    color: C.statusDeclined,
    marginBottom: 2,
  },

  listLine: {
    fontFamily: 'NotoSans_500Medium',
    fontSize: 13,
    lineHeight: 20,
    color: C.textPrimary,
  },
});
