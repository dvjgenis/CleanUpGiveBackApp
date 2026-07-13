import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { useFonts } from 'expo-font';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { SessionSetupBackChevronIcon } from '@/components/session-setup/icons/SessionSetupBackChevronIcon';

import { colors as tokens } from '@/constants/tokens';

const C = {
  textOnPrimary: tokens.textOnPrimary,
  textPrimary: tokens.textPrimary,
} as const;


type Props = {
  title: string;
  onBack: () => void;
};

const BAR_PADDING_BOTTOM = 8.5;

/** Figma TopAppBar `260:1392` — white bar, drop shadow, back chevron + centered title. */
export function SessionSetupTopAppBar({ title, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({ Sanchez_400Regular });

  if (!fontsLoaded) {
    return (
      <View style={[s.bar, { paddingTop: insets.top, paddingBottom: BAR_PADDING_BOTTOM }]} />
    );
  }

  return (
    <View style={[s.bar, { paddingTop: insets.top, paddingBottom: BAR_PADDING_BOTTOM }]}>
      <View style={s.navRow}>
        <AnimatedPressable
          scaleTo={0.98}
          style={s.backBtn}
          onPress={onBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <SessionSetupBackChevronIcon color={C.textPrimary} />
        </AnimatedPressable>

        <View style={s.titleOverlay} pointerEvents="none">
          <Text style={s.title}>{title}</Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    backgroundColor: C.textOnPrimary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },

  navRow: {
    minHeight: 44,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  backBtn: {
    width: 24,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },

  titleOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    fontFamily: 'Sanchez_400Regular',
    fontSize: 18,
    lineHeight: 23,
    color: C.textPrimary,
    textAlign: 'center',
  },
});
