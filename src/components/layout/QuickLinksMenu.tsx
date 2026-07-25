import { useEffect, useState } from 'react';
import {
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { LucideIcon } from 'lucide-react-native';
import { colors } from '../../lib/theme/theme';

export type QuickLink = {
  label: string;
  href: string;
  icon: LucideIcon;
};

type QuickLinksMenuProps = {
  links: QuickLink[];
  open: boolean;
  topOffset: number;
  onSelect: (href: string) => void;
};

const menuWidth = 256;
const rowHeight = 56;
const rowGap = 3;
const panelPadding = 8;

export function QuickLinksMenu({
  links,
  open,
  topOffset,
  onSelect,
}: QuickLinksMenuProps) {
  const progress = useSharedValue(0);
  const [panelHeight, setPanelHeight] = useState(0);

  const measureLastItem = (event: LayoutChangeEvent) => {
    const { height, y } = event.nativeEvent.layout;
    const measuredHeight = y + height + panelPadding;
    setPanelHeight((height) =>
      Math.abs(height - measuredHeight) > 0.5 ? measuredHeight : height,
    );
  };

  useEffect(() => {
    progress.value = withTiming(open ? 1 : 0, {
      duration: open ? 280 : 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [open, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: interpolate(progress.value, [0, 1], [0, panelHeight]),
    opacity: interpolate(progress.value, [0, 0.08, 1], [0, 1, 1]),
  }));

  return (
    <Animated.View
      pointerEvents={open ? 'auto' : 'none'}
      style={[styles.panel, { top: topOffset }, animatedStyle]}
      className="absolute left-0 z-40 bg-hercules-white shadow-lg"
    >
      <View style={styles.panelContent}>
        {links.map((link, index) => (
          <QuickLinksMenuItem
            key={`${link.label}-${link.href}`}
            index={index}
            link={link}
            progress={progress}
            onSelect={onSelect}
            onLayout={index === links.length - 1 ? measureLastItem : undefined}
          />
        ))}
      </View>
    </Animated.View>
  );
}

type QuickLinksMenuItemProps = {
  index: number;
  link: QuickLink;
  progress: SharedValue<number>;
  onSelect: (href: string) => void;
  onLayout?: (event: LayoutChangeEvent) => void;
};

function QuickLinksMenuItem({
  index,
  link,
  progress,
  onSelect,
  onLayout,
}: QuickLinksMenuItemProps) {
  const Icon = link.icon;

  const itemStyle = useAnimatedStyle(() => {
    const start = Math.min(0.08 + index * 0.04, 0.36);
    return {
      opacity: interpolate(
        progress.value,
        [0, start, 1],
        [0, 0, 1],
        Extrapolation.CLAMP,
      ),
      transform: [
        {
          translateY: interpolate(
            progress.value,
            [start, 1],
            [-8, 0],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  return (
    <Animated.View
      style={[itemStyle, styles.menuItem]}
      onLayout={onLayout}
    >
      <Pressable
        onPress={() => onSelect(link.href)}
        className="h-full flex-row items-center gap-3 rounded-[14px] px-3 active:opacity-70"
      >
        <View className="h-9 w-9 items-center justify-center rounded-full bg-hercules-red">
          <Icon size={18} color={colors.white} />
        </View>
        <Text className="text-sm font-bold text-hercules-ink">{link.label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panel: {
    width: menuWidth,
    overflow: 'hidden',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(10, 45, 127, 0.18)',
    shadowColor: colors.blue,
    shadowOffset: { width: 4, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 18,
  },
  panelContent: {
    gap: rowGap,
    padding: panelPadding,
  },
  menuItem: {
    height: rowHeight,
  },
});
