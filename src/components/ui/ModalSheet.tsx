import { PropsWithChildren, useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { X } from 'lucide-react-native';
import { colors } from '../../lib/theme/theme';

type ModalSheetProps = PropsWithChildren<{
  visible: boolean;
  title: string;
  onClose: () => void;
  onDismissed?: () => void;
}>;

export function ModalSheet({
  visible,
  title,
  onClose,
  onDismissed,
  children,
}: ModalSheetProps) {
  const [mounted, setMounted] = useState(visible);
  const progress = useSharedValue(visible ? 1 : 0);
  const displayedTitle = useRef(title);

  if (visible) {
    displayedTitle.current = title;
  }

  const finishClosing = useCallback(() => {
    setMounted(false);
    onDismissed?.();
  }, [onDismissed]);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      progress.value = 0;
      progress.value = withTiming(1, {
        duration: 260,
        easing: Easing.out(Easing.cubic),
      });
      return;
    }

    progress.value = withTiming(
      0,
      {
        duration: 190,
        easing: Easing.in(Easing.cubic),
      },
      (finished) => {
        if (finished) {
          runOnJS(finishClosing)();
        }
      },
    );
  }, [finishClosing, progress, visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.2, 1], [0, 1, 1]),
    transform: [
      {
        translateY: interpolate(progress.value, [0, 1], [104, 0]),
      },
    ],
  }));

  if (!mounted) {
    return null;
  }

  return (
    <Modal visible={mounted} animationType="none" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}
        />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          style={[styles.sheet, sheetStyle]}
          className="max-h-[88%] rounded-t-[28px] bg-hercules-white px-5 pb-8 pt-4"
        >
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-xl font-extrabold text-hercules-ink">
              {displayedTitle.current}
            </Text>
            <Pressable
              accessibilityLabel="Close"
              onPress={onClose}
              style={styles.closeButton}
              className="h-10 w-10 items-center justify-center rounded-full bg-hercules-white"
            >
              <X size={20} color={colors.ink} />
            </Pressable>
          </View>
          {children}
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
