import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { CourtProgressState } from '@/features/session-tracking/courtProgressStore';
import { colors, fontFamilies, radius as R } from '../tokens';

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

  const isAtRisk = progress.status === 'at_risk';
  const isCompleted = progress.status === 'completed';

  return (
    <View style={s.card}>
      <View style={s.headerRow}>
        <Text style={s.title}>Court Progress</Text>
        {progress.dueDate && (
          <View style={[s.badge, isAtRisk ? s.badgeAtRisk : s.badgeNeutral]}>
            <Text style={[s.badgeText, isAtRisk ? s.badgeTextAtRisk : s.badgeTextNeutral]}>
              Due {progress.dueDate}
            </Text>
          </View>
        )}
      </View>

      <View style={s.statsRow}>
        <View style={s.stat}>
          <Text style={s.statValue}>{progress.requiredHours ?? 0}h</Text>
          <Text style={s.statLabel}>Required</Text>
        </View>
        <View style={s.stat}>
          <Text style={[s.statValue, isCompleted ? s.statValueApproved : undefined]}>
            {progress.completedHours.toFixed(1)}h
          </Text>
          <Text style={s.statLabel}>Approved</Text>
        </View>
        <View style={s.stat}>
          <Text style={[s.statValue, isAtRisk ? s.statValueAtRisk : undefined]}>
            {progress.remainingHours.toFixed(1)}h
          </Text>
          <Text style={s.statLabel}>Remaining</Text>
        </View>
      </View>

      <Text style={s.footnote}>
        Only approved hours count toward your court requirement — sessions still under review
        don’t reduce it yet.
      </Text>
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
  badgeNeutral: {
    backgroundColor: colors.statusApprovedBg,
    borderColor: colors.statusApprovedBorder,
  },
  badgeAtRisk: {
    backgroundColor: colors.statusPendingBg,
    borderColor: colors.statusPendingBorder,
  },
  badgeText: {
    fontFamily: fontFamilies.ibmPlexSansMedium,
    fontSize: 11,
  },
  badgeTextNeutral: {
    color: colors.statusApprovedText,
  },
  badgeTextAtRisk: {
    color: colors.statusPendingText,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    alignItems: 'flex-start',
    gap: 2,
  },
  statValue: {
    fontFamily: fontFamilies.ibmPlexSansMedium,
    fontSize: 22,
    color: colors.textPrimary,
  },
  statValueApproved: {
    color: colors.statusApprovedText,
  },
  statValueAtRisk: {
    color: colors.statusPendingText,
  },
  statLabel: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 11,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  footnote: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textTertiary,
  },
  pendingText: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textTertiary,
  },
});
