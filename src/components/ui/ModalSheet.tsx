import { useCallback, useEffect, useRef, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  interpolate,
  ReduceMotion,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { X } from 'lucide-react-native';
import { motionDuration, motionEasing } from '../../lib/motion';
import { colors } from '../../lib/theme/theme';

type ModalSheetProps = PropsWithChildren<{
  visible: boolean;
  title: string;
  onClose: () => void;
  onDismissed?: () => void;
  travelDistance?: number;
  closeTravelDistance?: number;
  closeDuration?: number;
}>;

export function ModalSheet({
  visible,
  title,
  onClose,
  onDismissed,
  travelDistance = 104,
  closeTravelDistance = travelDistance,
  closeDuration = 190,
  children,
}: ModalSheetProps) {
  const [mounted, setMounted] = useState(visible);
  const mountedRef = useRef(visible);
  const visibleRef = useRef(visible);
  const progress = useSharedValue(0);
  const sheetOffset = useSharedValue(travelDistance);
  const displayedTitle = useRef(title);
  const displayedChildren = useRef(children);

  visibleRef.current = visible;

  if (visible) {
    displayedTitle.current = title;
    displayedChildren.current = children;
  }

  const finishClosing = useCallback(() => {
    if (visibleRef.current) {
      return;
    }
    mountedRef.current = false;
    setMounted(false);
    onDismissed?.();
  }, [onDismissed]);

  useEffect(() => {
    if (visible) {
      const wasMounted = mountedRef.current;
      mountedRef.current = true;
      setMounted(true);
      cancelAnimation(progress);
      cancelAnimation(sheetOffset);
      if (!wasMounted) {
        progress.value = 0;
        sheetOffset.value = travelDistance;
      }
      const animationFrame = requestAnimationFrame(() => {
        progress.value = withTiming(1, {
          duration: motionDuration.enter,
          easing: motionEasing.enter,
          reduceMotion: ReduceMotion.System,
        });
        sheetOffset.value = withTiming(0, {
          duration: motionDuration.enter,
          easing: motionEasing.enter,
          reduceMotion: ReduceMotion.System,
        });
      });
      return () => {
        cancelAnimationFrame(animationFrame);
      };
    }

    if (!mountedRef.current) {
      return;
    }

    cancelAnimation(progress);
    cancelAnimation(sheetOffset);
    progress.value = withTiming(0, {
      duration: closeDuration,
      easing: motionEasing.exit,
      reduceMotion: ReduceMotion.System,
    });
    sheetOffset.value = withTiming(
      closeTravelDistance,
      {
        duration: closeDuration,
        easing: motionEasing.exit,
        reduceMotion: ReduceMotion.System,
      },
      (finished) => {
        if (finished) {
          runOnJS(finishClosing)();
        }
      },
    );
  }, [
    closeDuration,
    closeTravelDistance,
    finishClosing,
    progress,
    sheetOffset,
    travelDistance,
    visible,
  ]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.2, 1], [0, 1, 1]),
    transform: [
      {
        translateY: sheetOffset.value,
      },
    ],
  }));

  const shouldRender = visible || mounted;

  if (!shouldRender) {
    return null;
  }

  return (
    <Modal
      visible={shouldRender}
      animationType="none"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}
        />
        <Pressable
          pointerEvents={visible ? 'auto' : 'none'}
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />
        <Animated.View
          accessibilityViewIsModal
          importantForAccessibility="yes"
          pointerEvents={visible ? 'auto' : 'none'}
          style={[styles.sheet, sheetStyle]}
          className="max-h-[88%] rounded-t-[28px] bg-hercules-white px-5 pb-8 pt-4"
        >
          <View className="mb-4 flex-row items-center justify-between gap-3">
            <Text
              accessibilityRole="header"
              numberOfLines={1}
              className="min-w-0 flex-1 text-xl font-extrabold text-hercules-ink"
            >
              {displayedTitle.current}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={8}
              onPress={onClose}
              style={styles.closeButton}
              className="h-11 w-11 shrink-0 items-center justify-center rounded-full bg-hercules-white active:opacity-70"
            >
              <X size={20} color={colors.ink} />
            </Pressable>
          </View>
          {displayedChildren.current}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(10, 45, 127, 0.34)',
  },
  sheet: {
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(10, 45, 127, 0.12)',
    shadowColor: colors.blue,
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 18,
  },
  closeButton: {
    borderWidth: 1,
    borderColor: 'rgba(10, 45, 127, 0.14)',
  },
});
