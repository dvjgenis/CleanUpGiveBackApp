import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter, useFocusEffect, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { BottomNavBar } from '@/components/navigation/BottomNavBar';
import { useLiveSession } from '@/features/session-tracking/liveSessionStore';
import { removeVolunteerSessions } from '@/features/session-tracking/removeVolunteerSession';
import {
  isVolunteerSessionDeleted,
  subscribeVolunteerSessionDeletes,
} from '@/features/session-tracking/volunteerDeletedSessions';
import { isApiConfigured } from '@/lib/api';
import { listSessions } from '@/lib/sessionsApi';
import { mapApiSessionToListItem } from '@/lib/mapApiSessions';

import {
  SessionsExpandIcon,
  SessionsMetaDot,
  SessionsSearchIcon,
  SessionsSortChevronIcon,
} from '../components/SessionsIcons';
import { RadioCheckedIcon, RadioEmptyIcon } from '../components/AccountIcons';
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
import { layout, colors, fontFamilies, radius as R, shadows } from '../tokens';

const TOP_BAR_BOTTOM_PAD = 8.5;
const SESSIONS_PAGE_SIZE = 10;

function filterDeletedSessions(items: SessionListItem[]): SessionListItem[] {
  return items.filter((session) => !isVolunteerSessionDeleted(session.id));
}

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

function canDeleteSessionStatus(status: SessionApprovalStatus): boolean {
  return status !== 'approved';
}

function SessionsTopAppBar({
  title,
  selectionMode,
  onEnterSelection,
  onCancelSelection,
  onSelectAll,
  selectAllEnabled,
}: {
  title: string;
  selectionMode: boolean;
  onEnterSelection: () => void;
  onCancelSelection: () => void;
  onSelectAll: () => void;
  selectAllEnabled: boolean;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.topBar, { paddingTop: insets.top, paddingBottom: TOP_BAR_BOTTOM_PAD }]}>
      <View style={s.topBarRow}>
        {selectionMode ? (
          <AnimatedPressable
            scaleTo={0.98}
            onPress={onCancelSelection}
            style={s.topBarSideLeft}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Cancel selection"
          >
            <Text style={s.topBarActionLabel}>Cancel</Text>
          </AnimatedPressable>
        ) : (
          <View style={s.topBarSideLeft} />
        )}
        <Text style={s.topBarTitle} numberOfLines={1}>
          {title}
        </Text>
        {selectionMode ? (
          <AnimatedPressable
            scaleTo={0.98}
            onPress={onSelectAll}
            disabled={!selectAllEnabled}
            style={[s.topBarSideRight, !selectAllEnabled && s.topBarActionDisabled]}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Select all deletable sessions"
            accessibilityState={{ disabled: !selectAllEnabled }}
          >
            <Text style={[s.topBarActionLabel, !selectAllEnabled && s.topBarActionDisabledText]}>
              Select all
            </Text>
          </AnimatedPressable>
        ) : (
          <AnimatedPressable
            scaleTo={0.98}
            onPress={onEnterSelection}
            style={s.topBarSideRight}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Select sessions to delete"
          >
            <Text style={s.topBarActionLabel}>Select</Text>
          </AnimatedPressable>
        )}
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

function SessionRow({
  session,
  selectionMode,
  selected,
  selectable,
  onPress,
}: {
  session: SessionListItem;
  selectionMode: boolean;
  selected: boolean;
  selectable: boolean;
  onPress: () => void;
}) {
  const tone = statusStyles(session.status);
  const statusLabel = STATUS_LABEL[session.status];

  return (
    <AnimatedPressable
      scaleTo={0.99}
      onPress={onPress}
      disabled={selectionMode && !selectable}
      accessibilityRole={selectionMode ? 'checkbox' : 'button'}
      accessibilityState={
        selectionMode
          ? { checked: selected, disabled: !selectable }
          : undefined
      }
      accessibilityLabel={`${session.title}, ${statusLabel}, ${session.dateLabel}, ${session.timeLabel}`}
      style={[
        s.row,
        { borderColor: tone.border },
        selectionMode && selected && s.rowSelected,
        selectionMode && !selectable && s.rowDisabled,
      ]}
    >
      {selectionMode && (
        <View style={s.rowCheckbox}>
          {selectable ? (
            selected ? (
              <RadioCheckedIcon width={22} height={22} />
            ) : (
              <RadioEmptyIcon width={22} height={22} />
            )
          ) : (
            <View style={s.rowCheckboxPlaceholder} />
          )}
        </View>
      )}
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
        {!selectionMode && <SessionsExpandIcon />}
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
  const [visibleCount, setVisibleCount] = useState(SESSIONS_PAGE_SIZE);
  const [apiSessions, setApiSessions] = useState<SessionListItem[] | null>(null);
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'error' | 'ready'>(
    isApiConfigured ? 'loading' : 'ready',
  );
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [tombstoneRevision, setTombstoneRevision] = useState(0);

  const loadSessions = useCallback(() => {
    if (!isApiConfigured) {
      setApiSessions([]);
      setLoadState('ready');
      return;
    }

    setLoadState('loading');

    listSessions()
      .then((sessions) => {
        setApiSessions(
          filterDeletedSessions(
            sessions
              .filter((session) => session.status !== 'active')
              .map(mapApiSessionToListItem),
          ),
        );
        setLoadState('ready');
      })
      .catch((error) => {
        console.warn('[sessions] list fetch failed:', error);
        setApiSessions([]);
        setLoadState('error');
      });
  }, []);

  useEffect(() => {
    return subscribeVolunteerSessionDeletes(() => {
      setTombstoneRevision((current) => current + 1);
      setApiSessions((current) =>
        current ? filterDeletedSessions(current) : current,
      );
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [loadSessions]),
  );

  const sessionSource = useMemo(() => {
    void tombstoneRevision;
    if (isApiConfigured) {
      return apiSessions ?? [];
    }
    return filterDeletedSessions(mockSessionsList);
  }, [apiSessions, tombstoneRevision]);

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

  useEffect(() => {
    setVisibleCount(SESSIONS_PAGE_SIZE);
  }, [filter, sort, query]);

  const visibleSessions = useMemo(
    () => filteredSessions.slice(0, visibleCount),
    [filteredSessions, visibleCount],
  );
  const showViewMore = filteredSessions.length > visibleCount;

  const deletableVisibleSessions = useMemo(
    () => visibleSessions.filter((session) => canDeleteSessionStatus(session.status)),
    [visibleSessions],
  );

  const selectedCount = selectedIds.size;
  const showBulkDeleteBar = selectionMode && selectedCount > 0;

  const bottomInset = Math.max(insets.bottom, 0);
  const bulkBarHeight = showBulkDeleteBar ? 56 : 0;
  const scrollBottomPad = bottomInset + layout.bottomNavHeight + bulkBarHeight + 24;

  const handleEnterSelection = useCallback(() => {
    setSelectedIds(new Set());
    setSelectionMode(true);
    setSortOpen(false);
  }, []);

  const handleCancelSelection = useCallback(() => {
    setSelectedIds(new Set());
    setSelectionMode(false);
  }, []);

  const handleToggleSessionSelection = useCallback((session: SessionListItem) => {
    if (!canDeleteSessionStatus(session.status)) {
      return;
    }
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(session.id)) {
        next.delete(session.id);
      } else {
        next.add(session.id);
      }
      return next;
    });
  }, []);

  const handleSelectAllVisible = useCallback(() => {
    setSelectedIds(new Set(deletableVisibleSessions.map((session) => session.id)));
  }, [deletableVisibleSessions]);

  const handleBulkDelete = useCallback(() => {
    if (bulkDeleting || selectedCount === 0) {
      return;
    }

    const targets = filteredSessions.filter((session) => selectedIds.has(session.id));
    const countLabel = targets.length === 1 ? '1 session' : `${targets.length} sessions`;

    Alert.alert(
      'Delete sessions?',
      `This removes ${countLabel} from your history and cancels admin review.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setBulkDeleting(true);
              const result = await removeVolunteerSessions(
                targets.map((session) => ({ id: session.id, status: session.status })),
              );
              setBulkDeleting(false);

              if (result.deletedIds.length > 0) {
                setSelectedIds(new Set());
                setSelectionMode(false);
              }

              if (result.failed.length === 0) {
                return;
              }

              const failedSummary = result.failed
                .slice(0, 3)
                .map((entry) => entry.message)
                .join('\n');
              const extra =
                result.failed.length > 3
                  ? `\n…and ${result.failed.length - 3} more could not be deleted.`
                  : '';

              Alert.alert(
                result.deletedIds.length > 0 ? 'Some sessions not deleted' : 'Could not delete',
                `${failedSummary}${extra}`,
              );
            })();
          },
        },
      ],
    );
  }, [bulkDeleting, filteredSessions, selectedCount, selectedIds]);

  function handleSelectSort(next: SessionSortOption) {
    setSort(next);
    setSortOpen(false);
  }

  function handleViewMore() {
    setVisibleCount((current) => current + SESSIONS_PAGE_SIZE);
  }
  return (
    <View style={s.root}>
      {sortOpen && (
        <Pressable
          style={s.sortBackdrop}
          onPress={() => setSortOpen(false)}
          accessibilityLabel="Close sort menu"
        />
      )}
      <SessionsTopAppBar
        title={selectionMode ? `${selectedCount} selected` : 'Sessions'}
        selectionMode={selectionMode}
        onEnterSelection={handleEnterSelection}
        onCancelSelection={handleCancelSelection}
        onSelectAll={handleSelectAllVisible}
        selectAllEnabled={deletableVisibleSessions.length > 0}
      />

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
        {loadState === 'loading' ? (
          <View style={s.loadingWrap}>
            <ActivityIndicator color={colors.primary} />
            <Text style={s.emptyText}>Loading sessions…</Text>
          </View>
        ) : loadState === 'error' ? (
          <View style={s.loadingWrap}>
            <Text style={s.emptyText}>Unable to load sessions.</Text>
            <AnimatedPressable
              scaleTo={0.98}
              onPress={loadSessions}
              accessibilityRole="button"
              accessibilityLabel="Retry loading sessions"
              style={s.retryButton}
            >
              <Text style={s.retryLabel}>Try again</Text>
            </AnimatedPressable>
          </View>
        ) : filteredSessions.length === 0 ? (
          <Text style={s.emptyText}>
            {sessionSource.length === 0
              ? 'No sessions yet.'
              : 'No sessions match your filter.'}
          </Text>
        ) : (
          <View style={s.rows}>
            {visibleSessions.map((session) => (
              <SessionRow
                key={session.id}
                session={session}
                selectionMode={selectionMode}
                selected={selectedIds.has(session.id)}
                selectable={canDeleteSessionStatus(session.status)}
                onPress={() => {
                  if (selectionMode) {
                    handleToggleSessionSelection(session);
                    return;
                  }
                  router.push(`/session-detail?id=${encodeURIComponent(session.id)}` as Href);
                }}
              />
            ))}
          </View>
        )}

        {showViewMore && (
          <AnimatedPressable
            scaleTo={0.98}
            onPress={handleViewMore}
            accessibilityRole="button"
            accessibilityLabel="View more sessions"
            style={s.viewMore}
          >
            <Text style={s.viewMoreLabel}>View more</Text>
          </AnimatedPressable>
        )}
      </ScrollView>

      <View style={[s.bottomStack, { paddingBottom: bottomInset }]}>
        {showBulkDeleteBar && (
          <View style={s.bulkBar}>
            <AnimatedPressable
              scaleTo={0.98}
              onPress={handleBulkDelete}
              disabled={bulkDeleting}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${selectedCount} selected sessions`}
              accessibilityState={{ disabled: bulkDeleting }}
              style={[s.bulkDeleteButton, bulkDeleting && s.bulkDeleteButtonDisabled]}
            >
              {bulkDeleting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={s.bulkDeleteLabel}>Delete ({selectedCount})</Text>
              )}
            </AnimatedPressable>
          </View>
        )}
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
    zIndex: 11,
  },
  topBarRow: {
    minHeight: 44,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  topBarSideLeft: {
    position: 'absolute',
    left: 16,
    minWidth: 72,
    justifyContent: 'center',
  },
  topBarSideRight: {
    position: 'absolute',
    right: 16,
    minWidth: 72,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  topBarActionLabel: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 14,
    color: colors.primary,
  },
  topBarActionDisabled: {
    opacity: 0.45,
  },
  topBarActionDisabledText: {
    color: colors.textNavInactive,
  },
  topBarTitle: {
    flex: 1,
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
  sortBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9,
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
  rowSelected: {
    backgroundColor: colors.chipSelectedBg,
  },
  rowDisabled: {
    opacity: 0.55,
  },
  rowCheckbox: {
    marginRight: 4,
    flexShrink: 0,
  },
  rowCheckboxPlaceholder: {
    width: 22,
    height: 22,
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
  loadingWrap: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 24,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryLabel: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 14,
    color: colors.primary,
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
  bulkBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderOutline,
    backgroundColor: colors.white,
  },
  bulkDeleteButton: {
    minHeight: 44,
    borderRadius: R.sm,
    backgroundColor: colors.statusDeclinedText,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  bulkDeleteButtonDisabled: {
    opacity: 0.7,
  },
  bulkDeleteLabel: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 15,
    color: colors.white,
  },
});
