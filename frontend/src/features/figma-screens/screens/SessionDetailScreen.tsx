import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { StatusPill } from '@/features/session-tracking/components/StatusPill';
import { SessionRouteMapPanel } from '@/features/session-tracking/components/SessionRouteMapPanel';
import { SessionNotesField } from '@/features/session-tracking/components/SessionNotesField';
import {
  SessionPhotosSection,
  type SessionPhotosSectionItem,
} from '@/features/session-tracking/components/SessionPhotosSection';
import { useSessionDetail } from '@/features/session-tracking/hooks/useSessionDetail';
import { removeVolunteerSession } from '@/features/session-tracking/removeVolunteerSession';
import { useSessionRouteCoordinates } from '@/features/session-tracking/hooks/useSessionRouteCoordinates';
import { formatPhotoTimeLabel } from '@/features/session-tracking/utils/sessionFormat';

import {
  SessionDetailBackIcon,
  SessionDetailHoursIcon,
  SessionDetailMilesIcon,
  SessionDetailPhotosIcon,
  SessionDetailShareIcon,
} from '../components/SessionDetailIcons';
import { sessionStatusBadgeLabel } from '../mocks/sessionDetail';
import { layout, colors, fontFamilies, radius, shadows } from '../tokens';

const MAP_HEIGHT = 190;
const FOOTER_PAD_TOP = 18;
const SECONDARY_FOOTER_BTN_HEIGHT = 52;
const PRIMARY_FOOTER_BTN_HEIGHT = 52;
const FOOTER_ACTIONS_GAP = 15;

function SessionDetailTopBar({
  onBack,
  onShare,
}: {
  onBack: () => void;
  onShare: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.topBar, { paddingTop: insets.top, paddingBottom: layout.topBarPaddingBottom }]}>
      <View style={s.topBarRow}>
        <AnimatedPressable
          scaleTo={0.98}
          style={s.topBarSideLeft}
          onPress={onBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <SessionDetailBackIcon />
        </AnimatedPressable>

        <Text style={s.topBarTitle} numberOfLines={1}>
          Session Details
        </Text>

        <AnimatedPressable
          scaleTo={0.98}
          style={s.topBarSideRight}
          onPress={onShare}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Share session"
        >
          <SessionDetailShareIcon />
        </AnimatedPressable>
      </View>
    </View>
  );
}

function StatCard({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <View style={s.statCard}>
      <View style={s.statIcon}>{icon}</View>
      <View style={s.statCopy}>
        <Text style={s.statValue}>{value}</Text>
        <Text style={s.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

function SessionDescriptionSection({ description }: { description: string }) {
  const body = description.trim() || '—';

  return (
    <View style={s.infoCard}>
      <Text style={s.infoCardTitle}>Description</Text>
      <Text style={s.infoCardBody}>{body}</Text>
    </View>
  );
}

/**
 * Session detail (Figma `session_detail`, node `515:1848`).
 * Map resolves the completed walking path from local cache or the sessions API.
 */
export function SessionDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const params = useLocalSearchParams<{ id?: string }>();
  const sessionId = typeof params.id === 'string' ? params.id : undefined;
  const { detail, loading, error } = useSessionDetail(sessionId);
  const routeCoordinates = useSessionRouteCoordinates(sessionId);

  const [deleting, setDeleting] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const canDeleteSession =
    Boolean(sessionId) && !loading && !error && detail.status !== 'approved';

  const footerBottom = Math.max(insets.bottom, 12);
  const footerContentHeight = canDeleteSession
    ? SECONDARY_FOOTER_BTN_HEIGHT + FOOTER_ACTIONS_GAP + PRIMARY_FOOTER_BTN_HEIGHT
    : PRIMARY_FOOTER_BTN_HEIGHT;
  const scrollBottomPad = FOOTER_PAD_TOP + footerContentHeight + footerBottom + 16;
  const contentWidth = Math.min(windowWidth - 32, 358);

  const sessionPhotos: SessionPhotosSectionItem[] = useMemo(
    () =>
      detail.evidencePhotos.map((photo) => ({
        key: photo.id,
        source: photo.source,
        timeLabel: photo.capturedAt ? formatPhotoTimeLabel(photo.capturedAt) : '',
        label: photo.caption ?? 'Photo',
        capturedAt: photo.capturedAt,
      })),
    [detail.evidencePhotos],
  );

  const statusLabel = sessionStatusBadgeLabel(detail.status);
  const photosStatLabel =
    detail.evidencePhotos.length > 0
      ? String(detail.evidencePhotos.length)
      : detail.photosCountLabel;

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `${detail.title} — ${detail.dateTimeLabel} · ${detail.locationAddress}`,
      });
    } catch {
      // User dismissed or share unavailable.
    }
  }, [detail.dateTimeLabel, detail.locationAddress, detail.title]);

  const handleDeleteSession = useCallback(() => {
    if (!sessionId || deleting) {
      return;
    }

    Alert.alert(
      'Delete session?',
      'This removes the session from your history and cancels admin review.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setDeleting(true);
              const result = await removeVolunteerSession(sessionId, detail.status);
              setDeleting(false);
              if (!result.ok) {
                Alert.alert('Could not delete', result.message);
                return;
              }
              router.replace('/sessions-list' as Href);
            })();
          },
        },
      ],
    );
  }, [deleting, detail.status, router, sessionId]);

  return (
    <View style={s.root}>
      <View style={s.topSection}>
        <SessionDetailTopBar onBack={() => router.back()} onShare={handleShare} />
      </View>

      <ScrollView
        ref={scrollRef}
        style={s.scroll}
        contentContainerStyle={{ paddingBottom: scrollBottomPad }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      >
        <View
          style={[s.mapHero, { width: windowWidth, height: MAP_HEIGHT }]}
          accessibilityLabel="Session walking path map"
        >
          <SessionRouteMapPanel
            routeCoordinates={routeCoordinates}
            replayOnce
            initialMapLayer={detail.mapLayer}
            style={s.mapPreview}
          />
        </View>

        <View style={[s.mainCard, { width: contentWidth, alignSelf: 'center' }]}>
          {loading ? (
            <Text style={s.loadingText}>Loading session…</Text>
          ) : error ? (
            <Text style={s.loadingText}>{error}</Text>
          ) : (
            <>
              <View style={s.eventDetails}>
                <View style={s.statusAndInfo}>
                  <StatusPill status={detail.status} label={statusLabel} />

                  <View style={s.eventInfo}>
                    <Text style={s.title}>{detail.title}</Text>
                    <Text style={s.metaText}>{detail.dateTimeLabel}</Text>
                  </View>
                </View>

                <View style={s.statsRow}>
                  <StatCard value={detail.hoursLabel} label="HOURS" icon={<SessionDetailHoursIcon />} />
                  <StatCard value={detail.milesLabel} label="MILES" icon={<SessionDetailMilesIcon />} />
                  <StatCard
                    value={photosStatLabel}
                    label="PHOTOS"
                    icon={<SessionDetailPhotosIcon />}
                  />
                </View>
              </View>

              <SessionPhotosSection photos={sessionPhotos} />

              <SessionDescriptionSection description={detail.description} />
            </>
          )}

          <SessionNotesField sessionId={sessionId} scrollRef={scrollRef} />
        </View>
      </ScrollView>

      <View style={[s.footer, { paddingBottom: footerBottom }]}>
        <View style={s.footerActions}>
          {canDeleteSession ? (
            <AnimatedPressable
              scaleTo={0.98}
              onPress={handleDeleteSession}
              disabled={deleting}
              accessibilityRole="button"
              accessibilityLabel="Delete session"
              style={s.deleteBtn}
            >
              {deleting ? (
                <ActivityIndicator color={colors.statusDeclinedText} />
              ) : (
                <Text style={s.deleteLabel}>Delete session</Text>
              )}
            </AnimatedPressable>
          ) : null}
          <AnimatedPressable
            scaleTo={0.98}
            style={s.newSessionBtn}
            onPress={() => router.push('/session-setup-guide' as Href)}
            accessibilityRole="button"
            accessibilityLabel="Start a new session"
          >
            <Text style={s.newSessionLabel}>New Session</Text>
          </AnimatedPressable>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  topSection: {
    zIndex: 20,
    backgroundColor: colors.white,
  },
  topBar: {
    backgroundColor: colors.white,
    ...shadows.barTop,
    zIndex: 11,
  },
  topBarRow: {
    height: layout.topBarTitleRow,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  topBarSideLeft: {
    width: 44,
    height: layout.topBarTitleRow,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  topBarSideRight: {
    width: 44,
    height: layout.topBarTitleRow,
    alignItems: 'flex-end',
    justifyContent: 'center',
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
  mapHero: {
    backgroundColor: colors.chipSelectedBg,
    overflow: 'hidden',
  },
  mapPreview: {
    flex: 1,
    borderRadius: 0,
  },
  mainCard: {
    marginTop: 12,
    gap: 20,
    paddingHorizontal: 0,
  },
  loadingText: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    color: colors.textNavInactive,
    textAlign: 'center',
    paddingVertical: 24,
  },
  eventDetails: {
    gap: 16,
  },
  statusAndInfo: {
    gap: 15,
  },
  eventInfo: {
    gap: 7,
  },
  title: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 22,
    lineHeight: 28,
    color: colors.textPrimary,
  },
  metaText: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    color: colors.textNavInactive,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    maxWidth: 105,
    height: 115,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: 12,
    overflow: 'hidden',
    paddingTop: 7,
    paddingHorizontal: 13,
  },
  statIcon: {
    alignSelf: 'flex-end',
  },
  statCopy: {
    marginTop: -6,
    gap: 22,
  },
  statValue: {
    fontFamily: fontFamilies.ibmPlexSansMedium,
    fontSize: 32,
    lineHeight: 38,
    color: colors.primary,
  },
  statLabel: {
    fontFamily: fontFamilies.ibmPlexSansRegular,
    fontSize: 9,
    color: colors.textNavInactive,
  },
  infoCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  infoCardTitle: {
    fontFamily: fontFamilies.notoSansMedium,
    fontSize: 16,
    color: colors.textPrimary,
  },
  infoCardBody: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textNavInactive,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    paddingTop: FOOTER_PAD_TOP,
    paddingHorizontal: 16,
    ...shadows.navBottom,
  },
  footerActions: {
    gap: FOOTER_ACTIONS_GAP,
    alignItems: 'stretch',
  },
  deleteBtn: {
    height: SECONDARY_FOOTER_BTN_HEIGHT,
    borderWidth: 1,
    borderColor: colors.statusDeclinedBorder,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteLabel: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 14,
    color: colors.statusDeclinedText,
  },
  newSessionBtn: {
    height: PRIMARY_FOOTER_BTN_HEIGHT,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newSessionLabel: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 14,
    color: colors.white,
  },
});
