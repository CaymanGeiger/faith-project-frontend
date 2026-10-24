import type { PropsWithChildren } from 'react';
import Animated from 'react-native-reanimated';
import { cardRevealForIndex } from '../../lib/motion';

type AnimatedCardProps = PropsWithChildren<{
  index?: number;
  className?: string;
}>;

export function AnimatedCard({
  index = 0,
  className,
  children,
}: AnimatedCardProps) {
  return (
    <Animated.View
      collapsable={false}
      entering={cardRevealForIndex(index)}
      className={className}
    >
      {children}
    </Animated.View>
  );
}
