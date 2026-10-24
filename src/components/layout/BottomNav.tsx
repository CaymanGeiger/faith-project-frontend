import { nativeMeasurements, nativeStyles } from '../../lib/theme/nativeStyles';
import { useEffect, useId } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useNavigationContainerRef, usePathname } from 'expo-router';
import { getTabResetAction } from '../../lib/tabHistory';
import type { LucideIcon } from 'lucide-react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { feedbackTiming } from '../../lib/feedbackMotion';
import { motionConfig } from '../../lib/motionConfig';
import { usePressScale } from '../../lib/hooks/usePressScale';
import { colors, shades, surfaces } from '../../lib/theme/theme';

const motion = motionConfig.feedback;


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
      pointerEvents="box-none"
      className="z-50 px-4 pt-2"
      style={[styles.overlay, { paddingBottom: Math.max(insets.bottom, nativeMeasurements.bottomNav.minimumBottomInset) }]}
    >
      <BottomNavBackdrop />
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

function BottomNavBackdrop() {
  const gradientId = useId().replace(/:/g, '');

  return (
    <View
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.tintedBackdrop}
    >
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.white} stopOpacity={0} />
            <Stop offset="0.4" stopColor={colors.white} stopOpacity={0.03} />
            <Stop offset="0.75" stopColor={colors.white} stopOpacity={0.08} />
            <Stop offset="1" stopColor={colors.white} stopOpacity={0.16} />
          </LinearGradient>
          <LinearGradient id={`${gradientId}-tint`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={surfaces.navBackdropTint} stopOpacity={0} />
            <Stop offset="0.4" stopColor={surfaces.navBackdropTint} stopOpacity={0.035} />
            <Stop offset="0.75" stopColor={surfaces.navBackdropTint} stopOpacity={0.12} />
            <Stop offset="1" stopColor={surfaces.navBackdropTint} stopOpacity={0.24} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${gradientId})`} />
        <Rect width="100%" height="100%" fill={`url(#${gradientId}-tint)`} />
      </Svg>
    </View>
  );
}

type BottomNavButtonProps = {
  item: NavItem;
  active: boolean;
};

function BottomNavButton({ item, active }: BottomNavButtonProps) {
  const navigation = useNavigationContainerRef();
  const progress = useSharedValue<number>(
    active ? motion.progress.active : motion.progress.idle,
  );
  const Icon = item.icon;

  useEffect(() => {
    progress.value = withTiming(
      active ? motion.progress.active : motion.progress.idle,
      feedbackTiming.navigation,
    );
  }, [active, progress]);

  const { style: pressStyle, setPressed } = usePressScale(motion.navigation.pressedScale);

  const activeIconStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const inactiveIconStyle = useAnimatedStyle(() => ({
    opacity: motion.opacity.visible - progress.value,
  }));

  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      progress.value,
      [motion.progress.idle, motion.progress.active],
      [colors.ink, colors.white],
    ),
  }));

  const selectionStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [motion.progress.idle, motion.progress.active],
      [shades.transparentRed, colors.red],
    ),
  }));

  const navigate = () => {
    const action = getTabResetAction(navigation.getRootState(), item.href);
    if (action) navigation.dispatch(action);
  };

  return (
    <Animated.View style={[styles.tabSurface, pressStyle, selectionStyle]}>
      <Pressable
        accessibilityLabel={item.label}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        onPress={navigate}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
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

const styles = StyleSheet.create(nativeStyles.bottomNav);
