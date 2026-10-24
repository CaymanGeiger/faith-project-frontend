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
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { feedbackTiming } from '../../lib/feedbackMotion';
import { motionConfig } from '../../lib/motionConfig';
import { usePressScale } from '../../lib/hooks/usePressScale';
import { colors } from '../../lib/theme/theme';
import { componentStyles } from '../../lib/theme/componentStyles';

const motion = motionConfig.feedback;


const styles = componentStyles.button.primary;

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
  const loadingProgress = useSharedValue<number>(
    loading ? motion.progress.active : motion.progress.idle,
  );
  const { style: buttonStyle, setPressed } = usePressScale(motion.button.pressedScale);

  useEffect(() => {
    if (loading) {
      setSpinnerRunning(true);
    }
    loadingProgress.value = withTiming(
      loading ? motion.progress.active : motion.progress.idle,
      feedbackTiming.loading,
    );

    if (loading) {
      return;
    }

    const timer = setTimeout(
      () => setSpinnerRunning(false),
      motion.loading.duration + motion.button.spinnerStopPadding,
    );
    return () => clearTimeout(timer);
  }, [loading, loadingProgress]);

  useEffect(() => {
    if (!disabled && !loading) {
      return;
    }
    setPressed(false);
  }, [disabled, loading, setPressed]);

  const labelStyle = useAnimatedStyle(() => ({
    opacity: motion.opacity.visible - loadingProgress.value,
  }));

  const spinnerStyle = useAnimatedStyle(() => ({
    opacity: loadingProgress.value,
  }));

  return (
    <Animated.View className={styles.wrapper} style={buttonStyle}>
      <Pressable
        accessibilityLabel={label}
        accessibilityRole="button"
        accessibilityState={{
          busy: Boolean(loading),
          disabled: Boolean(disabled || loading),
        }}
        disabled={disabled || loading}
        onPress={onPress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        className={`${styles.container} ${
          shape === 'rounded' ? styles.shape.rounded : styles.shape.pill
        }`}
      >
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, labelStyle]}
        >
          <View className={styles.content}>
            {Icon ? (
              <Icon size={styles.iconSize} color={colors.white} strokeWidth={styles.iconStrokeWidth} />
            ) : null}
            <Text className={componentStyles.button.label}>
              {label}
            </Text>
          </View>
        </Animated.View>
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, spinnerStyle]}
          className={styles.spinner}
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
