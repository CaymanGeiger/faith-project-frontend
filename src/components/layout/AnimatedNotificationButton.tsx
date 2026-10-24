import { useEffect } from 'react';
import { Pressable } from 'react-native';
import { Bell, LoaderCircle } from 'lucide-react-native';
import Animated, {
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { headerMotion, headerMotionConfig } from '../../lib/headerMotion';
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
    progress.value = withTiming(loading ? 1 : 0, headerMotion.control);

    if (loading && !reduceMotion) {
      rotation.value = 0;
      rotation.value = withRepeat(
        withTiming(headerMotionConfig.spinner.rotationDegrees, headerMotion.spinner),
        headerMotionConfig.spinner.repeatCount,
        headerMotionConfig.spinner.reverse,
      );
      return () => cancelAnimation(rotation);
    }

    cancelAnimation(rotation);
    rotation.value = withTiming(0, headerMotion.control);

    return () => cancelAnimation(rotation);
  }, [loading, progress, reduceMotion, rotation]);

  const bellStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, headerMotionConfig.notificationIcon.crossfadeAt, 1], [1, 0, 0]),
    transform: [
      { scale: interpolate(progress.value, [0, 1], [1, headerMotionConfig.notificationIcon.hiddenScale]) },
      {
        rotateZ: `${interpolate(progress.value, [0, 1], [0, -headerMotionConfig.notificationIcon.rotationDegrees])}deg`,
      },
    ],
  }));

  const spinnerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, headerMotionConfig.notificationIcon.crossfadeAt, 1], [0, 0, 1]),
    transform: [
      { scale: interpolate(progress.value, [0, 1], [headerMotionConfig.notificationIcon.hiddenScale, 1]) },
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
