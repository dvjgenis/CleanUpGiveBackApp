import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomNavBar } from '@/components/navigation/BottomNavBar';
import { SessionSetupTopAppBar } from '@/components/session-setup/SessionSetupTopAppBar';
import { useLiveSession } from '@/features/session-tracking/liveSessionStore';

import {
  defaultApprovalHistory,
  defaultApprovalHistoryStats,
  type ApprovalHistoryItem,
  type ApprovalHistoryStats,
  type ApprovalStatus,
} from '../mocks/approvalHistory';
import { layout, colors, fontFamilies, radius } from '../tokens';


const STATUS_LABEL: Record<ApprovalStatus, string> = {
  approved: 'Approved',
  underReview: 'Under Review',
  notApproved: 'Not Approved',
};

function statusTagStyles(status: ApprovalStatus) {
  switch (status) {
    case 'approved':
      return { bg: colors.statusApprovedBg, text: colors.statusApprovedText };
    case 'underReview':
      return { bg: colors.statusPendingBg, text: colors.statusPendingText };
    case 'notApproved':
      return { bg: colors.statusDeclinedBg, text: colors.statusDeclinedText };
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function noteStyles(status: ApprovalStatus) {
  switch (status) {
    case 'underReview':
      return { bg: colors.bgApp, text: colors.statusPendingText };
    case 'notApproved':
      return { bg: colors.statusDeclinedBg, text: colors.statusDeclinedText };
    case 'approved':
      return { bg: colors.bgApp, text: colors.textNavInactive };
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function StatusTag({ status }: { status: ApprovalStatus }) {
  const tag = statusTagStyles(status);
  return (
    <View style={[s.statusTag, { backgroundColor: tag.bg }]}>
      <Text style={[s.statusLabel, { color: tag.text }]}>{STATUS_LABEL[status]}</Text>
    </View>
  );
}

function SessionCard({ item }: { item: ApprovalHistoryItem }) {
  const note = item.note ? noteStyles(item.status) : null;

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={s.cardHeaderLeft}>
          <Text style={s.sessionNumber}>{item.sessionNumber}</Text>
          <Text style={s.sessionDate}>{item.dateLabel}</Text>
        </View>
        <StatusTag status={item.status} />
      </View>

      <View style={s.divider} />

      <View style={s.metaRow}>
        <Text style={s.metaText}>{item.durationLabel}</Text>
        <Text style={s.metaText}>{item.locationLabel}</Text>
      </View>

      {item.note && note ? (
        <View style={[s.note, { backgroundColor: note.bg }]}>
          <Text style={[s.noteText, { color: note.text }]}>{item.note}</Text>
        </View>
      ) : null}
    </View>
  );
}

/**
 * Approval History (Figma `approval_history`, node `854:294`).
 */
export function ApprovalHistoryScreen({
  stats = defaultApprovalHistoryStats,
  sessions = defaultApprovalHistory,
}: {
  stats?: ApprovalHistoryStats;
  sessions?: ApprovalHistoryItem[];
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isActive } = useLiveSession();

  const bottomInset = Math.max(insets.bottom, 0);
  const scrollBottomPad = bottomInset + layout.bottomNavHeight + 32;

  return (
    <View style={s.root}>
      <SessionSetupTopAppBar title="Approval History" onBack={() => router.back()} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: scrollBottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.intro}>
          Review the approval status of your submitted clean-up sessions.
        </Text>

        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={[s.statValue, { color: colors.statusApprovedText }]}>{stats.approved}</Text>
            <Text style={s.statLabel}>Approved</Text>
          </View>
          <View style={s.statCard}>
            <Text style={[s.statValue, { color: colors.statusPendingText }]}>
              {stats.underReview}
            </Text>
            <Text style={s.statLabel}>Under Review</Text>
          </View>
          <View style={s.statCard}>
            <Text style={[s.statValue, { color: colors.statusDeclinedText }]}>
              {stats.notApproved}
            </Text>
            <Text style={s.statLabel}>Not Approved</Text>
          </View>
        </View>

        <View style={s.list}>
          {sessions.map((item) => (
            <SessionCard key={item.id} item={item} />
          ))}
        </View>
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
    paddingTop: 24,
    gap: 24,
  },
  intro: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 16,
    lineHeight: 22,
    color: colors.textNavInactive,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.md,
    paddingHorizontal: 8,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontFamily: fontFamilies.ibmPlexSansMedium,
    fontSize: 28,
  },
  statLabel: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    color: colors.textNavInactive,
    textAlign: 'center',
  },
  list: {
    gap: 16,
  },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.md,
    padding: 24,
    gap: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardHeaderLeft: {
    gap: 4,
    flex: 1,
    paddingRight: 12,
  },
  sessionNumber: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 10,
    color: colors.textNavInactive,
  },
  sessionDate: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 16,
    color: colors.textPrimary,
  },
  statusTag: {
    height: 32,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusLabel: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 11,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderOutline,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  metaText: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    color: colors.textPrimary,
  },
  note: {
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: '100%',
  },
  noteText: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    lineHeight: 16,
  },
  bottomStack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
  },
});
