import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../lib/theme/theme';
import { BrandImage } from './BrandImage';

type BrandLaunchScreenProps = {
  leaving?: boolean;
};

export const brandLaunchExitDuration = 320;

export function BrandLaunchScreen({
  leaving = false,
}: BrandLaunchScreenProps) {
  const reduceMotion = useReducedMotion();
  const intro = useSharedValue(0);
  const accent = useSharedValue(0);
  const pulse = useSharedValue(0);
  const exit = useSharedValue(0);

  useEffect(() => {
    const introDuration = reduceMotion ? 1 : 744;
    const accentDuration = reduceMotion ? 1 : 528;

    intro.value = withTiming(1, {
      duration: introDuration,
      easing: Easing.out(Easing.cubic),
    });
    accent.value = withDelay(
      reduceMotion ? 0 : 300,
      withTiming(1, {
        duration: accentDuration,
        easing: Easing.out(Easing.cubic),
      }),
    );

    if (reduceMotion) {
      pulse.value = 0.5;
    } else {
      pulse.value = withDelay(
        760,
        withRepeat(
          withSequence(
            withTiming(1, {
              duration: 820,
              easing: Easing.inOut(Easing.cubic),
            }),
            withTiming(0, {
              duration: 820,
              easing: Easing.inOut(Easing.cubic),
            }),
          ),
          -1,
          false,
        ),
      );
    }

    return () => {
      cancelAnimation(intro);
      cancelAnimation(accent);
      cancelAnimation(pulse);
    };
  }, [accent, intro, pulse, reduceMotion]);

  useEffect(() => {
    exit.value = withTiming(leaving ? 1 : 0, {
      duration: reduceMotion ? 1 : brandLaunchExitDuration,
      easing: Easing.inOut(Easing.cubic),
    });
  }, [exit, leaving, reduceMotion]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: 1 - exit.value,
    transform: [{ translateY: -5 * exit.value }],
  }));

  const logoStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -27 * intro.value },
      { scale: 1 - 0.02 * intro.value },
    ],
  }));

  const detailsStyle = useAnimatedStyle(() => ({
    opacity: accent.value,
    transform: [{ translateY: 8 * (1 - accent.value) }],
  }));

  const redAccentStyle = useAnimatedStyle(() => ({
    opacity: 0.62 + 0.38 * pulse.value,
    transform: [{ scaleX: accent.value }],
  }));

  const blueAccentStyle = useAnimatedStyle(() => ({
    opacity: 1 - 0.28 * pulse.value,
    transform: [{ scaleX: accent.value }],
  }));

  return (
    <Animated.View
      accessibilityLabel="Opening Hercules Honors"
      accessibilityRole="progressbar"
      pointerEvents="auto"
      style={[styles.overlay, overlayStyle]}
    >
      <StatusBar
        animated
        backgroundColor={colors.white}
        style="dark"
      />

      <View style={styles.stage}>
        <Animated.View style={[styles.logoFrame, logoStyle]}>
          <BrandImage
            asset="logoHeader"
            accessibilityIgnoresInvertColors
            style={styles.logo}
          />
        </Animated.View>

        <Animated.View style={[styles.details, detailsStyle]}>
          <Text style={styles.title}>HERCULES HONORS</Text>
          <Text style={styles.subtitle}>REWARDS · TRAINING · SUPPORT</Text>

          <View style={styles.accentRow}>
            <Animated.View
              style={[styles.accent, styles.redAccent, redAccentStyle]}
            />
            <Animated.View
              style={[styles.accent, styles.blueAccent, blueAccentStyle]}
            />
          </View>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: colors.white,
    justifyContent: 'center',
    zIndex: 1000,
  },
  stage: {
    height: 172,
    position: 'relative',
    width: 312,
  },
  logoFrame: {
    height: 67,
    left: 30,
    position: 'absolute',
    top: 52.5,
    width: 252,
  },
  logo: {
    height: '100%',
    width: '100%',
  },
  details: {
    alignItems: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 106,
  },
  title: {
    color: colors.blue,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 2.15,
    lineHeight: 20,
  },
  subtitle: {
    color: colors.red,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1.05,
    lineHeight: 15,
    marginTop: 1,
  },
  accentRow: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 12,
  },
  accent: {
    borderRadius: 999,
    height: 3,
    width: 54,
  },
  redAccent: {
    backgroundColor: colors.red,
  },
  blueAccent: {
    backgroundColor: colors.blue,
  },
});
