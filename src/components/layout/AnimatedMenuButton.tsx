import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../lib/theme/theme';

type AnimatedMenuButtonProps = {
  open: boolean;
  onPress: () => void;
};

export function AnimatedMenuButton({ open, onPress }: AnimatedMenuButtonProps) {
  const progress = useSharedValue(open ? 1 : 0);

  useEffect(() => {
    progress.value = open
      ? withSpring(1, { damping: 17, mass: 0.8, stiffness: 210 })
      : withTiming(0, {
          duration: 210,
          easing: Easing.out(Easing.cubic),
        });
  }, [open, progress]);

  const topLineStyle = useAnimatedStyle(() => ({
    width: interpolate(progress.value, [0, 1], [25, 28]),
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [-1, 0]) },
      { translateY: interpolate(progress.value, [0, 1], [-8, 0]) },
      { rotateZ: `${interpolate(progress.value, [0, 1], [0, 45])}deg` },
    ],
  }));

  const middleLineStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.45, 1], [1, 0.25, 0]),
    width: interpolate(progress.value, [0, 1], [15, 6]),
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [5, 0]) },
      { scaleX: interpolate(progress.value, [0, 1], [1, 0.4]) },
    ],
  }));

  const bottomLineStyle = useAnimatedStyle(() => ({
    width: interpolate(progress.value, [0, 1], [25, 28]),
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [-1, 0]) },
      { translateY: interpolate(progress.value, [0, 1], [8, 0]) },
      { rotateZ: `${interpolate(progress.value, [0, 1], [0, -45])}deg` },
    ],
  }));

  const pinStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.75, 1], [1, 0.85, 1]),
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [-10.5, 0]) },
      { scale: interpolate(progress.value, [0, 1], [1, 0.9]) },
    ],
  }));

  return (
    <Pressable
      accessibilityLabel="Menu"
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      onPress={onPress}
      className="h-11 w-11 items-center justify-center rounded-full active:opacity-80"
    >
      <View className="h-7 w-8 items-center justify-center">
        <Animated.View style={[styles.line, topLineStyle]} />
        <Animated.View style={[styles.line, middleLineStyle]} />
        <Animated.View style={[styles.line, bottomLineStyle]} />
        <Animated.View style={[styles.pin, pinStyle]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  line: {
    position: 'absolute',
    height: 3.5,
    borderRadius: 999,
    backgroundColor: colors.white,
  },
  pin: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.blue,
  },
});
