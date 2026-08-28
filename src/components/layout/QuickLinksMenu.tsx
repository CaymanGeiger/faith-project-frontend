import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolate,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import type { LucideIcon } from 'lucide-react-native';
import { motionDuration, motionEasing } from '../../lib/motion';
import { colors } from '../../lib/theme/theme';
import { floatingPanelStyles } from './floatingPanel';

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

const menuWidth = 280;
const rowGap = 8;
const panelPadding = 8;

export function QuickLinksMenu({
  links,
  open,
  topOffset,
  onSelect,
}: QuickLinksMenuProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(open ? 1 : 0, {
      duration: open ? motionDuration.subtleEnter : 140,
      easing: open ? motionEasing.enter : motionEasing.exit,
      reduceMotion: ReduceMotion.System,
    });
  }, [open, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { scale: interpolate(progress.value, [0, 1], [0.98, 1]) },
    ],
  }));

  return (
    <Animated.View
      pointerEvents={open ? 'auto' : 'none'}
      style={[
        floatingPanelStyles.shell,
        styles.panel,
        { top: topOffset + 12 },
        animatedStyle,
      ]}
      className="absolute z-40"
    >
      <View style={floatingPanelStyles.surface}>
        <View style={styles.panelContent}>
          {links.map((link) => (
            <QuickLinksMenuItem
              key={`${link.label}-${link.href}`}
              link={link}
              onSelect={onSelect}
            />
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

type QuickLinksMenuItemProps = {
  link: QuickLink;
  onSelect: (href: string) => void;
};

function QuickLinksMenuItem({
  link,
  onSelect,
}: QuickLinksMenuItemProps) {
  const Icon = link.icon;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${link.label}`}
      onPress={() => onSelect(link.href)}
      className="min-h-[56px] flex-row items-center gap-3 rounded-[20px] px-3 active:bg-hercules-blue/5 active:opacity-100"
    >
      <View className="h-10 w-10 items-center justify-center rounded-[14px] bg-hercules-red">
        <Icon size={19} color={colors.white} strokeWidth={2.3} />
      </View>
      <Text className="text-[15px] font-bold text-hercules-ink">{link.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    width: menuWidth,
    left: 16,
  },
  panelContent: {
    gap: rowGap,
    padding: panelPadding,
  },
});
