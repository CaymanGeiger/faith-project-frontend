import type { PropsWithChildren } from 'react';
import { useEffect, useRef, useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Animated } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { skeletonRevealTiming } from '../../lib/feedbackMotion';
import { motionConfig } from '../../lib/motionConfig';

const motion = motionConfig.feedback;


export const skeletonRevealDelayMs = motion.skeleton.delay;

type SkeletonRevealProps = PropsWithChildren<{
  label?: string;
  className?: string;
  delayMs?: number;
  style?: StyleProp<ViewStyle>;
}>;

export function SkeletonReveal({
  label,
  className,
  delayMs = skeletonRevealDelayMs,
  style,
  children,
}: SkeletonRevealProps) {
  const [visible, setVisible] = useState(delayMs <= 0);
  const opacity = useRef(new Animated.Value(
    delayMs <= 0 ? motion.opacity.visible : motion.opacity.hidden,
  )).current;
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    opacity.stopAnimation();

    if (delayMs <= 0) {
      opacity.setValue(motion.opacity.visible);
      setVisible(true);
      return;
    }

    opacity.setValue(motion.opacity.hidden);
    setVisible(false);
    const timer = setTimeout(() => {
      setVisible(true);
      if (reduceMotion) {
        opacity.setValue(motion.opacity.visible);
        return;
      }

      Animated.timing(opacity, skeletonRevealTiming).start();
    }, delayMs);

    return () => {
      clearTimeout(timer);
      opacity.stopAnimation();
    };
  }, [delayMs, opacity, reduceMotion]);

  return (
    <Animated.View
      accessible={Boolean(label) && visible}
      accessibilityElementsHidden={!visible}
      accessibilityLabel={visible ? label : undefined}
      accessibilityLiveRegion={visible && label ? 'polite' : 'none'}
      accessibilityRole={visible && label ? 'progressbar' : undefined}
      accessibilityState={visible && label ? { busy: true } : undefined}
      importantForAccessibility={
        visible ? (label ? 'yes' : 'auto') : 'no-hide-descendants'
      }
      pointerEvents="none"
      className={className}
      style={[style, { opacity }]}
    >
      {children}
    </Animated.View>
  );
}
