import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { motionDuration, motionEasing } from '../../lib/motion';
import { colors } from '../../lib/theme/theme';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: LucideIcon;
  shape?: 'pill' | 'rounded';
};

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
  icon: Icon,
  shape = 'pill',
}: PrimaryButtonProps) {
  const [spinnerRunning, setSpinnerRunning] = useState(Boolean(loading));
  const loadingProgress = useSharedValue(loading ? 1 : 0);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    if (loading) {
      setSpinnerRunning(true);
    }
    loadingProgress.value = withTiming(loading ? 1 : 0, {
      duration: motionDuration.micro,
      easing: motionEasing.enter,
      reduceMotion: ReduceMotion.System,
    });

    if (loading) {
      return;
    }

    const timer = setTimeout(
      () => setSpinnerRunning(false),
      motionDuration.micro + 20,
    );
    return () => clearTimeout(timer);
  }, [loading, loadingProgress]);

  useEffect(() => {
    if (!disabled && !loading) {
      return;
    }
    pressScale.value = withTiming(1, {
      duration: motionDuration.micro,
      easing: motionEasing.enter,
      reduceMotion: ReduceMotion.System,
    });
  }, [disabled, loading, pressScale]);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: 1 - loadingProgress.value,
  }));

  const spinnerStyle = useAnimatedStyle(() => ({
    opacity: loadingProgress.value,
  }));

  const animatePress = (pressed: boolean) => {
    pressScale.value = withTiming(pressed ? 0.975 : 1, {
      duration: pressed ? motionDuration.pressIn : motionDuration.micro,
      easing: pressed ? motionEasing.exit : motionEasing.enter,
      reduceMotion: ReduceMotion.System,
    });
  };

  return (
    <Animated.View className="w-full" style={buttonStyle}>
      <Pressable
        accessibilityLabel={label}
        accessibilityRole="button"
        accessibilityState={{
          busy: Boolean(loading),
          disabled: Boolean(disabled || loading),
        }}
        disabled={disabled || loading}
        onPress={onPress}
        onPressIn={() => animatePress(true)}
        onPressOut={() => animatePress(false)}
        className={`h-14 items-center justify-center overflow-hidden bg-hercules-red px-5 active:opacity-90 disabled:opacity-50 ${
          shape === 'rounded' ? 'rounded-[16px]' : 'rounded-pill'
        }`}
      >
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, labelStyle]}
        >
          <View className="flex-1 flex-row items-center justify-center gap-2">
            {Icon ? (
              <Icon size={18} color={colors.white} strokeWidth={2.4} />
            ) : null}
            <Text className="text-center text-base font-bold text-hercules-white">
              {label}
            </Text>
          </View>
        </Animated.View>
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, spinnerStyle]}
          className="items-center justify-center"
        >
          <ActivityIndicator
            animating={spinnerRunning}
            color={colors.white}
          />
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}
