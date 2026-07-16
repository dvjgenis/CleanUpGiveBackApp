import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { BottomNavBar } from '@/components/navigation/BottomNavBar';
import { SessionSetupTopAppBar } from '@/components/session-setup/SessionSetupTopAppBar';
import { useLiveSession } from '@/features/session-tracking/liveSessionStore';

import { RadioCheckedIcon, RadioEmptyIcon } from '../components/AccountIcons';
import { ExportDateField } from '../components/ExportDateField';
import { layout, colors, fontFamilies, radius } from '../tokens';
import { toExportDate } from '../utils/exportDate';
import { startOfDay } from '../utils/weekCalendar';


type ExportStatus = 'approved' | 'underReview' | 'notApproved';
type ExportFormat = 'pdf' | 'csv';

const STATUS_ROWS: {
  id: ExportStatus;
  label: string;
  color: string;
}[] = [
  { id: 'approved', label: 'Approved', color: colors.statusApprovedText },
  { id: 'underReview', label: 'Under Review', color: colors.statusPendingText },
  { id: 'notApproved', label: 'Not Approved', color: colors.statusDeclinedText },
];

/**
 * Export Service Record (Figma `export_service_record`, node `854:383` / PRD §6.30).
 */
export function ExportServiceRecordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isActive } = useLiveSession();

  const [startDate, setStartDate] = useState(() => toExportDate(new Date(2026, 0, 1)));
  const [endDate, setEndDate] = useState(() => toExportDate(new Date(2026, 6, 10)));
  const [statuses, setStatuses] = useState<Record<ExportStatus, boolean>>({
    approved: true,
    underReview: true,
    notApproved: false,
  });
  const [format, setFormat] = useState<ExportFormat>('pdf');

  // Normalize leftover string state from earlier mock timeframe fields (Fast Refresh).
  useEffect(() => {
    setStartDate((prev) => toExportDate(prev as Date | string));
    setEndDate((prev) => toExportDate(prev as Date | string));
  }, []);

  const startDay = toExportDate(startDate);
  const endDay = toExportDate(endDate);

  const bottomInset = Math.max(insets.bottom, 0);
  const scrollBottomPad = bottomInset + layout.bottomNavHeight + 32;

  function toggleStatus(id: ExportStatus) {
    setStatuses((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleStartChange(next: Date) {
    const day = startOfDay(next);
    setStartDate(day);
    if (day.getTime() > endDay.getTime()) {
      setEndDate(day);
    }
  }

  function handleEndChange(next: Date) {
    const day = startOfDay(next);
    setEndDate(day);
    if (day.getTime() < startDay.getTime()) {
      setStartDate(day);
    }
  }

  function handleExport() {
    router.push(`/export-record-success?format=${format}` as Href);
  }

  return (
    <View style={s.root}>
      <SessionSetupTopAppBar title="Export Service Record" onBack={() => router.back()} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: scrollBottomPad }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={s.intro}>
          Export a record of your approved service hours for school or organization requirements.
        </Text>

        <View style={s.card}>
          <Text style={s.cardTitle}>Timeframe</Text>
          <View style={s.timeframeFields}>
            <ExportDateField
              label="Start Date"
              labelBold
              value={startDay}
              onChange={handleStartChange}
              accessibilityLabel="Start date"
            />
            <ExportDateField
              label="End Date"
              value={endDay}
              onChange={handleEndChange}
              accessibilityLabel="End date"
            />
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Include Statuses</Text>
          <Text style={s.cardHint}>
            Choose which session statuses to include in your exported record.
          </Text>
          {STATUS_ROWS.map((row) => {
            const selected = statuses[row.id];
            return (
              <AnimatedPressable
                key={row.id}
                scaleTo={0.98}
                onPress={() => toggleStatus(row.id)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={row.label}
                style={[s.statusRow, selected ? s.statusRowSelected : null]}
              >
                <Text style={[s.statusLabel, { color: row.color }]}>{row.label}</Text>
                {selected ? (
                  <RadioCheckedIcon width={24} height={24} />
                ) : (
                  <RadioEmptyIcon width={24} height={24} />
                )}
              </AnimatedPressable>
            );
          })}
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>File Format</Text>
          <View style={s.formatRow}>
            <AnimatedPressable
              scaleTo={0.98}
              onPress={() => setFormat('pdf')}
              accessibilityRole="radio"
              accessibilityState={{ selected: format === 'pdf' }}
              accessibilityLabel="PDF, Best for printing"
              style={[s.formatTile, format === 'pdf' ? s.formatTileSelected : null]}
            >
              <Text style={[s.formatTitle, format === 'pdf' ? s.formatTitleSelected : null]}>
                PDF
              </Text>
              <Text style={s.formatHint}>Best for printing</Text>
            </AnimatedPressable>
            <AnimatedPressable
              scaleTo={0.98}
              onPress={() => setFormat('csv')}
              accessibilityRole="radio"
              accessibilityState={{ selected: format === 'csv' }}
              accessibilityLabel="CSV, Best for spreadsheets"
              style={[s.formatTile, format === 'csv' ? s.formatTileSelected : null]}
            >
              <Text style={[s.formatTitle, format === 'csv' ? s.formatTitleSelected : null]}>
                CSV
              </Text>
              <Text style={s.formatHint}>Best for spreadsheets</Text>
            </AnimatedPressable>
          </View>
        </View>

        <AnimatedPressable
          scaleTo={0.98}
          onPress={handleExport}
          accessibilityRole="button"
          accessibilityLabel="Export Record"
          style={s.exportBtn}
        >
          <Text style={s.exportLabel}>Export Record</Text>
        </AnimatedPressable>
      </ScrollView>

      <View style={[s.bottomStack, { paddingBottom: bottomInset }]}>
        <BottomNavBar
          activeTab="profile"
          onHomePress={() => router.replace('/')}
          onShopPress={() => {}}
          onTrackPress={() => {
            if (isActive) {
              router.push('/live-session');
            } else {
              router.push('/session-setup-guide');
            }
          }}
          onSessionsPress={() => router.push('/sessions-list' as Href)}
          onProfilePress={() => router.replace('/account' as Href)}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 24,
  },
  intro: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 16,
    lineHeight: 22,
    color: colors.textNavInactive,
  },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.md,
    padding: 20,
    gap: 16,
  },
  cardTitle: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 18,
    color: colors.textPrimary,
  },
  cardHint: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textNavInactive,
    marginTop: -8,
  },
  timeframeFields: {
    gap: 16,
  },
  statusRow: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.sm,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusRowSelected: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  statusLabel: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 14,
  },
  formatRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formatTile: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 4,
  },
  formatTileSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  formatTitle: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 14,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  formatTitleSelected: {
    color: colors.primary,
  },
  formatHint: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    color: colors.textNavInactive,
    textAlign: 'center',
  },
  exportBtn: {
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportLabel: {
    fontFamily: fontFamilies.ibmPlexSansSemiBold,
    fontSize: 16,
    color: colors.textOnPrimary,
  },
  bottomStack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
  },
});
