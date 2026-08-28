import type { PropsWithChildren, ReactNode } from 'react';
import { useRef } from 'react';
import { Platform } from 'react-native';
import Animated from 'react-native-reanimated';
import {
  asyncContentExitMotion,
  asyncContentRevealMotion,
  asyncFallbackRevealMotion,
  standardLayoutTransition,
} from '../../lib/motion';

type AsyncContentProps = PropsWithChildren<{
  ready: boolean;
  fallback: ReactNode;
  className?: string;
}>;

export function AsyncContent({
  ready,
  fallback,
  className,
  children,
}: AsyncContentProps) {
  const readyAtMount = useRef(ready).current;

  const animate = Platform.OS !== 'web';

  return (
    <Animated.View
      collapsable={false}
      layout={animate ? standardLayoutTransition : undefined}
    >
      {ready ? (
        <Animated.View
          key="async-content"
          collapsable={false}
          entering={
            !animate || readyAtMount ? undefined : asyncContentRevealMotion
          }
          exiting={animate ? asyncContentExitMotion : undefined}
          className={className}
        >
          {children}
        </Animated.View>
      ) : (
        <Animated.View
          key="async-fallback"
          collapsable={false}
          entering={animate ? asyncFallbackRevealMotion : undefined}
          exiting={animate ? asyncContentExitMotion : undefined}
        >
          {fallback}
        </Animated.View>
      )}
    </Animated.View>
  );
}
