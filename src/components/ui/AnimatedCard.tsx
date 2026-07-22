import { PropsWithChildren } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';

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
      entering={FadeInDown.delay(index * 55).duration(260)}
      className={className}
    >
      {children}
    </Animated.View>
  );
}
