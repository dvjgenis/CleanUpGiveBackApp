import {
  NotoSans_400Regular,
  NotoSans_600SemiBold,
} from '@expo-google-fonts/noto-sans';
import { Sanchez_400Regular } from '@expo-google-fonts/sanchez';
import { useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';

import { AnimatedPressable } from '@/components/motion/AnimatedPressable';
import { useFadeUpEnter, useModalCardEnter } from '@/components/motion/hooks';
import { staggerDelay } from '@/motion';

import { colors as tokens } from '@/constants/tokens';

const C = {
  bgApp: tokens.bgApp,
  primary: tokens.primary,
  textPrimary: tokens.textPrimary,
  textTertiary: tokens.textTertiary,
  textOnPrimary: tokens.textOnPrimary,
} as const;

function PhotoCheckpointCameraIcon({ size = 79 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 79.2342 79.2342" fill="none">
      <Rect width={79.2342} height={79.2342} rx={39.6171} fill={C.primary} />
      <Path
        d="M44.0375 25.0214L47.8533 29.1917H56.298V54.213H22.9362V29.1917H31.3809L35.1967 25.0214H44.0375ZM45.8724 20.8512H33.3618L29.546 25.0214H22.9362C20.6426 25.0214 18.766 26.898 18.766 29.1917V54.213C18.766 56.5066 20.6426 58.3832 22.9362 58.3832H56.298C58.5916 58.3832 60.4682 56.5066 60.4682 54.213V29.1917C60.4682 26.898 58.5916 25.0214 56.298 25.0214H49.6882L45.8724 20.8512ZM39.6171 35.447C43.0575 35.447 45.8724 38.2619 45.8724 41.7023C45.8724 45.1427 43.0575 47.9576 39.6171 47.9576C36.1767 47.9576 33.3618 45.1427 33.3618 41.7023C33.3618 38.2619 36.1767 35.447 39.6171 35.447ZM39.6171 31.2768C33.8622 31.2768 29.1916 35.9474 29.1916 41.7023C29.1916 47.4572 33.8622 52.1279 39.6171 52.1279C45.372 52.1279 50.0427 47.4572 50.0427 41.7023C50.0427 35.9474 45.372 31.2768 39.6171 31.2768Z"
        fill={C.textOnPrimary}
      />
    </Svg>
  );
}

const AUTO_DISMISS_SECONDS = 10 * 60;

function formatDismissCountdown(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** PRD §6.12 · Figma `photo_checkpoint` (364:115). */
export function PhotoCheckpointScreen() {
  const router = useRouter();
  const { cardStyle, scrimStyle } = useModalCardEnter();
  const heroStyle = useFadeUpEnter(0);
  const footerStyle = useFadeUpEnter(staggerDelay(1));
  const [secondsLeft, setSecondsLeft] = useState(AUTO_DISMISS_SECONDS);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          router.back();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [router]);

  const [fontsLoaded] = useFonts({
    Sanchez_400Regular,
    NotoSans_400Regular,
    NotoSans_600SemiBold,
  });

  if (!fontsLoaded) {
    return <View style={s.root} />;
  }

  return (
    <View style={s.root}>
      <Animated.View style={[s.scrim, scrimStyle]} />

      <SafeAreaView style={s.overlay} edges={['top', 'bottom']}>
        <Animated.View style={[s.card, cardStyle]}>
          <View style={s.cardContent}>
            <Animated.View style={[s.heroBlock, heroStyle]}>
              <PhotoCheckpointCameraIcon />
              <Text style={s.title}>Photo required</Text>
            </Animated.View>

            <Animated.View style={[s.footerBlock, footerStyle]}>
              <Text style={s.body}>
                Submit a photo to verify your cleanup progress.{'\n'}
                Check-in required every{' '}
                <Text style={s.bodyEmphasis}>30 minutes.</Text>
              </Text>

              <AnimatedPressable
                style={s.takePhotoBtn}
                onPress={() => router.push('/photo-capture')}
                accessibilityRole="button"
                accessibilityLabel="Take photo"
              >
                <Text style={s.takePhotoBtnText}>Take Photo</Text>
              </AnimatedPressable>

              <AnimatedPressable
                style={s.backToTrackerBtn}
                onPress={() => router.back()}
                accessibilityRole="button"
                accessibilityLabel="Back to tracker"
              >
                <Text style={s.backToTrackerText}>Back to tracker</Text>
              </AnimatedPressable>

              <Text style={s.autoDismissText}>
                Auto-dismissing in {formatDismissCountdown(secondsLeft)}
              </Text>
            </Animated.View>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },

  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },

  overlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },

  card: {
    backgroundColor: C.bgApp,
    borderWidth: 1,
    borderColor: C.primary,
    borderRadius: 16,
    paddingHorizontal: 28,
    paddingVertical: 30,
    alignItems: 'center',
    marginTop: 7,
  },

  cardContent: {
    width: '100%',
    maxWidth: 303,
    gap: 15,
    alignItems: 'center',
  },

  heroBlock: {
    alignItems: 'center',
    gap: 14,
    width: 170,
  },

  title: {
    fontFamily: 'Sanchez_400Regular',
    fontSize: 24,
    color: C.textPrimary,
    textAlign: 'center',
    width: '100%',
  },

  footerBlock: {
    width: '100%',
    gap: 15,
  },

  body: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 12,
    lineHeight: 18,
    color: C.textTertiary,
    textAlign: 'center',
  },

  bodyEmphasis: {
    color: C.textTertiary,
  },

  takePhotoBtn: {
    width: '100%',
    height: 59,
    backgroundColor: C.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },

  takePhotoBtnText: {
    fontFamily: 'NotoSans_600SemiBold',
    fontSize: 16,
    color: C.textOnPrimary,
  },

  backToTrackerBtn: {
    width: '100%',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backToTrackerText: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 14,
    color: C.textTertiary,
  },

  autoDismissText: {
    fontFamily: 'NotoSans_400Regular',
    fontSize: 11,
    color: C.textTertiary,
    textAlign: 'center',
    opacity: 0.6,
  },
});
