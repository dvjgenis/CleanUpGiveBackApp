import React, { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  Alert,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { SessionSetupBackChevronIcon } from '@/components/session-setup/icons/SessionSetupBackChevronIcon';

import { EventLocationMap } from '../components/EventLocationMap';
import { EventRegistrationSuccessModal } from '../components/EventRegistrationSuccessModal';
import { LinkCopiedToast } from '../components/LinkCopiedToast';
import {
  EventCalendarIcon,
  EventClothingIcon,
  EventCopyIcon,
  EventFacebookIcon,
  EventInstagramIcon,
  EventShareIcon,
  EventShoesIcon,
  EventWaterBottleIcon,
  EventYouTubeIcon,
} from '../components/EventIcons';
import { RegisterButton } from '../components/RegisterButton';
import { getEventDetail, type WhatToBringIcon } from '../mocks/eventDetail';
import { layout, colors, fontFamilies, radius, shadows } from '../tokens';
import { mapsLinkForLocation, openLocationInMaps } from '../utils/openLocationInMaps';

const HERO_HEIGHT = 195;
const FOOTER_PAD_TOP = 18;
const FOOTER_PAD_BOTTOM = 30;

function WhatToBringIconView({ icon }: { icon: WhatToBringIcon }) {
  switch (icon) {
    case 'clothing':
      return <EventClothingIcon />;
    case 'water':
      return <EventWaterBottleIcon />;
    case 'shoes':
      return <EventShoesIcon />;
    default: {
      const _exhaustive: never = icon;
      return _exhaustive;
    }
  }
}

function SectionDivider() {
  return <View style={s.divider} />;
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={s.sectionTitle}>{children}</Text>;
}

function EventDetailTopBar({
  onBack,
  onShare,
}: {
  onBack: () => void;
  onShare: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.topBar, shadows.barTop, { paddingTop: insets.top, paddingBottom: layout.topBarPaddingBottom }]}>
      <View style={s.topBarRow}>
        <AnimatedPressable
          scaleTo={0.98}
          style={s.topBarIconBtn}
          onPress={onBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <SessionSetupBackChevronIcon color={colors.textPrimary} />
        </AnimatedPressable>

        <View style={s.topBarTitleOverlay} pointerEvents="none">
          <Text style={s.topBarTitle}>Event Details</Text>
        </View>

        <AnimatedPressable
          scaleTo={0.98}
          style={s.topBarIconBtn}
          onPress={onShare}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Share event"
        >
          <EventShareIcon />
        </AnimatedPressable>
      </View>
    </View>
  );
}

/**
 * Event detail screen (Figma `events_detail`, node `196:226`).
 * Register opens confirmation overlay (Figma `787:406`).
 */
export function EventDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const params = useLocalSearchParams<{ id?: string }>();
  const event = getEventDetail(typeof params.id === 'string' ? params.id : undefined);

  const [imageIndex, setImageIndex] = useState(0);
  const [registered, setRegistered] = useState(false);
  const [copyToastVisible, setCopyToastVisible] = useState(false);
  const [copyToastKey, setCopyToastKey] = useState(0);

  const footerBottom = Math.max(insets.bottom, 12);
  const scrollBottomPad = FOOTER_PAD_TOP + 38 + 15 + 50 + footerBottom + 24;

  useEffect(() => {
    if (!copyToastVisible) return undefined;
    const timer = setTimeout(() => setCopyToastVisible(false), 2800);
    return () => clearTimeout(timer);
  }, [copyToastKey, copyToastVisible]);

  const handleHeroScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const next = Math.round(x / windowWidth);
      if (next !== imageIndex && next >= 0 && next < event.headerImages.length) {
        setImageIndex(next);
      }
    },
    [event.headerImages.length, imageIndex, windowWidth],
  );

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `${event.title} — ${event.dateTimeLabel} at ${event.locationAddress}`,
      });
    } catch {
      // User dismissed or share unavailable.
    }
  }, [event.dateTimeLabel, event.locationAddress, event.title]);

  const handleCopyLink = useCallback(async () => {
    const link = mapsLinkForLocation(event.locationAddress, event.coordinate);
    try {
      await Clipboard.setStringAsync(link);
      setCopyToastKey((key) => key + 1);
      setCopyToastVisible(true);
    } catch {
      Alert.alert('Copy failed', 'Could not copy the link. Please try again.');
    }
  }, [event.coordinate, event.locationAddress]);

  const handleOpenMaps = useCallback(() => {
    void openLocationInMaps(event.locationAddress, event.coordinate);
  }, [event.coordinate, event.locationAddress]);

  const handleAddToCalendar = useCallback(() => {
    Alert.alert('Add to calendar', 'Calendar export will be available in a future release.');
  }, []);

  const handleVisit = useCallback(() => {
    void Linking.openURL('https://cleanupgiveback.org');
  }, []);

  const handleRegister = useCallback(() => {
    setRegistered(true);
  }, []);

  const handleGoHome = useCallback(() => {
    setRegistered(false);
    router.replace('/' as Href);
  }, [router]);

  return (
    <View style={s.root}>
      <View style={s.topSection}>
        <EventDetailTopBar onBack={() => router.back()} onShare={handleShare} />
        <LinkCopiedToast key={copyToastKey} visible={copyToastVisible} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={{ paddingBottom: scrollBottomPad }}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.heroWrap}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleHeroScroll}
            style={{ height: HERO_HEIGHT }}
          >
            {event.headerImages.map((source, index) => (
              <Image
                key={`hero-${index}`}
                source={source}
                style={{ width: windowWidth, height: HERO_HEIGHT }}
                contentFit="cover"
                accessibilityLabel={`${event.title} photo ${index + 1}`}
              />
            ))}
          </ScrollView>
          <View style={s.dotsWrap} pointerEvents="none">
            <View style={s.dotsPill}>
              {event.headerImages.map((_, index) => (
                <View
                  key={`dot-${index}`}
                  style={[s.dot, index === imageIndex ? s.dotActive : s.dotInactive]}
                />
              ))}
            </View>
          </View>
        </View>

        <View style={s.content}>
          <View style={s.badgeBlock}>
            <View style={s.badgeRow}>
              <View style={s.badgeUpcoming}>
                <Text style={s.badgeUpcomingText}>{event.statusLabel}</Text>
              </View>
              <View style={s.badgeRegistered}>
                <Text style={s.badgeRegisteredText}>{event.registeredCount} REGISTERED</Text>
              </View>
            </View>
            <View style={s.titleBlock}>
              <Text style={s.eventTitle} accessibilityRole="header">
                {event.title}
              </Text>
              <View style={s.metaRow}>
                <Text style={s.metaText}>{event.dateTimeLabel}</Text>
                <View style={s.metaDot} />
                <Text style={s.metaText} numberOfLines={1}>
                  {event.addressShort}
                </Text>
              </View>
            </View>
          </View>

          <View style={s.section}>
            <SectionDivider />
            <View style={s.sectionBody}>
              <SectionTitle>Overview</SectionTitle>
              <Text style={s.overviewText}>{event.overview}</Text>
            </View>
          </View>

          <View style={s.section}>
            <SectionDivider />
            <View style={s.sectionBody}>
              <SectionTitle>Organizer</SectionTitle>
              <View style={s.organizerRow}>
                <Image
                  source={event.organizer.image}
                  style={s.organizerAvatar}
                  contentFit="cover"
                  accessibilityLabel={`${event.organizer.name} logo`}
                />
                <View style={s.organizerCopy}>
                  <Text style={s.organizerBy}>
                    By <Text style={s.organizerName}>{event.organizer.name}</Text>
                  </Text>
                  <Text style={s.organizerBio}>{event.organizer.bio}</Text>
                  <View style={s.socialRow}>
                    <EventInstagramIcon />
                    <EventFacebookIcon />
                    <EventYouTubeIcon />
                  </View>
                  <AnimatedPressable
                    scaleTo={0.98}
                    onPress={handleVisit}
                    accessibilityRole="link"
                    accessibilityLabel="Visit organizer website"
                  >
                    <Text style={s.visitLink}>Visit</Text>
                  </AnimatedPressable>
                </View>
              </View>
            </View>
          </View>

          <View style={s.whatToBringSection}>
            <View style={s.section}>
              <SectionDivider />
              <SectionTitle>What to bring</SectionTitle>
            </View>
            <View style={s.bringCard}>
              {event.whatToBring.map((item) => (
                <View key={item.id} style={s.bringRow}>
                  <WhatToBringIconView icon={item.icon} />
                  <Text style={s.bringLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={s.section}>
            <SectionDivider />
            <View style={s.locationBody}>
              <View style={s.locationHeader}>
                <SectionTitle>Location</SectionTitle>
                <View style={s.addressRow}>
                  <View style={s.addressCopy}>
                    <Text style={s.locationName}>{event.locationName}</Text>
                    <Text style={s.locationAddress}>{event.locationAddress}</Text>
                  </View>
                  <AnimatedPressable
                    scaleTo={0.98}
                    onPress={handleCopyLink}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Copy location link"
                  >
                    <EventCopyIcon />
                  </AnimatedPressable>
                </View>
              </View>
              <EventLocationMap
                address={event.locationAddress}
                coordinate={event.coordinate}
                onPress={handleOpenMaps}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[s.footer, { paddingBottom: footerBottom }]}>
        <View style={s.footerActions}>
          <AnimatedPressable
            scaleTo={0.98}
            style={s.calendarBtn}
            onPress={handleAddToCalendar}
            accessibilityRole="button"
            accessibilityLabel="Add to calendar"
          >
            <EventCalendarIcon />
            <Text style={s.calendarLabel}>Add to calendar</Text>
          </AnimatedPressable>
          <RegisterButton onPress={handleRegister} />
        </View>
      </View>

      <EventRegistrationSuccessModal visible={registered} onGoHome={handleGoHome} />
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
    zIndex: 2,
  },
  topSection: {
    zIndex: 20,
    backgroundColor: colors.bgApp,
  },
  topBarRow: {
    minHeight: layout.topBarTitleRow,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarIconBtn: {
    width: 24,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarTitleOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarTitle: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 18,
    color: colors.textPrimary,
  },
  scroll: {
    flex: 1,
  },
  heroWrap: {
    height: HERO_HEIGHT,
    backgroundColor: colors.chipBg,
  },
  dotsWrap: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  dotsPill: {
    width: 70,
    height: 16,
    borderRadius: 20,
    backgroundColor: colors.textNavInactive,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 10,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  dotActive: {
    backgroundColor: colors.white,
  },
  dotInactive: {
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    gap: 30,
  },
  badgeBlock: {
    gap: 15,
    maxWidth: 338,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badgeUpcoming: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeUpcomingText: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 11,
    color: colors.textOnPrimary,
  },
  badgeRegistered: {
    backgroundColor: colors.accentLime,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeRegisteredText: {
    fontFamily: fontFamilies.notoSansSemiBold,
    fontSize: 11,
    color: colors.textNavInactive,
  },
  titleBlock: {
    gap: 7,
  },
  eventTitle: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 22,
    color: colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexWrap: 'wrap',
  },
  metaText: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    color: colors.textNavInactive,
    flexShrink: 1,
  },
  metaDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textNavInactive,
  },
  section: {
    gap: 30,
  },
  sectionBody: {
    gap: 10,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderOutline,
    width: '100%',
  },
  sectionTitle: {
    fontFamily: fontFamilies.sanchezRegular,
    fontSize: 18,
    color: colors.textPrimary,
  },
  overviewText: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    color: colors.textNavInactive,
    lineHeight: 18,
  },
  organizerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 15,
  },
  organizerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 50,
    backgroundColor: colors.white,
  },
  organizerCopy: {
    flex: 1,
    gap: 11,
  },
  organizerBy: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    color: colors.textNavInactive,
  },
  organizerName: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    color: colors.textNavInactive,
  },
  organizerBio: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    color: colors.textNavInactive,
    lineHeight: 20,
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  visitLink: {
    fontFamily: fontFamilies.notoSansBold,
    fontSize: 14,
    color: colors.primary,
  },
  whatToBringSection: {
    gap: 15,
  },
  bringCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderOutline,
    borderRadius: radius.sm,
    paddingHorizontal: 15,
    paddingVertical: 20,
    gap: 10,
  },
  bringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bringLabel: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 12,
    color: colors.textNavInactive,
    flexShrink: 1,
  },
  locationBody: {
    gap: 20,
  },
  locationHeader: {
    gap: 10,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  addressCopy: {
    flex: 1,
  },
  locationName: {
    fontFamily: fontFamilies.notoSansBold,
    fontSize: 12,
    color: colors.textNavInactive,
  },
  locationAddress: {
    fontFamily: fontFamilies.notoSansBold,
    fontSize: 12,
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
  },
  footerActions: {
    gap: 15,
    alignItems: 'stretch',
  },
  calendarBtn: {
    height: 38,
    minWidth: 164,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: radius.sm,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  calendarLabel: {
    fontFamily: fontFamilies.notoSansRegular,
    fontSize: 14,
    color: colors.textNavInactive,
  },
});
