import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router, usePathname } from 'expo-router';
import { LucideIcon } from 'lucide-react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
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

  return (
    <View className="absolute bottom-0 left-0 right-0 z-50 border-t border-hercules-blue bg-hercules-white px-3 pb-4 pt-2">
      <View className="flex-row justify-around">
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
    progress.value = withTiming(active ? 1 : 0, { duration: 180 });
  }, [active, progress]);

  const activeIconStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const inactiveIconStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
  }));

  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], [colors.ink, colors.red]),
  }));

  const navigate = () => {
    if (!active) {
      router.replace(item.href);
    }
  };

  return (
    <Pressable
      onPress={navigate}
      className="h-16 w-[72px] items-center justify-center gap-1 rounded-[14px] active:opacity-70"
    >
      <View className="h-7 w-7 items-center justify-center">
        <Animated.View
          pointerEvents="none"
          className="items-center justify-center"
          style={[StyleSheet.absoluteFill, inactiveIconStyle]}
        >
          <Icon size={23} color={colors.ink} strokeWidth={2.2} />
        </Animated.View>
        <Animated.View
          pointerEvents="none"
          className="items-center justify-center"
          style={[StyleSheet.absoluteFill, activeIconStyle]}
        >
          <Icon size={23} color={colors.red} strokeWidth={2.8} />
        </Animated.View>
      </View>
      <Animated.Text className="text-[11px] font-bold" style={labelStyle}>
        {item.label}
      </Animated.Text>
    </Pressable>
  );
}
