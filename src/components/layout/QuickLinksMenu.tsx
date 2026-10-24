import { nativeStyles, nativeMeasurements } from '../../lib/theme/nativeStyles';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  cancelAnimation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import type { LucideIcon } from 'lucide-react-native';
import { headerMotion, headerMotionConfig } from '../../lib/headerMotion';
import { colors } from '../../lib/theme/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  headerContent?: ReactNode;
};

const menuWidth = nativeMeasurements.quickLinks.width;

export function QuickLinksMenu({
  links,
  open,
  topOffset,
  onSelect,
  headerContent,
}: QuickLinksMenuProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const android = Platform.OS === 'android';
  const scrollable = android || Boolean(headerContent);
  const MenuContent = scrollable ? ScrollView : View;
  const [contentMounted, setContentMounted] = useState(open);
  const openRef = useRef(open);
  const revision = useRef(0);
  const progress = useSharedValue(0);
  openRef.current = open;

  const finishClosing = useCallback((closingRevision: number) => {
    if (!openRef.current && revision.current === closingRevision) {
      setContentMounted(false);
    }
  }, []);

  useEffect(() => {
    const currentRevision = ++revision.current;
    if (open) setContentMounted(true);
    progress.value = withTiming(
      open ? 1 : 0,
      open ? headerMotion.quickLinksEnter : headerMotion.quickLinksExit,
      (finished) => {
        if (finished && !open) runOnJS(finishClosing)(currentRevision);
      },
    );

    return () => {
      ++revision.current;
      cancelAnimation(progress);
    };
  }, [open, progress, finishClosing]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { scale: interpolate(progress.value, [0, 1], [headerMotionConfig.quickLinks.initialScale, 1]) },
    ],
  }));

  return (
    <Animated.View
      pointerEvents={open ? 'auto' : 'none'}
      accessibilityElementsHidden={!open}
      importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}
      style={[
        floatingPanelStyles.shell,
        styles.panel,
        { top: topOffset + 12 },
        android ? { left: insets.left + 16, width: Math.min(menuWidth, width - insets.left - insets.right - 32) } : undefined,
        animatedStyle,
      ]}
      className="absolute z-40"
    >
      <View style={floatingPanelStyles.surface}>
        <MenuContent
          style={scrollable ? { maxHeight: Math.max(0, height - topOffset - insets.bottom - 28) } : styles.panelContent}
          contentContainerStyle={scrollable ? styles.panelContent : undefined}
        >
          {open || contentMounted ? headerContent : null}
          {links.map((link) => (
            <QuickLinksMenuItem
              key={`${link.label}-${link.href}`}
              link={link}
              onSelect={onSelect}
            />
          ))}
        </MenuContent>
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

const styles = StyleSheet.create(nativeStyles.quickLinks);
