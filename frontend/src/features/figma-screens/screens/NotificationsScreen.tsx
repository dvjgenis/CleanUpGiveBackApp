import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomNavBar, type BottomNavTab } from '@/components/navigation/BottomNavBar';
import { SessionSetupToggle } from '@/components/session-setup/SessionSetupToggle';
import { SessionSetupTopAppBar } from '@/components/session-setup/SessionSetupTopAppBar';
import {
  getCheckpointProgress,
  useLiveSession,
} from '@/features/session-tracking/liveSessionStore';

import {
  defaultNotificationCategories,
  type NotificationCategory,
  type NotificationPreferenceKey,
} from '../mocks/notifications';
import { layout, colors, fontFamilies } from '../tokens';


type ToggleRowProps = {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

function NotificationToggleRow({ title, description, value, onValueChange }: ToggleRowProps) {
  return (
    <View style={s.toggleRow}>
      <View style={s.toggleCopy}>
        <Text style={s.toggleTitle}>{title}</Text>
        <Text style={s.toggleDescription}>{description}</Text>
      </View>
      <SessionSetupToggle
        value={value}
        onValueChange={onValueChange}
        accessibilityLabel={`${title} notifications`}
      />
    </View>
  );
}

function NotificationCategoryCard({
  category,
  values,
  onToggle,
}: {
  category: NotificationCategory;
  values: Record<NotificationPreferenceKey, boolean>;
  onToggle: (key: NotificationPreferenceKey, value: boolean) => void;
}) {
  return (
    <View style={s.categoryCard}>
      <View style={s.categoryHeader}>
        <Text style={s.categoryTitle}>{category.title}</Text>
      </View>
      <View style={s.categoryBody}>
        {category.preferences.map((preference) => (
          <NotificationToggleRow
            key={preference.id}
            title={preference.title}
            description={preference.description}
            value={values[preference.id]}
            onValueChange={(next) => onToggle(preference.id, next)}
          />
        ))}
      </View>
    </View>
  );
}

function buildInitialValues(categories: NotificationCategory[]): Record<NotificationPreferenceKey, boolean> {
  return categories.reduce(
    (acc, category) => {
      for (const preference of category.preferences) {
        acc[preference.id] = preference.enabled;
      }
      return acc;
    },
    {} as Record<NotificationPreferenceKey, boolean>,
  );
}

/**
 * Notification settings screen (Figma `notifications`, node `649:774`).
 */
export function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isActive } = useLiveSession();
  const [activeTab, setActiveTab] = useState<BottomNavTab>('home');
  const [preferences, setPreferences] = useState(() => buildInitialValues(defaultNotificationCategories));

  const bottomInset = Math.max(insets.bottom, 0);
  const scrollBottomPad = bottomInset + layout.bottomNavHeight + 24;

  function handleToggle(key: NotificationPreferenceKey, value: boolean) {
    setPreferences((current) => ({ ...current, [key]: value }));
  }

  return (
    <View style={s.root}>
      <SessionSetupTopAppBar title="Notifications" onBack={() => router.back()} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: scrollBottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.intro}>
          Manage how we contact you regarding your impact journey. We recommend keeping approval status
          notifications on.
        </Text>

        <View style={s.categories}>
          {defaultNotificationCategories.map((category) => (
            <NotificationCategoryCard
              key={category.id}
              category={category}
              values={preferences}
              onToggle={handleToggle}
            />
          ))}
        </View>
      </ScrollView>

      <View style={[s.bottomStack, { paddingBottom: bottomInset }]}>
        <BottomNavBar
          activeTab={activeTab}
          onHomePress={() => {
            setActiveTab('home');
            router.replace('/');
          }}
          onShopPress={() => setActiveTab('shop')}
          onTrackPress={() => {
            if (isActive) {
              router.push('/live-session');
            } else {
              router.push('/session-setup-guide');
            }
          }}
          onSessionsPress={() => {
            setActiveTab('sessions');
            router.push('/sessions-list' as Href);
          }}
          onProfilePress={() => {
            setActiveTab('profile');
            router.push('/account' as Href);
          }}
        />
      </View>
    </View>
  );
}

const CHIP_BORDER = '#e5e2e1';

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 24,
    gap: 20,
  },
  intro: {
    paddingHorizontal: 24,
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 16,
    lineHeight: 22,
    color: colors.textNavInactive,
  },
  categories: {
    paddingHorizontal: 16,
    gap: 20,
  },
  categoryCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: 12,
    padding: 25,
    gap: 16,
  },
  categoryHeader: {
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: CHIP_BORDER,
  },
  categoryTitle: {
    paddingBottom: 9,
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    color: colors.textPrimary,
  },
  categoryBody: {
    gap: 0,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 8,
    gap: 16,
  },
  toggleCopy: {
    flex: 1,
    gap: 4,
    paddingRight: 8,
  },
  toggleTitle: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  toggleDescription: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textNavInactive,
  },
  bottomStack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
  },
});
