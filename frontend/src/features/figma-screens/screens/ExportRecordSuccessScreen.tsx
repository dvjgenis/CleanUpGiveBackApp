import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';

import { ExportRecordSuccessCheckIcon } from '../components/AccountIcons';
import { colors, fontFamilies, radius } from '../tokens';

/**
 * Export record success (Figma `export_record_success`, node `840:561`).
 */
export function ExportRecordSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ format?: string }>();
  const format = params.format === 'csv' ? 'CSV' : 'PDF';

  function handleContinue() {
    router.replace('/account' as Href);
  }

  function handleViewFile() {
    Alert.alert(`View ${format}`, `${format} preview will be available in a future release.`);
  }

  return (
    <View style={s.root}>
      <View style={s.card}>
        <View style={s.content}>
          <View style={s.hero}>
            <ExportRecordSuccessCheckIcon width={79} height={79} />
            <Text style={s.headline}>Your record has been exported!</Text>
          </View>

          <View style={s.actions}>
            <AnimatedPressable
              scaleTo={0.98}
              onPress={handleContinue}
              accessibilityRole="button"
              accessibilityLabel="Continue"
              style={s.continueBtn}
            >
              <Text style={s.continueLabel}>Continue</Text>
            </AnimatedPressable>

            <AnimatedPressable
              scaleTo={0.98}
              onPress={handleViewFile}
              accessibilityRole="button"
              accessibilityLabel={`View ${format}`}
            >
              <Text style={s.viewLink}>View {format}</Text>
            </AnimatedPressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgApp,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: colors.bgApp,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: 28,
    paddingVertical: 27,
  },
  content: {
    width: '100%',
    gap: 15,
  },
  hero: {
    width: '100%',
    gap: 14,
    alignItems: 'center',
  },
  headline: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 22,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    gap: 14,
  },
  continueBtn: {
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueLabel: {
    fontFamily: fontFamilies.ibmPlexSansSemiBold,
    fontSize: 16,
    color: colors.textOnPrimary,
  },
  viewLink: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 14,
    color: colors.primary,
    textAlign: 'center',
  },
});
