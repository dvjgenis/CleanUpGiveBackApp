import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { CourtProgressState } from '@/features/session-tracking/courtProgressStore';
import { colors, fontFamilies, radius as R } from '../tokens';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Whole days from now until `dueDate` (e.g. "Dec 15, 2026"). Null if unparseable. */
function daysUntil(dueDate: string): number | null {
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) {
    return null;
  }
  return Math.ceil((due.getTime() - Date.now()) / MS_PER_DAY);
}

/**
 * Home-screen module for court-ordered volunteers — required / approved / under-review /
 * remaining hours and the due date in one place. Shown whenever the volunteer selected
 * "Court Ordered" at onboarding OR an admin has already set up a court order for them
 * (see `shouldShowCourtProgress` in `courtProgressStore.ts`).
 */
export function CourtProgressCard({ state }: { state: CourtProgressState }) {
  const { progress } = state;

  if (!progress?.hasCourtOrder) {
    return (
      <View style={s.card}>
        <Text style={s.title}>Court Progress</Text>
        <Text style={s.pendingText}>
          Your court order hasn’t been set up yet. Once your case manager adds your required
          hours, your progress will show here.
        </Text>
      </View>
    );
  }

  const isCompleted = progress.status === 'completed';
  const daysLeft = progress.dueDate ? daysUntil(progress.dueDate) : null;
  const isOverdue = daysLeft != null && daysLeft < 0;
  const isAtRisk = progress.status === 'at_risk' && !isOverdue;

  // Green (on track / completed) → orange (at risk, due soon) → red (overdue).
  const severity: 'green' | 'orange' | 'red' = isCompleted
    ? 'green'
    : isOverdue
      ? 'red'
      : isAtRisk
        ? 'orange'
        : 'green';

  const progressPercent =
    progress.requiredHours && progress.requiredHours > 0
      ? Math.min(100, Math.max(0, (progress.completedHours / progress.requiredHours) * 100))
      : 0;

  const badgeStyle = SEVERITY_STYLES[severity].badge;
  const badgeTextStyle = SEVERITY_STYLES[severity].badgeText;
  const fillStyle = SEVERITY_STYLES[severity].fill;
  const messageStyle = SEVERITY_STYLES[severity].message;

  return (
    <View style={s.card}>
      <View style={s.headerRow}>
        <Text style={s.title}>Court Progress</Text>
        {progress.dueDate && (
          <View style={[s.badge, badgeStyle]}>
            <Text style={[s.badgeText, badgeTextStyle]}>Due {progress.dueDate}</Text>
          </View>
        )}
      </View>

      <View style={s.progressTrack}>
        <View style={[s.progressFill, { width: `${progressPercent}%` }, fillStyle]} />
      </View>

      <Text style={s.progressLabel}>
        {progress.completedHours.toFixed(1)} of {progress.requiredHours ?? 0} hours
      </Text>

      {(severity === 'orange' || severity === 'red') && daysLeft != null && (
        <Text style={[s.riskMessage, messageStyle]}>
          {daysLeft > 0
            ? `${daysLeft} day${daysLeft === 1 ? '' : 's'} left to complete your hours`
            : daysLeft === 0
              ? 'Due today — complete your hours now'
              : `${Math.abs(daysLeft)} day${Math.abs(daysLeft) === 1 ? '' : 's'} overdue`}
        </Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: R.md,
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 18,
    color: colors.textPrimary,
  },
  badge: {
    borderRadius: R.sm,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontFamily: fontFamilies.ibmPlexSansMedium,
    fontSize: 11,
  },
  progressTrack: {
    height: 8,
    borderRadius: R.sm,
    backgroundColor: colors.statusApprovedBg,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: R.sm,
    backgroundColor: colors.primary,
  },
  progressLabel: {
    fontFamily: fontFamilies.ibmPlexSansMedium,
    fontSize: 13,
    color: colors.textPrimary,
  },
  riskMessage: {
    fontFamily: fontFamilies.ibmPlexSansMedium,
    fontSize: 12,
  },
  badgeGreen: {
    backgroundColor: colors.statusApprovedBg,
    borderColor: colors.statusApprovedBorder,
  },
  badgeTextGreen: {
    color: colors.statusApprovedText,
  },
  badgeOrange: {
    backgroundColor: colors.statusPendingBg,
    borderColor: colors.statusPendingBorder,
  },
  badgeTextOrange: {
    color: colors.statusPendingText,
  },
  badgeRed: {
    backgroundColor: colors.statusDeclinedBg,
    borderColor: colors.statusDeclinedBorder,
  },
  badgeTextRed: {
    color: colors.statusDeclinedText,
  },
  fillGreen: {
    backgroundColor: colors.statusApprovedText,
  },
  fillOrange: {
    backgroundColor: colors.statusPendingText,
  },
  fillRed: {
    backgroundColor: colors.statusDeclinedText,
  },
  messageOrange: {
    color: colors.statusPendingText,
  },
  messageRed: {
    color: colors.statusDeclinedText,
  },
  pendingText: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textTertiary,
  },
});

/** Green (on track / completed) → orange (at risk, due soon) → red (overdue). */
const SEVERITY_STYLES = {
  green: { badge: s.badgeGreen, badgeText: s.badgeTextGreen, fill: s.fillGreen, message: undefined },
  orange: { badge: s.badgeOrange, badgeText: s.badgeTextOrange, fill: s.fillOrange, message: s.messageOrange },
  red: { badge: s.badgeRed, badgeText: s.badgeTextRed, fill: s.fillRed, message: s.messageRed },
} as const;
