import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router, usePathname } from 'expo-router';
import type { LucideIcon } from 'lucide-react-native';
import Animated, {
  interpolateColor,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { motionDuration, motionEasing } from '../../lib/motion';
import { colors } from '../../lib/theme/theme';

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

type BottomNavProps = {
  items: NavItem[];
};

export function BottomNav({ items }: BottomNavProps) {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <View
      className="z-50 bg-hercules-white px-4 pt-2"
      style={{ paddingBottom: Math.max(insets.bottom, 12) }}
    >
      <View
        accessibilityRole="tablist"
        className="min-h-[66px] flex-row gap-2 rounded-[28px] border border-hercules-blue/15 bg-hercules-white p-1.5"
        style={styles.dock}
      >
        {items.map((item) => (
          <BottomNavButton
            key={item.href}
            item={item}
            active={pathname === item.href}
          />
        ))}
      </View>
    </View>
  );
}

type BottomNavButtonProps = {
  item: NavItem;
  active: boolean;
};

function BottomNavButton({ item, active }: BottomNavButtonProps) {
  const progress = useSharedValue(active ? 1 : 0);
  const Icon = item.icon;

  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, {
      duration: motionDuration.micro,
      easing: motionEasing.enter,
      reduceMotion: ReduceMotion.System,
    });
  }, [active, progress]);

  const pressScale = useSharedValue(1);

  const activeIconStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const inactiveIconStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
  }));

  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], [colors.ink, colors.white]),
  }));

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const selectionStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ['rgba(206, 33, 39, 0)', colors.red],
    ),
  }));

  const animatePress = (pressed: boolean) => {
    pressScale.value = withTiming(pressed ? 0.96 : 1, {
      duration: pressed ? motionDuration.pressIn : motionDuration.micro,
      easing: pressed ? motionEasing.exit : motionEasing.enter,
      reduceMotion: ReduceMotion.System,
    });
  };

  const navigate = () => {
    if (!active) {
      router.replace(item.href);
    }
  };

  return (
    <Animated.View style={[styles.tabSurface, pressStyle, selectionStyle]}>
      <Pressable
        accessibilityLabel={item.label}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        onPress={navigate}
        onPressIn={() => animatePress(true)}
        onPressOut={() => animatePress(false)}
        className="min-h-[54px] items-center justify-center gap-0.5 rounded-[20px] px-1 active:opacity-85"
      >
        <View className="h-6 w-7 items-center justify-center">
          <Animated.View
            pointerEvents="none"
            className="items-center justify-center"
            style={[StyleSheet.absoluteFill, inactiveIconStyle]}
          >
            <Icon size={22} color={colors.ink} strokeWidth={2.2} />
          </Animated.View>
          <Animated.View
            pointerEvents="none"
            className="items-center justify-center"
            style={[StyleSheet.absoluteFill, activeIconStyle]}
          >
            <Icon size={22} color={colors.white} strokeWidth={2.6} />
          </Animated.View>
        </View>
        <Animated.Text
          className="text-[11px] font-bold leading-3"
          style={labelStyle}
        >
          {item.label}
        </Animated.Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  dock: {
    elevation: 9,
    shadowColor: colors.blue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
  },
  tabSurface: {
    borderRadius: 20,
    flex: 1,
    overflow: 'hidden',
  },
});
