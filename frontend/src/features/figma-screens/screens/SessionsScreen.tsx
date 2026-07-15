import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { BottomNavBar } from '@/components/navigation/BottomNavBar';
import { useLiveSession } from '@/features/session-tracking/liveSessionStore';
import { isApiConfigured } from '@/lib/api';
import { listSessions } from '@/lib/sessionsApi';
import { mapApiSessionToListItem } from '@/lib/mapApiSessions';

import {
  SessionsExpandIcon,
  SessionsMetaDot,
  SessionsSearchIcon,
  SessionsSortChevronIcon,
} from '../components/SessionsIcons';
import {
  filterMatchesStatus,
  mockSessionsList,
  SESSION_FILTER_CHIPS,
  SESSION_SORT_OPTIONS,
  sortSessions,
  type SessionApprovalStatus,
  type SessionListFilter,
  type SessionListItem,
  type SessionSortOption,
} from '../mocks/sessions';
import { colors, fontFamilies, radius as R, shadows } from '../tokens';

const BOTTOM_NAV_HEIGHT = 64;
const TOP_BAR_BOTTOM_PAD = 8.5;

const STATUS_LABEL: Record<SessionApprovalStatus, string> = {
  approved: 'Approved',
  pending: 'Pending',
  declined: 'Declined',
};

function sortOptionLabel(sort: SessionSortOption): string {
  const match = SESSION_SORT_OPTIONS.find((option) => option.id === sort);
  return match?.label ?? 'MOST RECENT';
}

function statusStyles(status: SessionApprovalStatus) {
  switch (status) {
    case 'approved':
      return {
        border: colors.statusApprovedBorder,
        badgeBg: colors.statusApprovedBg,
        badgeText: colors.statusApprovedText,
      };
    case 'pending':
      return {
        border: colors.statusPendingBorder,
        badgeBg: colors.statusPendingBg,
        badgeText: colors.statusPendingText,
      };
    case 'declined':
      return {
        border: colors.statusDeclinedBorder,
        badgeBg: colors.statusDeclinedBg,
        badgeText: colors.statusDeclinedText,
      };
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function SessionsTopAppBar({ title }: { title: string }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.topBar, { paddingTop: insets.top, paddingBottom: TOP_BAR_BOTTOM_PAD }]}>
      <View style={s.topBarRow}>
        <Text style={s.topBarTitle}>{title}</Text>
      </View>
    </View>
  );
}

function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <AnimatedPressable
      scaleTo={0.98}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Filter by ${label}`}
      accessibilityState={{ selected }}
      style={[s.chip, selected ? s.chipSelected : s.chipIdle]}
    >
      <Text style={[s.chipLabel, selected ? s.chipLabelSelected : s.chipLabelIdle]}>{label}</Text>
    </AnimatedPressable>
  );
}

function SortDropdown({
  value,
  open,
  onToggle,
  onSelect,
}: {
  value: SessionSortOption;
  open: boolean;
  onToggle: () => void;
  onSelect: (next: SessionSortOption) => void;
}) {
  return (
    <View style={s.sortHeader}>
      <AnimatedPressable
        scaleTo={0.98}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={`Sort by ${sortOptionLabel(value).toLowerCase()}`}
        accessibilityState={{ expanded: open }}
        style={s.sortControl}
      >
        <Text style={s.sortLabel}>{sortOptionLabel(value)}</Text>
        <SessionsSortChevronIcon pointingDown={!open} />
      </AnimatedPressable>
      <View style={s.sortDivider} />
      {open && (
        <View style={s.sortMenu} accessibilityRole="menu">
          {SESSION_SORT_OPTIONS.map((option) => {
            const selected = option.id === value;
            return (
              <AnimatedPressable
                key={option.id}
                scaleTo={0.98}
                onPress={() => onSelect(option.id)}
                accessibilityRole="menuitem"
                accessibilityState={{ selected }}
                accessibilityLabel={option.label}
                style={[s.sortOption, selected && s.sortOptionSelected]}
              >
                <Text style={[s.sortOptionLabel, selected && s.sortOptionLabelSelected]}>
                  {option.label}
                </Text>
              </AnimatedPressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

function SessionRow({ session, onPress }: { session: SessionListItem; onPress: () => void }) {
  const tone = statusStyles(session.status);
  const statusLabel = STATUS_LABEL[session.status];

  return (
    <AnimatedPressable
      scaleTo={0.99}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${session.title}, ${statusLabel}, ${session.dateLabel}, ${session.timeLabel}`}
      style={[s.row, { borderColor: tone.border }]}
    >
      <View style={s.rowCopy}>
        <Text style={s.rowTitle} numberOfLines={2}>
          {session.title}
        </Text>
        <View style={s.rowMeta}>
          <Text style={s.rowMetaText}>{session.dateLabel}</Text>
          <SessionsMetaDot />
          <Text style={s.rowMetaText}>{session.timeLabel}</Text>
        </View>
      </View>
      <View style={s.rowTrailing}>
        <View style={[s.statusBadge, { backgroundColor: tone.badgeBg }]}>
          <Text style={[s.statusBadgeLabel, { color: tone.badgeText }]}>{statusLabel}</Text>
        </View>
        <SessionsExpandIcon />
      </View>
    </AnimatedPressable>
  );
}

/**
 * Sessions list (Figma `sessions_list___hybrid_redesign`, node `515:1791`).
 */
export function SessionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isActive } = useLiveSession();
  const [filter, setFilter] = useState<SessionListFilter>('all');
  const [sort, setSort] = useState<SessionSortOption>('most-recent');
  const [sortOpen, setSortOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [apiSessions, setApiSessions] = useState<SessionListItem[] | null>(null);

  useEffect(() => {
    if (!isApiConfigured) {
      return;
    }

    let cancelled = false;

    listSessions()
      .then((sessions) => {
        if (!cancelled) {
          setApiSessions(
            sessions
              .filter((session) => session.status !== 'active')
              .map(mapApiSessionToListItem),
          );
        }
      })
      .catch((error) => {
        console.warn('[sessions] list fetch failed:', error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const sessionSource = apiSessions ?? mockSessionsList;

  const filteredSessions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = sessionSource.filter((session) => {
      const matchesFilter = filterMatchesStatus(filter, session.status);
      const matchesQuery =
        normalized.length === 0 || session.title.toLowerCase().includes(normalized);
      return matchesFilter && matchesQuery;
    });
    return sortSessions(filtered, sort);
  }, [filter, query, sort, sessionSource]);

  const bottomInset = Math.max(insets.bottom, 0);
  const scrollBottomPad = bottomInset + BOTTOM_NAV_HEIGHT + 24;

  function handleSelectSort(next: SessionSortOption) {
    setSort(next);
    setSortOpen(false);
  }
  return (
    <View style={s.root}>
      <SessionsTopAppBar title="Sessions" />

      {/* Stays visible while list scrolls */}
      <View style={s.stickyControls}>
        <View style={s.searchBar} accessibilityRole="search">
          <SessionsSearchIcon />
          <TextInput
            style={s.searchInput}
            placeholder="Search sessions"
            placeholderTextColor={colors.textNavInactive}
            value={query}
            onChangeText={setQuery}
            accessibilityLabel="Search sessions"
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.chipsRow}
        >
          {SESSION_FILTER_CHIPS.map((chip) => (
            <FilterChip
              key={chip.id}
              label={chip.label}
              selected={filter === chip.id}
              onPress={() => setFilter(chip.id)}
            />
          ))}
        </ScrollView>

        <SortDropdown
          value={sort}
          open={sortOpen}
          onToggle={() => setSortOpen((current) => !current)}
          onSelect={handleSelectSort}
        />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: scrollBottomPad }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {filteredSessions.length === 0 ? (
          <Text style={s.emptyText}>No sessions match your filter.</Text>
        ) : (
          <View style={s.rows}>
            {filteredSessions.map((session) => (
              <SessionRow
                key={session.id}
                session={session}
                onPress={() => {
                  router.push(`/session-detail?id=${encodeURIComponent(session.id)}` as Href);
                }}
              />
            ))}
          </View>
        )}

        {filteredSessions.length > 0 && (
          <AnimatedPressable
            scaleTo={0.98}
            accessibilityRole="button"
            accessibilityLabel="View more sessions"
            style={s.viewMore}
          >
            <Text style={s.viewMoreLabel}>View more</Text>
          </AnimatedPressable>
        )}
      </ScrollView>

      <View style={[s.bottomStack, { paddingBottom: bottomInset }]}>
        <BottomNavBar
          activeTab="sessions"
          onHomePress={() => router.replace('/')}
          onShopPress={() => router.push('/shop' as Href)}
          onTrackPress={() => {
            if (isActive) {
              router.push('/live-session');
            } else {
              router.push('/session-setup-guide');
            }
          }}
          onSessionsPress={() => {}}
          onProfilePress={() => router.push('/account' as Href)}
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
  topBar: {
    backgroundColor: colors.white,
    ...shadows.barTop,
    zIndex: 2,
  },
  topBarRow: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  topBarTitle: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 18,
    lineHeight: 23,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
  },
  stickyControls: {
    backgroundColor: colors.bgApp,
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 20,
    zIndex: 10,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 13,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: R.search,
  },
  searchInput: {
    flex: 1,
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: R.full,
    borderWidth: 1,
    borderColor: colors.borderOutline,
  },
  chipSelected: {
    backgroundColor: colors.chipSelectedBg,
  },
  chipIdle: {
    backgroundColor: colors.white,
  },
  chipLabel: {
    fontSize: 12,
    color: colors.textPrimary,
  },
  chipLabelSelected: {
    fontFamily: fontFamilies.notoSansSemiBold,
  },
  chipLabelIdle: {
    fontFamily: fontFamilies.notoSansRegular,
  },
  sortHeader: {
    gap: 5,
    position: 'relative',
    zIndex: 10,
  },
  sortControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
  },
  sortLabel: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 10,
    color: colors.textNavInactive,
  },
  sortDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderOutline,
  },
  sortMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: 4,
    minWidth: 148,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: R.sm,
    overflow: 'hidden',
    zIndex: 20,
    ...shadows.barTop,
  },
  sortOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sortOptionSelected: {
    backgroundColor: colors.chipSelectedBg,
  },
  sortOptionLabel: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 10,
    color: colors.textNavInactive,
  },
  sortOptionLabelSelected: {
    fontFamily: fontFamilies.notoSansSemiBold,
    color: colors.textPrimary,
  },
  rows: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderRadius: R.sm,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  rowTitle: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  rowMetaText: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    color: colors.textNavInactive,
  },
  rowTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  statusBadge: {
    borderRadius: R.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusBadgeLabel: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 11,
  },
  emptyText: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    color: colors.textNavInactive,
    textAlign: 'center',
    paddingVertical: 24,
  },
  viewMore: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  viewMoreLabel: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 14,
    color: colors.primary,
    textAlign: 'center',
  },
  bottomStack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
  },
});
