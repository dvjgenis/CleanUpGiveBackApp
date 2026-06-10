// PROTOTYPE — NOT FINAL. All data hardcoded/mocked.
// PRD §6.16 — Sessions List View

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Screen } from '../../App';
import { Colors } from '../../constants/Colors';
import { Typography, Spacing, Radius } from '../../constants/Typography';
import { StatusTag } from '../../components/ui/StatusTag';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import type { StatusType } from '../../components/ui/StatusTag';

interface Props {
  go: (screen: Screen) => void;
}

type FilterOption = 'All' | 'Approved' | 'Under Review' | 'Not Approved';
type ViewMode = 'list' | 'cal';

interface SessionCard {
  id: string;
  title: string;
  status: StatusType;
  date: string;
  duration: string;
  group: 'This Week' | 'Last Week';
}

const SESSIONS: SessionCard[] = [
  {
    id: '1',
    title: 'Lake Park',
    status: 'approved',
    date: 'Jun 3 · 9:30–11:00 AM',
    duration: '1.5 hrs · River Cleanup',
    group: 'This Week',
  },
  {
    id: '2',
    title: 'River Trail',
    status: 'under-review',
    date: 'Jun 1 · 10:00–12:00 PM',
    duration: '2.0 hrs · River Cleanup',
    group: 'This Week',
  },
  {
    id: '3',
    title: 'Downtown Des Plaines',
    status: 'not-approved',
    date: 'May 28 · 1:00–2:00 PM',
    duration: '1.0 hr · River Cleanup',
    group: 'Last Week',
  },
];

const FILTERS: FilterOption[] = ['All', 'Approved', 'Under Review', 'Not Approved'];

export function SessionsList({ go }: Props) {
  const [activeFilter, setActiveFilter] = useState<FilterOption>('All');
  const [view, setView] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');

  function handleViewToggle(v: ViewMode) {
    setView(v);
    if (v === 'cal') {
      go('sessions-calendar');
    }
  }

  const STATUS_MAP: Record<FilterOption, StatusType | null> = {
    'All': null,
    'Approved': 'approved',
    'Under Review': 'under-review',
    'Not Approved': 'not-approved',
  };

  const filtered = SESSIONS.filter((s) => {
    const matchesFilter = activeFilter === 'All' || s.status === STATUS_MAP[activeFilter];
    const matchesSearch = searchQuery.trim() === '' ||
      s.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const thisWeek = filtered.filter((s) => s.group === 'This Week');
  const lastWeek = filtered.filter((s) => s.group === 'Last Week');

  return (
    <SafeAreaView style={styles.root}>
      <ScreenHeader variant="root" title="Sessions" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Subheadline */}
        <View style={styles.header}>
          <Text style={styles.subheadline}>
            <Text style={styles.hoursNumber}>42.5</Text>
            {' total hours logged'}
          </Text>
        </View>

        {/* Search bar */}
        <View style={styles.searchBar} accessibilityRole="search">
          <TextInput
            style={styles.searchInput}
            placeholder="Search logs"
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessibilityLabel="Search sessions"
            returnKeyType="search"
          />
        </View>

        {/* Filter chips + view toggle row */}
        <View style={styles.filterRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContainer}
            style={styles.chipsScroll}
          >
            {FILTERS.map((filter) => {
              const isActive = activeFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  onPress={() => setActiveFilter(filter)}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter by ${filter}`}
                  accessibilityState={{ selected: isActive }}
                  style={[
                    styles.chip,
                    isActive ? styles.chipActive : styles.chipInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      isActive ? styles.chipTextActive : styles.chipTextInactive,
                    ]}
                  >
                    {filter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* List / Cal toggle */}
          <View style={styles.viewToggle}>
            {(['list', 'cal'] as ViewMode[]).map((v) => (
              <TouchableOpacity
                key={v}
                onPress={() => handleViewToggle(v)}
                accessibilityRole="button"
                accessibilityLabel={v === 'list' ? 'List view' : 'Calendar view'}
                accessibilityState={{ selected: view === v }}
                style={[
                  styles.toggleBtn,
                  view === v && styles.toggleBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.toggleText,
                    view === v ? styles.toggleTextActive : styles.toggleTextInactive,
                  ]}
                >
                  {v === 'list' ? 'List' : 'Cal'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {filtered.length === 0 && (
          <Text style={styles.emptyText}>No sessions match your filter.</Text>
        )}

        {/* This Week group */}
        {thisWeek.length > 0 && (
          <>
            <Text style={styles.groupLabel}>THIS WEEK</Text>
            {thisWeek.map((session) => (
              <SessionCardItem
                key={session.id}
                session={session}
                onPress={() => go('session-detail')}
              />
            ))}
          </>
        )}

        {/* Last Week group */}
        {lastWeek.length > 0 && (
          <>
            <Text style={[styles.groupLabel, styles.groupLabelSpacing]}>LAST WEEK</Text>
            {lastWeek.map((session) => (
              <SessionCardItem
                key={session.id}
                session={session}
                onPress={() => go('session-detail')}
              />
            ))}
          </>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

interface SessionCardItemProps {
  session: SessionCard;
  onPress: () => void;
}

function SessionCardItem({ session, onPress }: SessionCardItemProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${session.title} session, ${session.status}, ${session.date}`}
    >
      {/* Map placeholder */}
      <View style={styles.mapPlaceholder} />

      {/* Content */}
      <View style={styles.cardContent}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle}>{session.title}</Text>
          <StatusTag status={session.status} />
        </View>
        <Text style={styles.cardDate}>{session.date}</Text>
        <Text style={styles.cardDuration}>{session.duration}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  } as ViewStyle,
  scroll: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: 16,
  } as ViewStyle,
  header: {
    marginBottom: 20,
  } as ViewStyle,
  subheadline: {
    ...(Typography.bodyMedium as TextStyle),
    color: Colors.textSecondary,
  } as TextStyle,
  hoursNumber: {
    fontFamily: 'JetBrainsMono',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
  } as TextStyle,

  // Search bar
  searchBar: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    paddingHorizontal: 16,
    height: 48,
    justifyContent: 'center',
    marginBottom: 16,
  } as ViewStyle,
  searchInput: {
    ...(Typography.bodyMedium as TextStyle),
    color: Colors.textPrimary,
    flex: 1,
  } as TextStyle,

  // Filter row
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  } as ViewStyle,
  chipsScroll: {
    flex: 1,
  } as ViewStyle,
  chipsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 8,
  } as ViewStyle,
  chip: {
    height: 36,
    borderRadius: Radius.full,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  chipActive: {
    backgroundColor: Colors.primary,
  } as ViewStyle,
  chipInactive: {
    backgroundColor: Colors.surface,
  } as ViewStyle,
  chipText: {
    ...(Typography.labelSmall as TextStyle),
  } as TextStyle,
  chipTextActive: {
    color: Colors.white,
  } as TextStyle,
  chipTextInactive: {
    color: Colors.textSecondary,
  } as TextStyle,

  // View toggle
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    marginLeft: 8,
  } as ViewStyle,
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  toggleBtnActive: {
    backgroundColor: Colors.primary,
  } as ViewStyle,
  toggleText: {
    ...(Typography.labelSmall as TextStyle),
  } as TextStyle,
  toggleTextActive: {
    color: Colors.white,
  } as TextStyle,
  toggleTextInactive: {
    color: Colors.textSecondary,
  } as TextStyle,

  // Group labels
  groupLabel: {
    ...(Typography.labelSmall as TextStyle),
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 12,
  } as TextStyle,
  groupLabelSpacing: {
    marginTop: 8,
  } as TextStyle,

  // Session card
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    overflow: 'hidden',
    marginBottom: 12,
  } as ViewStyle,
  mapPlaceholder: {
    height: 80,
    backgroundColor: Colors.surfaceVariant,
  } as ViewStyle,
  cardContent: {
    padding: 12,
    gap: 4,
  } as ViewStyle,
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  } as ViewStyle,
  cardTitle: {
    ...(Typography.labelMedium as TextStyle),
    color: Colors.textPrimary,
    fontWeight: '700',
  } as TextStyle,
  cardDate: {
    ...(Typography.bodySmall as TextStyle),
    color: Colors.textSecondary,
  } as TextStyle,
  cardDuration: {
    fontFamily: 'JetBrainsMono',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textPrimary,
  } as TextStyle,

  emptyText: {
    ...(Typography.bodyMedium as TextStyle),
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 32,
  } as TextStyle,
  bottomPad: {
    height: 32,
  } as ViewStyle,
});
