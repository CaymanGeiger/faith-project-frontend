import type { PropsWithChildren } from 'react';
import Animated from 'react-native-reanimated';
import { cardRevealForIndex } from '../../lib/motion';

type AnimatedCardProps = PropsWithChildren<{
  index?: number;
  className?: string;
  reveal?: boolean;
}>;

export function AnimatedCard({
  index = 0,
  className,
  reveal = true,
  children,
}: AnimatedCardProps) {
  return (
    <Animated.View
      collapsable={false}
      entering={reveal ? cardRevealForIndex(index) : undefined}
      className={className}
    >
      {children}
    </Animated.View>
  );
}
