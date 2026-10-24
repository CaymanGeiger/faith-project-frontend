import { nativeStyles } from '../../lib/theme/nativeStyles';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { brandLaunchTiming } from '../../lib/feedbackMotion';
import { motionConfig } from '../../lib/motionConfig';
import { BrandImage } from './BrandImage';

const motion = motionConfig.feedback;


type BrandLaunchScreenProps = {
  leaving?: boolean;
};

export const brandLaunchExitDuration = motion.launch.exit.duration;

export function BrandLaunchScreen({
  leaving = false,
}: BrandLaunchScreenProps) {
  const reduceMotion = useReducedMotion();
  const intro = useSharedValue<number>(motion.progress.idle);
  const accent = useSharedValue<number>(motion.progress.idle);
  const pulse = useSharedValue<number>(motion.progress.idle);
  const exit = useSharedValue<number>(motion.progress.idle);

  useEffect(() => {
    const timing = brandLaunchTiming(reduceMotion);

    intro.value = withTiming(motion.progress.active, timing.intro);
    accent.value = withDelay(
      reduceMotion ? motion.launch.reducedDelay : motion.launch.accent.delay,
      withTiming(motion.progress.active, timing.accent),
    );

    if (reduceMotion) {
      pulse.value = motion.launch.pulse.reducedValue;
    } else {
      pulse.value = withDelay(
        motion.launch.pulse.delay,
        withRepeat(
          withSequence(
            withTiming(motion.progress.active, timing.pulse),
            withTiming(motion.progress.idle, timing.pulse),
          ),
          motion.launch.pulse.repeatCount,
          motion.launch.pulse.reverse,
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
    exit.value = withTiming(
      leaving ? motion.progress.active : motion.progress.idle,
      brandLaunchTiming(reduceMotion).exit,
    );
  }, [exit, leaving, reduceMotion]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: motion.opacity.visible - exit.value,
    transform: [{ translateY: motion.launch.exit.translateY * exit.value }],
  }));

  const logoStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: motion.launch.logo.translateY * intro.value },
      {
        scale: motion.launch.logo.initialScale -
          (motion.launch.logo.initialScale - motion.launch.logo.finalScale) * intro.value,
      },
    ],
  }));

  const detailsStyle = useAnimatedStyle(() => ({
    opacity: accent.value,
    transform: [{
      translateY: motion.launch.details.translateY * (motion.progress.active - accent.value),
    }],
  }));

  const redAccentStyle = useAnimatedStyle(() => ({
    opacity: motion.launch.redAccent.minOpacity +
      (motion.launch.redAccent.maxOpacity - motion.launch.redAccent.minOpacity) * pulse.value,
    transform: [{ scaleX: accent.value }],
  }));

  const blueAccentStyle = useAnimatedStyle(() => ({
    opacity: motion.launch.blueAccent.maxOpacity -
      (motion.launch.blueAccent.maxOpacity - motion.launch.blueAccent.minOpacity) * pulse.value,
    transform: [{ scaleX: accent.value }],
  }));

  return (
    <Animated.View
      accessibilityLabel="Opening Hercules Honors"
      accessibilityRole="progressbar"
      pointerEvents="auto"
      style={[styles.overlay, overlayStyle]}
    >
      <StatusBar animated={motion.launch.statusBarAnimated} style="dark" />

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

const styles = StyleSheet.create(nativeStyles.brandLaunch);
