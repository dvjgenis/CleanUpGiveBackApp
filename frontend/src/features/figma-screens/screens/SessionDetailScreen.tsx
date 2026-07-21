import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { PhotoEnlargeModal } from '@/components/ui/PhotoEnlargeModal';
import { StatusPill } from '@/features/session-tracking/components/StatusPill';
import { SessionRouteMapPanel } from '@/features/session-tracking/components/SessionRouteMapPanel';
import { SessionNotesField } from '@/features/session-tracking/components/SessionNotesField';
import { useSessionDetail } from '@/features/session-tracking/hooks/useSessionDetail';
import { removeVolunteerSession } from '@/features/session-tracking/removeVolunteerSession';
import { useSessionRouteCoordinates } from '@/features/session-tracking/hooks/useSessionRouteCoordinates';
import {
  formatPhotoTimeLabel,
  formatSessionDateLabel,
} from '@/features/session-tracking/utils/sessionFormat';

import {
  SessionDetailBackIcon,
  SessionDetailHoursIcon,
  SessionDetailMilesIcon,
  SessionDetailPhotosIcon,
  SessionDetailShareIcon,
} from '../components/SessionDetailIcons';
import {
  sessionStatusBadgeLabel,
  type SessionEvidencePhoto,
} from '../mocks/sessionDetail';
import { layout, colors, fontFamilies, radius as R, shadows } from '../tokens';

const MAP_HEIGHT = 190;
const CTA_HEIGHT = 50;
const FOOTER_PAD_TOP = 16;
const FOOTER_PAD_BOTTOM = 24;

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

function SessionPhotoEvidenceCard({
  photos,
  onPressPhoto,
}: {
  photos: SessionEvidencePhoto[];
  onPressPhoto: (index: number) => void;
}) {
  if (photos.length === 0) {
    return null;
  }

  return (
    <View style={s.photoCard}>
      <Text style={s.photoCardTitle}>Photo Evidence ({photos.length})</Text>
      <View style={s.thumbnails}>
        {photos.map((photo, index) => (
          <AnimatedPressable
            key={photo.id}
            scaleTo={0.98}
            onPress={() => onPressPhoto(index)}
            accessibilityRole="imagebutton"
            accessibilityLabel={photo.caption ?? `View photo evidence ${index + 1}`}
          >
            <Image source={photo.source} style={s.thumbnail} contentFit="cover" />
          </AnimatedPressable>
        ))}
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

  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const canDeleteSession =
    Boolean(sessionId) && !loading && !error && detail.status !== 'approved';

  const footerBottom = Math.max(insets.bottom, 12);
  const footerExtra = canDeleteSession ? 44 : 0;
  const scrollBottomPad =
    FOOTER_PAD_TOP + CTA_HEIGHT + FOOTER_PAD_BOTTOM + footerBottom + footerExtra + 96;
  const contentWidth = Math.min(windowWidth - 32, 358);

  const selectedPhoto =
    selectedPhotoIndex !== null ? detail.evidencePhotos[selectedPhotoIndex] ?? null : null;

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
        style={s.scroll}
        contentContainerStyle={{ paddingBottom: scrollBottomPad }}
        showsVerticalScrollIndicator={false}
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

              <SessionPhotoEvidenceCard
                photos={detail.evidencePhotos}
                onPressPhoto={setSelectedPhotoIndex}
              />

              <SessionDescriptionSection description={detail.description} />
            </>
          )}

          <SessionNotesField sessionId={sessionId} />
        </View>
      </ScrollView>

      <View style={[s.footer, { paddingBottom: footerBottom }]}>
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
          onPress={() => router.push('/session-setup-guide' as Href)}
          accessibilityRole="button"
          accessibilityLabel="Start a new session"
          style={s.cta}
        >
          <Text style={s.ctaLabel}>New Session</Text>
        </AnimatedPressable>
      </View>

      <PhotoEnlargeModal
        visible={selectedPhotoIndex !== null && selectedPhoto !== null}
        source={selectedPhoto?.source ?? null}
        caption={
          selectedPhoto?.caption ??
          (selectedPhotoIndex !== null
            ? `Photo Evidence ${selectedPhotoIndex + 1}`
            : undefined)
        }
        dateLabel={
          selectedPhoto?.capturedAt
            ? formatSessionDateLabel(selectedPhoto.capturedAt)
            : undefined
        }
        timeLabel={
          selectedPhoto?.capturedAt
            ? formatPhotoTimeLabel(selectedPhoto.capturedAt)
            : undefined
        }
        counterLabel={
          selectedPhotoIndex !== null && detail.evidencePhotos.length > 0
            ? `${selectedPhotoIndex + 1}/${detail.evidencePhotos.length}`
            : undefined
        }
        onClose={() => setSelectedPhotoIndex(null)}
        hasPrevious={selectedPhotoIndex !== null && selectedPhotoIndex > 0}
        hasNext={
          selectedPhotoIndex !== null && selectedPhotoIndex < detail.evidencePhotos.length - 1
        }
        onPrevious={() =>
          setSelectedPhotoIndex((index) => (index !== null && index > 0 ? index - 1 : index))
        }
        onNext={() =>
          setSelectedPhotoIndex((index) =>
            index !== null && index < detail.evidencePhotos.length - 1 ? index + 1 : index,
          )
        }
      />
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
    marginTop: 16,
    gap: 30,
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
  // Photo Evidence card styles (Figma `555:2380`) — used when `evidencePhotos.length > 0`.
  photoCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  photoCardTitle: {
    fontFamily: fontFamilies.notoSansMedium,
    fontSize: 16,
    color: colors.textPrimary,
  },
  thumbnails: {
    flexDirection: 'row',
    gap: 12,
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: R.sm,
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
    paddingHorizontal: 16,
    paddingTop: FOOTER_PAD_TOP,
    backgroundColor: colors.bgApp,
    gap: 12,
  },
  deleteBtn: {
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteLabel: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 15,
    color: colors.statusDeclinedText,
  },
  cta: {
    height: CTA_HEIGHT,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  ctaLabel: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 16,
    color: colors.textOnPrimary,
  },
});
