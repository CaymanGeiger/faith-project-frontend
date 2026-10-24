import { useCallback } from 'react';
import {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { feedbackTiming } from '../feedbackMotion';
import { motionConfig } from '../motionConfig';
const motion = motionConfig.feedback;

/** Shared button/tab feedback with a configurable pressed size. */
export function usePressScale(pressedScale: number) {
  const scale = useSharedValue<number>(motion.press.restScale);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const setPressed = useCallback((pressed: boolean) => {
    scale.value = withTiming(
      pressed ? pressedScale : motion.press.restScale,
      pressed ? feedbackTiming.pressIn : feedbackTiming.pressOut,
    );
  }, [pressedScale, scale]);

  return { style, setPressed };
}
