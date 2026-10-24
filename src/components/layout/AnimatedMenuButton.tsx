import { useEffect } from 'react';
import { Pressable } from 'react-native';
import { Menu, X } from 'lucide-react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { headerMotion, headerMotionConfig } from '../../lib/headerMotion';
import { colors } from '../../lib/theme/theme';
import {
  headerControlClassName,
  headerControlHitSlop,
} from './headerControl';

type AnimatedMenuButtonProps = {
  open: boolean;
  onPress: () => void;
};

export function AnimatedMenuButton({ open, onPress }: AnimatedMenuButtonProps) {
  const progress = useSharedValue(open ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(open ? 1 : 0, headerMotion.control);
  }, [open, progress]);

  const menuStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, headerMotionConfig.menuIcon.fadeOutEnd, 1], [1, 0, 0]),
    transform: [
      { scale: interpolate(progress.value, [0, 1], [1, headerMotionConfig.menuIcon.hiddenScale]) },
      { rotateZ: `${interpolate(progress.value, [0, 1], [0, -headerMotionConfig.menuIcon.rotationDegrees])}deg` },
    ],
  }));

  const closeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, headerMotionConfig.menuIcon.fadeInStart, 1], [0, 0, 1]),
    transform: [
      { scale: interpolate(progress.value, [0, 1], [headerMotionConfig.menuIcon.hiddenScale, 1]) },
      { rotateZ: `${interpolate(progress.value, [0, 1], [headerMotionConfig.menuIcon.rotationDegrees, 0])}deg` },
    ],
  }));

  return (
    <Pressable
      accessibilityLabel="Menu"
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      hitSlop={headerControlHitSlop}
      onPress={onPress}
      className={`${headerControlClassName} ${open ? 'bg-hercules-white/10' : ''}`}
    >
      <Animated.View className="absolute" style={menuStyle}>
        <Menu size={23} color={colors.white} strokeWidth={2.3} />
      </Animated.View>
      <Animated.View className="absolute" style={closeStyle}>
        <X size={23} color={colors.white} strokeWidth={2.3} />
      </Animated.View>
    </Pressable>
  );
}
