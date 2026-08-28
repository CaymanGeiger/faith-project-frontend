import { useEffect } from 'react';
import { Pressable } from 'react-native';
import { Bell, LoaderCircle } from 'lucide-react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { motionDuration, motionEasing } from '../../lib/motion';
import { colors } from '../../lib/theme/theme';
import {
  headerControlClassName,
  headerControlHitSlop,
} from './headerControl';

type AnimatedNotificationButtonProps = {
  loading: boolean;
  open: boolean;
  onPress: () => void;
};

export function AnimatedNotificationButton({
  loading,
  open,
  onPress,
}: AnimatedNotificationButtonProps) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(loading ? 1 : 0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(loading ? 1 : 0, {
      duration: motionDuration.micro,
      easing: motionEasing.enter,
      reduceMotion: ReduceMotion.System,
    });

    if (loading && !reduceMotion) {
      rotation.value = 0;
      rotation.value = withRepeat(
        withTiming(360, {
          duration: 820,
          easing: Easing.linear,
          reduceMotion: ReduceMotion.Never,
        }),
        -1,
        false,
      );
      return;
    }

    cancelAnimation(rotation);
    rotation.value = withTiming(0, {
      duration: motionDuration.micro,
      easing: motionEasing.enter,
      reduceMotion: ReduceMotion.System,
    });
  }, [loading, progress, reduceMotion, rotation]);

  const bellStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5, 1], [1, 0, 0]),
    transform: [
      { scale: interpolate(progress.value, [0, 1], [1, 0.78]) },
      {
        rotateZ: `${interpolate(progress.value, [0, 1], [0, -12])}deg`,
      },
    ],
  }));

  const spinnerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5, 1], [0, 0, 1]),
    transform: [
      { scale: interpolate(progress.value, [0, 1], [0.78, 1]) },
      { rotateZ: `${rotation.value}deg` },
    ],
  }));

  return (
    <Pressable
      accessibilityLabel={loading ? 'Loading notifications' : 'Notifications'}
      accessibilityRole="button"
      accessibilityState={{ busy: loading, expanded: open }}
      hitSlop={headerControlHitSlop}
      onPress={onPress}
      className={`${headerControlClassName} ${
        open || loading ? 'bg-hercules-white/10' : ''
      }`}
    >
      <Animated.View className="absolute" style={bellStyle}>
        <Bell size={22} color={colors.white} strokeWidth={2.4} />
      </Animated.View>
      <Animated.View className="absolute" style={spinnerStyle}>
        <LoaderCircle size={22} color={colors.white} strokeWidth={2.4} />
      </Animated.View>
    </Pressable>
  );
}
