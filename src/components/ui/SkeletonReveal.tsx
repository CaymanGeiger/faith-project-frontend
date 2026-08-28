import type { PropsWithChildren } from 'react';
import { useEffect, useRef, useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Animated } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { motionDuration } from '../../lib/motion';

export const skeletonRevealDelayMs = 500;

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
  const opacity = useRef(new Animated.Value(delayMs <= 0 ? 1 : 0)).current;
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    opacity.stopAnimation();

    if (delayMs <= 0) {
      opacity.setValue(1);
      setVisible(true);
      return;
    }

    opacity.setValue(0);
    setVisible(false);
    const timer = setTimeout(() => {
      setVisible(true);
      if (reduceMotion) {
        opacity.setValue(1);
        return;
      }

      Animated.timing(opacity, {
        toValue: 1,
        duration: motionDuration.exit,
        useNativeDriver: true,
      }).start();
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
